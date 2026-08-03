from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import BugType, BugStatus, Priority, BacklogStatus
from app.schemas.fields import ItemTitle


class BugBase(BaseModel):
    title: ItemTitle
    description: str | None = None
    type: BugType
    priority: Priority = Priority.MEDIUM
    requirement_id: int | None = None
    backlog_status: BacklogStatus | None = BacklogStatus.IN_BACKLOG


class BugCreate(BugBase):
    project_id: int
    # status is not accepted on create — always starts at Open, per TRD §7.4.3


class BugUpdate(BaseModel):
    title: ItemTitle | None = None
    description: str | None = None
    type: BugType | None = None
    priority: Priority | None = None
    requirement_id: int | None = None
    backlog_status: BacklogStatus | None = None
    recomm_fix: str | None = None
    fix: str | None = None
    remark: str | None = None
    # status is intentionally absent — use BugStatusUpdate via the /status endpoint instead


class BugStatusUpdate(BaseModel):
    status: BugStatus
    note: str | None = None


class BugRead(BugBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    status: BugStatus
    recomm_fix: str | None = None
    fix: str | None = None
    remark: str | None = None
    created_at: datetime
    updated_at: datetime


class BugStatusHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: BugStatus
    note: str | None
    changed_at: datetime
