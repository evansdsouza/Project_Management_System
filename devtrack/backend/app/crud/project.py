from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bug import Bug
from app.models.enums import BugStatus, RequirementStatus
from app.models.project import Project
from app.models.requirement import Requirement
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project(db: Session, data: ProjectCreate) -> Project:
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session) -> list[Project]:
    return db.query(Project).order_by(Project.created_at).all()


def get_project(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def get_project_by_name(db: Session, name: str) -> Project | None:
    """Backs the uniqueness check on create/update — the DB constraint is the
    real guarantee, this just lets the API answer with a usable error first."""
    return db.query(Project).filter(Project.name == name).first()


def update_project(db: Session, project: Project, data: ProjectUpdate) -> Project:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()


def counts_by_project(db: Session, model, done_value) -> dict[int, tuple[int, int]]:
    """(total, completed) per project for one entity table, in a single query.

    Requirements and Bugs are always counted separately rather than joined: a
    join across both fans out into a cartesian product and multiplies every
    count by the other table's row count.

    Shared by the Dashboard and Reports, which both need every project's
    numbers at once and would otherwise issue two queries per project.
    """
    rows = db.execute(
        select(
            model.project_id,
            func.count(model.id),
            func.count(model.id).filter(model.status == done_value),
        ).group_by(model.project_id)
    ).all()
    return {project_id: (total, done) for project_id, total, done in rows}


def progress_from_counts(req_total: int, req_done: int, bug_total: int, bug_fixed: int) -> float:
    """(Done Requirements + Fixed Bugs) / (Total Requirements + Total Bugs) × 100.

    The formula itself lives here alone. `calculate_progress` below counts one
    project; the dashboard counts every project in a single grouped query — but
    both land on this function, so the two can't drift apart.
    """
    total = req_total + bug_total
    if total == 0:
        return 0.0
    return round((req_done + bug_fixed) / total * 100, 1)


def calculate_progress(db: Session, project_id: int) -> float:
    """Progress for a single project. Never stored — always derived
    (PRD §8 rule 6). Counted in SQL rather than by loading rows, so this
    stays cheap as a project grows.
    """
    req_total, req_done = db.execute(
        select(
            func.count(Requirement.id),
            func.count(Requirement.id).filter(Requirement.status == RequirementStatus.DONE),
        ).where(Requirement.project_id == project_id)
    ).one()

    bug_total, bug_fixed = db.execute(
        select(
            func.count(Bug.id),
            func.count(Bug.id).filter(Bug.status == BugStatus.FIXED),
        ).where(Bug.project_id == project_id)
    ).one()

    return progress_from_counts(req_total, req_done, bug_total, bug_fixed)
