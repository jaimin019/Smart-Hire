"""
api/schemas.py — All Pydantic v2 schemas for Smart Hire API.

────────────────────────────────────────────────────────────────
FINAL ParseResponse JSON SCHEMA (for frontend / Het)
────────────────────────────────────────────────────────────────
{
  "candidate_id": "uuid-string",
  "personal_info": {
    "name": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "location": "string | null",
    "linkedin": "string | null"
  },
  "work_experience": [
    {
      "company": "string",
      "role": "string",
      "start_date": "string | null",
      "end_date": "string | null",
      "duration_months": "int | null",
      "responsibilities": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string | null",
      "field": "string | null",
      "year": "string | null"
    }
  ],
  "skills": [
    {
      "raw": "string",
      "canonical": "string",
      "category": "string",
      "proficiency": "Expert | Intermediate | Beginner",
      "is_emerging": false
    }
  ],
  "certifications": ["string"],
  "projects": [
    {
      "title": "string",
      "description": "string | null",
      "technologies": ["string"]
    }
  ],
  "publications": ["string"],
  "match_score": 0.0,
  "job_description": {
    "title": "string",
    "company": "string",
    "description": "string",
    "required_skills": ["string"]
  },
  "skill_overlap": {
    "matched": ["string"],
    "missing": ["string"]
  },
  "agent_trace": [
    {
      "agent": "string",
      "status": "string",
      "latency_ms": "int | null",
      "tokens_used": "int | null",
      "error": "string | null"
    }
  ]
}
────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
#  TASK 1  —  Job Description schemas
# ─────────────────────────────────────────────────────────────

class JobDescriptionCreate(BaseModel):
    title: str
    company: Optional[str] = None
    raw_text: str
    required_skills: List[str] = []
    nice_to_have_skills: List[str] = []
    min_experience_years: int = 0
    education_requirement: Optional[str] = None


class JobDescriptionResponse(JobDescriptionCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class JobDescriptionListItem(BaseModel):
    """Lightweight list item — id, title, company, created_at only."""
    id: UUID
    title: str
    company: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────
#  TASK 2  —  Full ParseResponse schemas
# ─────────────────────────────────────────────────────────────

class PersonalInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None


class WorkExperience(BaseModel):
    company: str = ""
    role: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_months: Optional[int] = None
    responsibilities: List[str] = []


class Education(BaseModel):
    institution: str = ""
    degree: Optional[str] = None
    field: Optional[str] = None
    year: Optional[str] = None


class NormalizedSkill(BaseModel):
    raw: str
    canonical: str
    category: str = "General"
    proficiency: str = "Intermediate"   # Expert | Intermediate | Beginner
    is_emerging: bool = False


class Project(BaseModel):
    title: str = ""
    description: Optional[str] = None
    technologies: List[str] = []


class AgentObservability(BaseModel):
    agent: str
    status: str
    latency_ms: Optional[int] = None
    tokens_used: Optional[int] = None
    error: Optional[str] = None
    # carry-through fields from existing trace format
    chars_extracted: Optional[int] = None
    skills_found: Optional[int] = None
    cosine_similarity: Optional[float] = None
    match_score: Optional[float] = None


class SkillOverlap(BaseModel):
    matched: List[str] = []
    missing: List[str] = []


class JobDescriptionInfo(BaseModel):
    title: str
    company: str
    description: str
    required_skills: List[str] = []


class ParseResponse(BaseModel):
    candidate_id: str                        # UUID string
    personal_info: PersonalInfo
    work_experience: List[WorkExperience] = []
    education: List[Education] = []
    skills: List[NormalizedSkill] = []
    certifications: List[str] = []
    projects: List[Project] = []
    publications: List[str] = []
    match_score: float
    job_description: JobDescriptionInfo
    skill_overlap: SkillOverlap
    agent_trace: List[AgentObservability] = []


# ─────────────────────────────────────────────────────────────
#  TASK 3  —  Batch Processing schemas
# ─────────────────────────────────────────────────────────────

class BatchSubmitResponse(BaseModel):
    batch_id: str
    total_files: int
    status_url: str


class BatchResultItem(BaseModel):
    filename: str
    candidate_id: Optional[str] = None
    match_score: Optional[float] = None
    status: str                            # "done" | "failed" | "pending"
    error: Optional[str] = None


class BatchStatusResponse(BaseModel):
    batch_id: str
    total: int
    completed: int
    failed: int
    percent: float
    results: List[BatchResultItem] = []
