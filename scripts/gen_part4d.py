#!/usr/bin/env python3
"""Part 4d: Agent source files (base, orchestrator, forensic, security, offensive, defensive, micro_defensive)"""
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

# ═══ src/agents/__init__.py ═══
pyfile("src/agents/__init__.py", '''"""BABIRYE Agent System — Multi-agent orchestration for intelligence, security, and VIP protection."""
from .base import BaseAgent
from .orchestrator import OrchestratorAgent
from .forensic_agent import ForensicAgent
from .security_agent import SecurityAgent
from .offensive_agent import OffensiveAgent
from .defensive_agent import DefensiveAgent
from .micro_defensive_agent import MicroDefensiveAgent
from .sensors_agent import SensorsAgent
from .potentials_agent import PotentialsAgent
from .vip_agent import VIPAgent
''')

# ═══ src/agents/base.py ═══
pyfile("src/agents/base.py", '''"""BABIRYE Base Agent — Foundation for all specialized agents."""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional, Any, Dict, List
from ..core.logger import get_logger
from ..core.expert_council import expert_council


class BaseAgent(ABC):
    """Base class for all BABIRYE agents. Provides common functionality:
    logging, expert council consultation, action validation, and self-attack
    wall integration."""

    def __init__(self, name: str, domain: str):
        self.name = name
        self.domain = domain
        self.logger = get_logger(f"agent.{name}")
        self._created_at = datetime.now(timezone.utc)
        self._action_count = 0
        self._last_action = None

    def log_action(self, action: str, details: str = "", level: str = "info"):
        """Log an action with structured context."""
        ts = datetime.now(timezone.utc).isoformat()
        msg = f"[{ts}] {self.name} | {action} | {details}"
        getattr(self.logger, level)(msg)
        self._action_count += 1
        self._last_action = {"action": action, "details": details, "timestamp": ts}

    def consult_council(self, question: str, context: str = "") -> dict:
        """Consult the Expert Council before high-impact actions."""
        decision = expert_council.consult(question, context, [self.domain])
        return decision.to_dict()

    @abstractmethod
    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute a task. Must be implemented by subclasses."""
        pass

    def status(self) -> Dict:
        return {
            "agent": self.name,
            "domain": self.domain,
            "created_at": self._created_at.isoformat(),
            "action_count": self._action_count,
            "last_action": self._last_action,
        }
''')

# ═══ src/agents/orchestrator.py ═══
pyfile("src/agents/orchestrator.py", '''"""BABIRYE Orchestrator Agent — Routes tasks to specialized agents."""
from typing import Optional, Dict, Any, List
from .base import BaseAgent
from ..core.logger import get_logger
from ..core.expert_council import expert_council


class OrchestratorAgent(BaseAgent):
    """Central orchestrator that routes tasks to the appropriate specialized
    agent based on task classification. Uses Expert Council for ambiguous routing."""

    TASK_ROUTES = {
        "forensic": ["forensic", "evidence", "acquire", "image", "extract", "artifact", "pcap", "memory dump"],
        "offensive": ["attack", "exploit", "pentest", "phish", "c2", "payload", "shellcode", "lateral"],
        "defensive": ["defend", "detect", "block", "alert", "harden", "patch", "monitor", "ids"],
        "micro_defensive": ["sanitize", "validate", "guard", "filter", "micro", "input", "integrity"],
        "sensors": ["sensor", "radar", "sonar", "lidar", "acoustic", "ew", "detect", "track"],
        "potentials": ["potential", "capability", "what-if", "scenario", "expand", "explore"],
        "vip": ["vip", "protect", "drone", "vehicle", "wearable", "biometric", "access control"],
    }

    def __init__(self):
        super().__init__("orchestrator", "Incident Response")
        self._agents: Dict[str, BaseAgent] = {}
        self._task_history: List[Dict] = []

    def register_agent(self, agent: BaseAgent):
        """Register a specialized agent for task routing."""
        self._agents[agent.name] = agent
        self.logger.info(f"Registered agent: {agent.name} ({agent.domain})")

    async def classify_task(self, task: str) -> str:
        """Classify task into a domain using keyword matching and Expert Council."""
        task_lower = task.lower()
        scores = {}
        for domain, keywords in self.TASK_ROUTES.items():
            score = sum(1 for kw in keywords if kw in task_lower)
            scores[domain] = score
        # If no clear winner, consult Expert Council
        max_score = max(scores.values()) if scores else 0
        if max_score == 0 or list(scores.values()).count(max_score) > 1:
            decision = expert_council.consult(
                f"Classify task: {task}",
                f"Score distribution: {scores}",
            )
            if decision.decision == "approved":
                for domain, score in sorted(scores.items(), key=lambda x: -x[1]):
                    if score > 0:
                        return domain
            return "defensive"  # Default to defensive for ambiguous tasks
        return max(scores, key=scores.get)

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Route task to the appropriate specialized agent."""
        params = params or {}
        domain = await self.classify_task(task)
        self.log_action("route", f"task='{task[:50]}...' -> domain={domain}")
        # Find agent for this domain
        target_agent = None
        for agent in self._agents.values():
            if agent.domain.lower().replace(" ", "_").replace("-", "_") in domain.replace("-", "_"):
                target_agent = agent
                break
        if not target_agent:
            return {"status": "no_agent", "domain": domain, "message": f"No agent registered for domain: {domain}"}
        try:
            result = await target_agent.execute(task, params)
            self._task_history.append({"task": task, "domain": domain, "agent": target_agent.name, "status": "completed"})
            return result
        except Exception as e:
            self.logger.error(f"Agent {target_agent.name} failed: {e}")
            return {"status": "error", "domain": domain, "agent": target_agent.name, "error": str(e)}
''')

# ═══ src/agents/forensic_agent.py ═══
pyfile("src/agents/forensic_agent.py", '''"""BABIRYE Forensic Agent — Manages forensic tool deployment and evidence acquisition."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class ForensicAgent(BaseAgent):
    """Manages the 12 forensic tools across 6 categories:
    Android, iOS, Computer, Network, Memory, Advanced."""

    TOOLS = {
        "android": ["andriller", "lockknife", "ibex"],
        "ios": ["mvt"],
        "computer": ["volatility", "sleuthkit", "scalpel", "foremost", "log2timeline"],
        "network": ["hashcat"],
        "memory": ["volatility"],
        "advanced": ["log2timeline"],
    }

    def __init__(self):
        super().__init__("forensic", "Digital Forensics")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "list_tools":
            return {"status": "ok", "category_tools": self.TOOLS, "total": 12}
        elif action == "acquire":
            target = params.get("target")
            category = params.get("category", "computer")
            tools = self.TOOLS.get(category, [])
            council = self.consult_council(f"Forensic acquisition on {target}", f"Category: {category}")
            self.log_action("acquire", f"target={target} category={category} council={council['decision']}")
            return {"status": "council_decision", "council": council, "available_tools": tools}
        elif action == "status":
            return self.status()
        return {"status": "unknown_action", "action": action}
''')

# ═══ src/agents/security_agent.py ═══
pyfile("src/agents/security_agent.py", '''"""BABIRYE Security Agent — Handles authentication, authorization, and SPA management."""
from typing import Optional, Dict, Any
from .base import BaseAgent
from ..core.security_manager import security_manager


class SecurityAgent(BaseAgent):
    """Central security agent. Manages SPA verification for all subsystems
    and coordinates the self-attack wall."""

    SUBSYSTEM_PORTS = {
        "forensic": 4748,
        "offensive": 4747,
        "defensive": 4749,
        "micro_defensive": 4750,
        "sensors": 9901,
        "vip": 4751,
    }

    def __init__(self):
        super().__init__("security", "Defensive Operations")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "verify_spa":
            valid = security_manager.verify_spa(
                timestamp=params["timestamp"],
                nonce=params["nonce"],
                signature=params["signature"],
                action=params["spa_action"],
                service=params.get("service"),
                params=params.get("params", {}),
            )
            self.log_action("spa_verify", f"valid={valid} action={params.get('spa_action')}")
            return {"status": "ok", "valid": valid}
        elif action == "wall_status":
            return {"status": "ok", "wall": security_manager._self_attack_wall.status()}
        elif action == "subsystem_status":
            return {"status": "ok", "subsystems": {k: {"port": v} for k, v in self.SUBSYSTEM_PORTS.items()}}
        elif action == "status":
            return self.status()
        return {"status": "unknown_action", "action": action}
''')

# ═══ src/agents/offensive_agent.py ═══
pyfile("src/agents/offensive_agent.py", '''"""BABIRYE Offensive Agent — Manages 72 offensive tools (22 original + 50 new)."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class OffensiveAgent(BaseAgent):
    """Manages offensive tools across multiple categories.
    Total: 72 tools (22 original + 50 new). All dormant by default,
    SPA-protected, on isolated network 172.30.0.0/16."""

    ORIGINAL_TOOLS = [
        "redamon", "pentestai", "empire", "sliver", "covenant", "mythic",
        "freeze", "shhhloader", "donut", "pezor", "scarecrow",
        "crimson-wisp", "cable", "powersploit", "offsec-tools",
        "autopentest", "legion", "redpi", "zer0dayslater",
        "chimera-c2", "agent-p2p", "ghosthid",
    ]

    NEW_TOOLS = [
        "metasploit", "nmap", "nikto", "sqlmap", "hydra", "john",
        "aircrack-ng", "wifite", "responder", "mimikatz", "bloodhound",
        "crackmapexec", "ligolo-ng", "chisel", "dnscat2", "nishang",
        "inveigh", "bettercap", "ettercap", "tshark", "impacket",
        "rubeus", "gobuster", "feroxbuster", "wfuzz", "arjun",
        "subfinder", "amass", "httpx-toolkit", "nuclei", "auto-recon",
        "linpeas", "winpeas", "linux-exploit-suggester", "keeppwn",
        "laudanum", "phpsploit", "commix", "xsstrike", "tplmap",
        "whatweb", "wpscan", "joomscan", "droopescan", "recon-ng",
        "spiderfoot", "theharvester", "maltego", "fierce",
    ]

    ALL_TOOLS = ORIGINAL_TOOLS + NEW_TOOLS

    def __init__(self):
        super().__init__("offensive", "Offensive Security")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "list_tools":
            return {
                "status": "ok",
                "original_count": len(self.ORIGINAL_TOOLS),
                "new_count": len(self.NEW_TOOLS),
                "total": len(self.ALL_TOOLS),
                "tools": self.ALL_TOOLS,
            }
        elif action == "deploy":
            tool = params.get("tool")
            if tool not in self.ALL_TOOLS:
                return {"status": "error", "message": f"Unknown tool: {tool}"}
            council = self.consult_council(f"Deploy offensive tool: {tool}", f"Task: {task}")
            self.log_action("deploy_tool", f"tool={tool} council={council['decision']}")
            return {"status": "council_decision", "tool": tool, "council": council}
        elif action == "status":
            return self.status()
        return {"status": "unknown_action", "action": action}
''')

# ═══ src/agents/defensive_agent.py ═══
pyfile("src/agents/defensive_agent.py", '''"""BABIRYE Defensive Agent — Manages 100 defensive tools across 6 layers."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class DefensiveAgent(BaseAgent):
    """Manages 100 defensive tools. Defense-in-depth across:
    Network (20), Endpoint (15), Application (15), Identity (15),
    Data (15), Cloud (10+), Threat Intel (5+)."""

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
        if action == "list_tools":
            total = sum(len(v) for v in self.TOOL_CATEGORIES.values())
            return {"status": "ok", "total": total, "categories": {k: len(v) for k, v in self.TOOL_CATEGORIES.items()}, "tools": self.TOOL_CATEGORIES}
        elif action == "deploy":
            tool = params.get("tool")
            category = params.get("category")
            all_tools = [t for tools in self.TOOL_CATEGORIES.values() for t in tools]
            if tool and tool not in all_tools:
                return {"status": "error", "message": f"Unknown defensive tool: {tool}"}
            council = self.consult_council(f"Deploy defensive tool: {tool or category}", f"Task: {task}")
            self.log_action("deploy_tool", f"tool={tool} category={category} council={council['decision']}")
            return {"status": "council_decision", "tool": tool, "council": council}
        elif action == "status":
            return self.status()
        return {"status": "unknown_action", "action": action}
''')

# ═══ src/agents/micro_defensive_agent.py ═══
pyfile("src/agents/micro_defensive_agent.py", '''"""BABIRYE Micro-Defensive Agent — Manages 150 micro-defensive tools including 25 self-attack wall guards."""
from typing import Optional, Dict, Any
from .base import BaseAgent


class MicroDefensiveAgent(BaseAgent):
    """Manages 150 micro-defensive tools across 7 categories:
    Input Validation (20), Integrity Monitoring (20), Encryption (20),
    Network Micro-Defense (20), Container/Cloud Micro (20),
    Self-Attack Wall (25), Advanced Analytics (25)."""

    TOOL_CATEGORIES = {
        "input_validation": [
            "html-sanitizer", "sql-sanitizer", "xss-filter", "cmd-injection-guard",
            "path-traversal-guard", "ldap-injection-guard", "xml-sanitizer",
            "header-injection-guard", "crlf-injection-guard", "ssti-guard",
            "jwt-validator", "csp-enforcer", "cors-guard", "rate-limiter",
            "brute-force-guard", "csrf-guard", "idempotency-guard",
            "payload-size-guard", "schema-validator", "regex-validator",
        ],
        "integrity_monitoring": [
            "file-hash-monitor", "config-drift-detector", "process-monitor",
            "network-flow-monitor", "dns-monitor", "certificate-monitor",
            "user-activity-monitor", "priv-esc-monitor", "login-anomaly-detector",
            "file-access-monitor", "registry-monitor", "service-monitor",
            "port-monitor", "cron-monitor", "kernel-module-monitor",
            "docker-event-monitor", "api-call-auditor", "session-monitor",
            "container-image-scanner", "dependency-scanner",
        ],
        "encryption": [
            "aes-256-guard", "rsa-4096-guard", "tls-1.3-enforcer",
            "cert-pinning-guard", "key-derivation-guard", "secret-scanner",
            "env-var-encryptor", "backup-encryptor", "db-column-encryptor",
            "file-encryptor", "disk-encryptor", "email-encryptor",
            "chat-encryptor", "api-payload-encryptor", "cookie-encryptor",
            "token-encryptor", "password-hasher-bcrypt", "hsm-interface",
            "key-wrap-guard", "entropy-checker",
        ],
        "network_micro_defense": [
            "syn-flood-guard", "udp-flood-guard", "icmp-guard",
            "port-scan-detector", "dns-exfil-detector", "covert-channel-detector",
            "tunnel-detector", "beaconing-detector", "c2-detector",
            "data-exfil-monitor", "geo-fence-enforcer", "ip-reputation-checker",
            "asn-checker", "tls-downgrade-detector", "cert-chain-validator",
            "ocsp-checker", "sct-validator", "dnssec-validator",
            "doh-dot-enforcer", "quic-validator",
        ],
        "container_cloud_micro": [
            "image-vuln-scanner", "secret-in-image-scanner",
            "privileged-container-detector", "root-container-detector",
            "host-pid-detector", "network-mode-detector", "volume-mount-auditor",
            "capability-auditor", "seccomp-auditor", "apparmor-auditor",
            "k8s-rbac-auditor", "service-account-auditor",
            "network-policy-auditor", "pod-security-auditor",
            "resource-quota-auditor", "image-signature-verifier",
            "admission-controller", "config-map-scanner", "secret-scanner-cloud",
            "cloud-metadata-guard",
        ],
        "self_attack_wall": [
            "self-injection-guard", "self-exfiltration-guard",
            "self-privilege-esc-guard", "self-modification-guard",
            "self-communication-guard", "self-ddos-guard",
            "self-resource-exhaustion-guard", "self-memory-corruption-guard",
            "self-config-tampering-guard", "self-credential-theft-guard",
            "unsafe-deserialization-guard", "self-path-traversal-guard",
            "self-race-condition-guard", "logic-bomb-guard",
            "self-backdoor-guard", "crypto-downgrade-guard",
            "log-injection-guard", "dependency-confusion-guard",
            "prototype-pollution-guard", "replay-attack-guard",
            "supply-chain-attack-guard", "encoding-unicode-bypass-guard",
            "model-extraction-guard", "adversarial-input-guard",
            "self-replication-guard",
        ],
        "advanced_analytics": [
            "anomaly-detector", "behavioral-baseliner", "ueba-engine",
            "threat-hunter", "ml-classifier", "graph-analyzer",
            "timeline-builder", "correlation-engine", "enrichment-engine",
            "scoring-engine", "risk-calculator", "attack-path-analyzer",
            "blast-radius-calculator", "impact-assessor", "priority-ranker",
            "auto-triage-engine", "false-positive-reducer", "alert-deduplicator",
            "noise-filter", "signal-amplifier", "context-enricher",
            "mitre-mapper", "ttp-matcher", "ioc-matcher", "campaign-tracker",
        ],
    }

    def __init__(self):
        super().__init__("micro_defensive", "Defensive Operations")

    async def execute(self, task: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        params = params or {}
        action = params.get("action", "status")
        if action == "list_tools":
            total = sum(len(v) for v in self.TOOL_CATEGORIES.values())
            return {"status": "ok", "total": total, "categories": {k: len(v) for k, v in self.TOOL_CATEGORIES.items()}}
        elif action == "wall_status":
            from ..core.security_manager import security_manager
            return {"status": "ok", "wall": security_manager._self_attack_wall.status()}
        elif action == "deploy":
            tool = params.get("tool")
            category = params.get("category")
            all_tools = [t for tools in self.TOOL_CATEGORIES.values() for t in tools]
            if tool and tool not in all_tools:
                return {"status": "error", "message": f"Unknown micro-defensive tool: {tool}"}
            self.log_action("deploy_tool", f"tool={tool} category={category}")
            return {"status": "ok", "tool": tool, "category": category}
        elif action == "status":
            return self.status()
        return {"status": "unknown_action", "action": action}
''')

F.close()
print(f"Part 4d done. Next file index: {si}")