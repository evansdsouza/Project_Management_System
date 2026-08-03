from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import project as crud
from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectProgress, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


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
    return crud.create_project(db, data)


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.update_project(db, project, data)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    crud.delete_project(db, project)
