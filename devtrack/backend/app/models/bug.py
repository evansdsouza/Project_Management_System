from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import BugType, BugStatus, Priority, BacklogStatus, enum_values


class Bug(Base):
    __tablename__ = "bugs"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_id: Mapped[int | None] = mapped_column(
        ForeignKey("requirements.id", ondelete="SET NULL"), index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    type: Mapped[BugType] = mapped_column(
        Enum(BugType, name="bug_type", values_callable=enum_values), default=BugType.LOGIC_ERROR
    )
    status: Mapped[BugStatus] = mapped_column(
        Enum(BugStatus, name="bug_status", values_callable=enum_values), default=BugStatus.OPEN
    )
    priority: Mapped[Priority] = mapped_column(
        Enum(Priority, name="priority", values_callable=enum_values), default=Priority.MEDIUM
    )
    backlog_status: Mapped[BacklogStatus | None] = mapped_column(
        Enum(BacklogStatus, name="backlog_status", values_callable=enum_values),
        default=BacklogStatus.IN_BACKLOG,
    )
    recomm_fix: Mapped[str | None] = mapped_column(Text)
    fix: Mapped[str | None] = mapped_column(Text)
    remark: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship(back_populates="bugs")
    requirement: Mapped["Requirement | None"] = relationship(back_populates="bugs")
    status_history: Mapped[list["BugStatusHistory"]] = relationship(
        back_populates="bug", cascade="all, delete-orphan", order_by="BugStatusHistory.changed_at"
    )
    # relationship to TimeLog is added in Phase 5
