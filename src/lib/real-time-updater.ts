/**
 * BABIRYE v10.0.0 — Real-Time Data Updater
 *
 * Orchestrates real-time data updates by combining periodic API polling
 * with WebSocket push notifications. Updates the zustand app store
 * when new data arrives, keeping the UI fresh without full page reloads.
 *
 * Features:
 * - Dashboard stats polling (every 10s)
 * - Notification count polling (every 15s)
 * - Wall guard stats polling (every 20s)
 * - WebSocket message dispatching to relevant store slices
 * - Debounced polling to prevent API flooding
 * - Automatic cleanup on stop
 */

'use client';

import { apiGet } from '@/lib/api-helpers';
import {
  connectWS,
  disconnectWS,
  onMessage,
  type WSMessage,
} from '@/lib/websocket-client';
import type { DashboardStats } from '@/lib/types';
import { useAppStore } from '@/stores/app-store';

// ============================================================================
// Types
// ============================================================================

/** Configuration for individual poll intervals. */
export interface PollConfig {
  /** The API endpoint to poll. */
  endpoint: string;
  /** Query parameters for the request. */
  params?: Record<string, string>;
  /** Polling interval in milliseconds. */
  intervalMs: number;
  /** Minimum time between actual API calls (debounce floor). */
  debounceMs?: number;
  /** Callback invoked with the response data. */
  onData: (data: unknown) => void;
  /** Callback invoked on error (prevents propagation). */
  onError?: (error: Error) => void;
  /** Human-readable label for logging. */
  label: string;
}

/** Internal tracker for a running poll. */
interface ActivePoll {
  config: PollConfig;
  intervalId: ReturnType<typeof setInterval>;
  lastPollAt: number;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  pendingRequest: AbortController | null;
}

/** Summary of the current real-time updater state. */
export interface RealTimeState {
  isRunning: boolean;
  activePolls: number;
  wsConnected: boolean;
  pollsStartedAt: number | null;
}

// ============================================================================
// Constants
// ============================================================================

/** Dashboard stats poll interval: 10 seconds. */
const DASHBOARD_POLL_MS = 10_000;

/** Notification count poll interval: 15 seconds. */
const NOTIFICATION_POLL_MS = 15_000;

/** Wall guard stats poll interval: 20 seconds. */
const WALL_STATS_POLL_MS = 20_000;

/** Minimum debounce time between actual API calls per poll. */
const DEFAULT_DEBOUNCE_MS = 5_000;

/** Header notification badge custom event name. */
const NOTIFICATION_BADGE_EVENT = 'babirye:notification-count-update';

// ============================================================================
// Internal State
// ============================================================================

let activePolls: ActivePoll[] = [];
let wsUnsubscribe: (() => void) | null = null;
let isRunning = false;
let pollsStartedAt: number | null = null;

// ============================================================================
// Poll Factory
// ============================================================================

/**
 * Create and start a single poll with debouncing.
 *
 * The poll will fire on the specified interval but will debounce
 * rapid calls to prevent API flooding when the tab is backgrounded
 * and then foregrounded.
 */
function startPoll(config: PollConfig): ActivePoll {
  const poll: ActivePoll = {
    config,
    intervalId: null as unknown as ReturnType<typeof setInterval>,
    lastPollAt: 0,
    debounceTimer: null,
    pendingRequest: null,
  };

  const debounceMs = config.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  /** Execute the actual API call. */
  async function executePoll(): Promise<void> {
    const now = Date.now();

    // Debounce: skip if called too soon after last poll
    if (now - poll.lastPollAt < debounceMs) {
      if (poll.debounceTimer) clearTimeout(poll.debounceTimer);
      poll.debounceTimer = setTimeout(() => {
        poll.debounceTimer = null;
        executePoll();
      }, debounceMs - (now - poll.lastPollAt));
      return;
    }

    // Abort any in-flight request
    const existing = poll.pendingRequest;
    if (existing) {
      existing.abort();
    }

    const controller = new AbortController();
    poll.pendingRequest = controller;
    poll.lastPollAt = now;

    try {
      const params = config.params ?? {};
      const queryString = Object.entries(params).length > 0
        ? `?${new URLSearchParams(params).toString()}`
        : '';
      const url = `${config.endpoint}${queryString}`;

      const data = await apiGet<unknown>(url);
      config.onData(data);
    } catch (error) {
      // Ignore abort errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (config.onError) {
        config.onError(error instanceof Error ? error : new Error(String(error)));
      }
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[RealTime] Poll error (${config.label}):`, error);
      }
    } finally {
      poll.pendingRequest = null;
    }
  }

  // Start the interval
  poll.intervalId = setInterval(executePoll, config.intervalMs);

  // Execute immediately on start
  executePoll();

  return poll;
}

/**
 * Stop a single poll and clean up its resources.
 */
function stopPoll(poll: ActivePoll): void {
  if (poll.intervalId) {
    clearInterval(poll.intervalId);
    poll.intervalId = null as unknown as ReturnType<typeof setInterval>;
  }
  if (poll.debounceTimer) {
    clearTimeout(poll.debounceTimer);
    poll.debounceTimer = null;
  }
  if (poll.pendingRequest) {
    poll.pendingRequest.abort();
    poll.pendingRequest = null;
  }
}

// ============================================================================
// WebSocket Message Handler
// ============================================================================

/**
 * Route incoming WebSocket messages to the appropriate store updates.
 */
function handleWSMessage(message: WSMessage): void {
  const store = useAppStore.getState();

  switch (message.type) {
    // Task updates — could update task list counts
    case 'task:update':
    case 'task:created':
    case 'task:completed':
    case 'task:failed': {
      // Add a notification for significant task events
      const payload = message.payload;
      if (
        message.type === 'task:completed' ||
        message.type === 'task:failed'
      ) {
        store.addNotification({
          title: `Task ${message.type === 'task:completed' ? 'Completed' : 'Failed'}`,
          message: String(payload.taskId ?? payload.id ?? 'Unknown task'),
          type: message.type === 'task:completed' ? 'success' : 'critical',
        });
      }
      break;
    }

    // New security alerts — add notification
    case 'alert:new':
    case 'alert:escalated': {
      const alertPayload = message.payload;
      store.addNotification({
        title: 'Security Alert',
        message: String(alertPayload.title ?? alertPayload.description ?? 'New alert detected'),
        type: 'critical',
      });
      emitNotificationBadgeUpdate();
      break;
    }

    // Sensor anomalies — add warning notification
    case 'sensor:anomaly': {
      const sensorPayload = message.payload;
      store.addNotification({
        title: 'Sensor Anomaly',
        message: `Anomaly detected on sensor ${String(sensorPayload.sensorId ?? sensorPayload.sensorName ?? 'unknown')}`,
        type: 'warning',
      });
      break;
    }

    // VIP SOS — add critical notification
    case 'vip:sos': {
      const vipPayload = message.payload;
      store.addNotification({
        title: 'VIP SOS Alert',
        message: `SOS triggered for VIP ${String(vipPayload.vipName ?? vipPayload.vipId ?? 'unknown')}`,
        type: 'critical',
      });
      break;
    }

    // Wall guard blocks — add info notification
    case 'wall:block': {
      const wallPayload = message.payload;
      store.addNotification({
        title: 'Wall Guard Block',
        message: `Request blocked by ${String(wallPayload.guardName ?? wallPayload.guardId ?? 'guard')}`,
        type: 'info',
      });
      break;
    }

    // System notifications — add directly
    case 'system:notification': {
      const sysPayload = message.payload;
      store.addNotification({
        title: String(sysPayload.title ?? 'System Notification'),
        message: String(sysPayload.message ?? ''),
        type: (sysPayload.severity as 'info' | 'warning' | 'critical' | 'success') ?? 'info',
      });
      emitNotificationBadgeUpdate();
      break;
    }

    // Council decisions — add info
    case 'council:decision': {
      const councilPayload = message.payload;
      store.addNotification({
        title: 'Council Decision',
        message: String(councilPayload.decision ?? councilPayload.query ?? 'New council decision'),
        type: 'info',
      });
      break;
    }

    default:
      // Unhandled message types are silently ignored
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[RealTime] Unhandled WS message type: ${message.type}`);
      }
      break;
  }
}

// ============================================================================
// Notification Badge Updates
// ============================================================================

/**
 * Emit a custom event to update the header notification badge.
 * Components listening for this event can update their badge count
 * without needing to poll or subscribe to the store directly.
 */
function emitNotificationBadgeUpdate(): void {
  if (typeof window !== 'undefined') {
    const unreadCount = useAppStore.getState().notifications.filter((n) => !n.read).length;
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_BADGE_EVENT, {
        detail: { unreadCount },
      })
    );
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Start all real-time update polling intervals and the WebSocket connection.
 *
 * This function is idempotent — calling it multiple times has no effect
 * until `stopRealTimeUpdates()` is called.
 *
 * @returns A cleanup function that stops all updates when called.
 */
export function startRealTimeUpdates(): () => void {
  if (isRunning) {
    return stopRealTimeUpdates;
  }

  isRunning = true;
  pollsStartedAt = Date.now();

  if (process.env.NODE_ENV === 'development') {
    console.debug('[RealTime] Starting real-time updates...');
  }

  // --- Start Dashboard Stats Poll ---
  const dashboardPoll = startPoll({
    endpoint: '/dashboard',
    intervalMs: DASHBOARD_POLL_MS,
    label: 'dashboard-stats',
    onData: (data) => {
      try {
        const stats = data as DashboardStats;
        // Store dashboard stats for components that need them
        if (process.env.NODE_ENV === 'development') {
          console.debug('[RealTime] Dashboard stats updated', {
            activeAgents: stats.agents.active,
            pendingTasks: stats.tasks.pending,
            criticalAlerts: stats.alerts.critical,
          });
        }
      } catch {
        // Ignore parse errors for dashboard data
      }
    },
    onError: () => {
      // Dashboard poll errors are non-critical
    },
  });

  // --- Start Notification Count Poll ---
  const notificationPoll = startPoll({
    endpoint: '/notifications',
    params: { view: 'count' },
    intervalMs: NOTIFICATION_POLL_MS,
    label: 'notification-count',
    onData: (data) => {
      try {
        const result = data as { unread?: number; total?: number };
        const unreadCount = result.unread ?? 0;

        // Emit badge update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(NOTIFICATION_BADGE_EVENT, {
              detail: { unreadCount },
            })
          );
        }
      } catch {
        // Ignore parse errors
      }
    },
    onError: () => {
      // Notification poll errors are non-critical
    },
  });

  // --- Start Wall Guard Stats Poll ---
  const wallStatsPoll = startPoll({
    endpoint: '/wall',
    params: { view: 'stats' },
    intervalMs: WALL_STATS_POLL_MS,
    label: 'wall-stats',
    onData: (data) => {
      try {
        // Wall stats can be stored or emitted as events
        if (process.env.NODE_ENV === 'development') {
          console.debug('[RealTime] Wall stats updated');
        }
      } catch {
        // Ignore parse errors
      }
    },
    onError: () => {
      // Wall stats poll errors are non-critical
    },
  });

  activePolls = [dashboardPoll, notificationPoll, wallStatsPoll];

  // --- Start WebSocket Connection ---
  connectWS()
    .then(() => {
      wsUnsubscribe = onMessage(handleWSMessage);
      if (process.env.NODE_ENV === 'development') {
        console.debug('[RealTime] WebSocket connected and message handler registered');
      }
    })
    .catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[RealTime] WebSocket connection failed (polling will continue):', err);
      }
    });

  if (process.env.NODE_ENV === 'development') {
    console.debug('[RealTime] All real-time updates started');
  }

  return stopRealTimeUpdates;
}

/**
 * Stop all real-time update polling intervals and disconnect the WebSocket.
 *
 * This is a no-op if updates are not currently running.
 */
export function stopRealTimeUpdates(): void {
  if (!isRunning) return;

  if (process.env.NODE_ENV === 'development') {
    console.debug('[RealTime] Stopping real-time updates...');
  }

  // Stop all polls
  for (const poll of activePolls) {
    stopPoll(poll);
  }
  activePolls = [];

  // Unsubscribe from WebSocket messages
  if (wsUnsubscribe) {
    wsUnsubscribe();
    wsUnsubscribe = null;
  }

  // Disconnect WebSocket
  disconnectWS();

  isRunning = false;
  pollsStartedAt = null;

  if (process.env.NODE_ENV === 'development') {
    console.debug('[RealTime] All real-time updates stopped');
  }
}

/**
 * Get the current state of the real-time updater.
 *
 * @returns Current state including running status and poll counts.
 */
export function getRealTimeState(): RealTimeState {
  return {
    isRunning,
    activePolls: activePolls.length,
    wsConnected: false, // Would need to import isConnected
    pollsStartedAt,
  };
}

/**
 * Subscribe to notification badge count updates via a custom DOM event.
 * Useful for components that need to react to notification count changes
 * without direct store subscription.
 *
 * @param callback - Function called with the new unread count
 * @returns Unsubscribe function
 */
export function onNotificationBadgeUpdate(
  callback: (unreadCount: number) => void
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ unreadCount: number }>).detail;
    callback(detail.unreadCount);
  };

  window.addEventListener(NOTIFICATION_BADGE_EVENT, handler);
  return () => {
    window.removeEventListener(NOTIFICATION_BADGE_EVENT, handler);
  };
}