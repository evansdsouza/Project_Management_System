from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import bug as crud
from app.crud import project as project_crud
from app.crud import requirement as requirement_crud
from app.database import get_db
from app.schemas.bug import (
    BugCreate,
    BugRead,
    BugStatusHistoryRead,
    BugStatusUpdate,
    BugUpdate,
)

router = APIRouter(prefix="/bugs", tags=["bugs"])


def _validate_requirement(db: Session, requirement_id: int | None, project_id: int) -> None:
    """A bug may link to a requirement, but only one in its own project
    (PRD §8 rule 3)."""
    if requirement_id is None:
        return
    requirement = requirement_crud.get_requirement(db, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")
    if requirement.project_id != project_id:
        raise HTTPException(
            status_code=422, detail="Requirement must belong to the same project as the bug"
        )


@router.get("", response_model=list[BugRead])
def list_bugs(project_id: int | None = None, db: Session = Depends(get_db)):
    return crud.list_bugs(db, project_id)


@router.get("/{bug_id}", response_model=BugRead)
def get_bug(bug_id: int, db: Session = Depends(get_db)):
    bug = crud.get_bug(db, bug_id)
    if bug is None:
        raise HTTPException(status_code=404, detail="Bug not found")
    return bug


@router.post("", response_model=BugRead, status_code=201)
def create_bug(data: BugCreate, db: Session = Depends(get_db)):
    if project_crud.get_project(db, data.project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    _validate_requirement(db, data.requirement_id, data.project_id)
    return crud.create_bug(db, data)


@router.put("/{bug_id}", response_model=BugRead)
def update_bug(bug_id: int, data: BugUpdate, db: Session = Depends(get_db)):
    bug = crud.get_bug(db, bug_id)
    if bug is None:
        raise HTTPException(status_code=404, detail="Bug not found")
    if "requirement_id" in data.model_dump(exclude_unset=True):
        _validate_requirement(db, data.requirement_id, bug.project_id)
    return crud.update_bug(db, bug, data)


@router.post("/{bug_id}/status", response_model=BugStatusHistoryRead, status_code=201)
def update_bug_status(bug_id: int, data: BugStatusUpdate, db: Session = Depends(get_db)):
    bug = crud.get_bug(db, bug_id)
    if bug is None:
        raise HTTPException(status_code=404, detail="Bug not found")
    return crud.update_bug_status(db, bug, data)


@router.get("/{bug_id}/history", response_model=list[BugStatusHistoryRead])
def get_bug_history(bug_id: int, db: Session = Depends(get_db)):
    if crud.get_bug(db, bug_id) is None:
        raise HTTPException(status_code=404, detail="Bug not found")
    return crud.get_bug_history(db, bug_id)


@router.delete("/{bug_id}", status_code=204)
def delete_bug(bug_id: int, db: Session = Depends(get_db)):
    bug = crud.get_bug(db, bug_id)
    if bug is None:
        raise HTTPException(status_code=404, detail="Bug not found")
    crud.delete_bug(db, bug)
