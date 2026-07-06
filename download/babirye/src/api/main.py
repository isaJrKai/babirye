"""BABIRYE v10.0.0 Main API — FastAPI application entry point."""
import os
import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routes import agents, forensic, health, offensive, defensive, micro_defensive, sensors, potentials, vip
from ..core.logger import get_logger
from ..core.database import init_db
from ..core.auth import create_api_token, verify_api_token, list_tokens

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    app.state.rate_limits = {}
    logger.info("BABIRYE v10.0.0 starting up...")

    if not os.getenv("BABIRYE_TLS_CERT"):
        logger.warning("========================================")
        logger.warning("  NO TLS CONFIGURED - API running on HTTP")
        logger.warning("  Production MUST use HTTPS (reverse proxy")
        logger.warning("  or set BABIRYE_TLS_CERT env var)")
        logger.warning("========================================")

    if not os.getenv("BABIRYE_JWT_SECRET"):
        logger.warning("BABIRYE_JWT_SECRET not set - API tokens will be ephemeral")

    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    # Emit bootstrap token
    bootstrap_token = create_api_token("bootstrap")
    logger.info(f"Bootstrap API token: {bootstrap_token}")
    logger.warning("Save this token - it will not be shown again")

    logger.info("BABIRYE is operational")
    yield
    logger.info("BABIRYE shutting down...")
    logger.info("BABIRYE shutdown complete")


app = FastAPI(
    title="BABIRYE v10.0.0 Titanium Ultra + VIP Protection",
    description="Production-ready intelligence, security, and VIP protection operating system.",
    version="10.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("BABIRYE_CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-SPA-Nonce"],
)

# ---- Rate Limiting Middleware ----
RATE_LIMIT_MAX = 120
RATE_LIMIT_WINDOW = 60
PUBLIC_RATE_LIMIT_MAX = 10


@app.middleware("http")
async def rate_limit_and_audit(request: Request, call_next):
    """Rate limiting + request ID + audit logging middleware."""
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    client_key = request.client.host if request.client else "unknown"
    is_authenticated = request.headers.get("Authorization", "").startswith("Bearer ")
    now = time.time()

    if not hasattr(app.state, "rate_limits"):
        app.state.rate_limits = {}

    rl = app.state.rate_limits
    if client_key not in rl:
        rl[client_key] = {"window_start": now, "count": 0}

    if now - rl[client_key]["window_start"] > RATE_LIMIT_WINDOW:
        rl[client_key] = {"window_start": now, "count": 0}

    rl[client_key]["count"] += 1
    limit = RATE_LIMIT_MAX if is_authenticated else PUBLIC_RATE_LIMIT_MAX

    if rl[client_key]["count"] > limit:
        logger.warning(f"Rate limited: {client_key} ({rl[client_key]['count']}/{limit}) [{req_id}]")
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded", "retry_after": RATE_LIMIT_WINDOW},
            headers={"X-Request-ID": req_id, "Retry-After": str(RATE_LIMIT_WINDOW)},
        )

    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id

    if not request.url.path.startswith("/health"):
        logger.info(f"[{req_id}] {request.method} {request.url.path} -> {response.status_code}")

    return response


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