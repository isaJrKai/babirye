/**
 * BABIRYE v10.0.0 — Client-Side Audit Logger
 *
 * Queues audit events client-side, supports offline persistence via
 * localStorage, and batch-sends to the server when connectivity is restored.
 *
 * NOTE: Client-side only. Import only in 'use client' components.
 */

'use client';

// ============================================================================
// Types
// ============================================================================

export interface AuditEvent {
  id: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  timestamp: string;
  clientInfo: ClientInfo;
}

export interface ClientInfo {
  userAgent: string;
  url: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  language: string;
}

interface QueuedEvent {
  id: string;
  payload: AuditEvent;
  queuedAt: string;
}

// ============================================================================
// Constants
// ============================================================================

const AUDIT_ENDPOINT = '/api/audit';
const STORAGE_KEY = 'babirye_audit_queue';
const MAX_QUEUE_SIZE = 500;
const FLUSH_INTERVAL_MS = 15_000; // 15 seconds
const MAX_BATCH_SIZE = 50;

// ============================================================================
// State
// ============================================================================

let flushTimerId: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Gather client-side metadata about the current browser environment. */
function getClientInfo(): ClientInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      url: '',
      screenWidth: 0,
      screenHeight: 0,
      timezone: 'UTC',
      language: 'en',
    };
  }

  return {
    userAgent: navigator.userAgent || '',
    url: window.location.href || '',
    screenWidth: window.screen.width || 0,
    screenHeight: window.screen.height || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    language: navigator.language || 'en',
  };
}

// ============================================================================
// LocalStorage queue management
// ============================================================================

function loadQueue(): QueuedEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedEvent[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // Corrupted data — reset queue
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveQueue(queue: QueuedEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Trim to max size (keep most recent)
    const trimmed = queue.length > MAX_QUEUE_SIZE ? queue.slice(-MAX_QUEUE_SIZE) : queue;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — clear oldest half
    const half = queue.slice(Math.floor(queue.length / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(half));
    } catch {
      // Truly full — clear everything
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

function enqueue(event: AuditEvent): void {
  const queue = loadQueue();
  queue.push({ id: generateId(), payload: event, queuedAt: new Date().toISOString() });
  saveQueue(queue);
}

function dequeueAll(): QueuedEvent[] {
  const queue = loadQueue();
  if (queue.length > 0) {
    localStorage.removeItem(STORAGE_KEY);
  }
  return queue;
}

// ============================================================================
// Batch sending
// ============================================================================

/**
 * Send a batch of audit events to the server.
 * Uses `navigator.sendBeacon` when available for reliability during page unload.
 */
async function sendBatch(events: AuditEvent[]): Promise<boolean> {
  if (events.length === 0) return true;

  const body = JSON.stringify({ events });

  // Try sendBeacon for reliability (best-effort, no response checking)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const sent = navigator.sendBeacon(AUDIT_ENDPOINT, blob);
    if (sent) return true;
  }

  // Fallback to fetch
  try {
    const token = localStorage.getItem('babirye_session_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(AUDIT_ENDPOINT, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Flush the local queue by sending events to the server.
 * Failed events are re-queued for the next flush cycle.
 */
export async function flushAuditQueue(): Promise<void> {
  if (isFlushing) return;
  isFlushing = true;

  try {
    const queued = dequeueAll();
    if (queued.length === 0) return;

    // Split into batches
    let offset = 0;
    const failedEvents: QueuedEvent[] = [];

    while (offset < queued.length) {
      const batch = queued.slice(offset, offset + MAX_BATCH_SIZE);
      const success = await sendBatch(batch.map((e) => e.payload));

      if (!success) {
        failedEvents.push(...batch);
      }

      offset += MAX_BATCH_SIZE;
    }

    // Re-queue any failures
    if (failedEvents.length > 0) {
      const existingQueue = loadQueue();
      const merged = [...existingQueue, ...failedEvents];
      saveQueue(merged);
    }
  } finally {
    isFlushing = false;
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Log an arbitrary action to the audit trail.
 *
 * @param action  - The action identifier (e.g. "task.create", "agent.deploy").
 * @param resource - The resource being acted upon (e.g. "task:abc-123").
 * @param details - Optional key-value metadata.
 * @param statusCode - Optional HTTP status code if this relates to an API call.
 */
export function logAction(
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  statusCode?: number
): void {
  const event: AuditEvent = {
    id: generateId(),
    action,
    resource,
    details,
    statusCode,
    timestamp: new Date().toISOString(),
    clientInfo: getClientInfo(),
  };

  enqueue(event);
  scheduleFlush();
}

/**
 * Log a page view / navigation event.
 *
 * @param page - The page identifier or path (e.g. "/dashboard", "wall-guard").
 */
export function logPageView(page: string): void {
  logAction('page.view', page, {
    title: typeof document !== 'undefined' ? document.title : undefined,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  });
}

/**
 * Log a tool-related action (deploy, activate, deactivate, configure, etc.).
 *
 * @param tool   - The tool name or ID.
 * @param action - The specific action (e.g. "deploy", "activate", "deactivate").
 * @param details - Optional metadata (e.g. { category, version, containerImage }).
 */
export function logToolAction(
  tool: string,
  action: string,
  details?: Record<string, unknown>
): void {
  logAction(`tool.${action}`, `tool:${tool}`, details);
}

// ============================================================================
// Flush scheduling
// ============================================================================

function scheduleFlush(): void {
  // Don't schedule if already running or in non-browser environment
  if (typeof window === 'undefined') return;
  if (flushTimerId) return;

  // First flush attempt after a short delay
  flushTimerId = setTimeout(() => {
    flushTimerId = null;
    void flushAuditQueue();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Start the periodic flush interval. Call once on app initialisation.
 */
export function startAuditLogger(): void {
  if (typeof window === 'undefined') return;

  // Flush on visibility change (tab becomes active again)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      void flushAuditQueue();
    }
  });

  // Flush before page unload
  window.addEventListener('beforeunload', () => {
    // sendBeacon will be used inside sendBatch for unload scenarios
    const queued = loadQueue();
    if (queued.length > 0) {
      sendBatch(queued.map((e) => e.payload));
    }
  });

  // Flush when coming back online
  window.addEventListener('online', () => {
    void flushAuditQueue();
  });

  // Initial flush of any queued events
  void flushAuditQueue();
}

/**
 * Stop the periodic flush interval. Call on app teardown.
 */
export function stopAuditLogger(): void {
  if (flushTimerId) {
    clearTimeout(flushTimerId);
    flushTimerId = null;
  }
}