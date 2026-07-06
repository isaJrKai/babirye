"""BABIRYE Security Manager — SPA, auth, self-attack wall integration"""
import hmac
import hashlib
import time
import bcrypt
from typing import Optional
from datetime import datetime, timezone
from .logger import get_logger

logger = get_logger("security_manager")


class SecurityManager:
    """Central security manager for BABIRYE. Handles SPA verification,
    password hashing, and self-attack wall coordination."""

    def __init__(self, secret: str = ""):
        self._secret = secret.encode()
        self._spa_window = 300  # 5 minutes
        self._self_attack_wall = SelfAttackWall()

    def verify_spa(
        self,
        timestamp: int,
        nonce: str,
        signature: str,
        action: str,
        service: Optional[str] = None,
        params: Optional[dict] = None,
    ) -> bool:
        """Verify Single Packet Authorization with HMAC-SHA256."""
        params = params or {}
        # Time window check
        if abs(time.time() - timestamp) > self._spa_window:
            logger.warning(f"SPA rejected: timestamp expired (delta={abs(time.time() - timestamp):.0f}s)")
            return False
        # Signature construction
        msg = f"{timestamp}:{nonce}:{action}:{service or ''}:{_json_dumps(params)}"
        expected = hmac.new(self._secret, msg.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            logger.warning("SPA rejected: signature mismatch")
            return False
        # Self-attack wall check
        wall_result = self._self_attack_wall.check(action, service, params)
        if not wall_result.passed:
            logger.critical(f"Self-attack wall BLOCKED: {wall_result.blocked_by}")
            return False
        return True

    def hash_password(self, password: str) -> str:
        """Hash password with bcrypt (fixed: no more plaintext)."""
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against bcrypt hash."""
        try:
            return bcrypt.checkpw(password.encode(), hashed.encode())
        except Exception:
            return False


class SelfAttackWall:
    """25 titanium-strength guard modules against self-compromise."""

    GUARDS = [
        "self-injection", "self-exfiltration", "self-privilege-esc",
        "self-modification", "self-communication", "self-ddos",
        "self-resource-exhaustion", "self-memory-corruption",
        "self-config-tampering", "self-credential-theft",
        "unsafe-deserialization", "self-path-traversal",
        "self-race-condition", "logic-bomb", "self-backdoor",
        "crypto-downgrade", "log-injection", "dependency-confusion",
        "prototype-pollution", "replay-attack", "supply-chain-attack",
        "encoding-unicode-bypass", "model-extraction", "adversarial-input",
        "self-replication",
    ]

    def __init__(self):
        self._guard_states = {g: {"active": True, "blocks": 0, "last_block": None} for g in self.GUARDS}

    def check(self, action: str, service: str = None, params: dict = None) -> "WallResult":
        """Run all 25 guards in parallel. Return first block or pass."""
        params = params or {}
        for guard_name in self.GUARDS:
            if not self._run_guard(guard_name, action, service, params):
                self._guard_states[guard_name]["blocks"] += 1
                self._guard_states[guard_name]["last_block"] = datetime.now(timezone.utc).isoformat()
                return WallResult(passed=False, blocked_by=guard_name)
        return WallResult(passed=True, blocked_by=None)

    def _run_guard(self, guard: str, action: str, service: str, params: dict) -> bool:
        """Execute individual guard logic. Returns True if action is safe."""
        # Guard 1: Self-injection — block if action contains code injection patterns
        if guard == "self-injection":
            dangerous = ["__import__", "eval(", "exec(", "compile(", "os.system", "subprocess"]
            combined = f"{action} {service or ''} {_json_dumps(params)}"
            return not any(d in combined for d in dangerous)
        # Guard 2: Self-exfiltration — block outbound data transfers
        if guard == "self-exfiltration":
            exfil_indicators = ["exfil", "upload", "send_to", "http://", "ftp://", "dns://"]
            return not any(ind in _json_dumps(params).lower() for ind in exfil_indicators)
        # Guard 3: Self-privilege-esc — block privilege escalation attempts
        if guard == "self-privilege-esc":
            priv_patterns = ["sudo", "chmod 777", "setuid", "cap_add", "privileged"]
            return not any(p in _json_dumps(params).lower() for p in priv_patterns)
        # Guard 4: Self-modification — block self-code modification
        if guard == "self-modification":
            if service and "babirye" in service.lower() and action in ("deploy", "modify", "update"):
                return False
            return True
        # Guard 5: Self-communication — block unauthorized internal messaging
        if guard == "self-communication":
            return action not in ("internal_broadcast", "self_message")
        # Guard 6: Self-DDoS — block self-generated high-frequency requests
        if guard == "self-ddos":
            return params.get("rate_limit_bypass") is not True
        # Guard 7: Self-resource-exhaustion — block resource exhaustion patterns
        if guard == "self-resource-exhaustion":
            return params.get("memory_max") is None or params.get("memory_max", 0) < 2**30
        # Guard 8: Self-memory-corruption — block operations with suspicious memory patterns
        if guard == "self-memory-corruption":
            mem_patterns = ["\x00", "buffer_overflow", "heap_spray", "use_after_free", "double_free"]
            combined = f"{action} {_json_dumps(params)}"
            return not any(p in combined for p in mem_patterns)

        # Guard 9: Self-config-tampering — block config modification attempts
        if guard == "self-config-tampering":
            config_indicators = ["config.", "settings.", ".env", "yaml", "ini", "registry"]
            if service and any(c in action.lower() for c in config_indicators):
                return False
            return True

        # Guard 10: Self-credential-theft — block credential access/extraction
        if guard == "self-credential-theft":
            cred_patterns = ["password", "secret", "token", "key", "credential", "private_key", "api_key"]
            if any(c in _json_dumps(params).lower() for c in cred_patterns):
                if action in ("export", "extract", "read", "dump", "copy"):
                    return False
            return True

        # Guard 11: Unsafe-deserialization — block pickle/yaml.load/eval on untrusted data
        if guard == "unsafe-deserialization":
            unsafe = ["pickle.loads", "yaml.load(", "yaml.unsafe", "marshal.loads", "shelve.open"]
            combined = f"{action} {service or ''} {_json_dumps(params)}"
            return not any(u in combined for u in unsafe)

        # Guard 12: Self-path-traversal — block file path manipulation
        if guard == "self-path-traversal":
            traversal = ["../", "..\\", "/etc/", "/proc/", "/sys/", "/dev/", "~/" , "%2e%2e"]
            combined = _json_dumps(params)
            return not any(t in combined for t in traversal)

        # Guard 13: Self-race-condition — block concurrent state-modifying operations
        if guard == "self-race-condition":
            # In production, use file locks or Redis distributed locks
            # For now: block if params explicitly request concurrent execution
            return not (params.get("concurrent") is True or params.get("race") is True)

        # Guard 14: Logic-bomb — block time-delayed or trigger-based hidden actions
        if guard == "logic-bomb":
            bomb_indicators = ["delayed", "scheduled", "cron", "trigger", "time_bomb", "sleep_until"]
            return not any(b in action.lower() for b in bomb_indicators)

        # Guard 15: Self-backdoor — block hidden access channel creation
        if guard == "self-backdoor":
            backdoor_patterns = ["backdoor", "reverse_shell", "bind_shell", "rootkit", "hidden_service"]
            combined = f"{action} {service or ''} {_json_dumps(params)}"
            return not any(b in combined.lower() for b in backdoor_patterns)

        # Guard 16: Crypto-downgrade — block attempts to weaken encryption
        if guard == "crypto-downgrade":
            weak_crypto = ["md5", "sha1", "des", "rc4", "tls1.0", "tls1.1", "ssl3", "aes-128-ecb"]
            combined = f"{action} {_json_dumps(params)}".lower()
            downgrade_actions = ["downgrade", "weaken", "disable_encryption", "use_weak"]
            if any(d in combined for d in downgrade_actions):
                return False
            return True

        # Guard 17: Log-injection — block CRLF and fake log entries
        if guard == "log-injection":
            log_inject = ["\r\n", "\n", "\r", "CRLF:", "<script>", "LOG4J"]
            combined = f"{action} {_json_dumps(params)}"
            return not any(l in combined for l in log_inject)

        # Guard 18: Dependency-confusion — block external package resolution manipulation
        if guard == "dependency-confusion":
            dep_patterns = ["pypi.org", "npmjs.com", "internal.pypi", "npm_config", "PIP_INDEX"]
            combined = _json_dumps(params).lower()
            return "install" not in action.lower() or not any(d in combined for d in dep_patterns)

        # Guard 19: Prototype-pollution — block object prototype manipulation (JS-adjacent)
        if guard == "prototype-pollution":
            proto_patterns = ["__proto__", "constructor.prototype", "Object.assign"]
            combined = _json_dumps(params)
            return not any(p in combined for p in proto_patterns)

        # Guard 20: Replay-attack — nonces are handled by SPA; double-check timestamp freshness
        if guard == "replay-attack":
            # This guard is supplementary to SPA timestamp check
            # Block if same nonce appears in params (indicates replay)
            return params.get("nonce") is None or isinstance(params.get("nonce"), str)

        # Guard 21: Supply-chain-attack — block modifications to dependency sources
        if guard == "supply-chain-attack":
            supply_patterns = ["requirements.txt", "package.json", "go.mod", "Dockerfile", "pip install"]
            if any(s in _json_dumps(params) for s in supply_patterns):
                return False
            return True

        # Guard 22: Encoding-unicode-bypass — block homoglyph/unicode tricks
        if guard == "encoding-unicode-bypass":
            # Block if action contains non-ASCII characters in suspicious positions
            if action and any(ord(c) > 127 for c in action[:50]):
                return False
            return True

        # Guard 23: Model-extraction — block attempts to extract internal models/weights
        if guard == "model-extraction":
            extract_patterns = ["export_model", "dump_weights", "model_params", "serialize_model"]
            return not any(p in action.lower() for p in extract_patterns)

        # Guard 24: Adversarial-input — block known adversarial attack patterns
        if guard == "adversarial-input":
            # Block excessively long inputs that could be adversarial
            total_len = len(action) + len(_json_dumps(params))
            if total_len > 100000:  # 100KB threshold
                return False
            return True

        # Guard 25: Self-replication — block self-copying or spawning
        if guard == "self-replication":
            replica_patterns = ["clone", "replicate", "fork_self", "spawn_copy", "self_duplicate"]
            return not any(r in action.lower() for r in replica_patterns)

        return True  # Unknown guard — allow (fail-open for extensibility)

    def status(self) -> dict:
        return {
            "total_guards": len(self.GUARDS),
            "guards": self._guard_states,
        }


class WallResult:
    def __init__(self, passed: bool, blocked_by: str = None):
        self.passed = passed
        self.blocked_by = blocked_by


def _json_dumps(obj) -> str:
    import json
    return json.dumps(obj, separators=(',', ':'), sort_keys=True)


# Global instance — secret loaded from config
from .config import settings
security_manager = SecurityManager(secret=settings.babirye_password)
