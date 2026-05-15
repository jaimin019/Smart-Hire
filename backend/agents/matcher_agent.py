"""
Matcher Agent — Node 3 of the LangGraph pipeline.
Uses sentence-transformers to embed candidate skills,
compares via cosine similarity against a hardcoded job description vector,
and returns a match score out of 100.
"""

import numpy as np
from typing import Any

# Lazy-loaded model singleton
_model = None


def _get_model():
    """Lazy-load sentence-transformer model (imports torch only when needed)."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# ── Hardcoded Job Descriptions for demo ──────────────────────────────────────
JOB_DESCRIPTIONS: dict[str, dict] = {
    "senior_fullstack": {
        "title": "Senior Full-Stack Engineer",
        "company": "TechCorp Inc.",
        "description": (
            "We are looking for a Senior Full-Stack Engineer proficient in "
            "React, TypeScript, Node.js, Python, PostgreSQL, Docker, Kubernetes, "
            "AWS, CI/CD, GraphQL, REST APIs, Git, Agile methodologies, "
            "system design, and microservices architecture. "
            "Experience with Machine Learning and data pipelines is a plus."
        ),
        "required_skills": [
            "React", "TypeScript", "Node.js", "Python", "PostgreSQL",
            "Docker", "Kubernetes", "AWS", "CI/CD", "GraphQL",
            "REST APIs", "Git",
        ],
    },
    "ml_engineer": {
        "title": "Machine Learning Engineer",
        "company": "AI Solutions Ltd.",
        "description": (
            "Seeking a Machine Learning Engineer with expertise in Python, "
            "TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy, SQL, "
            "Docker, AWS, NLP, Deep Learning, Computer Vision, MLOps, "
            "and experience with large language models."
        ),
        "required_skills": [
            "Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas",
            "NumPy", "SQL", "Docker", "AWS", "NLP", "Deep Learning",
        ],
    },
    "frontend_developer": {
        "title": "Senior Frontend Developer",
        "company": "DesignHub Co.",
        "description": (
            "Looking for a Senior Frontend Developer skilled in React, "
            "TypeScript, Next.js, Tailwind CSS, CSS, HTML, JavaScript, "
            "Figma, REST APIs, GraphQL, Git, testing frameworks, "
            "accessibility, and responsive design."
        ),
        "required_skills": [
            "React", "TypeScript", "Next.js", "Tailwind CSS", "CSS",
            "HTML", "JavaScript", "Figma", "REST APIs", "GraphQL", "Git",
        ],
    },
}

DEFAULT_JOB = "senior_fullstack"


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def _compute_skill_overlap(candidate_skills: list[str], required_skills: list[str]) -> dict:
    """Compute which required skills the candidate has."""
    candidate_lower = {s.lower() for s in candidate_skills}
    matched = []
    missing = []
    for skill in required_skills:
        if skill.lower() in candidate_lower:
            matched.append(skill)
        else:
            missing.append(skill)
    return {"matched": matched, "missing": missing}


def matcher_agent(state: dict[str, Any]) -> dict[str, Any]:
    """
    Embeds candidate skills and job description, computes cosine similarity,
    and returns a match score 0-100.

    State Input:
        - parsed_data: dict with 'technical_skills' list
        - job_id (optional): key into JOB_DESCRIPTIONS

    State Output:
        - match_score: float 0-100
        - job_description: the JD used
        - skill_overlap: matched/missing skills
        - agent_trace: updated
    """
    parsed_data: dict = state["parsed_data"]
    trace: list = state.get("agent_trace", [])
    job_id: str = state.get("job_id", DEFAULT_JOB)

    print(f"🎯 Matcher: Starting matching for job_id={job_id}")
    job = JOB_DESCRIPTIONS.get(job_id, JOB_DESCRIPTIONS[DEFAULT_JOB])
    candidate_skills: list[str] = parsed_data.get("technical_skills", [])
    print(f"🎯 Matcher: Candidate has {len(candidate_skills)} skills")

    try:
        model = _get_model()

        # Build text representations
        candidate_text = "Candidate skills: " + ", ".join(candidate_skills)
        job_text = job["description"]

        # Encode
        embeddings = model.encode([candidate_text, job_text])
        candidate_vec = embeddings[0]
        job_vec = embeddings[1]

        # Cosine similarity → score
        similarity = _cosine_similarity(candidate_vec, job_vec)

        # Scale to 0-100, with a floor and slight boost so scores feel meaningful
        raw_score = similarity * 100
        # Apply a curve: scores below 0.3 similarity are very poor
        match_score = round(min(max(raw_score, 0), 100), 1)
    except Exception as e:
        print(f"❌ Matcher Error: {str(e)}")
        import traceback
        traceback.print_exc()
        similarity = 0.0
        match_score = 0.0

    # Skill overlap analysis
    overlap = _compute_skill_overlap(candidate_skills, job["required_skills"])

    trace.append({
        "agent": "Matcher",
        "status": "completed",
        "cosine_similarity": round(similarity, 4),
        "match_score": match_score,
    })

    return {
        **state,
        "match_score": match_score,
        "job_description": {
            "title": job["title"],
            "company": job["company"],
            "description": job["description"],
            "required_skills": job["required_skills"],
        },
        "skill_overlap": overlap,
        "agent_trace": trace,
    }
