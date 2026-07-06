// ============================================================================
// BABIRYE - Notification Formatting Utilities
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

import type { Notification } from './types';
import {
  ShieldAlert, AlertTriangle, Info, Bell, Activity, Cpu, Eye,
  Shield, Radar, Bot, User, Radio, FileText, Zap, Brain, Heart,
  type LucideIcon,
} from 'lucide-react';
import { formatRelativeTime } from './formatters';

// ============================================================================
// Icon Mapping
// ============================================================================

/**
 * Maps a notification type + severity combination to a Lucide icon component.
 * Returns a default Bell icon if no specific match is found.
 *
 * @param type - Notification type (alert, task, system, vip, sensor, wall-guard, council, report)
 * @param severity - Notification severity (info, warning, error, critical)
 * @returns Lucide icon component
 */
export function getNotificationIcon(type: string, severity: string): LucideIcon {
  const typeIcons: Record<string, LucideIcon> = {
    alert: ShieldAlert,
    task: Activity,
    system: Cpu,
    vip: User,
    sensor: Radar,
    'wall-guard': Shield,
    council: Brain,
    report: FileText,
  };

  const severityOverrides: Record<string, LucideIcon> = {
    critical: Zap,
    error: AlertTriangle,
    warning: AlertTriangle,
  };

  // Severity overrides take priority for critical/error
  if (severity === 'critical' || severity === 'error') {
    return severityOverrides[severity] ?? typeIcons[type] ?? Bell;
  }
  if (severity === 'warning') {
    return typeIcons[type] ?? AlertTriangle;
  }

  return typeIcons[type] ?? Bell;
}

// ============================================================================
// Color Mapping
// ============================================================================

/**
 * Returns a Tailwind color class string based on notification severity.
 * Used for borders, backgrounds, and text coloring.
 *
 * @param severity - Notification severity level
 * @returns Tailwind CSS class string for the severity color
 */
export function getNotificationColor(severity: string): string {
  const map: Record<string, string> = {
    critical: 'border-l-red-500 bg-red-500/5',
    error: 'border-l-red-500 bg-red-500/5',
    warning: 'border-l-yellow-500 bg-yellow-500/5',
    info: 'border-l-blue-500 bg-blue-500/5',
  };
  return map[severity] ?? map.info;
}

// ============================================================================
// Title Formatting
// ============================================================================

/**
 * Generates a human-readable notification title from raw notification data.
 * Used when the notification data doesn't include a pre-formatted title.
 *
 * @param notification - Notification object (raw or partial)
 * @returns Formatted title string
 */
export function formatNotificationTitle(notification: Partial<Notification>): string {
  if (notification.title) return notification.title;

  const typeLabel: Record<string, string> = {
    alert: 'Security Alert',
    task: 'Task Update',
    system: 'System Notification',
    vip: 'VIP Protection',
    sensor: 'Sensor Event',
    'wall-guard': 'Wall Guard Event',
    council: 'Council Decision',
    report: 'Report Ready',
  };

  const base = typeLabel[notification.type ?? ''] ?? 'Notification';

  if (notification.severity && notification.severity !== 'info') {
    return `${notification.severity.toUpperCase()}: ${base}`;
  }
  return base;
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Formats a notification's creation timestamp as a relative time string.
 *
 * @param dateString - ISO date string
 * @returns Human-readable relative time (e.g., "5 minutes ago")
 */
export function formatNotificationTime(dateString: string): string {
  return formatRelativeTime(dateString);
}

// ============================================================================
// Payload Creation
// ============================================================================

/**
 * Creates a notification API body object ready for submission.
 *
 * @param type - Notification type
 * @param title - Notification title
 * @param message - Notification message body
 * @param severity - Severity level
 * @param metadata - Optional additional metadata (will be JSON-stringified)
 * @returns Object matching the Notification creation schema
 */
export function createNotificationPayload(
  type: string,
  title: string,
  message: string,
  severity: string = 'info',
  metadata?: Record<string, unknown>
): {
  type: string;
  title: string;
  message: string;
  severity: string;
  metadata: string;
} {
  return {
    type,
    title,
    message,
    severity,
    metadata: metadata ? JSON.stringify(metadata) : '{}',
  };
}

// ============================================================================
// Grouping & Routing
// ============================================================================

/**
 * Groups an array of notifications by their severity level.
 *
 * @param notifications - Array of notification objects
 * @returns Record mapping severity to array of notifications
 */
export function groupNotificationsBySeverity(
  notifications: Notification[]
): Record<string, Notification[]> {
  const grouped: Record<string, Notification[]> = {
    critical: [],
    error: [],
    warning: [],
    info: [],
  };

  for (const notif of notifications) {
    const bucket = grouped[notif.severity] ?? grouped.info;
    bucket.push(notif);
  }

  return grouped;
}

/**
 * Determines the navigation URL for a notification based on its type and metadata.
 * Returns null if the notification is not actionable (no navigation target).
 *
 * @param notification - Notification object
 * @returns Navigation path string or null
 */
export function getNotificationActionUrl(notification: Notification): string | null {
  // Check explicit action URL first
  if (notification.actionUrl) return notification.actionUrl;

  // Derive from type
  const routeMap: Record<string, string | null> = {
    alert: '/dashboard',          // Navigate to dashboard alert panel
    task: '/tasks',               // Navigate to tasks list
    system: null,                 // System notifications have no target
    vip: '/vip-profiles',         // Navigate to VIP profiles
    sensor: '/sensors',           // Navigate to sensors
    'wall-guard': '/wall-guard',  // Navigate to wall guard
    council: '/council',          // Navigate to council
    report: '/dashboard',         // Navigate to dashboard (report widget)
  };

  let url = routeMap[notification.type] ?? null;

  // Enhance with metadata if available
  if (notification.metadata) {
    try {
      const meta = JSON.parse(notification.metadata);
      if (meta.id && url) {
        url = `${url}/${meta.id}`;
      } else if (meta.route) {
        url = meta.route;
      }
    } catch {
      // If metadata is not valid JSON, ignore
    }
  }

  return url;
}

// ============================================================================
// System Notification Factory
// ============================================================================

/**
 * Creates a system event notification object.
 * Convenience wrapper for common system-level notifications.
 *
 * @param title - Notification title
 * @param message - Notification message
 * @param severity - Severity level (defaults to 'info')
 * @returns Notification creation payload
 */
export function createSystemNotification(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
): {
  type: string;
  title: string;
  message: string;
  severity: string;
  metadata: string;
} {
  return createNotificationPayload('system', title, message, severity, {
    source: 'system',
    timestamp: new Date().toISOString(),
  });
}