"""
TASK 2 + TASK 3 — Candidates Router
Endpoints:
  POST /api/v1/compare      — compare two candidates against a job
  POST /api/v1/compare/multi — compare N candidates against a job (ranked)
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


class MultiCompareRequest(BaseModel):
    candidate_ids: list[str]
    job_id: str


class CandidateSummary(BaseModel):
    candidate_id: str
    name: str
    overall_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    experience_years: float
    education: str


class RankedCandidate(BaseModel):
    rank: int
    candidate_id: str
    name: str
    overall_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    experience_years: float
    education: str
    unique_skills: list[str]


class ComparisonResult(BaseModel):
    winner: str
    score_diff: float
    skills_only_in_1: list[str]
    skills_only_in_2: list[str]
    shared_skills: list[str]
    recommendation: str


class MultiComparisonResult(BaseModel):
    winner_id: str
    winner_name: str
    recommendation: str
    skill_coverage_avg: float


class CompareResponse(BaseModel):
    job_title: str
    candidates: list[CandidateSummary]
    comparison: ComparisonResult


class MultiCompareResponse(BaseModel):
    job_title: str
    ranked_candidates: list[RankedCandidate]
    comparison: MultiComparisonResult


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


async def _generate_multi_recommendation(
    ranked: list[dict],
    job_title: str,
) -> str:
    """Generate a short paragraph summarising the top candidates."""
    if not ranked:
        return "No candidates to compare."

    winner = ranked[0]
    api_key = os.getenv("OPENAI_API_KEY")

    summary_lines = [
        f"{i+1}. {c['name']} — score {c['score']:.1f}/100"
        for i, c in enumerate(ranked[:5])
    ]
    summary_text = "\n".join(summary_lines)

    if not api_key:
        return (
            f"{winner['name']} is the top candidate for the {job_title} role "
            f"with a score of {winner['score']:.1f}/100."
        )

    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage

        prompt = (
            f"Given these candidates ranked for the '{job_title}' role:\n{summary_text}\n\n"
            f"Write 2 concise sentences: (1) why the top candidate stands out, "
            f"(2) what hiring managers should look for among the rest. Be professional."
        )
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, api_key=api_key)
        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
    except Exception as e:
        print(f"[fallback] Multi-LLM recommendation fallback: {e}")
        return (
            f"{winner['name']} leads the pack for the {job_title} role "
            f"with a score of {winner['score']:.1f}/100. Review the full rankings below."
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


# ── POST /api/v1/compare/multi ──────────────────────────────────────────────────

@router.post("/compare/multi", response_model=MultiCompareResponse, summary="Rank N candidates against a job")
async def compare_multi_candidates(body: MultiCompareRequest):
    """
    Compare and rank multiple stored candidates (2-50) against a job description.

    Returns a sorted leaderboard with scores, skill overlap, and an AI summary.
    """
    if len(body.candidate_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 candidate IDs.")
    if len(body.candidate_ids) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 candidates per comparison.")

    from db.sqlite_db import get_candidate, get_job
    from agents.matcher_agent import JOB_DESCRIPTIONS

    # ── Load job description ────────────────────────────────────────────────────
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

    # ── Load & score all candidates ─────────────────────────────────────────────
    scored: list[dict] = []
    all_skill_sets: list[set] = []

    for cid in body.candidate_ids:
        row = await get_candidate(cid)
        if row is None:
            print(f"[multi-compare] Candidate {cid} not found, skipping.")
            continue

        pd = row.get("parsed_data", {})
        if "parsed_data" in pd:
            pd = pd["parsed_data"]

        skills: list[str] = pd.get("technical_skills", [])
        name: str = pd.get("name") or row.get("name") or f"Candidate {cid[:6]}..."
        score = _compute_score(skills, job_description_text)
        overlap = _compute_skill_overlap(skills, required_skills)
        exp_years = _estimate_experience_years(pd.get("experience", []))
        edu = _format_education(pd.get("education", []))

        scored.append({
            "candidate_id": cid,
            "name": name,
            "score": score,
            "skills": skills,
            "matched_skills": overlap["matched"],
            "missing_skills": overlap["missing"],
            "experience_years": exp_years,
            "education": edu,
        })
        all_skill_sets.append({s.lower() for s in skills})

    if not scored:
        raise HTTPException(status_code=404, detail="None of the provided candidate IDs were found.")

    # ── Sort by score descending ────────────────────────────────────────────────
    scored.sort(key=lambda x: x["score"], reverse=True)

    # ── Compute unique skills per candidate (not shared by all others) ──────────
    ranked: list[RankedCandidate] = []
    for i, c in enumerate(scored):
        other_skills: set = set()
        for j, s in enumerate(all_skill_sets):
            if scored[j]["candidate_id"] != c["candidate_id"]:
                other_skills |= s
        unique = [s for s in c["skills"] if s.lower() not in other_skills]
        ranked.append(RankedCandidate(
            rank=i + 1,
            candidate_id=c["candidate_id"],
            name=c["name"],
            overall_score=c["score"],
            matched_skills=c["matched_skills"],
            missing_skills=c["missing_skills"],
            experience_years=c["experience_years"],
            education=c["education"],
            unique_skills=unique[:5],
        ))

    # ── Generate recommendation ─────────────────────────────────────────────────
    winner = scored[0]
    recommendation = await _generate_multi_recommendation(scored, job["title"])
    avg_coverage = round(
        sum(len(c["matched_skills"]) / max(len(required_skills), 1) * 100 for c in scored) / len(scored),
        1,
    ) if required_skills else 0.0

    return MultiCompareResponse(
        job_title=job["title"],
        ranked_candidates=ranked,
        comparison=MultiComparisonResult(
            winner_id=winner["candidate_id"],
            winner_name=winner["name"],
            recommendation=recommendation,
            skill_coverage_avg=avg_coverage,
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


@router.get("/candidates", summary="List all stored candidates")
async def list_all_candidates(search: str = "", skill: str = "", sort: str = "recent", page: int = 1, limit: int = 50):
    """List stored candidates with basic info (no full parsed_data)."""
    from db.sqlite_db import list_candidates
    offset = (page - 1) * limit
    # For now, just use the basic list_candidates. In a real app we'd add SQL filters for search/skill
    rows = await list_candidates(limit=limit, offset=offset)
    # Simple Python-side filter for demonstration
    if search:
        s = search.lower()
        rows = [r for r in rows if s in (r.get("name") or "").lower() or s in (r.get("email") or "").lower()]
    return {"candidates": rows, "total": len(rows)}

@router.delete("/candidates/{candidate_id}", summary="Delete a candidate")
async def delete_candidate_by_id(candidate_id: str):
    """Delete a candidate from the database."""
    from db.sqlite_db import delete_candidate
    deleted = await delete_candidate(candidate_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"status": "success", "message": f"Candidate {candidate_id} deleted"}

# ── POST /api/v1/match ─────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    job_description: str
    threshold: float = 0.0
    top_k: int = 0
    candidate_ids: list[str] | None = None

@router.post("/match", summary="Match custom candidates against JD")
async def match_candidates(body: MatchRequest):
    """Match candidates and return leaderboard."""
    from db.sqlite_db import list_candidates, get_candidate
    
    cids = body.candidate_ids
    if not cids:
        all_cands = await list_candidates(limit=100)
        cids = [c["id"] for c in all_cands]
        
    if not cids:
        return {"job_summary": body.job_description[:100], "total_candidates_evaluated": 0, "results": []}

    scored = []
    for cid in cids:
        row = await get_candidate(cid)
        if not row: continue
        pd = row.get("parsed_data", {})
        if "parsed_data" in pd: pd = pd["parsed_data"]
        skills = pd.get("technical_skills", [])
        score = _compute_score(skills, body.job_description)
        if body.threshold > 0 and score < (body.threshold * 100):
            continue
            
        exp_years = _estimate_experience_years(pd.get("experience", []))
        edu = _format_education(pd.get("education", []))

        # Derive a meaningful current title from work experience
        work_exp = pd.get("work_experience", pd.get("experience", []))
        current_title = pd.get("title") or ""
        if not current_title and work_exp and isinstance(work_exp, list) and len(work_exp) > 0:
            first_exp = work_exp[0]
            current_title = first_exp.get("role") or first_exp.get("title") or ""
            if first_exp.get("company"):
                current_title = f"{current_title} at {first_exp['company']}" if current_title else first_exp["company"]
        if not current_title:
            # Fallback: show top skills
            if skills:
                current_title = " · ".join(skills[:3])
            else:
                current_title = edu if edu != "Not specified" else ""

        # Compute matched/missing skills from JD text (extract keywords)
        jd_lower = body.job_description.lower()
        matched_skills = [s for s in skills if s.lower() in jd_lower]
        missing_common = [kw for kw in ["python", "java", "javascript", "react", "node", "sql", "aws", "docker", "kubernetes", "typescript", "go", "rust", "c++", "machine learning", "deep learning", "api", "rest", "graphql", "git", "ci/cd", "agile"]
                          if kw in jd_lower and kw not in [s.lower() for s in skills]]

        scored.append({
            "candidate_id": cid,
            "name": pd.get("name") or row.get("name") or "Unknown",
            "email": pd.get("email") or pd.get("personal_info", {}).get("email") or row.get("email") or "",
            "current_title": current_title,
            "overall_score": score,
            "matched_skills": matched_skills[:10],
            "missing_skills": missing_common[:8],
            "recommendation": "",
            "experience_score": exp_years * 10,
            "education_score": 50,
            "skills": skills,
            "experience_years": exp_years,
            "education": edu
        })

    scored.sort(key=lambda x: x["overall_score"], reverse=True)
    if body.top_k > 0:
        scored = scored[:body.top_k]
        
    return {
        "job_summary": body.job_description[:100] + "...",
        "total_candidates_evaluated": len(cids),
        "results": scored
    }

