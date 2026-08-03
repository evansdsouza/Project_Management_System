from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import report as crud
from app.database import get_db
from app.schemas.report import ReportRead

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=ReportRead)
def get_report(db: Session = Depends(get_db)):
    """Aggregate stats across every project. Read-only (UI/UX §3.8).

    Note `requirements_done_this_week` is an approximation — see the comment
    in crud/report.py. `bugs_fixed_this_week` is exact.
    """
    return crud.get_report(db)
