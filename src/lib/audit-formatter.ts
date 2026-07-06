/**
 * BABIRYE v10.0.0 — Audit Log Formatter & Analysis Utilities
 *
 * Formats raw audit log entries into human-readable strings, table rows,
 * and timeline items. Also provides anomaly detection, activity scoring,
 * and log aggregation helpers.
 *
 * Imports AuditLog from the shared types module to stay consistent with
 * the rest of the BABIRYE platform.
 */

import type { AuditLog } from './types';

// ============================================================================
// Types
// ============================================================================

/** A timeline item suitable for rendering in a vertical timeline component. */
export interface TimelineItem {
  /** Unique identifier (audit log ID). */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Brief description. */
  description: string;
  /** ISO timestamp. */
  timestamp: string;
  /** Tailwind colour class for the timeline dot/border. */
  color: string;
  /** Lucide icon name for the timeline icon. */
  icon: string;
  /** The original audit log, attached for reference. */
  log: AuditLog;
}

/** An anomaly detection result. */
export interface AuditAnomaly {
  /** The audit log ID that triggered the anomaly. */
  logId: string;
  /** Type of anomaly detected. */
  type: string;
  /** Human-readable explanation. */
  reason: string;
}

/** An audit summary aggregation. */
export interface AuditSummary {
  /** Total number of logs in the input set. */
  total: number;
  /** Breakdown count per action type. */
  byAction: Record<string, number>;
  /** Number of logs classified as critical. */
  critical: number;
  /** The 10 most recent log entries. */
  recent: AuditLog[];
}

// ============================================================================
// Action / Resource Mappings
// ============================================================================

/** Map of action keys to human-readable labels. */
const ACTION_LABELS: Record<string, string> = {
  'login': 'User Login',
  'logout': 'User Logout',
  'login.failed': 'Failed Login Attempt',
  'login.success': 'Successful Login',
  'create': 'Created',
  'update': 'Updated',
  'delete': 'Deleted',
  'view': 'Viewed',
  'deploy': 'Deployed',
  'activate': 'Activated',
  'deactivate': 'Deactivated',
  'configure': 'Configured',
  'page.view': 'Page Viewed',
  'task.create': 'Task Created',
  'task.update': 'Task Updated',
  'task.cancel': 'Task Cancelled',
  'agent.deploy': 'Agent Deployed',
  'tool.deploy': 'Tool Deployed',
  'tool.activate': 'Tool Activated',
  'tool.deactivate': 'Tool Deactivated',
  'alert.resolve': 'Alert Resolved',
  'alert.escalate': 'Alert Escalated',
  'vip.sos': 'VIP SOS Triggered',
  'wall.block': 'Wall Guard Blocked',
  'export': 'Data Exported',
  'settings.update': 'Settings Updated',
  'user.create': 'User Created',
  'user.update': 'User Updated',
  'user.delete': 'User Deleted',
  'role.change': 'Role Changed',
};

/** Map of action keys to Tailwind text colour classes. */
const ACTION_COLORS: Record<string, string> = {
  'login': 'text-emerald-500',
  'logout': 'text-gray-500',
  'login.failed': 'text-red-500',
  'login.success': 'text-emerald-500',
  'create': 'text-blue-500',
  'update': 'text-yellow-500',
  'delete': 'text-red-500',
  'view': 'text-gray-400',
  'deploy': 'text-cyan-500',
  'activate': 'text-emerald-500',
  'deactivate': 'text-orange-500',
  'configure': 'text-purple-500',
  'page.view': 'text-gray-400',
  'task.create': 'text-blue-500',
  'task.update': 'text-yellow-500',
  'task.cancel': 'text-orange-500',
  'agent.deploy': 'text-cyan-500',
  'tool.deploy': 'text-cyan-500',
  'tool.activate': 'text-emerald-500',
  'tool.deactivate': 'text-orange-500',
  'alert.resolve': 'text-emerald-500',
  'alert.escalate': 'text-red-500',
  'vip.sos': 'text-red-500',
  'wall.block': 'text-red-500',
  'export': 'text-blue-500',
  'settings.update': 'text-yellow-500',
  'user.create': 'text-blue-500',
  'user.update': 'text-yellow-500',
  'user.delete': 'text-red-500',
  'role.change': 'text-orange-500',
};

/** Map of action keys to Lucide icon names. */
const ACTION_ICONS: Record<string, string> = {
  'login': 'LogIn',
  'logout': 'LogOut',
  'login.failed': 'ShieldX',
  'login.success': 'ShieldCheck',
  'create': 'PlusCircle',
  'update': 'Pencil',
  'delete': 'Trash2',
  'view': 'Eye',
  'deploy': 'Rocket',
  'activate': 'ToggleRight',
  'deactivate': 'ToggleLeft',
  'configure': 'Settings',
  'page.view': 'Monitor',
  'task.create': 'PlusCircle',
  'task.update': 'Pencil',
  'task.cancel': 'XCircle',
  'agent.deploy': 'Rocket',
  'tool.deploy': 'Package',
  'tool.activate': 'Zap',
  'tool.deactivate': 'ZapOff',
  'alert.resolve': 'CheckCircle',
  'alert.escalate': 'AlertTriangle',
  'vip.sos': 'Siren',
  'wall.block': 'ShieldAlert',
  'export': 'Download',
  'settings.update': 'Settings',
  'user.create': 'UserPlus',
  'user.update': 'UserCog',
  'user.delete': 'UserMinus',
  'role.change': 'Crown',
};

/** Actions considered critical for security purposes. */
const CRITICAL_ACTIONS = new Set([
  'delete',
  'user.delete',
  'role.change',
  'login.failed',
  'vip.sos',
  'alert.escalate',
  'wall.block',
  'deploy',
  'agent.deploy',
]);

/** Map of resource keys to human-readable labels. */
const RESOURCE_LABELS: Record<string, string> = {
  'task': 'Task',
  'tasks': 'Tasks',
  'agent': 'Agent',
  'agents': 'Agents',
  'user': 'User',
  'users': 'Users',
  'alert': 'Security Alert',
  'alerts': 'Security Alerts',
  'sensor': 'Sensor',
  'sensors': 'Sensors',
  'tool': 'Tool',
  'tools': 'Tools',
  'vip': 'VIP Profile',
  'vip-profile': 'VIP Profile',
  'drone': 'VIP Drone',
  'vehicle': 'VIP Vehicle',
  'wearable': 'VIP Wearable',
  'wall-guard': 'Wall Guard',
  'council': 'Council',
  'intel': 'Intelligence Feed',
  'report': 'Report',
  'reports': 'Reports',
  'setting': 'System Setting',
  'settings': 'System Settings',
  'constitution': 'Constitution',
  'weapon': 'Weapon',
  'gateway': 'SPA Gateway',
  'session': 'Session',
  'auth': 'Authentication',
  'dashboard': 'Dashboard',
};

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Convert an action key into a human-readable label.
 * Falls back to Title-casing the action string.
 *
 * @param action - The action identifier (e.g. "task.create", "login.failed").
 * @returns Human-readable action name.
 */
export function formatAuditAction(action: string): string {
  return ACTION_LABELS[action] ?? action
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Convert a resource key into a human-readable label.
 *
 * @param resource - The resource identifier (e.g. "task", "wall-guard").
 * @returns Human-readable resource name.
 */
export function formatAuditResource(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource
    .split(/[-_:]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Get the Tailwind colour class for a given action type.
 *
 * @param action - The action identifier.
 * @returns A Tailwind text colour class string.
 */
export function getActionColor(action: string): string {
  // Check exact match first
  if (ACTION_COLORS[action]) return ACTION_COLORS[action];

  // Check prefix match (e.g. "task.create" → check "task" prefix)
  const prefix = action.split('.')[0];
  if (ACTION_COLORS[prefix]) return ACTION_COLORS[prefix];

  // Default to gray
  return 'text-gray-400';
}

/**
 * Get the Lucide icon name for a given action type.
 *
 * @param action - The action identifier.
 * @returns A Lucide icon component name string.
 */
export function getActionIcon(action: string): string {
  if (ACTION_ICONS[action]) return ACTION_ICONS[action];

  const prefix = action.split('.')[0];
  if (ACTION_ICONS[prefix]) return ACTION_ICONS[prefix];

  return 'CircleDot';
}

/**
 * Determine if a given action is classified as critical.
 *
 * @param action - The action identifier.
 * @returns `true` if the action is critical.
 */
export function isCriticalAction(action: string): boolean {
  if (CRITICAL_ACTIONS.has(action)) return true;

  // Check prefix
  const prefix = action.split('.')[0];
  return CRITICAL_ACTIONS.has(prefix);
}

/**
 * Format a full audit log entry into a single human-readable string.
 *
 * @param log - The AuditLog entry.
 * @returns A formatted string like "[2024-01-15 14:32:10] admin Created Task #abc-123 (from 192.168.1.42)".
 */
export function formatAuditLogEntry(log: AuditLog): string {
  const time = new Date(log.createdAt).toLocaleString();
  const user = log.user?.name ?? log.userId ?? 'System';
  const action = formatAuditAction(log.action);
  const resource = formatAuditResource(log.resource);
  const ip = log.ipAddress ? ` (from ${log.ipAddress})` : '';

  let detail = '';
  if (log.durationMs !== null) {
    detail = ` [${log.durationMs}ms]`;
  }
  if (log.details) {
    detail += ` — ${log.details}`;
  }

  return `[${time}] ${user} ${action} ${resource}${detail}${ip}`;
}

/**
 * Format an audit log entry as a flat object suitable for table rendering.
 *
 * @param log - The AuditLog entry.
 * @returns A plain object with formatted columns.
 */
export function formatAuditLogForTable(log: AuditLog): Record<string, unknown> {
  return {
    id: log.id,
    time: new Date(log.createdAt).toLocaleString(),
    user: log.user?.name ?? log.userId ?? 'System',
    action: formatAuditAction(log.action),
    resource: formatAuditResource(log.resource),
    details: log.details ?? '',
    ip: log.ipAddress ?? '—',
    statusCode: log.statusCode ?? '—',
    durationMs: log.durationMs ?? '—',
    isCritical: isCriticalAction(log.action),
    color: getActionColor(log.action),
    icon: getActionIcon(log.action),
  };
}

// ============================================================================
// Timeline & Analysis
// ============================================================================

/**
 * Convert an audit log entry into a timeline item for UI rendering.
 *
 * @param log - The AuditLog entry.
 * @returns A TimelineItem object.
 */
export function createAuditTimelineItem(log: AuditLog): TimelineItem {
  const action = formatAuditAction(log.action);
  const resource = formatAuditResource(log.resource);
  const user = log.user?.name ?? log.userId ?? 'System';

  return {
    id: log.id,
    title: `${action} — ${resource}`,
    description: `By ${user}${log.ipAddress ? ` from ${log.ipAddress}` : ''}${log.details ? `: ${log.details}` : ''}`,
    timestamp: log.createdAt,
    color: getActionColor(log.action),
    icon: getActionIcon(log.action),
    log,
  };
}

/**
 * Calculate a user activity score from a set of audit logs.
 * Score is based on recency, variety of actions, and total volume.
 *
 * @param logs - Array of AuditLog entries (typically for one user).
 * @returns An activity score from 0 to 100.
 */
export function calculateUserActivityScore(logs: AuditLog[]): number {
  if (logs.length === 0) return 0;

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Recency score: weight recent logs more heavily (last 7 days)
  let recencyScore = 0;
  for (const log of logs) {
    const age = now - new Date(log.createdAt).getTime();
    if (age < DAY_MS) {
      recencyScore += 3;
    } else if (age < 7 * DAY_MS) {
      recencyScore += 1;
    } else if (age < 30 * DAY_MS) {
      recencyScore += 0.3;
    }
  }

  // Variety score: number of unique actions (capped at 10)
  const uniqueActions = new Set(logs.map((l) => l.action)).size;
  const varietyScore = Math.min(uniqueActions, 10) * 3;

  // Volume score: logarithmic scaling
  const volumeScore = Math.min(Math.log10(logs.length + 1) * 10, 30);

  // Total (normalised to 0-100)
  const raw = recencyScore + varietyScore + volumeScore;
  return Math.min(100, Math.round(raw));
}

/**
 * Detect anomalous patterns in a set of audit logs.
 * Currently checks for:
 *   - Rapid sequential actions from the same user (burst detection)
 *   - Multiple failed logins in a short window
 *   - Actions from multiple IPs for the same user in a short time
 *
 * @param logs - Array of AuditLog entries.
 * @returns Array of detected anomalies.
 */
export function detectAnomalies(logs: AuditLog[]): AuditAnomaly[] {
  const anomalies: AuditAnomaly[] = [];

  // Sort by timestamp ascending
  const sorted = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // --- Burst detection: >20 actions from same user in 60 seconds ---
  const userBuckets: Map<string, AuditLog[]> = new Map();
  const BURST_WINDOW_MS = 60_000;
  const BURST_THRESHOLD = 20;

  for (const log of sorted) {
    const userId = log.userId ?? 'anonymous';
    if (!userBuckets.has(userId)) {
      userBuckets.set(userId, []);
    }
    const bucket = userBuckets.get(userId)!;
    bucket.push(log);

    // Keep only logs within the window
    const cutoff = new Date(log.createdAt).getTime() - BURST_WINDOW_MS;
    while (bucket.length > 0 && new Date(bucket[0].createdAt).getTime() < cutoff) {
      bucket.shift();
    }

    if (bucket.length >= BURST_THRESHOLD) {
      // Only report once per burst (at the threshold log)
      if (bucket.length === BURST_THRESHOLD) {
        anomalies.push({
          logId: log.id,
          type: 'burst',
          reason: `User ${userId} performed ${BURST_THRESHOLD}+ actions in under 60 seconds`,
        });
      }
    }
  }

  // --- Failed login detection: 5+ failed logins in 5 minutes ---
  const FAIL_WINDOW_MS = 5 * 60 * 1000;
  const FAIL_THRESHOLD = 5;
  const failBucket: AuditLog[] = [];

  for (const log of sorted) {
    if (log.action === 'login.failed' || log.action === 'login' && log.statusCode && log.statusCode >= 400) {
      failBucket.push(log);

      const cutoff = new Date(log.createdAt).getTime() - FAIL_WINDOW_MS;
      while (failBucket.length > 0 && new Date(failBucket[0].createdAt).getTime() < cutoff) {
        failBucket.shift();
      }

      if (failBucket.length === FAIL_THRESHOLD) {
        anomalies.push({
          logId: log.id,
          type: 'brute_force',
          reason: `${FAIL_THRESHOLD}+ failed login attempts in 5 minutes from IP ${log.ipAddress ?? 'unknown'}`,
        });
      }
    }
  }

  // --- Multi-IP detection: same user from 3+ IPs in 10 minutes ---
  const MULTI_IP_WINDOW_MS = 10 * 60 * 1000;
  const MULTI_IP_THRESHOLD = 3;
  const userIpBuckets: Map<string, Map<string, number>> = new Map();

  for (const log of sorted) {
    const userId = log.userId ?? 'anonymous';
    const ip = log.ipAddress ?? 'unknown';

    if (!userIpBuckets.has(userId)) {
      userIpBuckets.set(userId, new Map());
    }
    const ipMap = userIpBuckets.get(userId)!;
    ipMap.set(ip, new Date(log.createdAt).getTime());

    // Prune old entries
    const cutoff = Date.now() - MULTI_IP_WINDOW_MS;
    for (const [ipKey, ts] of ipMap) {
      if (ts < cutoff) ipMap.delete(ipKey);
    }

    if (ipMap.size >= MULTI_IP_THRESHOLD) {
      anomalies.push({
        logId: log.id,
        type: 'multi_ip',
        reason: `User ${userId} active from ${ipMap.size}+ distinct IPs in 10 minutes (possible session hijacking)`,
      });
      // Only report once per user
      break;
    }
  }

  return anomalies;
}

/**
 * Group audit logs by their action type.
 *
 * @param logs - Array of AuditLog entries.
 * @returns A record mapping action keys to arrays of matching logs.
 */
export function groupLogsByAction(logs: AuditLog[]): Record<string, AuditLog[]> {
  const groups: Record<string, AuditLog[]> = {};

  for (const log of logs) {
    const action = log.action;
    if (!groups[action]) {
      groups[action] = [];
    }
    groups[action].push(log);
  }

  // Sort each group by timestamp descending
  for (const action of Object.keys(groups)) {
    groups[action].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return groups;
}

/**
 * Generate a summary of audit logs including totals, action breakdown,
 * critical count, and the most recent entries.
 *
 * @param logs - Array of AuditLog entries.
 * @returns An AuditSummary object.
 */
export function generateAuditSummary(logs: AuditLog[]): AuditSummary {
  const byAction: Record<string, number> = {};
  let critical = 0;

  // Sort by timestamp descending for the "recent" list
  const sorted = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const log of sorted) {
    // Count by action
    byAction[log.action] = (byAction[log.action] ?? 0) + 1;

    // Count critical
    if (isCriticalAction(log.action)) {
      critical++;
    }
  }

  return {
    total: logs.length,
    byAction,
    critical,
    recent: sorted.slice(0, 10),
  };
}