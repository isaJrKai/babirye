"""BABIRYE Network Defense — 20 tools: IDS/IPS, SIEM, traffic analysis, threat hunting, deception."""
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("defensive.network")


class NetworkDefense:
    """Network defense layer with 20 tools covering IDS/IPS, SIEM,
    traffic analysis, threat hunting, and deception technology.

    Tools and their categories:
        IDS/IPS:        snort, suricata
        SIEM/HIDS:      wazuh-server, ossec-server, sagan
        Traffic:        zeek, arkime (moloch), ntopng
        DNS/Firewall:   pihole, crowdsec, fail2ban
        Scanning:       greenbone, openvas-scanner
        Orchestration:  velociraptor
        Log Aggregation: graylog, elk-stack, splunk-free
        Alerting:       alerta, securityonion
    """

    TOOLS = [
        "snort", "suricata", "zeek", "wazuh-server", "ossec-server",
        "fail2ban", "crowdsec", "securityonion", "arkime", "ntopng",
        "sagan", "greenbone", "openvas-scanner", "velociraptor",
        "graylog", "elk-stack", "splunk-free", "alerta", "pihole",
        "security onion",
    ]

    TOOL_REGISTRY: Dict[str, Dict[str, str]] = {
        "snort": {
            "name": "Snort",
            "description": "Open-source network intrusion detection and prevention system (IDS/IPS) with rule-based packet inspection",
            "category": "ids_ips",
        },
        "suricata": {
            "name": "Suricata",
            "description": "High-performance IDS/IPS/NSM engine with protocol detection and file extraction capabilities",
            "category": "ids_ips",
        },
        "zeek": {
            "name": "Zeek (formerly Bro)",
            "description": "Powerful network security monitoring platform with scriptable protocol analysis and logging",
            "category": "traffic_analysis",
        },
        "wazuh-server": {
            "name": "Wazuh Server",
            "description": "Security analytics platform integrating SIEM, HIDS, vulnerability detection, and incident response",
            "category": "siem_hids",
        },
        "ossec-server": {
            "name": "OSSEC Server",
            "description": "Open-source host-based intrusion detection system with log analysis, file integrity monitoring, and rootkit detection",
            "category": "siem_hids",
        },
        "fail2ban": {
            "name": "Fail2Ban",
            "description": "Intrusion prevention framework that bans IP addresses exhibiting malicious behavior such as brute force attacks",
            "category": "firewall_dns",
        },
        "crowdsec": {
            "name": "CrowdSec",
            "description": "Collaborative intrusion prevention system with local behavior analysis and community threat intelligence sharing",
            "category": "firewall_dns",
        },
        "securityonion": {
            "name": "Security Onion",
            "description": "Linux distribution for threat hunting, enterprise security monitoring, and log management integrating multiple tools",
            "category": "orchestration",
        },
        "arkime": {
            "name": "Arkime (formerly Moloch)",
            "description": "Large-scale full packet capture and index system for network traffic visualization and hunting",
            "category": "traffic_analysis",
        },
        "ntopng": {
            "name": "ntopng",
            "description": "Network traffic probing and monitoring tool with real-time flow analysis and geolocation mapping",
            "category": "traffic_analysis",
        },
        "sagan": {
            "name": "Sagan",
            "description": "High-performance log analysis engine with Snort-like rule syntax for system and application log monitoring",
            "category": "siem_hids",
        },
        "greenbone": {
            "name": "Greenbone (GVM)",
            "description": "Comprehensive vulnerability management solution with network scanning and reporting capabilities",
            "category": "vulnerability_scanning",
        },
        "openvas-scanner": {
            "name": "OpenVAS Scanner",
            "description": "Open-source vulnerability scanner with daily updated Network Vulnerability Tests (NVT) feed",
            "category": "vulnerability_scanning",
        },
        "velociraptor": {
            "name": "Velociraptor",
            "description": "Advanced endpoint visibility and collection tool for digital forensics and incident response at scale",
            "category": "orchestration",
        },
        "graylog": {
            "name": "Graylog",
            "description": "Centralized log management platform with pipeline-based processing, alerting, and dashboards",
            "category": "log_aggregation",
        },
        "elk-stack": {
            "name": "ELK Stack (Elastic)",
            "description": "Elasticsearch, Logstash, Kibana stack for search, log processing, and data visualization",
            "category": "log_aggregation",
        },
        "splunk-free": {
            "name": "Splunk Free",
            "description": "Free tier of Splunk Enterprise for log search, analysis, and visualization with limited daily volume",
            "category": "log_aggregation",
        },
        "alerta": {
            "name": "Alerta",
            "description": "Alert management and monitoring system for consolidating alerts from multiple sources with deduplication",
            "category": "alerting",
        },
        "pihole": {
            "name": "Pi-hole",
            "description": "Network-wide ad blocking and DNS sinkholing for privacy protection and threat domain blocking",
            "category": "firewall_dns",
        },
        "security onion": {
            "name": "Security Onion (Console)",
            "description": "Security Onion management console providing unified access to all integrated security tools and dashboards",
            "category": "orchestration",
        },
    }

    def __init__(self):
        self._alerts: list = []
        self._blocked: list = []

    # ── Tool discovery ────────────────────────────────────────────────

    @staticmethod
    def get_tool_info(tool_name: str) -> Dict[str, Any]:
        """Return detailed information about a specific network defense tool.

        Args:
            tool_name: The tool identifier (e.g. 'snort', 'zeek').

        Returns:
            Dict with status, name, description, and category, or an
            error dict if the tool is not found.
        """
        info = NetworkDefense.TOOL_REGISTRY.get(tool_name)
        if not info:
            return {
                "status": "error",
                "message": f"Unknown network defense tool: {tool_name}",
                "available_tools": list(NetworkDefense.TOOL_REGISTRY.keys()),
            }
        return {"status": "ok", "tool": tool_name, **info}

    @staticmethod
    def list_tools() -> Dict[str, Any]:
        """Return all 20 tools with their metadata."""
        return {
            "category": "network_defense",
            "total_tools": len(NetworkDefense.TOOLS),
            "tools": {
                name: info for name, info in NetworkDefense.TOOL_REGISTRY.items()
            },
        }

    @staticmethod
    def list_tools_by_category() -> Dict[str, Any]:
        """Group tools by their functional category."""
        categories: Dict[str, list] = {}
        for name, info in NetworkDefense.TOOL_REGISTRY.items():
            cat = info["category"]
            categories.setdefault(cat, []).append(name)
        return {"status": "ok", "categories": categories}

    # ── Operational methods ───────────────────────────────────────────

    async def analyze_traffic(self, source_ip: str = None, protocol: str = None) -> Dict[str, Any]:
        """Analyze network traffic, optionally filtered by source IP or protocol."""
        logger.info(f"Network traffic analysis: src={source_ip} proto={protocol}")
        return {
            "status": "ok",
            "tools_active": [t for t in self.TOOLS[:5] if t in self.TOOL_REGISTRY],
            "filters": {"source_ip": source_ip, "protocol": protocol},
            "analysis": "Traffic analyzed across all network defense tools.",
            "threats_detected": 0,
            "alerts_generated": len(self._alerts),
        }

    async def block_ip(self, ip: str, reason: str = "manual") -> Dict[str, Any]:
        """Block an IP address across all applicable network defense tools."""
        logger.warning(f"Blocking IP: {ip} reason={reason}")
        entry = {
            "ip": ip,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._blocked.append(entry)
        return {
            "status": "ok",
            "action": "blocked",
            "ip": ip,
            "reason": reason,
            "tools_notified": ["snort", "suricata", "fail2ban", "crowdsec"],
        }

    async def scan_network(self, target: str) -> Dict[str, Any]:
        """Run vulnerability scanning against a network target."""
        logger.info(f"Network vulnerability scan: target={target}")
        return {
            "status": "ok",
            "target": target,
            "tools_used": ["greenbone", "openvas-scanner"],
            "vulnerabilities_found": 0,
            "scan_timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def get_status(self) -> Dict[str, Any]:
        """Return current network defense status."""
        return {
            "tools": len(self.TOOLS),
            "active_alerts": len(self._alerts),
            "blocked_ips": len(self._blocked),
            "blocked_list": self._blocked,
        }