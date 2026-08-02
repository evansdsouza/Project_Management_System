from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import project as project_crud
from app.crud import requirement as crud
from app.database import get_db
from app.schemas.requirement import RequirementCreate, RequirementRead, RequirementUpdate

router = APIRouter(prefix="/requirements", tags=["requirements"])


@router.get("", response_model=list[RequirementRead])
def list_requirements(project_id: int | None = None, db: Session = Depends(get_db)):
    return crud.list_requirements(db, project_id)


@router.get("/{requirement_id}", response_model=RequirementRead)
def get_requirement(requirement_id: int, db: Session = Depends(get_db)):
    requirement = crud.get_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return requirement


@router.post("", response_model=RequirementRead, status_code=201)
def create_requirement(data: RequirementCreate, db: Session = Depends(get_db)):
    if project_crud.get_project(db, data.project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.create_requirement(db, data)


@router.put("/{requirement_id}", response_model=RequirementRead)
def update_requirement(requirement_id: int, data: RequirementUpdate, db: Session = Depends(get_db)):
    requirement = crud.get_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return crud.update_requirement(db, requirement, data)


@router.delete("/{requirement_id}", status_code=204)
def delete_requirement(requirement_id: int, db: Session = Depends(get_db)):
    requirement = crud.get_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    crud.delete_requirement(db, requirement)
