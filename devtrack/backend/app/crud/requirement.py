from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.schemas.requirement import RequirementCreate, RequirementUpdate


def create_requirement(db: Session, data: RequirementCreate) -> Requirement:
    requirement = Requirement(**data.model_dump())
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement


def list_requirements(db: Session, project_id: int | None = None) -> list[Requirement]:
    query = db.query(Requirement)
    if project_id is not None:
        query = query.filter(Requirement.project_id == project_id)
    return query.order_by(Requirement.created_at).all()


def get_requirement(db: Session, requirement_id: int) -> Requirement | None:
    return db.query(Requirement).filter(Requirement.id == requirement_id).first()


def update_requirement(db: Session, requirement: Requirement, data: RequirementUpdate) -> Requirement:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(requirement, field, value)
    db.commit()
    db.refresh(requirement)
    return requirement


def delete_requirement(db: Session, requirement: Requirement) -> None:
    db.delete(requirement)
    db.commit()
