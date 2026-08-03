from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import backlog as crud
from app.database import get_db
from app.schemas.backlog import BacklogItem

router = APIRouter(prefix="/backlog", tags=["backlog"])


@router.get("", response_model=list[BacklogItem])
def list_backlog(db: Session = Depends(get_db)):
    """Read-only (UI/UX §3.7). Items enter and leave the backlog by editing
    their Requirement or Bug, so there is deliberately no write path here."""
    return crud.list_backlog(db)
