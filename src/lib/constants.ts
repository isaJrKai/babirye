// ============================================================================
// BABIRYE - System Constants
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

// ----------------------------------------------------------------------------
// Core Identity
// ----------------------------------------------------------------------------

export const BABIRYE_VERSION = '10.0.0';
export const EDITION = 'Titanium Ultra + VIP Protection';
export const BUILD_CODENAME = 'Obsidian Shield';

// ----------------------------------------------------------------------------
// Page IDs (all 21 pages)
// ----------------------------------------------------------------------------

export const PAGE_IDS = {
  DASHBOARD: 'dashboard',
  AGENTS: 'agents',
  TASKS: 'tasks',
  WALL_GUARD: 'wall-guard',
  COUNCIL: 'council',
  FORENSIC_TOOLS: 'forensic-tools',
  OFFENSIVE_TOOLS: 'offensive-tools',
  DEFENSIVE_TOOLS: 'defensive-tools',
  MICRO_DEFENSIVE: 'micro-defensive',
  SENSORS: 'sensors',
  VIP_PROFILES: 'vip-profiles',
  VIP_DRONES: 'vip-drones',
  VIP_VEHICLES: 'vip-vehicles',
  VIP_WEARABLES: 'vip-wearables',
  VIP_INCIDENTS: 'vip-incidents',
  ARSENAL_WEAPONS: 'arsenal-weapons',
  ARSENAL_MARTIAL_ARTS: 'arsenal-martial-arts',
  INTELLIGENCE: 'intelligence',
  SPA_GATEWAYS: 'spa-gateways',
  CONSTITUTIONS: 'constitutions',
  SETTINGS: 'settings',
} as const;

export type PageId = (typeof PAGE_IDS)[keyof typeof PAGE_IDS];

// ----------------------------------------------------------------------------
// Forensic Tool Categories
// ----------------------------------------------------------------------------

export const FORENSIC_CATEGORIES = [
  'disk-forensics',
  'memory-forensics',
  'network-forensics',
  'malware-analysis',
  'timeline-analysis',
  'log-analysis',
  'steganography',
  'email-analysis',
  'mobile-forensics',
  'cloud-forensics',
] as const;

// ----------------------------------------------------------------------------
// Offensive Tool Categories
// ----------------------------------------------------------------------------

export const OFFENSIVE_CATEGORIES = [
  'reconnaissance',
  'vulnerability-scanning',
  'exploitation',
  'post-exploitation',
  'social-engineering',
  'wireless-attacks',
  'web-app-attacks',
  'password-attacks',
  'phishing',
  'red-team-infrastructure',
] as const;

export const OFFENSIVE_SUBCATEGORIES: Record<string, string[]> = {
  reconnaissance: ['passive', 'active', 'osint', 'dns-enum', 'port-scan'],
  'vulnerability-scanning': ['network', 'web', 'api', 'cloud', 'container'],
  exploitation: ['remote', 'local', 'web', 'client-side', 'privilege-escalation'],
  'post-exploitation': ['pivoting', 'lateral-movement', 'persistence', 'credential-harvesting'],
  'social-engineering': ['pretexting', 'baiting', 'tailgating', 'spear-phishing'],
  'wireless-attacks': ['wifi', 'bluetooth', 'rfid', 'gps-spoofing'],
  'web-app-attacks': ['sqli', 'xss', 'ssrf', 'rfi', 'idor'],
  'password-attacks': ['brute-force', 'dictionary', 'rainbow-table', 'hash-cracking'],
  phishing: ['credential-harvest', 'malware-delivery', 'spear-phish', 'whale-phish'],
  'red-team-infrastructure': ['c2', 'redirector', 'payload-hosting', 'phishing-portal'],
};

// ----------------------------------------------------------------------------
// Defensive Tool Categories
// ----------------------------------------------------------------------------

export const DEFENSIVE_CATEGORIES = [
  'ids-ips',
  'firewall',
  'endpoint-protection',
  'siem',
  'soar',
  'deception',
  'threat-intel',
  'network-monitoring',
  'file-integrity',
  'dns-security',
] as const;

export const DEFENSIVE_SUBCATEGORIES: Record<string, string[]> = {
  'ids-ips': ['network', 'host', 'protocol', 'anomaly'],
  firewall: ['network', 'web-app', 'next-gen', 'micro-segmentation'],
  'endpoint-protection': ['edr', 'antivirus', 'dlp', 'application-control'],
  siem: ['log-collection', 'correlation', 'threat-detection', 'compliance'],
  soar: ['automation', 'orchestration', 'case-management', 'playbook'],
  deception: ['honeypot', 'honeynet', 'decoy', 'lure'],
  'threat-intel': ['feeds', 'ioc-management', 'tippers', 'malware-analysis'],
  'network-monitoring': ['nta', 'nba', 'flow-analysis', 'packet-capture'],
  'file-integrity': ['host-based', 'agentless', 'real-time', 'scheduled'],
  'dns-security': ['dns-filter', 'dns-monitor', 'dns-firewall', 'doh-dns'],
};

// ----------------------------------------------------------------------------
// Micro-Defensive Tool Categories
// ----------------------------------------------------------------------------

export const MICRO_DEFENSIVE_CATEGORIES = [
  'injection-prevention',
  'anti-tampering',
  'code-obfuscation',
  'runtime-protection',
  'memory-safety',
  'credential-guard',
  'input-sanitization',
  'crypto-shielding',
  'resource-isolation',
  'supply-chain-verification',
] as const;

// ----------------------------------------------------------------------------
// Severity Definitions
// ----------------------------------------------------------------------------

export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500',
  info: 'text-gray-500',
};

export const SEVERITY_BG_COLORS: Record<SeverityLevel, string> = {
  critical: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20',
  high: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20',
  low: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  info: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border border-gray-500/20',
};

export const SEVERITY_DOT_COLORS: Record<SeverityLevel, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  info: 'bg-gray-400',
};

// ----------------------------------------------------------------------------
// Status Definitions
// ----------------------------------------------------------------------------

export const TASK_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;

export const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/20',
  running: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  online: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  completed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  error: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
  failed: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
  disabled: 'bg-gray-500/15 text-gray-500 dark:text-gray-500 border-gray-500/20',
  offline: 'bg-gray-500/15 text-gray-500 dark:text-gray-500 border-gray-500/20',
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  cancelled: 'bg-gray-500/15 text-gray-500 dark:text-gray-500 border-gray-500/20',
  dormant: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
  investigating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  'false_positive': 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20',
  escalated: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20',
  inactive: 'bg-gray-500/15 text-gray-500 dark:text-gray-500 border-gray-500/20',
  transit: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  emergency: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
  new: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

export const STATUS_DOT_COLORS: Record<string, string> = {
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
};

// ----------------------------------------------------------------------------
// Role Definitions
// ----------------------------------------------------------------------------

export const USER_ROLES = ['admin', 'operator', 'analyst', 'viewer'] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20',
  operator: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  analyst: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  viewer: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/20',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  operator: [
    'agents:manage',
    'tasks:create',
    'tasks:read',
    'tasks:update',
    'tools:deploy',
    'tools:read',
    'sensors:manage',
    'wall-guard:manage',
    'vip:manage',
    'alerts:manage',
    'intel:read',
    'reports:generate',
  ],
  analyst: [
    'tasks:read',
    'tools:read',
    'sensors:read',
    'wall-guard:read',
    'vip:read',
    'alerts:read',
    'alerts:update',
    'intel:read',
    'reports:read',
  ],
  viewer: [
    'dashboard:read',
    'tasks:read',
    'tools:read',
    'sensors:read',
    'wall-guard:read',
    'vip:read',
    'alerts:read',
    'intel:read',
    'reports:read',
  ],
};

// ----------------------------------------------------------------------------
// Agent Domains
// ----------------------------------------------------------------------------

export const AGENT_DOMAINS = [
  'forensic-analysis',
  'threat-hunting',
  'vulnerability-assessment',
  'incident-response',
  'threat-intelligence',
  'malware-analysis',
  'network-monitoring',
  'compliance-audit',
  'red-team-operations',
  'vip-protection',
  'sensor-management',
  'micro-defense',
  'offensive-ops',
  'defensive-ops',
  'council-advisory',
] as const;

export const AGENT_DOMAIN_LABELS: Record<string, string> = {
  'forensic-analysis': 'Forensic Analysis',
  'threat-hunting': 'Threat Hunting',
  'vulnerability-assessment': 'Vulnerability Assessment',
  'incident-response': 'Incident Response',
  'threat-intelligence': 'Threat Intelligence',
  'malware-analysis': 'Malware Analysis',
  'network-monitoring': 'Network Monitoring',
  'compliance-audit': 'Compliance Audit',
  'red-team-operations': 'Red Team Ops',
  'vip-protection': 'VIP Protection',
  'sensor-management': 'Sensor Management',
  'micro-defense': 'Micro Defense',
  'offensive-ops': 'Offensive Ops',
  'defensive-ops': 'Defensive Ops',
  'council-advisory': 'Council Advisory',
};

// ----------------------------------------------------------------------------
// Wall Guard Categories
// ----------------------------------------------------------------------------

export const WALL_GUARD_CATEGORIES = [
  'injection',
  'exfiltration',
  'privilege',
  'integrity',
  'resource',
  'memory',
  'credential',
  'input_validation',
  'crypto',
  'supply_chain',
] as const;

export const WALL_GUARD_CATEGORY_LABELS: Record<string, string> = {
  injection: 'Injection Prevention',
  exfiltration: 'Data Exfiltration',
  privilege: 'Privilege Escalation',
  integrity: 'Data Integrity',
  resource: 'Resource Abuse',
  memory: 'Memory Protection',
  credential: 'Credential Security',
  input_validation: 'Input Validation',
  crypto: 'Cryptographic Security',
  supply_chain: 'Supply Chain',
};

export const WALL_GUARD_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  injection: 'Prevents SQL injection, XSS, command injection, and code injection attacks',
  exfiltration: 'Monitors and blocks unauthorized data exfiltration attempts',
  privilege: 'Detects and blocks privilege escalation attempts',
  integrity: 'Ensures data integrity and prevents unauthorized modifications',
  resource: 'Monitors and limits resource consumption to prevent DoS attacks',
  memory: 'Protects against buffer overflows, use-after-free, and memory corruption',
  credential: 'Secures credential storage, transmission, and usage',
  input_validation: 'Validates and sanitizes all input data across endpoints',
  crypto: 'Enforces cryptographic standards and prevents weak encryption usage',
  supply_chain: 'Verifies software supply chain integrity and detects tampering',
};

// ----------------------------------------------------------------------------
// Sensor Types & Subtypes
// ----------------------------------------------------------------------------

export const SENSOR_TYPES = [
  'motion',
  'thermal',
  'audio',
  'camera',
  'rfid',
  'ble',
  'gps',
  'seismic',
  'chemical',
  'radiation',
  'pressure',
  'humidity',
] as const;

export const SENSOR_SUBTYPES: Record<string, string[]> = {
  motion: ['pir', 'microwave', 'ultrasonic', 'accelerometer', 'gyroscope'],
  thermal: ['infrared', 'thermocouple', 'thermistor', 'bolometer'],
  audio: ['microphone', 'ultrasonic', 'infrasound', 'acoustic-emission'],
  camera: ['visible', 'ir', 'thermal-imaging', 'multispectral', 'hyperspectral'],
  rfid: ['active', 'passive', 'semi-passive', 'nfc'],
  ble: ['beacon', 'tag', 'tracker', 'gateway'],
  gps: ['gnss', 'rtk', 'agps', 'dgps'],
  seismic: ['geophone', 'accelerometer', 'broadband', 'short-period'],
  chemical: ['gas', 'vapor', 'ph', 'conductivity', 'spectroscopy'],
  radiation: ['alpha', 'beta', 'gamma', 'neutron', 'x-ray'],
  pressure: ['barometric', 'hydraulic', 'piezoelectric', 'capacitive'],
  humidity: ['capacitive', 'resistive', 'thermal-conductivity'],
};

// ----------------------------------------------------------------------------
// Weapon Categories & Subcategories
// ----------------------------------------------------------------------------

export const WEAPON_CATEGORIES = [
  'firearms',
  'less-lethal',
  'tactical-equipment',
  'protective-gear',
  'explosives',
  'melee',
  'archery',
  'launchers',
] as const;

export const WEAPON_SUBCATEGORIES: Record<string, string[]> = {
  firearms: ['handgun', 'rifle', 'shotgun', 'smg', 'sniper', 'machine-gun'],
  'less-lethal': ['taser', 'pepper-spray', 'rubber-bullets', 'stun-gun', 'bean-bag'],
  'tactical-equipment': ['flashlight', 'breaching-tool', 'shield', 'restraints', 'diving-gear'],
  'protective-gear': ['body-armor', 'helmet', 'goggles', 'gloves', 'boots'],
  explosives: ['grenade', 'c4', 'detonator', 'breaching-charge', 'smoke'],
  melee: ['knife', 'baton', 'sword', 'tomahawk', 'kusarigama'],
  archery: ['compound-bow', 'crossbow', 'recurve-bow', 'longbow'],
  launchers: ['rpg', 'at4', 'grenade-launcher', 'mortar', 'rocket-launcher'],
};

// ----------------------------------------------------------------------------
// Martial Art Styles
// ----------------------------------------------------------------------------

export const MARTIAL_ART_STYLES = [
  'striking',
  'grappling',
  'hybrid',
  'weapon-based',
  'internal',
  'military',
  'self-defense',
  'combat-sport',
] as const;

// ----------------------------------------------------------------------------
// Default Pagination & Limits
// ----------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const SMALL_PAGE_SIZE = 10;
export const LARGE_PAGE_SIZE = 50;

// ----------------------------------------------------------------------------
// Rate Limits
// ----------------------------------------------------------------------------

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  API_GENERAL: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
  API_SENSITIVE: { windowMs: 60 * 1000, max: 30 }, // 30 sensitive ops per minute
  WEBSOCKET: { maxConnections: 50, heartbeatIntervalMs: 30000 },
  FILE_UPLOAD: { maxSizeBytes: 50 * 1024 * 1024, maxFiles: 10 }, // 50MB per file
  TASK_SUBMISSION: { windowMs: 60 * 1000, max: 20 }, // 20 tasks per minute
} as const;

// ----------------------------------------------------------------------------
// Color Palette (for programmatic use, mirrors CSS variables)
// ----------------------------------------------------------------------------

export const COLOR_PALETTE = {
  primary: 'hsl(0, 0%, 9%)',
  primaryForeground: 'hsl(0, 0%, 98%)',
  secondary: 'hsl(0, 0%, 14.9%)',
  secondaryForeground: 'hsl(0, 0%, 98%)',
  muted: 'hsl(0, 0%, 14.9%)',
  mutedForeground: 'hsl(0, 0%, 63.9%)',
  accent: 'hsl(0, 0%, 14.9%)',
  accentForeground: 'hsl(0, 0%, 98%)',
  destructive: 'hsl(0, 62.8%, 30.6%)',
  destructiveForeground: 'hsl(0, 0%, 98%)',
  border: 'hsl(0, 0%, 20%)',
  input: 'hsl(0, 0%, 20%)',
  ring: 'hsl(0, 0%, 83.1%)',
  background: 'hsl(0, 0%, 3.9%)',
  foreground: 'hsl(0, 0%, 98%)',
  card: 'hsl(0, 0%, 3.9%)',
  cardForeground: 'hsl(0, 0%, 98%)',
  popover: 'hsl(0, 0%, 3.9%)',
  popoverForeground: 'hsl(0, 0%, 98%)',
} as const;

// ----------------------------------------------------------------------------
// Clearance Levels
// ----------------------------------------------------------------------------

export const CLEARANCE_LEVELS = [
  { level: 0, label: 'Public', color: 'bg-gray-500' },
  { level: 1, label: 'Unclassified', color: 'bg-green-500' },
  { level: 2, label: 'Confidential', color: 'bg-blue-500' },
  { level: 3, label: 'Secret', color: 'bg-yellow-500' },
  { level: 4, label: 'Top Secret', color: 'bg-orange-500' },
  { level: 5, label: 'SCI', color: 'bg-red-500' },
] as const;

// ----------------------------------------------------------------------------
// Report Types & Classifications
// ----------------------------------------------------------------------------

export const REPORT_TYPES = [
  'threat-assessment',
  'vulnerability-scan',
  'incident-report',
  'forensic-analysis',
  'compliance-audit',
  'intelligence-brief',
  'penetration-test',
  'vip-threat-report',
  'weekly-summary',
  'monthly-review',
] as const;

export const REPORT_CLASSIFICATIONS = [
  'unclassified',
  'confidential',
  'secret',
  'top-secret',
] as const;

export const REPORT_FORMATS = ['pdf', 'html', 'json', 'csv', 'markdown'] as const;

// ----------------------------------------------------------------------------
// Intelligence Feed Sources & Types
// ----------------------------------------------------------------------------

export const INTEL_FEED_SOURCES = [
  'STIX/TAXII',
  'MISP',
  'OTX (AlienVault)',
  'VirusTotal',
  'Shodan',
  'CIRCL',
  'Abuse.ch',
  'PhishTank',
  'OpenCTI',
  'Custom RSS',
  'Email Digest',
  'Honeypot Feed',
  'DNS Sinkhole',
  'Web Scraper',
] as const;

export const INTEL_FEED_TYPES = [
  'ioc',
  'threat-report',
  'vulnerability',
  'malware',
  'phishing',
  'botnet',
  'dark-web',
  'geopolitical',
  'financial',
  'custom',
] as const;

export const INTEL_FETCH_FREQUENCIES = [
  'realtime',
  '5min',
  '15min',
  '30min',
  '1hour',
  '6hour',
  '12hour',
  'daily',
  'weekly',
] as const;

// ----------------------------------------------------------------------------
// Notification Types
// ----------------------------------------------------------------------------

export const NOTIFICATION_TYPES = [
  'system',
  'alert',
  'task',
  'vip',
  'sensor',
  'wall-guard',
  'council',
  'report',
] as const;

// ----------------------------------------------------------------------------
// Time Constants
// ----------------------------------------------------------------------------

export const TIME_CONSTANTS = {
  SECOND_MS: 1000,
  MINUTE_MS: 60 * 1000,
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
  WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
  MFA_CODE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  ACCOUNT_LOCKOUT_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  TOKEN_REFRESH_MS: 15 * 60 * 1000, // 15 minutes
} as const;