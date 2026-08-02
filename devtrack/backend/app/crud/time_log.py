from datetime import date, time
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session, joinedload

from app.models.time_log import TimeLog
from app.schemas.time_log import TimeLogCreate, TimeLogUpdate


def compute_hours(start: time, end: time) -> Decimal:
    """Derives `hours` from the span. The single writer of that column — it is
    never taken from the client, so the two can't drift apart.

    Quantized to 2dp to match NUMERIC(5,2); the DB would round anyway, and
    doing it here keeps the value returned on create identical to the one a
    later read produces.
    """
    minutes = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)
    return (Decimal(minutes) / Decimal(60)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def create_time_log(db: Session, data: TimeLogCreate) -> TimeLog:
    time_log = TimeLog(
        **data.model_dump(),
        hours=compute_hours(data.start_time, data.end_time),
    )
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
    # Recompute after applying the patch, not from the request: an update that
    # moves only one end of the span still has to be measured against the
    # stored value on the other end.
    time_log.hours = compute_hours(time_log.start_time, time_log.end_time)
    db.commit()
    db.refresh(time_log)
    return time_log


def delete_time_log(db: Session, time_log: TimeLog) -> None:
    db.delete(time_log)
    db.commit()
