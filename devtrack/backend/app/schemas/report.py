from pydantic import BaseModel


class ProjectProgressItem(BaseModel):
    project_id: int
    name: str
    progress: float


class ReportRead(BaseModel):
    total_hours_all_time: float
    hours_this_week: float
    total_requirements_done: int
    total_bugs_fixed: int
    requirements_done_this_week: int
    bugs_fixed_this_week: int
    per_project_progress: list[ProjectProgressItem]
