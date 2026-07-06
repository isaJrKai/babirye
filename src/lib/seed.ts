/**
 * BABIRYE v10.0.0 — Comprehensive Database Seed
 * Populates ALL tables with production-quality data. Idempotent.
 */
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import seedData from './seed-data.json';

const BCRYPT_ROUNDS = 4; // Lower rounds for seed speed (production uses 12)

async function hash(pw: string) { return bcrypt.hash(pw, BCRYPT_ROUNDS); }

export async function seedDatabase(): Promise<{ [key: string]: number }> {
  const counts: Record<string, number> = {};

  // ════════════════════════════════════════════════════════════════
  // 1. USERS
  // ════════════════════════════════════════════════════════════════
  if ((await db.user.count()) === 0) {
    const users = [
      { email: 'admin@babirye.local', password: 'TitaniumAdmin2024!', name: 'Commander Nyx', role: 'admin' },
      { email: 'ops1@babirye.local', password: 'OperatorPass2024!', name: 'Specter', role: 'operator' },
      { email: 'ops2@babirye.local', password: 'OperatorPass2024!', name: 'Valkyrie', role: 'operator' },
      { email: 'ops3@babirye.local', password: 'OperatorPass2024!', name: 'Cipher', role: 'operator' },
      { email: 'analyst1@babirye.local', password: 'AnalystPass2024!', name: 'Watcher', role: 'analyst' },
      { email: 'analyst2@babirye.local', password: 'AnalystPass2024!', name: 'Tracer', role: 'analyst' },
      { email: 'analyst3@babirye.local', password: 'AnalystPass2024!', name: 'Oracle', role: 'analyst' },
      { email: 'analyst4@babirye.local', password: 'AnalystPass2024!', name: 'Raven', role: 'analyst' },
      { email: 'analyst5@babirye.local', password: 'AnalystPass2024!', name: 'Ghost', role: 'analyst' },
      { email: 'viewer1@babirye.local', password: 'ViewerPass2024!', name: 'Sentinel', role: 'viewer' },
      { email: 'viewer2@babirye.local', password: 'ViewerPass2024!', name: 'Guardian', role: 'viewer' },
    ];
    for (const u of users) {
      await db.user.create({ data: { email: u.email, passwordHash: await hash(u.password), name: u.name, role: u.role, lastLoginAt: new Date(Date.now() - Math.random() * 7 * 86400000) } });
    }
    counts.users = users.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 2. AGENTS
  // ════════════════════════════════════════════════════════════════
  if ((await db.agent.count()) === 0) {
    const agents = [
      { name: 'Orchestrator Agent', domain: 'Incident Response', description: 'Central orchestrator that routes tasks to specialized agents based on task classification, using Expert Council consensus for ambiguous routing decisions across all operational domains.', version: '10.0.0', status: 'running' },
      { name: 'Forensic Agent', domain: 'forensic', description: 'Digital forensics investigation agent handling disk imaging, memory analysis, network forensics, and mobile device acquisition across Android, iOS, and desktop platforms.', version: '10.0.0', status: 'idle' },
      { name: 'Security Agent', domain: 'security', description: 'Core security operations agent managing authentication, authorization, audit logging, and self-attack wall coordination for the platform.', version: '10.0.0', status: 'running' },
      { name: 'Offensive Agent', domain: 'offensive', description: 'Offensive security operations agent managing reconnaissance, exploitation, post-exploitation, command and control, and red team campaign execution.', version: '10.0.0', status: 'idle' },
      { name: 'Defensive Agent', domain: 'defensive', description: 'Defensive security operations agent coordinating network defense, endpoint protection, application security, identity management, data protection, and cloud security.', version: '10.0.0', status: 'running' },
      { name: 'Micro Defensive Agent', domain: 'micro_defensive', description: 'Micro-defensive operations agent managing input validation, output encoding, data sanitization, integrity verification, and rate limiting protections across all subsystems.', version: '10.0.0', status: 'idle' },
      { name: 'Sensors Agent', domain: 'sensors', description: 'Sensor network management agent controlling radar, sonar, LiDAR, acoustic, and electronic warfare sensor arrays with real-time anomaly detection.', version: '10.0.0', status: 'running' },
      { name: 'VIP Protection Agent', domain: 'vip', description: 'VIP protection operations agent managing close protection operations, drone surveillance, vehicle convoy management, and wearable device health monitoring.', version: '10.0.0', status: 'idle' },
      { name: 'Potentials Engine', domain: 'potentials', description: 'Capabilities discovery and scenario planning engine mapping operational potentials across all domains with difficulty assessment, impact analysis, and scenario execution planning.', version: '10.0.0', status: 'running' },
    ];
    for (const a of agents) {
      await db.agent.create({ data: { name: a.name, domain: a.domain, description: a.description, version: a.version, status: a.status, config: '{}', metrics: JSON.stringify({ tasksCompleted: Math.floor(Math.random() * 50), successRate: (0.85 + Math.random() * 0.14).toFixed(3) }) } });
    }
    counts.agents = agents.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 3. EXPERT COUNCIL DOMAINS
  // ════════════════════════════════════════════════════════════════
  if ((await db.councilDomain.count()) === 0) {
    const domains = [
      { name: 'Network Security', specialty: 'firewall IDS IPS network_segmentation packet_analysis protocol_inspection traffic_analysis TCP_IP DNS HTTP TLS', description: 'Expertise in network-based attack detection, prevention, and response including protocol analysis, traffic inspection, and network architecture security.' },
      { name: 'Cryptography', specialty: 'encryption hashing RSA AES SHA256 TLS SSL key_management PKI digital_signatures quantum_resistant', description: 'Deep knowledge of cryptographic algorithms, key management, certificate infrastructure, and emerging quantum-resistant encryption standards.' },
      { name: 'Malware Analysis', specialty: 'malware reverse_engineering sandbox static_analysis dynamic_analysis packer rootkit trojan ransomware worm', description: 'Specialized in malware reverse engineering, behavioral analysis, and threat classification including zero-day malware identification.' },
      { name: 'Digital Forensics', specialty: 'forensics disk_imaging memory_forensics file_carving timeline_analysis evidence_chain chain_of_custody', description: 'Expert in digital evidence acquisition, preservation, and analysis following forensic best practices and legal standards.' },
      { name: 'Social Engineering', specialty: 'phishing pretexting baiting tailgating vishing smishing impersonation influence manipulation', description: 'Deep understanding of human psychological manipulation techniques and social engineering attack vectors with countermeasure development.' },
      { name: 'OSINT', specialty: 'open_source intelligence reconnaissance dark_web social_media domain_enum public_records breach_data', description: 'Mastery of open source intelligence gathering techniques including dark web monitoring, social media analysis, and public data correlation.' },
      { name: 'Physical Security', specialty: 'perimeter access_control surveillance cctv biometric lock drone_guard vehicle_security', description: 'Comprehensive physical security expertise covering perimeter defense, access control systems, surveillance operations, and close protection.' },
      { name: 'Electronic Warfare', specialty: 'SIGINT COMINT ELINT jamming radar electronic_attack electronic_protect spectrum', description: 'Advanced electronic warfare knowledge covering signals intelligence, communication jamming, radar countermeasures, and spectrum management.' },
      { name: 'VIP Protection', specialty: 'close_protection convoy route_planning threat_assessment advance_team medical_response', description: 'Specialized VIP protection operations including threat assessment, advance reconnaissance, convoy management, and emergency response.' },
      { name: 'Legal & Compliance', specialty: 'compliance NIST ISO27001 GDPR PCI-DSS HIPAA SOC2 policy governance regulation', description: 'Expert in cybersecurity legal frameworks, regulatory compliance, policy governance, and incident disclosure requirements.' },
      { name: 'Intelligence Analysis', specialty: 'threat_intelligence ioc ttp apt campaign attribution geopolitics cyber espionage', description: 'Strategic and tactical intelligence analysis expertise covering threat actor profiling, campaign tracking, and geopolitical cyber threat assessment.' },
      { name: 'Cyber-Kinetic Operations', specialty: 'SCADA ICS PLC HMI industrial_control cyber_physical critical_infrastructure OT', description: 'Specialized in the intersection of cyber and physical security covering industrial control systems, SCADA networks, and critical infrastructure protection.' },
    ];
    for (const d of domains) {
      await db.councilDomain.create({ data: { name: d.name, description: d.description, specialty: d.specialty, confidenceBase: 0.3, isActive: true, weight: 1.0 } });
    }
    counts.councilDomains = domains.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 4. WALL GUARDS (25)
  // ════════════════════════════════════════════════════════════════
  if ((await db.wallGuard.count()) === 0) {
    const guards = [
      { name: 'self-injection', category: 'injection', severity: 'critical', description: 'Detects and blocks code injection attempts including eval, exec, import, and subprocess execution in request parameters and action strings.' },
      { name: 'self-exfiltration', category: 'exfiltration', severity: 'critical', description: 'Monitors for unauthorized outbound data transfers including HTTP uploads, FTP connections, DNS tunneling, and encoded data exfiltration attempts.' },
      { name: 'self-privilege-esc', category: 'privilege', severity: 'critical', description: 'Blocks privilege escalation patterns including sudo usage, chmod 777, setuid bit manipulation, and container privileged mode activation.' },
      { name: 'self-modification', category: 'integrity', severity: 'high', description: 'Prevents self-modification of BABIRYE code, configuration, or runtime parameters that could compromise system integrity or behavior.' },
      { name: 'self-communication', category: 'integrity', severity: 'high', description: 'Blocks unauthorized internal messaging channels including self-broadcast and internal message routing that could bypass audit controls.' },
      { name: 'self-ddos', category: 'resource', severity: 'high', description: 'Detects and mitigates self-generated high-frequency request patterns that could cause denial of service against BABIRYE infrastructure.' },
      { name: 'self-resource-exhaustion', category: 'resource', severity: 'high', description: 'Monitors and blocks resource exhaustion attempts including excessive memory allocation, infinite loops, and unbounded data processing requests.' },
      { name: 'self-memory-corruption', category: 'memory', severity: 'critical', description: 'Detects memory corruption patterns including null byte injection, buffer overflow indicators, heap spray signatures, and use-after-free patterns.' },
      { name: 'self-config-tampering', category: 'integrity', severity: 'critical', description: 'Prevents unauthorized modification of system configuration files, environment variables, YAML settings, and runtime configuration parameters.' },
      { name: 'self-credential-theft', category: 'credential', severity: 'critical', description: 'Blocks attempts to extract, export, or access stored credentials, API keys, tokens, and secret material from the system.' },
      { name: 'unsafe-deserialization', category: 'input_validation', severity: 'critical', description: 'Detects unsafe deserialization patterns including pickle.loads, yaml.load without SafeLoader, marshal.loads, and shelve operations on untrusted data.' },
      { name: 'self-path-traversal', category: 'input_validation', severity: 'high', description: 'Blocks file path manipulation including directory traversal with ../ sequences, /etc/ access, /proc/ reading, and encoded path separators.' },
      { name: 'self-race-condition', category: 'input_validation', severity: 'medium', description: 'Prevents concurrent state-modifying operations that could lead to race conditions in task management, agent scheduling, or configuration updates.' },
      { name: 'logic-bomb', category: 'integrity', severity: 'critical', description: 'Detects time-delayed or trigger-based hidden actions including scheduled destructive operations, cron-based backdoors, and conditional execution payloads.' },
      { name: 'self-backdoor', category: 'integrity', severity: 'critical', description: 'Blocks creation of hidden access channels including reverse shells, bind shells, rootkit installation, and covert service deployment.' },
      { name: 'crypto-downgrade', category: 'crypto', severity: 'high', description: 'Prevents deliberate weakening of cryptographic protections including algorithm downgrade, encryption disabling, and weak cipher enforcement.' },
      { name: 'log-injection', category: 'input_validation', severity: 'medium', description: 'Detects and sanitizes log injection attempts including CRLF injection, fake log entries, log4j-style lookups, and script injection in log data.' },
      { name: 'dependency-confusion', category: 'supply_chain', severity: 'high', description: 'Blocks manipulation of package resolution including external package source injection, internal registry targeting, and npm/pip index configuration tampering.' },
      { name: 'prototype-pollution', category: 'input_validation', severity: 'medium', description: 'Detects JavaScript prototype pollution patterns including __proto__ manipulation, constructor.prototype overwriting, and Object.assign abuse.' },
      { name: 'replay-attack', category: 'crypto', severity: 'medium', description: 'Supplements SPA timestamp validation with nonce uniqueness checking to prevent replay attacks using previously captured valid requests.' },
      { name: 'supply-chain-attack', category: 'supply_chain', severity: 'critical', description: 'Blocks modifications to dependency manifests including requirements.txt, package.json, go.mod, and Dockerfile that could introduce compromised packages.' },
      { name: 'encoding-unicode-bypass', category: 'input_validation', severity: 'medium', description: 'Detects homoglyph and Unicode trickery in action strings including non-ASCII characters in suspicious positions and confusable character substitution.' },
      { name: 'model-extraction', category: 'credential', severity: 'high', description: 'Prevents extraction of internal AI models, weights, or parameters including model export, weight dumping, and parameter serialization attacks.' },
      { name: 'adversarial-input', category: 'input_validation', severity: 'medium', description: 'Blocks excessively large or malformed inputs that could be adversarial including oversized payloads, deeply nested structures, and edge-case data.' },
      { name: 'self-replication', category: 'integrity', severity: 'critical', description: 'Prevents the system from creating copies of itself, spawning duplicate processes, or establishing autonomous replication mechanisms.' },
    ];
    for (const g of guards) {
      await db.wallGuard.create({ data: { name: g.name, description: g.description, category: g.category, isActive: true, blockCount: Math.floor(Math.random() * 20), severity: g.severity, config: '{}' } });
    }
    counts.wallGuards = guards.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 5. FORENSIC TOOLS (12)
  // ════════════════════════════════════════════════════════════════
  if ((await db.forensicTool.count()) === 0) {
    const tools = [
      { name: 'Andriller', category: 'android', description: 'Android forensic tool for extracting device data including calls, SMS, contacts, browser history, and application data from locked and unlocked devices.', containerImage: 'andriller/andriller:latest', port: 9090 },
      { name: 'LockKnife', category: 'ios', description: 'iOS device forensic tool for bypassing lock screens and extracting full file system images from Apple mobile devices.', containerImage: 'lockknife/lockknife:latest', port: 9091 },
      { name: 'IBEX', category: 'ios', description: 'Advanced iOS extraction tool supporting full file system acquisition, keychain decryption, and app sandbox analysis for all iOS versions.', containerImage: 'ibex/ibex:latest', port: 9092 },
      { name: 'Hashcat', category: 'computer', description: 'Advanced password recovery utility supporting 300+ hash types with GPU acceleration, rule-based attacks, and distributed cracking capabilities.', containerImage: 'hashcat/hashcat:latest', port: 9093 },
      { name: 'Volatility', category: 'memory', description: 'Advanced memory forensics framework for analyzing volatile memory dumps to extract processes, network connections, registry data, and malware artifacts.', containerImage: 'volatilityfoundation/volatility:latest', port: 9094 },
      { name: 'Sleuth Kit', category: 'computer', description: 'Digital forensics toolkit for analyzing disk images with file system analysis, timeline creation, and metadata extraction supporting NTFS, FAT, ext4.', containerImage: 'sleuthkit/sleuthkit:latest', port: 9095 },
      { name: 'LaZagne', category: 'computer', description: 'Credential extraction tool for recovering stored passwords from browsers, email clients, databases, and system credential managers.', containerImage: 'lazagne/lazagne:latest', port: 9096 },
      { name: 'MVT', category: 'android', description: 'Mobile Verification Toolkit for analyzing iOS and Android devices for signs of compromise including spyware detection and stalkerware identification.', containerImage: 'mvt-project/mvt:latest', port: 9097 },
      { name: 'YAFED', category: 'android', description: 'Yet Another Facebook Evidence Decoder for extracting and analyzing Facebook Messenger data from Android device extractions.', containerImage: 'yafed/yafed:latest', port: 9098 },
      { name: 'Scalpel', category: 'computer', description: 'File carving tool for recovering deleted files from disk images using header/footer signature matching with configurable carving rules.', containerImage: 'scalpel/scalpel:latest', port: 9099 },
      { name: 'Foremost', category: 'computer', description: 'File recovery tool for forensic analysis that recovers files based on their internal headers and footprints from disk images.', containerImage: 'foremost/foremost:latest', port: 9100 },
      { name: 'Log2Timeline', category: 'network', description: 'Forensic timeline creation tool that extracts temporal data from multiple log sources to build comprehensive event timelines.', containerImage: 'log2timeline/plaso:latest', port: 9101 },
    ];
    for (const t of tools) {
      await db.forensicTool.create({ data: { name: t.name, category: t.category, description: t.description, version: '10.0.0', status: 'dormant', containerImage: t.containerImage, port: t.port, config: '{}' } });
    }
    counts.forensicTools = tools.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 6. OFFENSIVE TOOLS (72) — from generated JSON
  // ════════════════════════════════════════════════════════════════
  if ((await db.offensiveTool.count()) === 0) {
    const tools = (seedData as any).offensive_tools;
    for (const t of tools) {
      await db.offensiveTool.create({
        data: { name: t.name, category: t.category, subcategory: t.category, description: t.description, version: t.version, status: t.status, containerImage: t.containerImage, port: t.port || null, config: t.config, riskLevel: t.riskLevel, requiresAuth: t.requiresAuth }
      });
    }
    counts.offensiveTools = tools.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 7. DEFENSIVE TOOLS (100) — from generated JSON
  // ════════════════════════════════════════════════════════════════
  if ((await db.defensiveTool.count()) === 0) {
    const tools = (seedData as any).defensive_tools;
    for (const t of tools) {
      await db.defensiveTool.create({ data: { name: t.name, category: t.category, subcategory: t.category, description: t.description, version: t.version, status: t.status, containerImage: t.containerImage, config: t.config, autoDeploy: t.autoDeploy } });
    }
    counts.defensiveTools = tools.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 8. MICRO-DEFENSIVE TOOLS (112) — from generated JSON
  // ════════════════════════════════════════════════════════════════
  if ((await db.microDefensiveTool.count()) === 0) {
    const tools = (seedData as any).micro_tools;
    for (const t of tools) {
      await db.microDefensiveTool.create({ data: { name: t.name, category: t.category, description: t.description, status: t.status, config: t.config, isActive: t.isActive } });
    }
    counts.microDefensiveTools = tools.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 9. SENSORS (31) — from generated JSON
  // ════════════════════════════════════════════════════════════════
  if ((await db.sensor.count()) === 0) {
    const sensors = (seedData as any).sensors;
    const locations = ['Sector A - North Perimeter', 'Sector B - East Gate', 'Sector C - South Wall', 'Sector D - West Approach', 'Rooftop Alpha', 'Rooftop Bravo', 'Underground Level 1', 'Mobile Unit 1', 'Mobile Unit 2', 'Forward Operating Base'];
    for (let i = 0; i < sensors.length; i++) {
      const s = sensors[i];
      await db.sensor.create({
        data: { name: s.name, type: s.type, subtype: s.subtype, description: s.description, status: i < 20 ? 'online' : 'offline', config: s.config, location: locations[i % locations.length], range: s.range, frequency: s.frequency, sensitivity: s.sensitivity }
      });
    }
    counts.sensors = sensors.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 10. VIP PROFILES
  // ════════════════════════════════════════════════════════════════
  if ((await db.vipProfile.count()) === 0) {
    const alpha = await db.vipProfile.create({ data: { name: 'Principal Alpha', designation: 'Chief Executive Officer', threatLevel: 'high', protectionLevel: 'maximum', status: 'active', emergencyContact: '+1-555-0100', medicalInfo: '{"blood_type":"O+","allergies":["penicillin"],"conditions":["hypertension"]}', travelSchedule: '{"next_movement":"2024-07-15T09:00:00Z","destination":"HQ-Bravo","transport":"armored_convoy"}' } });
    const beta = await db.vipProfile.create({ data: { name: 'Principal Beta', designation: 'Chief Technology Officer', threatLevel: 'medium', protectionLevel: 'elevated', status: 'active', emergencyContact: '+1-555-0200', medicalInfo: '{"blood_type":"A+","allergies":[],"conditions":["asthma"]}', travelSchedule: '{}' } });
    const gamma = await db.vipProfile.create({ data: { name: 'Principal Gamma', designation: 'Board Member', threatLevel: 'low', protectionLevel: 'standard', status: 'active', emergencyContact: '+1-555-0300', medicalInfo: '{"blood_type":"B+","allergies":["sulfa"],"conditions":[]}', travelSchedule: '{}' } });

    // Drones
    await db.vipDrone.createMany({ data: [
      { vipId: alpha.id, name: 'Alpha-Drone-1', model: 'MQ-9 Reaper', status: 'standby', batteryLevel: 95, altitude: null, speed: null, gpsCoords: null, cameraActive: false, thermalActive: false, mission: null },
      { vipId: alpha.id, name: 'Alpha-Drone-2', model: 'DJI Matrice 350', status: 'airborne', batteryLevel: 78, altitude: 120.5, speed: 15.2, gpsCoords: '{"lat":38.8977,"lng":-77.0365}', cameraActive: true, thermalActive: true, mission: '{"type":"perimeter_patrol","waypoints":8}' },
      { vipId: beta.id, name: 'Beta-Drone-1', model: 'DJI Mavic 3T', status: 'charging', batteryLevel: 45, altitude: null, speed: null, gpsCoords: null, cameraActive: false, thermalActive: false, mission: null },
    ]});

    // Vehicles
    await db.vipVehicle.createMany({ data: [
      { vipId: alpha.id, name: 'Alpha-Vehicle-1', type: 'armored', plate: 'GOV-ALPHA-1', status: 'parked', fuelLevel: 92, gpsCoords: '{"lat":38.8977,"lng":-77.0365}', driverId: 'ops1@babirye.local', route: '[]', speed: 0, heading: 0 },
      { vipId: alpha.id, name: 'Alpha-Vehicle-2', type: 'suv', plate: 'GOV-ALPHA-2', status: 'en_route', fuelLevel: 75, gpsCoords: '{"lat":38.9012,"lng":-77.0401}', driverId: 'ops2@babirye.local', route: '[{"lat":38.8977,"lng":-77.0365},{"lat":38.9012,"lng":-77.0401}]', speed: 45, heading: 90 },
      { vipId: beta.id, name: 'Beta-Vehicle-1', type: 'sedan', plate: 'GOV-BETA-1', status: 'parked', fuelLevel: 88, gpsCoords: '{"lat":38.8950,"lng":-77.0340}', driverId: 'ops3@babirye.local', route: '[]', speed: 0, heading: 0 },
    ]});

    // Wearables
    await db.vipWearable.createMany({ data: [
      { vipId: alpha.id, type: 'smartwatch', deviceName: 'Garmin Tactix 7 Pro', status: 'connected', batteryLevel: 82, heartRate: 72, bloodPressure: '{"systolic":120,"diastolic":78}', temperature: 36.6, sosTriggered: false, lastPingAt: new Date() },
      { vipId: alpha.id, type: 'health_monitor', deviceName: 'BioHarness 3', status: 'connected', batteryLevel: 91, heartRate: 72, bloodPressure: null, temperature: 36.7, sosTriggered: false, lastPingAt: new Date() },
      { vipId: alpha.id, type: 'panic_button', deviceName: 'PANIC-ALPHA-1', status: 'connected', batteryLevel: 100, heartRate: null, bloodPressure: null, temperature: null, sosTriggered: false, lastPingAt: new Date() },
      { vipId: beta.id, type: 'smartwatch', deviceName: 'Apple Watch Ultra 2', status: 'connected', batteryLevel: 65, heartRate: 68, bloodPressure: null, temperature: 36.5, sosTriggered: false, lastPingAt: new Date() },
      { vipId: beta.id, type: 'gps_tracker', deviceName: 'Tracker-BETA-1', status: 'connected', batteryLevel: 88, heartRate: null, bloodPressure: null, temperature: null, sosTriggered: false, lastPingAt: new Date() },
      { vipId: gamma.id, type: 'smartwatch', deviceName: 'Smart Badge Gamma', status: 'connected', batteryLevel: 95, heartRate: null, bloodPressure: null, temperature: null, sosTriggered: false, lastPingAt: new Date() },
    ]});
    counts.vipProfiles = 3;
  }

  // ════════════════════════════════════════════════════════════════
  // 11. POTENTIALS (100) — from generated JSON
  // ════════════════════════════════════════════════════════════════
  if ((await db.potential.count()) === 0) {
    const pots = (seedData as any).potentials;
    for (const p of pots) {
      await db.potential.create({ data: { name: p.name, category: p.category, description: p.description, requirements: p.requirements, difficulty: p.difficulty, impact: p.impact, isActive: p.isActive, tags: p.tags, subcategory: p.category } });
    }
    counts.potentials = pots.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 12. WEAPONS (44)
  // ════════════════════════════════════════════════════════════════
  if ((await db.weapon.count()) === 0) {
    const weapons = [
      { name: 'Glock 17', category: 'handgun', caliber: '9x19mm Parabellum', range: 50, rateOfFire: 'Semi-auto', magazineCapacity: 17, serialNumber: 'G17-BA-00101' },
      { name: 'Glock 19', category: 'handgun', caliber: '9x19mm Parabellum', range: 50, rateOfFire: 'Semi-auto', magazineCapacity: 15, serialNumber: 'G19-BA-00201' },
      { name: 'SIG P320', category: 'handgun', caliber: '9x19mm Parabellum', range: 50, rateOfFire: 'Semi-auto', magazineCapacity: 17, serialNumber: 'P320-BA-00301' },
      { name: 'Beretta M9', category: 'handgun', caliber: '9x19mm Parabellum', range: 50, rateOfFire: 'Semi-auto', magazineCapacity: 15, serialNumber: 'M9-BA-00401' },
      { name: 'M4A1 Carbine', category: 'rifle', caliber: '5.56x45mm NATO', range: 500, rateOfFire: '700-950 rpm', magazineCapacity: 30, serialNumber: 'M4-BA-00501' },
      { name: 'HK416', category: 'rifle', caliber: '5.56x45mm NATO', range: 600, rateOfFire: '850 rpm', magazineCapacity: 30, serialNumber: 'HK416-BA-00601' },
      { name: 'FN SCAR-L', category: 'rifle', caliber: '5.56x45mm NATO', range: 500, rateOfFire: '625 rpm', magazineCapacity: 30, serialNumber: 'SCAR-BA-00701' },
      { name: 'AK-74M', category: 'rifle', caliber: '5.45x39mm', range: 500, rateOfFire: '600-650 rpm', magazineCapacity: 30, serialNumber: 'AK74-BA-00801' },
      { name: 'Benelli M4', category: 'shotgun', caliber: '12 Gauge', range: 50, rateOfFire: 'Semi-auto', magazineCapacity: 7, serialNumber: 'BM4-BA-00901' },
      { name: 'Remington 870', category: 'shotgun', caliber: '12 Gauge', range: 40, rateOfFire: 'Pump-action', magazineCapacity: 7, serialNumber: 'R870-BA-01001' },
      { name: 'Mossberg 590', category: 'shotgun', caliber: '12 Gauge', range: 40, rateOfFire: 'Pump-action', magazineCapacity: 8, serialNumber: 'M590-BA-01101' },
      { name: 'MP5A3', category: 'smg', caliber: '9x19mm Parabellum', range: 200, rateOfFire: '800 rpm', magazineCapacity: 30, serialNumber: 'MP5-BA-01201' },
      { name: 'MP7A1', category: 'smg', caliber: '4.6x30mm', range: 200, rateOfFire: '950 rpm', magazineCapacity: 40, serialNumber: 'MP7-BA-01301' },
      { name: 'FN P90', category: 'smg', caliber: '5.7x28mm', range: 200, rateOfFire: '900 rpm', magazineCapacity: 50, serialNumber: 'P90-BA-01401' },
      { name: 'M249 SAW', category: 'lmg', caliber: '5.56x45mm NATO', range: 800, rateOfFire: '750-1000 rpm', magazineCapacity: 200, serialNumber: 'M249-BA-01501' },
      { name: 'M240B', category: 'lmg', caliber: '7.62x51mm NATO', range: 1100, rateOfFire: '650-850 rpm', magazineCapacity: 100, serialNumber: 'M240-BA-01601' },
      { name: 'M24 SWS', category: 'sniper', caliber: '7.62x51mm NATO', range: 800, rateOfFire: 'Bolt-action', magazineCapacity: 5, serialNumber: 'M24-BA-01701' },
      { name: 'Barrett M82', category: 'sniper', caliber: '.50 BMG (12.7x99mm)', range: 1800, rateOfFire: 'Semi-auto', magazineCapacity: 10, serialNumber: 'M82-BA-01801' },
      { name: 'M67 Fragmentation', category: 'explosive', caliber: null, range: 40, rateOfFire: null, magazineCapacity: null, serialNumber: 'M67-BA-01901' },
      { name: 'M18 Smoke', category: 'explosive', caliber: null, range: null, rateOfFire: null, magazineCapacity: null, serialNumber: 'M18-BA-02001' },
      { name: 'Flashbang', category: 'explosive', caliber: null, range: 5, rateOfFire: null, magazineCapacity: null, serialNumber: 'FB-BA-02101' },
      { name: 'Active Denial System', category: 'directed_energy', caliber: '95 GHz millimeter wave', range: 700, rateOfFire: 'Continuous', magazineCapacity: null, serialNumber: 'ADS-BA-02201' },
      { name: 'LRAD 1000X', category: 'directed_energy', caliber: 'Acoustic (2.5-5 kHz)', range: 300, rateOfFire: 'Continuous', magazineCapacity: null, serialNumber: 'LRAD-BA-02301' },
      { name: 'FGM-148 Javelin', category: 'missile', caliber: '127mm HEAT', range: 4750, rateOfFire: 'Single-shot', magazineCapacity: 1, serialNumber: 'JAV-BA-02401' },
      { name: 'FIM-92 Stinger', category: 'missile', caliber: '70mm IR seeking', range: 8000, rateOfFire: 'Single-shot', magazineCapacity: 1, serialNumber: 'STG-BA-02501' },
      { name: 'AGM-114 Hellfire', category: 'missile', caliber: '178mm HEAT', range: 11000, rateOfFire: 'Single-shot', magazineCapacity: 1, serialNumber: 'HFL-BA-02601' },
      { name: 'Taser X26P', category: 'non_lethal', caliber: '50kV electrical', range: 7, rateOfFire: '5-shot cartridge', magazineCapacity: 5, serialNumber: 'TAS-BA-02701' },
      { name: 'OC Pepper Spray', category: 'non_lethal', caliber: '10% OC formula', range: 3, rateOfFire: 'Continuous spray', magazineCapacity: null, serialNumber: 'OC-BA-02801' },
      { name: 'EMP Cannon MK-I', category: 'cyber_kinetic', caliber: 'EMP pulse', range: 100, rateOfFire: 'Single-shot', magazineCapacity: 1, serialNumber: 'EMP-BA-02901' },
      { name: 'RF Disruptor', category: 'cyber_kinetic', caliber: 'RF broadband', range: 500, rateOfFire: 'Continuous', magazineCapacity: null, serialNumber: 'RFD-BA-03001' },
      { name: 'Drone Interceptor Net', category: 'cyber_kinetic', caliber: 'Physical net', range: 200, rateOfFire: 'Single-shot', magazineCapacity: 4, serialNumber: 'DIN-BA-03101' },
    ];
    for (const w of weapons) {
      await db.weapon.create({ data: { ...w, status: 'armory', lastInspectionAt: new Date(Date.now() - Math.random() * 90 * 86400000) } });
    }
    counts.weapons = weapons.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 13. MARTIAL ARTS (25)
  // ════════════════════════════════════════════════════════════════
  if ((await db.martialArt.count()) === 0) {
    const arts = [
      { name: 'Muay Thai', style: 'striking', origin: 'Thailand', difficulty: 'intermediate', techniques: ['Jab', 'Cross', 'Hook', 'Uppercut', 'Low Kick', 'Roundhouse Kick', 'Teep', 'Elbow Strike', 'Clinch Knee', 'Spinning Elbow', 'Body Kick', 'Superman Punch'] },
      { name: 'Boxing', style: 'striking', origin: 'United Kingdom', difficulty: 'beginner', techniques: ['Jab', 'Cross', 'Hook', 'Uppercut', 'Overhand', 'Liver Shot', 'Body Shot', 'Bob and Weave', 'Slip', 'Parry', 'Check Hook', 'Sway'] },
      { name: 'Kyokushin Karate', style: 'striking', origin: 'Japan', difficulty: 'advanced', techniques: ['Mae Geri', 'Mawashi Geri', 'Ushiro Mawashi Geri', 'Kizami Tsuki', 'Chudan Tsuki', 'Gedan Barai', 'Age Uke', 'Shuto Uchi', 'Haito Uchi', 'Seiken Tsuki', 'Kakato Geri', 'Ura Mawashi Geri'] },
      { name: 'Taekwondo', style: 'striking', origin: 'Korea', difficulty: 'intermediate', techniques: ['Front Kick', 'Roundhouse Kick', 'Side Kick', 'Back Kick', 'Hook Kick', 'Crescent Kick', 'Axe Kick', 'Spinning Hook Kick', '540 Kick', 'Cut Kick', 'Push Kick', 'Scissor Kick'] },
      { name: 'Krav Maga', style: 'striking', origin: 'Israel', difficulty: 'intermediate', techniques: ['Punch Combo', 'Palm Strike', 'Hammerfist', 'Knee Strike', 'Groin Kick', 'Headbutt', 'Choke Defense', 'Knife Defense', 'Gun Defense', 'Bear Hug Escape', 'Wrist Grab Release', '360 Defense'] },
      { name: 'Brazilian Jiu-Jitsu', style: 'grappling', origin: 'Brazil', difficulty: 'intermediate', techniques: ['Rear Naked Choke', 'Armbar', 'Triangle Choke', 'Guillotine Choke', 'Kimura', 'Omoplata', 'Cross Collar Choke', 'Ezekiel Choke', 'Americana', 'Knee Cut', 'Guard Pass', 'Mount Escape'] },
      { name: 'Judo', style: 'grappling', origin: 'Japan', difficulty: 'intermediate', techniques: ['Ippon Seoi Nage', 'Osoto Gari', 'Ouchi Gari', 'Koshi Guruma', 'Tai Otoshi', 'Tomoe Nage', 'Uchi Mata', 'Harai Goshi', 'Deashi Barai', 'Sasae Tsurikomi Ashi', 'Ko Uchi Gari', 'Tani Otoshi'] },
      { name: 'Sambo', style: 'grappling', origin: 'Russia', difficulty: 'advanced', techniques: ['Leg Lace', 'Knee Bar', 'Straight Ankle Lock', 'Sambo Throw', 'Hip Throw', 'Body Drop', 'Shoulder Lock', 'Flying Armbar', 'Suplex', 'Fireman Carry', 'Head and Arm Throw', 'Sacrifice Throw'] },
      { name: 'Wrestling', style: 'grappling', origin: 'Ancient Greece', difficulty: 'beginner', techniques: ['Double Leg Takedown', 'Single Leg Takedown', 'Sprawl', 'Hip Toss', 'Arm Drag', 'Duck Under', 'Whizzer', 'Half Nelson', 'Cradle', 'Escape to Base', 'Switch', 'Granby Roll'] },
      { name: 'Catch Wrestling', style: 'grappling', origin: 'United Kingdom', difficulty: 'advanced', techniques: ['Double Wrist Lock', 'Toe Hold', 'Heel Hook', 'Chest Lock', 'Spine Lock', 'Neck Crank', 'Bridging Escape', 'Short Arm Scissor', 'Butterfly Lock', 'Cross Face', 'Far Side Ankle', 'Top Wristlock'] },
      { name: 'Wing Chun', style: 'traditional', origin: 'China', difficulty: 'intermediate', techniques: ['Chain Punch', 'Tan Sao', 'Bong Sao', 'Fook Sao', 'Pak Sao', 'Biu Jee', 'Chum Kiu', 'Siu Nim Tao', 'Chi Sao', 'Lap Sao', 'Guan Sao', 'Jut Sao'] },
      { name: 'Aikido', style: 'traditional', origin: 'Japan', difficulty: 'intermediate', techniques: ['Ikkyo', 'Nikkyo', 'Sankyo', 'Yonkyo', 'Kotegaeshi', 'Shihonage', 'Iriminage', 'Kokyunage', 'Tenchinage', 'Koshinage', 'Jujinage', 'Hiji Kime Osae'] },
      { name: 'Kung Fu (Shaolin)', style: 'traditional', origin: 'China', difficulty: 'advanced', techniques: ['Tiger Claw', 'Dragon Fist', 'Crane Beak', 'Snake Hand', 'Leopard Punch', 'Mantis Hook', 'Iron Palm', 'Rushing Boar', 'Eagle Claw', 'Drunken Fist', 'Shadowless Kick', 'Chain Whip'] },
      { name: 'Capoeira', style: 'traditional', origin: 'Brazil', difficulty: 'advanced', techniques: ['Meia Lua de Compasso', 'Armada', 'Macaco', 'Au', 'Rabo de Arraia', 'Martelo', 'Bencao', 'Queixada', 'Ginga', 'Esquiva', 'Role', 'Negativa'] },
      { name: 'Silat', style: 'traditional', origin: 'Indonesia', difficulty: 'advanced', techniques: ['Sapu', 'Besaput', 'Tumbukan', 'Tendangan', 'Kuncian', 'Lempar', 'Potong', 'Pukulan', 'Jurus', 'Langkah', 'Sikap Pasang', 'Buang'] },
      { name: 'Kendo', style: 'weapons', origin: 'Japan', difficulty: 'intermediate', techniques: ['Men', 'Kote', 'Do', 'Tsuki', 'Nidan Waza', 'Sandan Waza', 'Hiki Waza', 'Harai Waza', 'Debana Waza', 'Katsugi Waza', 'Nuki Waza', 'Suriage Waza'] },
      { name: 'Eskrima', style: 'weapons', origin: 'Philippines', difficulty: 'intermediate', techniques: ['Sinawali', 'Redondo', 'Abanico', 'Punyo Strike', 'Disarm', 'Banda y Banda', 'Hubud Lubud', 'Tapi Tapi', 'Cadena', 'Serrada', 'Largo Mano', 'Corto'] },
      { name: 'Fencing', style: 'weapons', origin: 'France/Italy', difficulty: 'intermediate', techniques: ['Fleche', 'Lunge', 'Parry 4', 'Parry 6', 'Riposte', 'Beat Attack', 'Disengage', 'Counter-Attack', 'Balestra', 'Appel', 'Flanconnade', 'Coupé'] },
      { name: 'Naginatajutsu', style: 'weapons', origin: 'Japan', difficulty: 'advanced', techniques: ['Shomen Uchi', 'Yokomen Uchi', 'Tsuki', 'Kesa Giri', 'Maki Otoshi', 'Nagashi', 'Uchi Otoshi', 'Hasso Gaeshi', 'Kuruma Gaeshi', 'Guruma', 'Tsubame Gaeshi', 'Suri Age'] },
      { name: 'Bojutsu', style: 'weapons', origin: 'Japan', difficulty: 'intermediate', techniques: ['Overhead Strike', 'Thrust', 'Sweep', 'Block', 'Poke', 'Smash', 'Twirl', 'Figure Eight', 'Wrist Flip', 'Neck Strike', 'Shin Strike', 'Choke'] },
      { name: 'MMA', style: 'hybrid', origin: 'United States/Brazil', difficulty: 'advanced', techniques: ['Jab-Cross-Hook Combo', 'Double Leg Takedown', 'Sprawl and Brawl', 'Clinch Knee', 'Ground and Pound', 'Rear Naked Choke', 'Armbar from Guard', 'Slam', 'Cage Walk', 'Superman Punch', 'Spinning Elbow', 'Flying Knee'] },
      { name: 'Systema', style: 'hybrid', origin: 'Russia', difficulty: 'advanced', techniques: ['Shock Absorption', 'Wave Movement', 'Breathing Control', 'Fist Push', 'Palm Strike', 'Elbow Strike', 'Knee Strike', 'Kick', 'Takedown', 'Choke', 'Joint Manipulation', 'Ground Work'] },
      { name: 'Jeet Kune Do', style: 'hybrid', origin: 'United States', difficulty: 'advanced', techniques: ['Lead Straight', 'Cross', 'Lead Hook', 'Side Kick', 'Hook Kick', 'Biu Jee', 'Trapping', 'Interception', 'Stop Hit', 'Five Ways of Attack', 'Economy of Motion', 'Be Water'] },
      { name: 'Ninjutsu', style: 'hybrid', origin: 'Japan', difficulty: 'expert', techniques: ['Taijutsu Strike', 'Kamae Stance', 'Roll', 'Breakfall', 'Throw', 'Joint Lock', 'Choke', 'Weapon Disarm', 'Stealth Movement', 'Evasion', 'Counter Technique', 'Pressure Point Strike'] },
      { name: 'MCMAP', style: 'hybrid', origin: 'United States', difficulty: 'intermediate', techniques: ['Straight Punch', 'Hamfist', 'Knifehand Strike', 'Front Kick', 'Roundhouse Punch', 'Upper Cut', 'Hammer Fist', 'Elbow Strike', 'Knee Strike', 'Choke', 'Counter Choke', 'Ground Choke'] },
    ];
    for (const a of arts) {
      await db.martialArt.create({ data: { name: a.name, style: a.style, origin: a.origin, description: `${a.name} is a ${a.style}-based martial art originating from ${a.origin} with ${a.difficulty} difficulty level. It emphasizes ${a.techniques.slice(0, 3).join(', ').toLowerCase()} among its core techniques.`, difficulty: a.difficulty, techniques: JSON.stringify(a.techniques), effectiveness: JSON.stringify({ striking: a.style === 'striking' ? 9 : a.style === 'hybrid' ? 7 : 3, grappling: a.style === 'grappling' ? 9 : a.style === 'hybrid' ? 7 : 3, weapons: a.style === 'weapons' ? 9 : a.style === 'traditional' ? 6 : 2, selfDefense: a.style === 'hybrid' ? 9 : 7, fitness: 8 }) } });
    }
    counts.martialArts = arts.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 14. INTELLIGENCE FEEDS (6)
  // ════════════════════════════════════════════════════════════════
  if ((await db.intelligenceFeed.count()) === 0) {
    const feeds = [
      { name: 'IRONSIGHT', source: 'iron_sight', feedType: 'ioc', url: 'https://ironsight.intel/api/v2/feed', apiKey: 'irs_a8f3e2d1c4b5a6d7e8f9', frequency: 'real_time', isActive: true },
      { name: 'OpenThreat', source: 'open_threat', feedType: 'vulnerability', url: 'https://openthreat.io/api/feed', apiKey: 'ot_b2c4d6e8f0a1b3c5d7e9', frequency: 'hourly', isActive: true },
      { name: 'Mini-Shodan', source: 'mini_shodan', feedType: 'ioc', url: 'https://api.minishodan.io/v1/query', apiKey: 'ms_c1d3e5f7a9b2c4d6e8f0', frequency: 'hourly', isActive: true },
      { name: 'Omniroute', source: 'omniroute', feedType: 'threat_actor', url: 'http://omniroute:8088/api/intel', apiKey: 'om_e4f6a8c0d2b5e7f9a1c3', frequency: 'daily', isActive: true },
      { name: 'DarkWeb Monitor', source: 'custom', feedType: 'dark_web', url: 'https://darkweb-monitor.intel/api/feed', apiKey: 'dw_a7b9c1d3e5f7a9b2c4d6', frequency: 'daily', isActive: false },
      { name: 'GeoPolitical Intel', source: 'custom', feedType: 'geo_political', url: 'https://geointel-api.intel/feed', apiKey: 'gp_f8a0b2c4d6e8f1a3b5c7', frequency: 'weekly', isActive: true },
    ];
    for (const f of feeds) {
      await db.intelligenceFeed.create({ data: { ...f, lastFetchedAt: f.isActive ? new Date(Date.now() - Math.random() * 86400000) : null, itemCount: Math.floor(Math.random() * 500) } });
    }
    counts.intelligenceFeeds = feeds.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 15. SPA GATEWAYS (6)
  // ════════════════════════════════════════════════════════════════
  if ((await db.spaGateway.count()) === 0) {
    const gws = [
      { name: 'Forensic Gateway', subsystem: 'forensic', port: 4748, network: '172.30.0.0/16' },
      { name: 'Offensive Gateway', subsystem: 'offensive', port: 4747, network: '172.31.0.0/16' },
      { name: 'Defensive Gateway', subsystem: 'defensive', port: 4749, network: '172.32.0.0/16' },
      { name: 'Micro-Defensive Gateway', subsystem: 'micro_defensive', port: 4750, network: '172.33.0.0/16' },
      { name: 'Sensors Gateway', subsystem: 'sensors', port: 9901, network: '172.34.0.0/16' },
      { name: 'VIP Gateway', subsystem: 'vip', port: 4751, network: '172.35.0.0/16' },
    ];
    for (const g of gws) {
      await db.spaGateway.create({ data: { ...g, secretHash: await hash(`${g.subsystem}_spa_secret_2024`), deployedServices: '[]' } });
    }
    counts.spaGateways = gws.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 16. CONSTITUTIONS (6)
  // ════════════════════════════════════════════════════════════════
  if ((await db.constitution.count()) === 0) {
    const constitutions = [
      { name: 'BABIRYE Constitution', subsystem: 'babirye', content: '# BABIRYE Constitution v10.0.0\n\n## Article 1: Mission Statement\nBABIRYE serves as the supreme operational intelligence and security platform for comprehensive defense operations. All actions must align with protecting organizational assets, personnel, and critical infrastructure.\n\n## Article 2: Authority Levels\n- CL-5 (Administrator): Full system access, user management, configuration\n- CL-4 (Operator): Tool deployment, task execution, VIP operations\n- CL-3 (Analyst): Data analysis, report generation, monitoring\n- CL-2 (Viewer): Read-only access to dashboards and reports\n\n## Article 3: Rules of Engagement\nAll offensive operations require documented authorization from a CL-5 operator. No action may be taken against external targets without explicit written approval. Red team operations must have a defined scope and rules of engagement document.\n\n## Article 4: Audit Requirements\nEvery action, API call, configuration change, and tool deployment must be logged with full context. Audit logs are immutable and must be retained for a minimum of 7 years. Tampering with audit logs is a critical violation.\n\n## Article 5: Self-Attack Wall\nThe Self-Attack Wall is inviolable. No configuration change, bypass, or modification of the 25 guard modules is permitted without three-person authorization from CL-5 operators. Any attempt to disable the wall triggers immediate system lockdown.\n\n## Article 6: VIP Protection\nVIP protection operations take absolute priority over all other system functions. Any threat to a protected principal triggers an automatic escalation to critical alert level with immediate resource allocation.' },
      { name: 'Forensic Constitution', subsystem: 'forensic', content: '# Forensic Operations Constitution\n\n## Article 1: Evidence Handling\nAll forensic evidence must be collected, preserved, and analyzed following ISO 17025 standards. Chain of custody must be maintained from acquisition through final reporting. No evidence may be examined without creating a verified hash of the original media first.\n\n## Article 2: Tool Authorization\nForensic tools are dormant by default and require SPA-authorized activation. Each tool deployment must be logged with the case number, analyst name, and specific purpose. Tools must be deactivated after use.\n\n## Article 3: Reporting Standards\nAll forensic findings must be documented in standardized reports including methodology, findings, and conclusions. Reports must be peer-reviewed by a second analyst before submission.\n\n## Article 4: Data Privacy\nForensic operations involving personal data must comply with applicable privacy regulations. Minimization of collected personal data is mandatory.' },
      { name: 'Offensive Constitution', subsystem: 'offensive', content: '# Offensive Operations Constitution\n\n## Article 1: Authorization Requirements\nAll offensive operations require CL-5 written authorization with defined scope, duration, and targets. Operations must have a clear operational objective and risk assessment.\n\n## Article 2: Containment\nOffensive tools operate in isolated network segments with no path to production systems. Tool deployment requires SPA authorization and all traffic is logged.\n\n## Article 3: Reporting\nPost-operation reports must detail all actions taken, vulnerabilities found, and recommendations. Reports are classified at minimum CONFIDENTIAL.' },
      { name: 'Defensive Constitution', subsystem: 'defensive', content: '# Defensive Operations Constitution\n\n## Article 1: Defense in Depth\nBABIRYE implements defense in depth across seven layers: network, endpoint, application, identity, data, cloud, and micro-defensive. Each layer must have active monitoring and automated response capabilities.\n\n## Article 2: Alert Triage\nAll security alerts must be triaged within 15 minutes of generation. Critical alerts require immediate human review. False positive feedback must be provided to improve detection accuracy.\n\n## Article 3: Patch Management\nVulnerability patches must be applied within the following SLAs: Critical 24 hours, High 72 hours, Medium 14 days, Low 30 days.' },
      { name: 'Micro-Defensive Constitution', subsystem: 'micro_defensive', content: '# Micro-Defensive Operations Constitution\n\n## Article 1: Input Validation\nAll user inputs must be validated, sanitized, and encoded appropriate to their context. No user input may be used directly in queries, commands, or responses without processing.\n\n## Article 2: Output Encoding\nAll outputs must be encoded for their destination context. HTML, JavaScript, URL, CSS, and SQL contexts each require appropriate encoding.\n\n## Article 3: Rate Limiting\nAll API endpoints must have rate limiting. Authentication endpoints are limited to 5 attempts per 15 minutes. General API endpoints allow 120 requests per minute.' },
      { name: 'Sensors Constitution', subsystem: 'sensors', content: '# Sensor Operations Constitution\n\n## Article 1: Sensor Management\nAll 31 sensor types must be registered in the system with current calibration data. Sensors must be calibrated according to manufacturer schedules. Offline sensors must be reported and repaired within 48 hours.\n\n## Article 2: Data Handling\nSensor data must be retained for 90 days minimum. Anomaly detection algorithms must flag readings exceeding 3 standard deviations from baseline. All sensor data is classified as INTERNAL by default.\n\n## Article 3: Integration\nSensor data feeds into the Expert Council for correlation with other intelligence sources. Multi-sensor fusion requires at least 3 independent sensor confirmations before threat declaration.' },
    ];
    for (const c of constitutions) {
      await db.constitution.create({ data: { name: c.name, subsystem: c.subsystem, content: c.content, version: '1.0.0', isActive: true } });
    }
    counts.constitutions = constitutions.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 17. SYSTEM SETTINGS (15)
  // ════════════════════════════════════════════════════════════════
  if ((await db.systemSetting.count()) === 0) {
    const settings = [
      { key: 'qdrant_url', value: 'http://qdrant:6333', category: 'database', isSecret: false, description: 'Qdrant vector database connection URL' },
      { key: 'qdrant_collection', value: 'babirye_memories', category: 'database', isSecret: false, description: 'Default Qdrant collection for vector storage' },
      { key: 'neo4j_uri', value: 'bolt://neo4j:7687', category: 'database', isSecret: false, description: 'Neo4j graph database connection URI' },
      { key: 'neo4j_user', value: 'neo4j', category: 'database', isSecret: false, description: 'Neo4j database username' },
      { key: 'neo4j_password', value: 'CHANGE_ME_IN_PRODUCTION', category: 'database', isSecret: true, description: 'Neo4j database password' },
      { key: 'meilisearch_url', value: 'http://meilisearch:7700', category: 'database', isSecret: false, description: 'Meilisearch full-text search engine URL' },
      { key: 'meilisearch_api_key', value: 'CHANGE_ME_IN_PRODUCTION', category: 'database', isSecret: true, description: 'Meilisearch API master key' },
      { key: 'nats_url', value: 'nats://nats:4222', category: 'network', isSecret: false, description: 'NATS messaging server URL' },
      { key: 'temporal_url', value: 'temporal:7233', category: 'network', isSecret: false, description: 'Temporal workflow engine connection URL' },
      { key: 'omniroute_url', value: 'http://omniroute:8088', category: 'api', isSecret: false, description: 'Omniroute intelligence service URL' },
      { key: 'jwt_secret', value: 'CHANGE_ME_IN_PRODUCTION', category: 'security', isSecret: true, description: 'JWT token signing secret (minimum 32 characters)' },
      { key: 'cors_origins', value: 'http://localhost:3000,http://localhost:8000', category: 'security', isSecret: false, description: 'Allowed CORS origins (comma-separated)' },
      { key: 'forensic_password', value: 'CHANGE_ME_IN_PRODUCTION', category: 'security', isSecret: true, description: 'Forensic subsystem SPA gateway password' },
      { key: 'offensive_password', value: 'CHANGE_ME_IN_PRODUCTION', category: 'security', isSecret: true, description: 'Offensive subsystem SPA gateway password' },
      { key: 'defensive_password', value: 'CHANGE_ME_IN_PRODUCTION', category: 'security', isSecret: true, description: 'Defensive subsystem SPA gateway password' },
    ];
    for (const s of settings) {
      await db.systemSetting.create({ data: s });
    }
    counts.systemSettings = settings.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 18. AUDIT LOGS (30)
  // ════════════════════════════════════════════════════════════════
  if ((await db.auditLog.count()) === 0) {
    const users = await db.user.findMany({ select: { id: true, email: true } });
    const actions = [
      { action: 'login', resource: 'auth', details: '{"method":"password","mfa":false}' },
      { action: 'task_create', resource: 'task', details: '{"type":"defensive","priority":7}' },
      { action: 'agent_execute', resource: 'agent', details: '{"agent":"Defensive Agent","task":"scan_network"}' },
      { action: 'tool_deploy', resource: 'tool', details: '{"tool":"Suricata","type":"defensive"}' },
      { action: 'alert_trigger', resource: 'alert', details: '{"severity":"high","type":"intrusion"}' },
      { action: 'settings_change', resource: 'settings', details: '{"key":"cors_origins","old":"...","new":"..."}' },
      { action: 'user_create', resource: 'user', details: '{"role":"analyst"}' },
      { action: 'wall_test', resource: 'wall', details: '{"guard":"self-injection","result":"blocked"}' },
      { action: 'council_consult', resource: 'council', details: '{"decision":"approved","confidence":0.78}' },
      { action: 'report_generate', resource: 'report', details: '{"type":"incident","classification":"confidential"}' },
    ];
    for (let i = 0; i < 30; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const act = actions[Math.floor(Math.random() * actions.length)];
      await db.auditLog.create({
        data: {
          userId: user.id, action: act.action, resource: act.resource, details: act.details,
          ipAddress: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          statusCode: Math.random() > 0.1 ? 200 : 401,
          durationMs: Math.floor(Math.random() * 500) + 10,
          createdAt: new Date(Date.now() - Math.random() * 30 * 86400000),
        }
      });
    }
    counts.auditLogs = 30;
  }

  // ════════════════════════════════════════════════════════════════
  // 19. SECURITY ALERTS (15)
  // ════════════════════════════════════════════════════════════════
  if ((await db.securityAlert.count()) === 0) {
    const alerts = [
      { type: 'intrusion', severity: 'critical', title: 'Unauthorized Access Attempt Detected', description: 'Multiple failed login attempts from IP 203.0.113.42 exceeding rate limit threshold. Pattern consistent with brute force attack.', status: 'investigating' },
      { type: 'malware', severity: 'high', title: 'Suspicious Process Execution', description: 'Process with SHA256 a1b2c3d4... executed from temporary directory attempting network connections to known C2 infrastructure.', status: 'new' },
      { type: 'anomaly', severity: 'medium', title: 'Anomalous Data Transfer Detected', description: 'Unusual outbound data transfer of 2.3GB from database server to external IP during non-business hours.', status: 'new' },
      { type: 'policy_violation', severity: 'low', title: 'Policy Violation: Unencrypted USB Device', description: 'Unencrypted USB storage device connected to workstation WS-FINANCE-07 in violation of data protection policy.', status: 'resolved' },
      { type: 'intrusion', severity: 'high', title: 'Port Scan Detected from Internal Network', description: 'Systematic port scanning originating from internal IP 10.0.1.105 targeting multiple internal subnets.', status: 'investigating' },
      { type: 'dos', severity: 'critical', title: 'DDoS Attack Mitigation Active', description: 'Volumetric DDoS attack targeting public-facing web services at 4.7 Gbps. Automated mitigation absorbing 98% of malicious traffic.', status: 'new' },
      { type: 'phishing', severity: 'medium', title: 'Phishing Campaign Targeting Staff', description: 'Coordinated phishing campaign detected targeting 15 email addresses with crafted credential harvesting pages.', status: 'resolved' },
      { type: 'anomaly', severity: 'low', title: 'Elevated Login Activity', description: 'User account analyst3@babirye.local showing 3x normal login frequency from 4 different geographic locations.', status: 'investigating' },
      { type: 'data_breach', severity: 'critical', title: 'Potential Data Breach Indicator', description: 'Database query patterns consistent with data exfiltration detected on customer records table.', status: 'new' },
      { type: 'malware', severity: 'high', title: 'Ransomware Indicators Detected', description: 'File encryption patterns consistent with LockBit 3.0 ransomware detected on endpoint EP-HR-012.', status: 'new' },
      { type: 'intrusion', severity: 'medium', title: 'Suspicious SSH Activity', description: 'Multiple SSH connection attempts using non-standard usernames targeting bastion host from external IPs.', status: 'false_positive' },
      { type: 'policy_violation', severity: 'low', title: 'Unauthorized Software Installation', description: 'Torrrent client detected on workstation WS-DEV-003, violating acceptable use policy.', status: 'resolved' },
      { type: 'anomaly', severity: 'medium', title: 'DNS Query Anomaly', description: 'Unusual DNS query volume for .onion TLD from server SVR-APP-001 indicating potential covert communication.', status: 'investigating' },
      { type: 'intrusion', severity: 'high', title: 'Web Application Attack Detected', description: 'SQL injection attempt blocked by WAF on customer portal. Source IP: 198.51.100.73.', status: 'resolved' },
      { type: 'dos', severity: 'medium', title: 'API Rate Limit Exceeded', description: 'Sustained API request rate exceeding 500 req/s from single source IP targeting /api/agents endpoint.', status: 'resolved' },
    ];
    const statuses = ['new', 'investigating', 'resolved', 'false_positive'];
    for (const a of alerts) {
      await db.securityAlert.create({ data: { ...a, source: a.type, ioc: JSON.stringify({ ips: ['203.0.113.42'], domains: [], hashes: [], urls: [] }), createdAt: new Date(Date.now() - Math.random() * 7 * 86400000) } });
    }
    counts.securityAlerts = alerts.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 20. NOTIFICATIONS (20)
  // ════════════════════════════════════════════════════════════════
  if ((await db.notification.count()) === 0) {
    const notifications = [
      { type: 'alert', title: 'Critical Alert: DDoS Attack', message: 'Volumetric DDoS attack detected and mitigation is active. Current throughput: 4.7 Gbps.', severity: 'critical', isRead: false },
      { type: 'task', title: 'Task Completed: Network Scan', message: 'Defensive Agent completed network vulnerability scan. Found 3 new findings.', severity: 'info', isRead: true },
      { type: 'system', title: 'System Update Available', message: 'BABIRYE v10.0.1 security patch available. Includes Self-Attack Wall improvements.', severity: 'info', isRead: false },
      { type: 'vip', title: 'VIP Alert: Principal Alpha', message: 'Principal Alpha drone Alpha-Drone-2 has entered low battery state (35%).', severity: 'warning', isRead: false },
      { type: 'sensor', title: 'Sensor Anomaly: Radar', message: 'AESA P-2D Radar detected anomalous signature at bearing 045, range 180km.', severity: 'high', isRead: false },
      { type: 'alert', title: 'New Security Alert', message: 'Ransomware indicators detected on endpoint EP-HR-012. Immediate investigation required.', severity: 'critical', isRead: false },
      { type: 'task', title: 'Task Failed: Evidence Acquisition', message: 'Forensic Agent failed to acquire evidence from target device. Error: timeout.', severity: 'warning', isRead: true },
      { type: 'system', title: 'Database Backup Complete', message: 'Daily database backup completed successfully. Size: 2.4 GB. Duration: 12 minutes.', severity: 'info', isRead: true },
      { type: 'vip', title: 'VIP Movement: Principal Beta', message: 'Principal Beta has departed the facility. ETA to destination: 35 minutes.', severity: 'info', isRead: true },
      { type: 'sensor', title: 'Sensor Offline: Acoustic', message: 'Gunshot Detector in Sector B has gone offline. Last contact: 14 minutes ago.', severity: 'warning', isRead: false },
      { type: 'alert', title: 'Phishing Campaign Detected', message: 'Coordinated phishing campaign targeting 15 staff members detected and blocked.', severity: 'medium', isRead: true },
      { type: 'system', title: 'Certificate Expiry Warning', message: 'TLS certificate for api.babirye.local expires in 14 days. Renewal required.', severity: 'warning', isRead: false },
      { type: 'task', title: 'Task Running: Full Scan', message: 'Defensive Agent is performing full infrastructure vulnerability scan. Progress: 67%.', severity: 'info', isRead: true },
      { type: 'vip', title: 'Wearable Alert: Low Battery', message: 'Garmin Tactix 7 Pro for Principal Alpha is at 18% battery. Please charge.', severity: 'info', isRead: true },
      { type: 'sensor', title: 'LiDAR: Perimeter Breach', message: 'Velodyne VLP-16 detected unauthorized vehicle approaching North Gate at 23:47.', severity: 'high', isRead: false },
      { type: 'alert', title: 'Wall Block: Injection Attempt', message: 'Self-Attack Wall guard "self-injection" blocked a request containing eval() pattern.', severity: 'high', isRead: true },
      { type: 'system', title: 'Memory Usage Warning', message: 'System memory usage at 87%. Consider scaling or optimizing active operations.', severity: 'warning', isRead: false },
      { type: 'task', title: 'Task Created: Intel Report', message: 'New intelligence report generation task assigned to Analyst Watcher.', severity: 'info', isRead: true },
      { type: 'vip', title: 'SOS Cancelled: False Alarm', message: 'SOS trigger on PANIC-ALPHA-1 was a false alarm. Device reset and verified.', severity: 'info', isRead: true },
      { type: 'sensor', title: 'EW: Spectrum Anomaly', message: 'SIGINT Interceptor detected unusual RF emissions in 2.4 GHz band near East perimeter.', severity: 'medium', isRead: false },
    ];
    const user = (await db.user.findFirst({ where: { role: 'admin' } }))!;
    for (const n of notifications) {
      await db.notification.create({ data: { ...n, userId: user.id, metadata: '{}', createdAt: new Date(Date.now() - Math.random() * 3 * 86400000), expiresAt: new Date(Date.now() + 7 * 86400000) } });
    }
    counts.notifications = notifications.length;
  }

  // ════════════════════════════════════════════════════════════════
  // 21. SAMPLE TASKS
  // ════════════════════════════════════════════════════════════════
  if ((await db.task.count()) === 0) {
    const agents = await db.agent.findMany({ select: { id: true, domain: true } });
    const user = (await db.user.findFirst({ where: { role: 'admin' } }))!;
    const taskTypes = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];
    const statuses = ['pending', 'running', 'completed', 'completed', 'completed', 'failed'];
    for (let i = 0; i < 15; i++) {
      const type = taskTypes[i % taskTypes.length];
      const agent = agents.find(a => a.domain === type) || agents[0];
      const status = statuses[i % statuses.length];
      await db.task.create({
        data: {
          agentId: agent.id, creatorId: user.id, type, status,
          priority: Math.floor(Math.random() * 8) + 2,
          input: JSON.stringify({ description: `Automated ${type} operation task #${i + 1}`, params: {} }),
          output: status === 'completed' ? JSON.stringify({ result: 'Operation successful', findings: Math.floor(Math.random() * 10) }) : null,
          errorMessage: status === 'failed' ? 'Connection timeout to target system' : null,
          progress: status === 'completed' ? 100 : status === 'running' ? Math.floor(Math.random() * 80) + 10 : status === 'failed' ? 45 : 0,
          startedAt: status !== 'pending' ? new Date(Date.now() - Math.random() * 86400000) : null,
          completedAt: (status === 'completed' || status === 'failed') ? new Date(Date.now() - Math.random() * 43200000) : null,
        }
      });
    }
    counts.tasks = 15;
  }

  return counts;
}