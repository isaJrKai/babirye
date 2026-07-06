"""BABIRYE Potentials Agent — 300+ capabilities discovery and activation."""
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
