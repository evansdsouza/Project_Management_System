from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TimeLog(Base):
    """The one table that deliberately breaks the CASCADE pattern used
    everywhere else: time logs represent hours actually worked and have
    standalone value, so deleting a project/requirement/bug unlinks them
    (SET NULL) rather than destroying the record (PRD §8 rule 7)."""

    __tablename__ = "time_logs"
    __table_args__ = (
        CheckConstraint("hours > 0", name="ck_time_logs_hours_positive"),
        # Overnight spans are forbidden — a midnight-crossing block would have
        # to be split across two day columns in the hour grid. Log two entries.
        CheckConstraint("end_time > start_time", name="ck_time_logs_time_span_valid"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # Nullable at the DB level (unlike every other required FK here) purely
    # so ON DELETE SET NULL has somewhere to put the value — the API still
    # requires it on create, see schemas/time_log.py.
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), index=True
    )
    requirement_id: Mapped[int | None] = mapped_column(
        ForeignKey("requirements.id", ondelete="SET NULL")
    )
    bug_id: Mapped[int | None] = mapped_column(ForeignKey("bugs.id", ondelete="SET NULL"))
    client: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    # `hours` is deliberately INDEPENDENT of the start_time→end_time span, not
    # derived from it: the span says where the block sits on the calendar grid,
    # `hours` is the accounting figure that day totals and reports sum. So
    # 09:00–17:00 with hours=2 is legal and intentional — don't "fix" this into
    # a computed field.
    hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    logged_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    project: Mapped["Project | None"] = relationship(back_populates="time_logs")
    requirement: Mapped["Requirement | None"] = relationship(back_populates="time_logs")
    bug: Mapped["Bug | None"] = relationship(back_populates="time_logs")
