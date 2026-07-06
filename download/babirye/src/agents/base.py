"""BABIRYE Base Agent — Foundation for all specialized agents."""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from ..core.logger import get_logger
from ..core.expert_council import expert_council
from ..core.database import SessionLocal
from ..core.models import TaskRecord


class BaseAgent(ABC):
    """Base class for all BABIRYE agents. Provides common functionality:
    logging, expert council consultation, action validation, DB persistence,
    and self-attack wall integration."""

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

    def log_to_db(self, task: str, task_type: str, params: dict = None,
                   status: str = "completed", result: dict = None, error: str = None,
                   request_id: str = None):
        """Persist a task record to the database (non-blocking, errors logged)."""
        try:
            db = SessionLocal()
            record = TaskRecord(
                request_id=request_id,
                agent_name=self.name,
                task_type=task_type,
                task=task[:1000],
                params=params,
                status=status,
                result=result,
                error=error,
            )
            if status in ("completed", "error", "failed"):
                record.completed_at = datetime.now(timezone.utc)
            db.add(record)
            db.commit()
            db.close()
        except Exception as e:
            self.logger.warning(f"DB log failed (non-fatal): {e}")

    def consult_council(self, question: str, context: str = "") -> dict:
        """Consult the Expert Council before high-impact actions."""
        try:
            decision = expert_council.consult(question, context, [self.domain])
            return decision.to_dict()
        except Exception as e:
            self.logger.error(f"Council consultation failed: {e}")
            return {"decision": "error", "reason": f"Council unavailable: {e}"}

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