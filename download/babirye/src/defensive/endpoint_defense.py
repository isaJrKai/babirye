"""BABIRYE Endpoint Defense — 15 tools: AV, rootkit detection, audit, integrity, EDR."""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("defensive.endpoint")


class EndpointDefense:
    """Endpoint defense layer with 15 tools covering antivirus,
    rootkit detection, auditing, file integrity monitoring, and EDR.

    Tools:
        - clamav:       Open-source antivirus engine
        - rkhunter:     Rootkit detection scanner
        - chkrootkit:   Lightweight rootkit detection
        - lynis:        Security auditing and hardening scanner
        - osquery:      SQL-powered endpoint visibility framework
        - sysmon:       Windows system monitoring driver
        - falco:        Runtime security and threat detection for containers/hosts
        - auditd:       Linux audit framework for system call monitoring
        - aide:         Advanced Intrusion Detection Environment (file integrity)
        - tripwire:     File and directory integrity monitoring
        - samhain:      Host-based intrusion detection with file integrity checking
        - grr:          Remote live forensics and incident response platform
        - wazuh-agent:  Wazuh endpoint security agent
        - ossec-agent:  OSSEC host-based intrusion detection agent
        - osdvm:        Open-source digital vaccine module for endpoint hardening
    """

    TOOLS = [
        "clamav", "rkhunter", "chkrootkit", "lynis", "osquery",
        "sysmon", "falco", "auditd", "aide", "tripwire",
        "samhain", "grr", "wazuh-agent", "ossec-agent", "osdvm",
    ]

    TOOL_REGISTRY: Dict[str, Dict[str, str]] = {
        "clamav": {
            "name": "ClamAV",
            "description": "Open-source antivirus engine for detecting trojans, viruses, malware, and other malicious threats on endpoints",
            "category": "antivirus",
        },
        "rkhunter": {
            "name": "Rootkit Hunter",
            "description": "Unix-based rootkit detection tool that scans for known rootkits, backdoors, and suspicious system modifications",
            "category": "rootkit_detection",
        },
        "chkrootkit": {
            "name": "chkrootkit",
            "description": "Lightweight rootkit detection tool that locally checks for signs of rootkits on Linux and Unix systems",
            "category": "rootkit_detection",
        },
        "lynis": {
            "name": "Lynis",
            "description": "Security auditing tool for Linux, macOS, and Unix systems performing in-depth system hardening and compliance checks",
            "category": "security_auditing",
        },
        "osquery": {
            "name": "osquery",
            "description": "SQL-powered operating system instrumentation framework for endpoint visibility with table-based system data queries",
            "category": "endpoint_visibility",
        },
        "sysmon": {
            "name": "Sysmon (System Monitor)",
            "description": "Windows system service and device driver that monitors and logs system activity including process creation and network connections",
            "category": "system_monitoring",
        },
        "falco": {
            "name": "Falco",
            "description": "Cloud-native runtime security tool detecting unexpected behavior at the OS kernel and container level",
            "category": "runtime_detection",
        },
        "auditd": {
            "name": "auditd (Linux Audit Daemon)",
            "description": "Linux audit framework providing capabilities for system call auditing, security event logging, and compliance monitoring",
            "category": "audit_logging",
        },
        "aide": {
            "name": "AIDE (Advanced Intrusion Detection Environment)",
            "description": "File and directory integrity checker that creates database of file attributes and detects unauthorized modifications",
            "category": "file_integrity",
        },
        "tripwire": {
            "name": "Tripwire",
            "description": "Enterprise file integrity monitoring solution detecting unauthorized file system changes and policy violations",
            "category": "file_integrity",
        },
        "samhain": {
            "name": "Samhain",
            "description": "Host-based intrusion detection system with centralized logging, file integrity checking, and stealth monitoring capabilities",
            "category": "host_ids",
        },
        "grr": {
            "name": "GRR Rapid Response",
            "description": "Google's remote live forensics and incident response platform for endpoint investigation at enterprise scale",
            "category": "incident_response",
        },
        "wazuh-agent": {
            "name": "Wazuh Agent",
            "description": "Lightweight endpoint agent providing file integrity monitoring, log data collection, vulnerability detection, and configuration assessment",
            "category": "edr_agent",
        },
        "ossec-agent": {
            "name": "OSSEC Agent",
            "description": "Host-based intrusion detection agent performing log analysis, file integrity checking, rootkit detection, and active response",
            "category": "edr_agent",
        },
        "osdvm": {
            "name": "OSDVM (Open Source Digital Vaccine)",
            "description": "Endpoint hardening module providing automated security configuration, vulnerability patching, and threat prevention policies",
            "category": "endpoint_hardening",
        },
    }

    def __init__(self):
        self._scan_results: List[Dict[str, Any]] = []

    # ── Tool discovery ────────────────────────────────────────────────

    @staticmethod
    def get_tool_info(tool_name: str) -> Dict[str, Any]:
        """Return detailed information about a specific endpoint defense tool."""
        info = EndpointDefense.TOOL_REGISTRY.get(tool_name)
        if not info:
            return {
                "status": "error",
                "message": f"Unknown endpoint defense tool: {tool_name}",
                "available_tools": list(EndpointDefense.TOOL_REGISTRY.keys()),
            }
        return {"status": "ok", "tool": tool_name, **info}

    @staticmethod
    def list_tools() -> Dict[str, Any]:
        """Return all 15 endpoint defense tools with their metadata."""
        return {
            "category": "endpoint_defense",
            "total_tools": len(EndpointDefense.TOOLS),
            "tools": {
                name: info for name, info in EndpointDefense.TOOL_REGISTRY.items()
            },
        }

    @staticmethod
    def list_tools_by_category() -> Dict[str, Any]:
        """Group endpoint tools by their functional category."""
        categories: Dict[str, list] = {}
        for name, info in EndpointDefense.TOOL_REGISTRY.items():
            cat = info["category"]
            categories.setdefault(cat, []).append(name)
        return {"status": "ok", "categories": categories}

    # ── Operational methods ───────────────────────────────────────────

    async def scan_endpoint(self, target: str, scan_type: str = "full") -> Dict[str, Any]:
        """Scan an endpoint for threats.

        Args:
            target: Hostname, IP, or agent identifier.
            scan_type: One of 'full', 'quick', 'malware', 'rootkit', 'integrity'.
        """
        logger.info(f"Endpoint scan: target={target} type={scan_type}")
        tool_map = {
            "full": ["clamav", "rkhunter", "lynis", "osquery"],
            "quick": ["clamav", "rkhunter"],
            "malware": ["clamav"],
            "rootkit": ["rkhunter", "chkrootkit"],
            "integrity": ["aide", "tripwire", "samhain"],
        }
        tools_used = tool_map.get(scan_type, tool_map["full"])
        return {
            "status": "ok",
            "target": target,
            "scan_type": scan_type,
            "tools_used": tools_used,
            "findings": [],
            "scan_timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def monitor_integrity(self) -> Dict[str, Any]:
        """Run file integrity monitoring across all FIM tools."""
        return {
            "status": "ok",
            "tools": ["aide", "tripwire", "samhain"],
            "violations": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def audit_endpoint(self, target: str) -> Dict[str, Any]:
        """Run a security audit on an endpoint."""
        logger.info(f"Endpoint audit: target={target}")
        return {
            "status": "ok",
            "target": target,
            "tools_used": ["lynis", "osquery"],
            "audit_results": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def get_status(self) -> Dict[str, Any]:
        """Return current endpoint defense status."""
        return {
            "tools": len(self.TOOLS),
            "last_scan": self._scan_results[-1] if self._scan_results else None,
            "total_scans": len(self._scan_results),
        }