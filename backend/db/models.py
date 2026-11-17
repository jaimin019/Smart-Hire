"""
SQLAlchemy ORM models for Smart Hire.

Uses SQLite-compatible types. On PostgreSQL, swap:
  - JSON  → JSONB
  - String (array-stored as JSON) → ARRAY(String)
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Integer, Float, DateTime
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class JobDescription(Base):
    """A job description entered manually via the API."""
    __tablename__ = "job_descriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    # Stored as JSON string for SQLite compat; use ARRAY(String) for Postgres
    required_skills = Column(Text, default="[]")        # JSON list
    nice_to_have_skills = Column(Text, default="[]")    # JSON list
    min_experience_years = Column(Integer, default=0)
    education_requirement = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Candidate(Base):
    """A parsed resume / candidate record."""
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=True)
    match_score = Column(Float, nullable=True)
    job_id = Column(String(100), nullable=True)      # which JD was matched
    parsed_data = Column(Text, nullable=True)         # JSON blob (JSONB in Postgres)
    created_at = Column(DateTime, default=datetime.utcnow)
