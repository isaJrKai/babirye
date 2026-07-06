// ============================================================================
// BABIRYE - Complete TypeScript Type Definitions
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

// ============================================================================
// User & Auth Types
// ============================================================================

export type UserRole = 'admin' | 'operator' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface UserWithSecurity extends User {
  failedAttempts: number;
  lockedUntil: string | null;
}

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentStatus = 'idle' | 'running' | 'error' | 'disabled';

export interface Agent {
  id: string;
  name: string;
  domain: string;
  description: string;
  version: string;
  status: AgentStatus;
  config: string;
  metrics: string;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface AgentMetrics {
  cpuUsage: number;
  memoryUsage: number;
  tasksCompleted: number;
  tasksFailed: number;
  avgResponseTime: number;
  uptimeSeconds: number;
  errorRate: number;
  throughput: number;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TaskType =
  | 'forensic'
  | 'offensive'
  | 'defensive'
  | 'micro_defensive'
  | 'sensors'
  | 'vip'
  | 'potentials';

export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  agentId: string | null;
  creatorId: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  input: string;
  output: string | null;
  errorMessage: string | null;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  agent?: Agent;
  creator?: User;
}

export interface TaskCreateInput {
  agentId?: string;
  type: TaskType;
  priority?: number;
  input: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  type?: TaskType;
  agentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Wall Guard Types
// ============================================================================

export type GuardCategory =
  | 'injection'
  | 'exfiltration'
  | 'privilege'
  | 'integrity'
  | 'resource'
  | 'memory'
  | 'credential'
  | 'input_validation'
  | 'crypto'
  | 'supply_chain';

export type GuardSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface WallGuard {
  id: string;
  name: string;
  description: string;
  category: GuardCategory;
  isActive: boolean;
  blockCount: number;
  lastBlockedAt: string | null;
  severity: GuardSeverity;
  config: string;
  createdAt: string;
  updatedAt: string;
}

export interface WallBlock {
  id: string;
  guardId: string;
  action: string;
  service: string | null;
  params: string;
  clientIp: string | null;
  reason: string;
  createdAt: string;
  guard?: WallGuard;
}

export interface WallGuardStats {
  totalGuards: number;
  activeGuards: number;
  totalBlocks: number;
  blocksByCategory: Record<GuardCategory, number>;
  recentBlocks: WallBlock[];
  topBlockedIps: { ip: string; count: number }[];
}

// ============================================================================
// Council Types
// ============================================================================

export type VoteValue = 'approved' | 'rejected' | 'abstain' | 'veto';

export interface CouncilDomain {
  id: string;
  name: string;
  description: string;
  specialty: string;
  confidenceBase: number;
  isActive: boolean;
  weight: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    votes: number;
    decisions: number;
  };
}

export interface CouncilVote {
  id: string;
  domainId: string;
  userId: string | null;
  decisionId: string | null;
  vote: VoteValue;
  confidence: number;
  reasoning: string | null;
  createdAt: string;
}

export interface CouncilDecision {
  id: string;
  domainId: string;
  query: string;
  decision: string;
  confidence: number;
  vetoBy: string | null;
  reasoning: string;
  voteCount: number;
  approveCount: number;
  rejectCount: number;
  abstainCount: number;
  createdAt: string;
  votes?: CouncilVote[];
}

export interface CouncilConsensusResult {
  decision: CouncilDecision;
  isUnanimous: boolean;
  effectiveConfidence: number;
  domainParticipation: number;
}

// ============================================================================
// Tool Types - Forensic
// ============================================================================

export type ForensicToolStatus = 'dormant' | 'active' | 'error';

export interface ForensicTool {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: ForensicToolStatus;
  containerImage: string;
  port: number | null;
  config: string;
  lastDeployedAt: string | null;
}

// ============================================================================
// Tool Types - Offensive
// ============================================================================

export type OffensiveRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface OffensiveTool {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  version: string;
  status: string;
  containerImage: string;
  port: number | null;
  config: string;
  riskLevel: OffensiveRiskLevel;
  requiresAuth: boolean;
  lastDeployedAt: string | null;
}

// ============================================================================
// Tool Types - Defensive
// ============================================================================

export interface DefensiveTool {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  version: string;
  status: string;
  containerImage: string;
  config: string;
  autoDeploy: boolean;
  lastDeployedAt: string | null;
}

// ============================================================================
// Tool Types - Micro-Defensive
// ============================================================================

export interface MicroDefensiveTool {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  config: string;
  isActive: boolean;
  blockCount: number;
  lastTriggeredAt: string | null;
}

// ============================================================================
// Sensor Types
// ============================================================================

export interface Sensor {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  description: string;
  status: string;
  config: string;
  location: string | null;
  range: number | null;
  frequency: string | null;
  sensitivity: number;
  createdAt: string;
  updatedAt: string;
  latestReading?: SensorReading;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string | null;
  metadata: string;
  confidence: number;
  isAnomaly: boolean;
  anomalyScore: number | null;
  createdAt: string;
}

export interface SensorAnomaly {
  sensorId: string;
  sensorName: string;
  score: number;
  value: number;
  expectedRange: { min: number; max: number };
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// VIP Protection Types
// ============================================================================

export type VipThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type VipProtectionLevel = 'standard' | 'enhanced' | 'maximum' | 'ultra';
export type VipStatus = 'active' | 'inactive' | 'transit' | 'emergency';

export interface VipProfile {
  id: string;
  name: string;
  designation: string;
  threatLevel: string;
  protectionLevel: string;
  status: string;
  biometricHash: string | null;
  bleTagId: string | null;
  emergencyContact: string | null;
  medicalInfo: string | null;
  travelSchedule: string | null;
  _count?: {
    drones: number;
    vehicles: number;
    wearables: number;
    incidents: number;
  };
}

export interface VipDrone {
  id: string;
  vipId: string;
  name: string;
  model: string;
  status: string;
  batteryLevel: number;
  altitude: number | null;
  speed: number | null;
  gpsCoords: string | null;
  cameraActive: boolean;
  thermalActive: boolean;
  mission: string | null;
}

export interface VipVehicle {
  id: string;
  vipId: string;
  name: string;
  type: string;
  plate: string | null;
  status: string;
  fuelLevel: number;
  gpsCoords: string | null;
  driverId: string | null;
  route: string | null;
  speed: number | null;
  heading: number | null;
}

export interface VipWearable {
  id: string;
  vipId: string;
  type: string;
  deviceName: string;
  status: string;
  batteryLevel: number;
  heartRate: number | null;
  bloodPressure: string | null;
  temperature: number | null;
  sosTriggered: boolean;
  lastPingAt: string | null;
}

export interface VipIncident {
  id: string;
  vipId: string;
  type: string;
  severity: string;
  description: string;
  response: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface VipGeoFence {
  id: string;
  vipId: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  alertOnExit: boolean;
  alertOnEntry: boolean;
}

// ============================================================================
// Potential / Scenario Types
// ============================================================================

export type PotentialDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type PotentialImpact = 'low' | 'medium' | 'high' | 'critical';

export interface Potential {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string;
  requirements: string;
  difficulty: PotentialDifficulty;
  impact: PotentialImpact;
  isActive: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    scenarios: number;
  };
}

export interface Scenario {
  id: string;
  potentialId: string;
  name: string;
  description: string;
  preconditions: string;
  steps: string;
  expectedOutcome: string | null;
  riskAssessment: string | null;
  status: string;
}

// ============================================================================
// Security Alert Types
// ============================================================================

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertType =
  | 'intrusion'
  | 'malware'
  | 'anomaly'
  | 'policy_violation'
  | 'data_breach'
  | 'dos'
  | 'phishing';
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'false_positive' | 'escalated';

export interface SecurityAlert {
  id: string;
  toolId: string | null;
  source: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  ioc: string | null;
  status: AlertStatus;
  assignedTo: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  tool?: DefensiveTool;
}

export interface AlertFilter {
  severity?: AlertSeverity;
  type?: AlertType;
  status?: AlertStatus;
  search?: string;
  page?: number;
  limit?: number;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  details: string;
  ipAddress: string | null;
  userAgent: string | null;
  statusCode: number | null;
  durationMs: number | null;
  createdAt: string;
  user?: User;
}

export interface AuditFilter {
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Intelligence Feed Types
// ============================================================================

export interface IntelligenceFeed {
  id: string;
  name: string;
  source: string;
  feedType: string;
  url: string | null;
  apiKey: string | null;
  frequency: string;
  isActive: boolean;
  lastFetchedAt: string | null;
  lastError: string | null;
  itemCount: number;
  _count?: {
    items: number;
  };
}

export interface IntelItem {
  id: string;
  feedId: string;
  title: string;
  description: string;
  ioc: string | null;
  severity: string;
  confidence: number;
  tags: string;
  raw: string | null;
  isProcessed: boolean;
  createdAt: string;
}

// ============================================================================
// Arsenal Types
// ============================================================================

export interface Weapon {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  caliber: string | null;
  range: number | null;
  rateOfFire: string | null;
  magazineCapacity: number | null;
  status: string;
  serialNumber: string | null;
  assignedTo: string | null;
  lastInspectionAt: string | null;
}

export interface MartialArt {
  id: string;
  name: string;
  style: string;
  origin: string;
  description: string;
  techniques: string;
  difficulty: string;
  effectiveness: string;
}

// ============================================================================
// Gateway & Constitution Types
// ============================================================================

export interface SpaGateway {
  id: string;
  name: string;
  subsystem: string;
  port: number;
  host: string;
  isActive: boolean;
  secretHash: string;
  deployedServices: string;
  network: string | null;
}

export interface Constitution {
  id: string;
  name: string;
  subsystem: string;
  content: string;
  version: string;
  isActive: boolean;
}

// ============================================================================
// System Types
// ============================================================================

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  isSecret: boolean;
  description: string | null;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  format: string;
  content: string;
  summary: string | null;
  classification: string;
  generatedBy: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  actionUrl: string | null;
  metadata: string;
  expiresAt: string | null;
  createdAt: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  agents: {
    total: number;
    active: number;
  };
  tasks: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  sensors: {
    total: number;
    online: number;
    offline: number;
    onlinePercent: number;
  };
  wallGuard: {
    total: number;
    active: number;
    totalBlocks: number;
  };
  recentActivity: AuditLog[];
  recentAlerts: SecurityAlert[];
  systemMetrics: Record<string, unknown>;
  agentLoadPerDomain: Record<string, number>;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'full';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  detail?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BatchResponse<T> {
  results: { item: T; success: boolean; error?: string }[];
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
}

// ============================================================================
// Chart & Visualization Types
// ============================================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface GaugeConfig {
  min: number;
  max: number;
  value: number;
  label: string;
  unit?: string;
  thresholds?: {
    warning: number;
    danger: number;
  };
}

// ============================================================================
// Navigation & Layout Types
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  badge?: number | string;
  badgeColor?: string;
  children?: NavItem[];
  roles?: UserRole[];
  isExternal?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ============================================================================
// Real-time / WebSocket Types
// ============================================================================

export type WsEventType =
  | 'task:update'
  | 'task:created'
  | 'alert:new'
  | 'alert:update'
  | 'sensor:reading'
  | 'sensor:anomaly'
  | 'agent:status'
  | 'vip:sos'
  | 'wall:block'
  | 'system:notification'
  | 'council:vote'
  | 'council:decision';

export interface WsEvent {
  type: WsEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}