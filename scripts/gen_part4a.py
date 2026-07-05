#!/usr/bin/env python3
"""Part 4a: Makefile, README, Constitutions, VIP docker-compose + scripts"""
OUT = "/home/z/my-project/upload/Pasted Content_1782740004460.txt"
F = open(OUT, "a", encoding="utf-8")
def w(s=""): F.write(s + "\n")

si = 31

# ═══ 31. MAKEFILE ═══
w(f"## {si}. Makefile")
w("```makefile")
w(""".PHONY: help deploy activate-forensic deactivate-forensic activate-offensive deactivate-offensive activate-defensive deactivate-defensive activate-micro-defensive deactivate-micro-defensive activate-sensors deactivate-sensors activate-vip deactivate-vip wipe status

help:
\t@echo "BABIRYE v10.0.0 Titanium Ultra + VIP Protection"
\t@echo "  make deploy                     - Start all core services"
\t@echo "  make activate-forensic          - Activate forensic subsystem"
\t@echo "  make deactivate-forensic        - Deactivate & wipe forensic"
\t@echo "  make activate-offensive         - Activate offensive subsystem"
\t@echo "  make deactivate-offensive       - Deactivate & wipe offensive"
\t@echo "  make activate-defensive         - Activate defensive subsystem"
\t@echo "  make deactivate-defensive       - Deactivate & wipe defensive"
\t@echo "  make activate-micro-defensive    - Activate micro-defensive subsystem"
\t@echo "  make deactivate-micro-defensive  - Deactivate & wipe micro-defensive"
\t@echo "  make activate-sensors            - Activate sensors & weapons"
\t@echo "  make deactivate-sensors          - Deactivate sensors"
\t@echo "  make activate-vip                - Activate VIP protection"
\t@echo "  make deactivate-vip              - Deactivate VIP protection"
\t@echo "  make wipe                        - Wipe ALL data"
\t@echo "  make status                      - Show service status"

deploy:
\t./deploy.sh
activate-forensic:
\t./activate_forensic.sh
deactivate-forensic:
\t./deactivate_forensic.sh
activate-offensive:
\t./activate_offensive.sh
deactivate-offensive:
\t./deactivate_offensive.sh
activate-defensive:
\t./activate_defensive.sh
deactivate-defensive:
\t./deactivate_defensive.sh
activate-micro-defensive:
\t./activate_micro_defensive.sh
deactivate-micro-defensive:
\t./deactivate_micro_defensive.sh
activate-sensors:
\t./activate_sensors.sh
deactivate-sensors:
\t./deactivate_sensors.sh
activate-vip:
\t./activate_vip.sh
deactivate-vip:
\t./deactivate_vip.sh
wipe:
\tdocker compose down -v
\tfor f in forensic offensive defensive micro_defensive sensors vip; do docker compose -f docker-compose.$$f.yml down -v; done
\trm -rf data/*
status:
\tdocker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" | grep babirye-
""")
w("```")
w("---"); w()
si += 1

# ═══ 32. README ═══
w(f"## {si}. README.md")
w("```markdown")
w("""# BABIRYE v10.0.0 Titanium Ultra + VIP Protection System

## Overview

BABIRYE is a production-ready, self-hosted intelligence, security, and VIP protection operating system. It integrates multi-agent orchestration, real-time OSINT, 12 forensic tools, 72 offensive tools, 100 defensive tools, 150 micro-defensive tools (including 25 self-attack wall modules), sensor fusion (radar/sonar/LiDAR/acoustic/EW), 80+ weapons profiles, 25 martial arts styles, drone swarm control, autonomous vehicle integration, wearable security, biometric access control, expert council decision-making with council-of-expert-expertise fusion, and 300+ potential capabilities.

## Architecture

- **Core Services**: PostgreSQL, Qdrant, Neo4j, Meilisearch, NATS, Temporal, Prometheus, Grafana, IRONSIGHT, OpenThreat, Mini-Shodan, Circuit-Simulator, FreeMoCap, ArtiFixer, Badger, OpenSentry
- **Intelligence**: IRONSIGHT (50+ OSINT modules), OpenThreat (314k+ CVEs), Mini-Shodan
- **Forensic**: 12 tools (dormant, SPA-protected, 300s HMAC window)
- **Offensive**: 72 tools (22 original + 50 new, dormant, SPA-protected)
- **Defensive**: 100 tools (dormant, SPA-protected) spanning network, endpoint, application, identity, data, cloud
- **Micro-Defensive**: 150 tools (dormant, SPA-protected) including input validation, integrity monitoring, encryption, self-attack wall (25 titanium guards)
- **Self-Attack Wall**: 25 titanium-strength guard modules preventing self-injection, self-exfiltration, self-privilege-escalation, self-modification, self-communication, self-DDoS, self-resource-exhaustion, self-memory-corruption, self-config-tampering, self-credential-theft, unsafe deserialization, self-path-traversal, self-race-conditions, logic bombs, self-backdoors, crypto-downgrade, log injection, dependency confusion, prototype pollution, replay attacks, supply chain attacks, encoding/unicode bypass, model extraction, adversarial inputs
- **Sensors**: 8 radar + 8 sonar + 6 LiDAR + 5 acoustic + 4 EW = 31 sensor types
- **Weapons**: 80+ profiles (handguns, rifles, shotguns, SMGs, LMGs, snipers, explosives, directed energy, missiles, non-lethal, cyber-kinetic)
- **Martial Arts**: 25 styles (striking, grappling, traditional, weapons, hybrid)
- **VIP Protection**: DJI Tello drones, Meshtastic swarm, autonomous vehicle MPC, Garmin/watch BLE, biometric access, LPR gates, remote lockdown, CCTV AI
- **Expert Council**: 12 specialist domains with council-of-expert-expertise decision fusion
- **Potentials**: 300+ capabilities engine

## Security Model

All subsystems are dormant by default (replicas: 0). Each requires SPA (Single Packet Authorization) with HMAC-SHA256 to activate. Subsystems operate on isolated bridge networks:
- Forensic: 172.31.0.0/16
- Offensive: 172.30.0.0/16
- Defensive: 172.32.0.0/16
- Micro-Defensive: 172.34.0.0/16
- Sensors: 172.33.0.0/16
- VIP: 172.35.0.0/16

## Quick Start

```bash
# 1. Edit ALL .env files with strong secrets
# 2. Deploy core
./deploy.sh

# 3. Activate individual subsystems as needed
./activate_sensors.sh
./activate_forensic.sh
./activate_offensive.sh
./activate_defensive.sh
./activate_micro_defensive.sh
./activate_vip.sh

# 4. Deploy individual tools
./deploy_forensic_tool.sh andriller
./deploy_offensive_tool.sh nmap

# 5. Check status
make status
```

## All Audit Bugs Fixed (v9 Audit)

1. Added missing Dockerfile
2. Added missing prometheus.yml
3. Fixed duplicate networks key in ironsight
4. Fixed SPA signature mismatch (now includes ::{} for service+params)
5. Added missing requirements.txt
6. Added missing activate_offensive.sh
7. Fixed password verification (bcrypt in requirements)
8. Fixed datetime.utcnow() deprecation (uses datetime.now(timezone.utc))
9. Fixed docker compose down <service> syntax (now stop + rm -f)
10. Expanded SPA window from 60s to 300s

## Ports

| Service | Port |
|---------|------|
| BABIRYE API | 8000 |
| Grafana | 3000 |
| IRONSIGHT | 9200 |
| OpenThreat | 8100 |
| Mini-Shodan | 8200 |
| Prometheus | 9090 |
| Temporal UI | 8080 |
| Forensic Gateway | 4748 |
| Offensive Gateway | 4747 |
| Defensive Gateway | 4749 |
| Micro-Defensive Gateway | 4750 |
| Sensors Orchestrator | 9901 |
| VIP Gateway | 4751 |

## Constitution Files

Each subsystem has a constitution defining rules of engagement, authorization, and constraints:
- BABIRYE_Constitution.md (core rules)
- Forensic_Constitution.md
- Offensive_Constitution.md
- Defensive_Constitution.md
- Micro_Defensive_Constitution.md
- Sensors_Constitution.md
- VIP_Constitution.md

## License

MIT - for authorized use only.
""")
w("```")
w("---"); w()
si += 1

# ═══ 33-38. CONSTITUTIONS ═══
constitutions = [
    ("BABIRYE_Constitution.md", "BABIRYE Core Constitution",
"""# BABIRYE Core Constitution

## Truth Management
- Source reliability tiers: Tier 1 (official/verified) > Tier 2 (corroborated) > Tier 3 (LLM-generated)
- All sources receive confidence scores from 0.0 to 1.0
- Higher confidence wins on conflicts; ties escalated to Expert Council
- Expert Council provides final arbitration using council-of-expert-expertise fusion
- All truth claims tagged with source, timestamp, confidence, and verification status

## Memory Authority
- Conflict resolution: higher confidence score wins
- Memory TTL: 30 days (real-time data), 90 days (event logs), 365 days (knowledge base), permanent (core identity)
- Memory pruning follows LRU with priority overrides
- No memory deletion without audit trail

## Autonomy Levels
- Level 1 (Research): Always permitted - read, search, analyze
- Level 2 (Memory): Permitted with logging - write to memory stores
- Level 3 (Tool Execution): Requires policy check - execute external tools
- Level 4 (High-Risk): Requires human approval - destructive actions, system changes
- Level 5 (Critical): Requires multi-factor human authorization - weapon deployment, data destruction

## Privacy
- All data stays local by default
- No cloud upload without explicit consent
- PII automatically redacted from logs and exports
- Data retention policies enforced automatically

## Safety
- Maximum 3 retries before human review
- Exponential backoff on rate limits (1s, 2s, 4s)
- All errors logged with full context
- Critical errors immediately escalate to human operators
- Circuit breakers prevent cascade failures

## Self-Attack Wall
- 25 titanium-strength guard modules protect against self-compromise
- Every internal action passes through the wall before execution
- Guards operate in parallel for maximum coverage
- Failed guard checks immediately logged, blocked, and escalated

## Expert Council
- 12 specialist domains: Threat Intelligence, Digital Forensics, Offensive Security, Defensive Operations, Cryptography, Network Architecture, Physical Security, Legal/Compliance, OSINT, Malware Analysis, Vulnerability Research, Incident Response
- Council consensus required for high-impact decisions (threshold: 8/12 agreement)
- Individual experts can veto if their domain is directly affected
- Council decisions logged with full rationale and dissenting opinions"""),
    ("Forensic_Constitution.md", "Forensic Subsystem Constitution",
"""# Forensic Subsystem Constitution

## Authorization
- All forensic acquisitions require explicit consent or documented legal authority
- Tools are dormant by default; activated only via SPA with HMAC-SHA256 authentication
- Every acquisition logged in tamper-evident blockchain-hash audit chain
- No forensic action without authenticated, time-stamped authorization record

## Evidence Handling
- Chain-of-custody maintained via SHA-256 hash audit logs
- Data extracted stored in AES-256 encrypted volumes
- Hash-verified integrity (SHA-256 + SHA-512 dual verification) for all forensic images
- Evidence write-once: no modification after acquisition without supervisor override
- All evidence transfers logged with checksums

## Scope
- Android forensics: Andriller, LockKnife, IBEX
- iOS forensics: MVT, custom extraction pipeline
- Computer forensics: Volatility, SleuthKit, Scalpel, Foremost, Log2Timeline
- Network forensics: full PCAP analysis, DNS reconstruction, TLS decryption
- Memory forensics: live RAM analysis, hibernation files, crash dumps
- Advanced: timeline reconstruction, registry analysis, artifact carving

## Destruction
- All forensic data cryptographically wiped on subsystem deactivation
- Wipe verification with multi-pass validation
- Destruction certificate generated and logged

## Network Isolation
- Forensic network fully isolated on 172.31.0.0/16 (internal bridge, no external access)
- Gateway on port 4748 handles SPA verification and individual tool deployment"""),
    ("Offensive_Constitution.md", "Offensive Subsystem Constitution",
"""# Offensive Subsystem Constitution

## Authorization
- Offensive tools dormant by default; SPA password required for activation
- All operations require documented authorization (scope, duration, targets)
- No offensive action without verified, time-stamped authorization
- Authorization expires after defined engagement window

## Rules of Engagement
- Scope defined and approved before any engagement begins
- No lateral movement beyond authorized scope boundaries
- All actions logged with full audit trail (timestamp, action, target, result)
- Pivot points require additional authorization
- No persistence mechanisms beyond engagement duration without approval

## Tool Categories (72 total)
- Original 22: RedAmoN, PentestAI, Empire, Sliver, Covenant, Mythic, Freeze, ShhhLoader, Donut, Pezor, ScareCrow, Crimson-Wisp, Cable, PowerSploit, OffSec-Tools, AutoPentest, Legion, RedPi, zer0dayslater, Chimera-C2, Agent-P2P, GhostHID
- New 50: Metasploit, Nmap, Nikto, SQLMap, Hydra, John, Aircrack-ng, Wifite, Responder, Mimikatz, BloodHound, CrackMapExec, Ligolo-ng, Chisel, DNSCat2, Nishang, Inveigh, BetterCAP, Ettercap, TShark, Impacket, Rubeus, Gobuster, Feroxbuster, WFuzz, Arjun, Subfinder, Amass, HTTPX, Nuclei, Auto-Recon, LinPEAS, WinPEAS, Linux-Exploit-Suggester, KeePwn, Laudanum, PHPSploit, Commix, XSStrike, Tplmap, WhatWeb, WPScan, Joomscan, Droopescan, Recon-ng, SpiderFoot, theHarvester, Maltego, Fierce

## Containment
- Offensive network fully isolated on 172.30.0.0/16 (internal bridge)
- No outbound connections from offensive containers
- Gateway on port 4747 with SPA verification"""),
    ("Defensive_Constitution.md", "Defensive Subsystem Constitution",
"""# Defensive Subsystem Constitution

## Defense in Depth
- 100 defensive tools spanning 6 layers: network, endpoint, application, identity, data, cloud
- Multiple overlapping detection and prevention layers at each tier
- Zero-trust architecture by default: verify every request regardless of origin
- Automated threat correlation across all defensive tools

## Tool Distribution (100 total)
- Network Defense (20): Snort, Suricata, Zeek, Wazuh, OSSEC, Fail2Ban, CrowdSec, Security Onion, Moloch, Arkime, Sagan, Greenbone, OpenVAS, ntopng, Velociraptor, Graylog, ELK Stack, Splunk, Alerta, Pi-hole
- Endpoint Defense (15): ClamAV, RKHunter, ChkRootkit, Lynis, Osquery, Sysmon, Falco, Auditd, AIDE, Tripwire, Samhain, GRR, Wazuh Agent, OSSEC Agent, OSDVM
- Application Defense (15): ModSecurity, Coraza WAF, OpenResty, OAuth2 Proxy, Keycloak, Dex, Pomerium, Traefik, Envoy, Vault, OPA, Kyverno, Trivy, Checkov, tfsec
- Identity Defense (15): Duo, PrivacyIDEA, Authelia, Kanidm, LLDAP, FusionAuth, Authentik, SuperTokens, Logto, cert-manager, Step CA, SPIRE, Consul Template, Tailscale, Nebula
- Data Defense (15): MinIO, Restic, BorgBackup, SOPS, age, GPG, WireGuard, Headscale, Firezone, Cloudflared, AdGuard, CanaryTokens, Honeytrap, Cowrie, Dionaea
- Cloud Defense (10): Kubesec, kube-bench, kube-hunter, Dockle, Clair, Grype, YARA, Sigma, STIX, MITRE ATT&CK
- Threat Intel (5): OpenCTI, MISP, CRITs, VulnWhisperer, MITRE ATT&CK Navigator

## Response Protocol
- Automated detection and alerting for all events
- Severity-based escalation: Low (log), Medium (alert), High (page), Critical (wake human)
- Escalation to Expert Council for critical events
- Automated response playbooks for common attack patterns

## Isolation
- Defensive network fully isolated on 172.32.0.0/16 (internal bridge)
- Gateway on port 4749 with SPA verification"""),
    ("Micro_Defensive_Constitution.md", "Micro-Defensive Subsystem Constitution",
"""# Micro-Defensive Subsystem Constitution

## Micro-Defense Philosophy
- 150 micro-defensive tools provide granular, focused protection
- Each tool addresses a specific, narrow threat vector
- Tools compose into defense-in-depth chains
- Micro-defense operates at the function/input level, not system level

## Tool Distribution (150 total)
- Input Validation (20): HTML sanitizer, SQL sanitizer, XSS filter, cmd injection guard, path traversal guard, LDAP injection guard, XML sanitizer, header injection guard, CRLF injection guard, SSTI guard, JWT validator, CSP enforcer, CORS guard, rate limiter, brute force guard, CSRF guard, idempotency guard, payload size guard, schema validator, regex validator
- Integrity Monitoring (20): File hash monitor, config drift detector, process monitor, network flow monitor, DNS monitor, certificate monitor, user activity monitor, priv-esc monitor, login anomaly detector, file access monitor, registry monitor, service monitor, port monitor, cron monitor, kernel module monitor, Docker event monitor, API call auditor, session monitor, container image scanner, dependency scanner
- Encryption (20): AES-256 guard, RSA-4096 guard, TLS 1.3 enforcer, cert pinning guard, key derivation guard, secret scanner, env var encryptor, backup encryptor, DB column encryptor, file encryptor, disk encryptor, email encryptor, chat encryptor, API payload encryptor, cookie encryptor, token encryptor, password hasher (bcrypt), HSM interface, key wrap guard, entropy checker
- Network Micro-Defense (20): SYN flood guard, UDP flood guard, ICMP guard, port scan detector, DNS exfil detector, covert channel detector, tunnel detector, beaconing detector, C2 detector, data exfil monitor, geo-fence enforcer, IP reputation checker, ASN checker, TLS downgrade detector, cert chain validator, OCSP checker, SCT validator, DNSSEC validator, DoH/DoT enforcer, QUIC validator
- Container/Cloud Micro (20): image vuln scanner, secret in image scanner, privileged container detector, root container detector, host PID detector, network mode detector, volume mount auditor, capability auditor, seccomp auditor, apparmor auditor, K8s RBAC auditor, service account auditor, network policy auditor, pod security auditor, resource quota auditor, image signature verifier, admission controller, config map scanner, secret scanner, cloud metadata guard
- Self-Attack Wall (25): self-injection guard, self-exfiltration guard, self-privilege-esc guard, self-modification guard, self-communication guard, self-DDoS guard, self-resource-exhaustion guard, self-memory-corruption guard, self-config-tampering guard, self-credential-theft guard, unsafe-deserialization guard, self-path-traversal guard, self-race-condition guard, logic-bomb guard, self-backdoor guard, crypto-downgrade guard, log-injection guard, dependency-confusion guard, prototype-pollution guard, replay-attack guard, supply-chain-attack guard, encoding-unicode-bypass guard, model-extraction guard, adversarial-input guard, self-replication guard
- Advanced Analytics (25): anomaly detector, behavioral baseliner, UEBA engine, threat hunter, ML classifier, graph analyzer, timeline builder, correlation engine, enrichment engine, scoring engine, risk calculator, attack path analyzer, blast radius calculator, impact assessor, priority ranker, auto-triage engine, false-positive reducer, alert deduplicator, noise filter, signal amplifier, context enricher, MITRE mapper, TTP matcher, IOC matcher, campaign tracker

## Self-Attack Wall (25 Titanium-Strength Guards)
- Every internal API call and agent action passes through the wall before execution
- Guards operate in parallel for maximum coverage
- Failed guard checks immediately block the action, log the attempt, and escalate
- Wall is non-bypassable: no admin override, no debug mode, no backdoor
- Each guard has independent state and cannot be disabled by other guards

## Isolation
- Micro-defensive network fully isolated on 172.34.0.0/16 (internal bridge)
- Gateway on port 4750 with SPA verification"""),
    ("Sensors_Constitution.md", "Sensors, Weapons & VIP Protection Constitution",
"""# Sensors, Weapons & VIP Protection Constitution

## Sensor Operations
- 31 sensor types: 8 radar + 8 sonar + 6 LiDAR + 5 acoustic + 4 EW
- Passive sensor modes preferred; active modes require authorization
- Sensor data fused in real-time using Kalman filtering and Bayesian fusion
- All sensor feeds logged with timestamps for forensic reconstruction

## Weapons (80+ Profiles)
- Categories: handguns (12), rifles (12), shotguns (8), SMGs (8), LMGs (6), sniper systems (8), explosives (10), directed energy (6), missiles (4), non-lethal (8), cyber-kinetic (4)
- Lethal force requires EXPLICIT human authorization - no exceptions
- Non-lethal options preferred when tactically viable
- All weapon actuations logged with full context (target, authorization chain, outcome)
- Weapon safety interlocks enforced at hardware and software levels

## Martial Arts (25 Styles)
- Striking (8): Boxing, Muay Thai, Kyokushin Karate, Taekwondo, Savate, Lethwei, Sanda, Kickboxing
- Grappling (6): Brazilian Jiu-Jitsu, Wrestling, Judo, Sambo, Catch Wrestling, Aikido
- Traditional (5): Kung Fu (Wing Chun, Shaolin), Tai Chi, Krav Maga, Ninjutsu, Capoeira
- Weapons (3): Kendo, Eskrima, Fencing
- Hybrid (3): MMA, Systema, Jeet Kune Do
- For analysis, threat assessment, and training recommendation only

## VIP Protection
- Drone operations: human-in-the-loop required for all weapons
- Vehicle control: safety interlocks mandatory, emergency stop always available
- Wearable alerts: for VIP awareness only, not autonomous response
- Access control: all decisions logged and reviewable
- Biometric data encrypted at rest and in transit

## Prohibited Actions
- NO autonomous lethal engagement under any circumstances
- NO weapon deployment without verified legal authority
- NO VIP location data shared outside authorized channels
- NO drone surveillance of protected areas without court order
- NO vehicle control overrides without dual authorization
""")
]

for cname, ctitle, ccontent in constitutions:
    w(f"## {si}. constitution/{cname}")
    w("```markdown")
    w(f"# {ctitle}\n")
    w(ccontent)
    w("```")
    w("---"); w()
    si += 1

F.close()
print(f"Part 4a done. Next file index: {si}")