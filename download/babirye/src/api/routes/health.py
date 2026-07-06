"""BABIRYE Health API — System health checks and metrics."""
import os
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
    import httpx
    components = {}
    checks = [
        ("database", f"http://{os.getenv('POSTGRES_HOST', 'localhost')}:5432", False),
        ("qdrant", f"http://{os.getenv('QDRANT_URL', 'http://localhost:6333').replace('http://', '')}/health", True),
        ("neo4j", f"http://{os.getenv('NEO4J_HOST', 'localhost')}:7474", False),
        ("meilisearch", f"http://{os.getenv('MEILISEARCH_URL', 'http://localhost:7700').replace('http://', '')}/health", True),
        ("nats", f"http://{os.getenv('NATS_URL', 'nats://localhost:4222').replace('nats://', '').replace('http://', '')}:8222/healthz", True),
        ("temporal", f"http://{os.getenv('TEMPORAL_URL', 'localhost:7233').replace('http://', '').replace('temporal://', '')}:7233/health", True),
    ]
    async with httpx.AsyncClient(timeout=2.0) as client:
        for name, url, http_check in checks:
            if not http_check:
                # TCP-based services — mark as unknown if we can't probe via HTTP
                components[name] = "unknown (tcp service — verify via logs)"
                continue
            try:
                resp = await client.get(f"http://{url}" if not url.startswith("http") else url)
                components[name] = "connected" if resp.status_code < 500 else "degraded"
            except Exception:
                components[name] = "unreachable"

    all_healthy = all(v in ("connected", "unknown") for v in components.values())
    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": components,
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
