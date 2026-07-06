/**
 * BABIRYE v10.0.0 — Data Export Utilities
 *
 * Client-side utilities for exporting data as CSV, JSON, or Markdown.
 * Provides file download triggers and clipboard integration.
 *
 * All functions are pure and synchronous except `copyToClipboard`
 * which returns a Promise (required by the Clipboard API).
 */

import type { AuditLog } from './types';

// ============================================================================
// Types
// ============================================================================

/** Column definition for CSV export. */
export interface ExportColumn {
  /** Property key on the data object. Supports dot-notation (e.g. 'user.name'). */
  key: string;
  /** Human-readable column header. */
  label: string;
  /** Optional formatter — receives the raw value, returns display string. */
  format?: (value: unknown) => string;
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Safely escape a single CSV cell value.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Resolve a nested property from an object using dot-notation.
 * e.g. resolveProperty({ user: { name: 'Alice' } }, 'user.name') → 'Alice'
 */
function resolveProperty(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? '';
}

/**
 * Convert an array of objects to a CSV string.
 *
 * @param data    - Array of row objects
 * @param columns - Column definitions (key, label, optional format)
 * @returns A complete CSV string with header row
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[]
): string {
  // Header row
  const header = columns.map((col) => escapeCsvCell(col.label)).join(',');

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const rawValue = resolveProperty(row, col.key);
        const displayValue = col.format ? col.format(rawValue) : String(rawValue);
        return escapeCsvCell(displayValue);
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Convert data to a JSON string.
 *
 * @param data   - Any serialisable value
 * @param pretty - If true, format with 2-space indentation (default: true)
 * @returns A JSON string
 */
export function exportToJSON(data: unknown, pretty: boolean = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

// ============================================================================
// File Download
// ============================================================================

/**
 * Trigger a browser file download by creating a temporary <a> element.
 *
 * @param content    - File content as a string
 * @param filename   - Desired file name (e.g. 'report.csv')
 * @param contentType - MIME type (e.g. 'text/csv', 'application/json')
 */
export function downloadFile(
  content: string,
  filename: string,
  contentType: string
): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

// ============================================================================
// Clipboard
// ============================================================================

/**
 * Copy text to the system clipboard.
 * Uses the modern Clipboard API with a fallback to `document.execCommand`.
 *
 * @param text - Text to copy
 * @returns `true` if the copy succeeded, `false` otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern Clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback
    }
  }

  // Legacy fallback for insecure contexts
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

// ============================================================================
// Specialised Exports
// ============================================================================

/** Column definitions for audit log CSV export. */
const AUDIT_LOG_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'createdAt', label: 'Timestamp', format: (v) => String(v) },
  { key: 'userId', label: 'User ID' },
  { key: 'action', label: 'Action' },
  { key: 'resource', label: 'Resource' },
  { key: 'details', label: 'Details', format: (v) => {
    try {
      return JSON.stringify(JSON.parse(String(v)));
    } catch {
      return String(v);
    }
  }},
  { key: 'ipAddress', label: 'IP Address' },
  { key: 'userAgent', label: 'User Agent' },
  { key: 'statusCode', label: 'HTTP Status', format: (v) => String(v ?? '') },
  { key: 'durationMs', label: 'Duration (ms)', format: (v) => String(v ?? '') },
];

/**
 * Export audit logs to a CSV string with pre-configured columns.
 *
 * @param logs - Array of AuditLog objects
 * @returns A CSV string ready for download
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): string {
  return exportToCSV(logs as unknown as Record<string, unknown>[], AUDIT_LOG_COLUMNS);
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate a Markdown report from structured data.
 *
 * Automatically builds a title, metadata table, and sections based on
 * the report type and the shape of the provided data.
 *
 * @param data - The report data object
 * @param type - Report type identifier (e.g. 'security', 'audit', 'vip')
 * @returns A Markdown-formatted string
 */
export function generateReportMarkdown(
  data: Record<string, unknown>,
  type: string
): string {
  const lines: string[] = [];
  const timestamp = new Date().toISOString();

  // Title
  lines.push(`# ${capitalize(type)} Report`);
  lines.push('');
  lines.push(`**Generated:** ${timestamp}`);
  lines.push('');

  // Summary section if present
  if (data.summary && typeof data.summary === 'string') {
    lines.push('## Summary');
    lines.push('');
    lines.push(data.summary);
    lines.push('');
  }

  // Iterates over top-level keys (skipping internal/meta keys)
  const skipKeys = new Set(['summary', 'title', 'type', 'format', 'classification', 'generatedBy', 'id', 'content']);

  for (const [key, value] of Object.entries(data)) {
    if (skipKeys.has(key)) continue;

    lines.push(`## ${capitalize(key.replace(/([A-Z])/g, ' $1').trim())}`);
    lines.push('');

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push('_No data available._');
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        // Array of objects — render as a Markdown table
        const objKeys = Object.keys(value[0] as Record<string, unknown>);
        const headerRow = '| ' + objKeys.map(capitalize).join(' | ') + ' |';
        const separatorRow = '| ' + objKeys.map(() => '---').join(' | ') + ' |';
        const dataRows = value.map((item) => {
          const row = item as Record<string, unknown>;
          return '| ' + objKeys.map((k) => String(row[k] ?? '')).join(' | ') + ' |';
        });
        lines.push(headerRow);
        lines.push(separatorRow);
        lines.push(...dataRows);
      } else {
        // Simple array
        lines.push(value.map((v) => `- ${String(v)}`).join('\n'));
      }
    } else if (typeof value === 'object' && value !== null) {
      // Key-value pairs
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        lines.push(`- **${capitalize(k)}:** ${formatValue(v)}`);
      }
    } else {
      lines.push(String(value));
    }

    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`_Generated by BABIRYE v10.0.0 on ${timestamp}_`);

  return lines.join('\n');
}

/**
 * Generate a structured JSON report from data.
 *
 * Wraps the data in a standardised report envelope with metadata.
 *
 * @param data - The report data
 * @param type - Report type identifier
 * @returns A JSON string of the report
 */
export function generateReportJSON(
  data: unknown,
  type: string
): string {
  const report = {
    reportType: type,
    generatedAt: new Date().toISOString(),
    generatedBy: 'BABIRYE v10.0.0',
    data,
  };

  return exportToJSON(report);
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** Capitalise the first letter of a string. */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format an arbitrary value for Markdown display. */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? '✅ Yes' : '❌ No';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    try {
      return `\`${JSON.stringify(value)}\``;
    } catch {
      return String(value);
    }
  }
  return String(value);
}