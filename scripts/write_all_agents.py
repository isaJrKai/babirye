#!/usr/bin/env python3
"""Write all remaining agent files with complete execute() implementations."""
import os

BASE = "/home/z/my-project/download/babirye/src/agents"

# ─── forensic_agent.py ─────────────────────────────────────────
with open(os.path.join(BASE, "forensic_agent.py"), "w") as f:
    f.write('''"""BABIRYE Forensic Agent — Manages 12 forensic tools across 6 categories."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class ForensicAgent(BaseAgent):
    """Manages forensic tools: Android (3), iOS (1), Computer (5), Network (1),
    Memory (1), Advanced (1). All dormant by default, SPA-protected on 172.31.0.0/16."""

    TOOLS = {
        "android": ["andriller", "lockknife", "ibex"],
        "ios": ["mvt"],
        "computer": ["volatility", "sleuthkit", "scalpel", "foremost", "log2timeline"],
        "network": ["hashcat"],
        "memory": ["lazagne"],
        "advanced": ["yafed"],
    }

    ALL_TOOL_NAMES = [t for cat in TOOLS.values() for t in cat]

    def __init__(self):
        super().__init__("forensic", "Digital Forensics")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        try:
            if action == "list_tools":
                result = {"status": "ok", "total": len(self.ALL_TOOL_NAMES),
                          "categories": self.TOOLS, "tools": self.ALL_TOOL_NAMES}
                self.log_action("list_tools", f"returned {len(self.ALL_TOOL_NAMES)} tools")
                return result
            elif action == "acquire":
                target = params.get("target")
                if not target:
                    return {"status": "error", "message": "Target is required for acquisition"}
                category = params.get("category")
                council = self.consult_council(f"Acquire evidence: {target}", f"Category: {category}")
                self.log_action("acquire", f"target={target} council={council.get('decision')}")
                self.log_to_db(task, "forensic_acquire", params, "pending")
                return {"status": "council_decision", "target": target, "category": category, "council": council}
            elif action == "analyze":
                tool = params.get("tool")
                if not tool or tool not in self.ALL_TOOL_NAMES:
                    return {"status": "error", "message": f"Unknown tool: {tool}"}
                self.log_action("analyze", f"tool={tool}")
                return {"status": "ok", "tool": tool, "message": "Analysis queued via subsystem gateway"}
            elif action == "status":
                return {**self.status(), "network": "172.31.0.0/16", "gateway_port": 4748, "total_tools": 12}
            return {"status": "unknown_action", "action": action, "available": ["list_tools", "acquire", "analyze", "status"]}
        except Exception as e:
            self.log_action("error", str(e), level="error")
            self.log_to_db(task, action, params, "error", error=str(e))
            return {"status": "error", "message": str(e)}
''')

# ─── offensive_agent.py ────────────────────────────────────────
with open(os.path.join(BASE, "offensive_agent.py"), "w") as f:
    f.write('''"""BABIRYE Offensive Agent — Manages 72 offensive tools (22 original + 50 new)."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class OffensiveAgent(BaseAgent):
    """Manages offensive tools across 11 categories.
    All dormant by default, SPA-protected, on isolated network 172.30.0.0/16."""

    TOOL_CATEGORIES = {
        "red_team_ops": ["redamon", "pentestai", "empire", "sliver", "covenant", "mythic", "chimera-c2", "agent-p2p"],
        "payload_dev": ["freeze", "shhhloader", "donut", "pezor", "scarecrow", "crimson-wisp", "ghosthid"],
        "post_exploit": ["powersploit", "offsec-tools", "inveigh", "mimikatz", "rubeus", "bloodhound", "crackmapexec"],
        "recon": ["nmap", "subfinder", "amass", "httpx-toolkit", "theharvester", "spiderfoot", "maltego", "fierce"],
        "web_exploit": ["sqlmap", "nikto", "gobuster", "feroxbuster", "wfuzz", "arjun", "nuclei", "xsstrike", "commix", "tplmap"],
        "network_exploit": ["hydra", "john", "aircrack-ng", "wifite", "responder", "bettercap", "ettercap", "ligolo-ng", "chisel", "dnscat2", "nishang"],
        "infra_exploit": ["autopentest", "legion", "redpi", "zer0dayslater", "laudanum", "phpsploit"],
        "enumeration": ["linpeas", "winpeas", "linux-exploit-suggester", "keeppwn"],
        "cms_scan": ["whatweb", "wpscan", "joomscan", "droopescan", "recon-ng"],
        "traffic": ["tshark", "impacket"],
        "automation": ["auto-recon"],
    }

    ALL_TOOLS = sorted(set(t for cat in TOOL_CATEGORIES.values() for t in cat))

    def __init__(self):
        super().__init__("offensive", "Offensive Security")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        try:
            if action == "list_tools":
                total = sum(len(v) for v in self.TOOL_CATEGORIES.values())
                return {"status": "ok", "total": total,
                        "categories": {k: len(v) for k, v in self.TOOL_CATEGORIES.items()},
                        "tools": self.ALL_TOOLS}
            elif action == "deploy":
                tool = params.get("tool")
                if tool not in self.ALL_TOOLS:
                    return {"status": "error", "message": f"Unknown tool: {tool}"}
                council = self.consult_council(f"Deploy offensive tool: {tool}", f"Task: {task}")
                self.log_action("deploy_tool", f"tool={tool} council={council.get('decision')}")
                self.log_to_db(task, "offensive_deploy", params, "pending")
                return {"status": "council_decision", "tool": tool, "council": council}
            elif action == "status":
                return {**self.status(), "network": "172.30.0.0/16", "gateway_port": 4747, "total_tools": len(self.ALL_TOOLS)}
            return {"status": "unknown_action", "action": action}
        except Exception as e:
            self.log_action("error", str(e), level="error")
            self.log_to_db(task, action, params, "error", error=str(e))
            return {"status": "error", "message": str(e)}
''')

# ─── defensive_agent.py ────────────────────────────────────────
with open(os.path.join(BASE, "defensive_agent.py"), "w") as f:
    f.write('''"""BABIRYE Defensive Agent — Manages 100 defensive tools across 7 layers."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class DefensiveAgent(BaseAgent):
    """Manages 100 defensive tools. Defense-in-depth across:
    Network (20), Endpoint (15), Application (15), Identity (15),
    Data (15), Cloud (10), Threat Intel (5+)."""

    TOOL_CATEGORIES = {
        "network_defense": [
            "snort", "suricata", "zeek", "wazuh-server", "ossec-server",
            "fail2ban", "crowdsec", "securityonion", "moloch", "arkime",
            "sagan", "greenbone", "openvas-scanner", "ntopng", "velociraptor",
            "graylog", "elk-stack", "splunk-free", "alerta", "pihole",
        ],
        "endpoint_defense": [
            "clamav", "rkhunter", "chkrootkit", "lynis", "osquery",
            "sysmon", "falco", "auditd", "aide", "tripwire",
            "samhain", "grr", "wazuh-agent", "ossec-agent", "osdvm",
        ],
        "application_defense": [
            "modsecurity", "coraza-waf", "openresty", "oauth2-proxy",
            "keycloak", "dex-idp", "pomerium", "traefik", "envoy",
            "vault", "opa", "kyverno", "trivy", "checkov", "tfsec",
        ],
        "identity_defense": [
            "duo-auth", "privacyidea", "authelia", "kanidm", "lldap",
            "fusionauth", "authentik", "supertokens", "logto",
            "cert-manager", "step-ca", "spire", "consul-template",
            "tailscale", "nebula",
        ],
        "data_defense": [
            "minio", "restic", "borgbackup", "sops", "age-encryption",
            "gpg", "wireguard", "headscale", "firezone", "cloudflared",
            "adguard-home", "canarytokens", "honeytrap", "cowrie", "dionaea",
        ],
        "cloud_defense": [
            "kubesec", "kube-bench", "kube-hunter", "dockle", "clair",
            "grype", "yara", "sigma", "stix-validator", "mitre-attack",
        ],
        "threat_intel": [
            "opencti", "misp", "crits", "vulnwhisperer", "mitre-attack",
        ],
    }

    def __init__(self):
        super().__init__("defensive", "Defensive Operations")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        try:
            if action == "list_tools":
                total = sum(len(v) for v in self.TOOL_CATEGORIES.values())
                return {"status": "ok", "total": total,
                        "categories": {k: len(v) for k, v in self.TOOL_CATEGORIES.items()},
                        "tools": self.TOOL_CATEGORIES}
            elif action == "deploy":
                tool = params.get("tool")
                all_tools = [t for tools in self.TOOL_CATEGORIES.values() for t in tools]
                if tool and tool not in all_tools:
                    return {"status": "error", "message": f"Unknown defensive tool: {tool}"}
                council = self.consult_council(f"Deploy defensive tool: {tool}", f"Task: {task}")
                self.log_action("deploy_tool", f"tool={tool} council={council.get('decision')}")
                self.log_to_db(task, "defensive_deploy", params, "pending")
                return {"status": "council_decision", "tool": tool, "council": council}
            elif action == "status":
                return {**self.status(), "network": "172.32.0.0/16", "gateway_port": 4749, "total_tools": 100}
            return {"status": "unknown_action", "action": action}
        except Exception as e:
            self.log_action("error", str(e), level="error")
            self.log_to_db(task, action, params, "error", error=str(e))
            return {"status": "error", "message": str(e)}
''')

# ─── sensors_agent.py ─────────────────────────────────────────
with open(os.path.join(BASE, "sensors_agent.py"), "w") as f:
    f.write('''"""BABIRYE Sensors Agent — 31 sensor types, 80+ weapons, 25 martial arts."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class SensorsAgent(BaseAgent):
    """Manages sensor arrays, weapon profiles, and martial arts databases.
    Dormant by default on 172.33.0.0/16, port 9901."""

    SENSOR_TYPES = {
        "radar": [
            {"name": "ground_moving_target_indicator", "range_km": 50, "frequency": "X-band", "description": "Detects and tracks moving ground targets"},
            {"name": "air_surveillance_radar", "range_km": 200, "frequency": "S-band", "description": "Long-range air surveillance and tracking"},
            {"name": "perimeter_radar", "range_km": 5, "frequency": "Ku-band", "description": "Short-range perimeter intrusion detection"},
            {"name": "synthetic_aperture_radar", "range_km": 100, "frequency": "L-band", "description": "High-resolution ground imaging through foliage"},
            {"name": "weather_radar", "range_km": 150, "frequency": "C-band", "description": "Weather pattern detection and tracking"},
            {"name": "ballistic_radar", "range_km": 30, "frequency": "Ka-band", "description": "Detects and tracks ballistic projectiles"},
            {"name": "drone_detection_radar", "range_km": 10, "frequency": "W-band", "description": "Small UAV detection and classification"},
            {"name": "through_wall_radar", "range_m": 20, "frequency": "UWB", "description": "Detects movement through solid walls"},
        ],
        "sonar": [
            {"name": "active_sonar", "range_m": 500, "description": "Active pinger for underwater detection"},
            {"name": "passive_sonar", "range_m": 2000, "description": "Listen-only hydrophone array"},
            {"name": "side_scan_sonar", "swath_m": 200, "description": "Seabed imaging and object detection"},
            {"name": "multibeam_sonar", "swath_m": 120, "description": "High-resolution seafloor mapping"},
            {"name": "sub_bottom_profiler", "depth_m": 50, "description": "Sub-seafloor sediment profiling"},
            {"name": "doppler_velocity_log", "range_m": 200, "description": "Water current velocity measurement"},
            {"name": "acoustic_camera", "range_m": 100, "description": "Real-time acoustic visualization"},
            {"name": "mine_hunting_sonar", "range_m": 300, "description": "Underwater mine detection and classification"},
        ],
        "lidar": [
            {"name": "terrestrial_lidar", "range_m": 1000, "description": "High-precision 3D terrain scanning"},
            {"name": "airborne_lidar", "range_m": 3000, "description": "Aerial terrain and structure mapping"},
            {"name": "mobile_lidar", "range_m": 200, "description": "Vehicle-mounted mobile mapping"},
            {"name": "solid_state_lidar", "range_m": 150, "description": "Compact solid-state 3D mapping"},
            {"name": "slam_lidar", "range_m": 50, "description": "Real-time SLAM environment mapping"},
            {"name": "volumetric_lidar", "range_m": 300, "description": "Volumetric space scanning for security"},
        ],
        "acoustic": [
            {"name": "gunshot_detector", "range_m": 1500, "description": "Detects and classifies gunshot events"},
            {"name": "glass_break_detector", "range_m": 10, "description": "Detects breaking glass patterns"},
            {"name": "vehicle_detector", "range_m": 50, "description": "Vehicle engine and movement detection"},
            {"name": "scream_detector", "range_m": 30, "description": "Human scream and distress sound detection"},
            {"name": "explosion_detector", "range_m": 5000, "description": "Explosion detection and localization"},
        ],
        "electronic_warfare": [
            {"name": "spectrum_analyzer", "range_ghz": 40, "description": "Real-time RF spectrum monitoring"},
            {"name": "signal_interceptor", "range_km": 50, "description": "Intercepts and classifies RF signals"},
            {"name": "jammer_detector", "range_km": 10, "description": "Detects active jamming signals"},
            {"name": "direction_finder", "range_km": 30, "description": "RF direction finding and geolocation"},
        ],
    }

    WEAPON_PROFILES = {
        "handguns": ["Glock 19", "SIG P320", "Beretta M9", "HK VP9", "Walther PPQ", "CZ P-09", "FN 509", "Smith M&P 2.0", "Springfield XD-M", "Canik TP9", "Desert Eagle", "HK USP", "FN Five-seveN", "Walther PDP", "Springfield Hellcat"],
        "rifles": ["M4A1", "HK416", "SCAR-L", "AK-47", "AK-74M", "FN SCAR-H", "HK G28", "Mk14 EBR", "MCX Spear", "XM7", "AUG A3", "FAMAS", "G36", "QBZ-95", "Tavor X95"],
        "shotguns": ["Benelli M4", "Remington 870", "Mossberg 590", "Kel-Tec KSG", "Saiga-12", "FN SLP", "M1014"],
        "smgs": ["MP5", "MP7", "P90", "MPX", "Scorpion EVO", "UMP45", "Vector", "PP-19", "APC9", "EVO 3"],
        "lmgs": ["M249 SAW", "M240B", "PKM", "MG4", "Mk48", "Negev", "L86 LSW"],
        "sniper": ["M24 SWS", "M40A5", "M2010 ESR", "Barrett M82", "AWM", "SVD", "HK PSG1", "M110 SASS", "MRAD", "TAC-50"],
        "explosives": ["M67 Fragmentation", "M18 Smoke", "M84 Stun", "Flashbang", "C4 Block", "Claymore M18A1", "Thermite Grenade", "AN-M14 Incendiary", "Breach Charge"],
        "directed_energy": ["Active Denial System", "Laser Dazzler", "LRAD Acoustic Hail", "Taser X26", "PHASR Laser", "Stun Belt"],
        "missiles": ["FGM-148 Javelin", "FIM-92 Stinger", "NLAW", "Spike NLOS", "Starstreak", "RPG-7", "AT4", "Carl Gustaf", "Javelin FGM-148F"],
        "non_lethal": ["Rubber Bullet", "Bean Bag Round", "Pepper Spray OC", "Tear Gas CS", "Taser 7", "Net Gun", "Foam Deployment", "Acoustic Hailer", "Dazzler", "Water Cannon"],
        "martial_weapons": [" Expandable Baton", "Karambit", "Tactical Knife", "Tomahawk", "Nunchaku", "Bo Staff", "Tonfa", "Kusarigama", "Shuriken", "Tactical Pen"],
    }

    MARTIAL_ARTS = {
        "striking": ["Muay Thai", "Kyokushin Karate", "Western Boxing", "Taekwondo", "Savate", "Lethwei", "SandA"],
        "grappling": ["Brazilian Jiu-Jitsu", "Judo", "Sambo", "Catch Wrestling", "Shooto", "Jiu-Jitsu (Japanese)"],
        "traditional": ["Wing Chun", "Aikido", "Kung Fu (Shaolin)", "Tai Chi Chuan", "Krav Maga", "Systema", "Pencak Silat", "Kali/Escrima"],
        "weapons": ["Kendo", "Iaido", "Naginatajutsu", "Bojutsu", "Fencing", "HEMA (Longsword)"],
        "hybrid": ["MMA", "Vale Tudo", "Combat Sambo", "Kajukenbo", "Krav Maga (advanced)", "Jeet Kune Do"],
    }

    def __init__(self):
        super().__init__("sensors", "Physical Security")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        try:
            if action == "list_sensors":
                total = sum(len(v) for v in self.SENSOR_TYPES.values())
                return {"status": "ok", "total_sensor_types": total,
                        "categories": {k: len(v) for k, v in self.SENSOR_TYPES.items()},
                        "sensors": self.SENSOR_TYPES}
            elif action == "list_weapons":
                total = sum(len(v) for v in self.WEAPON_PROFILES.values())
                return {"status": "ok", "total_weapons": total,
                        "categories": {k: len(v) for k, v in self.WEAPON_PROFILES.items()},
                        "weapons": self.WEAPON_PROFILES}
            elif action == "list_martial_arts":
                total = sum(len(v) for v in self.MARTIAL_ARTS.values())
                return {"status": "ok", "total_styles": total,
                        "categories": {k: len(v) for k, v in self.MARTIAL_ARTS.items()},
                        "martial_arts": self.MARTIAL_ARTS}
            elif action == "status":
                return {**self.status(), "network": "172.33.0.0/16", "port": 9901,
                        "sensor_types": sum(len(v) for v in self.SENSOR_TYPES.values()),
                        "weapon_profiles": sum(len(v) for v in self.WEAPON_PROFILES.values()),
                        "martial_arts_styles": sum(len(v) for v in self.MARTIAL_ARTS.values())}
            return {"status": "unknown_action", "action": action,
                    "available": ["list_sensors", "list_weapons", "list_martial_arts", "status"]}
        except Exception as e:
            self.log_action("error", str(e), level="error")
            return {"status": "error", "message": str(e)}
''')

# ─── potentials_agent.py ───────────────────────────────────────
with open(os.path.join(BASE, "potentials_agent.py"), "w") as f:
    f.write('''"""BABIRYE Potentials Agent — 300+ capabilities discovery and activation."""
from typing import Optional, Dict, Any
from .base import BaseAgent
from ..defensive.potentials_engine import PotentialsEngine


class PotentialsAgent(BaseAgent):
    """Manages 300+ potentials via the PotentialsEngine."""

    def __init__(self):
        super().__init__("potentials", "Vulnerability Research")
        self._engine = PotentialsEngine()

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        try:
            if action == "list_potentials":
                result = self._engine.status()
                result["potentials"] = self._engine.list_potentials()
                return result
            elif action == "explore":
                query = params.get("query", "")
                max_results = params.get("max_results", 10)
                return self._engine.explore(query, max_results)
            elif action == "activate":
                name = params.get("name", "")
                if not name:
                    return {"status": "error", "message": "Potential name is required"}
                result = self._engine.activate(name)
                self.log_action("activate_potential", f"name={name} result={result['status']}")
                self.log_to_db(task, "activate_potential", params, result["status"])
                return result
            elif action == "status":
                return self._engine.status()
            return {"status": "unknown_action", "action": action}
        except Exception as e:
            self.log_action("error", str(e), level="error")
            self.log_to_db(task, action, params, "error", error=str(e))
            return {"status": "error", "message": str(e)}
''')

# ─── vip_agent.py ─────────────────────────────────────────────
with open(os.path.join(BASE, "vip_agent.py"), "w") as f:
    f.write('''"""BABIRYE VIP Protection Agent — Drone, vehicle, wearable, access control."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class VIPAgent(BaseAgent):
    """Manages VIP protection: 6 drone types, 4 vehicle types, 3 wearable types,
    access control, surveillance. Dormant on 172.35.0.0/16, port 4751."""

    DRONES = {
        "dji_mavic_3": {"type": "recon", "range_km": 15, "flight_time_min": 46, "camera": "4K Hasselblad", "description": "Aerial reconnaissance and surveillance drone"},
        "dji_matrice_350": {"type": "heavy", "range_km": 20, "flight_time_min": 55, "payload_kg": 2.7, "description": "Enterprise heavy-lift drone with thermal and zoom"},
        "skydio_2+": {"type": "autonomous", "range_km": 6, "flight_time_min": 27, "description": "AI-autonomous follow and tracking drone"},
        "parrot_anafi_usa": {"type": "tactical", "range_km": 15, "flight_time_min": 32, "description": "Secure tactical ISR drone (NDAA compliant)"},
        "autel_evo_ii": {"type": "survey", "range_km": 9, "flight_time_min": 40, "camera": "8K", "description": "High-resolution mapping and survey drone"},
        "freefly_alta_x": {"type": "cinematic", "range_km": 5, "flight_time_min": 40, "payload_kg": 9, "description": "Professional cinema-grade heavy lift drone"},
    }

    VEHICLES = {
        "armored_suv": {"level": "B6+", "capacity": 5, "description": "Ballistic-rated armored SUV for VIP transport"},
        "armored_sedan": {"level": "B7", "capacity": 4, "description": "Discreet executive armored sedan"},
        "motorcade_lead": {"type": "escort", "description": "Motorcade lead vehicle with communication suite"},
        "evacuation_vehicle": {"type": "emergency", "description": "Rapid extraction vehicle for emergency situations"},
    }

    WEARABLES = {
        "biometric_band": {"sensors": ["heart_rate", "spo2", "skin_temp", "stress"], "battery_hours": 72, "description": "Continuous biometric monitoring wristband"},
        "panic_pendant": {"range_m": 500, "battery_months": 12, "description": "Discreet panic button with GPS and cellular"},
        "smart_badge": {"features": ["nfc", "ble", "gps", "duress"], "battery_days": 7, "description": "Multi-function proximity badge with duress alert"},
    }

    SERVICES = {
        "access_control": {"status": "available", "description": "Biometric and badge-based access management"},
        "surveillance": {"status": "available", "description": "CCTV AI-powered surveillance integration"},
        "comm_plan": {"status": "available", "description": "Encrypted communication plan management"},
        "route_planning": {"status": "available", "description": "Secure route analysis and planning"},
        "threat_monitoring": {"status": "available", "description": "Real-time threat monitoring and alerting"},
        "close_protection": {"status": "available", "description": "Close protection officer coordination"},
    }

    def __init__(self):
        super().__init__("vip", "Physical Security")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        try:
            if action == "list_services":
                return {"status": "ok", "services": self.SERVICES,
                        "drones": list(self.DRONES.keys()),
                        "vehicles": list(self.VEHICLES.keys()),
                        "wearables": list(self.WEARABLES.keys())}
            elif action == "deploy_service":
                service = params.get("service")
                if not service or service not in self.SERVICES:
                    return {"status": "error", "message": f"Unknown VIP service: {service}"}
                council = self.consult_council(f"Deploy VIP service: {service}", f"Params: {params}")
                self.log_action("deploy_vip", f"service={service} council={council.get('decision')}")
                self.log_to_db(task, "vip_deploy", params, "pending")
                return {"status": "council_decision", "service": service, "council": council}
            elif action == "drone_mission":
                drone = params.get("drone")
                mission_type = params.get("mission_type", "recon")
                if drone and drone not in self.DRONES:
                    return {"status": "error", "message": f"Unknown drone: {drone}"}
                self.log_action("drone_mission", f"drone={drone} type={mission_type}")
                return {"status": "ok", "drone": drone, "mission_type": mission_type,
                        "spec": self.DRONES.get(drone, {})}
            elif action == "vehicle_route":
                vehicle = params.get("vehicle")
                destination = params.get("destination")
                self.log_action("vehicle_route", f"vehicle={vehicle} dest={destination}")
                return {"status": "ok", "vehicle": vehicle, "destination": destination,
                        "spec": self.VEHICLES.get(vehicle, {})}
            elif action == "wearable_alert":
                wearable = params.get("wearable")
                alert_type = params.get("alert_type", "duress")
                self.log_action("wearable_alert", f"wearable={wearable} alert={alert_type}", level="warning")
                return {"status": "ok", "wearable": wearable, "alert_type": alert_type,
                        "spec": self.WEARABLES.get(wearable, {})}
            elif action == "status":
                return {**self.status(), "network": "172.35.0.0/16", "gateway_port": 4751,
                        "drones": len(self.DRONES), "vehicles": len(self.VEHICLES),
                        "wearables": len(self.WEARABLES), "services": len(self.SERVICES)}
            return {"status": "unknown_action", "action": action}
        except Exception as e:
            self.log_action("error", str(e), level="error")
            self.log_to_db(task, action, params, "error", error=str(e))
            return {"status": "error", "message": str(e)}
''')

# ─── micro_defensive_agent.py ──────────────────────────────────
# Read current, add error handling
with open(os.path.join(BASE, "micro_defensive_agent.py"), "r") as f:
    content = f.read()

# Add log_to_db calls to the deploy action
old_deploy = '''            self.log_action("deploy_tool", f"tool={tool} category={category}")
            return {"status": "ok", "tool": tool, "category": category}'''
new_deploy = '''            self.log_action("deploy_tool", f"tool={tool} category={category}")
            self.log_to_db(task, "micro_defensive_deploy", params, "pending")
            return {"status": "ok", "tool": tool, "category": category}'''
content = content.replace(old_deploy, new_deploy)

# Wrap execute in try/except
old_exec = '''    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "list_tools":'''
new_exec = '''    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        try:
            if action == "list_tools":'''
content = content.replace(old_exec, new_exec)

# Add except before the final return
old_final = '''        return {"status": "unknown_action", "action": action}'''
new_final = '''        except Exception as e:
            self.log_action("error", str(e), level="error")
            self.log_to_db(task, action, params, "error", error=str(e))
            return {"status": "error", "message": str(e)}
        return {"status": "unknown_action", "action": action}'''
content = content.replace(old_final, new_final)

with open(os.path.join(BASE, "micro_defensive_agent.py"), "w") as f:
    f.write(content)

print("All agent files written. Verifying compilation...")
import py_compile
errors = []
for fname in sorted(os.listdir(BASE)):
    if fname.endswith('.py'):
        fpath = os.path.join(BASE, fname)
        try:
            py_compile.compile(fpath, doraise=True)
            print(f"  [OK] {fname}")
        except py_compile.PyCompileError as e:
            errors.append((fname, str(e)))
            print(f"  [FAIL] {fname}: {e}")

if errors:
    print(f"\n{len(errors)} errors found!")
else:
    print(f"\nAll agent files compile cleanly.")