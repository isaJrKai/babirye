"""BABIRYE Offensive Agent — Manages 72 offensive tools (22 original + 50 new)."""
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
