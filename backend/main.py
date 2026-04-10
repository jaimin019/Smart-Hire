"""
TalentGraph — FastAPI Backend
Multi-Agent AI System for Intelligent Resume Parsing,
Skill Normalization, and Semantic Job Matching.

v2.0 — adds:
  - Skill Taxonomy API  (api/routers/skills.py)
  - Candidate storage   (db/sqlite_db.py)
  - Candidate compare   (api/routers/candidates.py)
  - Parse + Jobs routers (api/routers/parse.py, api/routers/jobs.py)
"""

import os
import uuid
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()


# ── Lifespan: DB init + model pre-load ───────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables (both SQLAlchemy and aiosqlite) + warm up models."""
    import threading
    print("[startup] TalentGraph API starting...")

    # Init SQLAlchemy tables (Jaimin's layer)
    try:
        from db.session import create_tables
        create_tables()
        print("[startup] SQLAlchemy tables ready.")
    except Exception as e:
        print(f"[startup] SQLAlchemy init skipped: {e}")

    # Init aiosqlite tables (our layer)
    try:
        from db.sqlite_db import create_tables as create_async_tables
        await create_async_tables()
        print("[startup] SQLite async tables ready.")
    except Exception as e:
        print(f"[startup] SQLite async init warning: {e}")

    # Pre-load the sentence transformer model in background (non-blocking)
    def _preload():
        try:
            from agents.matcher_agent import _get_model
            _get_model()
            print("[startup] Sentence-transformer model loaded.")
        except Exception as e:
            print(f"[startup] Model pre-load skipped: {e}")

    threading.Thread(target=_preload, daemon=True).start()
    yield
    print("[shutdown] TalentGraph API shutting down.")


app = FastAPI(
    title="TalentGraph API",
    description=(
        "Multi-Agent AI Resume Parser & Job Matcher\n\n"
        "**v2.0:** Skill Taxonomy, Candidate Storage, Candidate Comparison, Parse & Jobs"
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for hackathon dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────────────────────
from api.routers.skills import router as skills_router
from api.routers.candidates import router as candidates_router

app.include_router(skills_router)
app.include_router(candidates_router)

# Include Jaimin's routers if they exist
try:
    from api.routers.parse import router as parse_router
    app.include_router(parse_router)
    print("[startup] parse router loaded.")
except Exception as e:
    print(f"[startup] parse router skipped: {e}")

try:
    from api.routers.jobs import router as jobs_router
    app.include_router(jobs_router)
    print("[startup] jobs router loaded.")
except Exception as e:
    print(f"[startup] jobs router skipped: {e}")


# ── Response Models ───────────────────────────────────────────────────────────

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


class ParseResponse(BaseModel):
    candidate_id: str | None = None  # populated after DB save
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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "TalentGraph API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": [
            "GET  /api/v1/skills/taxonomy",
            "GET  /api/v1/skills/{skill_name}/detail",
            "GET  /api/v1/candidates",
            "GET  /api/v1/candidates/{candidate_id}",
            "POST /api/v1/compare",
        ],
    }


@app.get("/api/v1/jobs", response_model=list[JobListItem])
async def list_jobs():
    """List available job descriptions for matching."""
    from agents.matcher_agent import JOB_DESCRIPTIONS

    hardcoded = [
        JobListItem(id=k, title=v["title"], company=v["company"])
        for k, v in JOB_DESCRIPTIONS.items()
    ]
    try:
        from db.sqlite_db import list_jobs as db_list_jobs
        db_jobs = await db_list_jobs()
        hardcoded_ids = {item.id for item in hardcoded}
        extra = [
            JobListItem(id=j["id"], title=j["title"], company=j["company"])
            for j in db_jobs
            if j["id"] not in hardcoded_ids
        ]
        return hardcoded + extra
    except Exception:
        return hardcoded


@app.post("/api/v1/parse", response_model=ParseResponse)
async def parse_resume(
    file: UploadFile = File(...),
    job_id: str = Form("senior_fullstack"),
):
    """
    Upload a resume (PDF/DOCX) and run the full 3-agent pipeline:
    Parser -> Normalizer -> Matcher.

    Returns structured candidate data, normalised skills, a semantic
    match score, and a candidate_id for use with /api/v1/compare.
    """
    # Validate file type
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }
    if file.content_type and file.content_type not in allowed_types:
        ext = (file.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in ("pdf", "docx", "doc"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Upload a PDF or DOCX.",
            )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured. Set it in .env file.",
        )

    # Run pipeline
    try:
        print(f"[parse] Starting pipeline for file: {file.filename}")
        from graph.pipeline import run_pipeline

        result = await run_pipeline(
            file_bytes=file_bytes,
            file_name=file.filename or "resume.pdf",
            job_id=job_id,
        )
        print("[parse] Pipeline completed successfully")
    except Exception as e:
        import traceback
        error_msg = f"Pipeline error: {str(e)}"
        print(f"[error] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

    # Build response safely
    try:
        print("[parse] Building response from pipeline result")

        parsed_data = result.get("parsed_data", {})
        if not isinstance(parsed_data, dict):
            parsed_data = {}

        match_score = result.get("match_score", 0)
        if not isinstance(match_score, (int, float)):
            match_score = 0

        job_description = result.get("job_description", {
            "title": "Unknown", "company": "Unknown",
            "description": "", "required_skills": [],
        })
        if not isinstance(job_description, dict):
            job_description = {
                "title": "Unknown", "company": "Unknown",
                "description": "", "required_skills": [],
            }

        skill_overlap = result.get("skill_overlap", {"matched": [], "missing": []})
        if not isinstance(skill_overlap, dict):
            skill_overlap = {"matched": [], "missing": []}

        agent_trace = result.get("agent_trace", [])
        if not isinstance(agent_trace, list):
            agent_trace = []

        # Generate candidate_id and persist to DB
        candidate_id = str(uuid.uuid4())
        full_response_dict = {
            "candidate_id": candidate_id,
            "parsed_data": parsed_data,
            "match_score": match_score,
            "job_description": job_description,
            "skill_overlap": skill_overlap,
            "agent_trace": agent_trace,
        }

        try:
            from db.sqlite_db import upsert_candidate
            await upsert_candidate(
                candidate_id=candidate_id,
                name=parsed_data.get("name"),
                email=parsed_data.get("email"),
                parsed_data=full_response_dict,
            )
            print(f"[parse] Candidate saved with id={candidate_id}")
        except Exception as db_err:
            print(f"[db] DB save warning (non-fatal): {db_err}")

        response = ParseResponse(
            candidate_id=candidate_id,
            parsed_data=ParsedData(**parsed_data),
            match_score=match_score,
            job_description=JobDescription(**job_description),
            skill_overlap=SkillOverlap(**skill_overlap),
            agent_trace=[AgentTraceItem(**item) for item in agent_trace],
        )
        print("[parse] Response built successfully")
        return response

    except Exception as e:
        import traceback
        error_msg = f"Response building error: {str(e)}"
        print(f"[error] {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[".", "agents", "graph", "api", "db"],
        reload_excludes=["venv/*"],
    )
