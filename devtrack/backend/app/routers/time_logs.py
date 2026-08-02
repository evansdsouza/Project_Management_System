from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud import project as project_crud
from app.crud import time_log as crud
from app.database import get_db
from app.models.time_log import TimeLog
from app.schemas.time_log import TimeLogCreate, TimeLogRead, TimeLogUpdate

router = APIRouter(prefix="/timelogs", tags=["timelogs"])


def _to_read(time_log: TimeLog) -> TimeLogRead:
    """Flattens the related project's name onto the response — the frontend
    shows a project name per row but project_name isn't a DB column."""
    read = TimeLogRead.model_validate(time_log)
    read.project_name = time_log.project.name if time_log.project else None
    return read


@router.get("", response_model=list[TimeLogRead])
def list_time_logs(
    project_id: int | None = None,
    logged_date: date | None = Query(default=None, alias="date"),
    # `from` is a Python keyword, so the alias isn't stylistic here.
    date_from: date | None = Query(default=None, alias="from"),
    date_to: date | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
):
    return [
        _to_read(t)
        for t in crud.list_time_logs(db, project_id, logged_date, date_from, date_to)
    ]


@router.get("/{time_log_id}", response_model=TimeLogRead)
def get_time_log(time_log_id: int, db: Session = Depends(get_db)):
    time_log = crud.get_time_log(db, time_log_id)
    if time_log is None:
        raise HTTPException(status_code=404, detail="Time log not found")
    return _to_read(time_log)


@router.post("", response_model=TimeLogRead, status_code=201)
def create_time_log(data: TimeLogCreate, db: Session = Depends(get_db)):
    # project_id is optional — only validate it when one was actually given.
    if data.project_id is not None and project_crud.get_project(db, data.project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return _to_read(crud.create_time_log(db, data))


@router.put("/{time_log_id}", response_model=TimeLogRead)
def update_time_log(time_log_id: int, data: TimeLogUpdate, db: Session = Depends(get_db)):
    time_log = crud.get_time_log(db, time_log_id)
    if time_log is None:
        raise HTTPException(status_code=404, detail="Time log not found")
    if data.project_id is not None and project_crud.get_project(db, data.project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check the span as it will be AFTER the patch. The schema validator only
    # fires when both ends are present in the request, so moving just one end
    # past the stored other end would otherwise reach the DB CHECK as a 500.
    merged_start = data.start_time if data.start_time is not None else time_log.start_time
    merged_end = data.end_time if data.end_time is not None else time_log.end_time
    if merged_end <= merged_start:
        raise HTTPException(status_code=422, detail="end_time must be after start_time")

    return _to_read(crud.update_time_log(db, time_log, data))


@router.delete("/{time_log_id}", status_code=204)
def delete_time_log(time_log_id: int, db: Session = Depends(get_db)):
    time_log = crud.get_time_log(db, time_log_id)
    if time_log is None:
        raise HTTPException(status_code=404, detail="Time log not found")
    crud.delete_time_log(db, time_log)
