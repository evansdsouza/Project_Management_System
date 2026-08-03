import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Target, Clock, ListChecks } from 'lucide-react';
import { getDashboard } from '../api/dashboard';
import { StatCard } from '../components/Card';
import { listTimeLogs } from '../api/timeLogs';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { MonthCalendar } from '../components/MonthCalendar';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SkeletonCard } from '../components/Skeleton';
import { useWorkdayTarget, useTrackingStartDate } from '../hooks/useWorkdaySettings';
import { sumHoursByDate } from '../utils/timeLogLayout';
import { buildMonthGrid, formatMonthTitle } from '../utils/date';

// flex-col is load-bearing, not cosmetic: the grid stretches every card to the
// tallest in its row, and Chrome's UA stylesheet vertically CENTRES a button's
// content in the leftover space. Without it, a card with a shorter body renders
// ~18px lower than its neighbours and the row looks misaligned.
const CARD_CLASS =
  'flex flex-col text-left border border-line rounded-xl p-4 bg-card ' +
  'hover:border-line-strong hover:bg-card-hover transition-colors';

function ProjectCard({ project, onOpen }) {
  const { name, progress, top_requirement: top } = project;
  return (
    <button type="button" onClick={onOpen} data-testid="project-card" className={CARD_CLASS}>
      <div className="font-medium truncate mb-3">{name}</div>

      {/* mb-3 rather than relying on the divider's mt-auto: that collapses to
          zero when the card isn't stretched, leaving no gap at all. */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold tabular-nums w-12 shrink-0">{progress}%</span>
        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>
      </div>

      {/* mt-auto pins this to the bottom so the divider lines up across cards
          even when a project name wraps to two lines. */}
      <div className="mt-auto pt-3 border-t border-line min-h-[3rem]">
        {top ? (
          <>
            <div className="text-xs text-fg-muted mb-1">Top requirement</div>
            <div className="text-sm truncate mb-1.5">{top.title}</div>
            <Badge value={top.priority} />
          </>
        ) : (
          // Covers both "no requirements yet" and "everything is Done" — the
          // server sends null for each, and the distinction doesn't change
          // what the user would do next from here.
          <div className="text-sm text-fg-faint">No open requirements</div>
        )}
      </div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const target = useWorkdayTarget();
  const trackingStart = useTrackingStartDate();

  // Fixed to the current month per UI/UX §3.1 — the Time Logs page owns month
  // paging. Anchored once at mount so re-renders can't shift the grid.
  const [monthAnchor] = useState(() => new Date());

  // The fetch must cover the whole 42-cell grid, not the 1st–last of the
  // month: the leading and trailing cells belong to adjacent months and would
  // otherwise come back empty and render red despite having time logged.
  const cells = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const rangeFrom = cells[0].dateStr;
  const rangeTo = cells[cells.length - 1].dateStr;

  const [projects, setProjects] = useState(null);
  const [dayTotals, setDayTotals] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumped by Retry to re-run the effect; the range strings are stable, so
  // they alone can't re-trigger it.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Both requests are independent, so they overlap rather than chain.
    Promise.all([getDashboard(), listTimeLogs({ from: rangeFrom, to: rangeTo })])
      .then(([dash, logs]) => {
        if (cancelled) return;
        setProjects(dash.projects);
        setDayTotals(sumHoursByDate(logs));
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [rangeFrom, rangeTo, reloadKey]);

  // A date carried without a view opens Time Logs on Day view — the
  // pre-existing deep-link contract that page was built around.
  const openDate = (dateStr) => navigate(`/timelogs?date=${dateStr}`);

  const summary = useMemo(() => {
    const list = projects ?? [];
    const totals = [...dayTotals.values()];
    return {
      projectCount: list.length,
      completeCount: list.filter((p) => p.progress >= 100).length,
      avgProgress: list.length
        ? Math.round(list.reduce((s, p) => s + p.progress, 0) / list.length)
        : 0,
      // The map spans the 42-cell grid, so this is "the visible month" rather
      // than a strict calendar month — same window the calendar below shows.
      monthHours: totals.reduce((s, h) => s + h, 0),
      daysLogged: totals.filter((h) => h > 0).length,
      openTop: list.filter((p) => p.top_requirement).length,
    };
  }, [projects, dayTotals]);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        <ErrorState
          message="Couldn't load the dashboard."
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  // Empty state replaces the whole content area, calendar included (UI/UX
  // §3.1) — with no projects there's nothing yet for a calendar to report on.
  if (!loading && projects?.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        <EmptyState
          message="No projects yet — create one to start tracking work."
          actionLabel="Create your first project"
          onAction={() => navigate('/projects?new=1')}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Overview</h1>

      {/* Every figure here is derived from the two payloads already fetched
          above — no extra requests, and nothing that isn't real data. The
          reference's sparklines are omitted deliberately: we keep no
          historical series for these, and drawing a curve would invent one. */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={FolderKanban}
              label="Projects"
              value={summary.projectCount}
              delta={`${summary.completeCount} at 100%`}
              deltaTone={summary.completeCount > 0 ? 'up' : 'muted'}
            />
            <StatCard
              icon={Target}
              label="Average completion"
              value={`${summary.avgProgress}%`}
              delta="across all projects"
            />
            <StatCard
              icon={Clock}
              label="Hours this month"
              value={summary.monthHours.toFixed(2)}
              delta={`${summary.daysLogged} day${summary.daysLogged === 1 ? '' : 's'} logged`}
            />
            <StatCard
              icon={ListChecks}
              label="Open requirements"
              value={summary.openTop}
              delta="projects with work queued"
              deltaTone={summary.openTop > 0 ? 'warn' : 'muted'}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => navigate(`/projects/${p.id}`)}
              />
            ))}
      </div>

      <div className="border border-line rounded-xl p-5 bg-card">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold">{formatMonthTitle(monthAnchor)}</h2>
          <span className="text-xs text-fg-muted">Click a day to open its time log</span>
        </div>
        <MonthCalendar
          anchor={monthAnchor}
          dayTotals={dayTotals}
          target={target}
          trackingStart={trackingStart}
          onSelectDate={openDate}
          loading={loading}
        />
      </div>
    </div>
  );
}
