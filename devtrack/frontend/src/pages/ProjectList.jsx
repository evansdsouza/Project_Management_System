import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, createProject } from '../api/projects';
import { listRequirements } from '../api/requirements';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { EmptyState } from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

function useProjects() {
  const [data, setData] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    // One unfiltered requirements call, grouped per project below — avoids
    // firing a separate request for every row.
    Promise.all([listProjects(), listRequirements(undefined)])
      .then(([projects, reqs]) => {
        setData(projects);
        setRequirements(reqs);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, requirements, loading, error, refetch };
}

function CreateProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  function handleClose() {
    setName('');
    setDescription('');
    setFieldErrors({});
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProject({ name, description: description || null });
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
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={submitting}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectList() {
  const { data, requirements, loading, refetch } = useProjects();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const statsFor = (projectId) => {
    const owned = requirements.filter((r) => r.project_id === projectId);
    const done = owned.filter((r) => r.status === 'Done').length;
    const progress = owned.length === 0 ? 0 : Math.round((done / owned.length) * 100);
    return { count: owned.length, progress };
  };

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
                  <td className="py-2">{stats.count}</td>
                  <td className="py-2 text-gray-400">—</td>
                  <td className="py-2">{new Date(project.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={refetch}
      />
    </div>
  );
}
