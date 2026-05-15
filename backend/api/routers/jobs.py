"""
api/routers/jobs.py — Job Description CRUD endpoints.

POST   /api/v1/job-descriptions          → create a JD (201)
GET    /api/v1/job-descriptions?q=       → list all JDs (id,title,company,created_at)
GET    /api/v1/job-descriptions/{id}     → get full JD

TASK 1 COMPLETE — endpoints ready:
  POST /api/v1/job-descriptions
  GET  /api/v1/job-descriptions
  GET  /api/v1/job-descriptions/{id}
"""

import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.schemas import JobDescriptionCreate, JobDescriptionResponse, JobDescriptionListItem
from db.models import JobDescription
from db.session import get_db

router = APIRouter()


def _row_to_response(row: JobDescription) -> JobDescriptionResponse:
    """Convert a DB row to the full response schema."""
    return JobDescriptionResponse(
        id=uuid.UUID(row.id),
        title=row.title,
        company=row.company,
        raw_text=row.raw_text,
        required_skills=json.loads(row.required_skills or "[]"),
        nice_to_have_skills=json.loads(row.nice_to_have_skills or "[]"),
        min_experience_years=row.min_experience_years or 0,
        education_requirement=row.education_requirement,
        created_at=row.created_at,
    )


def _row_to_list_item(row: JobDescription) -> JobDescriptionListItem:
    """Convert a DB row to the lightweight list item schema."""
    return JobDescriptionListItem(
        id=uuid.UUID(row.id),
        title=row.title,
        company=row.company,
        created_at=row.created_at,
    )


@router.post(
    "/job-descriptions",
    response_model=JobDescriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a Job Description",
)
def create_job_description(
    body: JobDescriptionCreate,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Accept a full job description payload and save it to the database."""
    row = JobDescription(
        id=str(uuid.uuid4()),
        title=body.title,
        company=body.company,
        raw_text=body.raw_text,
        required_skills=json.dumps(body.required_skills),
        nice_to_have_skills=json.dumps(body.nice_to_have_skills),
        min_experience_years=body.min_experience_years,
        education_requirement=body.education_requirement,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_response(row)


@router.get(
    "/job-descriptions",
    response_model=List[JobDescriptionListItem],
    summary="List Job Descriptions",
)
def list_job_descriptions(
    q: Optional[str] = Query(default=None, description="Filter by title or company"),
    db: Session = Depends(get_db),
) -> List[JobDescriptionListItem]:
    """Return all job descriptions. Optionally filter by title or company with ?q=."""
    query = db.query(JobDescription)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            (JobDescription.title.ilike(pattern)) |
            (JobDescription.company.ilike(pattern))
        )
    rows = query.order_by(JobDescription.created_at.desc()).all()
    return [_row_to_list_item(r) for r in rows]


@router.get(
    "/job-descriptions/{jd_id}",
    response_model=JobDescriptionResponse,
    summary="Get a Job Description by ID",
)
def get_job_description(
    jd_id: str,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Return the full job description for the given UUID."""
    row = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Job description {jd_id!r} not found.")
    return _row_to_response(row)
