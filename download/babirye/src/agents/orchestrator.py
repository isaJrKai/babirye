"""BABIRYE Orchestrator Agent — Routes tasks to specialized agents."""
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
