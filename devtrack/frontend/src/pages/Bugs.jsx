import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listBugs, createBug, updateBug } from '../api/bugs';
import { listRequirements } from '../api/requirements';
import { getProject } from '../api/projects';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormField, INPUT_CLASS } from '../components/FormField';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SkeletonRow } from '../components/Skeleton';
import { BugStatusControl } from '../components/BugStatusControl';
import { BugHistoryPopover } from '../components/BugHistoryPopover';
import { useToast } from '../components/ToastProvider';

const BUG_TYPES = ['Logic Error', 'System Error', 'Both'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const BACKLOG_STATUSES = ['In Backlog', 'Active'];

function BugModal({ open, onClose, onSaved, projectId, bug, requirements }) {
  const isEdit = Boolean(bug);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    if (!open) return;
    setForm({
      title: bug?.title ?? '',
      description: bug?.description ?? '',
      type: bug?.type ?? 'Logic Error',
      priority: bug?.priority ?? 'Medium',
      requirement_id: bug?.requirement_id ? String(bug.requirement_id) : '',
      backlog_status: bug?.backlog_status ?? 'In Backlog',
      recomm_fix: bug?.recomm_fix ?? '',
      fix: bug?.fix ?? '',
      remark: bug?.remark ?? '',
    });
    setFieldErrors({});
  }, [open, bug]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Fix fields only make sense once work has produced a fix — UI/UX §3.5.
  const showFixFields = isEdit && (bug?.status === 'Fixed' || bug?.status === 'Partial Fix');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      type: form.type,
      priority: form.priority,
      requirement_id: form.requirement_id ? Number(form.requirement_id) : null,
      backlog_status: form.backlog_status,
    };
    try {
      if (isEdit) {
        // status is deliberately never sent here — it changes only through
        // the row status control, so every change is logged (App Flow §6).
        if (showFixFields) {
          payload.recomm_fix = form.recomm_fix || null;
          payload.fix = form.fix || null;
          payload.remark = form.remark || null;
        }
        await updateBug(bug.id, payload);
        showToast('Bug updated');
      } else {
        await createBug({ ...payload, project_id: Number(projectId) });
        showToast('Bug created');
      }
      onClose();
      onSaved();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      showToast(isEdit ? 'Failed to update bug' : 'Failed to create bug', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Bug' : 'Add Bug'}>
      <form onSubmit={handleSubmit}>
        <FormField label="Title" error={fieldErrors.title}>
          <input className={INPUT_CLASS} value={form.title ?? ''} onChange={set('title')} />
        </FormField>
        <FormField label="Description" error={fieldErrors.description}>
          <textarea className={INPUT_CLASS} rows={2} value={form.description ?? ''} onChange={set('description')} />
        </FormField>
        <FormField label="Type" error={fieldErrors.type}>
          <select className={INPUT_CLASS} value={form.type ?? 'Logic Error'} onChange={set('type')}>
            {BUG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Priority" error={fieldErrors.priority}>
          <select className={INPUT_CLASS} value={form.priority ?? 'Medium'} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Linked Requirement" error={fieldErrors.requirement_id}>
          <select className={INPUT_CLASS} value={form.requirement_id ?? ''} onChange={set('requirement_id')}>
            <option value="">None</option>
            {requirements.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </FormField>
        <FormField label="Backlog Status" error={fieldErrors.backlog_status}>
          <select className={INPUT_CLASS} value={form.backlog_status ?? 'In Backlog'} onChange={set('backlog_status')}>
            {BACKLOG_STATUSES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </FormField>
        {showFixFields && (
          <>
            <FormField label="Recommended Fix" error={fieldErrors.recomm_fix}>
              <textarea className={INPUT_CLASS} rows={2} value={form.recomm_fix ?? ''} onChange={set('recomm_fix')} />
            </FormField>
            <FormField label="Fix Applied" error={fieldErrors.fix}>
              <textarea className={INPUT_CLASS} rows={2} value={form.fix ?? ''} onChange={set('fix')} />
            </FormField>
            <FormField label="Remark" error={fieldErrors.remark}>
              <textarea className={INPUT_CLASS} rows={2} value={form.remark ?? ''} onChange={set('remark')} />
            </FormField>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{isEdit ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Bugs() {
  const { id: projectId } = useParams();
  const [data, setData] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    listBugs(projectId)
      .then((rows) => { setData(rows); setError(null); })
      // Deliberately NOT setData([]): that renders the "No bugs yet" empty
      // state, so an API outage would read as a clean project rather than a
      // failure — the most misleading possible message on a bug tracker.
      .catch(setError)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { refetch(); }, [refetch]);
  useEffect(() => { getProject(projectId).then(setProject).catch(() => {}); }, [projectId]);
  useEffect(() => {
    listRequirements(projectId).then(setRequirements).catch(() => setRequirements([]));
  }, [projectId]);

  const requirementTitle = (id) => requirements.find((r) => r.id === id)?.title;

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(bug) {
    setEditing(bug);
    setModalOpen(true);
  }

  return (
    <div>
      <Link to={`/projects/${projectId}`} className="text-sm text-accent hover:underline">
        ← {project?.name ?? 'Project'}
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-2xl font-semibold">Bugs</h1>
        <Button onClick={openCreate}>Add Bug</Button>
      </div>

      {loading && <div><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>}

      {!loading && error && (
        <ErrorState message="Couldn't load bugs." onRetry={refetch} />
      )}

      {!loading && !error && data?.length === 0 && (
        <EmptyState message="No bugs yet" actionLabel="Add Bug" onAction={openCreate} />
      )}

      {!loading && !error && data?.length > 0 && (
        <div className="bg-card border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-fg-muted border-b border-line bg-panel/60">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Linked Requirement</th>
              <th className="px-5 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((bug) => (
              <tr key={bug.id} className="border-b border-line last:border-0 hover:bg-card-hover transition-colors">
                <td className="px-5 py-3">{bug.title}</td>
                <td className="px-5 py-3"><Badge value={bug.type} color="gray" /></td>
                <td className="px-5 py-3">
                  <BugStatusControl bug={bug} onStatusChanged={refetch} />
                </td>
                <td className="px-5 py-3"><Badge value={bug.priority} /></td>
                <td className="px-5 py-3 text-fg-muted">{requirementTitle(bug.requirement_id) || '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-accent hover:underline" onClick={() => openEdit(bug)}>
                      Edit
                    </button>
                    <BugHistoryPopover bugId={bug.id} statusKey={bug.status} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <BugModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
        projectId={projectId}
        bug={editing}
        requirements={requirements}
      />
    </div>
  );
}
