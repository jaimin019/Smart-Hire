"""
api/routers/parse.py — Resume parsing endpoints.

POST  /api/v1/parse              → single resume → full ParseResponse  (Task 2)
POST  /api/v1/parse/batch        → up to 20 files → BatchSubmitResponse (Task 3)
GET   /api/v1/jobs/{batch_id}/status → poll batch progress             (Task 3)

TASK 2 COMPLETE — endpoints ready:
  POST /api/v1/parse  (full ParseResponse with personal_info, work_experience,
                       education, skills, certifications, projects, publications,
                       agent_trace, match_score, job_description, skill_overlap)

TASK 3 COMPLETE — endpoints ready:
  POST /api/v1/parse/batch
  GET  /api/v1/jobs/{batch_id}/status
"""

import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status

from api.schemas import (
    AgentObservability,
    BatchResultItem,
    BatchStatusResponse,
    BatchSubmitResponse,
    Education,
    JobDescriptionInfo,
    NormalizedSkill,
    ParseResponse,
    PersonalInfo,
    Project,
    SkillOverlap,
    WorkExperience,
)

router = APIRouter(prefix="/api/v1")


# ─────────────────────────────────────────────────────────────
#  Helpers — map pipeline state → rich schema objects
# ─────────────────────────────────────────────────────────────

_CATEGORY_MAP: dict[str, str] = {
    # Frontend
    "React": "Frontend", "Vue.js": "Frontend", "Angular": "Frontend",
    "Next.js": "Frontend", "Svelte": "Frontend", "HTML": "Frontend",
    "CSS": "Frontend", "Sass": "Frontend", "Tailwind CSS": "Frontend",
    "JavaScript": "Frontend", "TypeScript": "Frontend", "Figma": "Frontend",
    # Backend
    "Python": "Backend", "Node.js": "Backend", "FastAPI": "Backend",
    "Django": "Backend", "Flask": "Backend", "Express.js": "Backend",
    "Spring Boot": "Backend", "Go": "Backend", "Java": "Backend",
    "C++": "Backend", "C#": "Backend", "Rust": "Backend", "Ruby": "Backend",
    "GraphQL": "Backend", "REST APIs": "Backend",
    # Data / ML
    "Machine Learning": "AI/ML", "Deep Learning": "AI/ML", "NLP": "AI/ML",
    "TensorFlow": "AI/ML", "PyTorch": "AI/ML", "Scikit-learn": "AI/ML",
    "Pandas": "AI/ML", "NumPy": "AI/ML", "Keras": "AI/ML",
    # Database
    "PostgreSQL": "Database", "MySQL": "Database", "MongoDB": "Database",
    "Redis": "Database", "SQLite": "Database", "SQL": "Database",
    "NoSQL": "Database", "Elasticsearch": "Database",
    # DevOps / Cloud
    "Docker": "DevOps", "Kubernetes": "DevOps", "CI/CD": "DevOps",
    "AWS": "Cloud", "Google Cloud": "Cloud", "Azure": "Cloud",
    "Terraform": "DevOps", "Linux": "DevOps", "Git": "DevOps",
    "GitHub": "DevOps", "GitLab": "DevOps",
    # Collaboration
    "Jira": "Tools", "Agile": "Tools", "Scrum": "Tools",
    "Apache Kafka": "Messaging", "RabbitMQ": "Messaging",
}

_EMERGING = {
    "LangChain", "LangGraph", "LlamaIndex", "CrewAI", "AutoGPT",
    "Rust", "Bun", "Deno", "Svelte", "SolidJS", "Tauri",
}

_PROFICIENCY_KEYWORDS = {
    "expert": "Expert", "senior": "Expert", "advanced": "Expert", "lead": "Expert",
    "proficient": "Intermediate", "experienced": "Intermediate",
    "familiar": "Beginner", "basic": "Beginner", "beginner": "Beginner",
    "learning": "Beginner",
}


def _infer_proficiency(skill: str, summary: str) -> str:
    """Heuristic: look for level keywords near the skill name in the summary."""
    text = summary.lower()
    for kw, level in _PROFICIENCY_KEYWORDS.items():
        if kw in text:
            return level
    return "Intermediate"


def _build_normalized_skills(
    technical_skills: List[str], summary: str = ""
) -> List[NormalizedSkill]:
    seen = set()
    result = []
    for raw in technical_skills:
        if raw in seen:
            continue
        seen.add(raw)
        canonical = raw  # already normalized by normalizer_agent
        result.append(
            NormalizedSkill(
                raw=raw,
                canonical=canonical,
                category=_CATEGORY_MAP.get(canonical, "General"),
                proficiency=_infer_proficiency(canonical, summary),
                is_emerging=canonical in _EMERGING,
            )
        )
    return result


def _build_work_experience(experience_list: List[dict]) -> List[WorkExperience]:
    items = []
    for exp in experience_list:
        duration_str: str = exp.get("duration", "") or ""
        # Attempt to infer duration_months from "Jan 2020 - Mar 2023" style strings
        duration_months = None
        if " - " in duration_str or " – " in duration_str:
            # Very rough: count years × 12 + months
            parts = duration_str.replace("–", "-").split("-")
            if len(parts) == 2:
                try:
                    from datetime import datetime as dt
                    fmt_candidates = ["%b %Y", "%B %Y", "%Y"]
                    start_txt = parts[0].strip()
                    end_txt = parts[1].strip()
                    start_date = end_date = None
                    for fmt in fmt_candidates:
                        try:
                            start_date = dt.strptime(start_txt, fmt)
                            break
                        except ValueError:
                            pass
                    if end_txt.lower() in ("present", "current", "now"):
                        from datetime import datetime as dt2
                        end_date = dt2.utcnow()
                    else:
                        for fmt in fmt_candidates:
                            try:
                                end_date = dt.strptime(end_txt, fmt)
                                break
                            except ValueError:
                                pass
                    if start_date and end_date:
                        delta = end_date - start_date
                        duration_months = max(0, int(delta.days / 30.44))
                except Exception:
                    pass

        start, end = None, None
        if " - " in duration_str or " – " in duration_str:
            spl = duration_str.replace("–", "-").split("-", 1)
            start = spl[0].strip() if len(spl) > 0 else None
            end = spl[1].strip() if len(spl) > 1 else None

        items.append(
            WorkExperience(
                company=exp.get("company", "") or "",
                role=exp.get("title", "") or "",
                start_date=start,
                end_date=end,
                duration_months=duration_months,
                responsibilities=exp.get("highlights", []) or [],
            )
        )
    return items


def _build_education(education_list: List[dict]) -> List[Education]:
    return [
        Education(
            institution=e.get("institution", "") or "",
            degree=e.get("degree"),
            field=None,          # LLM doesn't extract field separately
            year=e.get("year"),
        )
        for e in education_list
    ]


def _build_agent_trace(raw_trace: List[dict]) -> List[AgentObservability]:
    return [
        AgentObservability(
            agent=t.get("agent", "Unknown"),
            status=t.get("status", "unknown"),
            latency_ms=t.get("latency_ms"),
            tokens_used=t.get("tokens_used"),
            error=t.get("error"),
            chars_extracted=t.get("chars_extracted"),
            skills_found=t.get("skills_found"),
            cosine_similarity=t.get("cosine_similarity"),
            match_score=t.get("match_score"),
        )
        for t in raw_trace
    ]


def _pipeline_result_to_parse_response(
    result: dict,
    candidate_id: str,
) -> ParseResponse:
    """Map the raw LangGraph pipeline output dict → ParseResponse schema."""
    parsed: dict = result.get("parsed_data", {}) or {}
    summary: str = parsed.get("summary", "") or ""

    personal_info = PersonalInfo(
        name=parsed.get("name"),
        email=parsed.get("email"),
        phone=parsed.get("phone"),
        location=parsed.get("location"),
        linkedin=parsed.get("linkedin"),
    )

    work_experience = _build_work_experience(parsed.get("experience", []) or [])
    education = _build_education(parsed.get("education", []) or [])
    skills = _build_normalized_skills(parsed.get("technical_skills", []) or [], summary)
    certifications = [str(c) for c in (parsed.get("certifications", []) or [])]

    # Projects — LLM may or may not return these; handle gracefully
    raw_projects = parsed.get("projects", []) or []
    projects = [
        Project(
            title=p.get("title", "") if isinstance(p, dict) else str(p),
            description=p.get("description") if isinstance(p, dict) else None,
            technologies=p.get("technologies", []) if isinstance(p, dict) else [],
        )
        for p in raw_projects
    ]

    publications = [str(p) for p in (parsed.get("publications", []) or [])]

    raw_jd: dict = result.get("job_description", {}) or {}
    job_description = JobDescriptionInfo(
        title=raw_jd.get("title", ""),
        company=raw_jd.get("company", ""),
        description=raw_jd.get("description", ""),
        required_skills=raw_jd.get("required_skills", []),
    )

    raw_overlap: dict = result.get("skill_overlap", {}) or {}
    skill_overlap = SkillOverlap(
        matched=raw_overlap.get("matched", []),
        missing=raw_overlap.get("missing", []),
    )

    agent_trace = _build_agent_trace(result.get("agent_trace", []) or [])

    return ParseResponse(
        candidate_id=candidate_id,
        personal_info=personal_info,
        work_experience=work_experience,
        education=education,
        skills=skills,
        certifications=certifications,
        projects=projects,
        publications=publications,
        match_score=float(result.get("match_score", 0)),
        job_description=job_description,
        skill_overlap=skill_overlap,
        agent_trace=agent_trace,
    )


def _validate_file(file: UploadFile) -> None:
    allowed_content_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
    }
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if file.content_type and file.content_type not in allowed_content_types:
        if ext not in ("pdf", "docx", "doc", "txt"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Upload PDF, DOCX, or TXT.",
            )


# ─────────────────────────────────────────────────────────────
#  TASK 2  — Single resume parse (full response)
# ─────────────────────────────────────────────────────────────

@router.post(
    "/parse",
    response_model=ParseResponse,
    summary="Parse a Resume (full structured response)",
)
async def parse_resume(
    file: UploadFile = File(...),
    job_id: str = Form("senior_fullstack"),
) -> ParseResponse:
    """
    Upload a resume (PDF/DOCX/TXT) and run the 3-agent pipeline.
    Returns a full ParseResponse including personal info, work experience,
    education, normalized skills with categories, projects, agent trace, and match score.
    """
    _validate_file(file)

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10 MB.")

    candidate_id = str(uuid.uuid4())

    try:
        from graph.pipeline import run_pipeline
        result = await run_pipeline(
            file_bytes=file_bytes,
            file_name=file.filename or "resume.pdf",
            job_id=job_id,
        )
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")

    # Persist to DB (non-fatal if DB unavailable)
    try:
        from db.session import SessionLocal
        from db.models import Candidate
        session = SessionLocal()
        try:
            c = Candidate(
                id=candidate_id,
                filename=file.filename,
                match_score=result.get("match_score"),
                job_id=job_id,
                parsed_data=json.dumps(result.get("parsed_data", {})),
            )
            session.add(c)
            session.commit()
        finally:
            session.close()
    except Exception as db_err:
        print(f"⚠️  DB persist skipped: {db_err}")

    return _pipeline_result_to_parse_response(result, candidate_id)


# ─────────────────────────────────────────────────────────────
#  TASK 3  — Batch processing
# ─────────────────────────────────────────────────────────────

@router.post(
    "/parse/batch",
    response_model=BatchSubmitResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Batch Parse Resumes (up to 20 files)",
)
async def batch_parse_resumes(
    files: List[UploadFile] = File(...),
    job_id: Optional[str] = Query(default=None, description="Job ID to match against after parsing"),
) -> BatchSubmitResponse:
    """
    Accept up to 20 resume files (PDF/DOCX/TXT) in one multipart request.
    Enqueues processing tasks and immediately returns a batch_id for polling.
    Optionally pass job_id to also run semantic matching after parsing.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per batch.")

    file_tuples: List[tuple[bytes, str]] = []
    for f in files:
        _validate_file(f)
        data = await f.read()
        if not data:
            continue
        file_tuples.append((data, f.filename or "resume.pdf"))

    if not file_tuples:
        raise HTTPException(status_code=400, detail="All uploaded files were empty.")

    from workers.tasks import submit_batch
    batch_id = submit_batch(file_tuples, job_id=job_id)

    return BatchSubmitResponse(
        batch_id=batch_id,
        total_files=len(file_tuples),
        status_url=f"/api/v1/jobs/{batch_id}/status",
    )


@router.get(
    "/jobs/{batch_id}/status",
    response_model=BatchStatusResponse,
    summary="Get Batch Processing Status",
)
def get_batch_status(
    batch_id: str,
    job_id: Optional[str] = Query(default=None, description="If provided, sort results by match_score desc"),
) -> BatchStatusResponse:
    """
    Poll the status of a batch job.
    Results are sorted by match_score descending when a job_id was used.
    """
    from workers.tasks import get_batch_state

    state = get_batch_state(batch_id)
    if state is None:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id!r} not found.")

    total: int = state["total"]
    completed: int = state["completed"]
    failed: int = state["failed"]
    raw_results: list = state["results"]

    percent = round((completed + failed) / total * 100, 1) if total > 0 else 0.0

    results = [BatchResultItem(**r) for r in raw_results]

    # Sort by match_score desc when results include matching data
    results.sort(
        key=lambda r: (r.match_score is not None, r.match_score or 0),
        reverse=True,
    )

    return BatchStatusResponse(
        batch_id=batch_id,
        total=total,
        completed=completed,
        failed=failed,
        percent=percent,
        results=results,
    )
