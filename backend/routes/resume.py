import os
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.resume import Resume
from schemas.resume import SingleUploadResponse, MultiUploadResponse, MultiUploadResultItem, ResumeResponseData
from utils.file_handler import validate_and_save_file, cleanup_file
from services.parser import parse_resume_file

router = APIRouter(prefix="/api/resume")

@router.post("/upload/single", response_model=SingleUploadResponse)
async def upload_single(file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp_path = None
    try:
        # Validate and save file temporarily
        temp_path = validate_and_save_file(file)

        # Parse resume
        parsed_data = parse_resume_file(temp_path)

        # Save to database
        db_resume = Resume(
            file_name=file.filename or "resume.pdf",
            name=parsed_data.get("name"),
            email=parsed_data.get("email"),
            phone=parsed_data.get("phone"),
            skills=parsed_data.get("skills"),
            education=parsed_data.get("education"),
            experience=parsed_data.get("experience"),
            raw_text=parsed_data.get("raw_text"),
            status="success"
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)

        # Build and return response
        response_data = ResumeResponseData(
            id=db_resume.id,
            file_name=db_resume.file_name,
            name=db_resume.name,
            email=db_resume.email,
            phone=db_resume.phone,
            skills=db_resume.skills or [],
            education=db_resume.education or [],
            experience=db_resume.experience or [],
            created_at=db_resume.created_at
        )
        return SingleUploadResponse(status="success", data=response_data)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_file(temp_path)


@router.post("/upload/multiple", response_model=MultiUploadResponse)
async def upload_multiple(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    batch_id = str(uuid.uuid4())
    results = []
    successful = 0
    failed = 0

    for file in files:
        temp_path = None
        try:
            # Validate and save file temporarily
            temp_path = validate_and_save_file(file)

            # Parse resume
            parsed_data = parse_resume_file(temp_path)

            # Save successful parse to database
            db_resume = Resume(
                file_name=file.filename or "resume.pdf",
                name=parsed_data.get("name"),
                email=parsed_data.get("email"),
                phone=parsed_data.get("phone"),
                skills=parsed_data.get("skills"),
                education=parsed_data.get("education"),
                experience=parsed_data.get("experience"),
                raw_text=parsed_data.get("raw_text"),
                upload_batch_id=batch_id,
                status="success"
            )
            db.add(db_resume)
            db.commit()
            db.refresh(db_resume)

            response_data = ResumeResponseData(
                id=db_resume.id,
                file_name=db_resume.file_name,
                name=db_resume.name,
                email=db_resume.email,
                phone=db_resume.phone,
                skills=db_resume.skills or [],
                education=db_resume.education or [],
                experience=db_resume.experience or [],
                created_at=db_resume.created_at
            )

            results.append(MultiUploadResultItem(
                file_name=file.filename or "resume.pdf",
                status="success",
                data=response_data
            ))
            successful += 1

        except Exception as e:
            # Save failed parse to database
            error_msg = str(e)
            if hasattr(e, 'detail'):
                error_msg = e.detail

            db_resume = Resume(
                file_name=file.filename or "resume.pdf",
                upload_batch_id=batch_id,
                status="failed",
                error_message=error_msg
            )
            db.add(db_resume)
            db.commit()

            results.append(MultiUploadResultItem(
                file_name=file.filename or "resume.pdf",
                status="failed",
                error=error_msg
            ))
            failed += 1

        finally:
            if temp_path:
                cleanup_file(temp_path)

    return MultiUploadResponse(
        status="completed",
        batch_id=batch_id,
        total=len(files),
        successful=successful,
        failed=failed,
        results=results
    )
