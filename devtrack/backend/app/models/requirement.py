from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import RequirementStatus, Priority, BacklogStatus, enum_values


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RequirementStatus] = mapped_column(
        Enum(RequirementStatus, name="requirement_status", values_callable=enum_values),
        default=RequirementStatus.NOT_STARTED,
    )
    priority: Mapped[Priority] = mapped_column(
        Enum(Priority, name="priority", values_callable=enum_values), default=Priority.MEDIUM
    )
    backlog_status: Mapped[BacklogStatus | None] = mapped_column(
        Enum(BacklogStatus, name="backlog_status", values_callable=enum_values),
        default=BacklogStatus.IN_BACKLOG,
    )
    recommended_approach: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship(back_populates="requirements")
    bugs: Mapped[list["Bug"]] = relationship(back_populates="requirement")
    # relationship to TimeLog is added in Phase 5
