import { useState, useEffect } from 'react';
import { Clock, CalendarClock, ListChecks, Bug, CheckCheck, ShieldCheck } from 'lucide-react';
import { getReport } from '../api/reports';
import { StatCard } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

function StatSkeleton() {
  return <div className="h-[5.5rem] bg-card rounded-xl animate-pulse" />;
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getReport()
      .then((data) => !cancelled && setReport(data))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Reports</h1>
        <ErrorState
          message="Couldn't load reports."
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  // Hours arrive as strings — Pydantic serialises Decimal that way — so they
  // need coercing before toFixed, which a string doesn't have.
  const hours = (v) => `${Number(v).toFixed(2)}h`;

  const stats = report && [
    { icon: Clock, label: 'Total hours logged', value: hours(report.total_hours_all_time) },
    { icon: CalendarClock, label: 'Hours this week', value: hours(report.hours_this_week) },
    { icon: ListChecks, label: 'Requirements done', value: report.total_requirements_done },
    { icon: Bug, label: 'Bugs fixed', value: report.total_bugs_fixed },
    { icon: CheckCheck, label: 'Requirements done this week', value: report.requirements_done_this_week },
    { icon: ShieldCheck, label: 'Bugs fixed this week', value: report.bugs_fixed_this_week },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Reports</h1>

      {/* Six across only on very wide screens — at 1440px that leaves each
          tile too narrow for its label. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8">
        {loading
          ? [0, 1, 2, 3, 4, 5].map((i) => <StatSkeleton key={i} />)
          : stats.map((s) => (
              <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
            ))}
      </div>

      <h2 className="text-sm font-semibold mb-3">Per-Project Progress</h2>
      {loading && <div className="h-24 bg-card rounded-xl animate-pulse" />}

      {!loading && report.per_project_progress.length === 0 && (
        <EmptyState message="No projects yet." />
      )}

      {!loading && report.per_project_progress.length > 0 && (
        <div className="border border-line rounded-xl divide-y divide-line bg-card">
          {report.per_project_progress.map((p) => (
            <div key={p.project_id} className="flex items-center gap-4 p-3">
              <div className="w-48 shrink-0 truncate text-sm">{p.name}</div>
              <div className="flex-1"><ProgressBar value={p.progress} /></div>
              <div className="w-14 shrink-0 text-right text-sm tabular-nums">{p.progress}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
