from sqlalchemy.orm import Session

from app.models.bug import Bug
from app.models.bug_status_history import BugStatusHistory
from app.models.enums import BugStatus
from app.schemas.bug import BugCreate, BugStatusUpdate, BugUpdate

# NOTE: BugStatusHistory is append-only (PRD §8 rule 5). This module
# deliberately exposes no update or delete function for it — history rows
# are only ever created, by create_bug() and update_bug_status().


def create_bug(db: Session, data: BugCreate) -> Bug:
    """Creates the bug and its first status-history row (always `Open`)
    atomically — PRD §8 rule 4 requires every bug to have at least one
    history entry, so the two writes share a single commit."""
    bug = Bug(**data.model_dump(), status=BugStatus.OPEN)
    db.add(bug)
    db.flush()  # assign bug.id without committing
    db.add(BugStatusHistory(bug_id=bug.id, status=BugStatus.OPEN))
    db.commit()
    db.refresh(bug)
    return bug


def list_bugs(db: Session, project_id: int | None = None) -> list[Bug]:
    query = db.query(Bug)
    if project_id is not None:
        query = query.filter(Bug.project_id == project_id)
    return query.order_by(Bug.created_at).all()


def get_bug(db: Session, bug_id: int) -> Bug | None:
    return db.query(Bug).filter(Bug.id == bug_id).first()


def update_bug(db: Session, bug: Bug, data: BugUpdate) -> Bug:
    """Edits bug details only. Status is never changed here — it goes
    through update_bug_status() so every change is logged (TRD §7.4.3)."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bug, field, value)
    db.commit()
    db.refresh(bug)
    return bug


def update_bug_status(db: Session, bug: Bug, data: BugStatusUpdate) -> BugStatusHistory:
    """Appends a history row and syncs Bug.status to match."""
    entry = BugStatusHistory(bug_id=bug.id, status=data.status, note=data.note)
    db.add(entry)
    bug.status = data.status
    db.commit()
    db.refresh(entry)
    return entry


def get_bug_history(db: Session, bug_id: int) -> list[BugStatusHistory]:
    return (
        db.query(BugStatusHistory)
        .filter(BugStatusHistory.bug_id == bug_id)
        .order_by(BugStatusHistory.changed_at)
        .all()
    )


def delete_bug(db: Session, bug: Bug) -> None:
    db.delete(bug)
    db.commit()
