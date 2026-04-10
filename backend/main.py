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

# ── Lifespan: preload the sentence-transformers model at startup ─────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up heavy models on startup."""
    import threading
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
    version="1.0.0",
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


# ── Response Models ──────────────────────────────────────────────────────────

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
    parsed_data: ParsedData
    match_score: float
    job_description: JobDescription
    skill_overlap: SkillOverlap
    agent_trace: list[AgentTraceItem]


# ── Available Job Descriptions ───────────────────────────────────────────────

class JobListItem(BaseModel):
    id: str
    title: str
    company: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "TalentGraph API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/v1/jobs", response_model=list[JobListItem])
async def list_jobs():
    """List available job descriptions for matching."""
    from agents.matcher_agent import JOB_DESCRIPTIONS
    return [
        JobListItem(id=k, title=v["title"], company=v["company"])
        for k, v in JOB_DESCRIPTIONS.items()
    ]


@app.post("/api/v1/parse", response_model=ParseResponse)
async def parse_resume(
    file: UploadFile = File(...),
    job_id: str = Form("senior_fullstack"),
):
    """
    Upload a resume (PDF/DOCX) and run the full 3-agent pipeline:
    Parser → Normalizer → Matcher.

    Returns structured candidate data, normalised skills, and a semantic
    match score against the selected job description.
    """
    # Validate file type
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    }
    if file.content_type and file.content_type not in allowed_types:
        # Also allow by extension
        ext = (file.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in ("pdf", "docx", "doc"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Upload a PDF or DOCX.",
            )

    # Read file bytes
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB max
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    # Check API key
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured. Set it in .env file.",
        )

    # Run pipeline
    try:
        print(f"📋 Starting pipeline for file: {file.filename}")
        from graph.pipeline import run_pipeline

        result = await run_pipeline(
            file_bytes=file_bytes,
            file_name=file.filename or "resume.pdf",
            job_id=job_id,
        )
        print(f"✅ Pipeline completed successfully")
    except Exception as e:
        import traceback
        error_msg = f"Pipeline error: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)

    # Build response safely
    try:
        print(f"📦 Building response from pipeline result")
        
        # Ensure all required fields exist in the result
        parsed_data = result.get("parsed_data", {})
        if not isinstance(parsed_data, dict):
            parsed_data = {}
        
        match_score = result.get("match_score", 0)
        if not isinstance(match_score, (int, float)):
            match_score = 0
        
        job_description = result.get("job_description", {
            "title": "Unknown",
            "company": "Unknown",
            "description": "",
            "required_skills": [],
        })
        if not isinstance(job_description, dict):
            job_description = {
                "title": "Unknown",
                "company": "Unknown",
                "description": "",
                "required_skills": [],
            }
        
        skill_overlap = result.get("skill_overlap", {"matched": [], "missing": []})
        if not isinstance(skill_overlap, dict):
            skill_overlap = {"matched": [], "missing": []}
        
        agent_trace = result.get("agent_trace", [])
        if not isinstance(agent_trace, list):
            agent_trace = []
        
        response = ParseResponse(
            parsed_data=ParsedData(**parsed_data),
            match_score=match_score,
            job_description=JobDescription(**job_description),
            skill_overlap=SkillOverlap(**skill_overlap),
            agent_trace=[
                AgentTraceItem(**item)
                for item in agent_trace
            ],
        )
        print(f"✅ Response built successfully")
        return response
    except Exception as e:
        import traceback
        error_msg = f"Response building error: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[".", "agents", "graph"],
        reload_excludes=["venv/*"],
    )
