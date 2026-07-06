"""BABIRYE Forensic Agent — Manages 12 forensic tools across 6 categories."""
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
