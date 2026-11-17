"""
Seed Demo Script — scripts/seed_demo.py

Inserts 5 realistic fake candidates and 3 job descriptions into SQLite,
then runs matching for every candidate × job combination and prints a summary.

Usage:
    python scripts/seed_demo.py
"""

import sys
import os
import uuid
import json

# Make sure the backend root is in sys.path so we can import db, agents, etc.
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _BACKEND_ROOT)

from pathlib import Path
from faker import Faker
from db.sqlite_db import sync_upsert_candidate, sync_upsert_job, sync_list_candidates

fake = Faker()

# ── Job Descriptions ─────────────────────────────────────────────────────────────

JOB_SEEDS = [
    {
        "id": "elip_ai_engineer",
        "title": "Software Engineer — AI Career Agent",
        "company": "Elip (YC W25)",
        "description": (
            "Join Elip, a YC W25 startup, and build an AI career agent used by thousands of job seekers. "
            "Build LLM-powered agents that use tools and remember context. "
            "Match people to jobs through retrieval, ranking and personalisation. "
            "Run semantic search over a large, constantly changing jobs index. "
            "Evaluate and improve LLM output quality. Ship backend features to production and keep them reliable. "
            "Requires hands-on LLM work with prompting, tool use, structured outputs, Python backends, SQL, APIs, and embeddings."
        ),
        "required_skills": [
            "Python", "LLMs", "LangGraph", "FastAPI", "SQL", "REST APIs", "Embeddings",
            "Semantic Search", "Vector Search", "Docker", "Git", "Prompt Engineering",
        ],
    },
    {
        "id": "senior_fullstack",
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
            "REST API", "Git",
        ],
    },
    {
        "id": "ml_engineer",
        "title": "Machine Learning Engineer",
        "company": "AI Solutions Ltd.",
        "description": (
            "Seeking a Machine Learning Engineer with expertise in Python, "
            "TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy, SQL, "
            "Docker, AWS, NLP, Deep Learning, Computer Vision, MLOps, "
            "and experience with large language models and RAG pipelines."
        ),
        "required_skills": [
            "Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas",
            "NumPy", "SQL", "Docker", "AWS", "NLP", "Deep Learning",
            "LangChain", "RAG",
        ],
    },
    {
        "id": "frontend_developer",
        "title": "Senior Frontend Developer",
        "company": "DesignHub Co.",
        "description": (
            "Looking for a Senior Frontend Developer skilled in React, "
            "TypeScript, Next.js, Tailwind CSS, CSS, HTML, JavaScript, "
            "Figma, REST APIs, GraphQL, Git, testing frameworks, "
            "accessibility (WCAG), and responsive design."
        ),
        "required_skills": [
            "React", "TypeScript", "Next.js", "Tailwind CSS", "CSS",
            "HTML", "JavaScript", "Figma", "REST API", "GraphQL", "Git",
            "Jest", "Playwright",
        ],
    },
]

# ── Candidate Templates ──────────────────────────────────────────────────────────

CANDIDATE_TEMPLATES = [
    # 1 — Full-Stack powerhouse
    {
        "profile": "fullstack_senior",
        "technical_skills": [
            "Python", "JavaScript", "TypeScript", "React", "Node.js",
            "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS",
            "GraphQL", "REST API", "Git", "CI/CD", "Redis",
            "FastAPI", "Next.js", "Tailwind CSS", "Jest",
        ],
        "experience_count": 4,
        "degree": "B.Sc. Computer Science",
    },
    # 2 — ML / AI specialist
    {
        "profile": "ml_specialist",
        "technical_skills": [
            "Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas",
            "NumPy", "SQL", "Docker", "AWS", "NLP", "Deep Learning",
            "LangChain", "RAG", "Hugging Face Transformers", "MLflow",
            "FastAPI", "Jupyter Notebook", "Kubernetes",
        ],
        "experience_count": 3,
        "degree": "M.Sc. Artificial Intelligence",
    },
    # 3 — Frontend specialist
    {
        "profile": "frontend_specialist",
        "technical_skills": [
            "React", "TypeScript", "Next.js", "Tailwind CSS", "CSS",
            "HTML", "JavaScript", "Figma", "REST API", "GraphQL",
            "Git", "Jest", "Playwright", "Storybook", "Webpack", "Vite",
        ],
        "experience_count": 3,
        "degree": "B.Sc. Information Technology",
    },
    # 4 — DevOps / Platform engineer
    {
        "profile": "devops_engineer",
        "technical_skills": [
            "Docker", "Kubernetes", "Terraform", "AWS", "GCP", "CI/CD",
            "Jenkins", "GitHub Actions", "Ansible", "Python", "Bash",
            "Prometheus", "Grafana", "ELK Stack", "Helm", "ArgoCD",
            "PostgreSQL", "Redis",
        ],
        "experience_count": 4,
        "degree": "B.Eng. Software Engineering",
    },
    # 5 — Junior full-stack (lower scores expected)
    {
        "profile": "junior_developer",
        "technical_skills": [
            "Python", "JavaScript", "React", "HTML", "CSS",
            "Git", "REST API", "SQL", "Bootstrap", "Node.js",
        ],
        "experience_count": 1,
        "degree": "B.Sc. Computer Science",
    },
]


def _make_experience(count: int, profile: str) -> list[dict]:
    """Generate fake work experience entries."""
    titles_map = {
        "fullstack_senior": ["Full-Stack Developer", "Senior Software Engineer", "Lead Developer", "Software Architect"],
        "ml_specialist": ["ML Engineer", "Data Scientist", "AI Research Engineer", "NLP Engineer"],
        "frontend_specialist": ["Frontend Developer", "UI Engineer", "React Developer", "Web Developer"],
        "devops_engineer": ["DevOps Engineer", "Platform Engineer", "SRE", "Cloud Engineer"],
        "junior_developer": ["Junior Developer", "Software Developer Intern"],
    }
    titles = titles_map.get(profile, ["Software Engineer"])

    experience = []
    for i in range(count):
        title = titles[i % len(titles)]
        years_ago_start = (count - i) * 2
        years_ago_end = (count - i - 1) * 2 if i < count - 1 else 0

        start_year = 2024 - years_ago_start
        end_str = str(2024 - years_ago_end) if years_ago_end > 0 else "Present"

        experience.append({
            "title": title,
            "company": fake.company(),
            "duration": f"{start_year} – {end_str}",
            "highlights": [
                fake.sentence(nb_words=12),
                fake.sentence(nb_words=10),
                fake.sentence(nb_words=10),
            ],
        })
    return experience


def _build_parsed_data(template: dict) -> dict:
    """Build a realistic parsed_data dict from a template."""
    profile = template["profile"]
    name = fake.name()
    email = fake.email()
    phone = fake.phone_number()

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "summary": (
            f"Experienced {profile.replace('_', ' ').title()} with a passion for "
            f"building scalable systems. {fake.sentence(nb_words=15)}"
        ),
        "experience": _make_experience(template["experience_count"], profile),
        "education": [
            {
                "degree": template["degree"],
                "institution": fake.company() + " University",
                "year": str(2024 - template["experience_count"] * 2 - 4),
            }
        ],
        "technical_skills": template["technical_skills"],
        "certifications": (
            [fake.bs().title() + " Certification"] if template["experience_count"] > 2 else []
        ),
    }


# ── Matching ─────────────────────────────────────────────────────────────────────

def _match_score_simple(skills: list[str], required: list[str], description: str) -> tuple[float, list[str], list[str]]:
    """Simple matching without heavy model loading (for seed speed)."""
    candidate_lower = {s.lower() for s in skills}
    matched = [s for s in required if s.lower() in candidate_lower]
    missing = [s for s in required if s.lower() not in candidate_lower]

    # Use overlap ratio as a proxy score (scaled from 40–95)
    overlap_ratio = len(matched) / max(len(required), 1)
    score = round(40 + overlap_ratio * 55, 1)
    return score, matched, missing


def _try_semantic_match(skills: list[str], description: str) -> float | None:
    """Try to use sentence-transformers for a better score."""
    try:
        from agents.matcher_agent import _get_model, _cosine_similarity
        import numpy as np
        model = _get_model()
        candidate_text = "Candidate skills: " + ", ".join(skills)
        embeddings = model.encode([candidate_text, description])
        sim = _cosine_similarity(embeddings[0], embeddings[1])
        return round(min(max(sim * 100, 0), 100), 1)
    except Exception:
        return None


# ── Main ─────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 65)
    print("  Smart Hire -- Demo Data Seed Script")
    print("=" * 65)

    # ── Insert job descriptions ───────────────────────────────────────────────
    print("\n[*] Seeding 3 job descriptions...")
    for job in JOB_SEEDS:
        sync_upsert_job(
            job_id=job["id"],
            title=job["title"],
            company=job["company"],
            description=job["description"],
            required_skills=job["required_skills"],
        )
        print(f"  [OK] [{job['id']}] {job['title']} @ {job['company']}")

    # ── Insert candidates ─────────────────────────────────────────────────────
    print("\n[*] Seeding 5 fake candidates...")
    seeded_ids: list[str] = []

    for template in CANDIDATE_TEMPLATES:
        candidate_id = str(uuid.uuid4())
        parsed_data = _build_parsed_data(template)

        # Build a full ParseResponse-like structure (as stored by /api/v1/parse)
        # We use "senior_fullstack" as the job for the stored match score
        ref_job = JOB_SEEDS[0]
        score, matched, missing = _match_score_simple(
            parsed_data["technical_skills"], ref_job["required_skills"], ref_job["description"]
        )

        full_response = {
            "candidate_id": candidate_id,
            "parsed_data": parsed_data,
            "match_score": score,
            "job_description": {
                "title": ref_job["title"],
                "company": ref_job["company"],
                "description": ref_job["description"],
                "required_skills": ref_job["required_skills"],
            },
            "skill_overlap": {"matched": matched, "missing": missing},
            "agent_trace": [
                {"agent": "Parser", "status": "seeded", "chars_extracted": len(parsed_data["summary"]) * 10},
                {"agent": "Normalizer", "status": "seeded", "skills_found": len(parsed_data["technical_skills"])},
                {"agent": "Matcher", "status": "seeded", "cosine_similarity": round(score / 100, 4), "match_score": score},
            ],
        }

        sync_upsert_candidate(
            candidate_id=candidate_id,
            name=parsed_data["name"],
            email=parsed_data["email"],
            parsed_data=full_response,
        )

        seeded_ids.append(candidate_id)
        print(
            f"  [OK] [{template['profile']:20s}]  {parsed_data['name']:<25s}  "
            f"id={candidate_id}"
        )

    # ── Matching summary table ────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  Matching Summary (Candidate x Job)")
    print("=" * 65)
    header = f"{'Profile':<20} | {'Candidate':<22} | {'Job':<20} | Score  | Matched/Total"
    print(header)
    print("-" * len(header))

    for idx, template in enumerate(CANDIDATE_TEMPLATES):
        candidate_id = seeded_ids[idx]
        parsed_data = _build_parsed_data(template)  # rebuild for display
        for job in JOB_SEEDS:
            score, matched, missing = _match_score_simple(
                template["technical_skills"], job["required_skills"], job["description"]
            )
            total = len(job["required_skills"])
            print(
                f"{template['profile']:<20} | "
                f"{template['profile'].replace('_', ' ')[:22]:<22} | "
                f"{job['title'][:20]:<20} | "
                f"{score:5.1f}% | "
                f"{len(matched)}/{total}"
            )

    # ── Final summary ─────────────────────────────────────────────────────────
    stored = sync_list_candidates()
    print("\n" + "=" * 65)
    print(f"[DONE] Seeding complete!")
    print(f"   Candidates in DB : {len(stored)}")
    print(f"   Job Descriptions : {len(JOB_SEEDS)}")
    print()
    print("[*] Seeded Candidate IDs (use these for /api/v1/compare):")
    for sid, tmpl in zip(seeded_ids, CANDIDATE_TEMPLATES):
        print(f"   {tmpl['profile']:<20} -> {sid}")

    print()
    print("[*] Example compare request:")
    print("  POST /api/v1/compare")
    print("  {")
    print(f'    "candidate_id_1": "{seeded_ids[0]}",')
    print(f'    "candidate_id_2": "{seeded_ids[1]}",')
    print(f'    "job_id": "senior_fullstack"')
    print("  }")
    print()
    print("[*] Base URL: http://localhost:8000")
    print("[*] API Docs: http://localhost:8000/docs")
    print("=" * 65)


if __name__ == "__main__":
    main()
