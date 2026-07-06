/**
 * BABIRYE v10.0.0 — Test Helper Utilities
 *
 * Mock data factories and API response simulators for testing.
 * All factories accept partial overrides so you only specify what differs
 * from the sensible defaults.
 *
 * NOTE: Test-only module. Do not import in production code paths.
 */

import type {
  User,
  UserRole,
  Agent,
  AgentStatus,
  Task,
  TaskStatus,
  TaskType,
  TaskPriority,
  SecurityAlert,
  AlertSeverity,
  AlertType,
  AlertStatus,
  Sensor,
  DashboardStats,
  AuditLog,
  WallGuard,
  CouncilDomain,
  CouncilDecision,
  ForensicTool,
  OffensiveTool,
  DefensiveTool,
  MicroDefensiveTool,
  VipProfile,
  VipDrone,
  VipVehicle,
  VipWearable,
  VipIncident,
  Potential,
  IntelligenceFeed,
  IntelItem,
  Weapon,
  MartialArt,
  SpaGateway,
  Constitution,
  SystemSetting,
  Report,
  Notification,
  SensorReading,
} from './types';

// ============================================================================
// Counter helpers for unique IDs
// ============================================================================

let userCounter = 0;
let agentCounter = 0;
let taskCounter = 0;
let alertCounter = 0;
let sensorCounter = 0;

function nextId(prefix: string, counter: { value: number }): string {
  counter.value += 1;
  return `${prefix}-${counter.value.toString().padStart(4, '0')}`;
}

// ============================================================================
// API Response Simulators
// ============================================================================

/**
 * Simulates a successful API response with an optional artificial delay.
 * Useful for testing loading states and async flows.
 */
export async function mockApiResponse<T>(data: T, delay: number = 0): Promise<T> {
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return data;
}

/**
 * Simulates an API error response.
 * Rejects with an error that mimics the shape of ApiClientError.
 */
export async function mockApiError(
  status: number,
  message: string,
  detail?: string
): Promise<never> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const error = new Error(message) as Error & { statusCode: number; detail?: string };
  error.name = 'ApiClientError';
  error.statusCode = status;
  if (detail) error.detail = detail;
  throw error;
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates a mock User object with sensible defaults.
 * Pass partial overrides to customise specific fields.
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  userCounter += 1;
  const roles: UserRole[] = ['admin', 'operator', 'analyst', 'viewer'];
  return {
    id: overrides.id ?? nextId('usr', { value: userCounter - 1 }),
    email: overrides.email ?? `user${userCounter}@babirye.local`,
    name: overrides.name ?? `Test User ${userCounter}`,
    role: overrides.role ?? roles[(userCounter - 1) % roles.length],
    isActive: overrides.isActive ?? true,
    mfaEnabled: overrides.mfaEnabled ?? false,
    lastLoginAt: overrides.lastLoginAt ?? '2025-01-15T10:30:00.000Z',
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Creates a mock Agent object with sensible defaults.
 */
export function createMockAgent(overrides: Partial<Agent> = {}): Agent {
  agentCounter += 1;
  const statuses: AgentStatus[] = ['idle', 'running', 'error', 'disabled'];
  return {
    id: overrides.id ?? nextId('agn', { value: agentCounter - 1 }),
    name: overrides.name ?? `Agent ${agentCounter}`,
    domain: overrides.domain ?? `domain-${agentCounter}`,
    description: overrides.description ?? `Mock agent #${agentCounter} for testing purposes`,
    version: overrides.version ?? '1.0.0',
    status: overrides.status ?? statuses[(agentCounter - 1) % statuses.length],
    config: overrides.config ?? '{}',
    metrics: overrides.metrics ?? JSON.stringify({
      cpuUsage: 12.5,
      memoryUsage: 256,
      tasksCompleted: 42,
      tasksFailed: 1,
      avgResponseTime: 120,
      uptimeSeconds: 86400,
      errorRate: 0.02,
      throughput: 15.3,
    }),
    lastActivityAt: overrides.lastActivityAt ?? '2025-01-15T14:22:00.000Z',
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-01-15T14:22:00.000Z',
    _count: overrides._count ?? { tasks: 10 },
    ...overrides,
  };
}

/**
 * Creates a mock Task object with sensible defaults.
 */
export function createMockTask(overrides: Partial<Task> = {}): Task {
  taskCounter += 1;
  const statuses: TaskStatus[] = ['pending', 'running', 'completed', 'failed', 'cancelled'];
  const types: TaskType[] = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];
  return {
    id: overrides.id ?? nextId('tsk', { value: taskCounter - 1 }),
    agentId: overrides.agentId ?? 'agn-0001',
    creatorId: overrides.creatorId ?? 'usr-0001',
    type: overrides.type ?? types[(taskCounter - 1) % types.length],
    status: overrides.status ?? statuses[(taskCounter - 1) % statuses.length],
    priority: (overrides.priority ?? ((taskCounter % 5) + 1) as TaskPriority),
    input: overrides.input ?? JSON.stringify({ target: '192.168.1.100', scanType: 'full' }),
    output: overrides.output ?? null,
    errorMessage: overrides.errorMessage ?? null,
    progress: overrides.progress ?? 0,
    startedAt: overrides.startedAt ?? null,
    completedAt: overrides.completedAt ?? null,
    createdAt: overrides.createdAt ?? '2025-01-15T08:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-01-15T08:00:00.000Z',
    ...overrides,
  };
}

/**
 * Creates a mock SecurityAlert object with sensible defaults.
 */
export function createMockAlert(overrides: Partial<SecurityAlert> = {}): SecurityAlert {
  alertCounter += 1;
  const severities: AlertSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];
  const types: AlertType[] = ['intrusion', 'malware', 'anomaly', 'policy_violation', 'data_breach', 'dos', 'phishing'];
  const statuses: AlertStatus[] = ['new', 'investigating', 'resolved', 'false_positive', 'escalated'];
  return {
    id: overrides.id ?? nextId('alr', { value: alertCounter - 1 }),
    toolId: overrides.toolId ?? null,
    source: overrides.source ?? 'sensor-network',
    severity: overrides.severity ?? severities[(alertCounter - 1) % severities.length],
    type: overrides.type ?? types[(alertCounter - 1) % types.length],
    title: overrides.title ?? `Security Alert #${alertCounter}`,
    description: overrides.description ?? `Detected suspicious activity from source ${alertCounter}`,
    ioc: overrides.ioc ?? '10.0.0.55',
    status: overrides.status ?? statuses[(alertCounter - 1) % statuses.length],
    assignedTo: overrides.assignedTo ?? null,
    resolution: overrides.resolution ?? null,
    createdAt: overrides.createdAt ?? '2025-01-15T12:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-01-15T12:00:00.000Z',
    ...overrides,
  };
}

/**
 * Creates a mock Sensor object with sensible defaults.
 */
export function createMockSensor(overrides: Partial<Sensor> = {}): Sensor {
  sensorCounter += 1;
  const sensorTypes = ['motion', 'thermal', 'rf', 'audio', 'chemical', 'camera'];
  return {
    id: overrides.id ?? nextId('sns', { value: sensorCounter - 1 }),
    name: overrides.name ?? `Sensor ${sensorCounter}`,
    type: overrides.type ?? sensorTypes[(sensorCounter - 1) % sensorTypes.length],
    subtype: overrides.subtype ?? null,
    description: overrides.description ?? `Mock sensor #${sensorCounter}`,
    status: overrides.status ?? 'online',
    config: overrides.config ?? '{}',
    location: overrides.location ?? `Zone ${sensorCounter}`,
    range: overrides.range ?? 100,
    frequency: overrides.frequency ?? '2.4GHz',
    sensitivity: overrides.sensitivity ?? 0.75,
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-01-01T00:00:00.000Z',
    latestReading: overrides.latestReading ?? undefined,
    ...overrides,
  };
}

// ============================================================================
// Complex Mock Factories
// ============================================================================

/**
 * Creates a fully populated DashboardStats object for testing dashboard views.
 */
export function createMockDashboardStats(): DashboardStats {
  return {
    agents: {
      total: 12,
      active: 8,
    },
    tasks: {
      pending: 5,
      running: 3,
      completed: 147,
      failed: 8,
      total: 163,
    },
    alerts: {
      critical: 2,
      high: 5,
      medium: 12,
      low: 23,
      info: 41,
      total: 83,
    },
    sensors: {
      total: 24,
      online: 20,
      offline: 4,
      onlinePercent: 83.3,
    },
    wallGuard: {
      total: 15,
      active: 13,
      totalBlocks: 1247,
    },
    recentActivity: Array.from({ length: 5 }, (_, i) => createMockAuditLog({ id: `aud-recent-${i}` })),
    recentAlerts: Array.from({ length: 5 }, (_, i) => createMockAlert({ id: `alr-recent-${i}` })),
    systemMetrics: {
      cpuUsage: 34.2,
      memoryUsage: 61.8,
      diskUsage: 45.3,
      networkIn: '12.4 MB/s',
      networkOut: '8.7 MB/s',
      uptime: '14d 7h 23m',
    },
    agentLoadPerDomain: {
      'network-analysis': 3,
      'threat-detection': 5,
      'forensics': 2,
      'vip-protection': 1,
    },
  };
}

// ============================================================================
// Additional Entity Mock Factories
// ============================================================================

/** Creates a mock AuditLog. */
export function createMockAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: overrides.id ?? 'aud-0001',
    userId: overrides.userId ?? 'usr-0001',
    action: overrides.action ?? 'login',
    resource: overrides.resource ?? 'auth',
    details: overrides.details ?? '{}',
    ipAddress: overrides.ipAddress ?? '10.0.0.1',
    userAgent: overrides.userAgent ?? 'Mozilla/5.0 (Test)',
    statusCode: overrides.statusCode ?? 200,
    durationMs: overrides.durationMs ?? 45,
    createdAt: overrides.createdAt ?? '2025-01-15T10:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock WallGuard. */
export function createMockWallGuard(overrides: Partial<WallGuard> = {}): WallGuard {
  return {
    id: overrides.id ?? 'wgd-0001',
    name: overrides.name ?? 'SQL Injection Guard',
    description: overrides.description ?? 'Detects and blocks SQL injection attempts',
    category: overrides.category ?? 'injection',
    isActive: overrides.isActive ?? true,
    blockCount: overrides.blockCount ?? 142,
    lastBlockedAt: overrides.lastBlockedAt ?? '2025-01-15T11:30:00.000Z',
    severity: overrides.severity ?? 'critical',
    config: overrides.config ?? '{}',
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-01-15T11:30:00.000Z',
    ...overrides,
  };
}

/** Creates a mock CouncilDomain. */
export function createMockCouncilDomain(overrides: Partial<CouncilDomain> = {}): CouncilDomain {
  return {
    id: overrides.id ?? 'cld-0001',
    name: overrides.name ?? 'Network Security',
    description: overrides.description ?? 'Evaluates network-level security decisions',
    specialty: overrides.specialty ?? 'network',
    confidenceBase: overrides.confidenceBase ?? 0.85,
    isActive: overrides.isActive ?? true,
    weight: overrides.weight ?? 1.0,
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-01-01T00:00:00.000Z',
    _count: overrides._count ?? { votes: 23, decisions: 8 },
    ...overrides,
  };
}

/** Creates a mock CouncilDecision. */
export function createMockCouncilDecision(overrides: Partial<CouncilDecision> = {}): CouncilDecision {
  return {
    id: overrides.id ?? 'dcs-0001',
    domainId: overrides.domainId ?? 'cld-0001',
    query: overrides.query ?? 'Should we block IP 10.0.0.55?',
    decision: overrides.decision ?? 'approved',
    confidence: overrides.confidence ?? 0.92,
    vetoBy: overrides.vetoBy ?? null,
    reasoning: overrides.reasoning ?? 'Multiple indicators confirm malicious intent',
    voteCount: overrides.voteCount ?? 5,
    approveCount: overrides.approveCount ?? 4,
    rejectCount: overrides.rejectCount ?? 0,
    abstainCount: overrides.abstainCount ?? 1,
    createdAt: overrides.createdAt ?? '2025-01-15T12:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock ForensicTool. */
export function createMockForensicTool(overrides: Partial<ForensicTool> = {}): ForensicTool {
  return {
    id: overrides.id ?? 'fnt-0001',
    name: overrides.name ?? 'Network Forensics Kit',
    category: overrides.category ?? 'network',
    description: overrides.description ?? 'Full network packet capture and analysis',
    version: overrides.version ?? '3.2.1',
    status: overrides.status ?? 'dormant',
    containerImage: overrides.containerImage ?? 'babirye/fnt-network:latest',
    port: overrides.port ?? 8080,
    config: overrides.config ?? '{}',
    lastDeployedAt: overrides.lastDeployedAt ?? null,
    ...overrides,
  };
}

/** Creates a mock OffensiveTool. */
export function createMockOffensiveTool(overrides: Partial<OffensiveTool> = {}): OffensiveTool {
  return {
    id: overrides.id ?? 'oft-0001',
    name: overrides.name ?? 'Pentest Scanner',
    category: overrides.category ?? 'reconnaissance',
    subcategory: overrides.subcategory ?? 'network-scan',
    description: overrides.description ?? 'Automated network reconnaissance tool',
    version: overrides.version ?? '2.1.0',
    status: overrides.status ?? 'available',
    containerImage: overrides.containerImage ?? 'babirye/oft-scanner:latest',
    port: overrides.port ?? 9090,
    config: overrides.config ?? '{}',
    riskLevel: overrides.riskLevel ?? 'medium',
    requiresAuth: overrides.requiresAuth ?? true,
    lastDeployedAt: overrides.lastDeployedAt ?? null,
    ...overrides,
  };
}

/** Creates a mock DefensiveTool. */
export function createMockDefensiveTool(overrides: Partial<DefensiveTool> = {}): DefensiveTool {
  return {
    id: overrides.id ?? 'dft-0001',
    name: overrides.name ?? 'IDS Monitor',
    category: overrides.category ?? 'detection',
    subcategory: overrides.subcategory ?? 'network-ids',
    description: overrides.description ?? 'Intrusion detection system monitor',
    version: overrides.version ?? '4.0.0',
    status: overrides.status ?? 'active',
    containerImage: overrides.containerImage ?? 'babirye/dft-ids:latest',
    config: overrides.config ?? '{}',
    autoDeploy: overrides.autoDeploy ?? true,
    lastDeployedAt: overrides.lastDeployedAt ?? '2025-01-10T08:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock MicroDefensiveTool. */
export function createMockMicroDefensiveTool(overrides: Partial<MicroDefensiveTool> = {}): MicroDefensiveTool {
  return {
    id: overrides.id ?? 'mdt-0001',
    name: overrides.name ?? 'Input Sanitiser',
    category: overrides.category ?? 'input_validation',
    description: overrides.description ?? 'Real-time input sanitisation micro-service',
    status: overrides.status ?? 'active',
    config: overrides.config ?? '{}',
    isActive: overrides.isActive ?? true,
    blockCount: overrides.blockCount ?? 583,
    lastTriggeredAt: overrides.lastTriggeredAt ?? '2025-01-15T13:45:00.000Z',
    ...overrides,
  };
}

/** Creates a mock VipProfile. */
export function createMockVipProfile(overrides: Partial<VipProfile> = {}): VipProfile {
  return {
    id: overrides.id ?? 'vip-0001',
    name: overrides.name ?? 'Distinguished Principal',
    designation: overrides.designation ?? 'Level 1 Protected',
    threatLevel: overrides.threatLevel ?? 'medium',
    protectionLevel: overrides.protectionLevel ?? 'enhanced',
    status: overrides.status ?? 'active',
    biometricHash: overrides.biometricHash ?? null,
    bleTagId: overrides.bleTagId ?? 'BLE-A1B2C3',
    emergencyContact: overrides.emergencyContact ?? '+1-555-0100',
    medicalInfo: overrides.medicalInfo ?? null,
    travelSchedule: overrides.travelSchedule ?? null,
    _count: overrides._count ?? { drones: 2, vehicles: 1, wearables: 3, incidents: 0 },
    ...overrides,
  };
}

/** Creates a mock VipDrone. */
export function createMockVipDrone(overrides: Partial<VipDrone> = {}): VipDrone {
  return {
    id: overrides.id ?? 'vdr-0001',
    vipId: overrides.vipId ?? 'vip-0001',
    name: overrides.name ?? 'SkyGuard Alpha',
    model: overrides.model ?? 'DJI Matrice 350',
    status: overrides.status ?? 'patrolling',
    batteryLevel: overrides.batteryLevel ?? 87,
    altitude: overrides.altitude ?? 120,
    speed: overrides.speed ?? 15.2,
    gpsCoords: overrides.gpsCoords ?? '-1.2921,36.8219',
    cameraActive: overrides.cameraActive ?? true,
    thermalActive: overrides.thermalActive ?? true,
    mission: overrides.mission ?? 'perimeter-patrol',
    ...overrides,
  };
}

/** Creates a mock VipVehicle. */
export function createMockVipVehicle(overrides: Partial<VipVehicle> = {}): VipVehicle {
  return {
    id: overrides.id ?? 'vvh-0001',
    vipId: overrides.vipId ?? 'vip-0001',
    name: overrides.name ?? 'Transport One',
    type: overrides.type ?? 'armoured-suv',
    plate: overrides.plate ?? 'VIP-001',
    status: overrides.status ?? 'en-route',
    fuelLevel: overrides.fuelLevel ?? 72,
    gpsCoords: overrides.gpsCoords ?? '-1.2950,36.8250',
    driverId: overrides.driverId ?? 'usr-0010',
    route: overrides.route ?? null,
    speed: overrides.speed ?? 60,
    heading: overrides.heading ?? 45,
    ...overrides,
  };
}

/** Creates a mock VipWearable. */
export function createMockVipWearable(overrides: Partial<VipWearable> = {}): VipWearable {
  return {
    id: overrides.id ?? 'vwr-0001',
    vipId: overrides.vipId ?? 'vip-0001',
    type: overrides.type ?? 'smartwatch',
    deviceName: overrides.deviceName ?? 'BioTrack Pro',
    status: overrides.status ?? 'connected',
    batteryLevel: overrides.batteryLevel ?? 65,
    heartRate: overrides.heartRate ?? 72,
    bloodPressure: overrides.bloodPressure ?? '120/80',
    temperature: overrides.temperature ?? 36.6,
    sosTriggered: overrides.sosTriggered ?? false,
    lastPingAt: overrides.lastPingAt ?? '2025-01-15T14:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock VipIncident. */
export function createMockVipIncident(overrides: Partial<VipIncident> = {}): VipIncident {
  return {
    id: overrides.id ?? 'vinc-0001',
    vipId: overrides.vipId ?? 'vip-0001',
    type: overrides.type ?? 'geo-fence-breach',
    severity: overrides.severity ?? 'high',
    description: overrides.description ?? 'VIP exited designated safe zone',
    response: overrides.response ?? 'Security team dispatched',
    resolvedAt: overrides.resolvedAt ?? '2025-01-15T15:30:00.000Z',
    createdAt: overrides.createdAt ?? '2025-01-15T15:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock Potential. */
export function createMockPotential(overrides: Partial<Potential> = {}): Potential {
  return {
    id: overrides.id ?? 'pot-0001',
    name: overrides.name ?? 'Zero-Day Exploit Simulation',
    category: overrides.category ?? 'offensive',
    subcategory: overrides.subcategory ?? 'exploit',
    description: overrides.description ?? 'Simulate zero-day exploit scenarios',
    requirements: overrides.requirements ?? '[]',
    difficulty: overrides.difficulty ?? 'advanced',
    impact: overrides.impact ?? 'high',
    isActive: overrides.isActive ?? true,
    tags: overrides.tags ?? '["exploit","zero-day","simulation"]',
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2025-01-01T00:00:00.000Z',
    _count: overrides._count ?? { scenarios: 3 },
    ...overrides,
  };
}

/** Creates a mock IntelligenceFeed. */
export function createMockIntelligenceFeed(overrides: Partial<IntelligenceFeed> = {}): IntelligenceFeed {
  return {
    id: overrides.id ?? 'itf-0001',
    name: overrides.name ?? 'Threat Feed Alpha',
    source: overrides.source ?? 'MISP Community',
    feedType: overrides.feedType ?? 'ioc',
    url: overrides.url ?? 'https://feed.example.com/ioc',
    apiKey: overrides.apiKey ?? null,
    frequency: overrides.frequency ?? '15m',
    isActive: overrides.isActive ?? true,
    lastFetchedAt: overrides.lastFetchedAt ?? '2025-01-15T13:00:00.000Z',
    lastError: overrides.lastError ?? null,
    itemCount: overrides.itemCount ?? 1243,
    _count: overrides._count ?? { items: 1243 },
    ...overrides,
  };
}

/** Creates a mock IntelItem. */
export function createMockIntelItem(overrides: Partial<IntelItem> = {}): IntelItem {
  return {
    id: overrides.id ?? 'iti-0001',
    feedId: overrides.feedId ?? 'itf-0001',
    title: overrides.title ?? 'New C2 server detected',
    description: overrides.description ?? 'Indicator of compromise: C2 communication at 10.0.55.3',
    ioc: overrides.ioc ?? '10.0.55.3',
    severity: overrides.severity ?? 'high',
    confidence: overrides.confidence ?? 0.88,
    tags: overrides.tags ?? '["c2","malware","ioc"]',
    raw: overrides.raw ?? null,
    isProcessed: overrides.isProcessed ?? true,
    createdAt: overrides.createdAt ?? '2025-01-15T12:30:00.000Z',
    ...overrides,
  };
}

/** Creates a mock Weapon. */
export function createMockWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    id: overrides.id ?? 'wpn-0001',
    name: overrides.name ?? 'Patrol Rifle',
    category: overrides.category ?? 'firearm',
    subcategory: overrides.subcategory ?? 'rifle',
    caliber: overrides.caliber ?? '5.56x45mm',
    range: overrides.range ?? 500,
    rateOfFire: overrides.rateOfFire ?? '700 rpm',
    magazineCapacity: overrides.magazineCapacity ?? 30,
    status: overrides.status ?? 'operational',
    serialNumber: overrides.serialNumber ?? 'BAB-2025-001',
    assignedTo: overrides.assignedTo ?? null,
    lastInspectionAt: overrides.lastInspectionAt ?? '2025-01-10T00:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock MartialArt. */
export function createMockMartialArt(overrides: Partial<MartialArt> = {}): MartialArt {
  return {
    id: overrides.id ?? 'ma-0001',
    name: overrides.name ?? 'Krav Maga',
    style: overrides.style ?? 'hybrid',
    origin: overrides.origin ?? 'Israel',
    description: overrides.description ?? 'Military self-defence and combat system',
    techniques: overrides.techniques ?? '["strikes","grappling","disarms","defences"]',
    difficulty: overrides.difficulty ?? 'intermediate',
    effectiveness: overrides.effectiveness ?? 'high',
    ...overrides,
  };
}

/** Creates a mock SpaGateway. */
export function createMockSpaGateway(overrides: Partial<SpaGateway> = {}): SpaGateway {
  return {
    id: overrides.id ?? 'spg-0001',
    name: overrides.name ?? 'Primary Gateway',
    subsystem: overrides.subsystem ?? 'main',
    port: overrides.port ?? 8443,
    host: overrides.host ?? '0.0.0.0',
    isActive: overrides.isActive ?? true,
    secretHash: overrides.secretHash ?? '[REDACTED]',
    deployedServices: overrides.deployedServices ?? '["api","ws","admin"]',
    network: overrides.network ?? '10.0.0.0/24',
    ...overrides,
  };
}

/** Creates a mock Constitution. */
export function createMockConstitution(overrides: Partial<Constitution> = {}): Constitution {
  return {
    id: overrides.id ?? 'con-0001',
    name: overrides.name ?? 'Main System Constitution',
    subsystem: overrides.subsystem ?? 'core',
    content: overrides.content ?? 'All operations must be logged and auditable.',
    version: overrides.version ?? '1.0.0',
    isActive: overrides.isActive ?? true,
    ...overrides,
  };
}

/** Creates a mock SystemSetting. */
export function createMockSystemSetting(overrides: Partial<SystemSetting> = {}): SystemSetting {
  return {
    id: overrides.id ?? 'set-0001',
    key: overrides.key ?? 'session.timeout_minutes',
    value: overrides.value ?? '30',
    category: overrides.category ?? 'auth',
    isSecret: overrides.isSecret ?? false,
    description: overrides.description ?? 'Session timeout in minutes',
    ...overrides,
  };
}

/** Creates a mock Report. */
export function createMockReport(overrides: Partial<Report> = {}): Report {
  return {
    id: overrides.id ?? 'rpt-0001',
    title: overrides.title ?? 'Weekly Security Report',
    type: overrides.type ?? 'security',
    format: overrides.format ?? 'json',
    content: overrides.content ?? '{}',
    summary: overrides.summary ?? 'No critical incidents this week.',
    classification: overrides.classification ?? 'internal',
    generatedBy: overrides.generatedBy ?? 'usr-0001',
    createdAt: overrides.createdAt ?? '2025-01-15T00:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock Notification. */
export function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id ?? 'ntf-0001',
    userId: overrides.userId ?? 'usr-0001',
    type: overrides.type ?? 'alert',
    title: overrides.title ?? 'New Security Alert',
    message: overrides.message ?? 'Critical alert requires your attention',
    severity: overrides.severity ?? 'high',
    isRead: overrides.isRead ?? false,
    actionUrl: overrides.actionUrl ?? '/alerts/alr-0001',
    metadata: overrides.metadata ?? '{}',
    expiresAt: overrides.expiresAt ?? null,
    createdAt: overrides.createdAt ?? '2025-01-15T14:00:00.000Z',
    ...overrides,
  };
}

/** Creates a mock SensorReading. */
export function createMockSensorReading(overrides: Partial<SensorReading> = {}): SensorReading {
  return {
    id: overrides.id ?? 'srd-0001',
    sensorId: overrides.sensorId ?? 'sns-0001',
    value: overrides.value ?? 23.5,
    unit: overrides.unit ?? '°C',
    metadata: overrides.metadata ?? '{}',
    confidence: overrides.confidence ?? 0.95,
    isAnomaly: overrides.isAnomaly ?? false,
    anomalyScore: overrides.anomalyScore ?? null,
    createdAt: overrides.createdAt ?? '2025-01-15T14:30:00.000Z',
    ...overrides,
  };
}