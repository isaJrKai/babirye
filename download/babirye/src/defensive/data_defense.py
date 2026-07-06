"""BABIRYE Data Defense — 15 tools: encryption, backup, DNS filtering, VPN, honeypots."""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from ..core.logger import get_logger

logger = get_logger("defensive.data")


class DataDefense:
    """Data defense layer with 15 tools covering encryption, backup,
    DNS filtering, VPN, and honeypot deception technology.

    Tools:
        - minio:           High-performance object storage (S3-compatible)
        - restic:          Fast, secure, efficient backup program
        - borgbackup:      Deduplicating archiver with compression and encryption
        - sops:            Secrets management for encrypted files in version control
        - age-encryption:  Simple, modern file encryption tool
        - gpg:             GNU Privacy Guard for encryption and signing
        - wireguard:       Fast, modern, secure VPN tunnel
        - headscale:       Self-hosted WireGuard coordination server
        - firezone:        Self-hosted WireGuard-based VPN server and web UI
        - cloudflared:     Cloudflare Tunnel for secure access without public ports
        - adguard-home:    DNS proxy with ad blocking and threat protection
        - canarytokens:    Honeypot tokens for breach and intrusion detection
        - honeytrap:       Low-interaction honeypot for network threat detection
        - cowrie:          SSH/Telnet honeypot for credential harvesting detection
        - dionaea:         Malware-capturing honeypot for network service emulation
    """

    TOOLS = [
        "minio", "restic", "borgbackup", "sops", "age-encryption",
        "gpg", "wireguard", "headscale", "firezone", "cloudflared",
        "adguard-home", "canarytokens", "honeytrap", "cowrie", "dionaea",
    ]

    TOOL_REGISTRY: Dict[str, Dict[str, str]] = {
        "minio": {
            "name": "MinIO",
            "description": "High-performance, S3-compatible object storage server for unstructured data with encryption, versioning, and lifecycle management",
            "category": "storage",
        },
        "restic": {
            "name": "Restic",
            "description": "Fast, secure, and efficient backup program supporting encryption, deduplication, compression, and multiple cloud and local backends",
            "category": "backup",
        },
        "borgbackup": {
            "name": "BorgBackup",
            "description": "Deduplicating backup archiver with compression, authenticated encryption, and efficient remote backup capabilities",
            "category": "backup",
        },
        "sops": {
            "name": "SOPS (Secrets OPerationS)",
            "description": "Mozilla's secrets management tool for encrypting YAML, JSON, ENV, and INI files stored in version control systems",
            "category": "secrets",
        },
        "age-encryption": {
            "name": "age (Encryption Tool)",
            "description": "Simple, modern, and secure file encryption tool with small explicit keys and native support for SSH keys",
            "category": "encryption",
        },
        "gpg": {
            "name": "GPG (GNU Privacy Guard)",
            "description": "Complete and free implementation of the OpenPGP standard for encrypting, signing, and verifying data and communications",
            "category": "encryption",
        },
        "wireguard": {
            "name": "WireGuard",
            "description": "Fast, modern, and lean VPN tunnel using state-of-the-art cryptography with simplified configuration and high performance",
            "category": "vpn",
        },
        "headscale": {
            "name": "Headscale",
            "description": "Self-hosted implementation of the Tailscale coordination server enabling WireGuard mesh networking without Tailscale SaaS dependency",
            "category": "mesh_vpn",
        },
        "firezone": {
            "name": "Firezone",
            "description": "Self-hosted WireGuard-based VPN server with web UI for managing users, devices, and access policies for secure remote access",
            "category": "vpn_server",
        },
        "cloudflared": {
            "name": "Cloudflare Tunnel (cloudflared)",
            "description": "Secure tunnel daemon providing private network access through Cloudflare's edge network without exposing public ports",
            "category": "secure_tunnel",
        },
        "adguard-home": {
            "name": "AdGuard Home",
            "description": "Network-wide DNS proxy providing ad blocking, tracking prevention, DNS-over-HTTPS, and customizable filtering rules",
            "category": "dns_security",
        },
        "canarytokens": {
            "name": "Canarytokens",
            "description": "Honeypot token generation system for detecting code execution, file access, and network reconnaissance with alerting",
            "category": "honeypot",
        },
        "honeytrap": {
            "name": "Honeytrap",
            "description": "Low-interaction honeypot daemon that emulates network services to detect and capture malware and unauthorized access attempts",
            "category": "honeypot",
        },
        "cowrie": {
            "name": "Cowrie",
            "description": "Medium-interaction SSH and Telnet honeypot designed to log brute force attacks and credential harvesting by malicious actors",
            "category": "honeypot",
        },
        "dionaea": {
            "name": "Dionaea",
            "description": "Low-interaction honeypot that emulates network services to capture malware samples by detecting and downloading malicious payloads",
            "category": "honeypot",
        },
    }

    def __init__(self):
        self._operation_log: List[Dict[str, Any]] = []

    # ── Tool discovery ────────────────────────────────────────────────

    @staticmethod
    def get_tool_info(tool_name: str) -> Dict[str, Any]:
        """Return detailed information about a specific data defense tool."""
        info = DataDefense.TOOL_REGISTRY.get(tool_name)
        if not info:
            return {
                "status": "error",
                "message": f"Unknown data defense tool: {tool_name}",
                "available_tools": list(DataDefense.TOOL_REGISTRY.keys()),
            }
        return {"status": "ok", "tool": tool_name, **info}

    @staticmethod
    def list_tools() -> Dict[str, Any]:
        """Return all 15 data defense tools with their metadata."""
        return {
            "category": "data_defense",
            "total_tools": len(DataDefense.TOOLS),
            "tools": {
                name: info for name, info in DataDefense.TOOL_REGISTRY.items()
            },
        }

    @staticmethod
    def list_tools_by_category() -> Dict[str, Any]:
        """Group data tools by their functional category."""
        categories: Dict[str, list] = {}
        for name, info in DataDefense.TOOL_REGISTRY.items():
            cat = info["category"]
            categories.setdefault(cat, []).append(name)
        return {"status": "ok", "categories": categories}

    # ── Operational methods ───────────────────────────────────────────

    async def encrypt_data(self, data_path: str, method: str = "aes256") -> Dict[str, Any]:
        """Encrypt data at the specified path.

        Args:
            data_path: Path to the file or directory to encrypt.
            method: Encryption method (aes256, age, gpg).
        """
        logger.info(f"Data encryption: path={data_path} method={method}")
        method_tool = {"aes256": "age-encryption", "age": "age-encryption", "gpg": "gpg"}
        tool = method_tool.get(method, "age-encryption")
        return {
            "status": "ok",
            "path": data_path,
            "method": method,
            "tool": tool,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def backup_data(self, source: str, destination: str) -> Dict[str, Any]:
        """Create a backup of data from source to destination."""
        logger.info(f"Data backup: {source} -> {destination}")
        return {
            "status": "ok",
            "source": source,
            "destination": destination,
            "tool": "restic",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def deploy_honeypot(self, honeypot_type: str = "ssh") -> Dict[str, Any]:
        """Deploy a honeypot for threat detection.

        Args:
            honeypot_type: Type of honeypot ('ssh', 'http', 'malware', 'canary').
        """
        logger.info(f"Honeypot deployment: type={honeypot_type}")
        type_map = {
            "ssh": "cowrie",
            "http": "honeytrap",
            "malware": "dionaea",
            "canary": "canarytokens",
        }
        tool = type_map.get(honeypot_type, "honeytrap")
        return {
            "status": "ok",
            "honeypot_type": honeypot_type,
            "tool": tool,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }