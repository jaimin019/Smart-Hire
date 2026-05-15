"""
workers/tasks.py — Batch resume processing using ThreadPoolExecutor.

Replaces Celery + Redis with:
  - concurrent.futures.ThreadPoolExecutor  (same concurrent execution)
  - In-process dict (thread-safe via threading.Lock)  (same logical API as Redis hash)

If you later wire up a real Redis, replace _store get/set calls with:
    redis_client.hset(f"batch:{batch_id}", mapping={...})
    redis_client.hget(f"batch:{batch_id}", "total")

API surface remains unchanged.
"""

import asyncio
import json
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, Optional

# ── In-memory state store ─────────────────────────────────────────────────────
# Structure: { batch_id: { "total": int, "completed": int, "failed": int,
#                          "results": [ BatchResultItem-dict… ] } }
_store: Dict[str, Dict[str, Any]] = {}
_store_lock = threading.Lock()

_executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="talentgraph-batch")


# ── Store helpers ─────────────────────────────────────────────────────────────

def _store_init(batch_id: str, total: int) -> None:
    with _store_lock:
        _store[batch_id] = {
            "total": total,
            "completed": 0,
            "failed": 0,
            "results": [],
        }


def _store_append_result(batch_id: str, result: dict, failed: bool) -> None:
    with _store_lock:
        batch = _store.get(batch_id)
        if batch is None:
            return
        batch["results"].append(result)
        if failed:
            batch["failed"] += 1
        else:
            batch["completed"] += 1


def get_batch_state(batch_id: str) -> Optional[Dict[str, Any]]:
    """Return current batch state dict, or None if batch_id is unknown."""
    with _store_lock:
        return _store.get(batch_id)


# ── Core task ─────────────────────────────────────────────────────────────────

def _run_single(
    batch_id: str,
    file_bytes: bytes,
    filename: str,
    job_id: Optional[str],
) -> None:
    """
    Synchronous worker executed in a thread pool.
    Runs the full LangGraph pipeline for one file and writes result to the store.
    """
    candidate_id = str(uuid.uuid4())
    try:
        # Run the pipeline (synchronous call inside thread)
        from graph.pipeline import run_pipeline  # local import to avoid circular deps

        # run_pipeline is async; run it in a new event loop inside this thread
        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(
                run_pipeline(
                    file_bytes=file_bytes,
                    file_name=filename,
                    job_id=job_id or "senior_fullstack",
                )
            )
        finally:
            loop.close()

        match_score = result.get("match_score", None) if job_id else None

        # Persist candidate to DB
        try:
            from db.session import SessionLocal
            from db.models import Candidate
            session = SessionLocal()
            try:
                c = Candidate(
                    id=candidate_id,
                    filename=filename,
                    match_score=match_score,
                    job_id=job_id,
                    parsed_data=json.dumps(result.get("parsed_data", {})),
                )
                session.add(c)
                session.commit()
            finally:
                session.close()
        except Exception as db_err:
            print(f"⚠️  DB write failed for {filename}: {db_err}")

        _store_append_result(
            batch_id,
            {
                "filename": filename,
                "candidate_id": candidate_id,
                "match_score": match_score,
                "status": "done",
                "error": None,
            },
            failed=False,
        )

    except Exception as e:
        _store_append_result(
            batch_id,
            {
                "filename": filename,
                "candidate_id": None,
                "match_score": None,
                "status": "failed",
                "error": str(e),
            },
            failed=True,
        )


# ── Public API ────────────────────────────────────────────────────────────────

def submit_batch(
    files: list[tuple[bytes, str]],   # [(file_bytes, filename), …]
    job_id: Optional[str] = None,
) -> str:
    """
    Enqueue a batch of (file_bytes, filename) tuples for concurrent processing.
    Returns a batch_id that can be polled via get_batch_state().
    """
    batch_id = str(uuid.uuid4())
    _store_init(batch_id, total=len(files))

    for file_bytes, filename in files:
        _executor.submit(_run_single, batch_id, file_bytes, filename, job_id)

    return batch_id
