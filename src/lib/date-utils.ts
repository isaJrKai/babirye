/**
 * BABIRYE v10.0.0 — Date / Time Utility Functions
 *
 * Provides relative time formatting, date range helpers, day boundary
 * calculations, and common date comparisons.
 */

// ============================================================================
// Relative time formatting
// ============================================================================

/**
 * Convert a date string into a human-readable relative time string.
 *
 * @example
 * getTimeAgo('2026-07-14T10:00:00Z') // "2 hours ago" (if called ~12:00)
 * getTimeAgo('2026-07-10T10:00:00Z') // "4 days ago"
 */
export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = Date.now();
  const diffMs = now - date.getTime();

  // Future dates
  if (diffMs < 0) {
    const absDiff = Math.abs(diffMs);
    const seconds = Math.floor(absDiff / 1000);
    if (seconds < 60) return 'in a few seconds';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `in ${days} day${days === 1 ? '' : 's'}`;
    return `in ${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'}`;
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(days / 365);
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

// ============================================================================
// Date formatting
// ============================================================================

/** Predefined format presets. */
type FormatPreset = 'full' | 'date' | 'time' | 'iso' | 'datetime-short' | 'datetime-full';

const FORMAT_PRESETS: Record<FormatPreset, Intl.DateTimeFormatOptions> = {
  full: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  date: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  iso: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  'datetime-short': {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  'datetime-full': {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
};

/**
 * Format a date string or Date object.
 *
 * @param date   - ISO date string or Date object.
 * @param format - A preset name or custom Intl.DateTimeFormatOptions.
 */
export function formatDate(
  date: string | Date,
  format: FormatPreset | Intl.DateTimeFormatOptions = 'datetime-full'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  const options = typeof format === 'string' ? FORMAT_PRESETS[format] : format;
  return d.toLocaleDateString('en-US', options);
}

// ============================================================================
// Date range helpers
// ============================================================================

/**
 * Get a date range for common time periods.
 * Returns ISO strings for `from` (start of period) and `to` (now).
 *
 * @param period - '24h', '7d', or '30d'.
 */
export function getDateRange(period: '24h' | '7d' | '30d'): { from: string; to: string } {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case '24h':
      from.setHours(from.getHours() - 24);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

// ============================================================================
// Utility helpers
// ============================================================================

/**
 * Format a Unix timestamp (seconds or milliseconds) into a readable string.
 * Auto-detects seconds vs milliseconds based on magnitude.
 */
export function formatTimestamp(ts: number): string {
  // If the timestamp is in seconds (before year 2100), convert to ms
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const date = new Date(ms);
  if (isNaN(date.getTime())) return 'Invalid timestamp';
  return formatDate(date, 'datetime-short');
}

/**
 * Get the start of the day (00:00:00.000) for a given date.
 * Defaults to today.
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the day (23:59:59.999) for a given date.
 * Defaults to today.
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Check if two date strings fall on the same calendar day.
 */
export function isSameDay(a: string, b: string): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return false;
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

/**
 * Add (or subtract) days from a date string.
 * Returns a new Date object.
 */
export function addDays(date: string, days: number): Date {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Check if a date string represents a recent time.
 *
 * @param dateString - ISO date string.
 * @param maxMinutes - Maximum age in minutes (default 5).
 */
export function isRecent(dateString: string, maxMinutes: number = 5): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const diffMs = Date.now() - date.getTime();
  return diffMs >= 0 && diffMs <= maxMinutes * 60 * 1000;
}