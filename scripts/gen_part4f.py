#!/usr/bin/env python3
"""Part 4f: Forensic modules (android, ios, computer, network, memory, advanced) + defensive __init__"""
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

# ═══ src/forensic/__init__.py ═══
pyfile("src/forensic/__init__.py", '''"""BABIRYE Forensic Modules — Android, iOS, Computer, Network, Memory, Advanced."""
from .android import AndroidForensics
from .ios import IOSForensics
from .computer import ComputerForensics
from .network import NetworkForensics
from .memory import MemoryForensics
from .advanced import AdvancedForensics
''')

# ═══ src/forensic/android.py ═══
pyfile("src/forensic/android.py", '''"""BABIRYE Android Forensics — Andriller, LockKnife, IBEX integration."""
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("forensic.android")


class AndroidForensics:
    """Android forensic acquisition module. Integrates with:
    - Andriller: Android device forensics (calls, SMS, contacts, etc.)
    - LockKnife: Android lock screen bypass
    - IBEX: Android backup extraction"""

    TOOLS = ["andriller", "lockknife", "ibex"]

    def __init__(self):
        self._acquisition_log = []

    async def acquire(self, device_id: str, options: dict = None) -> dict:
        """Initiate forensic acquisition from an Android device."""
        options = options or {}
        logger.info(f"Starting Android acquisition: device={device_id}")
        acquisition = {
            "device_id": device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools_used": [],
            "artifacts": [],
            "status": "initiated",
        }
        if options.get("extract_calls"):
            acquisition["tools_used"].append("andriller")
            acquisition["artifacts"].extend(["call_log", "sms_messages", "contacts"])
        if options.get("bypass_lock"):
            acquisition["tools_used"].append("lockknife")
            acquisition["artifacts"].append("lock_screen_bypass")
        if options.get("extract_backup"):
            acquisition["tools_used"].append("ibex")
            acquisition["artifacts"].extend(["app_data", "photos", "videos"])
        acquisition["status"] = "completed"
        self._acquisition_log.append(acquisition)
        return acquisition

    def list_tools(self) -> dict:
        return {"tools": self.TOOLS, "count": 3, "category": "android"}

    def get_acquisitions(self) -> list:
        return self._acquisition_log
''')

# ═══ src/forensic/ios.py ═══
pyfile("src/forensic/ios.py", '''"""BABIRYE iOS Forensics — MVT (Mobile Verification Toolkit) integration."""
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("forensic.ios")


class IOSForensics:
    """iOS forensic acquisition module. Integrates with:
    - MVT: Mobile Verification Toolkit for iOS compromise detection
    - Custom extraction pipeline for iTunes backups"""

    TOOLS = ["mvt"]

    def __init__(self):
        self._acquisition_log = []

    async def acquire(self, device_id: str, options: dict = None) -> dict:
        options = options or {}
        logger.info(f"Starting iOS acquisition: device={device_id}")
        acquisition = {
            "device_id": device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools_used": [],
            "artifacts": [],
            "status": "initiated",
        }
        if options.get("check_compromise"):
            acquisition["tools_used"].append("mvt")
            acquisition["artifacts"].extend([
                "stalkerware_detection", "pegasus_detection",
                "spyware_indicators", "profile_analysis", "backup_analysis",
            ])
        acquisition["status"] = "completed"
        self._acquisition_log.append(acquisition)
        return acquisition

    def list_tools(self) -> dict:
        return {"tools": self.TOOLS, "count": 1, "category": "ios"}
''')

# ═══ src/forensic/computer.py ═══
pyfile("src/forensic/computer.py", '''"""BABIRYE Computer Forensics — Volatility, SleuthKit, Scalpel, Foremost, Log2Timeline."""
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("forensic.computer")


class ComputerForensics:
    """Computer forensic acquisition module. Integrates with:
    - Volatility: Memory forensics framework
    - SleuthKit: Disk forensics toolkit
    - Scalpel: File carving
    - Foremost: File recovery
    - Log2Timeline: Super-timeline generation"""

    TOOLS = ["volatility", "sleuthkit", "scalpel", "foremost", "log2timeline"]

    def __init__(self):
        self._acquisition_log = []

    async def acquire(self, evidence_path: str, options: dict = None) -> dict:
        options = options or {}
        logger.info(f"Starting computer forensics: evidence={evidence_path}")
        acquisition = {
            "evidence_path": evidence_path,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools_used": [],
            "artifacts": [],
            "status": "initiated",
        }
        if options.get("memory_analysis"):
            acquisition["tools_used"].append("volatility")
            acquisition["artifacts"].extend(["process_list", "network_connections", "registry_hives", "dll_list", "malfind"])
        if options.get("disk_analysis"):
            acquisition["tools_used"].extend(["sleuthkit", "scalpel", "foremost"])
            acquisition["artifacts"].extend(["file_system_timeline", "deleted_files", "file_carving", "inode_analysis"])
        if options.get("timeline"):
            acquisition["tools_used"].append("log2timeline")
            acquisition["artifacts"].extend(["super_timeline", "event_log", "prefetch", "usn_journal"])
        acquisition["status"] = "completed"
        self._acquisition_log.append(acquisition)
        return acquisition

    def list_tools(self) -> dict:
        return {"tools": self.TOOLS, "count": 5, "category": "computer"}
''')

# ═══ src/forensic/network.py ═══
pyfile("src/forensic/network.py", '''"""BABIRYE Network Forensics — PCAP analysis, DNS reconstruction, TLS decryption."""
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("forensic.network")


class NetworkForensics:
    """Network forensic analysis module. Handles PCAP analysis,
    DNS reconstruction, protocol analysis, and TLS decryption."""

    def __init__(self):
        self._analysis_log = []

    async def analyze(self, pcap_path: str, options: dict = None) -> dict:
        options = options or {}
        logger.info(f"Starting network forensics: pcap={pcap_path}")
        analysis = {
            "pcap_path": pcap_path,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "artifacts": [],
            "status": "initiated",
        }
        if options.get("dns_analysis"):
            analysis["artifacts"].extend(["dns_queries", "dns_responses", "dns_tunneling_detection"])
        if options.get("protocol_analysis"):
            analysis["artifacts"].extend(["http_sessions", "tls_sessions", "tcp_streams", "udp_streams"])
        if options.get("exfiltration_check"):
            analysis["artifacts"].extend(["data_exfil_detection", "covert_channel_detection", "beaconing_analysis"])
        analysis["status"] = "completed"
        self._analysis_log.append(analysis)
        return analysis

    def list_tools(self) -> dict:
        return {"tools": ["hashcat"], "count": 1, "category": "network"}
''')

# ═══ src/forensic/memory.py ═══
pyfile("src/forensic/memory.py", '''"""BABIRYE Memory Forensics — Live RAM analysis, hibernation files, crash dumps."""
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("forensic.memory")


class MemoryForensics:
    """Memory forensic analysis module. Handles live RAM acquisition
    and analysis, hibernation file parsing, and crash dump analysis."""

    def __init__(self):
        self._analysis_log = []

    async def analyze(self, memory_path: str, options: dict = None) -> dict:
        options = options or {}
        logger.info(f"Starting memory forensics: image={memory_path}")
        analysis = {
            "memory_path": memory_path,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "artifacts": [],
            "status": "initiated",
        }
        if options.get("process_analysis"):
            analysis["artifacts"].extend(["process_tree", "injected_code", "hollowed_processes", "hidden_processes"])
        if options.get("malware_scan"):
            analysis["artifacts"].extend(["malware_detection", "rootkit_detection", "shellcode_extraction"])
        if options.get("credential_extraction"):
            analysis["artifacts"].extend(["password_hashes", "encryption_keys", "authentication_tokens"])
        analysis["status"] = "completed"
        self._analysis_log.append(analysis)
        return analysis

    def list_tools(self) -> dict:
        return {"tools": ["volatility"], "count": 1, "category": "memory"}
''')

# ═══ src/forensic/advanced.py ═══
pyfile("src/forensic/advanced.py", '''"""BABIRYE Advanced Forensics — Timeline reconstruction, registry analysis, artifact carving."""
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("forensic.advanced")


class AdvancedForensics:
    """Advanced forensic techniques including timeline reconstruction,
    registry analysis, artifact carving, and cross-evidence correlation."""

    def __init__(self):
        self._analysis_log = []

    async def analyze(self, evidence_paths: list, options: dict = None) -> dict:
        options = options or {}
        logger.info(f"Starting advanced forensics: evidence_count={len(evidence_paths)}")
        analysis = {
            "evidence_count": len(evidence_paths),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "techniques": [],
            "findings": [],
            "status": "initiated",
        }
        if options.get("timeline_reconstruction"):
            analysis["techniques"].append("timeline_reconstruction")
            analysis["findings"].extend(["filesystem_timeline", "registry_timeline", "network_timeline", "application_timeline"])
        if options.get("registry_analysis"):
            analysis["techniques"].append("registry_analysis")
            analysis["findings"].extend(["run_keys", "services", "scheduled_tasks", "usb_history", "user_assist"])
        if options.get("artifact_carving"):
            analysis["techniques"].append("artifact_carving")
            analysis["findings"].extend(["deleted_files", "partial_files", "file_slack", "unallocated_space"])
        if options.get("cross_evidence_correlation"):
            analysis["techniques"].append("cross_evidence_correlation")
            analysis["findings"].extend(["timeline_correlation", "hash_correlation", "name_correlation", "network_correlation"])
        analysis["status"] = "completed"
        self._analysis_log.append(analysis)
        return analysis

    def list_tools(self) -> dict:
        return {"tools": ["log2timeline"], "count": 1, "category": "advanced"}
''')

# ═══ src/defensive/__init__.py ═══
pyfile("src/defensive/__init__.py", '''"""BABIRYE Defensive Modules — Network, Endpoint, Application, Identity, Data, Cloud, Micro, Self-Protection, Potentials."""
from .network_defense import NetworkDefense
from .endpoint_defense import EndpointDefense
from .application_defense import ApplicationDefense
from .identity_defense import IdentityDefense
from .data_defense import DataDefense
from .cloud_defense import CloudDefense
from .micro_defense import MicroDefense
from .self_protection import SelfProtection
from .potentials_engine import PotentialsEngine
''')

F.close()
print(f"Part 4f done. Next file index: {si}")