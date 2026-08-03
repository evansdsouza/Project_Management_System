from datetime import datetime

from sqlalchemy import ForeignKey, Text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import BugStatus, enum_values


class BugStatusHistory(Base):
    """Append-only by convention — crud/bug.py deliberately exposes no
    update or delete function for this model (Backend Schema §4)."""

    __tablename__ = "bug_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    bug_id: Mapped[int] = mapped_column(
        ForeignKey("bugs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[BugStatus] = mapped_column(
        Enum(BugStatus, name="bug_status", values_callable=enum_values), nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text)
    changed_at: Mapped[datetime] = mapped_column(server_default=func.now())

    bug: Mapped["Bug"] = relationship(back_populates="status_history")
