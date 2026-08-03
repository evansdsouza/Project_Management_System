from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.routers import projects

app = FastAPI(title="DevTrack API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(projects.router, prefix="/api/v1")


@app.on_event("startup")
def verify_db_connection() -> None:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))


@app.get("/health")
def health_check():
    return {"status": "ok"}
