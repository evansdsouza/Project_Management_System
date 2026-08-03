from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import dashboard as crud
from app.database import get_db
from app.schemas.dashboard import DashboardRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardRead)
def get_dashboard(db: Session = Depends(get_db)):
    """Project cards for the landing page.

    Deliberately omits the `calendar_events: [{date, logged: bool}]` field
    from TRD §7.4.5. That spec predates the Time Log calendar, which grades
    each day on hours logged (red / blue / green) — a boolean can't express
    three states, so honouring it would either downgrade the Dashboard
    calendar or leave a payload nobody reads.

    Instead the Dashboard fetches `GET /timelogs?from=&to=` for the visible
    grid range and feeds the same MonthCalendar the Time Logs page uses. That
    also keeps the Monday-start 42-cell grid maths on the client, where it
    already exists, rather than duplicating it here.
    """
    return crud.get_dashboard(db)
