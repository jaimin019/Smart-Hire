"""
Async SQLite database layer for Smart Hire.
Uses aiosqlite directly for maximum async performance.
Tables:
  - candidates  (id TEXT PK, name TEXT, email TEXT, parsed_data JSON, created_at TEXT)
  - job_descriptions (id TEXT PK, title TEXT, company TEXT, description TEXT,
                      required_skills JSON, created_at TEXT)
"""

import json
import sqlite3
import shutil
import aiosqlite
from pathlib import Path
from typing import Any

_base_dir = Path(__file__).parent.parent
DB_PATH = _base_dir / "smarthire.db"


async def create_tables() -> None:
    """Create tables if they don't already exist."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS candidates (
                id           TEXT PRIMARY KEY,
                name         TEXT,
                email        TEXT,
                parsed_data  TEXT,
                created_at   TEXT DEFAULT (datetime('now'))
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS job_descriptions (
                id              TEXT PRIMARY KEY,
                title           TEXT NOT NULL,
                company         TEXT NOT NULL,
                description     TEXT NOT NULL,
                required_skills TEXT,
                created_at      TEXT DEFAULT (datetime('now'))
            )
            """
        )
        await db.commit()


# ── Candidates ─────────────────────────────────────────────────────────────────

async def upsert_candidate(
    candidate_id: str,
    name: str | None,
    email: str | None,
    parsed_data: dict[str, Any],
) -> None:
    """Insert or replace a candidate row with full parsed_data JSON."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO candidates (id, name, email, parsed_data)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name        = excluded.name,
                email       = excluded.email,
                parsed_data = excluded.parsed_data
            """,
            (candidate_id, name, email, json.dumps(parsed_data)),
        )
        await db.commit()


async def get_candidate(candidate_id: str) -> dict[str, Any] | None:
    """Return the candidate row or None if not found."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, name, email, parsed_data, created_at FROM candidates WHERE id = ?",
            (candidate_id,),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        return None
    result = dict(row)
    result["parsed_data"] = json.loads(result["parsed_data"])
    return result


async def list_candidates(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Return a paginated list of candidates (without full parsed_data)."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, name, email, created_at FROM candidates ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ) as cursor:
            rows = await cursor.fetchall()
    return [dict(r) for r in rows]

async def delete_candidate(candidate_id: str) -> bool:
    """Delete a candidate. Returns True if deleted, False if not found."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
        deleted = cursor.rowcount > 0
        await db.commit()
    return deleted



# ── Job Descriptions ────────────────────────────────────────────────────────────

async def upsert_job(
    job_id: str,
    title: str,
    company: str,
    description: str,
    required_skills: list[str],
) -> None:
    """Insert or replace a job description."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO job_descriptions (id, title, company, description, raw_text, required_skills)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title           = excluded.title,
                company         = excluded.company,
                description     = excluded.description,
                raw_text        = excluded.raw_text,
                required_skills = excluded.required_skills
            """,
            (job_id, title, company, description, description, json.dumps(required_skills)),
        )
        await db.commit()


async def get_job(job_id: str) -> dict[str, Any] | None:
    """Return the job description row or None."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, title, company, description, required_skills FROM job_descriptions WHERE id = ?",
            (job_id,),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        return None
    result = dict(row)
    result["required_skills"] = json.loads(result["required_skills"] or "[]")
    return result


async def list_jobs() -> list[dict[str, Any]]:
    """Return all stored job descriptions."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, title, company, description, required_skills FROM job_descriptions ORDER BY created_at"
        ) as cursor:
            rows = await cursor.fetchall()
    results = []
    for r in rows:
        d = dict(r)
        d["required_skills"] = json.loads(d["required_skills"] or "[]")
        results.append(d)
    return results


# ── Sync helpers for seed script ────────────────────────────────────────────────

def sync_upsert_candidate(
    candidate_id: str,
    name: str | None,
    email: str | None,
    parsed_data: dict[str, Any],
    db_path: str | None = None,
) -> None:
    """Synchronous version for use in seed scripts."""
    path = db_path or str(DB_PATH)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path)
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS candidates (
            id           TEXT PRIMARY KEY,
            name         TEXT,
            email        TEXT,
            parsed_data  TEXT,
            created_at   TEXT DEFAULT (datetime('now'))
        )
        """
    )
    con.execute(
        """
        INSERT INTO candidates (id, name, email, parsed_data)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name        = excluded.name,
            email       = excluded.email,
            parsed_data = excluded.parsed_data
        """,
        (candidate_id, name, email, json.dumps(parsed_data)),
    )
    con.commit()
    con.close()


def sync_upsert_job(
    job_id: str,
    title: str,
    company: str,
    description: str,
    required_skills: list[str],
    db_path: str | None = None,
) -> None:
    """Synchronous version of upsert_job."""
    path = db_path or str(DB_PATH)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path)
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS job_descriptions (
            id              TEXT PRIMARY KEY,
            title           TEXT NOT NULL,
            company         TEXT NOT NULL,
            description     TEXT NOT NULL,
            required_skills TEXT,
            created_at      TEXT DEFAULT (datetime('now'))
        )
        """
    )
    con.execute(
        """
        INSERT INTO job_descriptions (id, title, company, description, raw_text, required_skills)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title           = excluded.title,
            company         = excluded.company,
            description     = excluded.description,
            raw_text        = excluded.raw_text,
            required_skills = excluded.required_skills
        """,
        (job_id, title, company, description, description, json.dumps(required_skills)),
    )
    con.commit()
    con.close()


def sync_list_candidates(db_path: str | None = None) -> list[dict[str, Any]]:
    """Sync list of all candidates (for seed script verification)."""
    path = db_path or str(DB_PATH)
    if not Path(path).exists():
        return []
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT id, name, email, created_at FROM candidates").fetchall()
    con.close()
    return [dict(r) for r in rows]
