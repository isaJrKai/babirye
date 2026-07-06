// ============================================================================
// BABIRYE - Data Transformation & Mapping Utilities
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

import type {
  Agent,
  AgentMetrics,
  Task,
  SecurityAlert,
  Sensor,
  SensorReading,
  WallGuard,
  CouncilDomain,
  VipProfile,
  VipDrone,
  VipVehicle,
  VipWearable,
  VipIncident,
  ForensicTool,
  OffensiveTool,
  DefensiveTool,
  MicroDefensiveTool,
  SystemSetting,
  WallBlock,
  CouncilDecision,
  PaginatedResponse,
  TimeSeriesPoint,
  ChartDataPoint,
} from './types';
import { AGENT_DOMAIN_LABELS, WALL_GUARD_CATEGORY_LABELS } from './constants';
import { formatRelativeTime, truncate, capitalize } from './formatters';

// ============================================================================
// Agent Transformers
// ============================================================================

/** Display card format for an agent. */
export interface AgentCard {
  id: string;
  name: string;
  domain: string;
  domainLabel: string;
  description: string;
  version: string;
  status: string;
  taskCount: number;
  lastActivity: string;
  metrics: AgentMetrics | null;
  createdAt: string;
}

/**
 * Convert an Agent DB model to a display card format.
 * Parses the JSON `metrics` field and resolves domain label.
 */
export function mapAgentToCard(agent: Agent): AgentCard {
  let metrics: AgentMetrics | null = null;
  try {
    metrics = typeof agent.metrics === 'string' ? JSON.parse(agent.metrics) as AgentMetrics : null;
  } catch { /* keep null */ }

  return {
    id: agent.id,
    name: agent.name,
    domain: agent.domain,
    domainLabel: AGENT_DOMAIN_LABELS[agent.domain] ?? capitalize(agent.domain),
    description: agent.description,
    version: agent.version,
    status: agent.status,
    taskCount: agent._count?.tasks ?? 0,
    lastActivity: agent.lastActivityAt ? formatRelativeTime(agent.lastActivityAt) : 'Never',
    metrics,
    createdAt: agent.createdAt,
  };
}

// ============================================================================
// Task Transformers
// ============================================================================

/** Table row format for a task. */
export interface TaskRow {
  id: string;
  type: string;
  status: string;
  priority: number;
  agentName: string;
  creatorName: string;
  progress: number;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

/**
 * Convert a Task DB model to a table row format.
 * Resolves agent and creator names from relations.
 */
export function mapTaskToRow(task: Task): TaskRow {
  return {
    id: task.id,
    type: task.type,
    status: task.status,
    priority: task.priority,
    agentName: task.agent?.name ?? 'Unassigned',
    creatorName: task.creator?.name ?? 'System',
    progress: task.progress,
    startedAt: task.startedAt ? formatRelativeTime(task.startedAt) : '—',
    completedAt: task.completedAt ? formatRelativeTime(task.completedAt) : '—',
    createdAt: formatRelativeTime(task.createdAt),
  };
}

// ============================================================================
// Alert Transformers
// ============================================================================

/** Summary card format for a security alert. */
export interface AlertCard {
  id: string;
  title: string;
  type: string;
  severity: string;
  severityStyle: string;
  status: string;
  source: string;
  description: string;
  assignedTo: string;
  createdAt: string;
}

/**
 * Convert an alert to a summary card with severity styling.
 * Uses the SEVERITY_BG_COLORS mapping for Tailwind classes.
 */
export function mapAlertToCard(alert: SecurityAlert): AlertCard {
  const severityMap: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20',
    high: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20',
    medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20',
    low: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
    info: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border border-gray-500/20',
  };

  return {
    id: alert.id,
    title: alert.title,
    type: alert.type,
    severity: alert.severity,
    severityStyle: severityMap[alert.severity] ?? severityMap.info,
    status: alert.status,
    source: alert.source,
    description: truncate(alert.description, 120),
    assignedTo: alert.assignedTo ?? 'Unassigned',
    createdAt: formatRelativeTime(alert.createdAt),
  };
}

// ============================================================================
// Sensor Transformers
// ============================================================================

/** Card format for a sensor with optional latest reading. */
export interface SensorCard {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  status: string;
  location: string | null;
  sensitivity: number;
  latestValue: number | null;
  latestUnit: string | null;
  isAnomaly: boolean;
  lastReadingAt: string | null;
  createdAt: string;
}

/**
 * Convert a sensor to a card with latest reading value.
 */
export function mapSensorToCard(sensor: Sensor, latestReading?: SensorReading): SensorCard {
  return {
    id: sensor.id,
    name: sensor.name,
    type: sensor.type,
    subtype: sensor.subtype,
    status: sensor.status,
    location: sensor.location,
    sensitivity: sensor.sensitivity,
    latestValue: latestReading?.value ?? null,
    latestUnit: latestReading?.unit ?? null,
    isAnomaly: latestReading?.isAnomaly ?? false,
    lastReadingAt: latestReading ? formatRelativeTime(latestReading.createdAt) : null,
    createdAt: formatRelativeTime(sensor.createdAt),
  };
}

// ============================================================================
// Wall Guard Transformers
// ============================================================================

/** Card format for a wall guard with block stats. */
export interface WallGuardCard {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  severity: string;
  isActive: boolean;
  blockCount: number;
  lastBlockedAt: string;
}

/**
 * Convert a wall guard to a card with block statistics.
 */
export function mapWallGuardToCard(guard: WallGuard): WallGuardCard {
  return {
    id: guard.id,
    name: guard.name,
    description: truncate(guard.description, 100),
    category: guard.category,
    categoryLabel: WALL_GUARD_CATEGORY_LABELS[guard.category] ?? capitalize(guard.category),
    severity: guard.severity,
    isActive: guard.isActive,
    blockCount: guard.blockCount,
    lastBlockedAt: guard.lastBlockedAt ? formatRelativeTime(guard.lastBlockedAt) : 'Never',
  };
}

// ============================================================================
// Council Domain Transformers
// ============================================================================

/** Card format for a council domain with vote stats. */
export interface CouncilDomainCard {
  id: string;
  name: string;
  description: string;
  specialty: string;
  confidenceBase: number;
  isActive: boolean;
  weight: number;
  voteCount: number;
  decisionCount: number;
}

/**
 * Convert a council domain to a card with vote statistics.
 */
export function mapCouncilDomainToCard(domain: CouncilDomain): CouncilDomainCard {
  return {
    id: domain.id,
    name: domain.name,
    description: truncate(domain.description, 100),
    specialty: domain.specialty,
    confidenceBase: domain.confidenceBase,
    isActive: domain.isActive,
    weight: domain.weight,
    voteCount: domain._count?.votes ?? 0,
    decisionCount: domain._count?.decisions ?? 0,
  };
}

// ============================================================================
// VIP Profile Transformers
// ============================================================================

/** Summary card for a VIP profile with resource counts. */
export interface VipProfileCard {
  id: string;
  name: string;
  designation: string;
  threatLevel: string;
  protectionLevel: string;
  status: string;
  emergencyContact: string | null;
  droneCount: number;
  vehicleCount: number;
  wearableCount: number;
  incidentCount: number;
  activeSosDevices: number;
}

/**
 * Convert a VIP profile to a summary card with associated resource counts.
 */
export function mapVipProfileToCard(
  profile: VipProfile,
  drones?: VipDrone[],
  vehicles?: VipVehicle[],
  wearables?: VipWearable[],
  incidents?: VipIncident[]
): VipProfileCard {
  const activeSosDevices = wearables?.filter((w) => w.sosTriggered).length ?? 0;

  return {
    id: profile.id,
    name: profile.name,
    designation: profile.designation,
    threatLevel: profile.threatLevel,
    protectionLevel: profile.protectionLevel,
    status: profile.status,
    emergencyContact: profile.emergencyContact,
    droneCount: profile._count?.drones ?? drones?.length ?? 0,
    vehicleCount: profile._count?.vehicles ?? vehicles?.length ?? 0,
    wearableCount: profile._count?.wearables ?? wearables?.length ?? 0,
    incidentCount: profile._count?.incidents ?? incidents?.length ?? 0,
    activeSosDevices,
  };
}

// ============================================================================
// Generic Tool Transformers
// ============================================================================

/** Generic tool card for any tool type. */
export interface ToolCard {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: string;
  containerImage: string;
  port: number | null;
  lastDeployedAt: string;
  /** Extra fields specific to each tool type. */
  extra: Record<string, unknown>;
}

/**
 * Generic mapper for any tool type (forensic, offensive, defensive, micro-defensive).
 */
export function mapToolToCard(
  tool: ForensicTool | OffensiveTool | DefensiveTool | MicroDefensiveTool,
  type: 'forensic' | 'offensive' | 'defensive' | 'micro_defensive'
): ToolCard {
  const extra: Record<string, unknown> = {};

  if (type === 'offensive' && 'riskLevel' in tool) {
    extra.riskLevel = (tool as OffensiveTool).riskLevel;
    extra.requiresAuth = (tool as OffensiveTool).requiresAuth;
    extra.subcategory = (tool as OffensiveTool).subcategory;
  }
  if (type === 'defensive') {
    extra.autoDeploy = (tool as DefensiveTool).autoDeploy;
    extra.subcategory = (tool as DefensiveTool).subcategory;
  }
  if (type === 'micro_defensive') {
    extra.isActive = (tool as MicroDefensiveTool).isActive;
    extra.blockCount = (tool as MicroDefensiveTool).blockCount;
  }

  return {
    id: tool.id,
    name: tool.name,
    category: 'category' in tool ? (tool as { category: string }).category : type,
    description: truncate(tool.description, 120),
    version: 'version' in tool ? (tool as { version: string }).version : '1.0.0',
    status: tool.status,
    containerImage: 'containerImage' in tool ? (tool as { containerImage: string }).containerImage : '',
    port: 'port' in tool ? (tool as { port: number | null }).port : null,
    lastDeployedAt: 'lastDeployedAt' in tool && (tool as { lastDeployedAt: Date | string | null }).lastDeployedAt ? formatRelativeTime(String((tool as { lastDeployedAt: Date | string }).lastDeployedAt)) : 'Never',
    extra,
  };
}

// ============================================================================
// System Setting Transformers
// ============================================================================

/** Table row format for a system setting. */
export interface SettingRow {
  id: string;
  key: string;
  value: string;
  category: string;
  isSecret: boolean;
  description: string | null;
}

/**
 * Convert a system setting to a table row.
 */
export function mapSettingToRow(setting: SystemSetting): SettingRow {
  return {
    id: setting.id,
    key: setting.key,
    value: setting.isSecret ? '••••••••' : setting.value,
    category: setting.category,
    isSecret: setting.isSecret,
    description: setting.description,
  };
}

// ============================================================================
// API Response Utilities
// ============================================================================

/**
 * Extract the data array from a paginated API response wrapper.
 * Handles both `PaginatedResponse<T>` and raw `T[]`.
 */
export function flattenApiResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'data' in data) {
    const resp = data as PaginatedResponse<T>;
    return Array.isArray(resp.data) ? resp.data : [];
  }
  return [];
}

// ============================================================================
// Chart Data Generators
// ============================================================================

/**
 * Generate time-series chart data from an alerts array.
 * Groups alerts by time bucket (hour, day, week) and severity.
 *
 * @param alerts - Array of security alerts
 * @param period - Grouping period: 'hour' | 'day' | 'week'
 * @returns Time-series data points with label and value
 */
export function createChartData(
  alerts: SecurityAlert[],
  period: 'hour' | 'day' | 'week' = 'day'
): TimeSeriesPoint[] {
  const now = new Date();
  const buckets = new Map<string, number>();
  const msPerBucket =
    period === 'hour' ? 3_600_000 : period === 'day' ? 86_400_000 : 604_800_000;
  const bucketCount = 24; // Show last 24 buckets

  // Initialize buckets
  for (let i = bucketCount - 1; i >= 0; i--) {
    const bucketTime = new Date(now.getTime() - i * msPerBucket);
    const key = bucketTime.toISOString().slice(0, period === 'hour' ? 13 : 10);
    buckets.set(key, 0);
  }

  // Count alerts per bucket
  for (const alert of alerts) {
    const alertTime = new Date(alert.createdAt);
    const key = alertTime.toISOString().slice(0, period === 'hour' ? 13 : 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({
    timestamp: label,
    value,
    label,
  }));
}

/**
 * Generate time-series chart data from sensor readings.
 *
 * @param sensors - Array of sensors (readings are typically pre-loaded)
 * @returns Time-series data with sensor value over time
 */
export function createSensorChartData(sensors: Array<Sensor & { readings?: SensorReading[] }>): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  for (const sensor of sensors) {
    const readings = sensor.readings ?? [];
    for (const reading of readings.slice(-50)) {
      points.push({
        timestamp: reading.createdAt,
        value: reading.value,
        label: `${sensor.name}: ${reading.value}${reading.unit ? ` ${reading.unit}` : ''}`,
      });
    }
  }
  return points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Generate wall block timeline data from block records.
 *
 * @param blocks - Array of wall block records
 * @param period - Grouping period
 * @returns Time-series data of blocks over time
 */
export function createWallBlockChartData(
  blocks: WallBlock[],
  period: 'hour' | 'day' | 'week' = 'day'
): TimeSeriesPoint[] {
  const msPerBucket =
    period === 'hour' ? 3_600_000 : period === 'day' ? 86_400_000 : 604_800_000;
  const buckets = new Map<string, number>();

  for (const block of blocks) {
    const time = new Date(block.createdAt);
    const key = time.toISOString().slice(0, period === 'hour' ? 13 : 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, value]) => ({ timestamp, value, label: timestamp }));
}

/**
 * Generate decision trend data from council decisions.
 *
 * @param decisions - Array of council decisions
 * @param period - Grouping period
 * @returns Time-series data of decisions over time
 */
export function createCouncilChartData(
  decisions: CouncilDecision[],
  period: 'hour' | 'day' | 'week' = 'day'
): TimeSeriesPoint[] {
  const msPerBucket =
    period === 'hour' ? 3_600_000 : period === 'day' ? 86_400_000 : 604_800_000;
  const buckets = new Map<string, number>();

  for (const decision of decisions) {
    const time = new Date(decision.createdAt);
    const key = time.toISOString().slice(0, period === 'hour' ? 13 : 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, value]) => ({ timestamp, value, label: timestamp }));
}

/**
 * Generate agent load distribution data from task assignments.
 *
 * @param tasks - Array of tasks (agent relation should be loaded)
 * @returns Chart data points showing task count per agent
 */
export function createAgentLoadData(tasks: Task[]): ChartDataPoint[] {
  const loadMap = new Map<string, number>();

  for (const task of tasks) {
    const agentName = task.agent?.name ?? 'Unassigned';
    loadMap.set(agentName, (loadMap.get(agentName) ?? 0) + 1);
  }

  return Array.from(loadMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value }));
}