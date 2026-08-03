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


def update_project(db: Session, project: Project, data: ProjectUpdate) -> Project:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()


def calculate_progress(db: Session, project_id: int) -> float:
    """(Done Requirements + Fixed Bugs) / (Total Requirements + Total Bugs) × 100.

    Never stored — always derived (PRD §8 rule 6). Counted in SQL rather
    than by loading rows, so this stays cheap as a project grows.
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

    total = req_total + bug_total
    if total == 0:
        return 0.0
    return round((req_done + bug_fixed) / total * 100, 1)
