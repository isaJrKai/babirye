/**
 * BABIRYE v10.0.0 — System Health Checker
 *
 * Provides comprehensive system health monitoring by running individual
 * checks against the database, API, memory, disk, and WebSocket services.
 * Results are cached with a configurable TTL to prevent excessive checking.
 *
 * Each individual check returns a `HealthCheckDetail` with a severity level
 * that maps to color-coded status indicators (green, yellow, red).
 */

'use client';

import { apiGet } from '@/lib/api-helpers';
import { isConnected as isWSConnected } from '@/lib/websocket-client';

// ============================================================================
// Types
// ============================================================================

/** Severity levels for health check results. */
export type HealthSeverity = 'green' | 'yellow' | 'red';

/** Individual health check result detail. */
export interface HealthCheckDetail {
  /** The name/identifier of the check. */
  name: string;
  /** Human-readable description of what was checked. */
  description: string;
  /** Severity level: green (healthy), yellow (warning), red (critical). */
  severity: HealthSeverity;
  /** Additional detail or error message. */
  detail?: string;
  /** Duration of the check in milliseconds. */
  durationMs: number;
  /** Whether the check passed. */
  passed: boolean;
}

/** Individual memory or disk metric. */
export interface ResourceMetric {
  /** Current usage value. */
  used: number;
  /** Maximum available value. */
  total: number;
  /** Usage as a percentage (0–100). */
  percent: number;
  /** Human-readable label (e.g. "1.2 GB / 4.0 GB"). */
  label: string;
}

/** Connection status detail. */
export interface ConnectionStatus {
  /** Whether the connection is active. */
  connected: boolean;
  /** Number of active connections. */
  count: number;
  /** Connection type or label. */
  type: string;
}

/** Comprehensive health check result. */
export interface HealthCheckResult {
  /** Overall system health status. */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Overall severity level. */
  severity: HealthSeverity;
  /** Individual check details. */
  details: HealthCheckDetail[];
  /** Timestamp when the check was performed. */
  timestamp: string;
  /** Total time to complete all checks in milliseconds. */
  totalDurationMs: number;
  /** Memory usage metrics. */
  memory: ResourceMetric | null;
  /** Disk space metrics. */
  disk: ResourceMetric | null;
  /** Active connection counts. */
  connections: ConnectionStatus[];
  /** Whether the WebSocket service is connected. */
  wsConnected: boolean;
  /** When the database was last seeded. */
  lastSeedTime: string | null;
}

/** Configuration for the health checker. */
export interface HealthCheckConfig {
  /** Cache TTL in milliseconds (default 30000). */
  cacheTtlMs?: number;
  /** Timeout for individual checks in milliseconds (default 5000). */
  checkTimeoutMs?: number;
  /** Whether to skip the database check. */
  skipDatabase?: boolean;
  /** Whether to skip the WebSocket check. */
  skipWebSocket?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Default cache TTL: 30 seconds. */
const DEFAULT_CACHE_TTL_MS = 30_000;

/** Default individual check timeout: 5 seconds. */
const DEFAULT_CHECK_TIMEOUT_MS = 5_000;

/** Thresholds for severity levels. */
const MEMORY_WARNING_THRESHOLD = 75; // 75%
const MEMORY_CRITICAL_THRESHOLD = 90; // 90%
const DISK_WARNING_THRESHOLD = 80; // 80%
const DISK_CRITICAL_THRESHOLD = 95; // 95%
const API_SLOW_THRESHOLD_MS = 2000; // 2 seconds for "slow" API

// ============================================================================
// Cache
// ============================================================================

let cachedResult: HealthCheckResult | null = null;
let cachedAt = 0;
let cacheTtlMs = DEFAULT_CACHE_TTL_MS;

// ============================================================================
// Individual Checkers
// ============================================================================

/**
 * Check database connectivity by hitting a lightweight API endpoint.
 */
async function checkDatabase(timeoutMs: number): Promise<HealthCheckDetail> {
  const start = performance.now();

  try {
    const seedStatus = await Promise.race([
      apiGet<{ lastSeededAt?: string; seeded?: boolean }>('/seed/status'),
      createTimeoutPromise(timeoutMs, 'Database check timed out'),
    ]);

    const durationMs = Math.round(performance.now() - start);

    return {
      name: 'database',
      description: 'Database connectivity and responsiveness',
      severity: durationMs > API_SLOW_THRESHOLD_MS ? 'yellow' : 'green',
      detail: `Database responded in ${durationMs}ms`,
      durationMs,
      passed: true,
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    const message = error instanceof Error ? error.message : 'Database unreachable';

    return {
      name: 'database',
      description: 'Database connectivity and responsiveness',
      severity: 'red',
      detail: message,
      durationMs,
      passed: false,
    };
  }
}

/**
 * Check API responsiveness by hitting the dashboard endpoint.
 */
async function checkApi(timeoutMs: number): Promise<HealthCheckDetail> {
  const start = performance.now();

  try {
    await Promise.race([
      apiGet('/dashboard'),
      createTimeoutPromise(timeoutMs, 'API check timed out'),
    ]);

    const durationMs = Math.round(performance.now() - start);

    let severity: HealthSeverity = 'green';
    let detail = `API responded in ${durationMs}ms`;

    if (durationMs > API_SLOW_THRESHOLD_MS) {
      severity = 'yellow';
      detail = `API is slow (${durationMs}ms response time)`;
    }

    return {
      name: 'api',
      description: 'API endpoint responsiveness',
      severity,
      detail,
      durationMs,
      passed: true,
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    const message = error instanceof Error ? error.message : 'API unreachable';

    return {
      name: 'api',
      description: 'API endpoint responsiveness',
      severity: 'red',
      detail: message,
      durationMs,
      passed: false,
    };
  }
}

/**
 * Estimate memory usage from browser performance API.
 * Note: This provides limited data in browser environments.
 */
function checkMemory(): { detail: HealthCheckDetail; metric: ResourceMetric | null } {
  const start = performance.now();

  // Browser memory API (Chrome only, behind flag)
  const perf = performance as unknown as {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (perf.memory) {
    const used = perf.memory.usedJSHeapSize;
    const total = perf.memory.jsHeapSizeLimit;
    const percent = Math.round((used / total) * 100);
    const durationMs = Math.round(performance.now() - start);

    const severity: HealthSeverity =
      percent >= MEMORY_CRITICAL_THRESHOLD ? 'red' :
      percent >= MEMORY_WARNING_THRESHOLD ? 'yellow' : 'green';

    return {
      detail: {
        name: 'memory',
        description: 'JavaScript heap memory usage',
        severity,
        detail: `${formatBytes(used)} / ${formatBytes(total)} (${percent}%)`,
        durationMs,
        passed: severity !== 'red',
      },
      metric: {
        used,
        total,
        percent,
        label: `${formatBytes(used)} / ${formatBytes(total)}`,
      },
    };
  }

  // Fallback: no memory data available
  const durationMs = Math.round(performance.now() - start);

  return {
    detail: {
      name: 'memory',
      description: 'JavaScript heap memory usage',
      severity: 'yellow',
      detail: 'Memory API not available in this browser',
      durationMs,
      passed: true, // Not critical — just informational
    },
    metric: null,
  };
}

/**
 * Check available disk space via the Storage Estimation API.
 * Note: Only available in secure contexts (HTTPS/localhost).
 */
async function checkDisk(): Promise<{ detail: HealthCheckDetail; metric: ResourceMetric | null }> {
  const start = performance.now();

  if (!navigator.storage?.estimate) {
    const durationMs = Math.round(performance.now() - start);
    return {
      detail: {
        name: 'disk',
        description: 'Available storage space',
        severity: 'yellow',
        detail: 'Storage API not available',
        durationMs,
        passed: true,
      },
      metric: null,
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    const percent = quota > 0 ? Math.round((used / quota) * 100) : 0;
    const durationMs = Math.round(performance.now() - start);

    const severity: HealthSeverity =
      percent >= DISK_CRITICAL_THRESHOLD ? 'red' :
      percent >= DISK_WARNING_THRESHOLD ? 'yellow' : 'green';

    return {
      detail: {
        name: 'disk',
        description: 'Available storage space',
        severity,
        detail: `${formatBytes(used)} / ${formatBytes(quota)} (${percent}% used)`,
        durationMs,
        passed: severity !== 'red',
      },
      metric: {
        used,
        total: quota,
        percent,
        label: `${formatBytes(used)} / ${formatBytes(quota)}`,
      },
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    const message = error instanceof Error ? error.message : 'Disk check failed';

    return {
      detail: {
        name: 'disk',
        description: 'Available storage space',
        severity: 'yellow',
        detail: message,
        durationMs,
        passed: true,
      },
      metric: null,
    };
  }
}

/**
 * Check WebSocket connection status.
 */
function checkWebSocket(): HealthCheckDetail {
  const start = performance.now();
  const connected = isWSConnected();
  const durationMs = Math.round(performance.now() - start);

  return {
    name: 'websocket',
    description: 'WebSocket notification service connectivity',
    severity: connected ? 'green' : 'yellow',
    detail: connected ? 'WebSocket connected' : 'WebSocket disconnected (polling fallback active)',
    durationMs,
    passed: connected,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a promise that rejects after a timeout.
 */
function createTimeoutPromise<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Format bytes into a human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Compute overall health status from individual check details.
 */
function computeOverallStatus(details: HealthCheckDetail[]): {
  status: HealthCheckResult['status'];
  severity: HealthSeverity;
} {
  const hasRed = details.some((d) => d.severity === 'red');
  const hasYellow = details.some((d) => d.severity === 'yellow');

  if (hasRed) {
    return { status: 'unhealthy', severity: 'red' };
  }
  if (hasYellow) {
    return { status: 'degraded', severity: 'yellow' };
  }
  return { status: 'healthy', severity: 'green' };
}

/**
 * Determine the last seed time from the database check.
 */
function extractSeedTime(details: HealthCheckDetail[]): string | null {
  // In a real implementation this would come from the database check response
  // For now, return null as client-side cannot directly access this
  return null;
}

// ============================================================================
// Main Health Check Function
// ============================================================================

/**
 * Perform a comprehensive system health check.
 *
 * Runs the following checks in parallel:
 * 1. **Database** — Connectivity and response time via /api/seed/status
 * 2. **API** — Endpoint responsiveness via /api/dashboard
 * 3. **Memory** — JavaScript heap usage (Chrome only)
 * 4. **Disk** — Available storage space (Storage API)
 * 5. **WebSocket** — Connection status to the notification service
 *
 * Results are cached for the configured TTL (default 30 seconds).
 * Subsequent calls within the TTL window return the cached result.
 *
 * @param config - Optional configuration overrides
 * @returns Comprehensive health check result
 */
export async function performHealthCheck(
  config?: HealthCheckConfig
): Promise<HealthCheckResult> {
  const effectiveCacheTtl = config?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const checkTimeout = config?.checkTimeoutMs ?? DEFAULT_CHECK_TIMEOUT_MS;

  // Check cache
  if (
    cachedResult &&
    Date.now() - cachedAt < effectiveCacheTtl
  ) {
    return cachedResult;
  }

  // Update cache config
  cacheTtlMs = effectiveCacheTtl;

  const overallStart = performance.now();

  // Run all checks in parallel
  const [dbDetail, apiDetail, diskResult] = await Promise.all([
    config?.skipDatabase
      ? Promise.resolve({
          name: 'database' as const,
          description: 'Database connectivity',
          severity: 'green' as HealthSeverity,
          detail: 'Skipped',
          durationMs: 0,
          passed: true,
        })
      : checkDatabase(checkTimeout),
    checkApi(checkTimeout),
    checkDisk(),
  ]);

  // Synchronous checks
  const memoryResult = checkMemory();
  const wsDetail = config?.skipWebSocket
    ? {
        name: 'websocket' as const,
        description: 'WebSocket connectivity',
        severity: 'green' as HealthSeverity,
        detail: 'Skipped',
        durationMs: 0,
        passed: true,
      }
    : checkWebSocket();

  // Build the details array
  const details: HealthCheckDetail[] = [
    dbDetail,
    apiDetail,
    memoryResult.detail,
    diskResult.detail,
    wsDetail,
  ];

  // Compute overall status
  const { status, severity } = computeOverallStatus(details);
  const totalDurationMs = Math.round(performance.now() - overallStart);

  // Build connection status
  const connections: ConnectionStatus[] = [
    {
      connected: dbDetail.passed,
      count: dbDetail.passed ? 1 : 0,
      type: 'database',
    },
    {
      connected: apiDetail.passed,
      count: apiDetail.passed ? 1 : 0,
      type: 'api',
    },
    {
      connected: wsDetail.passed,
      count: wsDetail.passed ? 1 : 0,
      type: 'websocket',
    },
  ];

  const result: HealthCheckResult = {
    status,
    severity,
    details,
    timestamp: new Date().toISOString(),
    totalDurationMs,
    memory: memoryResult.metric,
    disk: diskResult.metric,
    connections,
    wsConnected: wsDetail.passed,
    lastSeedTime: extractSeedTime(details),
  };

  // Cache the result
  cachedResult = result;
  cachedAt = Date.now();

  return result;
}

// ============================================================================
// Quick Health Check
// ============================================================================

/**
 * Perform a quick boolean health check.
 *
 * Returns `true` if the system is healthy (no red-severity checks),
 * `false` if degraded or unhealthy.
 *
 * Uses the cache if available.
 *
 * @returns `true` if the system is healthy
 */
export async function isSystemHealthy(): Promise<boolean> {
  const result = await performHealthCheck();
  return result.severity === 'green';
}

/**
 * Synchronously check if the system was healthy at last check.
 * Uses the cached result only — does not perform new checks.
 *
 * @returns `true` if the last known health status was healthy, `null` if no check has been performed
 */
export function isSystemHealthyCached(): boolean | null {
  if (!cachedResult) return null;
  return cachedResult.severity === 'green';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the appropriate Tailwind color classes for a severity level.
 *
 * @param severity - The health severity level
 * @returns Object with bg, text, and border Tailwind classes
 */
export function getSeverityColors(severity: HealthSeverity): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (severity) {
    case 'green':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-500',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-500/15',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500/20',
        dot: 'bg-yellow-500',
      };
    case 'red':
      return {
        bg: 'bg-red-500/15',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-500/20',
        dot: 'bg-red-500',
      };
  }
}

/**
 * Get a human-readable label for a health status.
 *
 * @param status - The health status
 * @returns Human-readable status label
 */
export function getHealthStatusLabel(status: HealthCheckResult['status']): string {
  const labels: Record<HealthCheckResult['status'], string> = {
    healthy: 'All Systems Operational',
    degraded: 'Partial Degradation',
    unhealthy: 'System Issues Detected',
  };
  return labels[status] ?? status;
}

/**
 * Invalidate the health check cache, forcing a fresh check on next call.
 */
export function invalidateHealthCache(): void {
  cachedResult = null;
  cachedAt = 0;
}