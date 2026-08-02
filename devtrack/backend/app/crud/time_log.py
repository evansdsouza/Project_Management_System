from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.models.time_log import TimeLog
from app.schemas.time_log import TimeLogCreate, TimeLogUpdate


def create_time_log(db: Session, data: TimeLogCreate) -> TimeLog:
    time_log = TimeLog(**data.model_dump())
    db.add(time_log)
    db.commit()
    db.refresh(time_log)
    return time_log


def list_time_logs(
    db: Session,
    project_id: int | None = None,
    logged_date: date | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[TimeLog]:
    # Eager-load the project so the router can read project_name without
    # firing a separate query per row.
    query = db.query(TimeLog).options(joinedload(TimeLog.project))
    if project_id is not None:
        query = query.filter(TimeLog.project_id == project_id)
    if logged_date is not None:
        query = query.filter(TimeLog.logged_date == logged_date)
    # Range filter backs the calendar's day/week/month windows. Kept separate
    # from the exact-match `logged_date` above, which predates it and is still
    # used by the Dashboard deep-link contract. `logged_date` is indexed, so
    # this is an index range scan.
    if date_from is not None:
        query = query.filter(TimeLog.logged_date >= date_from)
    if date_to is not None:
        query = query.filter(TimeLog.logged_date <= date_to)
    return query.order_by(TimeLog.logged_date.desc(), TimeLog.id.desc()).all()


def get_time_log(db: Session, time_log_id: int) -> TimeLog | None:
    return (
        db.query(TimeLog)
        .options(joinedload(TimeLog.project))
        .filter(TimeLog.id == time_log_id)
        .first()
    )


def update_time_log(db: Session, time_log: TimeLog, data: TimeLogUpdate) -> TimeLog:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(time_log, field, value)
    db.commit()
    db.refresh(time_log)
    return time_log


def delete_time_log(db: Session, time_log: TimeLog) -> None:
    db.delete(time_log)
    db.commit()
