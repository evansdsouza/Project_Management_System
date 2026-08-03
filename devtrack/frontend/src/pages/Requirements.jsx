import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listRequirements, createRequirement, updateRequirement } from '../api/requirements';
import { getProject } from '../api/projects';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { EmptyState } from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Not Started', 'In Progress', 'Done'];
const BACKLOG_STATUSES = ['In Backlog', 'Active'];

const SELECT_CLASS =
  'border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500';

function RequirementModal({ open, onClose, onSaved, projectId, requirement }) {
  const isEdit = Boolean(requirement);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  // Reset the form each time the modal opens so a previous edit's values
  // never leak into the next open.
  useEffect(() => {
    if (!open) return;
    setForm({
      title: requirement?.title ?? '',
      description: requirement?.description ?? '',
      priority: requirement?.priority ?? 'Medium',
      status: requirement?.status ?? 'Not Started',
      backlog_status: requirement?.backlog_status ?? 'In Backlog',
      recom_appr: requirement?.recom_appr ?? '',
      implementation: requirement?.implementation ?? '',
      remarks: requirement?.remarks ?? '',
      deadline: requirement?.deadline ?? '',
    });
    setFieldErrors({});
  }, [open, requirement]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      backlog_status: form.backlog_status,
      recom_appr: form.recom_appr || null,
      implementation: form.implementation || null,
      remarks: form.remarks || null,
      deadline: form.deadline || null,
    };
    try {
      if (isEdit) {
        // status is editable on update, but never sent on create — the
        // server always starts a requirement at "Not Started" (TRD §7.4.2).
        await updateRequirement(requirement.id, { ...payload, status: form.status });
        showToast('Requirement updated');
      } else {
        await createRequirement({ ...payload, project_id: Number(projectId) });
        showToast('Requirement created');
      }
      onClose();
      onSaved();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      showToast(isEdit ? 'Failed to update requirement' : 'Failed to create requirement', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Requirement' : 'Add Requirement'}>
      <form onSubmit={handleSubmit}>
        <FormField label="Title" error={fieldErrors.title}>
          <input className={SELECT_CLASS} value={form.title ?? ''} onChange={set('title')} />
        </FormField>
        <FormField label="Description" error={fieldErrors.description}>
          <textarea className={SELECT_CLASS} rows={2} value={form.description ?? ''} onChange={set('description')} />
        </FormField>
        <FormField label="Priority" error={fieldErrors.priority}>
          <select className={SELECT_CLASS} value={form.priority ?? 'Medium'} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        {isEdit && (
          <FormField label="Status" error={fieldErrors.status}>
            <select className={SELECT_CLASS} value={form.status ?? 'Not Started'} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        )}
        <FormField label="Backlog Status" error={fieldErrors.backlog_status}>
          <select className={SELECT_CLASS} value={form.backlog_status ?? 'In Backlog'} onChange={set('backlog_status')}>
            {BACKLOG_STATUSES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </FormField>
        <FormField label="Recommended Approach" error={fieldErrors.recom_appr}>
          <textarea
            className={SELECT_CLASS}
            rows={2}
            value={form.recom_appr ?? ''}
            onChange={set('recom_appr')}
          />
        </FormField>
        <FormField label="Implementation" error={fieldErrors.implementation}>
          <textarea
            className={SELECT_CLASS}
            rows={2}
            value={form.implementation ?? ''}
            onChange={set('implementation')}
          />
        </FormField>
        <FormField label="Remarks" error={fieldErrors.remarks}>
          <textarea
            className={SELECT_CLASS}
            rows={2}
            value={form.remarks ?? ''}
            onChange={set('remarks')}
          />
        </FormField>
        <FormField label="Deadline" error={fieldErrors.deadline}>
          <input
            type="date"
            className={SELECT_CLASS}
            value={form.deadline ?? ''}
            onChange={set('deadline')}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{isEdit ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Requirements() {
  const { id: projectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    listRequirements(projectId)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { refetch(); }, [refetch]);
  useEffect(() => { getProject(projectId).then(setProject).catch(() => {}); }, [projectId]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(requirement) {
    setEditing(requirement);
    setModalOpen(true);
  }

  return (
    <div>
      <Link to={`/projects/${projectId}`} className="text-sm text-blue-600 hover:underline">
        ← {project?.name ?? 'Project'}
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-2xl font-semibold">Requirements</h1>
        <Button onClick={openCreate}>Add Requirement</Button>
      </div>

      {loading && <div><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>}

      {!loading && data?.length === 0 && (
        <EmptyState message="No requirements yet" actionLabel="Add Requirement" onAction={openCreate} />
      )}

      {!loading && data?.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2">Title</th>
              <th className="py-2">Priority</th>
              <th className="py-2">Status</th>
              <th className="py-2">Backlog</th>
              <th className="py-2">Recommended Approach</th>
              <th className="py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((req) => (
              <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2">{req.title}</td>
                <td className="py-2"><Badge value={req.priority} /></td>
                <td className="py-2"><Badge value={req.status} /></td>
                <td className="py-2">{req.backlog_status && <Badge value={req.backlog_status} />}</td>
                <td className="py-2 text-gray-500">{req.recom_appr || '—'}</td>
                <td className="py-2 text-right">
                  <button className="text-blue-600 hover:underline" onClick={() => openEdit(req)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <RequirementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
        projectId={projectId}
        requirement={editing}
      />
    </div>
  );
}
