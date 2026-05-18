import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.resume import Base

# Dynamically resolve DATABASE_URL using absolute paths to support execution from any directory
_db_dir = os.path.dirname(os.path.abspath(__file__))
default_db = f"sqlite:///{os.path.join(_db_dir, 'talentgraph.db')}"

DATABASE_URL = os.getenv("DATABASE_URL", default_db)

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
