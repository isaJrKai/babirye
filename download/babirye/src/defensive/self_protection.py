"""BABIRYE Self Protection — 25 titanium-strength self-attack wall guards."""
from datetime import datetime, timezone
from ..core.logger import get_logger
from ..core.security_manager import security_manager

logger = get_logger("defensive.self_protection")


class SelfProtection:
    """Self-protection module wrapping the 25-guard self-attack wall.
    Provides additional self-protection capabilities beyond the wall itself."""

    GUARD_NAMES = [
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
    ]

    def __init__(self):
        self._wall = security_manager._self_attack_wall

    def check_action(self, action: str, service: str = None, params: dict = None) -> dict:
        """Check an action against the self-attack wall."""
        result = self._wall.check(action, service, params or {})
        status = "PASSED" if result.passed else f"BLOCKED by {result.blocked_by}"
        return {
            "status": status,
            "passed": result.passed,
            "blocked_by": result.blocked_by,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def wall_status(self) -> dict:
        return self._wall.status()

    def guard_count(self) -> int:
        return len(self.GUARD_NAMES)
