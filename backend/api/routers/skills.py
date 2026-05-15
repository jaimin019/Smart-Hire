"""
TASK 1 — Skill Taxonomy API
GET /api/v1/skills/taxonomy   — browse or search the taxonomy
GET /api/v1/skills/{skill_name}/detail — detail + related skills

Builds an in-memory skill_index at import time from data/skill_taxonomy.json.
"""

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/skills", tags=["Skills Taxonomy"])

# ── Load taxonomy JSON ──────────────────────────────────────────────────────────

_TAXONOMY_PATH = Path(__file__).parent.parent.parent / "data" / "skill_taxonomy.json"

with open(_TAXONOMY_PATH, encoding="utf-8") as _f:
    TAXONOMY: dict[str, dict[str, list[str]]] = json.load(_f)

# ── Total skill count ───────────────────────────────────────────────────────────

TOTAL_SKILLS: int = sum(
    len(skills)
    for subcats in TAXONOMY.values()
    for skills in subcats.values()
)

# ── Synonyms table (canonical → list of aliases) ────────────────────────────────

_SYNONYMS: dict[str, list[str]] = {
    "Python": ["py", "python3", "python2", "cpython"],
    "JavaScript": ["js", "es6", "ecmascript", "es2015"],
    "TypeScript": ["ts", "tsc"],
    "Java": ["jdk", "jre", "jvm"],
    "C++": ["cpp", "c plus plus"],
    "C#": ["csharp", "dotnet c#", "c sharp"],
    "Go": ["golang"],
    "Rust": ["rustlang"],
    "Kotlin": ["kotlin jvm"],
    "Swift": ["swift ios"],
    "Ruby": ["ruby lang"],
    "PHP": ["php lang"],
    "Scala": ["scala lang"],
    "Bash": ["bash script", "shell script", "sh"],
    "PowerShell": ["pwsh", "powershell core"],
    "SQL": ["structured query language"],
    "PostgreSQL": ["postgres", "pg", "pgsql"],
    "MySQL": ["my sql"],
    "SQLite": ["sqlite3"],
    "MongoDB": ["mongo"],
    "Redis": ["redis cache"],
    "Elasticsearch": ["elastic", "es"],
    "Docker": ["docker container", "containerization"],
    "Kubernetes": ["k8s", "kube"],
    "Terraform": ["tf", "terraform iac"],
    "Ansible": ["ansible automation"],
    "TensorFlow": ["tf", "tensorflow2"],
    "PyTorch": ["torch"],
    "Scikit-learn": ["sklearn", "scikit learn"],
    "Pandas": ["pandas dataframe"],
    "NumPy": ["numpy", "np"],
    "React": ["reactjs", "react.js", "react js"],
    "Vue.js": ["vuejs", "vue", "vue js"],
    "Angular": ["angularjs", "angular js"],
    "Next.js": ["nextjs", "next js"],
    "Nuxt.js": ["nuxtjs", "nuxt js"],
    "Express.js": ["expressjs", "express js", "express"],
    "NestJS": ["nest.js", "nest js"],
    "FastAPI": ["fast api"],
    "Django": ["django framework"],
    "Flask": ["flask framework"],
    "Tailwind CSS": ["tailwind", "tailwindcss"],
    "Bootstrap": ["bootstrap css", "bootstrap framework"],
    "AWS": ["amazon web services", "amazon aws"],
    "GCP": ["google cloud", "google cloud platform"],
    "Azure": ["microsoft azure", "ms azure"],
    "CI/CD": ["continuous integration", "continuous deployment", "cicd"],
    "Machine Learning": ["ml"],
    "Deep Learning": ["dl"],
    "NLP": ["natural language processing"],
    "Computer Vision": ["cv"],
    "Hugging Face Transformers": ["huggingface", "hugging face", "transformers"],
    "LangChain": ["langchain"],
    "LangGraph": ["langgraph"],
    "GitHub Actions": ["gha", "gh actions"],
    "GitLab CI/CD": ["gitlab ci", "gitlab pipelines"],
    "Jupyter Notebook": ["jupyter", "ipynb"],
    "Tableau": ["tableau desktop"],
    "Power BI": ["powerbi", "pbi"],
    "Figma": ["figma design"],
    "Photoshop": ["adobe photoshop", "ps"],
    "Illustrator": ["adobe illustrator", "ai"],
    "Jira": ["jira software"],
    "Scrum": ["scrum methodology"],
    "Agile": ["agile methodology", "agile software development"],
    "GraphQL": ["gql"],
    "REST API": ["rest", "restful", "restful api"],
    "gRPC": ["grpc protocol"],
    "WebSocket": ["ws", "websockets"],
    "OAuth 2.0": ["oauth", "oauth2"],
    "JWT": ["json web token"],
    "GDPR": ["general data protection regulation"],
    "HIPAA": ["health insurance portability"],
    "SOC 2": ["soc2"],
    "ISO 27001": ["iso27001", "iso/iec 27001"],
    "PCI DSS": ["pci", "payment card industry"],
}

# ── Build flat skill index ──────────────────────────────────────────────────────

# skill_index: lowercase key → {canonical, category, subcategory, synonyms}
skill_index: dict[str, dict[str, Any]] = {}

for _category, _subcats in TAXONOMY.items():
    for _subcategory, _skills in _subcats.items():
        for _skill in _skills:
            _entry = {
                "canonical": _skill,
                "category": _category,
                "subcategory": _subcategory,
                "synonyms": _SYNONYMS.get(_skill, []),
            }
            _key = _skill.lower()
            skill_index[_key] = _entry
            # Also index every synonym → same entry
            for _syn in _SYNONYMS.get(_skill, []):
                skill_index[_syn.lower()] = _entry

print(f"[TalentGraph] Skill index built: {len(skill_index)} keys ({TOTAL_SKILLS} canonical skills)")


# ── Response Models ─────────────────────────────────────────────────────────────

class SubcategoryOut(BaseModel):
    name: str
    skill_count: int
    skills: list[str] | None = None  # only returned when filtering


class CategoryOut(BaseModel):
    name: str
    subcategories: list[SubcategoryOut]


class TaxonomyResponse(BaseModel):
    total: int
    categories: list[CategoryOut]


class SkillDetailResponse(BaseModel):
    canonical: str
    category: str
    subcategory: str
    synonyms: list[str]
    related_skills: list[str]  # other skills in same subcategory (up to 10)


# ── Endpoints ───────────────────────────────────────────────────────────────────

@router.get("/taxonomy", response_model=TaxonomyResponse, summary="Browse or search the skill taxonomy")
async def get_taxonomy(
    category: str | None = Query(None, description="Filter to a specific top-level category (case-insensitive)"),
    subcategory: str | None = Query(None, description="Filter to a specific subcategory (case-insensitive)"),
    q: str | None = Query(None, description="Search for skills by name (case-insensitive contains)"),
    limit: int = Query(100, ge=1, le=1000, description="Max skills per subcategory when listing"),
    offset: int = Query(0, ge=0),
):
    """
    Browse the full skill taxonomy or filter/search it.

    - **category**: return only that top-level category
    - **subcategory**: return skills for that subcategory (also include skill list)
    - **q**: search skill names containing the query string; always returns skill lists
    - **limit / offset**: paginate skill lists when filters are applied
    """
    include_skills = bool(subcategory or q)
    result_categories: list[CategoryOut] = []
    total = 0

    for cat_name, subcats in TAXONOMY.items():
        # Category filter
        if category and cat_name.lower() != category.lower():
            continue

        subcat_list: list[SubcategoryOut] = []

        for sub_name, raw_skills in subcats.items():
            # Subcategory filter
            if subcategory and sub_name.lower() != subcategory.lower():
                continue

            # Query search filter
            if q:
                matched = [s for s in raw_skills if q.lower() in s.lower()]
            else:
                matched = raw_skills

            if not matched:
                continue

            # Apply pagination only when filters return skill lists
            paged = matched[offset: offset + limit] if include_skills else matched

            subcat_list.append(
                SubcategoryOut(
                    name=sub_name,
                    skill_count=len(matched),
                    skills=paged if include_skills else None,
                )
            )
            total += len(matched)

        if subcat_list:
            result_categories.append(CategoryOut(name=cat_name, subcategories=subcat_list))

    if not include_skills:
        # When no filter: total = all skills across matched categories
        total = sum(
            len(skills)
            for cat_name, subcats in TAXONOMY.items()
            if not category or cat_name.lower() == category.lower()
            for skills in subcats.values()
        )

    return TaxonomyResponse(total=total, categories=result_categories)


@router.get("/{skill_name}/detail", response_model=SkillDetailResponse, summary="Get skill detail and related skills")
async def get_skill_detail(skill_name: str):
    """
    Returns canonical form, category, subcategory, synonyms, and up to 10 related skills
    (other skills in the same subcategory).
    """
    entry = skill_index.get(skill_name.lower())
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found in taxonomy.")

    # Fetch sibling skills from same subcategory
    siblings = TAXONOMY.get(entry["category"], {}).get(entry["subcategory"], [])
    related = [s for s in siblings if s.lower() != entry["canonical"].lower()][:10]

    return SkillDetailResponse(
        canonical=entry["canonical"],
        category=entry["category"],
        subcategory=entry["subcategory"],
        synonyms=entry["synonyms"],
        related_skills=related,
    )
