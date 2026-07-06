"""BABIRYE Defensive API — Defensive tool management."""
from fastapi import APIRouter, Depends
from ...core.auth import verify_api_token

router = APIRouter()


@router.get("/tools")
async def list_defensive_tools(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("defensive")
    return await agent.execute("list_tools", {"action": "list_tools"})


@router.get("/status")
async def defensive_status(_auth: str = Depends(verify_api_token)):
    return {"status": "dormant", "network": "172.32.0.0/16", "gateway": "4749", "total_tools": 100}
