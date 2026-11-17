# Smart-Hire Resume Parsing Backend

A high-performance, robust resume parsing backend built with **FastAPI**, **SQLAlchemy**, and **SQLite**.

---

## Features
- **Single Resume Upload (`POST /api/resume/upload/single`)**: Accepts `.pdf`, `.docx`, or `.doc` up to 5MB, extracts contact details, skills, education, experience, saves to SQLite database, and returns structured candidate JSON.
- **Multiple Resume Upload (`POST /api/resume/upload/multiple`)**: Accepts batches of resumes, processes each file individually in a loop, saves each parse to the database, and returns a compiled JSON list. If one file in the batch fails, the other files are parsed successfully without crashing the request.
- **Robust Parsing Engine**: Uses `pyresparser` with a fail-safe fallback to a Regex-powered text extraction suite using `pdfminer.six` and `python-docx`.
- **CORS Configured**: Fully enabled for all origins to interface with the web frontend seamlessly.
- **Database Storage**: Persists all uploaded and parsed information automatically to the SQLAlchemy-configured SQLite database (`smarthire.db`).
- **File Validation & Protection**: Automatically rejects invalid file formats (HTTP 400) and limits upload size to 5MB (HTTP 413) to protect server bandwidth.

---

## Local Setup Instructions

### 1. Prerequisites
- Python 3.10+
- `pip` package manager

### 2. Set Up Virtual Environment
Navigate to the `backend/` directory and create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
Install all required libraries pinned in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Environment Variables Configuration
Configure environment variables inside `backend/.env`. A default `.env` is provided:
```env
DATABASE_URL=sqlite:///./smarthire.db
MAX_FILE_SIZE_MB=5
```

### 5. Launch Development Server
Start the backend application locally:
```bash
python main.py
```
Or run with `uvicorn`:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## API Testing & Swagger Docs
Once running, the interactive Swagger documentation is available at:
- **Interactive Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Redoc Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Endpoint Reference
1. **Single Upload**:
   - `POST /api/resume/upload/single`
   - Form-data: `file` (Upload file)
2. **Multiple Upload**:
   - `POST /api/resume/upload/multiple`
   - Form-data: `files` (Upload multiple files)
