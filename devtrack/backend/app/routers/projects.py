from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import project as crud
from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectProgress, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


def _reject_duplicate_name(db: Session, name: str | None, exclude_id: int | None = None) -> None:
    """projects.name is UNIQUE, and letting the insert fail surfaces the
    IntegrityError as a 500 with no usable message.

    The detail is shaped like FastAPI's own validation errors — a list of
    {loc, msg} — so the frontend's shared field-error extractor maps it onto
    the name input and shows the message inline, exactly as it does for a
    Pydantic failure. A plain string detail would only reach the toast.
    """
    if name is None:
        return
    existing = crud.get_project_by_name(db, name)
    if existing is not None and existing.id != exclude_id:
        raise HTTPException(
            status_code=422,
            detail=[{"loc": ["body", "name"], "msg": "A project with this name already exists"}],
        )


@router.get("", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return crud.list_projects(db)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/progress", response_model=ProjectProgress)
def get_project_progress(project_id: int, db: Session = Depends(get_db)):
    if crud.get_project(db, project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectProgress(progress=crud.calculate_progress(db, project_id))


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    _reject_duplicate_name(db, data.name)
    return crud.create_project(db, data)


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    # exclude_id so re-saving a project without touching its name isn't
    # reported as colliding with itself.
    _reject_duplicate_name(db, data.name, exclude_id=project_id)
    return crud.update_project(db, project, data)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    crud.delete_project(db, project)
