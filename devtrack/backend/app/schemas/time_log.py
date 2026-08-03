from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, model_validator


class TimeLogBase(BaseModel):
    title: str | None = None
    client: str | None = None
    description: str | None = None
    logged_date: date
    start_time: time
    end_time: time
    # `hours` is deliberately absent from the input shape — it's derived from
    # the start→end span server-side (see crud.compute_hours) so the two can
    # never disagree. It appears on TimeLogRead only.

    @model_validator(mode="after")
    def _check_time_span(self):
        # Mirrors the DB CHECK. Note this reports under loc=["body"], which the
        # frontend's field-error extractor can't map to an input — TimeLogModal
        # validates the same rule locally so the message lands on the field.
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class TimeLogCreate(TimeLogBase):
    # Optional: a time log can stand alone without being attributed to a
    # project. The column was already nullable so ON DELETE SET NULL had
    # somewhere to put the value.
    project_id: int | None = None
    requirement_id: int | None = None
    bug_id: int | None = None


class TimeLogUpdate(BaseModel):
    project_id: int | None = None
    requirement_id: int | None = None
    bug_id: int | None = None
    title: str | None = None
    client: str | None = None
    description: str | None = None
    logged_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None

    @model_validator(mode="after")
    def _check_time_span(self):
        # Only validate when both are supplied — this is a partial update, so a
        # request touching just one side is checked against the stored value in
        # the CRUD layer, and by the DB CHECK as a backstop.
        if self.start_time is not None and self.end_time is not None:
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        return self


class TimeLogRead(TimeLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    hours: Decimal  # server-derived from the span
    project_id: int | None
    project_name: str | None = None  # populated by the router, not a DB column
    requirement_id: int | None
    bug_id: int | None
    created_at: datetime
