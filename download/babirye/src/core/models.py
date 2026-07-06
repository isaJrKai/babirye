"""BABIRYE Database Models — SQLAlchemy 2.0 ORM models."""
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, Float, JSON, Boolean, ForeignKey, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from datetime import timezone


class Base(DeclarativeBase):
    pass


class AgentRecord(Base):
    """Persistent record of agent actions and state."""
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="idle")
    action_count: Mapped[int] = mapped_column(Integer, default=0)
    last_action: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class TaskRecord(Base):
    """Record of all tasks processed by agents."""
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    task_type: Mapped[str] = mapped_column(String(100), nullable=False)
    task: Mapped[str] = mapped_column(Text, nullable=False)
    params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CouncilDecisionRecord(Base):
    """Persistent record of Expert Council decisions."""
    __tablename__ = "council_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    decision: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    consensus_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    opinion_count: Mapped[int] = mapped_column(Integer, default=0)
    opinions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    """Audit trail for all API requests and security events."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=True)
    client_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    token_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_audit_created", "created_at"),
    )


class WallBlockEvent(Base):
    """Record of self-attack wall blocks for security monitoring."""
    __tablename__ = "wall_blocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    guard_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    service: Mapped[str | None] = mapped_column(String(200), nullable=True)
    params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PotentialRecord(Base):
    """Record of explored and activated potentials."""
    __tablename__ = "potentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="available", index=True)
    council_decision: Mapped[str | None] = mapped_column(String(50), nullable=True)
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    explored_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))