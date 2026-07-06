"""BABIRYE Security Agent — Handles authentication, authorization, and SPA management."""
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
