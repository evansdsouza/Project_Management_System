from sqlalchemy import func, nulls_last, select
from sqlalchemy.orm import Session

from app.crud.project import progress_from_counts
from app.models.bug import Bug
from app.models.enums import BugStatus, RequirementStatus
from app.models.project import Project
from app.models.requirement import Requirement
from app.schemas.dashboard import DashboardProject, DashboardRead, TopRequirement


def _counts_by_project(db: Session, model, done_value) -> dict[int, tuple[int, int]]:
    """(total, completed) per project for one entity table, in a single query.

    Requirements and Bugs are counted separately rather than joined: a join
    across both would fan out into a cartesian product and multiply every
    count by the other table's row count.
    """
    rows = db.execute(
        select(
            model.project_id,
            func.count(model.id),
            func.count(model.id).filter(model.status == done_value),
        ).group_by(model.project_id)
    ).all()
    return {project_id: (total, done) for project_id, total, done in rows}


def _top_requirement_by_project(db: Session) -> dict[int, Requirement]:
    """The one requirement to surface per project, for every project at once.

    DISTINCT ON is Postgres-specific but keeps this to a single query instead
    of one per card. The ORDER BY is what actually picks the winner:

      1. priority       — the Postgres enum sorts in declaration order, so
                          plain ASC yields Critical > High > Medium > Low
      2. backlog_status — DESC puts 'Active' ahead of 'In Backlog' (also
                          declaration order); NULLS LAST so an unset one
                          doesn't outrank a genuinely active requirement
      3. created_at     — oldest first, so the card is stable between loads
                          rather than flipping between equally-ranked items

    Done requirements are excluded: the Dashboard is a view of outstanding
    work (UI/UX §3.1), so a finished item is never "the top thing to do".
    Beyond the TRD's bare "highest priority", but the alternative is a card
    advertising work that's already complete.
    """
    rows = db.scalars(
        select(Requirement)
        .where(Requirement.status != RequirementStatus.DONE)
        .distinct(Requirement.project_id)
        .order_by(
            Requirement.project_id,
            Requirement.priority,
            nulls_last(Requirement.backlog_status.desc()),
            Requirement.created_at,
        )
    ).all()
    return {r.project_id: r for r in rows}


def get_dashboard(db: Session) -> DashboardRead:
    """Four queries total, independent of how many projects exist."""
    projects = db.scalars(select(Project).order_by(Project.created_at)).all()
    req_counts = _counts_by_project(db, Requirement, RequirementStatus.DONE)
    bug_counts = _counts_by_project(db, Bug, BugStatus.FIXED)
    top_requirements = _top_requirement_by_project(db)

    return DashboardRead(
        projects=[
            DashboardProject(
                id=p.id,
                name=p.name,
                # Projects with no requirements or bugs simply aren't in the
                # count maps, hence the (0, 0) default -> 0.0 progress.
                progress=progress_from_counts(
                    *req_counts.get(p.id, (0, 0)), *bug_counts.get(p.id, (0, 0))
                ),
                top_requirement=(
                    TopRequirement.model_validate(top_requirements[p.id])
                    if p.id in top_requirements
                    else None
                ),
            )
            for p in projects
        ]
    )
