from pydantic import BaseModel, ConfigDict

from app.models.enums import Priority


class TopRequirement(BaseModel):
    """The single most important open requirement on a project — embedded in
    the project's own card rather than listed separately (TRD §7.4.5)."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    priority: Priority


class DashboardProject(BaseModel):
    id: int
    name: str
    progress: float
    # None when every requirement is Done, or the project has none at all.
    top_requirement: TopRequirement | None = None


class DashboardRead(BaseModel):
    projects: list[DashboardProject]
    # No `calendar_events` here — see the router docstring for why.
