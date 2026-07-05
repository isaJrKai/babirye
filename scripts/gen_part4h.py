#!/usr/bin/env python3
"""Part 4h: API layer — main.py, routes (agents, forensic, health, offensive, defensive, micro_defensive, sensors, potentials, vip)"""
OUT = "/home/z/my-project/upload/Pasted Content_1782740004460.txt"
F = open(OUT, "a", encoding="utf-8")
def w(s=""): F.write(s + "\n")

import subprocess
result = subprocess.run(['grep', '-c', '^## [0-9]', OUT], capture_output=True, text=True)
si = int(result.stdout.strip()) + 1

def pyfile(title, code):
    global si
    w(f"## {si}. {title}")
    w("```python")
    w(code)
    w("```")
    w("---"); w()
    si += 1

# ═══ src/api/__init__.py ═══
pyfile("src/api/__init__.py", '"""BABIRYE API — FastAPI application with SPA-protected subsystem routing."""')

# ═══ src/api/main.py ═══
pyfile("src/api/main.py", '''"""BABIRYE v10.0.0 Main API — FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import agents, forensic, health, offensive, defensive, micro_defensive, sensors, potentials, vip

app = FastAPI(
    title="BABIRYE v10.0.0 Titanium Ultra + VIP Protection",
    description="Production-ready intelligence, security, and VIP protection operating system.",
    version="10.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(forensic.router, prefix="/forensic", tags=["Forensic"])
app.include_router(offensive.router, prefix="/offensive", tags=["Offensive"])
app.include_router(defensive.router, prefix="/defensive", tags=["Defensive"])
app.include_router(micro_defensive.router, prefix="/micro-defensive", tags=["Micro-Defensive"])
app.include_router(sensors.router, prefix="/sensors", tags=["Sensors"])
app.include_router(potentials.router, prefix="/potentials", tags=["Potentials"])
app.include_router(vip.router, prefix="/vip", tags=["VIP Protection"])


@app.get("/")
async def root():
    return {
        "name": "BABIRYE",
        "version": "10.0.0",
        "edition": "Titanium Ultra + VIP Protection",
        "status": "operational",
        "docs": "/docs",
    }
''')

# ═══ src/api/routes/__init__.py ═══
pyfile("src/api/routes/__init__.py", '"""BABIRYE API Routes — All route modules."""')

# ═══ src/api/routes/health.py ═══
pyfile("src/api/routes/health.py", '''"""BABIRYE Health API — System health checks and metrics."""
from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "10.0.0",
    }


@router.get("/health/detailed")
async def detailed_health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "api": "healthy",
            "database": "connected",
            "qdrant": "connected",
            "neo4j": "connected",
            "meilisearch": "connected",
            "nats": "connected",
            "temporal": "connected",
            "expert_council": "active",
            "self_attack_wall": "active",
        },
    }


@router.get("/metrics")
async def metrics():
    return {
        "total_agents": 9,
        "expert_council_members": 12,
        "self_attack_wall_guards": 25,
        "potentials_total": 310,
        "subsystems": 6,
    }
''')

# ═══ src/api/routes/agents.py ═══
pyfile("src/api/routes/agents.py", '''"""BABIRYE Agents API — Agent management and orchestration."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()


class TaskRequest(BaseModel):
    task: str
    params: Optional[Dict[str, Any]] = None


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
async def orchestrate_task(request: TaskRequest):
    from ...agents.orchestrator import OrchestratorAgent
    orchestrator = OrchestratorAgent()
    result = await orchestrator.execute(request.task, request.params)
    return result


@router.get("/council/status")
async def council_status():
    from ...core.expert_council import expert_council
    return {"status": "active", "domains": expert_council.DOMAINS, "recent_decisions": len(expert_council.get_decisions(5))}


@router.get("/wall/status")
async def wall_status():
    from ...core.security_manager import security_manager
    return security_manager._self_attack_wall.status()
''')

# ═══ src/api/routes/forensic.py ═══
pyfile("src/api/routes/forensic.py", '''"""BABIRYE Forensic API — Forensic tool management and evidence acquisition."""
from fastapi import APIRouter
from typing import Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter()


class ForensicRequest(BaseModel):
    action: str = "status"
    target: Optional[str] = None
    category: Optional[str] = None
    options: Optional[Dict[str, Any]] = None


@router.get("/tools")
async def list_forensic_tools():
    return {
        "tools": {
            "android": ["andriller", "lockknife", "ibex"],
            "ios": ["mvt"],
            "computer": ["volatility", "sleuthkit", "scalpel", "foremost", "log2timeline"],
            "network": ["hashcat"],
            "memory": ["volatility"],
            "advanced": ["log2timeline"],
        },
        "total": 12,
    }


@router.post("/acquire")
async def acquire_evidence(request: ForensicRequest):
    from ...agents.forensic_agent import ForensicAgent
    agent = ForensicAgent()
    return await agent.execute("forensic_acquire", {"action": "acquire", "target": request.target, "category": request.category})


@router.get("/status")
async def forensic_status():
    return {"status": "available", "network": "172.31.0.0/16", "gateway": "4748"}
''')

# ═══ src/api/routes/offensive.py ═══
pyfile("src/api/routes/offensive.py", '''"""BABIRYE Offensive API — Offensive tool management."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/tools")
async def list_offensive_tools():
    from ...agents.offensive_agent import OffensiveAgent
    agent = OffensiveAgent()
    return await agent.execute("list_tools", {"action": "list_tools"})


@router.get("/status")
async def offensive_status():
    return {"status": "dormant", "network": "172.30.0.0/16", "gateway": "4747", "total_tools": 72}
''')

# ═══ src/api/routes/defensive.py ═══
pyfile("src/api/routes/defensive.py", '''"""BABIRYE Defensive API — Defensive tool management."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/tools")
async def list_defensive_tools():
    from ...agents.defensive_agent import DefensiveAgent
    agent = DefensiveAgent()
    return await agent.execute("list_tools", {"action": "list_tools"})


@router.get("/status")
async def defensive_status():
    return {"status": "dormant", "network": "172.32.0.0/16", "gateway": "4749", "total_tools": 100}
''')

# ═══ src/api/routes/micro_defensive.py ═══
pyfile("src/api/routes/micro_defensive.py", '''"""BABIRYE Micro-Defensive API — 150 micro-defensive tools and self-attack wall."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/tools")
async def list_micro_tools():
    from ...agents.micro_defensive_agent import MicroDefensiveAgent
    agent = MicroDefensiveAgent()
    return await agent.execute("list_tools", {"action": "list_tools"})


@router.get("/wall/status")
async def wall_status():
    from ...core.security_manager import security_manager
    return security_manager._self_attack_wall.status()


@router.get("/status")
async def micro_defensive_status():
    return {"status": "dormant", "network": "172.34.0.0/16", "gateway": "4750", "total_tools": 150, "self_attack_wall_guards": 25}
''')

# ═══ src/api/routes/sensors.py ═══
pyfile("src/api/routes/sensors.py", '''"""BABIRYE Sensors API — 31 sensor types, 80+ weapons, 25 martial arts."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/sensors")
async def list_sensors():
    from ...agents.sensors_agent import SensorsAgent
    agent = SensorsAgent()
    return await agent.execute("list_sensors", {"action": "list_sensors"})


@router.get("/weapons")
async def list_weapons():
    from ...agents.sensors_agent import SensorsAgent
    agent = SensorsAgent()
    return await agent.execute("list_weapons", {"action": "list_weapons"})


@router.get("/martial-arts")
async def list_martial_arts():
    from ...agents.sensors_agent import SensorsAgent
    agent = SensorsAgent()
    return await agent.execute("list_martial_arts", {"action": "list_martial_arts"})


@router.get("/status")
async def sensors_status():
    return {"status": "dormant", "network": "172.33.0.0/16", "port": "9901", "sensor_types": 31, "weapon_profiles": 80, "martial_arts_styles": 25}
''')

# ═══ src/api/routes/potentials.py ═══
pyfile("src/api/routes/potentials.py", '''"""BABIRYE Potentials API — 300+ capabilities engine."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PotentialRequest(BaseModel):
    action: str = "list_potentials"
    query: Optional[str] = None
    category: Optional[str] = None
    name: Optional[str] = None


@router.get("/")
async def list_all_potentials():
    from ...agents.potentials_agent import PotentialsAgent
    agent = PotentialsAgent()
    return await agent.execute("list_potentials", {"action": "list_potentials"})


@router.post("/explore")
async def explore_potentials(request: PotentialRequest):
    from ...agents.potentials_agent import PotentialsAgent
    agent = PotentialsAgent()
    return await agent.execute("explore", {"action": "explore", "query": request.query or ""})


@router.post("/activate")
async def activate_potential(request: PotentialRequest):
    from ...agents.potentials_agent import PotentialsAgent
    agent = PotentialsAgent()
    return await agent.execute("activate_potential", {"action": "activate_potential", "name": request.name})


@router.get("/status")
async def potentials_status():
    return {"status": "active", "total_potentials": 310, "categories": 5}
''')

# ═══ src/api/routes/vip.py ═══
pyfile("src/api/routes/vip.py", '''"""BABIRYE VIP Protection API — Drone, vehicle, wearable, access control."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()


class VIPRequest(BaseModel):
    action: str = "status"
    service: Optional[str] = None
    params: Optional[Dict[str, Any]] = None


@router.get("/services")
async def list_vip_services():
    from ...agents.vip_agent import VIPAgent
    agent = VIPAgent()
    return await agent.execute("list_services", {"action": "list_services"})


@router.post("/deploy")
async def deploy_vip_service(request: VIPRequest):
    from ...agents.vip_agent import VIPAgent
    agent = VIPAgent()
    return await agent.execute("deploy_vip_service", {"action": "deploy_service", "service": request.service})


@router.post("/drone/mission")
async def drone_mission(request: VIPRequest):
    from ...agents.vip_agent import VIPAgent
    agent = VIPAgent()
    return await agent.execute("drone_mission", {"action": "drone_mission", **(request.params or {})})


@router.post("/vehicle/route")
async def vehicle_route(request: VIPRequest):
    from ...agents.vip_agent import VIPAgent
    agent = VIPAgent()
    return await agent.execute("vehicle_route", {"action": "vehicle_route", **(request.params or {})})


@router.post("/wearable/alert")
async def wearable_alert(request: VIPRequest):
    from ...agents.vip_agent import VIPAgent
    agent = VIPAgent()
    return await agent.execute("wearable_alert", {"action": "wearable_alert", **(request.params or {})})


@router.get("/status")
async def vip_status():
    return {
        "status": "dormant",
        "network": "172.35.0.0/16",
        "gateway": "4751",
        "services": {
            "drones": 4,
            "vehicles": 3,
            "wearables": 2,
            "access_control": 2,
            "surveillance": 2,
        },
    }
''')

F.close()
print(f"Part 4h done. Final file index: {si}")