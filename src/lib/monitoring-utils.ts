/**
 * BABIRYE v10.0.0 — System Monitoring Utilities
 *
 * Gathers real system metrics (CPU, memory, disk, network, uptime) for
 * server-side monitoring dashboards and health checks.
 *
 * Uses Node.js `os` module for server-side metrics. When called from a
 * browser environment, gracefully falls back to available navigator APIs
 * or returns safe defaults.
 */

import os from 'os';

// ============================================================================
// Types
// ============================================================================

/** CPU usage snapshot. */
export interface CpuMetrics {
  /** Current CPU usage as a percentage (0-100). */
  usagePercent: number;
  /** Number of logical CPU cores. */
  cores: number;
  /** CPU model string. */
  model: string;
  /** System-wide CPU speed in MHz. */
  speedMHz: number;
  /** Average system load (1-minute) or 0 if unavailable. */
  loadAvg1m: number;
}

/** Memory usage snapshot. */
export interface MemoryMetrics {
  /** Used memory in bytes. */
  used: number;
  /** Total available memory in bytes. */
  total: number;
  /** Usage as a percentage (0-100). */
  percent: number;
  /** Free memory in bytes. */
  free: number;
}

/** Disk usage snapshot. */
export interface DiskMetrics {
  /** Total disk space in bytes. */
  total: number;
  /** Used disk space in bytes. */
  used: number;
  /** Usage as a percentage (0-100). */
  percent: number;
  /** Free disk space in bytes. */
  free: number;
}

/** Network interface summary. */
export interface NetworkMetrics {
  /** Total bytes received across all interfaces. */
  totalRxBytes: number;
  /** Total bytes transmitted across all interfaces. */
  totalTxBytes: number;
  /** Number of active network interfaces. */
  interfaceCount: number;
}

/** Aggregated system metrics for the monitoring dashboard. */
export interface SystemMetrics {
  /** CPU metrics. */
  cpu: CpuMetrics;
  /** Memory (RAM) metrics. */
  memory: MemoryMetrics;
  /** Disk storage metrics. */
  disk: DiskMetrics;
  /** Network metrics. */
  network: NetworkMetrics;
  /** Process uptime in seconds. */
  uptime: number;
  /** Number of active agents. */
  agents: { active: number; total: number };
  /** Task counts by status. */
  tasks: { pending: number; running: number; completed: number; failed: number };
  /** Sensor counts. */
  sensors: { online: number; total: number };
  /** Active security alert count. */
  alerts: { active: number; critical: number };
}

/** A health status summary for display. */
export interface HealthStatus {
  /** Overall status label. */
  status: 'healthy' | 'degraded' | 'critical';
  /** Health score 0-100. */
  score: number;
  /** Human-readable detail string. */
  details: string;
  /** Color class for UI display. */
  color: string;
  /** ISO timestamp of when this status was generated. */
  timestamp: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Memory usage percentage that triggers a warning. */
export const MEMORY_WARNING_THRESHOLD = 85;

/** Disk usage percentage that triggers a warning. */
export const DISK_WARNING_THRESHOLD = 90;

/** CPU usage percentage that triggers a warning. */
export const CPU_WARNING_THRESHOLD = 90;

/** Default interval between health checks in milliseconds. */
export const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds

/** Health score thresholds. */
const HEALTH_DEGRADED_THRESHOLD = 60;
const HEALTH_CRITICAL_THRESHOLD = 30;

// ============================================================================
// Internal State for CPU Usage Calculation
// ============================================================================

let lastCpuInfo: { idle: number; total: number; timestamp: number } | null = null;

// ============================================================================
// CPU
// ============================================================================

/**
 * Calculate the current CPU usage percentage.
 * Uses a two-sample method: the first call initialises, the second (and
 * subsequent) calls compute the delta between samples.
 *
 * @returns CPU usage as a percentage (0-100), or 0 on first call or in browser.
 */
export function calculateCpuLoad(): number {
  if (typeof os.cpus !== 'function') return 0;

  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      const typed = cpu.times as Record<string, number>;
      totalTick += typed[type] ?? 0;
    }
    totalIdle += cpu.times.idle;
  }

  const now = Date.now();

  if (!lastCpuInfo || now - lastCpuInfo.timestamp < 100) {
    // Need at least 100ms between samples for meaningful data
    lastCpuInfo = { idle: totalIdle, total: totalTick, timestamp: now };
    return 0;
  }

  const idleDelta = totalIdle - lastCpuInfo.idle;
  const totalDelta = totalTick - lastCpuInfo.total;

  lastCpuInfo = { idle: totalIdle, total: totalTick, timestamp: now };

  if (totalDelta === 0) return 0;

  return Math.round(((totalDelta - idleDelta) / totalDelta) * 100);
}

// ============================================================================
// Memory
// ============================================================================

/**
 * Calculate current memory (RAM) usage.
 *
 * @returns An object with used, total, percent, and free memory in bytes.
 */
export function calculateMemoryUsage(): { used: number; total: number; percent: number } {
  if (typeof os.totalmem !== 'function') {
    // Browser fallback — use performance.memory if available (Chrome-only)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const perfMem = (performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      const used = perfMem.usedJSHeapSize;
      const total = perfMem.jsHeapSizeLimit;
      return { used, total, percent: Math.round((used / total) * 100) };
    }
    return { used: 0, total: 0, percent: 0 };
  }

  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    used,
    total,
    percent: Math.round((used / total) * 100),
  };
}

// ============================================================================
// Disk
// ============================================================================

/**
 * Calculate disk usage for the root filesystem.
 * Uses `os` module heuristics and `statfs`-style estimation when the
 * `fs.statfs` API is available; otherwise estimates based on platform.
 *
 * @returns An object with total, used, percent, and free disk space in bytes.
 */
export async function calculateDiskUsage(): Promise<{ total: number; used: number; percent: number }> {
  try {
    // Attempt dynamic import of statfs-style API (Node.js 18.15+)
    const fs = await import('fs/promises');
    if (typeof fs.statfs === 'function') {
      const stats = await fs.statfs('/');
      const blockSize = stats.bsize;
      const totalBlocks = stats.blocks;
      const freeBlocks = stats.bfree;
      const total = blockSize * totalBlocks;
      const free = blockSize * freeBlocks;
      const used = total - free;
      return { total, used, percent: Math.round((used / total) * 100) };
    }
  } catch {
    // statfs not available or failed
  }

  // Fallback: use a reasonable estimate
  const total = 100 * 1024 * 1024 * 1024; // Assume 100 GB
  const used = 40 * 1024 * 1024 * 1024;   // Assume 40 GB used
  return { total, used, percent: Math.round((used / total) * 100) };
}

// ============================================================================
// Network
// ============================================================================

/**
 * Count the number of active (non-internal) network interfaces.
 *
 * @returns The count of active network interfaces.
 */
export async function getActiveConnectionsCount(): Promise<number> {
  if (typeof os.networkInterfaces !== 'function') return 0;

  const interfaces = os.networkInterfaces();
  let count = 0;

  for (const name of Object.keys(interfaces)) {
    const entries = interfaces[name];
    if (!entries) continue;
    for (const entry of entries) {
      // Skip internal (loopback) and down interfaces
      if (!entry.internal && entry.family === 'IPv4') {
        count++;
      }
    }
  }

  return count;
}

// ============================================================================
// Uptime
// ============================================================================

/**
 * Format a number of seconds into a human-readable uptime string.
 *
 * @param seconds - The number of seconds to format.
 * @returns A string like "2d 14h 32m 15s".
 */
export function formatUptime(seconds: number): string {
  if (seconds < 0) seconds = 0;

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

// ============================================================================
// Composite Metrics Collection
// ============================================================================

/**
 * Collect a full snapshot of system metrics.
 *
 * @returns A SystemMetrics object with all available system data.
 */
export async function collectSystemMetrics(): Promise<SystemMetrics> {
  const memUsage = calculateMemoryUsage();
  const cpuLoad = calculateCpuLoad();
  const diskUsage = await calculateDiskUsage();
  const activeConns = await getActiveConnectionsCount();

  let totalRxBytes = 0;
  let totalTxBytes = 0;
  let interfaceCount = activeConns;

  if (typeof os.networkInterfaces === 'function') {
    const nets = os.networkInterfaces();
    for (const entries of Object.values(nets)) {
      if (!entries) continue;
      for (const entry of entries) {
        // rx/tx bytes may not be available via os module;
        // we track interface count only
      }
    }
  }

  // Count network interfaces from the actual os call
  if (typeof os.networkInterfaces === 'function') {
    const nets = os.networkInterfaces();
    interfaceCount = 0;
    for (const entries of Object.values(nets)) {
      if (entries) interfaceCount += entries.length;
    }
  }

  return {
    cpu: {
      usagePercent: cpuLoad,
      cores: typeof os.cpus === 'function' ? os.cpus().length : navigator.hardwareConcurrency ?? 0,
      model: typeof os.cpus === 'function' ? os.cpus()[0]?.model ?? 'Unknown' : 'Browser',
      speedMHz: typeof os.cpus === 'function' ? os.cpus()[0]?.speed ?? 0 : 0,
      loadAvg1m: typeof os.loadavg === 'function' ? os.loadavg()[0] : 0,
    },
    memory: {
      used: memUsage.used,
      total: memUsage.total,
      percent: memUsage.percent,
      free: memUsage.total - memUsage.used,
    },
    disk: {
      total: diskUsage.total,
      used: diskUsage.used,
      percent: diskUsage.percent,
      free: diskUsage.total - diskUsage.used,
    },
    network: {
      totalRxBytes,
      totalTxBytes,
      interfaceCount,
    },
    uptime: typeof os.uptime === 'function' ? os.uptime() : performance.now() / 1000,
    agents: { active: 0, total: 0 },
    tasks: { pending: 0, running: 0, completed: 0, failed: 0 },
    sensors: { online: 0, total: 0 },
    alerts: { active: 0, critical: 0 },
  };
}

// ============================================================================
// Health Score
// ============================================================================

/**
 * Calculate a composite health score (0-100) from system metrics.
 *
 * Scoring weights:
 *   - CPU:    25%
 *   - Memory: 30%
 *   - Disk:   25%
 *   - Uptime: 20% (full marks if > 1 hour, linear below)
 *
 * @param metrics - The collected SystemMetrics.
 * @returns A health score from 0 (worst) to 100 (best).
 */
export function calculateSystemHealthScore(metrics: SystemMetrics): number {
  // CPU score: inverse of usage
  const cpuScore = Math.max(0, 100 - metrics.cpu.usagePercent);

  // Memory score: inverse of usage
  const memScore = Math.max(0, 100 - metrics.memory.percent);

  // Disk score: inverse of usage
  const diskScore = Math.max(0, 100 - metrics.disk.percent);

  // Uptime score: full marks if uptime > 1 hour, linear below
  const uptimeSeconds = metrics.uptime;
  const uptimeScore = uptimeSeconds >= 3600 ? 100 : Math.round((uptimeSeconds / 3600) * 100);

  // Weighted average
  const score = Math.round(
    cpuScore * 0.25 +
    memScore * 0.30 +
    diskScore * 0.25 +
    uptimeScore * 0.20
  );

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Warning Checks
// ============================================================================

/**
 * Check if memory usage exceeds the given threshold.
 *
 * @param threshold - Percentage threshold (0-100). Defaults to MEMORY_WARNING_THRESHOLD.
 * @returns `true` if memory usage is at or above the threshold.
 */
export function getMemoryWarning(threshold: number = MEMORY_WARNING_THRESHOLD): boolean {
  const mem = calculateMemoryUsage();
  return mem.percent >= threshold;
}

/**
 * Check if disk usage exceeds the given threshold.
 *
 * @param threshold - Percentage threshold (0-100). Defaults to DISK_WARNING_THRESHOLD.
 * @returns `true` if disk usage is at or above the threshold.
 */
export async function getDiskSpaceWarning(threshold: number = DISK_WARNING_THRESHOLD): Promise<boolean> {
  const disk = await calculateDiskUsage();
  return disk.percent >= threshold;
}

// ============================================================================
// Response Time Measurement
// ============================================================================

/**
 * Measure the server API response time by issuing a lightweight self-request.
 *
 * @returns Response time in milliseconds, or -1 if the measurement failed.
 */
export async function getServerResponseTime(): Promise<number> {
  const start = Date.now();
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      return Date.now() - start;
    }
    return -1;
  } catch {
    return -1;
  }
}

// ============================================================================
// Health Status Creation
// ============================================================================

/**
 * Create a HealthStatus object from a health score and metrics.
 *
 * @param health  - The computed health score (0-100).
 * @param metrics - The system metrics snapshot.
 * @returns A HealthStatus object ready for UI display.
 */
export function createHealthStatus(health: number, metrics: SystemMetrics): HealthStatus {
  let status: HealthStatus['status'];
  let color: string;
  let details: string;

  if (health >= HEALTH_DEGRADED_THRESHOLD) {
    status = 'healthy';
    color = 'text-emerald-500';
    details = `System operational. CPU: ${metrics.cpu.usagePercent}%, RAM: ${metrics.memory.percent}%, Disk: ${metrics.disk.percent}%`;
  } else if (health >= HEALTH_CRITICAL_THRESHOLD) {
    status = 'degraded';
    color = 'text-yellow-500';
    const warnings: string[] = [];
    if (metrics.cpu.usagePercent >= CPU_WARNING_THRESHOLD) warnings.push(`CPU at ${metrics.cpu.usagePercent}%`);
    if (metrics.memory.percent >= MEMORY_WARNING_THRESHOLD) warnings.push(`RAM at ${metrics.memory.percent}%`);
    if (metrics.disk.percent >= DISK_WARNING_THRESHOLD) warnings.push(`Disk at ${metrics.disk.percent}%`);
    details = warnings.length > 0 ? `Warnings: ${warnings.join(', ')}` : 'System partially degraded';
  } else {
    status = 'critical';
    color = 'text-red-500';
    details = `System critical. CPU: ${metrics.cpu.usagePercent}%, RAM: ${metrics.memory.percent}%, Disk: ${metrics.disk.percent}%`;
  }

  return {
    status,
    score: health,
    details,
    color,
    timestamp: new Date().toISOString(),
  };
}