"""BABIRYE Potentials API — 300+ capabilities engine."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from ...core.auth import verify_api_token

router = APIRouter()


class PotentialRequest(BaseModel):
    action: str = Field(default="list_potentials", pattern=r"^(list_potentials|explore|activate)$")
    query: Optional[str] = Field(default=None, max_length=500)
    category: Optional[str] = None
    name: Optional[str] = Field(default=None, max_length=200)


@router.get("/")
async def list_all_potentials(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("potentials")
    return await agent.execute("list_potentials", {"action": "list_potentials"})


@router.post("/explore")
async def explore_potentials(request: PotentialRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("potentials")
    return await agent.execute("explore", {"action": "explore", "query": request.query or ""})


@router.post("/activate")
async def activate_potential(request: PotentialRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("potentials")
    return await agent.execute("activate", {"action": "activate", "name": request.name or ""})
