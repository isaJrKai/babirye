"""BABIRYE Offensive API — Offensive tool management."""
from fastapi import APIRouter, Depends
from ...core.auth import verify_api_token

router = APIRouter()


@router.get("/tools")
async def list_offensive_tools(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("offensive")
    return await agent.execute("list_tools", {"action": "list_tools"})


@router.get("/status")
async def offensive_status(_auth: str = Depends(verify_api_token)):
    return {"status": "dormant", "network": "172.30.0.0/16", "gateway": "4747", "total_tools": 72}
