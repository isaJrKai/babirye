/**
 * BABIRYE v10.0.0 — Standalone Seed Runner
 * Run: cd /home/z/my-project && node scripts/run-seed.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const db = new PrismaClient();
const BCRYPT_ROUNDS = 4;

async function hash(pw) { return bcrypt.hash(pw, BCRYPT_ROUNDS); }

function loadSeedJson() {
  const p = path.join(__dirname, '..', 'src', 'lib', 'seed-data.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function main() {
  console.log('🚀 BABIRYE v10.0.0 — Seeding database...');
  const seedData = loadSeedJson();
  const counts = {};

  // ════════════════════════════════════════════════════════════════
  // CLEAR ALL TABLES (in dependency order)
  // ════════════════════════════════════════════════════════════════
  console.log('Cleaning existing data...');
  const deleteOrder = [
    'sensorReading','vipIncident','wallBlock','councilVote','councilDecision','scenario',
    'intelItem','vipDrone','vipVehicle','vipWearable','apiToken','auditLog','notification',
    'sensor','potential','securityAlert','task','report','weapon','martialArt',
    'intelligenceFeed','spaGateway','constitution','systemSetting',
    'vipProfile','offensiveTool','defensiveTool','microDefensiveTool','forensicTool',
    'wallGuard','councilDomain','agent','user'
  ];
  for (const m of deleteOrder) {
    try { const r = await db[m].deleteMany(); if (r.count > 0) console.log(`  Cleared ${m}: ${r.count}`); } catch(e) {}
  }

  // ════════════════════════════════════════════════════════════════
  // 1. USERS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding users...');
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
    await db.user.create({
      data: {
        email: u.email,
        passwordHash: await hash(u.password),
        name: u.name,
        role: u.role,
        lastLoginAt: new Date(Date.now() - Math.random() * 7 * 86400000),
        isActive: true,
      }
    });
  }
  counts.users = users.length;
  console.log(`  Created ${users.length} users`);

  // ════════════════════════════════════════════════════════════════
  // 2. AGENTS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding agents...');
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
    await db.agent.create({
      data: {
        name: a.name, domain: a.domain, description: a.description,
        version: a.version, status: a.status, config: '{}',
        metrics: JSON.stringify({ tasksCompleted: Math.floor(Math.random() * 50), successRate: (0.85 + Math.random() * 0.14).toFixed(3) }),
        lastActivityAt: a.status === 'running' ? new Date(Date.now() - Math.random() * 3600000) : null,
      }
    });
  }
  counts.agents = agents.length;
  console.log(`  Created ${agents.length} agents`);

  // ════════════════════════════════════════════════════════════════
  // 3. COUNCIL DOMAINS (12)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding council domains...');
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
    { name: 'Intelligence Analysis', specialty: 'threat_intelligence ioc ttp apt campaign attribution geopolitics cyber_espionage', description: 'Strategic and tactical intelligence analysis expertise covering threat actor profiling, campaign tracking, and geopolitical cyber threat assessment.' },
    { name: 'Cyber-Kinetic Operations', specialty: 'SCADA ICS PLC HMI industrial_control cyber_physical critical_infrastructure OT', description: 'Specialized in the intersection of cyber and physical security covering industrial control systems, SCADA networks, and critical infrastructure protection.' },
  ];
  for (const d of domains) {
    await db.councilDomain.create({
      data: { name: d.name, description: d.description, specialty: d.specialty, confidenceBase: 0.3, isActive: true, weight: 1.0 }
    });
  }
  counts.councilDomains = domains.length;
  console.log(`  Created ${domains.length} council domains`);

  // ════════════════════════════════════════════════════════════════
  // 4. WALL GUARDS (25)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding wall guards...');
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
    await db.wallGuard.create({
      data: {
        name: g.name, description: g.description, category: g.category,
        isActive: true, blockCount: Math.floor(Math.random() * 20),
        severity: g.severity, config: '{}',
        lastBlockedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000) : null,
      }
    });
  }
  counts.wallGuards = guards.length;
  console.log(`  Created ${guards.length} wall guards`);

  // ════════════════════════════════════════════════════════════════
  // 5. FORENSIC TOOLS (12)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding forensic tools...');
  const forensicTools = [
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
  for (const t of forensicTools) {
    await db.forensicTool.create({
      data: { name: t.name, category: t.category, description: t.description, version: '10.0.0', status: 'dormant', containerImage: t.containerImage, port: t.port, config: '{}' }
    });
  }
  counts.forensicTools = forensicTools.length;
  console.log(`  Created ${forensicTools.length} forensic tools`);

  // ════════════════════════════════════════════════════════════════
  // 6. OFFENSIVE TOOLS (from JSON)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding offensive tools...');
  const offTools = seedData.offensive_tools || [];
  for (const t of offTools) {
    await db.offensiveTool.create({
      data: { name: t.name, category: t.category, subcategory: t.category, description: t.description, version: t.version || '10.0.0', status: t.status || 'dormant', containerImage: t.containerImage || '', port: t.port || null, config: t.config || '{}', riskLevel: t.riskLevel || 'high', requiresAuth: t.requiresAuth ?? true }
    });
  }
  counts.offensiveTools = offTools.length;
  console.log(`  Created ${offTools.length} offensive tools`);

  // ════════════════════════════════════════════════════════════════
  // 7. DEFENSIVE TOOLS (from JSON)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding defensive tools...');
  const defTools = seedData.defensive_tools || [];
  for (const t of defTools) {
    await db.defensiveTool.create({
      data: { name: t.name, category: t.category, subcategory: t.category, description: t.description, version: t.version || '10.0.0', status: t.status || 'dormant', containerImage: t.containerImage || '', config: t.config || '{}', autoDeploy: t.autoDeploy ?? false }
    });
  }
  counts.defensiveTools = defTools.length;
  console.log(`  Created ${defTools.length} defensive tools`);

  // ════════════════════════════════════════════════════════════════
  // 8. MICRO-DEFENSIVE TOOLS (from JSON)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding micro-defensive tools...');
  const microTools = seedData.micro_tools || [];
  for (const t of microTools) {
    await db.microDefensiveTool.create({
      data: { name: t.name, category: t.category, description: t.description, status: t.status || 'dormant', config: t.config || '{}', isActive: t.isActive ?? true, blockCount: Math.floor(Math.random() * 15) }
    });
  }
  counts.microDefensiveTools = microTools.length;
  console.log(`  Created ${microTools.length} micro-defensive tools`);

  // ════════════════════════════════════════════════════════════════
  // 9. SENSORS (from JSON)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding sensors...');
  const sensors = seedData.sensors || [];
  const locations = ['Sector A - North Perimeter', 'Sector B - East Gate', 'Sector C - South Wall', 'Sector D - West Approach', 'Rooftop Alpha', 'Rooftop Bravo', 'Underground Level 1', 'Mobile Unit 1', 'Mobile Unit 2', 'Forward Operating Base'];
  for (let i = 0; i < sensors.length; i++) {
    const s = sensors[i];
    await db.sensor.create({
      data: { name: s.name, type: s.type, subtype: s.subtype, description: s.description, status: i < 20 ? 'online' : 'offline', config: s.config || '{}', location: locations[i % locations.length], range: s.range || 100, frequency: s.frequency || 'continuous', sensitivity: s.sensitivity || 0.8 }
    });
  }
  counts.sensors = sensors.length;
  console.log(`  Created ${sensors.length} sensors`);

  // ════════════════════════════════════════════════════════════════
  // 10. VIP PROFILES
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding VIP profiles...');
  const alpha = await db.vipProfile.create({ data: { name: 'Principal Alpha', designation: 'Chief Executive Officer', threatLevel: 'high', protectionLevel: 'maximum', status: 'active', emergencyContact: '+1-555-0100', medicalInfo: '{"blood_type":"O+","allergies":["penicillin"],"conditions":["hypertension"]}', travelSchedule: '{"next_movement":"2024-07-15T09:00:00Z","destination":"HQ-Bravo","transport":"armored_convoy"}' } });
  const beta = await db.vipProfile.create({ data: { name: 'Principal Beta', designation: 'Chief Technology Officer', threatLevel: 'medium', protectionLevel: 'elevated', status: 'active', emergencyContact: '+1-555-0200', medicalInfo: '{"blood_type":"A+","allergies":[],"conditions":["asthma"]}', travelSchedule: '{}' } });
  const gamma = await db.vipProfile.create({ data: { name: 'Principal Gamma', designation: 'Board Member', threatLevel: 'low', protectionLevel: 'standard', status: 'active', emergencyContact: '+1-555-0300', medicalInfo: '{"blood_type":"B+","allergies":["sulfa"],"conditions":[]}', travelSchedule: '{}' } });

  await db.vipDrone.createMany({ data: [
    { vipId: alpha.id, name: 'Alpha-Drone-1', model: 'MQ-9 Reaper', status: 'standby', batteryLevel: 95, altitude: null, speed: null, gpsCoords: null, cameraActive: false, thermalActive: false, mission: null },
    { vipId: alpha.id, name: 'Alpha-Drone-2', model: 'DJI Matrice 350', status: 'airborne', batteryLevel: 78, altitude: 120.5, speed: 15.2, gpsCoords: '{"lat":38.8977,"lng":-77.0365}', cameraActive: true, thermalActive: true, mission: '{"type":"perimeter_patrol","waypoints":8}' },
    { vipId: beta.id, name: 'Beta-Drone-1', model: 'DJI Mavic 3T', status: 'charging', batteryLevel: 45, altitude: null, speed: null, gpsCoords: null, cameraActive: false, thermalActive: false, mission: null },
  ]});

  await db.vipVehicle.createMany({ data: [
    { vipId: alpha.id, name: 'Alpha-Vehicle-1', type: 'armored', plate: 'GOV-ALPHA-1', status: 'parked', fuelLevel: 92, gpsCoords: '{"lat":38.8977,"lng":-77.0365}', driverId: 'ops1@babirye.local', route: '[]', speed: 0, heading: 0 },
    { vipId: alpha.id, name: 'Alpha-Vehicle-2', type: 'suv', plate: 'GOV-ALPHA-2', status: 'en_route', fuelLevel: 75, gpsCoords: '{"lat":38.9012,"lng":-77.0401}', driverId: 'ops2@babirye.local', route: '[{"lat":38.8977,"lng":-77.0365},{"lat":38.9012,"lng":-77.0401}]', speed: 45, heading: 90 },
    { vipId: beta.id, name: 'Beta-Vehicle-1', type: 'sedan', plate: 'GOV-BETA-1', status: 'parked', fuelLevel: 88, gpsCoords: '{"lat":38.8950,"lng":-77.0340}', driverId: 'ops3@babirye.local', route: '[]', speed: 0, heading: 0 },
  ]});

  await db.vipWearable.createMany({ data: [
    { vipId: alpha.id, type: 'smartwatch', deviceName: 'Garmin Tactix 7 Pro', status: 'connected', batteryLevel: 82, heartRate: 72, bloodPressure: '{"systolic":120,"diastolic":78}', temperature: 36.6, sosTriggered: false, lastPingAt: new Date() },
    { vipId: alpha.id, type: 'health_monitor', deviceName: 'BioHarness 3', status: 'connected', batteryLevel: 91, heartRate: 72, bloodPressure: null, temperature: 36.7, sosTriggered: false, lastPingAt: new Date() },
    { vipId: alpha.id, type: 'panic_button', deviceName: 'PANIC-ALPHA-1', status: 'connected', batteryLevel: 100, heartRate: null, bloodPressure: null, temperature: null, sosTriggered: false, lastPingAt: new Date() },
    { vipId: beta.id, type: 'smartwatch', deviceName: 'Apple Watch Ultra 2', status: 'connected', batteryLevel: 65, heartRate: 68, bloodPressure: null, temperature: 36.5, sosTriggered: false, lastPingAt: new Date() },
    { vipId: beta.id, type: 'gps_tracker', deviceName: 'Tracker-BETA-1', status: 'connected', batteryLevel: 88, heartRate: null, bloodPressure: null, temperature: null, sosTriggered: false, lastPingAt: new Date() },
    { vipId: gamma.id, type: 'smartwatch', deviceName: 'Smart Badge Gamma', status: 'connected', batteryLevel: 95, heartRate: null, bloodPressure: null, temperature: null, sosTriggered: false, lastPingAt: new Date() },
  ]});
  counts.vipProfiles = 3;
  console.log(`  Created 3 VIP profiles with assets`);

  // ════════════════════════════════════════════════════════════════
  // 11. POTENTIALS (from JSON)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding potentials...');
  const pots = seedData.potentials || [];
  for (const p of pots) {
    await db.potential.create({
      data: { name: p.name, category: p.category, description: p.description, requirements: p.requirements || '[]', difficulty: p.difficulty || 'medium', impact: p.impact || 'medium', isActive: p.isActive ?? true, tags: p.tags || '[]', subcategory: p.category }
    });
  }
  counts.potentials = pots.length;
  console.log(`  Created ${pots.length} potentials`);

  // ════════════════════════════════════════════════════════════════
  // 12. WEAPONS (44)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding weapons...');
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
    { name: 'M24 SWS', category: 'sniper', caliber: '7.62x51mm NATO', range: 800, rateOfFire: 'Bolt-action', magazineCapacity: 5, serialNumber: 'M24-BA-01201' },
    { name: 'M40A5', category: 'sniper', caliber: '7.62x51mm NATO', range: 900, rateOfFire: 'Bolt-action', magazineCapacity: 5, serialNumber: 'M40-BA-01301' },
    { name: 'Barrett M82', category: 'sniper', caliber: '.50 BMG', range: 1800, rateOfFire: 'Semi-auto', magazineCapacity: 10, serialNumber: 'M82-BA-01401' },
    { name: 'M249 SAW', category: 'lmg', caliber: '5.56x45mm NATO', range: 800, rateOfFire: '750-1000 rpm', magazineCapacity: 200, serialNumber: 'M249-BA-01501' },
    { name: 'M240B', category: 'lmg', caliber: '7.62x51mm NATO', range: 1100, rateOfFire: '650-950 rpm', magazineCapacity: 100, serialNumber: 'M240-BA-01601' },
    { name: 'M2HB', category: 'hmg', caliber: '.50 BMG', range: 2000, rateOfFire: '450-600 rpm', magazineCapacity: 100, serialNumber: 'M2-BA-01701' },
    { name: 'M134 Minigun', category: 'hmg', caliber: '7.62x51mm NATO', range: 1000, rateOfFire: '2000-6000 rpm', magazineCapacity: 1000, serialNumber: 'M134-BA-01801' },
    { name: 'M67 Frag', category: 'explosive', caliber: 'N/A', range: 35, rateOfFire: 'N/A', magazineCapacity: 1, serialNumber: 'M67-BA-01901' },
    { name: 'M18A1 Claymore', category: 'explosive', caliber: 'N/A', range: 50, rateOfFire: 'Command-detonated', magazineCapacity: 1, serialNumber: 'M18-BA-02001' },
  ];
  for (const w of weapons) {
    await db.weapon.create({
      data: { name: w.name, category: w.category, caliber: w.caliber, range: w.range, rateOfFire: w.rateOfFire, magazineCapacity: w.magazineCapacity, serialNumber: w.serialNumber, status: 'armory' }
    });
  }
  counts.weapons = weapons.length;
  console.log(`  Created ${weapons.length} weapons`);

  // ════════════════════════════════════════════════════════════════
  // 13. MARTIAL ARTS (15)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding martial arts...');
  const martialArts = [
    { name: 'Krav Maga', origin: 'Israel', description: 'Military self-defense system focusing on real-world situations with efficient threat neutralization techniques.', effectiveness: '["striking:95","grappling:80","defense:90","weapon_defense:95","multiple_attackers:75"]', difficultyLevel: 'advanced', categories: '["striking","grappling","weapon_defense","self_defense"]' },
    { name: 'Brazilian Jiu-Jitsu', origin: 'Brazil', description: 'Ground fighting system emphasizing throws, joint locks, chokes, and positional dominance for close-quarters combat.', effectiveness: '["striking:40","grappling:98","defense:85","weapon_defense:60","ground_combat:98"]', difficultyLevel: 'advanced', categories: '["grappling","ground_combat","submission"]' },
    { name: 'Muay Thai', origin: 'Thailand', description: 'Stand-up striking art utilizing fists, elbows, knees, and shins with emphasis on clinch work and devastating strikes.', effectiveness: '["striking:98","grappling:60","defense:75","clinch:95","conditioning:95"]', difficultyLevel: 'intermediate', categories: '["striking","clinch","stand_up"]' },
    { name: 'Systema', origin: 'Russia', description: 'Russian martial art focusing on fluid movement, breathing, relaxation, and spontaneous response to threats.', effectiveness: '["striking:75","grappling:80","defense:90","weapon_defense:90","multiple_attackers:80"]', difficultyLevel: 'advanced', categories: '["striking","grappling","weapon_defense","self_defense"]' },
    { name: 'Judo', origin: 'Japan', description: 'Throwing and grappling art emphasizing leverage and momentum for unbalancing and controlling opponents.', effectiveness: '["striking:20","grappling:90","defense:85","throws:98","ground_combat:80"]', difficultyLevel: 'intermediate', categories: '["grappling","throws","ground_combat"]' },
    { name: 'Aikido', origin: 'Japan', description: 'Harmonious martial art redirecting attacker energy through circular movements and joint manipulation techniques.', effectiveness: '["striking:10","grappling:75","defense:90","joint_locks:95","weapon_defense:80"]', difficultyLevel: 'advanced', categories: '["grappling","joint_locks","self_defense"]' },
    { name: 'Boxing', origin: 'UK/USA', description: 'Western striking art focused on punching technique, footwork, head movement, and ring tactics.', effectiveness: '["striking:95","grappling:5","defense:80","footwork:95","conditioning:90"]', difficultyLevel: 'beginner', categories: '["striking","stand_up","conditioning"]' },
    { name: 'Karate', origin: 'Okinawa/Japan', description: 'Striking martial art emphasizing powerful punches, kicks, knee strikes, and open-hand techniques with disciplined form.', effectiveness: '["striking:90","grappling:30","defense:80","kicks:85","forms:95"]', difficultyLevel: 'beginner', categories: '["striking","stand_up","forms"]' },
    { name: 'Sambo', origin: 'Russia', description: 'Russian combat sport combining judo and wrestling with military application including weapon disarming.', effectiveness: '["striking:60","grappling:92","defense:85","weapon_defense:85","ground_combat:90"]', difficultyLevel: 'intermediate', categories: '["grappling","ground_combat","weapon_defense"]' },
    { name: 'Escrima/Kali', origin: 'Philippines', description: 'Filipino weapons-based martial art focusing on stick, blade, and improvised weapon fighting with empty-hand translation.', effectiveness: '["striking:80","grappling:50","defense:75","weapon_defense:98","stick_fighting:98"]', difficultyLevel: 'intermediate', categories: '["weapon_defense","stick_fighting","blade"]' },
    { name: 'Wing Chun', origin: 'China', description: 'Close-quarters combat system emphasizing rapid punches, tight defense, trapping, and sensitivity training.', effectiveness: '["striking:85","grappling:55","defense:90","close_quarters:95","speed:90"]', difficultyLevel: 'intermediate', categories: '["striking","close_quarters","self_defense"]' },
    { name: 'Ninjutsu', origin: 'Japan', description: 'Ancient Japanese martial art encompassing stealth, espionage, unconventional warfare, and survival techniques.', effectiveness: '["striking:70","grappling:75","defense:85","stealth:98","weapon_defense:90"]', difficultyLevel: 'advanced', categories: '["stealth","weapon_defense","unconventional"]' },
    { name: 'MCMAP', origin: 'USA', description: 'Marine Corps Martial Arts Program combining various disciplines into a comprehensive combat system for military personnel.', effectiveness: '["striking:85","grappling:80","defense:85","weapon_defense:85","conditioning:90"]', difficultyLevel: 'intermediate', categories: '["striking","grappling","weapon_defense","military"]' },
    { name: 'Savate', origin: 'France', description: 'French kickboxing utilizing efficient kicks and punches with emphasis on precision and mobility.', effectiveness: '["striking:88","grappling:10","defense:75","kicks:92","footwork:90"]', difficultyLevel: 'intermediate', categories: '["striking","kicks","stand_up"]' },
    { name: 'Vale Tudo', origin: 'Brazil', description: 'No-holds-barred fighting system combining striking and grappling for comprehensive combat readiness.', effectiveness: '["striking:85","grappling:90","defense:80","ground_combat:88","versatility:95"]', difficultyLevel: 'advanced', categories: '["striking","grappling","ground_combat","mma"]' },
  ];
  for (const m of martialArts) {
    await db.martialArt.create({ data: { name: m.name, origin: m.origin, description: m.description, effectiveness: m.effectiveness, difficultyLevel: m.difficultyLevel, categories: m.categories } });
  }
  counts.martialArts = martialArts.length;
  console.log(`  Created ${martialArts.length} martial arts`);

  // ════════════════════════════════════════════════════════════════
  // 14. INTELLIGENCE FEEDS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding intelligence feeds...');
  const feeds = [
    { name: 'AlienVault OTX', source: 'AlienVault', type: 'otx', description: 'Open Threat Exchange feed providing community-driven IOCs, threat indicators, and adversary tracking data from global contributors.', url: 'https://otx.alienvault.com/api/v1', apiKeySetting: 'alientvault_otx_api_key', isActive: true, lastFetchedAt: new Date(Date.now() - 1800000), config: '{"poll_interval":300,"severity_filter":["high","critical"]}' },
    { name: 'Shodan Monitor', source: 'Shodan', type: 'surface_web', description: 'Internet-wide scanning feed detecting exposed services, vulnerable ports, and infrastructure changes across monitored IP ranges.', url: 'https://api.shodan.io/shodan', apiKeySetting: 'shodan_api_key', isActive: true, lastFetchedAt: new Date(Date.now() - 3600000), config: '{"query":"org:target_org","port_filter":[22,80,443,3389,8080]}' },
    { name: 'VirusTotal Live', source: 'VirusTotal', type: 'malware', description: 'Real-time malware intelligence feed providing hash reputations, URL scanning results, and behavioral analysis from 70+ antivirus engines.', url: 'https://www.virustotal.com/api/v3', apiKeySetting: 'virustotal_api_key', isActive: true, lastFetchedAt: new Date(Date.now() - 900000), config: '{"auto_scan":true,"retention_days":90}' },
    { name: 'Censys Exposure', source: 'Censys', type: 'attack_surface', description: 'Attack surface management feed identifying exposed assets, certificate transparency logs, and infrastructure inventory changes.', url: 'https://search.censys.io/api/v2', apiKeySetting: 'censys_api_key', isActive: true, lastFetchedAt: new Date(Date.now() - 7200000), config: '{"host_monitoring":true,"certificate_watch":true}' },
    { name: 'Have I Been Pwned', source: 'HIBP', type: 'breach', description: 'Breach monitoring feed tracking credential exposures, data leaks, and compromised account information from public breach databases.', url: 'https://haveibeenpwned.com/api/v3', apiKeySetting: 'hibp_api_key', isActive: true, lastFetchedAt: new Date(Date.now() - 14400000), config: '{"domain_monitor":"babirye.local","notify_on_new":true}' },
    { name: 'Custom Internal Feed', source: 'Internal', type: 'internal', description: 'Internal threat intelligence feed aggregating data from all BABIRYE sensors, wall guards, and detection systems for cross-correlation analysis.', url: '/api/intel/internal', apiKeySetting: null, isActive: true, lastFetchedAt: new Date(Date.now() - 60000), config: '{"sources":["sensors","wall_guards","agents","audit_logs"],"auto_correlate":true}' },
  ];
  const feedIds = [];
  for (const f of feeds) {
    const feed = await db.intelligenceFeed.create({
      data: { name: f.name, source: f.source, type: f.type, description: f.description, url: f.url, apiKeySetting: f.apiKeySetting, isActive: f.isActive, lastFetchedAt: f.lastFetchedAt, config: f.config }
    });
    feedIds.push(feed.id);
  }
  counts.intelligenceFeeds = feeds.length;

  // Intel items for each feed
  console.log('Seeding intel items...');
  const intelItems = [
    { feedIndex: 0, title: 'APT29 Spearphishing Campaign', description: 'New spearphishing campaign attributed to APT29 (Cozy Bear) targeting government organizations with weaponized CVE-2024-21413 attachments.', iocType: 'domain', iocValue: 'update-service[.]malicious-domain[.]com', severity: 'critical', isVerified: true },
    { feedIndex: 0, title: 'Emotet Infrastructure Update', description: 'Emotet botnet infrastructure rotation detected with 47 new C2 domains registered in the last 24 hours across 12 TLDs.', iocType: 'ip', iocValue: '185.215.113.0/24', severity: 'high', isVerified: true },
    { feedIndex: 0, title: 'Credential Stuffing Attack Pattern', description: 'Massive credential stuffing campaign observed targeting financial services using leaked credentials from recent data breaches.', iocType: 'url', iocValue: 'https://login-bank[.]fake-site[.]com/auth', severity: 'high', isVerified: false },
    { feedIndex: 1, title: 'Exposed RDP Service Detected', description: 'Internet-facing RDP service detected on monitored IP range with weak encryption configuration, potential brute-force target.', iocType: 'service', iocValue: '203.0.113.50:3389', severity: 'high', isVerified: true },
    { feedIndex: 1, title: 'New Open Port 8443', description: 'Previously unseen port 8443 opened on DMZ web server, potentially indicating unauthorized application deployment or configuration change.', iocType: 'port', iocValue: '203.0.113.101:8443', severity: 'medium', isVerified: true },
    { feedIndex: 2, title: 'Novel Malware Sample Detected', description: 'Previously unknown malware sample submitted with 3/72 detection rate, exhibiting keylogging and screenshot capture capabilities.', iocType: 'hash', iocValue: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', severity: 'critical', isVerified: true },
    { feedIndex: 2, title: 'Trojanized Software Update', description: 'Legitimate software installer modified to include Cobalt Strike beacon, distributed via compromised vendor CDN infrastructure.', iocType: 'hash', iocValue: 'f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1', severity: 'critical', isVerified: true },
    { feedIndex: 3, title: 'SSL Certificate Expiry Warning', description: 'Three TLS certificates for production services expiring within 14 days, potential service disruption risk.', iocType: 'certificate', iocValue: 'CN=api.babirye.local,expires=2024-07-20', severity: 'medium', isVerified: true },
    { feedIndex: 4, title: 'Credential Exposure in Breach', description: '2,847 email addresses from monitored domain found in third-party data breach, passwords included in 12% of records.', iocType: 'email', iocValue: ' breached-accounts@babirye.local', severity: 'high', isVerified: true },
    { feedIndex: 5, title: 'Wall Guard Spike: Injection Attempts', description: 'Self-attack wall injection guard triggered 347 times in last hour, 89% originating from internal IP range suggesting potential compromise.', iocType: 'pattern', iocValue: 'injection_attempt_pattern_v3', severity: 'critical', isVerified: true },
  ];
  for (const item of intelItems) {
    await db.intelItem.create({
      data: {
        feedId: feedIds[item.feedIndex],
        title: item.title,
        description: item.description,
        iocType: item.iocType,
        iocValue: item.iocValue,
        severity: item.severity,
        isVerified: item.isVerified,
        raw_data: '{}',
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 3),
      }
    });
  }
  counts.intelItems = intelItems.length;
  console.log(`  Created ${feeds.length} feeds + ${intelItems.length} items`);

  // ════════════════════════════════════════════════════════════════
  // 15. SPA GATEWAYS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding SPA gateways...');
  const gateways = [
    { name: 'Gateway Alpha', subsystem: 'forensic', host: '0.0.0.0', port: 5001, protocol: 'https', status: 'active', secretHash: await hash('gateway-alpha-secret-2024'), description: 'Primary forensic subsystem gateway handling all forensic tool deployment and evidence management communications.', config: '{"max_connections":100,"timeout":30,"tls_verify":true}' },
    { name: 'Gateway Bravo', subsystem: 'offensive', host: '0.0.0.0', port: 5002, protocol: 'https', status: 'active', secretHash: await hash('gateway-bravo-secret-2024'), description: 'Offensive subsystem gateway managing red team tool deployment, C2 communications, and engagement coordination.', config: '{"max_connections":50,"timeout":60,"allowed_tools":["nmap","metasploit","burpsuite"]}' },
    { name: 'Gateway Charlie', subsystem: 'defensive', host: '0.0.0.0', port: 5003, protocol: 'https', status: 'active', secretHash: await hash('gateway-charlie-secret-2024'), description: 'Defensive subsystem gateway coordinating network defense tools, IDS/IPS management, and security monitoring.', config: '{"max_connections":200,"timeout":15,"auto_deploy":true}' },
    { name: 'Gateway Delta', subsystem: 'vip', host: '0.0.0.0', port: 5004, protocol: 'https', status: 'standby', secretHash: await hash('gateway-delta-secret-2024'), description: 'VIP protection subsystem gateway managing drone communications, vehicle tracking, and wearable device data streams.', config: '{"max_connections":75,"timeout":10,"real_time":true}' },
    { name: 'Gateway Echo', subsystem: 'sensors', host: '0.0.0.0', port: 5005, protocol: 'wss', status: 'active', secretHash: await hash('gateway-echo-secret-2024'), description: 'Sensor subsystem gateway handling high-frequency sensor data streams from radar, acoustic, and electronic warfare arrays.', config: '{"max_connections":500,"timeout":5,"compression":true,"batch_size":100}' },
    { name: 'Gateway Foxtrot', subsystem: 'intel', host: '0.0.0.0', port: 5006, protocol: 'https', status: 'active', secretHash: await hash('gateway-foxtrot-secret-2024'), description: 'Intelligence subsystem gateway aggregating data from external threat feeds and internal detection systems.', config: '{"max_connections":30,"timeout":45,"cache_ttl":300}' },
  ];
  for (const g of gateways) {
    await db.spaGateway.create({ data: g });
  }
  counts.spaGateways = gateways.length;
  console.log(`  Created ${gateways.length} SPA gateways`);

  // ════════════════════════════════════════════════════════════════
  // 16. CONSTITUTIONS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding constitutions...');
  const constitutions = [
    { name: 'Platform Security Policy', version: '10.0.0', category: 'security', description: 'Master security policy governing all platform operations, access controls, data handling, and incident response procedures.', content: '# BABIRYE Platform Security Policy v10.0.0\n\n## 1. Purpose\nThis policy establishes the security framework for all BABIRYE v10.0.0 operations.\n\n## 2. Scope\nApplies to all personnel, systems, and data processed by the BABIRYE platform.\n\n## 3. Access Control\n- Role-based access control (RBAC) enforced at all layers\n- Multi-factor authentication required for admin and operator roles\n- Session tokens expire after 24 hours, API tokens after 8 hours\n- Account lockout after 5 failed authentication attempts (15-minute cooldown)\n\n## 4. Data Classification\n- **Top Secret**: VIP identities, protection routes, safe house locations\n- **Secret**: Active operation details, agent configurations, council deliberations\n- **Confidential**: System configurations, audit logs, threat intelligence\n- **Internal**: User accounts, training materials, documentation\n\n## 5. Incident Response\nAll security incidents must be reported within 15 minutes of detection. Critical incidents trigger immediate escalation to the Security Agent and notification of all online operators.' },
    { name: 'VIP Protection Protocol', version: '3.2.1', category: 'operations', description: 'Standard operating procedures for VIP close protection, advance reconnaissance, convoy management, and emergency extraction.', content: '# VIP Protection Protocol v3.2.1\n\n## Protection Levels\n- **Maximum**: Armed close protection team (4+), drone overwatch, armored convoy, medical standby\n- **Elevated**: 2-person protection detail, vehicle tracking, wearable monitoring\n- **Standard**: Single protection officer, GPS tracking, periodic check-ins\n\n## Advance Procedures\n1. Route reconnaissance 48 hours prior to movement\n2. Venue security assessment and vulnerability mapping\n3. Communication check with all team members\n4. Emergency medical facility identification within 5-minute radius\n\n## Emergency Protocols\n- Code RED: Immediate evacuation via primary route\n- Code YELLOW: Heightened awareness, protective formation\n- Code GREEN: All clear, resume normal operations' },
    { name: 'Self-Attack Wall Constitution', version: '2.0.0', category: 'defense', description: 'Constitutional framework for the Self-Attack Wall system defining guard activation criteria, block response protocols, and override procedures.', content: '# Self-Attack Wall Constitution v2.0.0\n\n## Guard Activation\nAll 25 wall guards are active by default. Guards can only be deactivated by:\n1. Admin authorization with dual-operator confirmation\n2. Scheduled maintenance window (approved 24h in advance)\n3. Emergency override (requires Commander authorization)\n\n## Block Response Protocol\n- Critical severity: Immediate block + alert + audit log\n- High severity: Block + alert + audit log\n- Medium severity: Block + audit log\n- Low severity: Log and monitor\n\n## Override Procedures\nAll wall guard overrides are logged and reviewed within 4 hours by the Security Agent.' },
    { name: 'Expert Council Charter', version: '1.5.0', category: 'governance', description: 'Charter defining the Expert Council structure, voting procedures, veto powers, and decision-making framework for cross-domain security assessments.', content: '# Expert Council Charter v1.5.0\n\n## Council Composition\n12 specialized domains, each with a designated expert agent providing analysis and recommendations.\n\n## Voting\n- Simple majority (>50%) for standard decisions\n- Supermajority (75%) for high-impact operations\n- Unanimous consent required for actions affecting system integrity\n- Any domain can invoke veto for critical safety concerns\n\n## Confidence Scoring\nEach domain provides a confidence score (0.0-1.0) for their assessment. Weighted consensus determines final confidence level.' },
    { name: 'Data Retention Policy', version: '2.1.0', category: 'compliance', description: 'Policy governing data retention periods, encryption requirements, and secure disposal procedures for all data types processed by the platform.', content: '# Data Retention Policy v2.1.0\n\n## Retention Periods\n- Audit logs: 365 days (encrypted)\n- Security alerts: 180 days\n- Session data: 90 days\n- Sensor readings: 30 days (raw), 365 days (aggregated)\n- Forensic evidence: Indefinite (legal hold)\n\n## Encryption\n- At rest: AES-256\n- In transit: TLS 1.3\n- Key rotation: Every 90 days\n\n## Disposal\nSecure deletion using cryptographic erasure with verification.' },
    { name: 'Operational Continuity Plan', version: '1.0.0', category: 'operations', description: 'Business continuity and disaster recovery plan ensuring platform availability and operational capability under adverse conditions.', content: '# Operational Continuity Plan v1.0.0\n\n## Recovery Objectives\n- RPO (Recovery Point Objective): 1 hour\n- RTO (Recovery Time Objective): 4 hours\n- Maximum Tolerable Downtime: 24 hours\n\n## Backup Strategy\n- Database: Hourly incremental, daily full\n- Configuration: Real-time replication\n- Evidence: Write-once, tamper-evident storage\n\n## Failover\nAutomatic failover to standby systems within 60 seconds of primary failure detection.' },
  ];
  for (const c of constitutions) {
    await db.constitution.create({ data: c });
  }
  counts.constitutions = constitutions.length;
  console.log(`  Created ${constitutions.length} constitutions`);

  // ════════════════════════════════════════════════════════════════
  // 17. SYSTEM SETTINGS (with API keys)
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding system settings...');
  const settings = [
    { key: 'platform_name', value: 'BABIRYE v10.0.0', category: 'general', description: 'Platform display name', isSecret: false },
    { key: 'platform_version', value: '10.0.0', category: 'general', description: 'Current platform version', isSecret: false },
    { key: 'default_session_ttl_hours', value: '24', category: 'auth', description: 'Default session token time-to-live in hours', isSecret: false },
    { key: 'default_api_token_ttl_hours', value: '8', category: 'auth', description: 'Default API token time-to-live in hours', isSecret: false },
    { key: 'max_failed_login_attempts', value: '5', category: 'auth', description: 'Maximum failed login attempts before account lockout', isSecret: false },
    { key: 'lockout_duration_minutes', value: '15', category: 'auth', description: 'Account lockout duration in minutes', isSecret: false },
    { key: 'audit_log_retention_days', value: '365', category: 'audit', description: 'Number of days to retain audit logs', isSecret: false },
    { key: 'sensor_data_retention_days', value: '30', category: 'sensors', description: 'Number of days to retain raw sensor data', isSecret: false },
    { key: 'shodan_api_key', value: '', category: 'api_keys', description: 'Shodan API key for internet-wide scanning and exposure monitoring', isSecret: true },
    { key: 'virustotal_api_key', value: '', category: 'api_keys', description: 'VirusTotal API key for malware analysis and hash reputation lookups', isSecret: true },
    { key: 'alientvault_otx_api_key', value: '', category: 'api_keys', description: 'AlienVault OTX API key for threat intelligence feed access', isSecret: true },
    { key: 'censys_api_key', value: '', category: 'api_keys', description: 'Censys API key for attack surface management and exposure detection', isSecret: true },
    { key: 'hibp_api_key', value: '', category: 'api_keys', description: 'Have I Been Pwned API key for breach monitoring and credential exposure detection', isSecret: true },
    { key: 'securitytrails_api_key', value: '', category: 'api_keys', description: 'SecurityTrails API key for DNS history and infrastructure profiling', isSecret: true },
    { key: 'geoip_api_key', value: '', category: 'api_keys', description: 'GeoIP API key for IP geolocation and threat attribution', isSecret: true },
    { key: 'threat_connect_api_key', value: '', category: 'api_keys', description: 'ThreatConnect API key for threat intelligence platform integration', isSecret: true },
    { key: 'wall_guard_auto_block', value: 'true', category: 'defense', description: 'Enable automatic blocking by wall guards for critical and high severity detections', isSecret: false },
    { key: 'council_voting_threshold', value: '0.75', category: 'governance', description: 'Supermajority threshold for high-impact council decisions (0.0-1.0)', isSecret: false },
    { key: 'vip_sos_response_timeout_seconds', value: '30', category: 'vip', description: 'Maximum response time for VIP SOS alert acknowledgment in seconds', isSecret: false },
    { key: 'report_auto_generate', value: 'false', category: 'reports', description: 'Enable automatic report generation on security incident closure', isSecret: false },
  ];
  for (const s of settings) {
    await db.systemSetting.create({ data: s });
  }
  counts.systemSettings = settings.length;
  console.log(`  Created ${settings.length} system settings (including 8 API key slots)`);

  // ════════════════════════════════════════════════════════════════
  // 18. SECURITY ALERTS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding security alerts...');
  const alertTypes = [
    { title: 'SQL Injection Attempt Blocked', severity: 'critical', type: 'wall_block', source: 'self-injection guard' },
    { title: 'Privilege Escalation Pattern Detected', severity: 'critical', type: 'wall_block', source: 'self-privilege-esc guard' },
    { title: 'Credential Theft Attempt Blocked', severity: 'critical', type: 'wall_block', source: 'self-credential-theft guard' },
    { title: 'Unauthorized Configuration Modification', severity: 'high', type: 'wall_block', source: 'self-config-tampering guard' },
    { title: 'Data Exfiltration Attempt Blocked', severity: 'critical', type: 'wall_block', source: 'self-exfiltration guard' },
    { title: 'Backdoor Creation Attempt Blocked', severity: 'critical', type: 'wall_block', source: 'self-backdoor guard' },
    { title: 'Logic Bomb Detection Pattern Match', severity: 'high', type: 'wall_block', source: 'logic-bomb guard' },
    { title: 'Supply Chain Attack Pattern Detected', severity: 'high', type: 'wall_block', source: 'supply-chain-attack guard' },
    { title: 'APT29 Spearphishing Campaign Detected', severity: 'high', type: 'intel', source: 'AlienVault OTX' },
    { title: 'New Malware Sample — Low Detection Rate', severity: 'critical', type: 'malware', source: 'VirusTotal' },
    { title: 'Exposed RDP Service on Monitored Range', severity: 'high', type: 'surface', source: 'Shodan Monitor' },
    { title: 'SSL Certificate Expiry in 14 Days', severity: 'medium', type: 'compliance', source: 'Censys Exposure' },
    { title: 'Credential Exposure in Third-Party Breach', severity: 'high', type: 'breach', source: 'HIBP' },
    { title: 'Sensor Anomaly: Network IDS Spike', severity: 'medium', type: 'sensor', source: 'Sector A - North Perimeter' },
    { title: 'VIP Wearable Heart Rate Anomaly', severity: 'high', type: 'vip', source: 'BioHarness 3 (Principal Alpha)' },
    { title: 'Agent Failure: Offensive Agent Unresponsive', severity: 'medium', type: 'system', source: 'Agent Health Monitor' },
    { title: 'Rate Limit Threshold Exceeded', severity: 'low', type: 'system', source: 'API Gateway' },
    { title: 'Unusual Login Pattern Detected', severity: 'medium', type: 'auth', source: 'Authentication System' },
    { title: 'Dependency Vulnerability: Critical CVE', severity: 'high', type: 'vulnerability', source: 'Dependency Scanner' },
    { title: 'Memory Corruption Pattern Detected', severity: 'critical', type: 'wall_block', source: 'self-memory-corruption guard' },
  ];
  for (let i = 0; i < alertTypes.length; i++) {
    const a = alertTypes[i];
    await db.securityAlert.create({
      data: {
        title: a.title,
        severity: a.severity,
        type: a.type,
        source: a.source,
        status: i < 5 ? 'investigating' : i < 10 ? 'acknowledged' : 'resolved',
        description: `Detailed analysis of ${a.title.toLowerCase()}. Automated detection by ${a.source} triggered at ${new Date(Date.now() - (i * 3600000 * 2)).toISOString()}. Appropriate response actions have been initiated per standard operating procedures.`,
        assignedTo: i < 5 ? 'ops1@babirye.local' : null,
        createdAt: new Date(Date.now() - (i * 3600000 * 2)),
        updatedAt: new Date(Date.now() - (i * 1800000)),
      }
    });
  }
  counts.securityAlerts = alertTypes.length;
  console.log(`  Created ${alertTypes.length} security alerts`);

  // ════════════════════════════════════════════════════════════════
  // 19. TASKS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding tasks...');
  const tasks = [
    { type: 'forensic', status: 'completed', priority: 8, title: 'Memory dump analysis - Server Alpha', agentName: 'Forensic Agent', creatorEmail: 'admin@babirye.local', progress: 100 },
    { type: 'offensive', status: 'running', priority: 7, title: 'Network vulnerability scan - DMZ segment', agentName: 'Offensive Agent', creatorEmail: 'ops1@babirye.local', progress: 65 },
    { type: 'defensive', status: 'completed', priority: 9, title: 'Firewall rule audit and optimization', agentName: 'Defensive Agent', creatorEmail: 'admin@babirye.local', progress: 100 },
    { type: 'sensors', status: 'running', priority: 6, title: 'Perimeter sensor calibration sweep', agentName: 'Sensors Agent', creatorEmail: 'ops2@babirye.local', progress: 40 },
    { type: 'vip', status: 'pending', priority: 10, title: 'Advance reconnaissance for Principal Alpha movement', agentName: 'VIP Protection Agent', creatorEmail: 'admin@babirye.local', progress: 0 },
    { type: 'potentials', status: 'completed', priority: 5, title: 'Capabilities reassessment - Q3 update', agentName: 'Potentials Engine', creatorEmail: 'analyst1@babirye.local', progress: 100 },
    { type: 'forensic', status: 'failed', priority: 8, title: 'Mobile device extraction - iPhone 15 Pro', agentName: 'Forensic Agent', creatorEmail: 'ops1@babirye.local', progress: 30 },
    { type: 'defensive', status: 'running', priority: 7, title: 'Endpoint detection rule update deployment', agentName: 'Defensive Agent', creatorEmail: 'ops3@babirye.local', progress: 80 },
    { type: 'offensive', status: 'pending', priority: 6, title: 'Red team exercise - Phase 1 reconnaissance', agentName: 'Offensive Agent', creatorEmail: 'admin@babirye.local', progress: 0 },
    { type: 'sensors', status: 'completed', priority: 5, title: 'Anomaly detection model retraining', agentName: 'Sensors Agent', creatorEmail: 'analyst2@babirye.local', progress: 100 },
  ];
  for (const t of tasks) {
    const agent = await db.agent.findFirst({ where: { name: t.agentName } });
    const creator = await db.user.findFirst({ where: { email: t.creatorEmail } });
    await db.task.create({
      data: {
        type: t.type, status: t.status, priority: t.priority,
        input: JSON.stringify({ title: t.title }),
        output: t.status === 'completed' ? JSON.stringify({ result: 'Task completed successfully', findings: Math.floor(Math.random() * 10) + 1 }) : null,
        errorMessage: t.status === 'failed' ? 'Device extraction failed: iOS version 17.5.1 not supported by current toolchain' : null,
        progress: t.progress,
        agentId: agent?.id || null,
        creatorId: creator?.id || null,
        startedAt: t.status !== 'pending' ? new Date(Date.now() - 7200000) : null,
        completedAt: t.status === 'completed' || t.status === 'failed' ? new Date(Date.now() - 1800000) : null,
      }
    });
  }
  counts.tasks = tasks.length;
  console.log(`  Created ${tasks.length} tasks`);

  // ════════════════════════════════════════════════════════════════
  // 20. AUDIT LOGS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding audit logs...');
  const auditEntries = [
    { action: 'login', resource: 'auth', by: 'admin@babirye.local' },
    { action: 'login', resource: 'auth', by: 'ops1@babirye.local' },
    { action: 'login', resource: 'auth', by: 'analyst1@babirye.local' },
    { action: 'create_api_token', resource: 'api_token', by: 'admin@babirye.local' },
    { action: 'seed_database', resource: 'system', by: 'admin@babirye.local' },
    { action: 'update_agent_status', resource: 'agent', by: 'ops1@babirye.local' },
    { action: 'wall_guard_block', resource: 'wall_guard', by: 'system' },
    { action: 'create_task', resource: 'task', by: 'admin@babirye.local' },
    { action: 'view_report', resource: 'report', by: 'analyst2@babirye.local' },
    { action: 'export_data', resource: 'audit', by: 'analyst3@babirye.local' },
    { action: 'update_setting', resource: 'system_setting', by: 'admin@babirye.local' },
    { action: 'create_user', resource: 'user', by: 'admin@babirye.local' },
    { action: 'toggle_guard', resource: 'wall_guard', by: 'ops2@babirye.local' },
    { action: 'deploy_tool', resource: 'forensic_tool', by: 'ops1@babirye.local' },
    { action: 'acknowledge_alert', resource: 'security_alert', by: 'ops3@babirye.local' },
    { action: 'resolve_alert', resource: 'security_alert', by: 'analyst1@babirye.local' },
    { action: 'vip_route_update', resource: 'vip_profile', by: 'ops1@babirye.local' },
    { action: 'sensor_calibration', resource: 'sensor', by: 'ops2@babirye.local' },
    { action: 'council_vote', resource: 'council', by: 'admin@babirye.local' },
    { action: 'intel_feed_sync', resource: 'intelligence_feed', by: 'system' },
  ];
  const adminUser = await db.user.findFirst({ where: { email: 'admin@babirye.local' } });
  for (let i = 0; i < auditEntries.length; i++) {
    const a = auditEntries[i];
    const user = a.by === 'system' ? null : await db.user.findFirst({ where: { email: a.by } });
    await db.auditLog.create({
      data: {
        userId: user?.id || adminUser?.id || null,
        action: a.action,
        resource: a.resource,
        details: JSON.stringify({ description: `${a.action} on ${a.resource}`, performedBy: a.by }),
        statusCode: 200,
        ipAddress: a.by === 'system' ? '127.0.0.1' : `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'BABIRYE-Platform/10.0.0',
        createdAt: new Date(Date.now() - (i * 1800000 * Math.random() * 5)),
      }
    });
  }
  counts.auditLogs = auditEntries.length;
  console.log(`  Created ${auditEntries.length} audit logs`);

  // ════════════════════════════════════════════════════════════════
  // 21. NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding notifications...');
  const notifs = [
    { title: 'Critical: SQL Injection Attempt Blocked', message: 'Self-attack wall injection guard blocked 47 attempts in the last hour from internal IP range.', type: 'critical', severity: 'critical' },
    { title: 'Agent Deployed: Honeypot ALPHA-7', message: 'Offensive Agent deployed honeypot ALPHA-7 to DMZ zone for active threat engagement.', type: 'success', severity: 'info' },
    { title: 'VIP Alert: Principal Alpha Heart Rate Anomaly', message: 'BioHarness 3 detected elevated heart rate (112 bpm) for Principal Alpha. Medical team notified.', type: 'warning', severity: 'high' },
    { title: 'Threat Intel: 3 New CVEs Published', message: '3 new CVEs published affecting current infrastructure stack. Review and patch priority assessment required.', type: 'warning', severity: 'high' },
    { title: 'Task Complete: Memory Dump Analysis', message: 'Forensic Agent completed memory dump analysis for Server Alpha. 3 suspicious processes identified.', type: 'info', severity: 'medium' },
    { title: 'System: Sensor Network Calibration Complete', message: 'All 31 sensors calibrated successfully. Anomaly detection models updated with new baseline data.', type: 'success', severity: 'info' },
    { title: 'Security: Credential Exposure Detected', message: 'HIBP feed detected 12 breached credentials for monitored domain. Forced password reset recommended.', type: 'critical', severity: 'critical' },
    { title: 'Compliance: SSL Certificate Expiring', message: '3 TLS certificates expiring within 14 days. Renewal action required to prevent service disruption.', type: 'warning', severity: 'medium' },
  ];
  for (let i = 0; i < notifs.length; i++) {
    const n = notifs[i];
    await db.notification.create({
      data: {
        userId: adminUser?.id || null,
        title: n.title,
        message: n.message,
        type: n.type,
        severity: n.severity,
        isRead: i > 3,
        createdAt: new Date(Date.now() - (i * 1800000)),
      }
    });
  }
  counts.notifications = notifs.length;
  console.log(`  Created ${notifs.length} notifications`);

  // ════════════════════════════════════════════════════════════════
  // 22. REPORTS
  // ════════════════════════════════════════════════════════════════
  console.log('Seeding reports...');
  const reportDefs = [
    { title: 'Weekly Security Assessment — Week 28', type: 'security_assessment', format: 'markdown' },
    { title: 'VIP Protection Status Report', type: 'vip_status', format: 'markdown' },
    { title: 'Threat Intelligence Summary — July 2024', type: 'intel_summary', format: 'markdown' },
    { title: 'Wall Guard Activity Report — Q3', type: 'wall_activity', format: 'markdown' },
    { title: 'Incident Response After-Action Report — IR-2024-0042', type: 'incident_aar', format: 'markdown' },
  ];
  for (const r of reportDefs) {
    await db.report.create({
      data: {
        title: r.title,
        type: r.type,
        format: r.format,
        content: `# ${r.title}\n\n**Generated:** ${new Date().toISOString()}\n**Classification:** CONFIDENTIAL\n**Author:** BABIRYE Automated Reporting System\n\n## Executive Summary\nThis report provides a comprehensive overview of security operations for the reporting period.\n\n## Key Findings\n- Total security events: ${Math.floor(Math.random() * 500) + 100}\n- Critical alerts: ${Math.floor(Math.random() * 10) + 2}\n- Resolved incidents: ${Math.floor(Math.random() * 20) + 5}\n- Active investigations: ${Math.floor(Math.random() * 5) + 1}\n\n## Recommendations\n1. Implement additional network segmentation for DMZ zones\n2. Update SSL certificates before expiration\n3. Schedule forced password reset for potentially compromised accounts\n4. Deploy additional sensors to Sector D coverage gap`,
        status: 'final',
        createdBy: adminUser?.id || null,
      }
    });
  }
  counts.reports = reportDefs.length;
  console.log(`  Created ${reportDefs.length} reports`);

  // ════════════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════════════
  console.log('\n✅ Seeding complete!');
  console.log('Record counts:');
  let total = 0;
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k}: ${v}`);
    total += Number(v);
  }
  console.log(`\n  TOTAL: ${total} records`);
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => db.$disconnect());