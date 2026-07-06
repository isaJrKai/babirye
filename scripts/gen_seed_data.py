"""
BABIRYE v10.0.0 — Comprehensive Seed Data Generator
Generates a TypeScript seed file with ALL production data.
"""
import json

def gen_potentials():
    potentials = []
    data = {
        "offensive": [
            ("network_intrusion", "Network intrusion capabilities for penetrating target network perimeters through identified vulnerabilities in firewalls, routers, and boundary defenses.", "advanced", "high", ["network", "intrusion", "pentest", "exploit"]),
            ("vulnerability_exploitation", "Exploitation of identified vulnerabilities in target systems using custom and public exploit code, with emphasis on reliability and stealth.", "advanced", "critical", ["exploit", "vuln", "0day", "pentest"]),
            ("privilege_escalation", "Vertical and horizontal privilege escalation on compromised systems using kernel exploits, misconfigurations, and token impersonation techniques.", "expert", "critical", ["privesc", "root", "admin", "escalation"]),
            ("lateral_movement", "Movement across network segments using pass-the-hash, WMI, PsExec, RDP, and other lateral movement techniques while minimizing detection.", "advanced", "high", ["lateral", "movement", "network", "persistence"]),
            ("data_exfiltration", "Controlled exfiltration of target data using encrypted channels, DNS tunneling, and steganographic techniques to avoid DLP systems.", "expert", "critical", ["exfil", "data", "theft", "stealth"]),
            ("persistence_mechanism", "Establishment of persistent access through backdoors, scheduled tasks, registry modifications, and service creation for long-term operations.", "advanced", "high", ["persistence", "backdoor", "survival", "access"]),
            ("command_control_setup", "Deployment and configuration of command and control infrastructure using encrypted channels, domain fronting, and peer-to-peer mesh networks.", "expert", "critical", ["c2", "command", "control", "beacon"]),
            ("payload_delivery", "Creation and delivery of customized payloads using various encoding, encryption, and obfuscation techniques to evade endpoint detection.", "advanced", "high", ["payload", "malware", "delivery", "evasion"]),
            ("social_engineering_campaign", "Planning and execution of multi-phase social engineering campaigns including spear phishing, pretexting, and baiting against target organizations.", "intermediate", "high", ["social", "phishing", "pretext", "human"]),
            ("wireless_attack", "Exploitation of wireless networks and protocols including WiFi, Bluetooth, and RFID through injection, jamming, and rogue access point deployment.", "advanced", "high", ["wireless", "wifi", "bluetooth", "rfid"]),
            ("hardware_implant", "Deployment and management of hardware-based implants for persistent physical access including USB devices, network taps, and modified peripherals.", "expert", "critical", ["hardware", "implant", "physical", "usb"]),
            ("supply_chain_compromise", "Identification and exploitation of supply chain vulnerabilities including compromised software updates, dependencies, and hardware components.", "expert", "critical", ["supply", "chain", "dependency", "vendor"]),
            ("zero_day_exploitation", "Discovery, development, and deployment of zero-day exploits targeting previously unknown vulnerabilities in critical software and systems.", "expert", "critical", ["0day", "zero", "novel", "unknown"]),
            ("credential_harvesting", "Systematic collection of credentials through phishing sites, keylogging, memory scraping, and credential dumping from authentication stores.", "advanced", "high", ["credential", "password", "harvest", "dump"]),
            ("session_hijacking", "Interception and takeover of active user sessions through token theft, man-in-the-middle attacks, and session fixation techniques.", "advanced", "high", ["session", "hijack", "token", "cookie"]),
            ("dns_poisoning", "Manipulation of DNS resolution through cache poisoning, DNS spoofing, and rogue DNS server deployment to redirect traffic.", "intermediate", "high", ["dns", "poison", "spoof", "redirect"]),
            ("mitm_attack", "Man-in-the-middle interception of network communications through ARP spoofing, rogue certificates, and SSL stripping.", "advanced", "high", ["mitm", "intercept", "proxy", "ssl"]),
            ("brute_force_attack", "Automated credential guessing attacks using dictionary, hybrid, and rule-based techniques with distributed execution and rate limit evasion.", "intermediate", "medium", ["brute", "force", "password", "guess"]),
            ("pass_the_hash", "Authentication using captured NTLM hashes without cracking, enabling lateral movement without knowing plaintext passwords.", "advanced", "high", ["pth", "hash", "ntlm", "authentication"]),
            ("ransomware_deployment", "Deployment of ransomware payloads for offensive operations with configurable encryption, target selection, and demand delivery mechanisms.", "expert", "critical", ["ransomware", "encrypt", "destructive", "offensive"]),
        ],
        "defensive": [
            ("intrusion_detection", "Real-time network intrusion detection using signature-based and anomaly-based analysis of traffic patterns, protocol behavior, and payload content.", "intermediate", "high", ["ids", "detection", "network", "monitor"]),
            ("intrusion_prevention", "Active intrusion prevention through automated blocking of detected threats, integrating with firewall rules and endpoint responses.", "advanced", "high", ["ips", "prevention", "block", "automated"]),
            ("firewall_configuration", "Design and deployment of stateful firewall rulesets including zone-based policies, application-layer filtering, and geo-IP blocking.", "intermediate", "high", ["firewall", "rules", "policy", "network"]),
            ("ids_tuning", "Optimization of intrusion detection systems through signature tuning, threshold adjustment, and false positive reduction to improve detection accuracy.", "advanced", "medium", ["ids", "tuning", "false_positive", "optimize"]),
            ("network_segmentation", "Implementation of network segmentation using VLANs, micro-segmentation, and zero-trust principles to limit lateral movement.", "intermediate", "high", ["segmentation", "vlan", "zero_trust", "isolation"]),
            ("endpoint_detection", "Deployment of endpoint detection and response solutions with behavioral analysis, file integrity monitoring, and process auditing.", "intermediate", "high", ["edr", "endpoint", "agent", "behavioral"]),
            ("behavioral_analysis", "Machine learning-based behavioral analysis of user and entity activity to detect anomalous patterns indicating compromise or insider threats.", "advanced", "high", ["behavioral", "ml", "anomaly", "ueba"]),
            ("threat_hunting", "Proactive threat hunting using hypothesis-driven investigations, IOC matching, and advanced telemetry analysis to find hidden threats.", "advanced", "high", ["hunting", "proactive", "ioc", "investigation"]),
            ("incident_response", "Coordinated incident response including triage, containment, eradication, recovery, and post-incident analysis following established playbooks.", "advanced", "critical", ["ir", "response", "triage", "containment"]),
            ("malware_analysis", "Static and dynamic malware analysis in sandboxed environments including behavior monitoring, API call tracing, and network traffic analysis.", "advanced", "high", ["malware", "analysis", "sandbox", "reverse"]),
            ("sandbox_analysis", "Automated sandbox analysis of suspicious files and URLs with behavioral monitoring, screenshot capture, and IOC extraction.", "intermediate", "high", ["sandbox", "automated", "analysis", "file"]),
            ("memory_forensics", "Acquisition and analysis of volatile memory to identify running processes, injected code, network connections, and encryption keys.", "expert", "high", ["memory", "ram", "volatile", "forensics"]),
            ("log_analysis", "Comprehensive log analysis across infrastructure including authentication events, system logs, application logs, and security event correlation.", "intermediate", "medium", ["log", "siem", "correlation", "event"]),
            ("siem_configuration", "Configuration and optimization of SIEM platforms including log source integration, correlation rules, alert tuning, and dashboard creation.", "advanced", "medium", ["siem", "configuration", "correlation", "dashboard"]),
            ("alert_triage", "Systematic alert triage and investigation including severity assessment, false positive identification, and escalation procedures.", "intermediate", "medium", ["alert", "triage", "investigate", "priority"]),
            ("vulnerability_scanning", "Automated vulnerability scanning of infrastructure including network devices, web applications, databases, and cloud configurations.", "intermediate", "high", ["vuln", "scan", "assessment", "patch"]),
            ("penetration_testing", "Authorized penetration testing of systems and networks to identify exploitable vulnerabilities before malicious actors can leverage them.", "expert", "high", ["pentest", "authorized", "exploit", "test"]),
            ("compliance_checking", "Automated compliance verification against frameworks including NIST, CIS, PCI-DSS, HIPAA, and SOC 2 with gap analysis.", "intermediate", "medium", ["compliance", "policy", "audit", "framework"]),
            ("hardening_script", "Automated system hardening including OS configuration, service disabling, patch management, and security baseline enforcement.", "intermediate", "high", ["harden", "baseline", "configure", "secure"]),
            ("data_loss_prevention", "Deployment of DLP solutions to monitor, detect, and prevent unauthorized data exfiltration through network, endpoint, and cloud channels.", "advanced", "high", ["dlp", "exfil", "prevent", "monitor"]),
        ],
        "forensic": [
            ("disk_imaging", "Forensic disk imaging using write-blockers and verified hashing to create bit-for-bit copies of storage media for analysis.", "intermediate", "high", ["disk", "image", "acquisition", "evidence"]),
            ("memory_dump", "Acquisition of volatile memory from running systems using specialized tools while maintaining forensic integrity and chain of custody.", "advanced", "high", ["memory", "ram", "volatile", "dump"]),
            ("registry_analysis", "Analysis of Windows registry hives to extract evidence of user activity, installed software, persistent mechanisms, and system configuration.", "advanced", "high", ["registry", "windows", "artifact", "timeline"]),
            ("event_log_analysis", "Parsing and analysis of Windows event logs, Linux system logs, and application logs to reconstruct security-relevant timelines.", "intermediate", "high", ["event", "log", "windows", "timeline"]),
            ("file_carving", "Recovery of deleted and fragmented files from disk images using header/footer signatures and carving algorithms.", "advanced", "medium", ["carving", "recovery", "deleted", "file"]),
            ("timeline_analysis", "Creation of comprehensive timelines from multiple forensic artifacts to reconstruct the sequence of events during an incident.", "intermediate", "high", ["timeline", "sequence", "reconstruct", "artifact"]),
            ("network_capture", "Full packet capture and analysis of network traffic for forensic investigation of network-based attacks and data exfiltration.", "intermediate", "high", ["pcap", "network", "capture", "packet"]),
            ("packet_analysis", "Deep packet inspection and protocol analysis to reconstruct network sessions, extract files, and identify malicious communications.", "advanced", "high", ["packet", "protocol", "reconstruct", "network"]),
            ("mobile_acquisition", "Physical and logical acquisition of mobile devices including smartphones and tablets with full file system extraction.", "advanced", "high", ["mobile", "phone", "acquisition", "device"]),
            ("android_forensics", "Specialized forensic analysis of Android devices including app data extraction, database parsing, and location history recovery.", "advanced", "high", ["android", "mobile", "forensics", "extraction"]),
            ("ios_forensics", "Forensic analysis of iOS devices including backup extraction, keychain decryption, and app sandbox analysis.", "expert", "high", ["ios", "apple", "iphone", "forensics"]),
            ("malware_triage", "Rapid malware triage to determine capabilities, persistence mechanisms, and network communications of suspicious binaries.", "advanced", "high", ["malware", "triage", "analysis", "capability"]),
            ("evidence_preservation", "Proper evidence preservation following forensic best practices including hashing, documentation, and chain of custody maintenance.", "beginner", "high", ["evidence", "preserve", "chain", "custody"]),
            ("hash_verification", "Cryptographic hash verification of forensic evidence using MD5, SHA-1, and SHA-256 to ensure data integrity.", "beginner", "medium", ["hash", "verify", "integrity", "sha256"]),
            ("deleted_file_recovery", "Recovery of deleted files from file systems including NTFS, FAT32, ext4, and APFS using filesystem analysis techniques.", "intermediate", "medium", ["deleted", "recovery", "filesystem", "undelete"]),
        ],
        "intelligence": [
            ("osint_collection", "Systematic open source intelligence collection from public sources including social media, public records, and online publications.", "intermediate", "high", ["osint", "public", "recon", "intelligence"]),
            ("dark_web_monitoring", "Continuous monitoring of dark web marketplaces, forums, and paste sites for leaked credentials, company data, and threat discussions.", "advanced", "high", ["dark_web", "tor", "monitor", "leak"]),
            ("social_media_monitoring", "Monitoring of social media platforms for threat indicators, brand mentions, and geopolitical intelligence relevant to security operations.", "intermediate", "medium", ["social", "media", "monitor", "sentiment"]),
            ("domain_monitoring", "Continuous monitoring of domain registrations, DNS changes, and SSL certificate issuance related to target organizations.", "intermediate", "medium", ["domain", "dns", "ssl", "monitor"]),
            ("ip_reputation_check", "Real-time IP address reputation checking against multiple threat intelligence feeds and blocklists for rapid threat assessment.", "beginner", "medium", ["ip", "reputation", "threat", "blocklist"]),
            ("subdomain_discovery", "Automated discovery of subdomains associated with target domains using DNS enumeration, certificate transparency, and brute force techniques.", "intermediate", "medium", ["subdomain", "dns", "enumerate", "discovery"]),
            ("port_scanning", "Comprehensive port scanning of target networks to identify open services, running versions, and potential attack surfaces.", "beginner", "medium", ["port", "scan", "service", "enumerate"]),
            ("service_fingerprinting", "Accurate identification of running services and versions through banner grabbing, probe responses, and behavioral analysis.", "intermediate", "medium", ["fingerprint", "service", "version", "identify"]),
            ("technology_detection", "Detection of web technologies, frameworks, CMS platforms, and JavaScript libraries used by target web applications.", "beginner", "low", ["tech", "detect", "web", "framework"]),
            ("email_harvesting", "Collection of email addresses associated with target organizations using search engines, social media, and public documents.", "intermediate", "medium", ["email", "harvest", "collect", "recon"]),
            ("credential_monitoring", "Monitoring of breached credential databases and paste sites for compromised accounts associated with target organizations.", "intermediate", "high", ["credential", "breach", "leak", "monitor"]),
            ("threat_actor_tracking", "Tracking of known threat actors and APT groups including TTPs, infrastructure, and campaign attribution.", "expert", "high", ["apt", "actor", "tracking", "attribution"]),
            ("apt_tracking", "Advanced Persistent Threat group tracking including infrastructure mapping, malware analysis, and campaign correlation.", "expert", "high", ["apt", "persistent", "campaign", "threat"]),
            ("ioc_extraction", "Automated extraction of Indicators of Compromise from threat reports, malware samples, and network traffic.", "intermediate", "high", ["ioc", "extract", "indicator", "automated"]),
            ("vulnerability_intelligence", "Continuous monitoring of vulnerability disclosures, CVSS scoring, and exploit availability for the enterprise attack surface.", "intermediate", "high", ["vuln", "cve", "exploit", "intelligence"]),
        ],
        "vip": [
            ("drone_surveillance", "Aerial surveillance operations using multi-rotor and fixed-wing drones equipped with EO/IR cameras for perimeter security and threat detection.", "advanced", "high", ["drone", "aerial", "surveillance", "camera"]),
            ("drone_perimeter_patrol", "Automated perimeter patrol using pre-programmed flight routes with real-time video feed and anomaly detection capabilities.", "intermediate", "high", ["drone", "perimeter", "patrol", "automated"]),
            ("vehicle_route_optimization", "Real-time route optimization for VIP convoys incorporating threat intelligence, traffic conditions, and alternative route planning.", "intermediate", "medium", ["vehicle", "route", "optimize", "convoy"]),
            ("wearable_health_monitoring", "Continuous biometric monitoring through wearable devices tracking heart rate, blood pressure, temperature, and stress indicators.", "intermediate", "medium", ["wearable", "health", "biometric", "monitor"]),
            ("biometric_access_control", "Multi-factor biometric access control using fingerprint, facial recognition, iris scanning, and behavioral biometrics for secure facility entry.", "advanced", "high", ["biometric", "access", "fingerprint", "facial"]),
            ("facial_recognition", "Real-time facial recognition integrated with CCTV systems for VIP identification, stranger detection, and watchlist alerting.", "advanced", "high", ["facial", "recognition", "cctv", "identify"]),
            ("lpr_system", "License plate recognition system for vehicle tracking, access control, and automated VIP vehicle identification at checkpoints.", "intermediate", "medium", ["lpr", "plate", "vehicle", "anpr"]),
            ("cctv_ai_analysis", "AI-powered CCTV analysis for crowd detection, loitering alerts, abandoned object identification, and behavioral anomaly detection.", "advanced", "high", ["cctv", "ai", "video", "analytics"]),
            ("perimeter_intrusion_detection", "Multi-layer perimeter intrusion detection combining ground sensors, thermal cameras, and microwave barriers for comprehensive coverage.", "intermediate", "high", ["perimeter", "intrusion", "sensor", "detect"]),
            ("secure_communications", "End-to-end encrypted communications for VIP protection teams using secure voice, messaging, and video conferencing systems.", "advanced", "critical", ["comms", "encrypt", "secure", "voice"]),
        ],
        "cyber_kinetic": [
            ("scada_exploitation", "Exploitation of SCADA systems and industrial control networks through protocol manipulation, firmware vulnerabilities, and HMI interfaces.", "expert", "critical", ["scada", "ics", "industrial", "exploit"]),
            ("ics_network_discovery", "Discovery and mapping of industrial control system networks including PLCs, RTUs, HMIs, and communication protocols.", "advanced", "high", ["ics", "network", "plc", "discover"]),
            ("plc_manipulation", "Remote manipulation of Programmable Logic Controllers through protocol exploitation including Modbus, DNP3, and OPC UA.", "expert", "critical", ["plc", "modbus", "control", "manipulate"]),
            ("building_systems_control", "Exploitation and defensive hardening of building automation systems including HVAC, lighting, elevators, and access control.", "advanced", "high", ["bms", "hvac", "building", "automate"]),
            ("hvac_manipulation", "Manipulation of HVAC systems for environmental control exploitation or defense, including temperature and airflow attacks.", "intermediate", "high", ["hvac", "temperature", "environment", "control"]),
            ("access_control_bypass", "Techniques for bypassing physical and logical access control systems including card cloning, tailgating detection, and protocol attacks.", "advanced", "high", ["access", "bypass", "physical", "card"]),
            ("gps_spoofing", "GPS spoofing attacks against navigation systems, vehicle tracking, and timing-dependent infrastructure.", "advanced", "high", ["gps", "spoof", "navigation", "timing"]),
            ("drone_hijacking", "Exploitation and hijacking of commercial drone systems through protocol manipulation, GPS spoofing, and RF interference.", "expert", "critical", ["drone", "hijack", "rf", "protocol"]),
            ("medical_device_exploitation", "Security assessment and exploitation of networked medical devices including infusion pumps, pacemakers, and imaging systems.", "expert", "critical", ["medical", "device", "healthcare", "patient"]),
            ("power_grid_attack", "Simulation and defense against cyber attacks on power grid infrastructure including SCADA, substations, and distribution systems.", "expert", "critical", ["power", "grid", "energy", "critical"]),
        ],
        "electronic_warfare": [
            ("sigint_collection", "Signals intelligence collection across radio frequency spectrum for communication intercept and electronic order of battle development.", "expert", "high", ["sigint", "signal", "collect", "intercept"]),
            ("comint_analysis", "Communications intelligence analysis of intercepted voice and data communications for content extraction and network mapping.", "expert", "high", ["comint", "communication", "analyze", "intercept"]),
            ("elint_analysis", "Electronic intelligence analysis of radar and electronic emissions for threat identification and order of battle development.", "expert", "high", ["elint", "radar", "electronic", "emission"]),
            ("communication_jamming", "Targeted communication jamming across VHF/UHF/SATCOM frequency bands to deny adversary command and control capabilities.", "advanced", "high", ["jam", "communication", "deny", "rf"]),
            ("radar_jamming", "Electronic countermeasures against radar systems including noise jamming, deceptive jamming, and DRFM techniques.", "expert", "high", ["radar", "jam", "ecm", "deceptive"]),
            ("gps_denial", "GPS denial operations through jamming and spoofing to disrupt adversary navigation and timing-dependent systems.", "advanced", "high", ["gps", "denial", "jam", "spoof"]),
            ("spectrum_monitoring", "Continuous spectrum monitoring and signal identification across wide frequency ranges for situational awareness and threat detection.", "intermediate", "medium", ["spectrum", "monitor", "signal", "rf"]),
            ("direction_finding", "Radio direction finding and emitter location using triangulation, time difference of arrival, and frequency difference of arrival.", "advanced", "high", ["direction", "find", "locate", "emitter"]),
            ("rf_sweep", "Automated RF spectrum sweeps for signal detection, frequency occupancy analysis, and electromagnetic environment assessment.", "intermediate", "medium", ["rf", "sweep", "spectrum", "scan"]),
            ("emp_simulation", "Simulation and modeling of electromagnetic pulse effects on electronic systems for vulnerability assessment and hardening planning.", "expert", "critical", ["emp", "electromagnetic", "pulse", "effect"]),
        ],
    }
    idx = 0
    for cat, items in data.items():
        for name, desc, diff, impact, tags in items:
            idx += 1
            potentials.append({
                "name": name, "category": cat, "description": desc,
                "difficulty": diff, "impact": impact,
                "requirements": json.dumps([]), "isActive": True,
                "tags": json.dumps(tags)
            })
    return potentials

def gen_offensive_tools():
    tools = []
    categories = {
        "recon": [
            ("nmap", "Network exploration and security auditing tool for host discovery, port scanning, version detection, and OS fingerprinting.", "nmap/nmap:latest", 0),
            ("masscan", "Mass IP port scanner capable of scanning the entire internet in under six minutes, optimized for speed and scale.", "offensive/masscan:latest", 0),
            ("shodan", "Search engine for Internet-connected devices providing real-time intelligence on exposed services and vulnerabilities.", "offensive/shodan:latest", 0),
            ("the_harvester", "OSINT tool for gathering email addresses, subdomains, and host information from public sources.", "offensive/theharvester:latest", 0),
            ("recon_ng", "Full-featured web reconnaissance framework written in Python with modular architecture for automated OSINT collection.", "offensive/recon-ng:latest", 0),
            ("amass", "In-depth attack surface mapping and asset discovery tool integrating DNS, web scraping, and certificate data.", "offensive/amass:latest", 0),
            ("spiderfoot", "Automated OSINT collection platform with over 200 data modules for comprehensive reconnaissance.", "offensive/spiderfoot:latest", 0),
            ("maltego", "Interactive data mining and link analysis tool for visualizing relationships between entities in investigations.", "offensive/maltego:latest", 0),
        ],
        "exploitation": [
            ("metasploit", "Comprehensive penetration testing framework with thousands of exploits, payloads, and auxiliary modules.", "offensive/metasploit:latest", 4444),
            ("sqlmap", "Automated SQL injection and database takeover tool supporting multiple database engines and injection techniques.", "offensive/sqlmap:latest", 0),
            ("burpsuite", "Web application security testing platform with proxy, scanner, and intruder capabilities for HTTP manipulation.", "offensive/burpsuite:latest", 8080),
            ("nuclei", "Fast template-based vulnerability scanner with customizable YAML templates for automated security testing.", "offensive/nuclei:latest", 0),
            ("exploitdb", "Comprehensive archive of public exploits and vulnerable software for security research and testing.", "offensive/exploitdb:latest", 0),
            ("hping3", "TCP/IP packet assembler and analyzer for network auditing, firewall testing, and DOS attack simulation.", "offensive/hping3:latest", 0),
            ("arachni", "Full-featured web application security scanner with support for JavaScript-heavy applications and AJAX.", "offensive/arachni:latest", 0),
            ("wfuzz", "Web application fuzzer for brute forcing parameters, directories, and virtual hosts with multiple injection points.", "offensive/wfuzz:latest", 0),
        ],
        "post_exploitation": [
            ("mimikatz", "Post-exploitation credential extraction tool for Windows systems capable of dumping LSASS memory and Kerberos tickets.", "offensive/mimikatz:latest", 0),
            ("bloodhound", "Active Directory reconnaissance tool using graph theory to identify attack paths and privileged relationships.", "offensive/bloodhound:latest", 7687),
            ("crackmapexec", "Swiss army knife for pentesting Windows/Active Directory environments with SMB, WinRM, and LDAP support.", "offensive/crackmapexec:latest", 0),
            ("impacket", "Python library for network protocol interaction including SMB, Kerberos, and LDAP for post-exploitation.", "offensive/impacket:latest", 0),
            ("rubeus", "C# toolset for raw Kerberos ticket manipulation including pass-the-ticket, golden ticket, and kerberoasting.", "offensive/rubeus:latest", 0),
            ("seatbelt", "C# security audit tool for Windows that performs numerous system checks for privilege escalation opportunities.", "offensive/seatbelt:latest", 0),
            ("powersploit", "PowerShell post-exploitation module collection for reconnaissance, privilege escalation, and persistence.", "offensive/powersploit:latest", 0),
        ],
        "c2": [
            ("cobalt_strike", "Commercial adversary simulation and red team operations platform with advanced beacon and team server capabilities.", "offensive/cobalt-strike:latest", 50050),
            ("sliver", "Open source cross-platform C2 framework with implant generation, peer-to-peer mesh, and malleable C2 profiles.", "offensive/sliver:latest", 31337),
            ("havoc", "Modern post-exploitation C2 framework with advanced capabilities including BOF support and external C2 integration.", "offensive/havoc:latest", 40056),
            ("mythic", "Collaborative C2 platform with extensible agent architecture supporting custom payload development.", "offensive/mythic:latest", 7443),
            ("empire", "Post-exploitation and adversary emulation framework with PowerShell and Python agent capabilities.", "offensive/empire:latest", 1337),
            ("poshc2", "C2 framework written in PowerShell for Windows target environments with proxy-aware communications.", "offensive/poshc2:latest", 8443),
            ("merlin", "Cross-platform post-exploitation HTTP/2 C2 server using gRPC for agent communications.", "offensive/merlin:latest", 443),
        ],
        "persistence": [
            ("covenant", "NET command and control framework with asynchronous communication and dynamic module loading capabilities.", "offensive/covenant:latest", 7443),
            ("sharphound", "Active Directory data collector for BloodHound providing comprehensive domain enumeration and relationship mapping.", "offensive/sharphound:latest", 0),
            ("nltest", "Windows domain trust enumeration tool for identifying domain relationships and trust paths during lateral movement.", "offensive/nltest:latest", 0),
            ("autoruns_sys", "Microsoft Sysinternals tool for viewing and managing auto-start locations on Windows systems for persistence analysis.", "offensive/autoruns:latest", 0),
            ("schtasks", "Windows scheduled task management for creating persistent tasks with SYSTEM-level execution and trigger-based activation.", "offensive/schtasks:latest", 0),
            ("registry_persist", "Windows registry-based persistence mechanisms using Run keys, Services, and AppInit_DLLs for execution on boot.", "offensive/registry-persist:latest", 0),
            ("wmi_persist", "Windows Management Instrumentation persistence using event subscriptions, permanent consumers, and active script events.", "offensive/wmi-persist:latest", 0),
        ],
        "lateral": [
            ("psexec", "Remote execution tool using SMB and Windows administrative shares for lateral movement across Windows networks.", "offensive/psexec:latest", 0),
            ("wmiexec", "Windows remote execution through WMI for lateral movement without creating visible services on target systems.", "offensive/wmiexec:latest", 0),
            ("smbexec", "SMB-based remote command execution using temporary services for stealthy lateral movement across Windows domains.", "offensive/smbexec:latest", 0),
            ("dcomexec", "Distributed COM-based remote execution leveraging Windows Component Object Model for lateral movement.", "offensive/dcomexec:latest", 0),
            ("atexec", "Remote execution through Windows Task Scheduler for time-based lateral movement and persistence.", "offensive/atexec:latest", 0),
            ("sshexec", "SSH-based remote command execution for lateral movement across Linux and Unix environments.", "offensive/sshexec:latest", 0),
            ("rdpexec", "RDP-based remote desktop and command execution for graphical lateral movement across Windows networks.", "offensive/rdpexec:latest", 3389),
        ],
        "payload": [
            ("msfvenom", "Metasploit payload generator supporting multiple output formats, encoders, and encryption for custom payload creation.", "offensive/msfvenom:latest", 0),
            ("veil", "Payload generation framework specializing in Python and C payload creation with built-in encryption and evasion.", "offensive/veil:latest", 0),
            ("hypervisor_packer", "Payload packager using hypervisor-based evasion techniques to hide malicious code from endpoint detection.", "offensive/hypervisor-packer:latest", 0),
            ("shellter", "Dynamic shellcode injection tool for Windows PE files with automatic infection and evasion capabilities.", "offensive/shellter:latest", 0),
            ("avet", "Anti-virus evasion tool for creating executables that bypass common endpoint detection products.", "offensive/avet:latest", 0),
            ("venom", "Payload generation and wrapper tool using multiple encoding techniques including XOR, AES, and custom algorithms.", "offensive/venom:latest", 0),
            ("great_sct", "PowerShell-based payload generation and delivery framework with COM-based execution for evasion.", "offensive/great-sct:latest", 0),
        ],
        "social_engineering": [
            ("gophish", "Open-source phishing toolkit for creating and managing phishing campaigns with real-time campaign tracking.", "offensive/gophish:latest", 3333),
            ("setoolkit", "Social Engineering Toolkit providing vector-based social engineering attacks including phishing and payload delivery.", "offensive/setoolkit:latest", 0),
            ("king_phisher", "Phishing campaign management toolkit with email template designer and campaign analytics dashboard.", "offensive/king-phisher:latest", 0),
            ("evilginx", "Man-in-the-middle phishing framework for bypassing two-factor authentication through reverse proxy techniques.", "offensive/evilginx:latest", 443),
            ("modlishka", "Reverse proxy phishing tool for capturing authentication credentials and session cookies from targeted services.", "offensive/modlishka:latest", 0),
            ("noer", "Phishing framework for creating credential harvesting portals with customizable templates and bypass techniques.", "offensive/noer:latest", 0),
            ("credsniper", "Phishing tool for harvesting credentials through cloned login pages with real-time data capture.", "offensive/credsniper:latest", 0),
        ],
        "wireless": [
            ("aircrack_ng", "Complete suite of wireless network assessment tools for monitoring, attacking, testing, and cracking WiFi networks.", "offensive/aircrack-ng:latest", 0),
            ("wifite", "Automated wireless auditing script for mass WPA/WEP cracking with multiple attack vectors.", "offensive/wifite:latest", 0),
            ("bettercap", "Powerful and easily extensible network attack and monitoring framework with wireless protocol support.", "offensive/bettercap:latest", 8081),
            ("karma", "Wireless access point that responds to all probe requests for rogue AP and evil twin attacks.", "offensive/karma:latest", 0),
            ("hostapd_wpe", "Modified hostapd for conducting WiFi Protected Setup attacks against enterprise wireless networks.", "offensive/hostapd-wpe:latest", 0),
            ("fluxion", "Automated WiFi cracking tool using social engineering and man-in-the-middle techniques for WPA handshakes.", "offensive/fluxion:latest", 0),
            ("reaver", "WPS brute force attack tool for recovering WPA/WPA2 passwords from WiFi access points.", "offensive/reaver:latest", 0),
        ],
        "hardware": [
            ("rubber_ducky", "USB HID attack device that emulates a keyboard for automated payload delivery at superhuman typing speed.", "offensive/rubber-ducky:latest", 0),
            ("bash_bunny", "Multi-function USB attack platform with payload switching, network access, and HID/ethernet/storage modes.", "offensive/bash-bunny:latest", 0),
            ("lan_turtle", "Covert network access and man-in-the-middle tool designed for physical network penetration testing.", "offensive/lan-turtle:latest", 0),
            ("packet_squirrel", "Portable network man-in-the-middle tool for covert packet capture and injection.", "offensive/packet-squirrel:latest", 0),
            ("usb_armory", "Compact USB-powered computer designed for security applications and covert operations.", "offensive/usb-armory:latest", 0),
            ("hackrf", "Software-defined radio peripheral for transmitting and receiving radio signals across a wide frequency range.", "offensive/hackrf:latest", 0),
            ("usrp", "Universal Software Radio Peripheral for advanced RF applications including signal processing and spectrum analysis.", "offensive/usrp:latest", 0),
        ],
    }
    for cat, items in categories.items():
        for name, desc, img, port in items:
            tools.append({
                "name": name.replace("_", " ").title(), "category": cat, "description": desc,
                "version": "10.0.0", "status": "dormant", "containerImage": img,
                "port": port or None, "config": "{}", "riskLevel": "high",
                "requiresAuth": True
            })
    return tools

def gen_defensive_tools():
    tools = []
    data = {
        "network": [
            ("Suricata", "High-performance network IDS/IPS engine with real-time intrusion detection, protocol detection, and file extraction.", "suricata"),
            ("Snort", "Open-source network intrusion prevention system combining signature, protocol, and anomaly-based inspection.", "snort"),
            ("Zeek", "Powerful network analysis framework for deep packet inspection and network security monitoring.", "zeek"),
            ("OSSEC", "Open-source host-based intrusion detection system with log analysis, file integrity monitoring, and rootkit detection.", "ossec"),
            ("Wazuh", "Security analytics platform combining SIEM and XDR capabilities with endpoint detection and compliance monitoring.", "wazuh"),
            ("Fail2Ban", "Intrusion prevention framework that protects servers from brute force attacks by blocking suspicious IP addresses.", "fail2ban"),
            ("CrowdSec", "Collaborative intrusion prevention system using crowd-sourced threat intelligence for IP reputation.", "crowdsec"),
            ("PF Firewall", "OpenBSD packet filter providing stateful inspection and network address translation capabilities.", "pf-firewall"),
            ("IPTables", "Linux kernel-level firewall for packet filtering and network address translation.", "iptables"),
            ("NFTables", "Modern Linux firewall framework replacing iptables with improved performance and expressiveness.", "nftables"),
            ("VPN Gateway", "Centralized VPN gateway providing secure encrypted tunnels for remote access and site-to-site connectivity.", "vpn-gateway"),
            ("WireGuard", "Modern high-performance VPN protocol using state-of-the-art cryptography with minimal codebase.", "wireguard"),
            ("OpenVPN", "Full-featured open-source VPN solution supporting SSL/TLS encryption and multiple authentication methods.", "openvpn"),
            ("ZeroTier", "Software-defined networking platform creating encrypted virtual networks across physical boundaries.", "zerotier"),
            ("Tinc VPN", "Decentralized mesh VPN daemon that creates secure virtual private networks between hosts.", "tinc-vpn"),
        ],
        "endpoint": [
            ("Osquery", "SQL-powered operating system instrumentation framework for endpoint monitoring and threat detection.", "osquery"),
            ("Velociraptor", "Digital forensics and endpoint monitoring tool with fast artifact collection and real-time response.", "velociiraptor"),
            ("LimaCharlie", "Endpoint security platform providing real-time telemetry collection, detection, and response capabilities.", "limacharlie"),
            ("OSSEC Agent", "Host-based agent for the OSSEC HIDS providing log collection, integrity checking, and rootkit detection.", "ossec-agent"),
            ("Sysmon", "Windows system monitoring driver providing detailed process, network, and file system event logging.", "sysmon"),
            ("Autoruns", "Microsoft Sysinternals tool for managing Windows auto-start locations and detecting persistence mechanisms.", "autoruns-sys"),
            ("YARA Engine", "Pattern matching engine for malware research and threat detection using custom rule definitions.", "yara-engine"),
            ("ClamAV", "Open-source antivirus engine for malware detection with signature-based and heuristic scanning.", "clamav"),
            ("Sophos Agent", "Next-generation endpoint protection agent with machine learning and exploit prevention.", "sophos-agent"),
            ("Carbon Black", "Cloud-native endpoint protection platform with real-time visibility and threat detection.", "carbon-black"),
            ("CrowdStrike Falcon", "Cloud-delivered endpoint protection platform combining EDR, threat intelligence, and managed hunting.", "crowdstrike-falcon"),
            ("Sentinel One", "Autonomous AI-powered endpoint protection platform with behavioral AI engine for prevention.", "sentinel-one"),
            ("Defender ATP", "Microsoft Advanced Threat Protection providing unified defense across endpoints, email, and identity.", "defender-atp"),
            ("Cortex XDR", "Palo Alto Networks extended detection and response platform with AI-driven threat analysis.", "cortex-xdr"),
            ("Deep Instinct", "Deep learning-based endpoint protection platform using neural networks for threat prevention.", "deep-instinct"),
        ],
        "application": [
            ("ModSecurity", "Open-source web application firewall embedded in web servers for HTTP traffic inspection and attack blocking.", "modsecurity"),
            ("Coraza WAF", "Cloud-native web application firewall compatible with ModSecurity rules and OWASP Core Rule Set.", "coraza-waf"),
            ("Open AppSec", "Open-source application security platform providing WAF, API security, and bot protection.", "open-appsec"),
            ("JWT Toolkit", "JSON Web Token validation and analysis tool for API authentication security testing.", "jwt-toolkit"),
            ("OAuth2 Proxy", "Reverse proxy providing authentication and authorization via OAuth2 providers for internal applications.", "oauth2-proxy"),
            ("Keycloak Auth", "Open-source identity and access management solution with SSO, OIDC, and SAML support.", "keycloak-auth"),
            ("Authelia", "Single sign-on and two-factor authentication portal for web applications and internal services.", "authelia"),
            ("Traefik Proxy", "Modern HTTP reverse proxy and load balancer with automatic service discovery and TLS termination.", "traefik-proxy"),
            ("Envoy Proxy", "High-performance L4/L7 proxy and communication bus for service mesh and API gateway deployments.", "envoy-proxy"),
            ("Kong Gateway", "Cloud-native API gateway providing authentication, rate limiting, and traffic management.", "kong-gateway"),
            ("Rate Limiter", "Distributed rate limiting middleware protecting APIs from abuse and denial of service attacks.", "rate-limiter-mw"),
            ("CORS Middleware", "Cross-origin resource security middleware enforcing strict CORS policies for web applications.", "cors-middleware"),
            ("CSP Enforcer", "Content Security Policy enforcement engine preventing XSS and code injection attacks.", "csp-enforcer"),
            ("Header Guard", "HTTP security header management tool enforcing best-practice security headers on all responses.", "header-guard"),
        ],
        "identity": [
            ("OpenLDAP", "Open-source LDAP directory server providing centralized authentication and authorization services.", "open-ldap"),
            ("Authentik ID", "Flexible identity provider supporting SAML2, OIDC, and LDAP with flow-based customization.", "authentik-id"),
            ("Dex IDP", "OpenID Connect identity provider with pluggable connectors for enterprise identity systems.", "dex-idp"),
            ("Keycloak ID", "Open-source identity and access management with enterprise SSO, federation, and user management.", "keycloak-id"),
            ("Pomerium", "Zero-trust identity-aware access proxy providing secure access to internal applications.", "pomerium"),
            ("Beyond Identity", "Passwordless identity platform providing device-bound credentials and continuous authentication.", "beyond-identity"),
            ("OATH Keeper", "Time-based one-time password management for multi-factor authentication across enterprise services.", "oath-keeper"),
            ("Hydra IAM", "Cloud-native identity and access management server with OAuth2 and OpenID Connect support.", "hydra-iam"),
            ("Casbin OPA", "Authorization library supporting access control models including RBAC, ABAC, and ACL.", "casbin-opa"),
            ("OPA Engine", "Open Policy Agent providing unified policy enforcement across the stack with Rego policy language.", "opa-engine"),
            ("SPIFFE SPIRE", "Framework for identity issuance and trust establishment in heterogeneous workloads.", "spiffe-spire"),
            ("Spire Server", "Identity provisioning server for SPIFFE standard providing workload attestation and SVID issuance.", "spire-server"),
            ("Vault OIDC", "HashiCorp Vault OIDC provider enabling dynamic secret management with identity federation.", "vault-oidc"),
            ("Cert Manager ID", "Kubernetes certificate management controller automating TLS certificate provisioning and renewal.", "cert-manager-id"),
        ],
        "data": [
            ("HashiCorp Vault", "Secrets management platform providing secure storage, dynamic secrets, encryption as a service, and identity management.", "hashicorp-vault"),
            ("SOPS Enc", "Secrets management tool for encrypting configuration files with support for multiple key services.", "sops-enc"),
            ("Age Encryption", "Simple, modern file encryption tool using state-of-the-art elliptic curve cryptography.", "age-enc"),
            ("GPG Agent", "GNU Privacy Guard agent for managing cryptographic keys and performing encryption operations.", "gpg-agent"),
            ("Cryptomator", "Open-source client-side encryption solution for cloud storage with transparent file encryption.", "cryptomator"),
            ("VeraCrypt", "Free disk encryption software supporting AES, Serpent, and Twofish with plausible deniability.", "veracrypt"),
            ("BitLocker", "Microsoft full-disk encryption feature providing AES-256 encryption for Windows volumes.", "bitlocker"),
            ("LUKS Crypto", "Linux Unified Key Setup for disk encryption providing standard on-disk encryption format.", "luks-crypto"),
            ("TLS Terminator", "TLS termination proxy handling encryption and certificate management for backend services.", "tls-terminator"),
            ("Certbot ACME", "Let's Encrypt certificate management client automating TLS certificate provisioning and renewal.", "certbot-acme"),
            ("Step CA", "Private certificate authority for internal TLS with automatic certificate management.", "step-ca"),
            ("Smallstep CA", "Zero-trust certificate authority providing automated mTLS and SSH certificate management.", "smallstep-ca"),
            ("ZTrust CA", "Internal certificate authority providing X.509 certificate lifecycle management.", "ztrust-ca"),
            ("DLP Engine", "Data loss prevention engine monitoring data flows and enforcing data protection policies.", "dlp-engine"),
        ],
        "cloud": [
            ("Falco", "Cloud-native runtime security tool detecting anomalous activity in containers, Kubernetes, and hosts.", "falco"),
            ("Trivy", "Comprehensive security scanner for containers, Kubernetes, IaC, and dependencies with vulnerability databases.", "trivy"),
            ("Checkov", "Static analysis tool for infrastructure-as-code scanning against security best practices and compliance frameworks.", "checkov"),
            ("Kube Bench", "CIS Kubernetes Benchmark tool for automated security assessment of Kubernetes clusters.", "kube-bench"),
            ("Kube Hunter", "Kubernetes security auditor that hunts for security weaknesses in Kubernetes clusters.", "kube-hunter"),
            ("Gatekeeper", "Kubernetes admission controller enforcing policies using the Open Policy Agent constraint framework.", "gatekeeper"),
            ("Kyverno", "Kubernetes-native policy management engine for validation, mutation, and generation of resources.", "kyverno"),
            ("OPA Gatekeeper", "Kubernetes admission webhook enforcing policies defined in Rego via the Open Policy Agent.", "opa-gatekeeper"),
            ("CloudSploit", "Cloud security posture management tool identifying misconfigurations across AWS, Azure, and GCP.", "cloudsploit"),
            ("Scout Suite", "Multi-cloud security auditing tool providing visibility into security posture and configuration.", "scout-suite"),
            ("Prowler", "AWS security assessment tool implementing CIS benchmarks and additional security checks.", "prowler"),
            ("Pacu", "AWS exploitation framework enabling offensive security testing against cloud environments.", "pacu"),
            ("Cloud Custodian", "Rules engine for managing AWS, Azure, and GCP resources with policy-as-code approach.", "cloud-custodian"),
            ("Wiz Connector", "Cloud security platform connector for agentless vulnerability scanning and IaC scanning.", "wiz-connector"),
        ],
        "micro": [
            ("JSON Validator", "Strict JSON schema validation enforcing structural and type constraints on API inputs.", "json-validator"),
            ("XML Sanitizer", "XML input sanitization preventing XXE injection and billion laughs attacks.", "xml-sanitizer"),
            ("HTML Purifier", "HTML content sanitization removing malicious scripts while preserving safe formatting.", "html-purifier"),
            ("SQL Sanitizer", "SQL query parameterization and sanitization preventing SQL injection attacks.", "sql-sanitizer"),
            ("XSS Filter", "Cross-site scripting filter removing or encoding dangerous HTML/JavaScript content.", "xss-filter"),
            ("CSRF Guard", "Cross-site request forgery protection using synchronized token pattern validation.", "csrf-guard"),
            ("Input Trimmer", "Input length and character set enforcement preventing buffer overflow and injection attacks.", "input-trimmer"),
            ("Unicode Normalizer", "Unicode normalization and homoglyph detection preventing encoding-based bypass attacks.", "unicode-normalizer"),
            ("Path Canonicalizer", "File path canonicalization preventing directory traversal and path confusion attacks.", "path-canonicalizer"),
            ("Command Escaper", "Shell command argument escaping preventing command injection through user input.", "command-escaper"),
            ("LDAP Sanitizer", "LDAP query sanitization preventing LDAP injection and directory traversal attacks.", "ldap-sanitizer"),
            ("Header Sanitizer", "HTTP header value sanitization preventing response splitting and header injection.", "header-sanitizer"),
            ("Cookie Guard", "Cookie attribute enforcement including Secure, HttpOnly, SameSite, and Path validation.", "cookie-guard"),
            ("Query Sanitizer", "URL query parameter validation and sanitization preventing injection through query strings.", "query-sanitizer"),
        ],
    }
    for cat, items in data.items():
        for name, desc, img in items:
            tools.append({
                "name": name, "category": cat, "description": desc,
                "version": "10.0.0", "status": "dormant", "containerImage": f"defensive/{img}:latest",
                "config": "{}", "autoDeploy": False
            })
    return tools

def gen_micro_tools():
    tools = []
    categories = {
        "input_validation": ["sql_injection_guard", "xss_detector", "command_injection_blocker", "path_traversal_guard", "ldap_injection_filter", "xml_injection_guard", "ssti_detector", "template_injection_blocker", "regex_dos_guard", "null_byte_filter", "crlf_injection_guard", "http_response_splitting_guard", "mail_header_injection_guard", "log4j_detector", "date_injection_guard", "number_range_validator", "email_format_guard", "url_validator", "ip_address_validator"],
        "output_encoding": ["html_entity_encoder", "json_encoder", "xml_encoder", "javascript_encoder", "css_encoder", "url_encoder", "base64_encoder", "markdown_sanitizer", "svg_sanitizer", "pdf_sanitizer", "csv_sanitizer", "yaml_encoder", "xml_attr_encoder", "http_header_encoder"],
        "sanitization": ["filename_sanitizer", "user_input_sanitizer", "html_sanitizer", "markdown_sanitizer", "rtf_sanitizer", "csv_sanitizer", "xml_sanitizer", "json_sanitizer", "yaml_sanitizer", "ldap_dn_sanitizer", "sql_query_sanitizer", "os_command_sanitizer", "http_body_sanitizer", "cookie_sanitizer", "header_value_sanitizer", "query_param_sanitizer", "path_component_sanitizer"],
        "integrity": ["hmac_verifier", "digital_signature_verifier", "checksum_validator", "file_integrity_monitor", "config_integrity_guard", "code_signing_verifier", "dependency_hash_checker", "tamper_detection_guard", "runtime_integrity_checker", "memory_integrity_guard", "database_integrity_checker", "api_response_validator", "webhook_signature_verifier", "jwt_validator", "certificate_chain_verifier"],
        "rate_limiting": ["api_rate_limiter", "login_rate_limiter", "password_reset_limiter", "email_rate_limiter", "file_upload_limiter", "search_rate_limiter", "export_rate_limiter", "registration_limiter", "otp_request_limiter", "password_change_limiter", "token_refresh_limiter", "ip_rate_limiter", "user_rate_limiter", "endpoint_rate_limiter", "adaptive_rate_limiter"],
        "cors": ["cors_strict", "cors_permissive", "cors_credential_guard", "cors_method_guard", "cors_header_guard", "cors_origin_validator", "cors_preflight_handler", "cors_wildcard_blocker", "cors_subdomain_checker", "cors_protocol_enforcer"],
        "header_security": ["csp_header_manager", "hsts_header_setter", "x_frame_options_guard", "x_content_type_guard", "x_xss_protection_setter", "referrer_policy_manager", "permission_policy_guard", "cross_origin_opener_guard", "cross_origin_resource_guard", "content_security_report", "strict_transport_guard"],
        "cookie_security": ["http_only_enforcer", "secure_flag_setter", "same_site_strict", "same_site_lax", "same_site_none", "cookie_domain_validator", "cookie_path_validator", "cookie_max_age_setter", "cookie_prefix_checker", "cookie_expiration_guard", "cookie_rotation_handler"],
    }
    for cat, names in categories.items():
        for name in names:
            tools.append({
                "name": name, "category": cat,
                "description": f"Micro-defensive {name.replace('_', ' ')} module providing {cat.replace('_', ' ')} protection against targeted attacks.",
                "status": "dormant", "config": "{}", "isActive": True
            })
    return tools

def gen_sensors():
    sensors = []
    data = {
        "radar": [
            ("AESA P-2D Radar", "radar", "aesa_p2d", "Active Electronically Scanned Array radar providing 360-degree surveillance with 450km detection range and multi-target tracking.", 450.0, "3.0 GHz (S-band)", 0.85, '{"resolution": 1.5, "rotation_speed": 12, "modes": ["surveillance", "tracking", "weather"]}'),
            ("Patriot Radar", "radar", "patriot_radar", "Phased array radar system for air defense with missile tracking and engagement capabilities up to 180km range.", 180.0, "4.0 GHz (C-band)", 0.90, '{"modes": ["search", "track", "engage"], "targets_max": 125}'),
            ("Green Dar Radar", "radar", "green_dar_radar", "Ground-based surveillance radar optimized for low-altitude drone and UAV detection with 40km effective range.", 40.0, "9.4 GHz (X-band)", 0.75, '{"uav_detection": true, "altitude_range": "0-5000m"}'),
            ("AN/TPS-80", "radar", "an_tps_80", "Multi-mission radar system providing air surveillance, air traffic control, and short-range air defense capabilities.", 370.0, "2.0-4.0 GHz (S/C-band)", 0.88, '{"modes": 4, "rotation_rpm": 15}'),
            ("CAPER Radar", "radar", "caper_radar", "Compact air surveillance radar for perimeter protection with ground clutter rejection and low-RCS target detection.", 25.0, "10.0 GHz (X-band)", 0.70, '{"portable": true, "power_consumption": "350W"}'),
            ("Ground Master 400", "radar", "ground_master_400", "Long-range air defense radar with 450km range and advanced electronic counter-countermeasure capabilities.", 450.0, "1.3-1.4 GHz (L-band)", 0.92, '{"eccm": true, "mobility": "tactical"}'),
            ("Sharp Eye Radar", "radar", "sharp_eye", "Short-range surveillance radar for point and area protection with automatic target tracking.", 15.0, "9.2 GHz (X-band)", 0.65, '{"auto_track": true, "interference_rejection": true}'),
            ("Kronos Radar", "radar", "kronos_radar", "3D multi-beam naval radar providing simultaneous air and surface surveillance with ballistic missile detection.", 250.0, "2.0-4.0 GHz (S/C-band)", 0.87, '{"naval": true, "3d_coverage": true, "missile_detection": true}'),
        ],
        "sonar": [
            ("AN/SQS-53", "sonar", "an_sqs_53", "Advanced hull-mounted active/passive sonar system with underwater target detection and torpedo defense capabilities.", 130.0, "3.5 kHz (LF)", 0.85, '{"type": "bow_array", "modes": ["active", "passive"]}'),
            ("Sonar 2087", "sonar", "sonar_2087", "Towed array sonar system providing long-range passive detection of submarines and underwater threats.", 200.0, "0.1-3.0 kHz (VLF-LF)", 0.90, '{"type": "towed_array", "stream_length": "1000m"}'),
            ("Thales Kingklip", "sonar", "thales_kingklip", "Mine and obstacle avoidance sonar for surface vessels operating in shallow and confined waters.", 2.0, "100 kHz (HF)", 0.80, '{"type": "hull_mounted", "minesweeper": true}'),
            ("Atlas Elektronik UTG", "sonar", "atlas_elektronik_utg", "Underwater target guidance sonar for torpedo firing solutions and underwater threat assessment.", 30.0, "8.0 kHz (MF)", 0.82, '{"type": "submarine", "torpedo_guidance": true}'),
            ("Bluefin Sonar", "sonar", "bluefin_sonar", "Synthetic aperture sonar for high-resolution seafloor imaging and underwater object detection.", 1.5, "120 kHz (HF)", 0.75, '{"type": "auv_mounted", "resolution": "10cm"}'),
            ("Knifefish", "sonar", "knifefish", "Unmanned underwater mine countermeasures sonar system with automatic target recognition.", 3.0, "100 kHz (HF)", 0.88, '{"type": "uuv", "atr": true, "mine_detection": true}'),
            ("Seabed Mapper", "sonar", "seabed_mapper", "Multibeam echo sounder for high-resolution seafloor mapping and underwater terrain surveying.", 0.5, "200 kHz (VHF)", 0.70, '{"type": "survey", "swath": "120 degrees"}'),
            ("Towed Array Sonar", "sonar", "towed_array_sonar", "Long passive towed array for wide-area submarine detection and acoustic intelligence gathering.", 300.0, "0.05-2.0 kHz (VLF-LF)", 0.85, '{"type": "towed", "array_length": "2000m"}'),
        ],
        "lidar": [
            ("Velodyne VLP-16", "lidar", "velodyne_vlp16", "16-channel LiDAR sensor providing 3D point cloud data for perimeter surveillance and drone detection.", 100.0, "903 nm (NIR)", 0.80, '{"channels": 16, "points_per_second": 300000, "fps": 20}'),
            ("Ouster OS1-128", "lidar", "ouster_os1_128", "128-channel high-resolution LiDAR for detailed 3D mapping and object tracking in security applications.", 120.0, "850-940 nm (NIR)", 0.90, '{"channels": 128, "points_per_second": 2600000, "fps": 20}'),
            ("Livox Mid-360", "lidar", "livox_mid_360", "Hybrid solid-state LiDAR providing non-repetitive scanning pattern for comprehensive area coverage.", 40.0, "905 nm (NIR)", 0.75, '{"scanning_pattern": "non_repetitive", "fov": 360}'),
            ("Hesai XT32", "lidar", "hesai_xt32", "32-channel automotive-grade LiDAR for vehicle perimeter security and object detection.", 150.0, "905 nm (NIR)", 0.82, '{"channels": 32, "range_accuracy": "0.05m"}'),
            ("RoboSense RS-16", "lidar", "robosense_rs16", "16-channel LiDAR sensor for intelligent transportation and security monitoring.", 150.0, "905 nm (NIR)", 0.78, '{"channels": 16, "protection_level": "IP67"}'),
            ("Innoviz LiDAR One", "lidar", "innoviz_lidar_one", "Solid-state LiDAR with high-resolution long-range detection for border security applications.", 250.0, "940 nm (NIR)", 0.85, '{"type": "solid_state", "resolution": "0.1 degree"}'),
        ],
        "acoustic": [
            ("Seismo-Acoustic Sensor", "acoustic", "seismo_acoustic", "Combined seismic and acoustic sensor for detecting footsteps, vehicles, and digging activity near perimeters.", 0.5, "20-20000 Hz", 0.70, '{"detection_types": ["footstep", "vehicle", "digging"], "deployment": "ground"}'),
            ("Gunshot Detector", "acoustic", "gunshot_detector", "Acoustic gunshot detection and localization system with real-time alerting and 3D position calculation.", 2.0, "100-20000 Hz", 0.85, '{"detection_range": "2km", "localization_accuracy": "5m"}'),
            ("Drone Acoustic Locator", "acoustic", "drone_acoustic_locator", "Multi-microphone array for detecting and localizing small UAVs based on rotor noise signature.", 1.0, "200-20000 Hz", 0.75, '{"microphones": 8, "detection_range": "500m"}'),
            ("Vehicle Acoustic Classifier", "acoustic", "vehicle_acoustic_classifier", "Acoustic vehicle classification system identifying vehicle type, direction, and speed from engine noise.", 0.3, "50-5000 Hz", 0.65, '{"classifications": ["car", "truck", "motorcycle", "tank"], "count_direction": true}'),
            ("Ambient Noise Monitor", "acoustic", "ambient_noise_monitor", "Environmental noise monitoring station for baseline establishment and anomaly detection in protected zones.", 1.0, "20-20000 Hz", 0.60, '{"bands": ["A", "C", "Z"], "logging_interval": "1s"}'),
        ],
        "ew": [
            ("SIGINT Interceptor", "ew", "sigint_interceptor", "Signals intelligence interceptor covering VHF/UHF/SHF bands for communication and electronic signal collection.", 500.0, "30 MHz - 18 GHz", 0.90, '{"bands": ["VHF", "UHF", "SHF"], "demod": ["AM", "FM", "SSB", "digital"]}'),
            ("COMINT Analyzer", "ew", "comint_analyzer", "Communications intelligence analyzer for real-time interception and classification of voice and data communications.", 300.0, "30 MHz - 3 GHz", 0.85, '{"capabilities": ["intercept", "classify", "locate"], "protocols": ["GSM", "LTE", "VHF"]}'),
            ("ELINT Scanner", "ew", "elint_scanner", "Electronic intelligence scanner for radar emitter detection, identification, and tracking in the operational area.", 400.0, "2-18 GHz", 0.88, '{"radar_types": ["surveillance", "tracking", "fire_control"], "pulse_analysis": true}'),
            ("ECM Jammer", "ew", "ecm_jammer", "Electronic countermeasures jammer for denying adversary communications and radar within operational radius.", 50.0, "100 MHz - 6 GHz", 0.80, '{"jamming_types": ["noise", "deceptive", "DRFM"], "power": "500W"}'),
        ],
    }
    for stype, items in data.items():
        for name, st, sub, desc, rng, freq, sens, cfg in items:
            sensors.append({
                "name": name, "type": st, "subtype": sub, "description": desc,
                "status": "offline", "config": cfg, "location": "Sector A",
                "range": rng, "frequency": freq, "sensitivity": sens
            })
    return sensors

# Generate all data
print("Generating comprehensive seed data...")
potentials = gen_potentials()
offensive = gen_offensive_tools()
defensive = gen_defensive_tools()
micro = gen_micro_tools()
sensors = gen_sensors()
print(f"Potentials: {len(potentials)}")
print(f"Offensive tools: {len(offensive)}")
print(f"Defensive tools: {len(defensive)}")
print(f"Micro-defensive tools: {len(micro)}")
print(f"Sensors: {len(sensors)}")

# Save as JSON for the TypeScript file to import
output = {
    "potentials": potentials,
    "offensive_tools": offensive,
    "defensive_tools": defensive,
    "micro_tools": micro,
    "sensors": sensors,
}
with open("/home/z/my-project/src/lib/seed-data.json", "w") as f:
    json.dump(output, f, indent=2)
print(f"Saved seed-data.json ({len(json.dumps(output))} chars)")