"""REST demo with SQLite persistence and pre-authored synthetic analyses."""

import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.fixtures import PROFILE, VACANCIES
from backend.normalization import normalize_description

app = FastAPI(
    title="JobRadar Showcase", description="Synthetic demo; no production AI engine or credentials."
)


@contextmanager
def connect():
    path = Path(os.getenv("DEMO_DB_PATH", "data/demo.db"))
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    db.execute(
        "CREATE TABLE IF NOT EXISTS vacancies (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, status TEXT NOT NULL, previous_status TEXT NOT NULL)"
    )
    for item in VACANCIES:
        db.execute(
            "INSERT OR IGNORE INTO vacancies VALUES (?, ?, ?, ?)",
            (item["id"], json.dumps(item, ensure_ascii=False), item["status"], item["status"]),
        )
    db.commit()
    try:
        yield db
    finally:
        db.close()


def serialize(row):
    result = json.loads(row["payload"])
    result["status"] = row["status"]
    result["description"] = normalize_description(result["description"])
    return result


@app.get("/health")
def health():
    return {"status": "ok", "mode": "synthetic_demo"}


@app.get("/api/profile")
def profile():
    return PROFILE


@app.get("/api/vacancies")
def vacancies():
    with connect() as db:
        return [serialize(row) for row in db.execute("SELECT * FROM vacancies ORDER BY id DESC")]


class WorkflowUpdate(BaseModel):
    status: Literal["new", "interested", "applied", "interview", "archived", "restore"]


@app.patch("/api/vacancies/{job_id}/status")
def update_status(job_id: int, update: WorkflowUpdate):
    with connect() as db:
        row = db.execute("SELECT * FROM vacancies WHERE id = ?", (job_id,)).fetchone()
        if row is None:
            raise HTTPException(404, "Vacancy not found")
        target, previous = update.status, row["previous_status"]
        if target == "restore":
            target = previous if row["status"] == "archived" else row["status"]
        elif target == "archived" and row["status"] != "archived":
            previous = row["status"]
        db.execute(
            "UPDATE vacancies SET status = ?, previous_status = ? WHERE id = ?",
            (target, previous, job_id),
        )
        db.commit()
        return serialize(db.execute("SELECT * FROM vacancies WHERE id = ?", (job_id,)).fetchone())


class SourceText(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)


@app.post("/api/normalize")
def normalize(source: SourceText):
    return {"text": normalize_description(source.text)}


static_dir = Path(__file__).resolve().parent.parent / "web" / "dist"
if static_dir.is_dir():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="demo")
