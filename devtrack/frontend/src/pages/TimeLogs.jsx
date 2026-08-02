import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listTimeLogs, createTimeLog, updateTimeLog, deleteTimeLog } from '../api/timeLogs';
import { listProjects } from '../api/projects';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MonthCalendar } from '../components/MonthCalendar';
import { HourGrid } from '../components/HourGrid';
import { useToast } from '../components/ToastProvider';
import { useWorkdayTarget, useTrackingStartDate } from '../hooks/useWorkdaySettings';
import { sumHoursByDate } from '../utils/timeLogLayout';
import {
  addDays, addMonths, buildMonthGrid, buildWeekDays, formatDayTitle, formatMonthTitle,
  formatWeekTitle, parseDateStr, startOfWeek, toDateStr, todayStr, toTimeInputValue,
  addMinutesToTimeStr, timeStrToMinutes,
} from '../utils/date';

const INPUT_CLASS =
  'border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500';

const VIEWS = ['day', 'week', 'month'];

function TimeLogModal({ open, onClose, onSaved, onDelete, timeLog, projects, defaults }) {
  const isEdit = Boolean(timeLog);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    if (!open) return;
    const start = timeLog
      // Seconds must be stripped: <input type="time"> renders BLANK for
      // '09:00:00' and would silently wipe the value on save.
      ? toTimeInputValue(timeLog.start_time)
      : (defaults?.start_time ?? '09:00');
    setForm({
      project_id: timeLog?.project_id ? String(timeLog.project_id) : '',
      logged_date: timeLog?.logged_date ?? defaults?.logged_date ?? todayStr(),
      start_time: start,
      end_time: timeLog ? toTimeInputValue(timeLog.end_time) : addMinutesToTimeStr(start, 60),
      hours: timeLog?.hours ?? '1',
      client: timeLog?.client ?? '',
      description: timeLog?.description ?? '',
    });
    setFieldErrors({});
  }, [open, timeLog, defaults]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();

    // Validated here as well as server-side: a Pydantic model-level validator
    // reports under loc=["body"], which the shared field-error extractor can't
    // map to an input, so the inline message would never appear.
    if (form.start_time && form.end_time
        && timeStrToMinutes(form.end_time) <= timeStrToMinutes(form.start_time)) {
      setFieldErrors({ end_time: 'End time must be after start time' });
      return;
    }

    setSubmitting(true);
    const payload = {
      project_id: form.project_id ? Number(form.project_id) : null,
      logged_date: form.logged_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      hours: form.hours === '' ? null : Number(form.hours),
      client: form.client || null,
      description: form.description || null,
    };
    try {
      if (isEdit) {
        await updateTimeLog(timeLog.id, payload);
        showToast('Time log updated');
      } else {
        await createTimeLog(payload);
        showToast('Time log created');
      }
      onClose();
      onSaved();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      showToast(isEdit ? 'Failed to update time log' : 'Failed to create time log', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Time Log' : 'Add Time Log'}>
      <form onSubmit={handleSubmit}>
        <FormField label="Project" error={fieldErrors.project_id}>
          <select className={INPUT_CLASS} value={form.project_id ?? ''} onChange={set('project_id')}>
            <option value="">Select a project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="Date" error={fieldErrors.logged_date}>
          <input type="date" className={INPUT_CLASS} value={form.logged_date ?? ''} onChange={set('logged_date')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start" error={fieldErrors.start_time}>
            <input type="time" className={INPUT_CLASS} value={form.start_time ?? ''} onChange={set('start_time')} />
          </FormField>
          <FormField label="End" error={fieldErrors.end_time}>
            <input type="time" className={INPUT_CLASS} value={form.end_time ?? ''} onChange={set('end_time')} />
          </FormField>
        </div>
        <FormField label="Hours logged" error={fieldErrors.hours}>
          <input type="number" step="0.25" min="0" className={INPUT_CLASS} value={form.hours ?? ''} onChange={set('hours')} />
        </FormField>
        <p className="text-sm text-gray-500 -mt-2 mb-4">
          Counted toward your daily total. It can be less than the start–end span
          if you weren&apos;t working the whole time.
        </p>
        <FormField label="Client" error={fieldErrors.client}>
          <input className={INPUT_CLASS} value={form.client ?? ''} onChange={set('client')} />
        </FormField>
        <FormField label="Notes" error={fieldErrors.description}>
          <textarea className={INPUT_CLASS} rows={2} value={form.description ?? ''} onChange={set('description')} />
        </FormField>
        <div className="flex justify-between gap-2">
          <div>
            {isEdit && (
              <Button type="button" variant="danger" onClick={() => onDelete(timeLog)}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{isEdit ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function TimeLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const target = useWorkdayTarget();
  const trackingStart = useTrackingStartDate();
  const showToast = useToast();

  const dateParam = searchParams.get('date');
  const anchorStr = dateParam ?? todayStr();
  // A link carrying a date historically meant "show me that day", so the
  // pre-existing Dashboard deep-link (/timelogs?date=X) lands on Day view.
  // A bare /timelogs from the sidebar wants the overview.
  const view = VIEWS.includes(searchParams.get('view'))
    ? searchParams.get('view')
    : (dateParam ? 'day' : 'month');

  const anchor = useMemo(() => parseDateStr(anchorStr), [anchorStr]);

  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalDefaults, setModalDefaults] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { rangeStart, rangeEnd, days, title } = useMemo(() => {
    if (view === 'day') {
      return {
        rangeStart: anchorStr,
        rangeEnd: anchorStr,
        days: [{ dateStr: anchorStr, date: anchor, inMonth: true }],
        title: formatDayTitle(anchorStr),
      };
    }
    if (view === 'week') {
      const weekDays = buildWeekDays(anchor);
      return {
        rangeStart: weekDays[0].dateStr,
        rangeEnd: weekDays[6].dateStr,
        days: weekDays,
        title: formatWeekTitle(weekDays[0].dateStr, weekDays[6].dateStr),
      };
    }
    // The full 42-cell grid, not the 1st–last. Fetching only the calendar month
    // would leave adjacent-month cells at zero hours and render them red
    // despite having logged time.
    const cells = buildMonthGrid(anchor);
    return {
      rangeStart: cells[0].dateStr,
      rangeEnd: cells[41].dateStr,
      days: cells,
      title: formatMonthTitle(anchor),
    };
  }, [view, anchorStr, anchor]);

  const refetch = useCallback(() => {
    setLoading(true);
    listTimeLogs({ from: rangeStart, to: rangeEnd })
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [rangeStart, rangeEnd]);

  useEffect(() => { refetch(); }, [refetch]);
  useEffect(() => { listProjects().then(setProjects).catch(() => setProjects([])); }, []);

  const dayTotals = useMemo(() => sumHoursByDate(data), [data]);
  const rangeTotal = useMemo(
    () => data.reduce((sum, e) => sum + Number(e.hours), 0),
    [data],
  );

  function navigate(nextDate, nextView = view, replace = true) {
    const next = new URLSearchParams(searchParams);
    next.set('date', nextDate);
    next.set('view', nextView);
    setSearchParams(next, { replace });
  }

  function step(direction) {
    if (view === 'month') return navigate(toDateStr(addMonths(anchor, direction)));
    if (view === 'week') return navigate(toDateStr(addDays(startOfWeek(anchor), direction * 7)));
    return navigate(toDateStr(addDays(anchor, direction)));
  }

  function openCreate(defaults = null) {
    setEditing(null);
    setModalDefaults(defaults ?? { logged_date: anchorStr });
    setModalOpen(true);
  }

  function openEdit(entry) {
    setEditing(entry);
    setModalDefaults(null);
    setModalOpen(true);
  }

  async function handleDelete() {
    try {
      await deleteTimeLog(deleting.id);
      showToast('Time log deleted');
      setDeleting(null);
      setModalOpen(false);
      refetch();
    } catch {
      showToast('Failed to delete time log', 'error');
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Time Logs</h1>
        <Button onClick={() => openCreate()}>Add Time Log</Button>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => step(-1)}
            className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
            title="Previous"
          >
            ‹
          </button>
          <button
            onClick={() => navigate(todayStr(), view)}
            className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => step(1)}
            className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
            title="Next"
          >
            ›
          </button>
          <span className="ml-2 text-lg font-medium">{title}</span>
          <span className="ml-2 text-sm text-gray-500">{rangeTotal.toFixed(2)}h logged</span>
        </div>

        <div className="inline-flex rounded border border-gray-300 overflow-hidden">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => navigate(anchorStr, v, false)}
              className={`px-3 py-1 text-sm capitalize ${
                view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <MonthCalendar
          anchor={anchor}
          dayTotals={dayTotals}
          target={target}
          trackingStart={trackingStart}
          selectedDate={dateParam ?? undefined}
          onSelectDate={(dateStr) => navigate(dateStr, 'day', false)}
          loading={loading}
        />
      ) : (
        <HourGrid
          days={days}
          entries={data}
          target={target}
          trackingStart={trackingStart}
          onSelectSlot={(dateStr, startTime) =>
            openCreate({
              logged_date: dateStr,
              start_time: startTime,
            })
          }
          onSelectEntry={openEdit}
        />
      )}

      {!loading && data.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-4">
          No time logged in this {view}.{' '}
          <button onClick={() => openCreate()} className="text-blue-600 hover:underline">
            Add a time log
          </button>
        </p>
      )}

      <TimeLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
        onDelete={setDeleting}
        timeLog={editing}
        projects={projects}
        defaults={modalDefaults}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        message="Delete this time log?"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
