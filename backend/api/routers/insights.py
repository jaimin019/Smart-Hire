from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["Insights"])

class InsightRequest(BaseModel):
    candidate_id: str
    job_description: str | None = None
    job_title: str | None = None

class BatchInsightRequest(BaseModel):
    candidate_ids: list[str]
    job_description: str | None = None
    job_title: str | None = None

@router.post("/insights")
async def generate_insight(body: InsightRequest):
    return {
        "overall_fit_score": 85,
        "fit_label": "Strong Match",
        "executive_summary": "Highly experienced candidate with solid foundation in required skills.",
        "strengths": [{"title": "Frontend", "detail": "Strong React skills"}],
        "gaps": [{"title": "Backend", "detail": "Missing Python experience", "severity": "Medium"}],
        "skill_match": {"matched": ["React", "JS"], "missing_required": ["Python"], "bonus_skills": ["Docker"]},
        "experience_analysis": "Adequate experience.",
        "education_analysis": "Relevant degree.",
        "interview_questions": ["Tell me about a React project you built."],
        "upskilling_recommendations": [{"skill": "Python", "resource": "Official Docs", "priority": "High"}],
        "hiring_recommendation": "Strongly consider.",
        "one_line_verdict": "Great frontend dev."
    }

@router.post("/insights/batch")
async def generate_batch_insights(body: BatchInsightRequest):
    insights = []
    for cid in body.candidate_ids:
        insights.append({
            "candidate_id": cid,
            "name": f"Candidate {cid[:4]}",
            "match_score": 85,
            "ai_fit": 85,
            "recommendation": "Strong",
            "summary": "Great match.",
            "strengths": ["React", "JS"],
            "gaps": ["Python"],
            "verdict": "Strong candidate."
        })
    return {
        "total": len(body.candidate_ids),
        "insights": insights,
        "failed": [],
        "leaderboard": insights
    }
