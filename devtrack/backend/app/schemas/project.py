from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    deadline: date | None = None


class ProjectCreate(ProjectBase):
    pass
    # status is not accepted on create — always starts at "Not Started"
    # server-side, mirroring Requirement.status / Bug.status


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    deadline: date | None = None


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    created_at: datetime
    updated_at: datetime


class ProjectProgress(BaseModel):
    progress: float
