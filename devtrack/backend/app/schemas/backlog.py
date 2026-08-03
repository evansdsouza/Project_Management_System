from typing import Literal

from pydantic import BaseModel

from app.models.enums import BugType, Priority


class BacklogItem(BaseModel):
    """One row of the combined backlog. Requirements and Bugs share this shape
    so the page can render a single flat table (UI/UX §3.7); `kind` is what
    tells them apart and decides where a row click navigates."""

    id: int
    kind: Literal["requirement", "bug"]
    title: str
    project_id: int
    project_name: str
    priority: Priority
    # Bugs only — requirements have no type, so this stays None for them.
    type: BugType | None = None
