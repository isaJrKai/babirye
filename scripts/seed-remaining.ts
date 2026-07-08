/**
 * BABIRYE v10.0.0 — Seed remaining tables
 */
import { db } from '../src/lib/db';

const now = new Date();
const hr = (hours: number) => new Date(now.getTime() - hours * 3600000);
const days = (d: number) => new Date(now.getTime() - d * 86400000);
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  const counts: Record<string, number> = {};

  // ════════════════════════════════════════════════════
  // SENSORS (31 types)
  // ════════════════════════════════════════════════════
  if ((await db.sensor.count()) === 0) {
    const sensors = [
      { name: 'AN/TPQ-53 Radar', type: 'radar', subtype: 'ground_surveillance', description: 'Counter-fire radar with 60km range for artillery and mortar detection.', status: 'online', sensitivity: 0.92, range: 60, frequency: 'X-band' },
      { name: 'AN/MPQ-64 Sentinel', type: 'radar', subtype: 'air_defense', description: 'Three-dimensional phased array radar for short-range air defense.', status: 'online', sensitivity: 0.88, range: 75, frequency: 'C-band' },
      { name: 'AN/APG-81 AESA', type: 'radar', subtype: 'multi_mode', description: 'Active electronically scanned array radar with air-to-air and air-to-ground modes.', status: 'online', sensitivity: 0.95, range: 200, frequency: 'X-band' },
      { name: 'AN/ZPY-2 Starlite', type: 'radar', subtype: 'surveillance', description: 'High-altitude wide-area surveillance radar for persistent ISR operations.', status: 'maintenance', sensitivity: 0.85, range: 120, frequency: 'Ku-band' },
      { name: 'SQS-53C Sonar', type: 'sonar', subtype: 'active_passive', description: 'Advanced bow-mounted sonar system with active and passive acoustic detection.', status: 'online', sensitivity: 0.90, range: 40, frequency: 'LF 3.5kHz' },
      { name: 'AN/SQS-56', type: 'sonar', subtype: 'hull_mounted', description: 'Medium-frequency hull-mounted active/passive sonar for submarine detection.', status: 'online', sensitivity: 0.82, range: 20, frequency: 'MF 5kHz' },
      { name: 'AN/AQS-22 ALFS', type: 'sonar', subtype: 'dipping', description: 'Airborne low-frequency sonar deployed from helicopters for ASW operations.', status: 'offline', sensitivity: 0.87, range: 35, frequency: 'LF 1.2kHz' },
      { name: 'TB-29A Towed Array', type: 'sonar', subtype: 'towed_array', description: 'Long thin-line towed array sonar for submarine passive detection at extended ranges.', status: 'online', sensitivity: 0.93, range: 100, frequency: 'VLF 0.1-2kHz' },
      { name: 'VLP-16 LiDAR', type: 'lidar', subtype: '3d_mapping', description: '16-channel LiDAR sensor for 3D environmental mapping and object detection.', status: 'online', sensitivity: 0.89, range: 0.1, frequency: '905nm' },
      { name: 'HDL-64E LiDAR', type: 'lidar', subtype: 'autonomous', description: '64-channel high-definition LiDAR for autonomous navigation and threat detection.', status: 'online', sensitivity: 0.96, range: 0.12, frequency: '905nm' },
      { name: 'RLS-2020', type: 'lidar', subtype: 'perimeter', description: 'Long-range laser scanner for perimeter surveillance and intrusion detection.', status: 'online', sensitivity: 0.91, range: 0.2, frequency: '1550nm' },
      { name: 'AN/SLQ-32 ESM', type: 'ew', subtype: 'esm', description: 'Electronic support measures suite for signal interception and threat identification.', status: 'online', sensitivity: 0.88, range: 200, frequency: '2-18GHz' },
      { name: 'AN/ALQ-99 ECM', type: 'ew', subtype: 'ecm', description: 'Tactical electronic countermeasures pod for jamming enemy radar and communications.', status: 'offline', sensitivity: 0.85, range: 150, frequency: '0.5-18GHz' },
      { name: 'AN/ASQ-239', type: 'ew', subtype: 'integrated', description: 'Integrated electronic warfare suite with radar warning, jamming, and geo-location.', status: 'online', sensitivity: 0.97, range: 250, frequency: '0.5-40GHz' },
      { name: 'Pd-100 Acoustic', type: 'acoustic', subtype: 'ground', description: 'Seismic-acoustic ground sensor for footstep and vehicle detection.', status: 'online', sensitivity: 0.78, range: 0.3, frequency: '20Hz-10kHz' },
      { name: 'AN/UMQ-13', type: 'acoustic', subtype: 'uav', description: 'UAV-mounted acoustic sensor array for detecting and tracking hostile fire.', status: 'online', sensitivity: 0.84, range: 2, frequency: '100Hz-5kHz' },
      { name: 'SRF-500 Perimeter', type: 'acoustic', subtype: 'perimeter', description: 'Perimeter intrusion detection sensor using acoustic wave pattern analysis.', status: 'online', sensitivity: 0.81, range: 0.5, frequency: '50Hz-20kHz' },
      { name: 'AN/TPS-80', type: 'radar', subtype: 'multi_role', description: 'Ground/Air Task-Oriented Radar for multi-role surveillance and air defense.', status: 'online', sensitivity: 0.93, range: 120, frequency: 'S/C-band' },
      { name: 'SPY-6 AMDR', type: 'radar', subtype: 'aegis', description: 'Air and Missile Defense Radar using S-band active arrays for integrated air defense.', status: 'online', sensitivity: 0.98, range: 400, frequency: 'S-band' },
      { name: 'TRACER LRAS3', type: 'radar', subtype: 'recon', description: 'Long-range advanced surveillance sensor with thermal and radar capabilities.', status: 'maintenance', sensitivity: 0.86, range: 30, frequency: 'Ka-band' },
      { name: 'Miniature SAR', type: 'radar', subtype: 'synthetic_aperture', description: 'Compact synthetic aperture radar for small UAV reconnaissance missions.', status: 'online', sensitivity: 0.82, range: 15, frequency: 'Ku-band' },
      { name: 'MK-50 Mod 2', type: 'sonar', subtype: 'torpedo', description: 'Torpedo-mounted acoustic homing sonar with active and passive search modes.', status: 'offline', sensitivity: 0.91, range: 8, frequency: 'HF 25kHz' },
      { name: 'AN/BQQ-10', type: 'sonar', subtype: 'submarine', description: 'Submarine bow-mounted spherical sonar array with advanced signal processing.', status: 'online', sensitivity: 0.95, range: 80, frequency: 'LF-MF' },
      { name: 'VQ-2D Drone LiDAR', type: 'lidar', subtype: 'drone_mounted', description: 'Drone-mounted LiDAR for rapid area mapping and structural assessment.', status: 'online', sensitivity: 0.88, range: 0.15, frequency: '905nm' },
      { name: 'AN/MLQ-40', type: 'ew', subtype: 'comint', description: 'Communications intelligence intercept system for enemy C2 monitoring.', status: 'online', sensitivity: 0.86, range: 100, frequency: 'HF-UHF' },
      { name: 'CREW Duke V3', type: 'ew', subtype: 'counter_ied', description: 'Vehicle-mounted counter-RCIED electronic warfare system for IED defeat.', status: 'online', sensitivity: 0.83, range: 0.3, frequency: '20-3000MHz' },
      { name: 'Silent Guardian', type: 'ew', subtype: 'directed_energy', description: 'Active denial system using millimeter wave for area denial operations.', status: 'offline', sensitivity: 0.90, range: 0.7, frequency: '95GHz' },
      { name: 'AN/AAR-57 CMWS', type: 'acoustic', subtype: 'missile_warning', description: 'Common missile warning system using UV and acoustic sensors for threat detection.', status: 'online', sensitivity: 0.89, range: 5, frequency: 'UV+A' },
      { name: 'BOSS V5', type: 'acoustic', subtype: 'sniper_detection', description: 'Bullet detection system using acoustic sensors to locate sniper fire origin.', status: 'online', sensitivity: 0.92, range: 1.5, frequency: 'Muzzle blast' },
      { name: 'AN/PPS-5H', type: 'radar', subtype: 'man_portable', description: 'Man-portable battlefield surveillance radar with MTI capability.', status: 'online', sensitivity: 0.79, range: 15, frequency: 'J-band' },
      { name: 'Galaxy-6 SIGINT', type: 'ew', subtype: 'sigint', description: 'Satellite-based signals intelligence platform for global electromagnetic surveillance.', status: 'online', sensitivity: 0.99, range: 36000, frequency: 'HF-EHF' },
    ];
    for (const s of sensors) {
      await db.sensor.create({
        data: {
          ...s,
          config: JSON.stringify({ refreshRate: rand(1, 10) + 'Hz', powerLevel: rand(60, 100) + '%' }),
          location: pick(['Sector Alpha', 'Sector Bravo', 'Sector Charlie', 'Sector Delta', 'HQ Perimeter', 'DMZ North', 'DMZ South', 'Mobile Unit 1']),
        }
      });
    }
    counts.sensors = sensors.length;
  }

  // ════════════════════════════════════════════════════
  // SENSOR READINGS (recent)
  // ════════════════════════════════════════════════════
  if ((await db.sensorReading.count()) === 0) {
    const sensorList = await db.sensor.findMany({ select: { id: true } });
    let readingCount = 0;
    for (const sensor of sensorList) {
      const numReadings = rand(20, 50);
      for (let i = 0; i < numReadings; i++) {
        const isAnomaly = Math.random() < 0.05;
        await db.sensorReading.create({
          data: {
            sensorId: sensor.id,
            value: isAnomaly ? rand(80, 100) : rand(5, 60),
            unit: 'dBm',
            metadata: JSON.stringify({ signalStrength: rand(-90, -30), noiseFloor: rand(-100, -70) }),
            confidence: isAnomaly ? 0.6 + Math.random() * 0.3 : 0.85 + Math.random() * 0.15,
            isAnomaly,
            anomalyScore: isAnomaly ? 0.7 + Math.random() * 0.3 : null,
            createdAt: new Date(now.getTime() - i * 300000 * rand(1, 5)),
          }
        });
        readingCount++;
      }
    }
    counts.sensorReadings = readingCount;
  }

  // ════════════════════════════════════════════════════
  // SECURITY ALERTS
  // ════════════════════════════════════════════════════
  if ((await db.securityAlert.count()) === 0) {
    const alertTypes = ['intrusion', 'malware', 'anomaly', 'policy_violation', 'data_breach', 'dos', 'phishing'];
    const severities = ['critical', 'high', 'medium', 'low', 'info'];
    const statuses = ['new', 'investigating', 'resolved', 'false_positive', 'escalated'];
    const alertTitles = [
      'Brute force attempt detected on SSH port 22',
      'Suspicious PowerShell execution from web server',
      'DDoS attack pattern identified on external interface',
      'Unauthorized API access from unknown IP range',
      'Malware signature match in email attachment',
      'Privilege escalation attempt on database server',
      'Data exfiltration pattern detected to external endpoint',
      'Phishing campaign targeting administrative accounts',
      'Anomalous login pattern from multiple geolocations',
      'Zero-day exploit attempt against web application',
      'Certificate pinning violation detected',
      'Port scan from internal network segment',
      'SQL injection attempt blocked by WAF',
      'Unusual DNS query pattern detected',
      'Potential supply chain compromise indicator',
    ];
    const sources = ['IDS/IPS', 'WAF', 'SIEM', 'EDR', 'Firewall', 'DLP', 'Email Gateway', 'DNS Monitor'];
    const toolIds = (await db.defensiveTool.findMany({ select: { id: true }, take: 20 })).map(t => t.id);

    for (let i = 0; i < 50; i++) {
      const sev = pick(severities);
      await db.securityAlert.create({
        data: {
          source: pick(sources),
          severity: sev,
          type: pick(alertTypes),
          title: alertTitles[i % alertTitles.length],
          description: `Detailed analysis of the ${alertTitles[i % alertTitles.length].toLowerCase()} event. Automated response initiated. Investigation ongoing by security operations team.`,
          ioc: JSON.stringify({ ip: `192.168.${rand(1,254)}.${rand(1,254)}`, port: pick([22, 80, 443, 3389, 8080, 3306]), protocol: pick(['TCP', 'UDP', 'ICMP']), geo: pick(['Unknown', 'Eastern Europe', 'Southeast Asia', 'East Asia']) }),
          status: pick(statuses),
          assignedTo: pick(['Commander Nyx', 'Specter', 'Valkyrie', 'Watcher', 'Tracer', null]),
          resolution: Math.random() > 0.5 ? 'Threat neutralized. Blocking rules updated. No further action required.' : null,
          toolId: Math.random() > 0.3 ? pick(toolIds) : null,
          createdAt: new Date(now.getTime() - i * 3600000 * rand(1, 8)),
        }
      });
    }
    counts.securityAlerts = 50;
  }

  // ════════════════════════════════════════════════════
  // AUDIT LOGS
  // ════════════════════════════════════════════════════
  if ((await db.auditLog.count()) === 0) {
    const users = await db.user.findMany({ select: { id: true } });
    const actions = ['login', 'logout', 'view_dashboard', 'create_task', 'update_settings', 'export_report', 'approve_council_decision', 'deploy_agent', 'view_alerts', 'scan_initiated', 'tool_activated', 'sensor_configured', 'wall_guard_triggered'];
    const resources = ['auth', 'dashboard', 'task', 'settings', 'report', 'council', 'agent', 'alert', 'scan', 'tool', 'sensor', 'wall'];
    for (let i = 0; i < 100; i++) {
      await db.auditLog.create({
        data: {
          userId: pick(users).id,
          action: pick(actions),
          resource: pick(resources),
          details: JSON.stringify({ browser: pick(['Chrome', 'Firefox', 'Safari']), os: pick(['Windows', 'Linux', 'macOS']) }),
          ipAddress: `10.0.${rand(1,254)}.${rand(1,254)}`,
          userAgent: 'Mozilla/5.0 (BABIRYE Dashboard)',
          statusCode: pick([200, 200, 200, 201, 204, 301, 400, 401, 403, 404, 500]),
          durationMs: rand(5, 2500),
          createdAt: new Date(now.getTime() - i * 1800000 * rand(1, 3)),
        }
      });
    }
    counts.auditLogs = 100;
  }

  // ════════════════════════════════════════════════════
  // TASKS
  // ════════════════════════════════════════════════════
  if ((await db.task.count()) === 0) {
    const agents = await db.agent.findMany({ select: { id: true } });
    const users = await db.user.findMany({ select: { id: true } });
    const taskTypes = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];
    const taskStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    const taskNames = [
      'Network vulnerability assessment', 'Memory forensics acquisition', 'Firewall rule optimization',
      'Sensor calibration sweep', 'VIP route risk analysis', 'Potential scenario evaluation',
      'Malware reverse engineering', 'Penetration test - external', 'Endpoint hardening deployment',
      'Threat hunting campaign', 'Log analysis - suspicious activity', 'Container security audit',
    ];
    for (let i = 0; i < 40; i++) {
      const status = pick(taskStatuses);
      await db.task.create({
        data: {
          agentId: pick(agents).id,
          creatorId: pick(users).id,
          type: pick(taskTypes),
          status,
          priority: rand(1, 10),
          input: JSON.stringify({ target: `10.0.${rand(1,254)}.${rand(1,254)}`, mode: pick(['quick', 'deep', 'stealth']) }),
          output: status === 'completed' ? JSON.stringify({ findings: rand(0, 15), vulnerabilities: rand(0, 8) }) : null,
          errorMessage: status === 'failed' ? 'Connection timeout after 30 seconds. Target unreachable.' : null,
          progress: status === 'completed' ? 100 : status === 'running' ? rand(10, 90) : 0,
          startedAt: status !== 'pending' ? new Date(now.getTime() - rand(1, 48) * 3600000) : null,
          completedAt: status === 'completed' || status === 'failed' ? new Date(now.getTime() - rand(1, 24) * 3600000) : null,
        }
      });
    }
    counts.tasks = 40;
  }

  // ════════════════════════════════════════════════════
  // SPA GATEWAYS
  // ════════════════════════════════════════════════════
  if ((await db.spaGateway.count()) === 0) {
    const gateways = [
      { name: 'Forensic Gateway', subsystem: 'forensic', port: 3001, host: '0.0.0.0', isActive: true, network: '10.0.1.0/24', secretHash: await import('bcryptjs').then(b => b.hash('gw-secret-forensic', 4)), deployedServices: JSON.stringify(['disk_imager', 'memory_analyzer', 'network_forensics']) },
      { name: 'Offensive Gateway', subsystem: 'offensive', port: 3002, host: '0.0.0.0', isActive: true, network: '10.0.2.0/24', secretHash: await import('bcryptjs').then(b => b.hash('gw-secret-offensive', 4)), deployedServices: JSON.stringify(['recon_scanner', 'exploit_engine', 'c2_framework']) },
      { name: 'Defensive Gateway', subsystem: 'defensive', port: 3003, host: '0.0.0.0', isActive: true, network: '10.0.3.0/24', secretHash: await import('bcryptjs').then(b => b.hash('gw-secret-defensive', 4)), deployedServices: JSON.stringify(['ids_manager', 'firewall_controller', 'endpoint_protector']) },
      { name: 'Micro-Defensive Gateway', subsystem: 'micro_defensive', port: 3004, host: '0.0.0.0', isActive: false, network: '10.0.4.0/24', secretHash: await import('bcryptjs').then(b => b.hash('gw-secret-micro', 4)), deployedServices: JSON.stringify(['input_validator', 'output_encoder', 'sanitizer']) },
      { name: 'Sensors Gateway', subsystem: 'sensors', port: 3005, host: '0.0.0.0', isActive: true, network: '10.0.5.0/24', secretHash: await import('bcryptjs').then(b => b.hash('gw-secret-sensors', 4)), deployedServices: JSON.stringify(['radar_controller', 'sonar_processor', 'lidar_mapper']) },
      { name: 'VIP Gateway', subsystem: 'vip', port: 3006, host: '0.0.0.0', isActive: false, network: '10.0.6.0/24', secretHash: await import('bcryptjs').then(b => b.hash('gw-secret-vip', 4)), deployedServices: JSON.stringify(['drone_manager', 'vehicle_tracker', 'wearable_monitor']) },
    ];
    for (const g of gateways) {
      await db.spaGateway.create({ data: g });
    }
    counts.spaGateways = gateways.length;
  }

  // ════════════════════════════════════════════════════
  // WEAPONS DATABASE
  // ════════════════════════════════════════════════════
  if ((await db.weapon.count()) === 0) {
    const weapons = [
      { name: 'Glock 19 Gen5', category: 'handgun', caliber: '9x19mm', range: 50, rateOfFire: 'Semi-auto', magazineCapacity: 15, status: 'deployed', serialNumber: 'WPN-HG-001' },
      { name: 'SIG Sauer P320 X-Carry', category: 'handgun', caliber: '9x19mm', range: 50, rateOfFire: 'Semi-auto', magazineCapacity: 17, status: 'armory', serialNumber: 'WPN-HG-002' },
      { name: 'HK MP5A5', category: 'smg', caliber: '9x19mm', range: 200, rateOfFire: '800 RPM', magazineCapacity: 30, status: 'deployed', serialNumber: 'WPN-SMG-001' },
      { name: 'FN P90', category: 'smg', caliber: '5.7x28mm', range: 200, rateOfFire: '900 RPM', magazineCapacity: 50, status: 'armory', serialNumber: 'WPN-SMG-002' },
      { name: 'M4A1 Carbine', category: 'rifle', caliber: '5.56x45mm', range: 500, rateOfFire: '700-950 RPM', magazineCapacity: 30, status: 'deployed', serialNumber: 'WPN-RF-001' },
      { name: 'HK416A5', category: 'rifle', caliber: '5.56x45mm', range: 600, rateOfFire: '850 RPM', magazineCapacity: 30, status: 'armory', serialNumber: 'WPN-RF-002' },
      { name: 'FN SCAR-H PR', category: 'sniper', caliber: '7.62x51mm', range: 1000, rateOfFire: 'Semi-auto', magazineCapacity: 20, status: 'armory', serialNumber: 'WPN-SN-001' },
      { name: 'Barrett M82A1', category: 'sniper', caliber: '.50 BMG', range: 1800, rateOfFire: 'Semi-auto', magazineCapacity: 10, status: 'armory', serialNumber: 'WPN-SN-002' },
      { name: 'Benelli M4', category: 'shotgun', caliber: '12 Gauge', range: 40, rateOfFire: 'Semi-auto', magazineCapacity: 7, status: 'deployed', serialNumber: 'WPN-SG-001' },
      { name: 'M249 SAW', category: 'lmg', caliber: '5.56x45mm', range: 800, rateOfFire: '750-1000 RPM', magazineCapacity: 200, status: 'armory', serialNumber: 'WPN-LMG-001' },
      { name: 'M203 Grenade Launcher', category: 'explosive', caliber: '40x46mm', range: 400, rateOfFire: 'Single shot', magazineCapacity: 1, status: 'armory', serialNumber: 'WPN-EXP-001' },
      { name: 'FGM-148 Javelin', category: 'missile', range: 2500, rateOfFire: 'Single shot', magazineCapacity: 1, status: 'armory', serialNumber: 'WPN-MSL-001' },
      { name: 'BÖHLER P1', category: 'non_lethal', range: 5, rateOfFire: 'Single shot', magazineCapacity: 5, status: 'deployed', serialNumber: 'WPN-NL-001' },
      { name: 'TASER X26P', category: 'non_lethal', range: 7, rateOfFire: 'Single shot', magazineCapacity: 1, status: 'deployed', serialNumber: 'WPN-NL-002' },
      { name: 'ADS Directed Energy', category: 'directed_energy', range: 700, status: 'armory', serialNumber: 'WPN-DE-001' },
    ];
    for (const w of weapons) {
      await db.weapon.create({
        data: {
          ...w,
          assignedTo: w.status === 'deployed' ? pick(['Specter', 'Valkyrie', 'Cipher']) : null,
          lastInspectionAt: days(rand(1, 30)),
        }
      });
    }
    counts.weapons = weapons.length;
  }

  // ════════════════════════════════════════════════════
  // MARTIAL ARTS
  // ════════════════════════════════════════════════════
  if ((await db.martialArt.count()) === 0) {
    const arts = [
      { name: 'Krav Maga', style: 'striking', origin: 'Israel', description: 'Military close-quarters combat system focused on real-world self-defense and threat neutralization.', techniques: JSON.stringify(['punch combinations', 'kick defenses', 'chokeholds', 'weapon disarms', 'ground defense']), effectiveness: JSON.stringify(['striking:90', 'grappling:75', 'defense:95', 'multiple_attackers:80']) },
      { name: 'Brazilian Jiu-Jitsu', style: 'grappling', origin: 'Brazil', description: 'Ground fighting martial art emphasizing joint locks and chokeholds for submission.', techniques: JSON.stringify(['armbar', 'triangle choke', 'rear naked choke', 'guard passes', 'sweeps']), effectiveness: JSON.stringify(['striking:30', 'grappling:95', 'defense:85', 'multiple_attackers:40']) },
      { name: 'Muay Thai', style: 'striking', origin: 'Thailand', description: 'Stand-up striking art using fists, elbows, knees, and shins for devastating attacks.', techniques: JSON.stringify(['roundhouse kick', 'elbow strike', 'knee strike', 'clinch', 'teep']), effectiveness: JSON.stringify(['striking:95', 'grappling:35', 'defense:70', 'multiple_attackers:60']) },
      { name: 'Systema', style: 'hybrid', origin: 'Russia', description: 'Russian martial art focused on fluid movement, breathing, and biomechanical efficiency.', techniques: JSON.stringify(['groundwork', 'striking', 'grappling', 'weapon work', 'breathing exercises']), effectiveness: JSON.stringify(['striking:75', 'grappling:80', 'defense:90', 'multiple_attackers:70']) },
      { name: 'Judo', style: 'grappling', origin: 'Japan', description: 'Japanese martial art focused on throws and ground grappling techniques.', techniques: JSON.stringify(['ippon seoi nage', 'o-goshi', 'tomoe nage', 'kesa gatame', 'juji gatame']), effectiveness: JSON.stringify(['striking:20', 'grappling:90', 'defense:80', 'multiple_attackers:35']) },
      { name: 'Eskrima/Kali', style: 'weapons', origin: 'Philippines', description: 'Filipino martial art specializing in blade and stick fighting with empty-hand translation.', techniques: JSON.stringify(['sinawali', 'redonda', 'disarms', 'thrusting', 'striking patterns']), effectiveness: JSON.stringify(['striking:85', 'grappling:45', 'defense:85', 'multiple_attackers:75']) },
    ];
    for (const a of arts) {
      await db.martialArt.create({ data: { ...a, difficulty: pick(['beginner', 'intermediate', 'advanced', 'expert']) } });
    }
    counts.martialArts = arts.length;
  }

  // ════════════════════════════════════════════════════
  // VIP PROFILES
  // ════════════════════════════════════════════════════
  if ((await db.vipProfile.count()) === 0) {
    const vips = [
      { name: 'Director General Hassan', designation: 'Director General, National Security', threatLevel: 'critical', protectionLevel: 'maximum' },
      { name: 'Dr. Amara Osei', designation: 'Chief Science Advisor', threatLevel: 'high', protectionLevel: 'elevated' },
      { name: 'Minister Kofi Mensah', designation: 'Minister of Defense', threatLevel: 'critical', protectionLevel: 'maximum' },
      { name: 'Ambassador Li Wei', designation: 'Foreign Diplomat', threatLevel: 'high', protectionLevel: 'elevated' },
      { name: 'CEO Sarah Okonkwo', designation: 'CEO, Critical Infrastructure Corp', threatLevel: 'medium', protectionLevel: 'standard' },
    ];
    const vipIds: string[] = [];
    for (const v of vips) {
      const vip = await db.vipProfile.create({
        data: {
          ...v,
          status: pick(['active', 'active', 'active', 'emergency']),
          emergencyContact: '+1-555-' + rand(100, 999).toString().padStart(3, '0') + '-' + rand(1000, 9999),
          medicalInfo: JSON.stringify({ bloodType: pick(['O+', 'A+', 'B+', 'AB+']), allergies: pick(['None', 'Penicillin', 'Sulfa', 'Latex']), conditions: pick(['None', 'Hypertension', 'Diabetes Type 2']) }),
          travelSchedule: JSON.stringify({ currentLocation: pick(['HQ Building', 'Foreign Embassy', 'Field Office', 'Residence']), nextMove: days(1).toISOString(), transport: pick(['Armored Convoy', 'Helicopter', 'Private Vehicle']) }),
        }
      });
      vipIds.push(vip.id);
    }

    // VIP Drones
    for (const vipId of vipIds.slice(0, 3)) {
      const droneCount = rand(1, 3);
      for (let i = 0; i < droneCount; i++) {
        await db.vipDrone.create({
          data: {
            vipId,
            name: `Falcon-${String.fromCharCode(65 + i)}`,
            model: pick(['DJI Matrice 350', 'Skydio X10', 'Autel EVO II Pro']),
            status: pick(['standby', 'airborne', 'standby', 'charging']),
            batteryLevel: rand(30, 100),
            altitude: rand(50, 500),
            speed: rand(0, 80),
            gpsCoords: JSON.stringify({ lat: -1.2921 + (Math.random() - 0.5) * 0.1, lng: 36.8219 + (Math.random() - 0.5) * 0.1 }),
            cameraActive: Math.random() > 0.3,
            thermalActive: Math.random() > 0.5,
          }
        });
      }
    }

    // VIP Vehicles
    for (const vipId of vipIds.slice(0, 4)) {
      const vehicleCount = rand(1, 2);
      for (let i = 0; i < vehicleCount; i++) {
        await db.vipVehicle.create({
          data: {
            vipId,
            name: `Convoy ${['Alpha', 'Bravo', 'Charlie'][i]}`,
            type: pick(['armored', 'sedan', 'suv']),
            plate: `VIP-${rand(100, 999)}-${String.fromCharCode(65 + rand(0, 25))}${String.fromCharCode(65 + rand(0, 25))}`,
            status: pick(['parked', 'en_route', 'arrived']),
            fuelLevel: rand(40, 100),
            gpsCoords: JSON.stringify({ lat: -1.2921 + (Math.random() - 0.5) * 0.05, lng: 36.8219 + (Math.random() - 0.5) * 0.05 }),
            speed: rand(0, 120),
            heading: rand(0, 359),
          }
        });
      }
    }

    // VIP Wearables
    for (const vipId of vipIds) {
      await db.vipWearable.create({
        data: {
          vipId,
          type: 'smartwatch',
          deviceName: 'Garmin Tactix 7 Pro',
          status: pick(['connected', 'connected', 'alert', 'low_battery']),
          batteryLevel: rand(15, 100),
          heartRate: rand(58, 110),
          bloodPressure: JSON.stringify({ systolic: rand(110, 140), diastolic: rand(70, 90) }),
          temperature: 36 + Math.random() * 2,
          sosTriggered: Math.random() > 0.95,
          lastPingAt: new Date(now.getTime() - rand(10, 300) * 1000),
        }
      });
      await db.vipWearable.create({
        data: {
          vipId,
          type: 'gps_tracker',
          deviceName: 'Trackimo GPS Tracker',
          status: 'connected',
          batteryLevel: rand(50, 100),
          lastPingAt: new Date(now.getTime() - rand(5, 60) * 1000),
        }
      });
    }

    // VIP Incidents
    for (let i = 0; i < 15; i++) {
      await db.vipIncident.create({
        data: {
          vipId: pick(vipIds),
          type: pick(['threat', 'medical', 'route_deviation', 'perimeter_breach', 'sos']),
          severity: pick(['low', 'medium', 'high', 'critical']),
          description: pick(['Suspicious individual observed near VIP route.', 'GPS tracker signal lost momentarily.', 'Medical alert: elevated heart rate detected.', 'Unauthorized vehicle approached convoy.', 'SOS button activated accidentally.']),
          response: pick(['Security team dispatched.', 'Medical team notified.', 'Route adjusted. Convoy rerouted.', 'Perimeter sweep initiated.', 'False alarm confirmed.']),
          resolvedAt: Math.random() > 0.3 ? new Date(now.getTime() - rand(1, 24) * 3600000) : null,
          createdAt: new Date(now.getTime() - rand(1, 72) * 3600000),
        }
      });
    }
    counts.vipProfiles = vips.length;
  }

  // ════════════════════════════════════════════════════
  // POTENTIALS
  // ════════════════════════════════════════════════════
  if ((await db.potential.count()) === 0) {
    const potentials = [
      { name: 'Advanced Persistent Threat Hunting', category: 'defensive', subcategory: 'threat_hunting', description: 'Systematic identification and eradication of APT groups using behavioral analysis, network telemetry correlation, and endpoint detection.', difficulty: 'advanced', impact: 'high', tags: JSON.stringify(['apt', 'threat-hunting', 'behavioral-analysis', 'endpoint']) },
      { name: 'Zero-Day Exploit Chain Assembly', category: 'offensive', subcategory: 'exploitation', description: 'Combination of multiple zero-day vulnerabilities into a reliable exploit chain for penetration testing operations.', difficulty: 'expert', impact: 'critical', tags: JSON.stringify(['zero-day', 'exploit-chain', 'red-team', 'advanced']) },
      { name: 'Digital Evidence Timeline Reconstruction', category: 'forensic', subcategory: 'timeline', description: 'Comprehensive timeline reconstruction from multiple evidence sources including filesystem, network, and memory artifacts.', difficulty: 'advanced', impact: 'high', tags: JSON.stringify(['forensics', 'timeline', 'evidence', 'investigation']) },
      { name: 'Multi-Vector DDoS Mitigation', category: 'defensive', subcategory: 'network', description: 'Coordinated defense against volumetric, protocol, and application-layer DDoS attacks using rate limiting, traffic scrubbing, and CDN distribution.', difficulty: 'intermediate', impact: 'high', tags: JSON.stringify(['ddos', 'mitigation', 'network', 'traffic-analysis']) },
      { name: 'Close Protection Convoy Operations', category: 'vip', subcategory: 'convoy', description: 'Multi-vehicle VIP convoy management with real-time threat assessment, route optimization, and emergency response coordination.', difficulty: 'advanced', impact: 'critical', tags: JSON.stringify(['vip', 'convoy', 'protection', 'route-planning']) },
      { name: 'Sensor Fusion Anomaly Detection', category: 'intelligence', subcategory: 'fusion', description: 'Multi-sensor data fusion using Bayesian inference and machine learning for real-time anomaly detection across heterogeneous sensor networks.', difficulty: 'expert', impact: 'high', tags: JSON.stringify(['sensors', 'fusion', 'ml', 'anomaly-detection']) },
      { name: 'RF Spectrum Dominance', category: 'electronic_warfare', subcategory: 'spectrum', description: 'Control of the electromagnetic spectrum through offensive jamming, signal intelligence, and defensive anti-jamming techniques.', difficulty: 'expert', impact: 'critical', tags: JSON.stringify(['ew', 'spectrum', 'jamming', 'sigint']) },
      { name: 'Supply Chain Attack Detection', category: 'defensive', subcategory: 'supply_chain', description: 'Detection and prevention of software supply chain attacks including dependency confusion, typosquatting, and compromised update channels.', difficulty: 'advanced', impact: 'high', tags: JSON.stringify(['supply-chain', 'dependency', 'malware', 'detection']) },
      { name: 'Memory Forensics Analysis', category: 'forensic', subcategory: 'memory', description: 'In-depth volatile memory analysis for process injection detection, credential harvesting identification, and rootkit discovery.', difficulty: 'advanced', impact: 'high', tags: JSON.stringify(['memory', 'forensics', 'rootkit', 'malware']) },
      { name: 'Cyber-Kinetic ICS Defense', category: 'cyber_kinetic', subcategory: 'ics', description: 'Defense of industrial control systems including SCADA network segmentation, PLC firmware validation, and safety instrumented system monitoring.', difficulty: 'expert', impact: 'critical', tags: JSON.stringify(['ics', 'scada', 'ot-security', 'critical-infrastructure']) },
    ];
    for (const p of potentials) {
      const pot = await db.potential.create({
        data: {
          ...p,
          requirements: JSON.stringify(['specialized_training', 'tool_access', 'clearance_level_3']),
        }
      });
      // Add 1-2 scenarios per potential
      for (let i = 0; i < rand(1, 2); i++) {
        await db.scenario.create({
          data: {
            potentialId: pot.id,
            name: `${p.name} — Scenario ${i + 1}`,
            description: `Operational scenario for ${p.name.toLowerCase()} with defined preconditions, execution steps, and expected outcomes.`,
            preconditions: JSON.stringify(['system_access', 'threat_intel_feed']),
            steps: JSON.stringify(['Reconnaissance', 'Analysis', 'Execution', 'Verification']),
            expectedOutcome: 'Successful operation completion with documented findings.',
            riskAssessment: JSON.stringify({ riskLevel: pick(['low', 'medium', 'high']), mitigation: 'Standard operational procedures apply.' }),
            status: pick(['draft', 'tested', 'verified']),
          }
        });
      }
    }
    counts.potentials = potentials.length;
  }

  // ════════════════════════════════════════════════════
  // INTELLIGENCE FEEDS
  // ════════════════════════════════════════════════════
  if ((await db.intelligenceFeed.count()) === 0) {
    const feeds = [
      { name: 'OmniRoute Threat Feed', source: 'omniroute', feedType: 'ioc', frequency: 'real_time', isActive: true, itemCount: 14523 },
      { name: 'IronSight Vulnerability DB', source: 'iron_sight', feedType: 'vulnerability', frequency: 'hourly', isActive: true, itemCount: 8920 },
      { name: 'Open Threat Exchange', source: 'open_threat', feedType: 'threat_actor', frequency: 'daily', isActive: true, itemCount: 3421 },
      { name: 'Mini Shodan Scanner', source: 'mini_shodan', feedType: 'ioc', frequency: 'hourly', isActive: true, itemCount: 21050 },
      { name: 'Dark Web Monitor', source: 'custom', feedType: 'dark_web', frequency: 'daily', isActive: true, itemCount: 1876 },
      { name: 'Geo-Political Risk Feed', source: 'custom', feedType: 'geo_political', frequency: 'weekly', isActive: false, itemCount: 342 },
    ];
    for (const f of feeds) {
      const feed = await db.intelligenceFeed.create({
        data: {
          ...f,
          url: `https://intel.babirye.local/feeds/${f.source}`,
          apiKey: f.isActive ? `bbr_feed_${Math.random().toString(36).slice(2, 10)}` : null,
          lastFetchedAt: f.isActive ? new Date(now.getTime() - rand(1, 24) * 3600000) : null,
        }
      });
      // Add intel items
      const itemTitles = [
        'New CVE-2024-' + rand(10000, 99999) + ' affecting popular framework',
        'APT group ' + pick(['APT-29', 'APT-38', 'Lazarus', 'Fancy Bear', 'Equation Group']) + ' activity detected',
        'Malware campaign targeting financial sector',
        'Phishing kit update with improved evasion',
        'Zero-day exploit listed on dark web marketplace',
        'Suspicious domain registration pattern identified',
      ];
      for (let i = 0; i < rand(5, 10); i++) {
        await db.intelItem.create({
          data: {
            feedId: feed.id,
            title: itemTitles[i % itemTitles.length],
            description: 'Threat intelligence item requiring analyst review and potential action.',
            ioc: JSON.stringify({ indicators: [`192.168.${rand(1,254)}.${rand(1,254)}`, `10.0.${rand(1,254)}.${rand(1,254)}`] }),
            severity: pick(['critical', 'high', 'medium', 'low']),
            confidence: 0.5 + Math.random() * 0.5,
            tags: JSON.stringify([pick(['apt', 'malware', 'phishing', 'vulnerability', 'exploit'])]),
            isProcessed: Math.random() > 0.4,
          }
        });
      }
    }
    counts.intelligenceFeeds = feeds.length;
  }

  // ════════════════════════════════════════════════════
  // SYSTEM SETTINGS (including API keys)
  // ════════════════════════════════════════════════════
  if ((await db.systemSetting.count()) === 0) {
    const settings = [
      { key: 'platform_name', value: 'BABIRYE', category: 'general', description: 'Platform display name' },
      { key: 'platform_version', value: '10.0.0', category: 'general', description: 'Current platform version' },
      { key: 'session_timeout', value: '86400', category: 'security', description: 'Session timeout in seconds (24h)' },
      { key: 'max_login_attempts', value: '5', category: 'security', description: 'Maximum failed login attempts before lockout' },
      { key: 'lockout_duration', value: '900', category: 'security', description: 'Account lockout duration in seconds (15min)' },
      { key: 'password_min_length', value: '12', category: 'security', description: 'Minimum password length' },
      { key: 'mfa_required', value: 'false', category: 'security', description: 'Require multi-factor authentication' },
      { key: 'audit_log_retention_days', value: '365', category: 'security', description: 'Days to retain audit logs' },
      { key: 'shodan_api_key', value: '', category: 'api', isSecret: true, description: 'Shodan API key for external reconnaissance' },
      { key: 'virustotal_api_key', value: '', category: 'api', isSecret: true, description: 'VirusTotal API key for malware analysis' },
      { key: 'alienvault_otx_key', value: '', category: 'api', isSecret: true, description: 'AlienVault OTX API key for threat intelligence' },
      { key: 'censys_api_id', value: '', category: 'api', isSecret: true, description: 'Censys API ID for internet scanning' },
      { key: 'censys_api_secret', value: '', category: 'api', isSecret: true, description: 'Censys API secret for internet scanning' },
      { key: 'abuseipdb_api_key', value: '', category: 'api', isSecret: true, description: 'AbuseIPDB API key for IP reputation' },
      { key: 'ipquality_api_key', value: '', category: 'api', isSecret: true, description: 'IPQualityScore API key for fraud detection' },
      { key: 'notification_email_enabled', value: 'false', category: 'notification', description: 'Enable email notifications' },
      { key: 'notification_webhook_url', value: '', category: 'notification', description: 'Webhook URL for alert notifications' },
      { key: 'notification_slack_webhook', value: '', category: 'notification', isSecret: true, description: 'Slack webhook URL for notifications' },
      { key: 'max_concurrent_tasks', value: '10', category: 'general', description: 'Maximum concurrent tasks per agent' },
      { key: 'data_retention_days', value: '90', category: 'database', description: 'Default data retention period in days' },
      { key: 'db_backup_interval', value: '3600', category: 'database', description: 'Database backup interval in seconds' },
    ];
    for (const s of settings) {
      await db.systemSetting.create({ data: s });
    }
    counts.systemSettings = settings.length;
  }

  // ════════════════════════════════════════════════════
  // CONSTITUTIONS
  // ════════════════════════════════════════════════════
  if ((await db.constitution.count()) === 0) {
    const constitutions = [
      { name: 'BABIRYE Core Constitution', subsystem: 'babirye', content: 'The BABIRYE Core Constitution establishes the fundamental operating principles, governance framework, and ethical boundaries for the entire security operations platform. All subsystems must adhere to these principles: (1) Zero Trust Architecture - never trust, always verify; (2) Defense in Depth - multiple layers of security controls; (3) Least Privilege - minimum necessary access; (4) Audit Everything - complete traceability of all actions; (5) Self-Protection - the system must defend itself against compromise; (6) Human Oversight - critical decisions require human approval; (7) Ethical Operations - all actions must comply with applicable laws and ethical standards; (8) Resilience - the system must maintain operations under adverse conditions.' },
      { name: 'Forensic Operations Constitution', subsystem: 'forensic', content: 'The Forensic Operations Constitution governs all digital forensic activities including evidence acquisition, analysis, and reporting. Key principles: (1) Chain of Custody - all evidence must maintain an unbroken chain of custody; (2) Forensic Soundness - acquisition methods must not alter original evidence; (3) Documentation - every action must be documented with timestamps; (4) Reproducibility - all analyses must be reproducible; (5) Legal Compliance - operations must comply with jurisdictional requirements; (6) Minimum Necessary - collect only evidence relevant to the investigation.' },
      { name: 'Offensive Operations Constitution', subsystem: 'offensive', content: 'The Offensive Operations Constitution governs all authorized offensive security activities. Key principles: (1) Authorization First - all offensive operations require explicit written authorization; (2) Scope Limitation - operations must remain within authorized scope; (3) Minimum Damage - exploit and test with minimum necessary impact; (4) Disclosure - all vulnerabilities found must be reported; (5) No Persistence - no backdoors or persistent access may be established; (6) Clean-up - all offensive tools and traces must be removed post-operation.' },
      { name: 'Defensive Operations Constitution', subsystem: 'defensive', content: 'The Defensive Operations Constitution governs all defensive security measures. Key principles: (1) Proactive Defense - actively hunt for threats before they cause damage; (2) Automated Response - enable automated blocking for known threats; (3) Escalation Protocol - unknown or complex threats must be escalated to human analysts; (4) False Positive Management - continuously tune detection to minimize false positives; (5) Recovery Planning - maintain and test recovery procedures; (6) Continuous Improvement - regularly update defenses based on threat intelligence.' },
      { name: 'Micro-Defensive Constitution', subsystem: 'micro_defensive', content: 'The Micro-Defensive Constitution governs fine-grained security protections at the code and protocol level. Key principles: (1) Input Validation - all inputs must be validated and sanitized; (2) Output Encoding - all outputs must be properly encoded; (3) Parameterized Queries - database queries must use parameterized statements; (4) Secure Defaults - all components must default to secure configurations; (5) Defense at Every Layer - apply security controls at every architectural layer.' },
      { name: 'Sensors Operations Constitution', subsystem: 'sensors', content: 'The Sensors Operations Constitution governs all sensor network operations. Key principles: (1) Calibration - sensors must be regularly calibrated for accuracy; (2) Redundancy - critical monitoring must have sensor redundancy; (3) Data Integrity - sensor data must be protected from tampering; (4) Anomaly Detection - automated anomaly detection must be enabled on all sensors; (5) Maintenance Schedule - sensors must follow preventive maintenance schedules.' },
    ];
    for (const c of constitutions) {
      await db.constitution.create({ data: c });
    }
    counts.constitutions = constitutions.length;
  }

  // ════════════════════════════════════════════════════
  // REPORTS
  // ════════════════════════════════════════════════════
  if ((await db.report.count()) === 0) {
    const reportTypes = ['incident', 'forensic', 'vulnerability', 'compliance', 'intelligence', 'operation'];
    for (let i = 0; i < 20; i++) {
      const rType = pick(reportTypes);
      await db.report.create({
        data: {
          title: `${rType.charAt(0).toUpperCase() + rType.slice(1)} Report #${String(i + 1).padStart(4, '0')}`,
          type: rType,
          format: pick(['json', 'pdf', 'html', 'markdown']),
          content: `# ${rType.charAt(0).toUpperCase() + rType.slice(1)} Report\n\n## Executive Summary\n\nThis report details the findings from the ${rType} operation conducted on ${days(rand(1, 14)).toLocaleDateString()}. The operation was completed successfully with key findings documented below.\n\n## Findings\n\n- Finding 1: Detailed analysis result\n- Finding 2: Risk assessment outcome\n- Finding 3: Recommended actions\n\n## Recommendations\n\n1. Implement additional monitoring\n2. Update security policies\n3. Schedule follow-up assessment`,
          summary: `Comprehensive ${rType} report with ${rand(3, 12)} findings and ${rand(2, 8)} recommendations.`,
          classification: pick(['internal', 'confidential', 'secret']),
          generatedBy: pick(['Commander Nyx', 'Specter', 'Valkyrie', 'Auto-Generated']),
        }
      });
    }
    counts.reports = 20;
  }

  // ════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ════════════════════════════════════════════════════
  if ((await db.notification.count()) === 0) {
    const notifTypes = ['alert', 'task', 'system', 'vip', 'sensor'];
    const notifSeverities = ['info', 'warning', 'error', 'critical'];
    const notifTitles = [
      'Critical security alert requires immediate attention',
      'Task assigned: Network vulnerability scan',
      'System update available: v10.0.1',
      'VIP protection status change',
      'Sensor offline: AN/AQS-22 ALFS',
      'New threat intelligence received',
      'Audit log review required',
      'Firewall rule update completed',
      'Agent health check: All systems nominal',
      'Potential scenario verified successfully',
    ];
    for (let i = 0; i < 30; i++) {
      await db.notification.create({
        data: {
          type: pick(notifTypes),
          title: notifTitles[i % notifTitles.length],
          message: 'Detailed notification message with context and recommended actions for the operations team.',
          severity: pick(notifSeverities),
          isRead: Math.random() > 0.5,
          actionUrl: '/' + pick(['alerts', 'tasks', 'vip-protection', 'sensors', 'dashboard']),
          metadata: JSON.stringify({ source: pick(['system', 'agent', 'sensor', 'user']), priority: rand(1, 5) }),
          createdAt: new Date(now.getTime() - i * 1800000),
        }
      });
    }
    counts.notifications = 30;
  }

  // ════════════════════════════════════════════════════
  // COUNCIL DECISIONS & VOTES
  // ════════════════════════════════════════════════════
  if ((await db.councilDecision.count()) === 0) {
    const domains = await db.councilDomain.findMany({ select: { id: true } });
    const users = await db.user.findMany({ select: { id: true } });
    const queries = [
      'Should we escalate the anomalous traffic pattern to a full incident response?',
      'Is the detected privilege escalation attempt a true positive requiring immediate containment?',
      'Should the forensic acquisition proceed on the compromised server?',
      'Does the sensor anomaly warrant a full security sweep of the affected sector?',
    ];
    for (const query of queries) {
      const domain = pick(domains);
      const decision = await db.councilDecision.create({
        data: {
          domainId: domain.id,
          query,
          decision: pick(['approved', 'rejected', 'deferred']),
          confidence: 0.6 + Math.random() * 0.35,
          vetoBy: Math.random() > 0.8 ? 'Legal & Compliance' : null,
          reasoning: 'Based on the available evidence and domain expertise, the council has reached a consensus decision.',
          voteCount: rand(7, 12),
          approveCount: rand(4, 10),
          rejectCount: rand(0, 3),
          abstainCount: rand(0, 2),
        }
      });
      // Add votes
      for (const user of users.slice(0, rand(5, 9))) {
        await db.councilVote.create({
          data: {
            domainId: domain.id,
            userId: user.id,
            decisionId: decision.id,
            vote: pick(['approved', 'approved', 'approved', 'rejected', 'abstain']),
            confidence: 0.5 + Math.random() * 0.5,
            reasoning: pick(['Strong evidence supports this position.', 'Additional analysis needed.', 'Agrees with majority assessment.']),
          }
        });
      }
    }
    counts.councilDecisions = queries.length;
  }

  // ════════════════════════════════════════════════════
  // WALL BLOCKS
  // ════════════════════════════════════════════════════
  if ((await db.wallBlock.count()) === 0) {
    const guards = await db.wallGuard.findMany({ select: { id: true, name: true } });
    const actions = ['eval() call in request parameter', 'Outbound connection to unknown endpoint', 'Sudo command execution attempt', 'Config file modification attempt', 'Credential extraction pattern detected', 'Path traversal with ../ sequence', 'Prototype pollution attempt via __proto__', 'Replay of previously captured request', 'Unsafe deserialization with pickle.loads()', 'Logic bomb trigger pattern detected'];
    for (let i = 0; i < 80; i++) {
      const guard = pick(guards);
      await db.wallBlock.create({
        data: {
          guardId: guard.id,
          action: actions[i % actions.length],
          service: pick(['API', 'Auth', 'Dashboard', 'Agent', 'Gateway']),
          params: JSON.stringify({ param: 'value', source: 'external' }),
          clientIp: `10.0.${rand(1,254)}.${rand(1,254)}`,
          reason: `Blocked by ${guard.name}: ${actions[i % actions.length].toLowerCase()}`,
          createdAt: new Date(now.getTime() - i * 3600000 * rand(1, 6)),
        }
      });
    }
    counts.wallBlocks = 80;
  }

  // ════════════════════════════════════════════════════
  // FORENSIC CASES & OPERATIONS
  // ════════════════════════════════════════════════════
  if ((await db.forensicCase.count()) === 0) {
    const tools = await db.forensicTool.findMany({ select: { id: true } });
    const caseStatuses = ['open', 'in_progress', 'closed', 'archived'];
    for (let i = 0; i < 15; i++) {
      await db.forensicCase.create({
        data: {
          caseNumber: `FR-${String(2024000 + i + 1)}`,
          title: pick(['Ransomware Analysis', 'Data Breach Investigation', 'Insider Threat Case', 'Network Intrusion Forensics', 'Mobile Device Examination', 'Memory Forensics Case', 'Phishing Campaign Analysis']),
          description: 'Detailed forensic case description with investigation scope, evidence requirements, and analysis methodology.',
          status: pick(caseStatuses),
          priority: pick(['low', 'medium', 'high', 'critical']),
          assignedTo: pick(['Commander Nyx', 'Specter', 'Valkyrie', 'Watcher', 'Tracer']),
          toolId: pick(tools).id,
          evidence: JSON.stringify([{ type: 'disk_image', size: '256GB', hash: 'sha256:abc123' }, { type: 'memory_dump', size: '32GB', hash: 'sha256:def456' }]),
          findings: Math.random() > 0.3 ? 'Key findings documented in analysis report.' : null,
          report: Math.random() > 0.6 ? 'Full forensic report generated and attached.' : null,
        }
      });
    }
    counts.forensicCases = 15;
  }

  if ((await db.operation.count()) === 0) {
    const tools = await db.offensiveTool.findMany({ select: { id: true } });
    const opStatuses = ['planning', 'active', 'completed', 'failed', 'cancelled'];
    for (let i = 0; i < 20; i++) {
      const status = pick(opStatuses);
      await db.operation.create({
        data: {
          toolId: pick(tools).id,
          name: pick(['Operation Iron Shield', 'Operation Silent Hawk', 'Operation Dark Net', 'Operation Thunder Sweep', 'Operation Ghost Protocol', 'Operation Red Horizon']),
          description: 'Authorized offensive security operation with defined scope and objectives.',
          status,
          scope: pick(['authorized', 'internal', 'external']),
          startDate: new Date(now.getTime() - rand(1, 30) * 86400000),
          endDate: status === 'completed' || status === 'failed' ? new Date(now.getTime() - rand(1, 7) * 86400000) : null,
          objectives: JSON.stringify(['objective_1', 'objective_2']),
          results: status === 'completed' ? JSON.stringify({ success: true, findings: rand(2, 10) }) : null,
          operatorId: pick(['Specter', 'Valkyrie', 'Cipher']),
        }
      });
    }
    counts.operations = 20;
  }

  console.log('Seed complete. Counts:', JSON.stringify(counts, null, 2));
  await db.$disconnect();
}

seed().catch(e => { console.error('Seed error:', e); process.exit(1); });