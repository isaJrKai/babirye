"""BABIRYE Authentication — HMAC-SHA256 bearer token system."""
import os
import time
import hashlib
import uuid

from fastapi import HTTPException, Request

logger = None  # Lazy init to avoid circular imports


def _get_logger():
    global logger
    if logger is None:
        from .logger import get_logger
        logger = get_logger("auth")
    return logger


# In-memory token store: token_hash -> {created, label}
_active_tokens: dict = {}
TOKEN_TTL = 3600 * 8  # 8 hours


def _hash_tok(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_api_token(label: str = "session") -> str:
    """Create a new API token. Only the hash is stored."""
    raw = hashlib.sha256(f"{uuid.uuid4()}{time.time()}".encode()).hexdigest()
    _active_tokens[_hash_tok(raw)] = {"created": time.time(), "label": label}
    return raw


def revoke_api_token(token: str) -> bool:
    return _active_tokens.pop(_hash_tok(token), None) is not None


def _prune_tokens():
    now = time.time()
    expired = [h for h, v in _active_tokens.items() if now - v["created"] > TOKEN_TTL]
    for h in expired:
        del _active_tokens[h]


async def verify_api_token(request: Request) -> str:
    """FastAPI dependency: verify Bearer token from Authorization header."""
    _prune_tokens()
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header. Format: Bearer <token>",
        )
    token = auth_header[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty bearer token")
    token_hash = _hash_tok(token)
    if token_hash not in _active_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token_hash


def list_tokens() -> list:
    """Return active token metadata (never the raw tokens)."""
    _prune_tokens()
    return [
        {"label": v["label"], "created": v["created"],
         "age_hours": (time.time() - v["created"]) / 3600}
        for v in _active_tokens.values()
    ]