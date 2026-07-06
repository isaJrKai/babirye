"""BABIRYE Sensors Agent — 31 sensor types, 80+ weapons, 25 martial arts."""
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
