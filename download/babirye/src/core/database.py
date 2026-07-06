"""BABIRYE Database — SQLAlchemy engine, session, and initialization."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from .config import settings
from .models import Base
from .logger import get_logger

logger = get_logger("database")

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """FastAPI dependency: yield a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except SQLAlchemyError as e:
        logger.error(f"Database initialization failed: {e}")
        raise


def ensure_tables():
    """Ensure all required tables exist (called on startup)."""
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing = inspector.get_table_names()
    required = ["agents", "tasks", "council_decisions", "audit_logs", "wall_blocks", "potentials"]
    missing = [t for t in required if t not in existing]
    if missing:
        logger.warning(f"Missing tables: {missing}. Running init_db()")
        init_db()
    else:
        logger.info(f"All {len(required)} required tables verified")