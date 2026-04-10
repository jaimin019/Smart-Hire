"""
TASK 2 + TASK 3 — Candidates Router
Endpoints:
  POST /api/v1/compare      — compare two candidates against a job
  GET  /api/v1/candidates/{candidate_id} — retrieve stored candidate ParseResponse
"""

import os
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["Candidates"])


# ── Models ──────────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    candidate_id_1: str
    candidate_id_2: str
    job_id: str


class CandidateSummary(BaseModel):
    candidate_id: str
    name: str
    overall_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    experience_years: float
    education: str


class ComparisonResult(BaseModel):
    winner: str
    score_diff: float
    skills_only_in_1: list[str]
    skills_only_in_2: list[str]
    shared_skills: list[str]
    recommendation: str


class CompareResponse(BaseModel):
    job_title: str
    candidates: list[CandidateSummary]
    comparison: ComparisonResult


# ── Matching helpers ─────────────────────────────────────────────────────────────

def _compute_skill_overlap(candidate_skills: list[str], required_skills: list[str]) -> dict:
    """Reuse the same logic as matcher_agent without importing it (avoids circular)."""
    candidate_lower = {s.lower() for s in candidate_skills}
    matched, missing = [], []
    for skill in required_skills:
        (matched if skill.lower() in candidate_lower else missing).append(skill)
    return {"matched": matched, "missing": missing}


def _compute_score(candidate_skills: list[str], job_description: str) -> float:
    """Compute cosine similarity score (0-100) using the shared sentence-transformer model."""
    try:
        from agents.matcher_agent import _get_model, _cosine_similarity
        import numpy as np
        model = _get_model()
        candidate_text = "Candidate skills: " + ", ".join(candidate_skills)
        embeddings = model.encode([candidate_text, job_description])
        similarity = _cosine_similarity(embeddings[0], embeddings[1])
        return round(min(max(similarity * 100, 0), 100), 1)
    except Exception as e:
        print(f"[matcher] Score computation fallback: {e}")
        # Fallback: simple overlap ratio * 100
        return 50.0


def _estimate_experience_years(experience: list[dict]) -> float:
    """Rough estimate: count number of experience entries * 1.5 years average."""
    if not experience:
        return 0.0
    return round(len(experience) * 1.5, 1)


def _format_education(education: list[dict]) -> str:
    """Return the highest/most relevant education entry as a string."""
    if not education:
        return "Not specified"
    edu = education[0]
    parts = [edu.get("degree", ""), edu.get("institution", ""), edu.get("year", "")]
    return ", ".join(p for p in parts if p) or "Not specified"


async def _generate_recommendation(
    winner_name: str,
    winner_score: float,
    other_name: str,
    other_score: float,
    job_title: str,
    key_diff: str,
) -> str:
    """Generate a 1-sentence recommendation via OpenAI, with a template fallback."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return (
            f"{winner_name} (score {winner_score:.1f}) is a better fit for the {job_title} role "
            f"than {other_name} (score {other_score:.1f}) due to stronger alignment in: {key_diff}."
        )

    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage

        prompt = (
            f"In one sentence, explain why {winner_name} (score: {winner_score:.1f}/100) "
            f"is a better fit for the {job_title} role than {other_name} "
            f"(score: {other_score:.1f}/100). "
            f"Their key differentiator: {key_diff}. "
            f"Be concise and professional."
        )
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, api_key=api_key)
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
    except Exception as e:
        print(f"[fallback] LLM recommendation fallback: {e}")
        return (
            f"{winner_name} (score {winner_score:.1f}) outperforms {other_name} "
            f"(score {other_score:.1f}) for the {job_title} position, "
            f"with stronger coverage in {key_diff}."
        )


# ── POST /api/v1/compare ────────────────────────────────────────────────────────

@router.post("/compare", response_model=CompareResponse, summary="Compare two candidates against a job")
async def compare_candidates(body: CompareRequest):
    """
    Compare two stored candidates against a job description.

    Loads candidate parsed_data from SQLite, runs semantic matching,
    and returns a structured diff with an LLM-generated recommendation.
    """
    from db.sqlite_db import get_candidate, get_job
    from agents.matcher_agent import JOB_DESCRIPTIONS

    # ── Load candidates ─────────────────────────────────────────────────────────
    c1_row = await get_candidate(body.candidate_id_1)
    c2_row = await get_candidate(body.candidate_id_2)

    if c1_row is None:
        raise HTTPException(status_code=404, detail=f"Candidate '{body.candidate_id_1}' not found.")
    if c2_row is None:
        raise HTTPException(status_code=404, detail=f"Candidate '{body.candidate_id_2}' not found.")

    # ── Load job description ────────────────────────────────────────────────────
    # Try DB first, then fall back to hardcoded JOB_DESCRIPTIONS
    job_row = await get_job(body.job_id)
    if job_row is not None:
        job = job_row
    elif body.job_id in JOB_DESCRIPTIONS:
        jd = JOB_DESCRIPTIONS[body.job_id]
        job = {
            "id": body.job_id,
            "title": jd["title"],
            "company": jd["company"],
            "description": jd["description"],
            "required_skills": jd["required_skills"],
        }
    else:
        raise HTTPException(status_code=404, detail=f"Job '{body.job_id}' not found.")

    required_skills: list[str] = job.get("required_skills", [])
    job_description_text: str = job.get("description", "")

    # ── Extract candidate data ──────────────────────────────────────────────────
    def _extract(row: dict, label: str) -> dict:
        pd = row.get("parsed_data", {})
        # parsed_data might be the full ParseResponse dict stored by main.py
        if "parsed_data" in pd:
            pd = pd["parsed_data"]
        return pd

    pd1 = _extract(c1_row, "candidate 1")
    pd2 = _extract(c2_row, "candidate 2")

    skills1: list[str] = pd1.get("technical_skills", [])
    skills2: list[str] = pd2.get("technical_skills", [])

    name1: str = pd1.get("name") or c1_row.get("name") or "Candidate 1"
    name2: str = pd2.get("name") or c2_row.get("name") or "Candidate 2"

    # ── Compute scores ──────────────────────────────────────────────────────────
    score1 = _compute_score(skills1, job_description_text)
    score2 = _compute_score(skills2, job_description_text)

    overlap1 = _compute_skill_overlap(skills1, required_skills)
    overlap2 = _compute_skill_overlap(skills2, required_skills)

    exp_years1 = _estimate_experience_years(pd1.get("experience", []))
    exp_years2 = _estimate_experience_years(pd2.get("experience", []))

    edu1 = _format_education(pd1.get("education", []))
    edu2 = _format_education(pd2.get("education", []))

    # ── Skill diff ──────────────────────────────────────────────────────────────
    set1 = {s.lower() for s in skills1}
    set2 = {s.lower() for s in skills2}

    skills_only_in_1 = [s for s in skills1 if s.lower() not in set2]
    skills_only_in_2 = [s for s in skills2 if s.lower() not in set1]
    shared_skills = [s for s in skills1 if s.lower() in set2]

    # ── Determine winner ────────────────────────────────────────────────────────
    if score1 >= score2:
        winner_id = body.candidate_id_1
        winner_name, winner_score = name1, score1
        other_name, other_score = name2, score2
        key_diff_skills = skills_only_in_1[:3]
    else:
        winner_id = body.candidate_id_2
        winner_name, winner_score = name2, score2
        other_name, other_score = name1, score1
        key_diff_skills = skills_only_in_2[:3]

    key_diff = ", ".join(key_diff_skills) if key_diff_skills else "overall skill alignment"

    recommendation = await _generate_recommendation(
        winner_name, winner_score, other_name, other_score, job["title"], key_diff
    )

    # ── Build response ──────────────────────────────────────────────────────────
    return CompareResponse(
        job_title=job["title"],
        candidates=[
            CandidateSummary(
                candidate_id=body.candidate_id_1,
                name=name1,
                overall_score=score1,
                matched_skills=overlap1["matched"],
                missing_skills=overlap1["missing"],
                experience_years=exp_years1,
                education=edu1,
            ),
            CandidateSummary(
                candidate_id=body.candidate_id_2,
                name=name2,
                overall_score=score2,
                matched_skills=overlap2["matched"],
                missing_skills=overlap2["missing"],
                experience_years=exp_years2,
                education=edu2,
            ),
        ],
        comparison=ComparisonResult(
            winner=winner_id,
            score_diff=round(abs(score1 - score2), 1),
            skills_only_in_1=skills_only_in_1,
            skills_only_in_2=skills_only_in_2,
            shared_skills=shared_skills,
            recommendation=recommendation,
        ),
    )


# ── GET /api/v1/candidates/{candidate_id} ───────────────────────────────────────

@router.get("/candidates/{candidate_id}", summary="Retrieve stored candidate data")
async def get_candidate_by_id(candidate_id: str):
    """
    Retrieve the full ParseResponse JSON stored for a candidate.
    Returns 404 if not found.
    """
    from db.sqlite_db import get_candidate

    row = await get_candidate(candidate_id)
    if row is None:
        raise HTTPException(status_code=404, detail={"error": "Candidate not found"})

    # Return exactly what was stored (the full ParseResponse dict)
    return row["parsed_data"]


# ── GET /api/v1/candidates ───────────────────────────────────────────────────────

@router.get("/candidates", summary="List all stored candidates")
async def list_all_candidates(limit: int = 50, offset: int = 0):
    """List stored candidates with basic info (no full parsed_data)."""
    from db.sqlite_db import list_candidates
    rows = await list_candidates(limit=limit, offset=offset)
    return {"candidates": rows, "count": len(rows)}
