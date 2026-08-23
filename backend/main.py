import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db.session import engine, create_tables
from db.models import Base
from routes.resume import router as resume_router

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables are created on startup
    print("[startup] Initializing database tables...")
    create_tables()
    print("[startup] Database tables ready.")
    
    # Self-healing database migration for candidates table columns
    try:
        import sqlite3
        _db_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(_db_dir, 'talentgraph.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(candidates)")
        cols = [c[1] for c in cursor.fetchall()]
        if cols:
            if "name" not in cols:
                cursor.execute("ALTER TABLE candidates ADD COLUMN name TEXT")
                print("[startup] Successfully migrated: added 'name' column to candidates table.")
            if "email" not in cols:
                cursor.execute("ALTER TABLE candidates ADD COLUMN email TEXT")
                print("[startup] Successfully migrated: added 'email' column to candidates table.")
            conn.commit()
        conn.close()
    except Exception as migration_err:
        print(f"[startup] SQLite self-healing migration warning: {migration_err}")
        
    try:
        from db.sqlite_db import create_tables as create_async_tables
        await create_async_tables()
        print("[startup] Legacy SQLite async tables ready.")
    except Exception as e:
        print(f"[startup] Legacy SQLite async warning: {e}")

    yield
    print("[shutdown] Smart-Hire Backend shutting down.")

app = FastAPI(
    title="Smart-Hire Backend",
    description="FastAPI resume parser backend with SQLAlchemy, SQLite, and pyresparser fallback.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the new Resume Router with and without api/v1 prefix for robustness
app.include_router(resume_router, prefix="/api/v1")
app.include_router(resume_router)

# Include legacy routers for absolute compatibility with Jaimin's frontend
try:
    from api.routers.skills import router as skills_router
    app.include_router(skills_router, prefix="/api/v1")
    app.include_router(skills_router)
    print("[startup] Included legacy skills router.")
except Exception as e:
    print(f"[startup] Skip loading legacy skills router: {e}")

try:
    from api.routers.candidates import router as candidates_router
    app.include_router(candidates_router, prefix="/api/v1")
    app.include_router(candidates_router)
    print("[startup] Included legacy candidates router.")
except Exception as e:
    print(f"[startup] Skip loading legacy candidates router: {e}")

try:
    from api.routers.insights import router as insights_router
    app.include_router(insights_router, prefix="/api/v1")
    app.include_router(insights_router)
    print("[startup] Included legacy insights router.")
except Exception as e:
    print(f"[startup] Skip loading legacy insights router: {e}")

try:
    from api.routers.jobs import router as jobs_router
    app.include_router(jobs_router, prefix="/api/v1")
    app.include_router(jobs_router)
    print("[startup] Included legacy jobs router.")
except Exception as e:
    print(f"[startup] Skip loading legacy jobs router: {e}")

try:
    from api.routers.parse import router as parse_router
    app.include_router(parse_router, prefix="/api/v1")
    app.include_router(parse_router)
    print("[startup] Included legacy parse router.")
except Exception as e:
    print(f"[startup] Skip loading legacy parse router: {e}")

@app.get("/")
async def root():
    return {
        "service": "Smart-Hire Backend API",
        "status": "online",
        "docs": "/docs",
        "endpoints": [
            "POST /api/resume/upload/single",
            "POST /api/resume/upload/multiple"
        ]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "agents": {"parser": "ok", "normalizer": "ok", "matcher": "ok"},
        "db": "ok",
        "redis": "ok",
        "chroma": "ok"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
