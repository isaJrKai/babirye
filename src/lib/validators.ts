// ============================================================================
// BABIRYE - Input Validation Utilities
// ============================================================================

import { SEVERITY_LEVELS, TASK_STATUSES, USER_ROLES, AGENT_DOMAINS, WALL_GUARD_CATEGORIES } from './constants';
import type { TaskType, AlertSeverity, GuardSeverity, AlertType, AlertStatus } from './types';

/**
 * Validate an email address format
 * @example isValidEmail("user@babirye.io") => true
 * @example isValidEmail("invalid-email") => false
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validate an IPv4 or IPv6 address
 * @example isValidIP("192.168.1.1") => true
 * @example isValidIP("::1") => true
 * @example isValidIP("999.999.999.999") => false
 */
export function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;

  // IPv4
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
  if (ipv4Regex.test(ip.trim())) return true;

  // IPv6 (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){1,6}:$/;
  return ipv6Regex.test(ip.trim());
}

/**
 * Validate a network port number (1-65535)
 * @example isValidPort(8080) => true
 * @example isValidPort(0) => false
 * @example isValidPort(99999) => false
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Validate that a string is valid JSON
 * @example isValidJSON('{"key": "value"}') => true
 * @example isValidJSON('not json') => false
 */
export function isValidJSON(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize a string by removing potential XSS patterns
 * @example sanitizeString('<script>alert("xss")</script>Hello') => "alert(\"xss\")Hello"
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';

  return str
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove HTML event handler attributes
    .replace(/\s*on\w+\s*=\s*(['"]?)[^'"]*\1/gi, '')
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript\s*:/gi, '')
    // Remove data: protocol (potential XSS vector)
    .replace(/data\s*:\s*text\/html/gi, '')
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Validate a URL format
 * @example isValidUrl("https://example.com") => true
 * @example isValidUrl("not-a-url") => false
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if a number is within a specified range (inclusive)
 * @example isWithinRange(50, 0, 100) => true
 * @example isWithinRange(-1, 0, 100) => false
 */
export function isWithinRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Validate a severity level string
 * @example isValidSeverity("critical") => true
 * @example isValidSeverity("extreme") => false
 */
export function isValidSeverity(severity: string): severity is AlertSeverity {
  return (SEVERITY_LEVELS as readonly string[]).includes(severity);
}

/**
 * Validate a task type string
 */
export function isValidTaskType(type: string): type is TaskType {
  const validTypes: TaskType[] = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];
  return validTypes.includes(type as TaskType);
}

/**
 * Validate a task status string
 */
export function isValidTaskStatus(status: string): boolean {
  return (TASK_STATUSES as readonly string[]).includes(status);
}

/**
 * Validate a user role string
 */
export function isValidRole(role: string): boolean {
  return (USER_ROLES as readonly string[]).includes(role);
}

/**
 * Validate a guard severity string
 */
export function isValidGuardSeverity(severity: string): severity is GuardSeverity {
  return ['critical', 'high', 'medium', 'low'].includes(severity);
}

/**
 * Validate a guard category string
 */
export function isValidGuardCategory(category: string): boolean {
  return (WALL_GUARD_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Validate an agent domain string
 */
export function isValidAgentDomain(domain: string): boolean {
  return (AGENT_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Validate an alert type string
 */
export function isValidAlertType(type: string): type is AlertType {
  const validTypes: AlertType[] = ['intrusion', 'malware', 'anomaly', 'policy_violation', 'data_breach', 'dos', 'phishing'];
  return validTypes.includes(type as AlertType);
}

/**
 * Validate an alert status string
 */
export function isValidAlertStatus(status: string): status is AlertStatus {
  const validStatuses: AlertStatus[] = ['new', 'investigating', 'resolved', 'false_positive', 'escalated'];
  return validStatuses.includes(status as AlertStatus);
}

/**
 * Validate a non-empty string within a length range
 * @example isValidString("hello", 1, 100) => true
 * @example isValidString("", 1, 100) => false
 */
export function isValidString(str: unknown, minLen = 1, maxLen = 255): str is string {
  return typeof str === 'string' && str.trim().length >= minLen && str.trim().length <= maxLen;
}

/**
 * Validate a UUID v4 string
 * @example isValidUUID("550e8400-e29b-41d4-a716-446655440000") => true
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str.trim());
}

/**
 * Validate a semver version string
 * @example isValidVersion("10.0.0") => true
 * @example isValidVersion("v1.2.3") => false (no prefix allowed)
 */
export function isValidVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version.trim());
}

/**
 * Validate that a value is a safe, non-prototypal-poisoned object
 */
export function isSafeObject(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return false;
  if (Array.isArray(obj)) return false;
  if ((obj as Record<string, unknown>).__proto__ !== Object.prototype && (obj as Record<string, unknown>).__proto__ !== null) return false;
  return true;
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}