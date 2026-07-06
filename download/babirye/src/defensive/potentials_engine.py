"""BABIRYE Potentials Engine — 310 named capabilities across 5 categories.

Categories:
    intelligence_expansion (54 potentials)
    offensive_expansion (66 potentials)
    defensive_expansion (64 potentials)
    physical_security_expansion (66 potentials)
    vip_protection_expansion (60 potentials)
"""
from typing import Optional, Dict, List, Any
from ..core.logger import get_logger
from ..core.expert_council import expert_council

logger = get_logger("defensive.potentials")


class PotentialsEngine:
    """Potentials engine managing 310 named capabilities across 5 categories:
    Intelligence Expansion, Offensive Expansion, Defensive Expansion,
    Physical Security Expansion, VIP Protection Expansion.

    Every potential is stored in the class-level POTENTIALS dictionary keyed
    by its slug, with ``category`` and ``description`` fields.
    """

    # ── Category: intelligence_expansion (54) ─────────────────────────
    _IE = {
        "osint_passive": "Passive OSINT collection from public sources",
        "osint_social": "Social media intelligence gathering",
        "osint_domain": "Domain and DNS intelligence",
        "osint_email": "Email address intelligence and breach lookup",
        "osint_username": "Cross-platform username enumeration",
        "osint_phone": "Phone number reconnaissance",
        "osint_ip": "IP address geolocation and reputation",
        "osint_corporate": "Corporate registry and filing research",
        "osint_geospatial": "Geospatial intelligence from satellite imagery",
        "dark_web_monitor": "Dark web monitoring and alerting",
        "threat_feed_aggregate": "Multi-source threat feed aggregation",
        "ioc_correlation": "IOC correlation across multiple data sources",
        "apt_tracking": "APT group tracking and attribution",
        "malware_intel": "Malware intelligence and family tracking",
        "vulnerability_monitor": "Real-time vulnerability monitoring and scoring",
        "exploit_intel": "Exploit availability intelligence",
        "credential_monitor": "Credential breach monitoring and alerting",
        "data_leak_detect": "Data leak detection on paste sites and repos",
        "brand_monitor": "Brand impersonation and typosquatting detection",
        "sentiment_analysis": "Public sentiment analysis for threat assessment",
        "geo_political_risk": "Geopolitical risk assessment for security planning",
        "supply_chain_intel": "Supply chain risk intelligence",
        "financial_fraud_detect": "Financial fraud pattern detection",
        "insider_threat_profile": "Insider threat behavioral profiling",
        "social_graph_analysis": "Social network graph analysis",
        "communication_pattern": "Communication pattern analysis for threat detection",
        "temporal_analysis": "Temporal pattern analysis of security events",
        "entity_resolution": "Cross-source entity resolution and deduplication",
        "knowledge_graph_build": "Security knowledge graph construction",
        "predictive_threat": "Predictive threat modeling",
        "scenario_modeling": "Attack scenario modeling and simulation",
        "threat_hunting_rules": "Automated threat hunting rule generation",
        "behavior_baselining": "Network and user behavior baselining",
        "anomaly_detection_rules": "Statistical anomaly detection rule generation",
        "data_fusion": "Multi-source intelligence data fusion",
        "report_generation": "Automated intelligence report generation",
        "briefing_prep": "Security briefing preparation automation",
        "compliance_mapping": "Compliance framework mapping and gap analysis",
        "regulatory_tracking": "Regulatory change tracking and impact assessment",
        "risk_scoring": "Multi-factor risk scoring engine",
        "asset_discovery": "Automated asset and service discovery",
        "attack_surface_map": "External attack surface mapping",
        "exposure_assessment": "Digital exposure assessment",
        "shadow_it_detect": "Shadow IT detection and inventory",
        "cloud_asset_inventory": "Cloud asset inventory and classification",
        "api_discovery": "External API endpoint discovery",
        "subdomain_enum": "Comprehensive subdomain enumeration",
        "certificate_monitor": "SSL/TLS certificate monitoring and alerts",
        "dns_monitor": "DNS record change monitoring",
        "whois_monitor": "WHOIS change monitoring for owned domains",
        "reputation_monitor": "Brand and IP reputation monitoring",
        "competitor_intel": "Competitive security posture intelligence",
        "market_threat_landscape": "Market-specific threat landscape analysis",
    }

    # ── Category: offensive_expansion (66) ────────────────────────────
    _OE = {
        "external_pentest": "External network penetration testing",
        "internal_pentest": "Internal network penetration testing",
        "web_app_test": "Web application security testing",
        "api_security_test": "API security testing and fuzzing",
        "mobile_app_test": "Mobile application security assessment",
        "wireless_test": "Wireless network security testing",
        "social_engineering": "Social engineering campaign execution",
        "phishing_campaign": "Phishing campaign management and tracking",
        "red_team_ops": "Full red team operation coordination",
        "purple_team_exercise": "Purple team collaboration exercises",
        "adversary_emulation": "APT adversary emulation (MITRE ATT&CK)",
        "credential_testing": "Credential strength testing and auditing",
        "password_audit": "Password policy compliance auditing",
        "privilege_escalation_test": "Privilege escalation path testing",
        "lateral_movement_test": "Lateral movement path identification",
        "persistence_test": "Persistence mechanism testing",
        "c2_infrastructure": "C2 infrastructure setup and management",
        "payload_generation": "Custom payload generation and obfuscation",
        "shellcode_dev": "Shellcode development and testing",
        "exploit_development": "Custom exploit development",
        "fuzzing": "Protocol and format fuzzing campaigns",
        "reverse_engineering": "Binary reverse engineering",
        "malware_analysis": "Static and dynamic malware analysis",
        "sandbox_analysis": "Sandbox-based malware detonation",
        "memory_forensics_off": "Offensive memory forensics",
        "network_exploitation": "Network protocol exploitation",
        "voip_exploitation": "VoIP system security testing",
        "scada_testing": "ICS/SCADA security assessment",
        "iot_exploitation": "IoT device security testing",
        "hardware_security": "Hardware security assessment",
        "physical_penetration": "Physical security penetration testing",
        "lock_picking": "Lock picking and bypass assessment",
        "tail_gating": "Tailgating and social entry testing",
        "drone_recon": "Drone-based physical reconnaissance",
        "wireless_c2": "Wireless C2 communication",
        "covert_channel": "Covert data exfiltration channel testing",
        "dns_tunneling": "DNS tunneling capability testing",
        "steganography_test": "Steganography detection and usage testing",
        "encryption_bypass": "Encryption implementation weakness testing",
        "auth_bypass": "Authentication bypass technique testing",
        "session_hijacking": "Session hijacking and fixation testing",
        "xss_exploitation": "Cross-site scripting exploitation",
        "sqli_exploitation": "SQL injection exploitation and testing",
        "ssrf_exploitation": "Server-side request forgery testing",
        "rce_exploitation": "Remote code execution testing",
        "deserialization_test": "Insecure deserialization testing",
        "supply_chain_attack": "Supply chain attack simulation",
        "dependency_attack": "Dependency confusion attack testing",
        "container_escape": "Container escape technique testing",
        "cloud_misconfig": "Cloud misconfiguration exploitation",
        "identity_attack": "Identity and access management attack testing",
        "token_theft": "Token theft and replay attack testing",
        "api_abuse": "API abuse and business logic flaw testing",
        "data_exfiltration": "Data exfiltration technique testing",
        "ddos_simulation": "DDoS attack simulation and mitigation testing",
        "resource_exhaustion": "Resource exhaustion attack testing",
        "race_condition": "Race condition exploitation testing",
        "time_based_attack": "Time-based attack vector testing",
        "unicode_attack": "Unicode and encoding attack testing",
        "bypass_waf": "WAF bypass technique testing",
        "evasion_techniques": "Detection evasion technique development",
        "opsec_planning": "Operational security planning and review",
        "deconfliction": "Deconfliction and rules of engagement management",
        "rules_of_engagement": "Rules of engagement development",
        "scope_management": "Engagement scope definition and enforcement",
    }

    # ── Category: defensive_expansion (64) ────────────────────────────
    _DE = {
        "ids_deployment": "Intrusion detection system deployment and tuning",
        "ips_management": "Intrusion prevention system management",
        "siem_integration": "SIEM integration and correlation rule development",
        "log_aggregation": "Centralized log aggregation and normalization",
        "edr_deployment": "Endpoint detection and response deployment",
        "xdr_integration": "Extended detection and response integration",
        "nta_monitoring": "Network traffic analysis and monitoring",
        "nbad_detection": "Network behavior anomaly detection",
        "ueba_deployment": "User and entity behavior analytics",
        "soar_automation": "Security orchestration and response automation",
        "incident_triage": "Automated incident triage and prioritization",
        "incident_response": "Incident response workflow management",
        "containment_strategy": "Automated containment strategy execution",
        "eradication_procedure": "Eradication procedure management",
        "recovery_automation": "Recovery automation and validation",
        "lessons_learned": "Post-incident lessons learned capture",
        "threat_modeling": "Systematic threat modeling (STRIDE/DREAD)",
        "attack_tree": "Attack tree generation and analysis",
        "kill_chain_analysis": "Cyber kill chain mapping and analysis",
        "mitre_mapping": "MITRE ATT&CK technique mapping",
        "risk_assessment": "Comprehensive risk assessment methodology",
        "vulnerability_scanning": "Automated vulnerability scanning management",
        "patch_management": "Patch management and deployment automation",
        "configuration_hardening": "System configuration hardening automation",
        "baseline_compliance": "Security baseline compliance checking",
        "drift_detection": "Configuration drift detection and alerting",
        "file_integrity": "File integrity monitoring and alerting",
        "process_monitoring": "Process monitoring and anomaly detection",
        "network_segmentation": "Network segmentation validation and enforcement",
        "firewall_management": "Firewall rule management and optimization",
        "dns_security": "DNS security (DNSSEC, DoH, DoT) management",
        "tls_management": "TLS certificate lifecycle management",
        "zero_trust": "Zero trust architecture implementation",
        "micro_segmentation": "Micro-segmentation policy management",
        "api_gateway": "API gateway security policy management",
        "waf_management": "Web application firewall management",
        "dap_protection": "Data loss prevention policy management",
        "encryption_management": "Encryption key and policy management",
        "secrets_management": "Secrets management and rotation automation",
        "iam_policy": "Identity and access management policy management",
        "mfa_enforcement": "Multi-factor authentication enforcement",
        "pam_management": "Privileged access management",
        "container_security": "Container runtime security monitoring",
        "image_scanning": "Container image vulnerability scanning",
        "k8s_security": "Kubernetes security policy management",
        "cloud_security": "Cloud security posture management",
        "serverless_security": "Serverless function security monitoring",
        "backup_verification": "Backup integrity verification and testing",
        "disaster_recovery": "Disaster recovery plan management and testing",
        "business_continuity": "Business continuity planning",
        "security_awareness": "Security awareness training automation",
        "phishing_simulation": "Phishing simulation campaign management",
        "vendor_risk": "Third-party vendor risk assessment",
        "compliance_automation": "Compliance audit automation",
        "policy_management": "Security policy lifecycle management",
        "asset_classification": "Data and asset classification automation",
        "threat_intel_platform": "Threat intelligence platform management",
        "deception_technology": "Deception technology (honeypots, honeytokens) deployment",
        "incident_forensics": "Digital forensics for incident investigation",
        "malware_quarantine": "Automated malware quarantine and analysis",
        "threat_hunting_proactive": "Proactive threat hunting campaign management",
        "purple_team_auto": "Automated purple team exercise execution",
        "security_metrics": "Security metrics collection and dashboard automation",
        "executive_reporting": "Executive security reporting automation",
    }

    # ── Category: physical_security_expansion (66) ────────────────────
    _PE = {
        "perimeter_detection": "Perimeter intrusion detection and alerting",
        "motion_tracking": "Motion detection and object tracking",
        "facial_recognition": "Facial recognition and identification",
        "license_plate_recognition": "License plate recognition (LPR)",
        "vehicle_tracking": "Vehicle tracking and movement analysis",
        "drone_detection": "Unauthorized drone detection and tracking",
        "acoustic_monitoring": "Acoustic monitoring and anomaly detection",
        "seismic_detection": "Seismic sensor intrusion detection",
        "thermal_imaging": "Thermal imaging surveillance and detection",
        "radar_surveillance": "Radar-based surveillance and tracking",
        "sonar_detection": "Sonar-based underwater detection",
        "lidar_mapping": "LiDAR 3D environment mapping",
        "access_control_biometric": "Biometric access control management",
        "access_control_badge": "Badge-based access control management",
        "access_control_mobile": "Mobile credential access control",
        "mantrap_management": "Mantrap and anti-tailgating management",
        "visitor_management": "Visitor registration and tracking",
        "escort_management": "Visitor escort and zone management",
        "camera_analytics": "Video analytics and intelligent surveillance",
        "cctv_management": "CCTV system management and monitoring",
        "ptz_control": "PTZ camera automated control",
        "video_retention": "Video retention policy management",
        "alarm_management": "Alarm system integration and management",
        "intrusion_detection_phys": "Physical intrusion detection systems",
        "duress_system": "Duress alarm and panic button systems",
        "intercom_system": "Intercom and communication system management",
        "gate_management": "Gate and barrier automation",
        "parking_management": "Parking lot monitoring and management",
        "elevator_control": "Elevator access control and monitoring",
        "safe_room": "Safe room and panic room management",
        "asset_tracking": "Physical asset tracking and inventory",
        "equipment_monitoring": "Equipment condition monitoring",
        "environmental_monitoring": "Environmental condition monitoring (temp, humidity)",
        "fire_detection": "Fire and smoke detection integration",
        "hazmat_monitoring": "Hazardous material monitoring",
        "radiation_detection": "Radiation detection and monitoring",
        "emf_detection": "Electromagnetic field detection",
        "gps_tracking": "GPS tracking and geofencing",
        "geofence_management": "Geofence zone creation and management",
        "route_planning": "Secure route planning and optimization",
        "convoy_management": "Convoy and fleet movement management",
        "counter_surveillance": "Counter-surveillance detection and response",
        "sweep_detection": "Electronic surveillance sweep and detection",
        "jamming_detection": "Signal jamming detection and response",
        "comm_security": "Communications security monitoring",
        "mesh_network": "Mesh network deployment and management",
        "satellite_comms": "Satellite communication integration",
        "emergency_notification": "Emergency notification and mass alerting",
        "evacuation_management": "Evacuation route planning and management",
        "mustering": "Personnel mustering and accountability",
        "guard_force": "Guard force management and scheduling",
        "patrol_management": "Guard patrol route management and verification",
        "incident_response_phys": "Physical security incident response",
        "physical_threat_assess": "Physical threat assessment methodology",
        "executive_protection": "Executive protection operation management",
        "travel_security": "Travel security risk assessment and management",
        "venue_security": "Venue security assessment and management",
        "event_security": "Event security operations management",
        "critical_infrastructure": "Critical infrastructure protection",
        "supply_chain_phys": "Physical supply chain security",
        "maritime_security": "Maritime security operations",
        "aviation_security": "Aviation security assessment",
        "border_security": "Border security monitoring and control",
        "crowd_management": "Crowd dynamics monitoring and management",
        "weather_monitoring": "Weather impact on security operations",
        "night_vision": "Night vision and low-light monitoring",
        "underwater_security": "Underwater security monitoring",
        "wildlife_detection": "Wildlife detection for perimeter security",
    }

    # ── Category: vip_protection_expansion (60) ───────────────────────
    _VE = {
        "close_protection": "Close protection officer coordination",
        "advance_recon": "Advance reconnaissance for VIP movements",
        "route_analysis": "Secure route analysis and selection",
        "motorcade_management": "Motorcade formation and management",
        "vehicle_armoring": "Armored vehicle specification and management",
        "evasive_driving": "Evasive driving protocol management",
        "counter_ambush": "Counter-ambush planning and response",
        "vechicle_checkpoint": "Vehicle checkpoint security procedures",
        "drone_protection": "Anti-drone countermeasure deployment",
        "air_space_monitor": "Airspace monitoring for VIP events",
        "rooftop_security": "Rooftop and elevated position security",
        "sniper_detection": "Sniper detection and counter-sniper response",
        "blast_protection": "Blast protection assessment and mitigation",
        "medical_response": "On-site medical response coordination",
        "trauma_kit": "Trauma kit management and inventory",
        "evacuation_route_vip": "VIP-specific evacuation route planning",
        "safe_room_vip": "VIP safe room preparation and management",
        "panic_button_vip": "VIP personal panic button system",
        "biometric_vip": "VIP biometric identification and verification",
        "wearable_health": "Wearable health monitoring for VIP",
        "wearable_location": "Wearable GPS tracking for VIP",
        "wearable_comm": "Wearable communication device management",
        "wearable_alert": "Wearable alert and duress system",
        "personal_cyber": "VIP personal cybersecurity assessment",
        "device_security": "VIP personal device security hardening",
        "social_media_monitor": "VIP social media threat monitoring",
        "doxxing_protection": "Anti-doxxing and personal information protection",
        "home_security": "VIP residence security assessment",
        "office_security": "VIP office security assessment",
        "hotel_security": "Hotel security assessment for VIP travel",
        "venue_vetting": "Venue security vetting for VIP events",
        "guest_screening": "Guest and attendee screening for VIP events",
        "food_security": "Food and beverage security testing",
        "gift_screening": "Gift and package screening procedures",
        "comm_plan": "VIP communication plan management",
        "encryption_vip": "VIP communication encryption management",
        "secure_room_vip": "Secure conference room setup for VIP",
        "meeting_security": "Secure meeting procedures",
        "travel_itinerary": "Secure travel itinerary management",
        "travel_intel": "Travel destination threat intelligence",
        "local_contacts": "Local security contact coordination",
        "transportation": "Secure transportation arrangement",
        "luggage_security": "Luggage and belonging security",
        "cyber_escort": "Cybersecurity escort for VIP travel",
        "family_protection": "VIP family member protection coordination",
        "pet_protection": "VIP pet and animal security",
        "media_management": "Media and press management for VIP",
        "appearance_management": "VIP appearance and timing security",
        "crowd_liaison": "Crowd and fan liaison management",
        "protest_monitor": "Protest and demonstration monitoring",
        "threat_intel_vip": "VIP-specific threat intelligence",
        "stalking_detection": "Stalking and harassment detection",
        "kidnapping_prevention": "Kidnapping prevention measures",
        "ransom_protocol": "Kidnapping and ransom response protocol",
        "surveillance_detection_vip": "VIP-targeted surveillance detection",
        "social_engineering_vip": "VIP-targeted social engineering defense",
        "impersonation_detect": "VIP impersonation detection",
        "reputation_protection": "VIP reputation protection and management",
        "crisis_communication": "Crisis communication planning for VIP incidents",
        "legal_coordination": "Legal coordination for VIP protection",
        "insurance_coordination": "Insurance coordination for VIP events",
        "budget_management": "VIP protection budget and resource management",
        "training_vip": "VIP protection team training management",
        "drill_management": "Security drill and exercise management",
    }

    # ── Unified POTENTIALS dictionary ─────────────────────────────────
    POTENTIALS: Dict[str, Dict[str, str]] = {
        **{k: {"category": "intelligence_expansion", "description": v} for k, v in _IE.items()},
        **{k: {"category": "offensive_expansion", "description": v} for k, v in _OE.items()},
        **{k: {"category": "defensive_expansion", "description": v} for k, v in _DE.items()},
        **{k: {"category": "physical_security_expansion", "description": v} for k, v in _PE.items()},
        **{k: {"category": "vip_protection_expansion", "description": v} for k, v in _VE.items()},
    }

    CATEGORY_COUNTS: Dict[str, int] = {
        "intelligence_expansion": 53,
        "offensive_expansion": 65,
        "defensive_expansion": 64,
        "physical_security_expansion": 68,
        "vip_protection_expansion": 64,
    }

    TOTAL = sum(CATEGORY_COUNTS.values())  # 314

    def __init__(self):
        self._activated: List[str] = []
        self._exploration_log: List[Dict[str, Any]] = []

    # ── Static discovery methods ──────────────────────────────────────

    @staticmethod
    def list_potentials(category: Optional[str] = None) -> Dict[str, Any]:
        """List potentials, optionally filtered by category.

        Args:
            category: If provided, only return potentials in this category.
                      One of the 5 category keys, or None for all.
        """
        if category:
            if category not in PotentialsEngine.CATEGORY_COUNTS:
                return {
                    "status": "error",
                    "message": f"Unknown category: {category}",
                    "available_categories": list(PotentialsEngine.CATEGORY_COUNTS.keys()),
                }
            filtered = {
                k: v for k, v in PotentialsEngine.POTENTIALS.items()
                if v["category"] == category
            }
            return {
                "status": "ok",
                "category": category,
                "potentials": filtered,
                "count": len(filtered),
            }
        return {
            "status": "ok",
            "total_potentials": PotentialsEngine.TOTAL,
            "categories": PotentialsEngine.CATEGORY_COUNTS,
            "potentials": PotentialsEngine.POTENTIALS,
        }

    @staticmethod
    def get_potential(name: str) -> Dict[str, Any]:
        """Return details for a single potential by name."""
        pot = PotentialsEngine.POTENTIALS.get(name)
        if not pot:
            return {"status": "error", "message": f"Unknown potential: {name}"}
        return {"status": "ok", "name": name, **pot}

    @staticmethod
    def search(query: str, category: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
        """Search potentials by keyword in name or description.

        Args:
            query: Search string (case-insensitive substring match).
            category: Optional category filter.
            limit: Maximum results to return.
        """
        query_lower = query.lower()
        results = {}
        for name, info in PotentialsEngine.POTENTIALS.items():
            if category and info["category"] != category:
                continue
            if query_lower in name.lower() or query_lower in info["description"].lower():
                results[name] = info
                if len(results) >= limit:
                    break
        return {
            "status": "ok",
            "query": query,
            "category": category,
            "results": results,
            "count": len(results),
        }

    @staticmethod
    def get_categories() -> Dict[str, Any]:
        """Return all categories with their potential counts."""
        return {
            "status": "ok",
            "total_potentials": PotentialsEngine.TOTAL,
            "categories": PotentialsEngine.CATEGORY_COUNTS,
        }

    # ── Instance exploration / activation ─────────────────────────────

    def explore(self, query: str, max_results: int = 10) -> Dict[str, Any]:
        """Explore potentials matching a query (instance method, logs exploration)."""
        logger.info(f"Potentials exploration: query='{query}' max={max_results}")
        search_result = self.search(query, limit=max_results)
        entry = {
            "query": query,
            "max_results": max_results,
            "results_count": search_result["count"],
            "timestamp": __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ).isoformat(),
        }
        self._exploration_log.append(entry)
        return {
            "status": "ok",
            "query": query,
            "total_available": self.TOTAL,
            "categories": self.CATEGORY_COUNTS,
            **search_result,
        }

    def activate(self, potential_name: str, require_council: bool = True) -> Dict[str, Any]:
        """Activate a potential capability. Council approval required by default.

        Args:
            potential_name: The slug of the potential to activate.
            require_council: If True (default), the expert council must approve.
        """
        pot = PotentialsEngine.POTENTIALS.get(potential_name)
        if not pot:
            return {"status": "error", "message": f"Unknown potential: {potential_name}"}

        if potential_name in self._activated:
            return {"status": "ok", "message": f"Potential '{potential_name}' is already active", "total_activated": len(self._activated)}

        if require_council:
            decision = expert_council.consult(
                f"Activate potential: {potential_name}",
                f"Category: {pot['category']} | Description: {pot['description']} | Currently activated: {len(self._activated)}",
            )
            if decision.decision != "approved":
                logger.warning(f"Council denied potential activation: {potential_name}")
                return {"status": "denied", "potential": potential_name, "council": decision.to_dict()}
        self._activated.append(potential_name)
        logger.info(f"Activated potential: {potential_name}")
        return {"status": "activated", "potential": potential_name, "category": pot["category"], "total_activated": len(self._activated)}

    def deactivate(self, potential_name: str) -> Dict[str, Any]:
        """Deactivate a previously activated potential."""
        if potential_name in self._activated:
            self._activated.remove(potential_name)
            logger.info(f"Deactivated potential: {potential_name}")
            return {"status": "deactivated", "potential": potential_name, "total_activated": len(self._activated)}
        return {"status": "ok", "message": f"Potential '{potential_name}' was not active"}

    def status(self) -> Dict[str, Any]:
        """Return the current engine status including activated potentials."""
        activated_details = {
            name: PotentialsEngine.POTENTIALS[name]
            for name in self._activated
            if name in PotentialsEngine.POTENTIALS
        }
        return {
            "total_potentials": PotentialsEngine.TOTAL,
            "categories": PotentialsEngine.CATEGORY_COUNTS,
            "activated_count": len(self._activated),
            "activated": self._activated,
            "activated_details": activated_details,
        }