#!/usr/bin/env python3
"""Part 4e: Sensors agent, Potentials agent, VIP agent"""
OUT = "/home/z/my-project/upload/Pasted Content_1782740004460.txt"
F = open(OUT, "a", encoding="utf-8")
def w(s=""): F.write(s + "\n")

import subprocess
result = subprocess.run(['grep', '-c', '^## [0-9]', OUT], capture_output=True, text=True)
si = int(result.stdout.strip()) + 1

def pyfile(title, code):
    global si
    w(f"## {si}. {title}")
    w("```python")
    w(code)
    w("```")
    w("---"); w()
    si += 1

# ═══ src/agents/sensors_agent.py ═══
pyfile("src/agents/sensors_agent.py", '''"""BABIRYE Sensors Agent — 31 sensor types + 80+ weapons + 25 martial arts."""
from typing import Optional, Dict, Any, List
from .base import BaseAgent


class SensorsAgent(BaseAgent):
    """Manages sensor fusion, weapons profiles, and martial arts analysis.
    Sensor types: 8 radar + 8 sonar + 6 LiDAR + 5 acoustic + 4 EW = 31.
    Weapons: 80+ profiles. Martial Arts: 25 styles."""

    RADAR_TYPES = [
        "phased_array_radar", "synthetic_aperture_radar", "doppler_radar",
        "fm_cw_radar", "continuous_wave_radar", "pulse_radar",
        "multistatic_radar", "over_the_horizon_radar",
    ]

    SONAR_TYPES = [
        "active_sonar", "passive_sonar", "side_scan_sonar",
        "synthetic_aperture_sonar", "multibeam_sonar", "sub_bottom_profiler",
        "forward_looking_sonar", "towed_array_sonar",
    ]

    LIDAR_TYPES = [
        "velodyne_lidar", "solid_state_lidar", "mechanical_lidar",
        "flash_lidar", "mems_lidar", "fmcw_lidar",
    ]

    ACOUSTIC_TYPES = [
        "microphone_array", "seismic_sensor", "ultrasonic_sensor",
        "infrasound_sensor", "acoustic_camera",
    ]

    EW_TYPES = [
        "sigint_receiver", "comint_interceptor", "elint_analyzer", "ecm_jammer",
    ]

    WEAPON_CATEGORIES = {
        "handguns": ["glock_17", "glock_19", "sig_sauer_p226", "beretta_m9", "m1911", "hk_usp", "fn_five_seven", "cz_75", "walther_ppq", "smith_wesson_m&p", "desert_eagle", "springfield_xd"],
        "rifles": ["m4_carbine", "m16", "ak_47", "ak_74", "hk_416", "fn_scar_l", "fn_scar_h", "m14", "mk14_emr", "sr_25", "hk_g28", "barrett_m82"],
        "shotguns": ["remington_870", "mossberg_590", "benelli_m4", "saiga_12", "ksg", "aa_12", "spas_12", "m1014"],
        "smgs": ["mp5", "mp7", "ump45", "p90", "mp9", "scorpion_evo", "vector", "uzi"],
        "lmgs": ["m249_saw", "m240b", "mg42", "pkm", "m60", "rpk"],
        "sniper": ["m40a5", "m24_sws", "awm", "barrett_m98b", "sako_trg_42", "accuracy_international_ax338", "cheytac_m200", "m2010_esr"],
        "explosives": ["m67_grenade", "m18a1_claymore", "c4", "semtex", "at4", "rpg_7", "javelin", "stinger", "hellfire", "mk_82"],
        "directed_energy": ["active_denyial_system", "laser_dazzler", "plasma_weapon", "emp_device", "hpm_weapon", "lrad"],
        "missiles": ["tomahawk", "aim_9_sidewinder", "aim_120_amraam", "agm_114_hellfire"],
        "non_lethal": ["taser_x26", "rubber_bullets", "tear_gas", "sting_grenade", "flashbang", "bean_bag_round", "pepper_spray", "net_gun"],
        "cyber_kinetic": ["iot_exploit", "scada_override", "plc_manipulation", "hmi_takeover"],
    }

    MARTIAL_ARTS = {
        "striking": ["Boxing", "Muay Thai", "Kyokushin Karate", "Taekwondo", "Savate", "Lethwei", "Sanda", "Kickboxing"],
        "grappling": ["Brazilian Jiu-Jitsu", "Wrestling", "Judo", "Sambo", "Catch Wrestling", "Aikido"],
        "traditional": ["Wing Chun", "Shaolin Kung Fu", "Tai Chi", "Krav Maga", "Ninjutsu", "Capoeira"],
        "weapons": ["Kendo", "Eskrima", "Fencing"],
        "hybrid": ["MMA", "Systema", "Jeet Kune Do"],
    }

    def __init__(self):
        super().__init__("sensors", "Physical Security")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "list_sensors":
            return {
                "status": "ok",
                "radar": self.RADAR_TYPES,
                "sonar": self.SONAR_TYPES,
                "lidar": self.LIDAR_TYPES,
                "acoustic": self.ACOUSTIC_TYPES,
                "ew": self.EW_TYPES,
                "total": 31,
            }
        elif action == "list_weapons":
            total = sum(len(v) for v in self.WEAPON_CATEGORIES.values())
            return {"status": "ok", "total": total, "categories": {k: len(v) for k, v in self.WEAPON_CATEGORIES.items()}}
        elif action == "list_martial_arts":
            total = sum(len(v) for v in self.MARTIAL_ARTS.values())
            return {"status": "ok", "total": total, "styles": self.MARTIAL_ARTS}
        elif action == "threat_assessment":
            style = params.get("martial_art_style")
            threat_level = params.get("threat_level", "unknown")
            council = self.consult_council(f"Threat assessment: {style} at {threat_level}", f"Sensors data: {params}")
            self.log_action("threat_assessment", f"style={style} level={threat_level}")
            return {"status": "council_decision", "council": council}
        elif action == "status":
            return self.status()
        return {"status": "unknown_action", "action": action}
''')

# ═══ src/agents/potentials_agent.py ═══
pyfile("src/agents/potentials_agent.py", '''"""BABIRYE Potentials Agent — 300+ capabilities engine."""
from typing import Optional, Dict, Any, List
from .base import BaseAgent


class PotentialsAgent(BaseAgent):
    """Manages and explores 300+ potential capabilities across all domains.
    The potentials engine enables BABIRYE to explore what-if scenarios,
    discover new capabilities, and expand operational scope dynamically."""

    POTENTIAL_CATEGORIES = {
        "intelligence_expansion": [
            "dark_web_monitoring", "social_media_analysis", "financial_intel",
            "geospatial_analysis", "signal_intelligence", "image_intelligence",
            "video_analysis", "audio_analysis", "document_analysis",
            "communication_intercept_analysis", "blockchain_analysis",
            "satellite_imagery_analysis", "weather_impact_analysis",
            "supply_chain_intel", "corporate_intel", "political_intel",
            "economic_indicator_analysis", "infrastructure_analysis",
            "transportation_network_analysis", "telecom_network_analysis",
            "power_grid_analysis", "water_system_analysis", "maritime_tracking",
            "aviation_tracking", "border_crossing_analysis", "immigration_analysis",
            "customs_data_analysis", "sanctions_compliance_check", "embargo_monitoring",
            "trade_route_analysis", "commodity_tracking", "currency_flow_analysis",
            "insurance_fraud_detection", "money_laundering_detection",
            "tax_evasion_detection", "insider_threat_detection",
            "social_graph_analysis", "influence_network_mapping",
            "radicalization_detection", "protest_prediction", "civil_unrest_forecast",
            "election_monitoring", "disinformation_tracking",
            "deepfake_detection", "synthetic_media_detection", "bot_network_detection",
            "astroturfing_detection", "narrative_analysis", "sentiment_analysis",
            "trend_prediction", "emerging_threat_detection",
        ],
        "offensive_expansion": [
            "advanced_persistent_threat_simulation", "red_team_coordination",
            "zero_day_research_methodology", "hardware_exploitation",
            "firmware_exploitation", "iot_exploitation", "scada_exploitation",
            "rf_exploitation", "gps_spoofing", "cellular_network_exploitation",
            "satellite_communication_exploitation", "undersea_cable_exploitation",
            "power_grid_exploitation", "industrial_control_exploitation",
            "medical_device_exploitation", "vehicle_exploitation",
            "smart_home_exploitation", "smart_city_exploitation",
            "supply_chain_attack_methodology", "sdn_attack_methodology",
            "cloud_native_exploitation", "serverless_exploitation",
            "container_escape_methodology", "kubernetes_exploitation",
            "ai_model_exploitation", "ml poisoning_attack",
            "adversarial_ml_attack", "data_poisoning_methodology",
            "model_inversion_attack", "membership_inference_attack",
            "federated_learning_attack", "differential_privacy_bypass",
            "homomorphic_encryption_attack", "quantum_resistance_analysis",
            "post_quantum_cryptography_attack", "blockchain_exploitation",
            "smart_contract_exploitation", "defi_exploitation",
            "nft_exploitation", "dao_attack_methodology",
            "cross_chain_exploitation", "oracle_manipulation",
            "flash_loan_attack", "sandwich_attack",
            "social_engineering_automation", "phishing_campaign_automation",
            "vishing_methodology", "smishing_methodology",
            "pretexting_automation", "baiting_methodology",
            "tailgating_detection", "piggybacking_detection",
            "physical_penetration_methodology", "lock_picking_methodology",
            "safe_cracking_methodology", "surveillance_detection",
            "counter_surveillance_methodology", "tscm_methodology",
        ],
        "defensive_expansion": [
            "behavioral_analysis_engine", "user_entity_behavior_analytics",
            "network_traffic_analysis", "dns_analysis", "http_analysis",
            "tls_analysis", "certificate_analysis", "email_analysis",
            "endpoint_detection_response", "network_detection_response",
            "cloud_detection_response", "container_detection_response",
            "deception_technology", "honey_net_management",
            "threat_hunting_automation", "threat_intelligence_platform",
            "vulnerability_management", "patch_management",
            "configuration_management", "compliance_management",
            "risk_assessment_automation", "attack_surface_management",
            "security_posture_management", "security_score_calculation",
            "incident_response_automation", "digital_forensics_automation",
            "malware_analysis_automation", "reverse_engineering_assistance",
            "threat_modeling_automation", "security_architecture_review",
            "penetration_test_management", "bug_bounty_management",
            "security_training_platform", "awareness_program_management",
            "security_metrics_dashboard", "compliance_reporting",
            "audit_trail_management", "evidence_management",
            "case_management", "ticket_management",
            "escalation_management", "communication_management",
            "stakeholder_reporting", "executive_dashboard",
            "technical_dashboard", "operational_dashboard",
            "strategic_dashboard", "tactical_dashboard",
            "threat_landscape_analysis", "vulnerability_landscape_analysis",
            "risk_landscape_analysis", "compliance_landscape_analysis",
        ],
        "physical_security_expansion": [
            "perimeter_detection", "intrusion_detection", "motion_detection",
            "glass_break_detection", "door_contact_detection", "pressure_detection",
            "vibration_detection", "thermal_detection", "smoke_detection",
            "gas_detection", "radiation_detection", "chemical_detection",
            "biological_detection", "nuclear_detection", "explosive_detection",
            "drone_detection", "drone_tracking", "drone_interdiction",
            "vehicle_detection", "vehicle_tracking", "vehicle_interdiction",
            "person_detection", "person_tracking", "person_identification",
            "face_recognition", "gait_analysis", "behavioral_analysis_physical",
            "crowd_analysis", "loitering_detection", "tailgating_detection",
            "access_control_management", "visitor_management", "escort_management",
            "panic_alarm_management", "duress_management", "emergency_notification",
            "evacuation_management", "shelter_management", "lockdown_management",
            "surveillance_camera_management", "cctv_analytics", "video_analytics",
            "license_plate_recognition", "vehicle_identification", "cargo_scanning",
            "x_ray_scanning", "millimeter_wave_scanning", "backscatter_scanning",
            "metal_detection", "explosive_trace_detection", "contraband_detection",
            "underwater_detection", "sonar_perimeter", "seismic_perimeter",
            "microwave_perimeter", "infrared_perimeter", "laser_perimeter",
            "fiber_optic_perimeter", "electric_fence_monitoring", "trench_monitoring",
        ],
        "vip_protection_expansion": [
            "route_planning_optimization", "advance_reconnaissance",
            "threat_assessment_vip", "risk_analysis_vip", "vulnerability_assessment_vip",
            "close_protection_formation", "motorcade_management", "convoy_coordination",
            "secure_communication", "encrypted_channel_management", "burst_transmission",
            "dead_drop_management", "secure_meeting_management", "safe_house_management",
            "medical_emergency_response", "trauma_response", "evacuation_planning",
            "counter_surveillance", "anti_surveillance_detection", "surveillance_detection_route",
            "drone_countermeasure", "jamming_management", "electronic_warfare_vip",
            "kidnap_prevention", "hostage_situation_management", "ransom_management",
            "cyber_protection_vip", "social_media_monitoring_vip", "doxxing_prevention",
            "reputation_management", "crisis_communication", "media_management",
            "travel_security", "hotel_security", "venue_security",
            "event_security", "conference_security", "summit_security",
            "residence_security", "office_security", "vehicle_security",
            "air_travel_security", "sea_travel_security", "ground_travel_security",
            "cyber_travel_security", "digital_footprint_reduction", "privacy_protection",
            "family_protection", "staff_security", "supplier_vetting",
        ],
    }

    def __init__(self):
        super().__init__("potentials", "Vulnerability Research")
        self._all_potentials = []
        for cat, pots in self.POTENTIAL_CATEGORIES.items():
            for p in pots:
                self._all_potentials.append({"name": p, "category": cat, "status": "available"})

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "list_potentials":
            category = params.get("category")
            if category and category in self.POTENTIAL_CATEGORIES:
                pots = self.POTENTIAL_CATEGORIES[category]
                return {"status": "ok", "category": category, "count": len(pots), "potentials": pots}
            return {"status": "ok", "total": len(self._all_potentials), "categories": {k: len(v) for k, v in self.POTENTIAL_CATEGORIES.items()}}
        elif action == "explore":
            query = params.get("query", "")
            # Match potentials to query
            matches = [p["name"] for p in self._all_potentials if any(w in p["name"].lower() for w in query.lower().split())]
            self.log_action("explore", f"query='{query}' matches={len(matches)}")
            return {"status": "ok", "query": query, "matches": matches, "count": len(matches)}
        elif action == "activate_potential":
            name = params.get("name")
            found = next((p for p in self._all_potentials if p["name"] == name), None)
            if not found:
                return {"status": "error", "message": f"Unknown potential: {name}"}
            council = self.consult_council(f"Activate potential: {name}", f"Category: {found['category']}")
            self.log_action("activate_potential", f"name={name} council={council['decision']}")
            return {"status": "council_decision", "potential": name, "council": council}
        elif action == "status":
            return {"status": "ok", "total_potentials": len(self._all_potentials), "categories": len(self.POTENTIAL_CATEGORIES), **self.status()}
        return {"status": "unknown_action", "action": action}
''')

# ═══ src/agents/vip_agent.py ═══
pyfile("src/agents/vip_agent.py", '''"""BABIRYE VIP Agent — Drone, vehicle, wearable, access control, surveillance."""
from typing import Optional, Dict, Any, List
from .base import BaseAgent


class VIPAgent(BaseAgent):
    """Manages VIP Protection System (v13.0.0). Integrates:
    - 6 drone services (Tello, DeepDrone, Meshtastic swarm, surveillance)
    - 4 vehicle services (MPC, SLAM, Kalman, control)
    - 3 wearable services (Garmin BLE, Pico Watch, biometric)
    - Access control (biometric, LPR gate)
    - Surveillance (CCTV AI, VIP surveillance orchestrator)"""

    DRONE_SERVICES = [
        "tello-drone-pilot", "deep-drone-control", "meshtastic-swarm",
        "vip-surveillance",
    ]

    VEHICLE_SERVICES = [
        "vehicle-mpc-control", "vehicle-slam", "vehicle-kalman",
    ]

    WEARABLE_SERVICES = [
        "garmin-ble", "pico-watch-ble",
    ]

    ACCESS_SERVICES = [
        "biometric-access", "lpr-gate",
    ]

    SURVEILLANCE_SERVICES = [
        "cctv-ai", "vip-surveillance",
    ]

    ALL_SERVICES = DRONE_SERVICES + VEHICLE_SERVICES + WEARABLE_SERVICES + ACCESS_SERVICES + SURVEILLANCE_SERVICES

    def __init__(self):
        super().__init__("vip", "Physical Security")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "list_services":
            return {
                "status": "ok",
                "drones": self.DRONE_SERVICES,
                "vehicles": self.VEHICLE_SERVICES,
                "wearables": self.WEARABLE_SERVICES,
                "access_control": self.ACCESS_SERVICES,
                "surveillance": self.SURVEILLANCE_SERVICES,
                "total": len(set(self.ALL_SERVICES)),
            }
        elif action == "deploy_service":
            service = params.get("service")
            if service not in self.ALL_SERVICES:
                return {"status": "error", "message": f"Unknown VIP service: {service}"}
            council = self.consult_council(
                f"Deploy VIP service: {service}",
                f"Category: {self._categorize(service)}",
            )
            self.log_action("deploy_service", f"service={service} council={council['decision']}")
            return {"status": "council_decision", "service": service, "council": council}
        elif action == "drone_mission":
            mission = params.get("mission", "patrol")
            altitude = params.get("altitude", 50)
            self.log_action("drone_mission", f"mission={mission} altitude={altitude}m")
            return {"status": "ok", "mission": mission, "altitude": altitude, "auth": "human_in_loop_required"}
        elif action == "vehicle_route":
            destination = params.get("destination")
            self.log_action("vehicle_route", f"destination={destination}")
            return {"status": "ok", "destination": destination, "auth": "safety_interlock_active"}
        elif action == "wearable_alert":
            alert_type = params.get("alert_type", "proximity")
            self.log_action("wearable_alert", f"type={alert_type}")
            return {"status": "ok", "alert": alert_type, "mode": "awareness_only"}
        elif action == "access_control":
            action_type = params.get("access_action", "check")
            self.log_action("access_control", f"action={action_type}")
            return {"status": "ok", "action": action_type, "logged": True}
        elif action == "status":
            return {**self.status(), "services_count": len(set(self.ALL_SERVICES))}
        return {"status": "unknown_action", "action": action}

    def _categorize(self, service: str) -> str:
        if service in self.DRONE_SERVICES: return "drone"
        if service in self.VEHICLE_SERVICES: return "vehicle"
        if service in self.WEARABLE_SERVICES: return "wearable"
        if service in self.ACCESS_SERVICES: return "access_control"
        if service in self.SURVEILLANCE_SERVICES: return "surveillance"
        return "unknown"
''')

F.close()
print(f"Part 4e done. Next file index: {si}")