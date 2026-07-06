"""BABIRYE VIP Protection API — Drone, vehicle, wearable, access control."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from ...core.auth import verify_api_token

router = APIRouter()


class VIPRequest(BaseModel):
    action: str = Field(default="status", pattern=r"^(status|deploy|drone_mission|vehicle_route|wearable_alert)$")
    service: Optional[str] = Field(default=None, max_length=200)
    params: Optional[Dict[str, Any]] = None


@router.get("/services")
async def list_vip_services(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("vip")
    return await agent.execute("list_services", {"action": "list_services"})


@router.post("/deploy")
async def deploy_vip_service(request: VIPRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("vip")
    return await agent.execute("deploy_vip_service", {"action": "deploy_service", "service": request.service})


@router.post("/drone/mission")
async def drone_mission(request: VIPRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("vip")
    return await agent.execute("drone_mission", {"action": "drone_mission", **(request.params or {})})


@router.post("/vehicle/route")
async def vehicle_route(request: VIPRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("vip")
    return await agent.execute("vehicle_route", {"action": "vehicle_route", **(request.params or {})})


@router.post("/wearable/alert")
async def wearable_alert(request: VIPRequest, _auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("vip")
    return await agent.execute("wearable_alert", {"action": "wearable_alert", **(request.params or {})})


@router.get("/status")
async def vip_status(_auth: str = Depends(verify_api_token)):
    return {"status": "dormant", "network": "172.35.0.0/16", "gateway": "4751",
            "drones": 6, "vehicles": 4, "wearables": 3, "services": 6}
