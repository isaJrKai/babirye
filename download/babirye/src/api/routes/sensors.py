"""BABIRYE Sensors API — 31 sensor types, 80+ weapons, 25 martial arts."""
from fastapi import APIRouter, Depends
from ...core.auth import verify_api_token

router = APIRouter()


@router.get("/sensors")
async def list_sensors(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("sensors")
    return await agent.execute("list_sensors", {"action": "list_sensors"})


@router.get("/weapons")
async def list_weapons(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("sensors")
    return await agent.execute("list_weapons", {"action": "list_weapons"})


@router.get("/martial-arts")
async def list_martial_arts(_auth: str = Depends(verify_api_token)):
    from ...agents import get_agent
    agent = get_agent("sensors")
    return await agent.execute("list_martial_arts", {"action": "list_martial_arts"})


@router.get("/status")
async def sensors_status(_auth: str = Depends(verify_api_token)):
    return {"status": "dormant", "network": "172.33.0.0/16", "port": "9901",
            "sensor_types": 31, "weapon_profiles": 80, "martial_arts_styles": 25}
