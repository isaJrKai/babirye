// ============================================================================
// BABIRYE - Formatting Utilities
// ============================================================================

import { SEVERITY_COLORS, STATUS_COLORS, ROLE_BADGE_COLORS } from './constants';

/**
 * Format a number with comma separators
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(n: number): string {
  if (n === 0) return '0';
  if (!Number.isFinite(n)) return '∞';
  return n.toLocaleString('en-US');
}

/**
 * Format bytes into human-readable string
 * @example formatBytes(1536) => "1.5 KB"
 * @example formatBytes(1073741824) => "1.0 GB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  if (!Number.isFinite(bytes)) return '∞';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);

  return `${(bytes / Math.pow(k, index)).toFixed(decimals)} ${sizes[index]}`;
}

/**
 * Format milliseconds into human-readable duration
 * @example formatDuration(9252000) => "2h 34m 12s"
 * @example formatDuration(45000) => "45s"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) return '0s';
  if (!Number.isFinite(ms)) return '∞';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Format a date string into a relative time description
 * @example formatRelativeTime(new Date(Date.now() - 7200000).toISOString()) => "2 hours ago"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

/**
 * Format a date string into a readable format
 * @example formatDate("2026-07-06T14:30:00Z") => "Jul 6, 2026 14:30"
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  return date.toLocaleDateString('en-US', options ?? defaultOptions);
}

/**
 * Format a short date (no time)
 * @example formatDateShort("2026-07-06T14:30:00Z") => "Jul 6, 2026"
 */
export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format uptime as a percentage
 * @example formatUptime(99.97) => "99.97%"
 */
export function formatUptime(percentage: number, decimals = 2): string {
  if (!Number.isFinite(percentage)) return 'N/A';
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format a value as a percentage
 * @example formatPercent(0.826) => "82.6%"
 * @example formatPercent(82.6) => "82.6%"  (values > 1 are treated as already percentages)
 */
export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return 'N/A';
  const display = value > 1 ? value : value * 100;
  return `${display.toFixed(decimals)}%`;
}

/**
 * Truncate a string to a maximum length, appending ellipsis
 * @example truncate("This is a very long text", 15) => "This is a ve..."
 */
export function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Mask a secret value, showing only the last N characters
 * @example maskSecret("my-api-key-secret", 4) => "********cret"
 * @example maskSecret("password") => "******rd"
 */
export function maskSecret(value: string, visibleChars = 4): string {
  if (!value) return '';
  if (value.length <= visibleChars) return '*'.repeat(value.length);
  const maskedLength = value.length - visibleChars;
  return '*'.repeat(maskedLength) + value.slice(-visibleChars);
}

/**
 * Get the Tailwind color class for a severity level
 * @example severityColor("critical") => "red"
 * @example severityColor("medium") => "yellow"
 */
export function severityColor(severity: string): 'red' | 'orange' | 'yellow' | 'blue' | 'gray' {
  const map: Record<string, 'red' | 'orange' | 'yellow' | 'blue' | 'gray'> = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue',
    info: 'gray',
  };
  return map[severity.toLowerCase()] ?? 'gray';
}

/**
 * Get the full Tailwind badge class for a severity level
 */
export function severityBadgeClass(severity: string): string {
  const color = severityColor(severity);
  const classMap: Record<string, string> = {
    red: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20',
    orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20',
    yellow: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20',
    blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
    gray: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border border-gray-500/20',
  };
  return classMap[color] ?? classMap.gray;
}

/**
 * Get the full Tailwind badge class for a status
 */
export function statusBadgeClass(status: string): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.disabled;
}

/**
 * Get the dot color class for a status indicator
 */
export function statusDotColor(status: string): string {
  const dotMap: Record<string, string> = {
    idle: 'bg-gray-400',
    running: 'bg-emerald-500',
    active: 'bg-emerald-500',
    online: 'bg-emerald-500',
    completed: 'bg-blue-500',
    error: 'bg-red-500',
    failed: 'bg-red-500',
    disabled: 'bg-gray-400',
    offline: 'bg-gray-400',
    pending: 'bg-yellow-500',
    cancelled: 'bg-gray-400',
    dormant: 'bg-slate-400',
    investigating: 'bg-yellow-500',
    resolved: 'bg-emerald-500',
    false_positive: 'bg-gray-400',
    escalated: 'bg-orange-500',
    inactive: 'bg-gray-400',
    transit: 'bg-cyan-500',
    emergency: 'bg-red-500',
    new: 'bg-purple-500',
  };
  return dotMap[status] ?? 'bg-gray-400';
}

/**
 * Get the badge class for a user role
 */
export function roleBadgeColor(role: string): string {
  return ROLE_BADGE_COLORS[role] ?? ROLE_BADGE_COLORS.viewer;
}

/**
 * Format a label from a snake_case or kebab-case string
 * @example formatLabel("wall-guard") => "Wall Guard"
 * @example formatLabel("vip_protection") => "Vip Protection"
 */
export function formatLabel(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Format a number with a compact suffix
 * @example formatCompact(1234567) => "1.2M"
 * @example formatCompact(890) => "890"
 */
export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Format GPS coordinates
 * @example formatCoords("12.345,-67.890") => "12.345°, -67.890°"
 */
export function formatCoords(coords: string | null): string {
  if (!coords) return 'N/A';
  const parts = coords.split(',').map((p) => p.trim());
  if (parts.length !== 2) return coords;
  return `${parseFloat(parts[0]).toFixed(3)}°, ${parseFloat(parts[1]).toFixed(3)}°`;
}

/**
 * Format a frequency string with units
 * @example formatFrequency("2400000000") => "2.4 GHz"
 */
export function formatFrequency(freq: string | null): string {
  if (!freq) return 'N/A';
  const hz = parseFloat(freq);
  if (isNaN(hz)) return freq;
  if (hz >= 1_000_000_000) return `${(hz / 1_000_000_000).toFixed(1)} GHz`;
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(1)} MHz`;
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(1)} kHz`;
  return `${hz} Hz`;
}

/**
 * Format blood pressure
 * @example formatBloodPressure("120/80") => "120/80 mmHg"
 */
export function formatBloodPressure(bp: string | null): string {
  if (!bp) return 'N/A';
  return `${bp} mmHg`;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format an array of tags for display
 * @example formatTags("forensic,network,memory") => ["forensic", "network", "memory"]
 */
export function parseTags(tags: string): string[] {
  if (!tags) return [];
  return tags
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}