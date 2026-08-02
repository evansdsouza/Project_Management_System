from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import RequirementStatus, Priority, BacklogStatus


class RequirementBase(BaseModel):
    title: str
    description: str | None = None
    priority: Priority = Priority.MEDIUM
    backlog_status: BacklogStatus | None = BacklogStatus.IN_BACKLOG
    recommended_approach: str | None = None


class RequirementCreate(RequirementBase):
    project_id: int
    # status is not accepted on create — always starts at Not Started, per TRD §7.4.2


class RequirementUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: RequirementStatus | None = None
    priority: Priority | None = None
    backlog_status: BacklogStatus | None = None
    recommended_approach: str | None = None


class RequirementRead(RequirementBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    status: RequirementStatus
    created_at: datetime
    updated_at: datetime
