from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TimeLogBase(BaseModel):
    client: str | None = None
    description: str | None = None
    hours: Decimal = Field(gt=0, max_digits=5, decimal_places=2)
    logged_date: date
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def _check_time_span(self):
        # Mirrors the DB CHECK. Note this reports under loc=["body"], which the
        # frontend's field-error extractor can't map to an input — TimeLogModal
        # validates the same rule locally so the message lands on the field.
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class TimeLogCreate(TimeLogBase):
    # Required at the API layer even though the DB column is nullable —
    # the column only allows NULL so ON DELETE SET NULL has somewhere to
    # put the value when a project is deleted.
    project_id: int
    requirement_id: int | None = None
    bug_id: int | None = None


class TimeLogUpdate(BaseModel):
    project_id: int | None = None
    requirement_id: int | None = None
    bug_id: int | None = None
    client: str | None = None
    description: str | None = None
    hours: Decimal | None = Field(default=None, gt=0, max_digits=5, decimal_places=2)
    logged_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None

    @model_validator(mode="after")
    def _check_time_span(self):
        # Only validate when both are supplied — this is a partial update, so a
        # request touching just one side is checked by the DB CHECK instead.
        if self.start_time is not None and self.end_time is not None:
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        return self


class TimeLogRead(TimeLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int | None  # nullable in responses — the project may have been deleted
    project_name: str | None = None  # populated by the router, not a DB column
    requirement_id: int | None
    bug_id: int | None
    created_at: datetime
