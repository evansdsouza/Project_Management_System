import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listProjects, createProject, getProjectProgress } from '../api/projects';
import { listRequirements } from '../api/requirements';
import { listBugs } from '../api/bugs';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { EmptyState } from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

function useProjects() {
  const [data, setData] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [progressById, setProgressById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    // One unfiltered call each for the count columns — avoids firing
    // separate list requests per row. Progress comes from the server's
    // endpoint so the formula isn't duplicated here.
    Promise.all([listProjects(), listRequirements(undefined), listBugs(undefined)])
      .then(async ([projects, reqs, bugList]) => {
        setData(projects);
        setRequirements(reqs);
        setBugs(bugList);

        const results = await Promise.all(
          projects.map((p) =>
            getProjectProgress(p.id)
              .then((d) => [p.id, d.progress])
              .catch(() => [p.id, 0])
          )
        );
        setProgressById(Object.fromEntries(results));
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, requirements, bugs, progressById, loading, error, refetch };
}

function CreateProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  function handleClose() {
    setName('');
    setDescription('');
    setDeadline('');
    setFieldErrors({});
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // status is not collected here — it's server-defaulted to
      // "Not Started" on create, editable later via Project Detail.
      await createProject({ name, description: description || null, deadline: deadline || null });
      showToast('Project created');
      handleClose();
      onCreated();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      showToast('Failed to create project', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Project">
      <form onSubmit={handleSubmit}>
        <FormField label="Project Name" error={fieldErrors.name}>
          <input
            className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label="Description" error={fieldErrors.description}>
          <textarea
            className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormField label="Deadline" error={fieldErrors.deadline}>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectList() {
  const { data, requirements, bugs, progressById, loading, refetch } = useProjects();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // ?new=1 lets other pages (the Dashboard's empty state) open this modal
  // without the modal having to be lifted out of here. Read once at mount:
  // it's an entry condition, so a later param change shouldn't reopen it.
  const [modalOpen, setModalOpen] = useState(() => searchParams.get('new') === '1');

  function closeModal() {
    setModalOpen(false);
    // Drop the param so a refresh or back-navigation doesn't reopen the modal.
    if (searchParams.has('new')) {
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }

  const statsFor = (projectId) => ({
    requirementCount: requirements.filter((r) => r.project_id === projectId).length,
    bugCount: bugs.filter((b) => b.project_id === projectId).length,
    progress: progressById[projectId] ?? 0,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Project List</h1>
        <Button onClick={() => setModalOpen(true)}>New Project</Button>
      </div>

      {loading && (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {!loading && data?.length === 0 && (
        <EmptyState
          message="No projects yet"
          actionLabel="New Project"
          onAction={() => setModalOpen(true)}
        />
      )}

      {!loading && data?.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2">Name</th>
              <th className="py-2">Progress</th>
              <th className="py-2">Requirements</th>
              <th className="py-2">Bugs</th>
              <th className="py-2">Deadline</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((project) => {
              const stats = statsFor(project.id);
              return (
                <tr
                  key={project.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="py-2">{project.name}</td>
                  <td className="py-2">{stats.progress}%</td>
                  <td className="py-2">{stats.requirementCount}</td>
                  <td className="py-2">{stats.bugCount}</td>
                  <td className="py-2 text-gray-500">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2">{new Date(project.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={closeModal}
        onCreated={refetch}
      />
    </div>
  );
}
