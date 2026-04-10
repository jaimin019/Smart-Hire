"""
SQLAlchemy engine and session factory.
Uses SQLite for zero-infrastructure local dev (same ORM API as PostgreSQL).
Database file: backend/talentgraph.db
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base

# Allow override via env var; default to SQLite file in backend dir
_db_dir = os.path.dirname(os.path.abspath(__file__))
_default_url = f"sqlite:///{os.path.join(_db_dir, '..', 'talentgraph.db')}"
DATABASE_URL = os.getenv("DATABASE_URL", _default_url)

# connect_args only needed for SQLite (thread safety)
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables() -> None:
    """Create all tables defined in models if they don't exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency: yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
