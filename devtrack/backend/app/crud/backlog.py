from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.bug import Bug
from app.models.enums import BacklogStatus, Priority
from app.models.requirement import Requirement
from app.schemas.backlog import BacklogItem

# Critical -> 0, Low -> 3. Derived from the enum's declaration order rather
# than hand-written, so adding a priority can't leave this list stale.
PRIORITY_RANK = {member: i for i, member in enumerate(Priority)}


def list_backlog(db: Session) -> list[BacklogItem]:
    """Every Requirement and Bug sitting in the backlog, across all projects.

    Queried per table and merged in Python rather than as a SQL UNION: the two
    tables have different columns (only bugs carry `type`), so a union would
    need placeholder casts on both sides for no real gain at this size.

    Ordered most-urgent-first so the top of the table is the work that matters.
    Priority can't be sorted in SQL here anyway — the rows come from two
    separate queries — so the rank map does it once over the merged list.
    """
    requirements = db.scalars(
        select(Requirement)
        .options(joinedload(Requirement.project))
        .where(Requirement.backlog_status == BacklogStatus.IN_BACKLOG)
    ).all()
    bugs = db.scalars(
        select(Bug)
        .options(joinedload(Bug.project))
        .where(Bug.backlog_status == BacklogStatus.IN_BACKLOG)
    ).all()

    items = [
        BacklogItem(
            id=r.id,
            kind="requirement",
            title=r.title,
            project_id=r.project_id,
            project_name=r.project.name,
            priority=r.priority,
        )
        for r in requirements
    ] + [
        BacklogItem(
            id=b.id,
            kind="bug",
            title=b.title,
            project_id=b.project_id,
            project_name=b.project.name,
            priority=b.priority,
            type=b.type,
        )
        for b in bugs
    ]

    # Project name and title as tiebreaks keep the order stable between loads
    # instead of letting equal-priority rows shuffle. Case-folded, or ASCII
    # would file every lowercase project name after every capitalised one.
    items.sort(
        key=lambda i: (PRIORITY_RANK[i.priority], i.project_name.lower(), i.title.lower())
    )
    return items
