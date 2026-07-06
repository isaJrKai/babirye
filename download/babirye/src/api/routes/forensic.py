"""BABIRYE Forensic API — Forensic tool management and evidence acquisition."""
from fastapi import APIRouter, Depends
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from ...core.auth import verify_api_token

router = APIRouter()


class ForensicRequest(BaseModel):
    action: str = Field(default="status", pattern=r"^(status|acquire|analyze)$")
    target: Optional[str] = Field(default=None, max_length=500)
    category: Optional[str] = Field(default=None, pattern=r"^(android|ios|computer|network|memory|advanced)$")
    options: Optional[Dict[str, Any]] = None


@router.get("/tools")
async def list_forensic_tools(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("forensic")
    return await agent.execute("list_tools", {"action": "list_tools"})


@router.post("/acquire")
async def acquire_evidence(request: ForensicRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("forensic")
    return await agent.execute("forensic_acquire", {"action": "acquire", "target": request.target, "category": request.category})


@router.get("/status")
async def forensic_status(_auth: str = Depends(verify_api_token)):
    return {"status": "available", "network": "172.31.0.0/16", "gateway": "4748", "total_tools": 12}
