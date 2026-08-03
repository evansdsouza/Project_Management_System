from datetime import date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.crud.project import counts_by_project, progress_from_counts
from app.models.bug import Bug
from app.models.bug_status_history import BugStatusHistory
from app.models.enums import BugStatus, RequirementStatus
from app.models.project import Project
from app.models.requirement import Requirement
from app.models.time_log import TimeLog
from app.schemas.report import ProjectProgressItem, ReportRead


def current_week_bounds(today: date | None = None) -> tuple[date, date]:
    """Monday–Sunday containing `today`, matching WEEK_STARTS_ON = 1 in the
    frontend's date utils. If the two ever disagree, the Reports page and the
    Time Log week view would report different totals for "this week".

    weekday() is 0 for Monday, so it doubles as the offset back to it.
    """
    today = today or date.today()
    monday = today - timedelta(days=today.weekday())
    return monday, monday + timedelta(days=6)


def get_report(db: Session) -> ReportRead:
    week_start, week_end = current_week_bounds()
    # updated_at / changed_at are timestamps, so the day range has to be
    # widened to cover the whole of Sunday rather than just its midnight.
    week_start_dt = datetime.combine(week_start, time.min)
    week_end_dt = datetime.combine(week_end + timedelta(days=1), time.min)

    # SUM over no rows is NULL, not 0 — without the coalesce a fresh install
    # would fail the float coercion on the way out.
    total_hours = db.scalar(select(func.coalesce(func.sum(TimeLog.hours), 0)))
    hours_this_week = db.scalar(
        select(func.coalesce(func.sum(TimeLog.hours), 0)).where(
            TimeLog.logged_date >= week_start, TimeLog.logged_date <= week_end
        )
    )

    total_requirements_done = db.scalar(
        select(func.count(Requirement.id)).where(Requirement.status == RequirementStatus.DONE)
    )
    total_bugs_fixed = db.scalar(
        select(func.count(Bug.id)).where(Bug.status == BugStatus.FIXED)
    )

    # APPROXIMATE. Requirements have no status-history table, so there is no
    # record of *when* one became Done — only updated_at, which any edit
    # touches. A requirement finished months ago but retitled today counts
    # here. Making this exact needs a requirement_status_history table
    # mirroring the one bugs already have.
    requirements_done_this_week = db.scalar(
        select(func.count(Requirement.id)).where(
            Requirement.status == RequirementStatus.DONE,
            Requirement.updated_at >= week_start_dt,
            Requirement.updated_at < week_end_dt,
        )
    )

    # Exact, unlike the line above: bugs do keep an append-only status history,
    # so the actual transition into Fixed is on record. DISTINCT because a bug
    # fixed, reopened and fixed again in one week must still count once.
    bugs_fixed_this_week = db.scalar(
        select(func.count(func.distinct(BugStatusHistory.bug_id))).where(
            BugStatusHistory.status == BugStatus.FIXED,
            BugStatusHistory.changed_at >= week_start_dt,
            BugStatusHistory.changed_at < week_end_dt,
        )
    )

    projects = db.scalars(select(Project).order_by(Project.created_at)).all()
    req_counts = counts_by_project(db, Requirement, RequirementStatus.DONE)
    bug_counts = counts_by_project(db, Bug, BugStatus.FIXED)

    return ReportRead(
        total_hours_all_time=total_hours,
        hours_this_week=hours_this_week,
        total_requirements_done=total_requirements_done,
        total_bugs_fixed=total_bugs_fixed,
        requirements_done_this_week=requirements_done_this_week,
        bugs_fixed_this_week=bugs_fixed_this_week,
        per_project_progress=[
            ProjectProgressItem(
                project_id=p.id,
                name=p.name,
                progress=progress_from_counts(
                    *req_counts.get(p.id, (0, 0)), *bug_counts.get(p.id, (0, 0))
                ),
            )
            for p in projects
        ],
    )
