/**
 * BABIRYE v10.0.0 — WebSocket Client Singleton
 *
 * Provides a robust, singleton WebSocket connection to the BABIRYE
 * notification service with automatic reconnection using exponential
 * backoff, event handler registration, and clean lifecycle management.
 *
 * Connection routes through the Caddy gateway via `?XTransformPort=3003`.
 */

'use client';

// ============================================================================
// Types
// ============================================================================

/** Discriminated union for all WebSocket message types the client handles. */
export interface WSMessage {
  /** The event type discriminator. */
  type: WSEventType;
  /** Structured payload for the event. */
  payload: Record<string, unknown>;
  /** ISO-8601 timestamp from the server. */
  timestamp: string;
  /** Optional correlation ID for request/response linking. */
  correlationId?: string;
}

/** All recognized WebSocket event types. */
export type WSEventType =
  | 'task:update'
  | 'task:created'
  | 'task:completed'
  | 'task:failed'
  | 'alert:new'
  | 'alert:update'
  | 'alert:escalated'
  | 'sensor:reading'
  | 'sensor:anomaly'
  | 'agent:status'
  | 'vip:sos'
  | 'vip:location'
  | 'wall:block'
  | 'wall:status'
  | 'system:notification'
  | 'system:health'
  | 'council:vote'
  | 'council:decision'
  | 'intel:update'
  | 'ping'
  | 'pong'
  | 'error'
  | 'welcome';

/** Handler function type for incoming messages. */
export type WSMessageHandler = (data: WSMessage) => void;

/** Handler function type for connection lifecycle events. */
export type WSLifecycleHandler = () => void;

/** Configuration options for the WebSocket client. */
export interface WSClientConfig {
  /** WebSocket service port (default 3003). */
  port?: number;
  /** Initial reconnection delay in ms (default 1000). */
  initialRetryDelay?: number;
  /** Maximum reconnection delay in ms (default 30000). */
  maxRetryDelay?: number;
  /** Multiplier for exponential backoff (default 2). */
  retryMultiplier?: number;
  /** Maximum number of reconnection attempts before giving up. */
  maxRetries?: number;
  /** Heartbeat/ping interval in ms (default 30000). */
  heartbeatIntervalMs?: number;
  /** Connection timeout in ms (default 10000). */
  connectionTimeoutMs?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PORT = 3003;
const DEFAULT_INITIAL_RETRY_DELAY = 1000;
const DEFAULT_MAX_RETRY_DELAY = 30000;
const DEFAULT_RETRY_MULTIPLIER = 2;
const DEFAULT_MAX_RETRIES = Infinity; // Retry forever by default
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000;
const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;

const WS_URL_TEMPLATE = '/?XTransformPort={port}';

// ============================================================================
// Internal State
// ============================================================================

let wsInstance: WebSocket | null = null;
let isConnectedFlag = false;
let isConnectingFlag = false;
let isDestroyed = false;

const messageHandlers = new Set<WSMessageHandler>();
const connectHandlers = new Set<WSLifecycleHandler>();
const disconnectHandlers = new Set<WSLifecycleHandler>();

let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectEnabled = true;

const config: Required<WSClientConfig> = {
  port: DEFAULT_PORT,
  initialRetryDelay: DEFAULT_INITIAL_RETRY_DELAY,
  maxRetryDelay: DEFAULT_MAX_RETRY_DELAY,
  retryMultiplier: DEFAULT_RETRY_MULTIPLIER,
  maxRetries: DEFAULT_MAX_RETRIES,
  heartbeatIntervalMs: DEFAULT_HEARTBEAT_INTERVAL_MS,
  connectionTimeoutMs: DEFAULT_CONNECTION_TIMEOUT_MS,
};

// ============================================================================
// Connection URL Builder
// ============================================================================

/**
 * Build the WebSocket connection URL using the Caddy gateway pattern.
 * The URL is always relative and uses the `XTransformPort` query parameter.
 */
function buildConnectionUrl(): string {
  return WS_URL_TEMPLATE.replace('{port}', String(config.port));
}

// ============================================================================
// Reconnection Backoff
// ============================================================================

/**
 * Calculate the next reconnection delay using exponential backoff.
 * Sequence: 1s, 2s, 4s, 8s, 16s, 30s (capped at max).
 */
function calculateRetryDelay(): number {
  const delay = config.initialRetryDelay * Math.pow(config.retryMultiplier, retryCount);
  return Math.min(delay, config.maxRetryDelay);
}

// ============================================================================
// Heartbeat
// ============================================================================

/** Start the heartbeat/ping interval. */
function startHeartbeat(): void {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (wsInstance && isConnectedFlag) {
      try {
        wsInstance.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
      } catch {
        // Heartbeat failed — the connection is likely dead
        handleUnexpectedDisconnect();
      }
    }
  }, config.heartbeatIntervalMs);
}

/** Stop the heartbeat interval. */
function stopHeartbeat(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ============================================================================
// Connection Timeout
// ============================================================================

/** Start the connection timeout watchdog. */
function startConnectionTimeout(): void {
  stopConnectionTimeout();
  connectionTimeoutTimer = setTimeout(() => {
    if (isConnectingFlag && !isConnectedFlag) {
      // Connection timed out — close and retry
      if (wsInstance) {
        wsInstance.close(4000, 'Connection timeout');
      }
      handleUnexpectedDisconnect();
    }
  }, config.connectionTimeoutMs);
}

/** Stop the connection timeout. */
function stopConnectionTimeout(): void {
  if (connectionTimeoutTimer !== null) {
    clearTimeout(connectionTimeoutTimer);
    connectionTimeoutTimer = null;
  }
}

// ============================================================================
// Message Dispatching
// ============================================================================

/** Parse and dispatch an incoming WebSocket message to all registered handlers. */
function dispatchMessage(event: MessageEvent): void {
  try {
    const raw = typeof event.data === 'string' ? event.data : '';
    const message: WSMessage = JSON.parse(raw);

    // Handle pong responses silently
    if (message.type === 'pong') {
      return;
    }

    // Handle server-side errors
    if (message.type === 'error') {
      console.error('[WS] Server error:', message.payload);
      return;
    }

    // Dispatch to all registered handlers
    for (const handler of messageHandlers) {
      try {
        handler(message);
      } catch (handlerError) {
        console.error('[WS] Handler error:', handlerError);
      }
    }
  } catch (parseError) {
    console.warn('[WS] Failed to parse message:', parseError);
  }
}

// ============================================================================
// Connection Lifecycle
// ============================================================================

/** Notify all connect handlers. */
function notifyConnected(): void {
  isConnectedFlag = true;
  isConnectingFlag = false;
  retryCount = 0;
  stopConnectionTimeout();
  startHeartbeat();

  for (const handler of connectHandlers) {
    try {
      handler();
    } catch (error) {
      console.error('[WS] Connect handler error:', error);
    }
  }
}

/** Notify all disconnect handlers and optionally schedule reconnection. */
function notifyDisconnected(code?: number, reason?: string): void {
  const wasConnected = isConnectedFlag;
  isConnectedFlag = false;
  isConnectingFlag = false;
  stopHeartbeat();
  stopConnectionTimeout();

  for (const handler of disconnectHandlers) {
    try {
      handler();
    } catch (error) {
      console.error('[WS] Disconnect handler error:', error);
    }
  }

  // Only attempt reconnection if the client was previously connected
  // and reconnection is enabled and the client hasn't been destroyed
  if (wasConnected && reconnectEnabled && !isDestroyed) {
    scheduleReconnect(code, reason);
  }
}

/** Handle unexpected disconnection (network error, timeout, etc.). */
function handleUnexpectedDisconnect(): void {
  isConnectedFlag = false;
  isConnectingFlag = false;
  wsInstance = null;
  stopHeartbeat();
  stopConnectionTimeout();

  for (const handler of disconnectHandlers) {
    try {
      handler();
    } catch (error) {
      console.error('[WS] Disconnect handler error:', error);
    }
  }

  if (reconnectEnabled && !isDestroyed) {
    scheduleReconnect(1006, 'Abnormal closure');
  }
}

/** Schedule a reconnection attempt with exponential backoff. */
function scheduleReconnect(code?: number, reason?: string): void {
  if (retryCount >= config.maxRetries) {
    console.error(
      `[WS] Max retries (${config.maxRetries}) exceeded. Code: ${code}, Reason: ${reason}`
    );
    return;
  }

  const delay = calculateRetryDelay();
  retryCount += 1;

  if (process.env.NODE_ENV === 'development') {
    console.debug(
      `[WS] Reconnecting in ${delay}ms (attempt ${retryCount}). Code: ${code}, Reason: ${reason}`
    );
  }

  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectInternal();
  }, delay);
}

// ============================================================================
// Internal Connect
// ============================================================================

/** Internal connection logic — creates WebSocket and attaches handlers. */
function connectInternal(): void {
  if (isDestroyed) return;
  if (isConnectingFlag) return;
  if (isConnectedFlag) return;

  isConnectingFlag = true;

  // Determine protocol
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? 'wss:'
    : 'ws:';

  const url = `${protocol}//${window.location.host}${buildConnectionUrl()}`;

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[WS] Connecting to ${buildConnectionUrl()}...`);
  }

  try {
    wsInstance = new WebSocket(url);

    wsInstance.onopen = () => {
      notifyConnected();
    };

    wsInstance.onmessage = (event: MessageEvent) => {
      dispatchMessage(event);
    };

    wsInstance.onclose = (event: CloseEvent) => {
      wsInstance = null;
      notifyDisconnected(event.code, event.reason);
    };

    wsInstance.onerror = () => {
      // onerror fires before onclose, so we let onclose handle the cleanup
      // but we log the error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug('[WS] Connection error occurred');
      }
    };

    // Start connection timeout watchdog
    startConnectionTimeout();
  } catch (error) {
    isConnectingFlag = false;
    console.error('[WS] Failed to create WebSocket:', error);
    handleUnexpectedDisconnect();
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Connect to the WebSocket notification service.
 * If already connected or connecting, this is a no-op.
 * Reconnection is automatically enabled on connect.
 */
export async function connectWS(): Promise<void> {
  if (isConnectedFlag || isConnectingFlag) return;

  isDestroyed = false;
  reconnectEnabled = true;

  return new Promise<void>((resolve, reject) => {
    // Set up a one-time connect handler to resolve the promise
    const onConnect = () => {
      connectHandlers.delete(onConnect);
      resolve();
    };

    // Set up a one-time disconnect handler to reject on failure
    const onDisconnect = () => {
      disconnectHandlers.delete(onDisconnect);
      if (!isConnectedFlag && isConnectingFlag === false) {
        reject(new Error('WebSocket connection failed'));
      }
    };

    connectHandlers.add(onConnect);
    disconnectHandlers.add(onDisconnect);

    // Start connecting
    connectInternal();

    // Timeout for the initial connection promise
    setTimeout(() => {
      connectHandlers.delete(onConnect);
      disconnectHandlers.delete(onDisconnect);
      if (!isConnectedFlag) {
        reject(new Error('WebSocket connection timed out'));
      }
    }, config.connectionTimeoutMs + 2000);
  });
}

/**
 * Disconnect from the WebSocket service cleanly.
 * Disables automatic reconnection and clears all timers.
 */
export function disconnectWS(): void {
  reconnectEnabled = false;

  // Clear pending reconnection timer
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  stopHeartbeat();
  stopConnectionTimeout();

  // Close the WebSocket if it exists
  if (wsInstance) {
    try {
      wsInstance.close(1000, 'Client disconnect');
    } catch {
      // Ignore close errors
    }
    wsInstance = null;
  }

  isConnectedFlag = false;
  isConnectingFlag = false;
  retryCount = 0;
}

/**
 * Register a handler for incoming WebSocket messages.
 * Returns an unsubscribe function.
 *
 * @param handler - Function called with each parsed WSMessage.
 */
export function onMessage(handler: WSMessageHandler): () => void {
  messageHandlers.add(handler);
  return () => {
    messageHandlers.delete(handler);
  };
}

/**
 * Register a handler for WebSocket connection events.
 * Returns an unsubscribe function.
 *
 * @param handler - Function called when the WebSocket connects successfully.
 */
export function onConnect(handler: WSLifecycleHandler): () => void {
  connectHandlers.add(handler);
  return () => {
    connectHandlers.delete(handler);
  };
}

/**
 * Register a handler for WebSocket disconnection events.
 * Returns an unsubscribe function.
 *
 * @param handler - Function called when the WebSocket disconnects.
 */
export function onDisconnect(handler: WSLifecycleHandler): () => void {
  disconnectHandlers.add(handler);
  return () => {
    disconnectHandlers.delete(handler);
  };
}

/**
 * Send a message to the WebSocket server.
 * No-op if not connected.
 *
 * @param message - The message object to send (will be JSON-serialized).
 */
export function sendWS(message: Record<string, unknown>): void {
  if (!wsInstance || !isConnectedFlag) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WS] Cannot send — not connected');
    }
    return;
  }

  try {
    const payload = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString(),
    });
    wsInstance.send(payload);
  } catch (error) {
    console.error('[WS] Send error:', error);
    handleUnexpectedDisconnect();
  }
}

/**
 * Check if the WebSocket is currently connected.
 * @returns `true` if the connection is open and ready.
 */
export function isConnected(): boolean {
  return isConnectedFlag && wsInstance !== null && wsInstance.readyState === WebSocket.OPEN;
}

/**
 * Check if the WebSocket is currently in the process of connecting.
 * @returns `true` if a connection attempt is in progress.
 */
export function isConnecting(): boolean {
  return isConnectingFlag;
}

/**
 * Get the current reconnection attempt count.
 * Useful for displaying reconnection status in the UI.
 */
export function getRetryCount(): number {
  return retryCount;
}

/**
 * Configure the WebSocket client with custom options.
 * Must be called before `connectWS()` for options to take effect.
 *
 * @param options - Partial configuration to merge with defaults.
 */
export function configureWS(options: Partial<WSClientConfig>): void {
  Object.assign(config, options);
}

/**
 * Permanently destroy the WebSocket client.
 * Removes all handlers, clears all timers, and closes the connection.
 * The client cannot be reused after destruction.
 */
export function destroyWS(): void {
  disconnectWS();
  isDestroyed = true;

  // Clear all handlers
  messageHandlers.clear();
  connectHandlers.clear();
  disconnectHandlers.clear();
}

/**
 * React hook-friendly auto-connect / disconnect helper.
 * Call the returned cleanup function in a useEffect cleanup or on unmount.
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const cleanup = autoConnectWS();
 *   return cleanup;
 * }, []);
 * ```
 */
export function autoConnectWS(): () => void {
  connectWS().catch((err) => {
    console.error('[WS] Auto-connect failed:', err);
  });
  return disconnectWS;
}