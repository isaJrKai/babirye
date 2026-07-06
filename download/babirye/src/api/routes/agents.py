"""BABIRYE Agents API — Agent management and orchestration."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from ...core.auth import verify_api_token

router = APIRouter()


class TaskRequest(BaseModel):
    task: str = Field(..., min_length=1, max_length=1000, description="Task description")
    params: Optional[Dict[str, Any]] = Field(default=None, description="Task parameters")


@router.get("/")
async def list_agents():
    return {
        "agents": [
            {"name": "orchestrator", "domain": "Incident Response"},
            {"name": "forensic", "domain": "Digital Forensics"},
            {"name": "security", "domain": "Defensive Operations"},
            {"name": "offensive", "domain": "Offensive Security"},
            {"name": "defensive", "domain": "Defensive Operations"},
            {"name": "micro_defensive", "domain": "Defensive Operations"},
            {"name": "sensors", "domain": "Physical Security"},
            {"name": "potentials", "domain": "Vulnerability Research"},
            {"name": "vip", "domain": "Physical Security"},
        ],
        "total": 9,
    }


@router.post("/orchestrate")
async def orchestrate_task(request: TaskRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_orchestrator
    orchestrator = get_orchestrator()
    result = await orchestrator.execute(request.task, request.params)
    return result


@router.get("/council/status")
async def council_status(_auth: str = Depends(verify_api_token)):
    from ...core.expert_council import expert_council
    return {"status": "active", "domains": expert_council.DOMAINS,
            "recent_decisions": len(expert_council.get_decisions(5))}


@router.get("/wall/status")
async def wall_status(_auth: str = Depends(verify_api_token)):
    from ...core.security_manager import security_manager
    return security_manager._self_attack_wall.status()


@router.get("/health")
async def agent_health():
    from ...core.expert_council import expert_council
    return {"expert_council": "active", "domains": len(expert_council.DOMAINS)}


@router.get("/metrics")
async def metrics():
    return {
        "total_agents": 9,
        "expert_council_members": 12,
        "self_attack_wall_guards": 25,
        "potentials_total": 310,
        "subsystems": 6,
    }
