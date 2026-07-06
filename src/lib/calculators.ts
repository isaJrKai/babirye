// ============================================================================
// BABIRYE - Security Calculation Utilities
// ============================================================================

import type { WallGuard } from './types';

/**
 * Calculate a composite risk score based on threats, vulnerabilities, and controls.
 * Uses the standard risk formula: Risk = (Threats × Vulnerabilities) / Controls
 * Returns a score between 0 and 100.
 *
 * @param threats - Number or weight of identified threats (0-10)
 * @param vulnerabilities - Number or weight of identified vulnerabilities (0-10)
 * @param controls - Number or weight of active controls (0-10)
 * @returns Risk score from 0 to 100
 *
 * @example calculateRiskScore(8, 6, 4) => 96
 * @example calculateRiskScore(2, 3, 9) => 4.2
 */
export function calculateRiskScore(threats: number, vulnerabilities: number, controls: number): number {
  if (controls <= 0) return 100;
  const rawScore = ((threats * vulnerabilities) / controls) * 10;
  return Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
}

/**
 * Calculate the confidence level of a council decision.
 * Factors in approval ratio, veto penalty, and base confidence.
 *
 * @param approved - Number of approve votes
 * @param total - Total number of votes cast
 * @param vetoes - Number of veto votes
 * @returns Confidence score from 0 to 100
 *
 * @example calculateConfidence(8, 10, 0) => 80
 * @example calculateConfidence(5, 10, 1) => 40 (veto penalty)
 */
export function calculateConfidence(approved: number, total: number, vetoes: number): number {
  if (total <= 0) return 0;
  const approvalRatio = approved / total;

  // Veto penalty: each veto reduces confidence by 20%, minimum 0
  const vetoPenalty = Math.max(0, 1 - vetoes * 0.2);

  const confidence = approvalRatio * vetoPenalty * 100;
  return Math.min(100, Math.max(0, Math.round(confidence * 10) / 10));
}

/**
 * Determine the threat level from an array of scores.
 * Uses weighted thresholds based on the distribution of scores.
 *
 * @param scores - Array of numeric scores (0-100)
 * @returns Threat level classification
 *
 * @example calculateThreatLevel([95, 88, 91]) => "critical"
 * @example calculateThreatLevel([30, 45, 20]) => "medium"
 * @example calculateThreatLevel([]) => "low"
 */
export function calculateThreatLevel(scores: number[]): 'low' | 'medium' | 'high' | 'critical' {
  if (scores.length === 0) return 'low';

  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const max = Math.max(...scores);

  // Use a weighted combination of average and max to determine threat level
  const effective = avg * 0.6 + max * 0.4;

  if (effective >= 80) return 'critical';
  if (effective >= 60) return 'high';
  if (effective >= 35) return 'medium';
  return 'low';
}

/**
 * Calculate overall sensor network health as a percentage.
 *
 * @param online - Number of sensors currently online
 * @param total - Total number of sensors in the network
 * @returns Health percentage (0-100)
 *
 * @example calculateSensorHealth(45, 50) => 90
 * @example calculateSensorHealth(0, 10) => 0
 */
export function calculateSensorHealth(online: number, total: number): number {
  if (total <= 0) return 0;
  const health = (online / total) * 100;
  return Math.round(health * 10) / 10;
}

/**
 * Calculate the overall health score of the Wall Guard system.
 * Factors in: active guard ratio, coverage across categories, and recency of activity.
 *
 * @param guards - Array of WallGuard objects
 * @returns Health score from 0 to 100
 *
 * @example calculateWallHealth(guards) => 87.5
 */
export function calculateWallHealth(guards: WallGuard[]): number {
  if (guards.length === 0) return 0;

  // Factor 1: Active guard ratio (40% weight)
  const activeCount = guards.filter((g) => g.isActive).length;
  const activeRatio = activeCount / guards.length;

  // Factor 2: Category coverage (30% weight)
  const uniqueCategories = new Set(guards.map((g) => g.category)).size;
  const expectedCategories = 10; // Total wall guard categories
  const categoryCoverage = Math.min(1, uniqueCategories / expectedCategories);

  // Factor 3: Recency score (30% weight) - guards with recent activity are healthy
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const recentGuards = guards.filter((g) => {
    if (!g.lastBlockedAt) return false;
    return now - new Date(g.lastBlockedAt).getTime() < oneWeekMs;
  });
  const recencyScore = guards.length > 0 ? recentGuards.length / guards.length : 0;

  const health =
    activeRatio * 40 + categoryCoverage * 30 + recencyScore * 30;

  return Math.round(Math.min(100, Math.max(0, health)) * 10) / 10;
}

/**
 * Calculate system uptime percentage from metrics.
 *
 * @param metrics - Object containing uptime-related metrics
 * @param metrics.totalUptimeMs - Total time the system has been up (ms)
 * @param metrics.totalDowntimeMs - Total time the system has been down (ms)
 * @returns Uptime percentage (0-100)
 *
 * @example calculateSystemUptime({ totalUptimeMs: 86400000, totalDowntimeMs: 2592000 }) => 97.1
 */
export function calculateSystemUptime(metrics: {
  totalUptimeMs?: number;
  totalDowntimeMs?: number;
  uptimePercent?: number;
}): number {
  // If uptime percent is provided directly, use it
  if (typeof metrics.uptimePercent === 'number' && Number.isFinite(metrics.uptimePercent)) {
    return Math.round(Math.min(100, Math.max(0, metrics.uptimePercent)) * 100) / 100;
  }

  const uptime = metrics.totalUptimeMs ?? 0;
  const downtime = metrics.totalDowntimeMs ?? 0;
  const total = uptime + downtime;

  if (total <= 0) return 100;

  const percent = (uptime / total) * 100;
  return Math.round(Math.min(100, Math.max(0, percent)) * 100) / 100;
}

/**
 * Calculate the CVSS-like exploitability score (simplified).
 *
 * @param attackVector - How the vulnerability can be exploited (network, adjacent, local, physical)
 * @param complexity - Attack complexity (low, high)
 * @param privileges - Required privileges (none, low, high)
 * @param interaction - User interaction required (none, required)
 * @returns Exploitability score from 0 to 10
 */
export function calculateExploitabilityScore(
  attackVector: 'network' | 'adjacent' | 'local' | 'physical',
  complexity: 'low' | 'high',
  privileges: 'none' | 'low' | 'high',
  interaction: 'none' | 'required'
): number {
  const avScores: Record<string, number> = { network: 0.85, adjacent: 0.62, local: 0.55, physical: 0.2 };
  const cScores: Record<string, number> = { low: 0.77, high: 0.44 };
  const pScores: Record<string, number> = { none: 0.85, low: 0.68, high: 0.5 };
  const iScores: Record<string, number> = { none: 0.85, required: 0.62 };

  const score = 8.22 * avScores[attackVector] * cScores[complexity] * pScores[privileges] * iScores[interaction];
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}

/**
 * Calculate the anomaly score for sensor readings based on deviation from expected range.
 *
 * @param value - The current sensor reading value
 * @param expectedMin - Expected minimum value
 * @param expectedMax - Expected maximum value
 * @returns Anomaly score from 0 (normal) to 1 (maximum anomaly)
 */
export function calculateAnomalyScore(value: number, expectedMin: number, expectedMax: number): number {
  const range = expectedMax - expectedMin;
  if (range <= 0) return value === expectedMin ? 0 : 1;

  const midpoint = (expectedMax + expectedMin) / 2;
  const normalizedDeviation = Math.abs(value - midpoint) / (range / 2);

  // Sigmoid-like mapping: scores increase rapidly beyond the expected range
  if (value < expectedMin) {
    const deviation = (expectedMin - value) / range;
    return Math.min(1, 0.5 + deviation * 2);
  }
  if (value > expectedMax) {
    const deviation = (value - expectedMax) / range;
    return Math.min(1, 0.5 + deviation * 2);
  }

  // Within range: scale from 0 to 0.5 based on distance from midpoint
  return Math.round(normalizedDeviation * 0.5 * 100) / 100;
}

/**
 * Calculate VIP threat score based on multiple factors.
 *
 * @param threatLevel - Base threat level (1-10)
 * @param incidentCount - Number of recent incidents
 * @param protectionLevel - Current protection level (1-10)
 * @param locationRisk - Location risk factor (0-1)
 * @returns VIP threat score from 0 to 100
 */
export function calculateVipThreatScore(
  threatLevel: number,
  incidentCount: number,
  protectionLevel: number,
  locationRisk: number
): number {
  const threatWeight = threatLevel * 6; // Max 60
  const incidentWeight = Math.min(incidentCount * 5, 20); // Max 20
  const protectionReduction = Math.min(protectionLevel * 2, 20); // Max 20 reduction
  const locationWeight = locationRisk * 40; // Max 40

  const rawScore = threatWeight + incidentWeight + locationWeight - protectionReduction;
  return Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
}