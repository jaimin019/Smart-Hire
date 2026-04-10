"""
TalentGraph — FastAPI Backend
Multi-Agent AI System for Intelligent Resume Parsing,
Skill Normalization, and Semantic Job Matching.
"""

import os
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ── Lifespan: create DB tables + preload sentence-transformer model ───────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise DB and warm up heavy models on startup."""
    import threading

    # Create DB tables (no-op if they already exist)
    try:
        from db.session import create_tables
        create_tables()
        print("✅ Database tables created/verified.")
    except Exception as e:
        print(f"⚠️  DB init skipped: {e}")

    print("🚀 TalentGraph API starting...")

    # Pre-load the sentence transformer model in background (non-blocking)
    def _preload():
        try:
            from agents.matcher_agent import _get_model
            _get_model()
            print("✅ Sentence-transformer model loaded.")
        except Exception as e:
            print(f"⚠️  Model pre-load skipped: {e}")

    threading.Thread(target=_preload, daemon=True).start()
    yield
    print("👋 TalentGraph API shutting down.")


app = FastAPI(
    title="TalentGraph API",
    description="Multi-Agent AI Resume Parser & Job Matcher",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── New routers (Tasks 1, 2, 3) ───────────────────────────────────────────────
from api.routers.jobs import router as jobs_router
from api.routers.parse import router as parse_router

app.include_router(jobs_router, prefix="/api/v1", tags=["Job Descriptions"])
app.include_router(parse_router, prefix="/api/v1", tags=["Resume Parsing"])


# ── Legacy response models (kept for backward compat with existing /api/v1/parse) ──

class ExperienceItem(BaseModel):
    title: str | None = None
    company: str | None = None
    duration: str | None = None
    highlights: list[str] = []


class EducationItem(BaseModel):
    degree: str | None = None
    institution: str | None = None
    year: str | None = None


class ParsedData(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    summary: str | None = None
    experience: list[ExperienceItem] = []
    education: list[EducationItem] = []
    technical_skills: list[str] = []
    certifications: list[str] = []


class SkillOverlap(BaseModel):
    matched: list[str] = []
    missing: list[str] = []


class JobDescription(BaseModel):
    title: str
    company: str
    description: str
    required_skills: list[str] = []


class AgentTraceItem(BaseModel):
    agent: str
    status: str
    chars_extracted: int | None = None
    skills_found: int | None = None
    cosine_similarity: float | None = None
    match_score: float | None = None


class LegacyParseResponse(BaseModel):
    parsed_data: ParsedData
    match_score: float
    job_description: JobDescription
    skill_overlap: SkillOverlap
    agent_trace: list[AgentTraceItem]


# ── Available Job Descriptions ────────────────────────────────────────────────

class JobListItem(BaseModel):
    id: str
    title: str
    company: str


# ── Legacy Endpoints ──────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "TalentGraph API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/v1/jobs", response_model=list[JobListItem], tags=["legacy"])
async def list_jobs():
    """List available built-in job descriptions for matching."""
    from agents.matcher_agent import JOB_DESCRIPTIONS
    return [
        JobListItem(id=k, title=v["title"], company=v["company"])
        for k, v in JOB_DESCRIPTIONS.items()
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[".", "agents", "graph", "api", "db", "workers"],
        reload_excludes=["venv/*"],
    )
