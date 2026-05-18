import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "5"))
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
TEMP_DIR = "/tmp/resumes/"

def validate_and_save_file(file: UploadFile) -> str:
    # 1. Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {ext}. Only .pdf, .docx, and .doc are allowed."
        )

    # 2. Check file size
    # Reset and find the length
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)  # Reset

    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds the maximum limit of {MAX_FILE_SIZE_MB}MB."
        )

    # 3. Create temp directory if it doesn't exist
    os.makedirs(TEMP_DIR, exist_ok=True)

    # 4. Generate unique filename
    unique_name = f"{uuid.uuid4()}{ext}"
    temp_path = os.path.join(TEMP_DIR, unique_name)

    # 5. Save the file
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return temp_path

def cleanup_file(file_path: str):
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting temp file {file_path}: {e}")
