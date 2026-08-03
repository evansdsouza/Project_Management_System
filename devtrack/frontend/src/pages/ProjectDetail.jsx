import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, getProjectProgress } from '../api/projects';
import { listRequirements } from '../api/requirements';
import { listBugs } from '../api/bugs';
import { SkeletonCard } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    getProject(id)
      .then(setProject)
      .catch((err) => {
        // A 404 is a real answer — this project doesn't exist. Anything else
        // (500, network down) is a failure to answer, and must be told apart:
        // previously both fell through with project still null, and the render
        // below dereferenced project.name into a blank screen.
        if (err.response?.status === 404) setNotFound(true);
        else setError(err);
      })
      .finally(() => setLoading(false));
  }, [id, reloadKey]);

  // Requirements/bugs are still fetched for the total/done summary counts;
  // the progress % itself comes from the server so the formula lives in
  // exactly one place (TRD §6.7). These are secondary to the project itself,
  // so a failure degrades the counts rather than failing the whole page.
  useEffect(() => {
    listRequirements(id).then(setRequirements).catch(() => setRequirements([]));
    listBugs(id).then(setBugs).catch(() => setBugs([]));
    getProjectProgress(id).then((d) => setProgress(d.progress)).catch(() => setProgress(0));
  }, [id, reloadKey]);

  const totalRequirements = requirements.length;
  const doneRequirements = requirements.filter((r) => r.status === 'Done').length;
  const totalBugs = bugs.length;
  const fixedBugs = bugs.filter((b) => b.status === 'Fixed').length;

  if (loading) return <SkeletonCard />;

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Project not found</p>
        <Link to="/projects" className="text-blue-600 hover:underline">Back to Project List</Link>
      </div>
    );
  }

  // Guards the render below, which assumes a project object exists. `error`
  // covers the known failure paths; the `!project` fallback catches anything
  // that slips past them rather than letting it blank the page.
  if (error || !project) {
    return (
      <ErrorState
        message="Couldn't load this project."
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          {project.status}
        </span>
      </div>
      {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
      {project.deadline && (
        <p className="text-gray-500 text-sm mt-1">
          Deadline: {new Date(project.deadline).toLocaleDateString()}
        </p>
      )}

      <div className="mt-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Requirements</h2>
          <p className="text-gray-500 text-sm mb-3">
            {totalRequirements} total / {doneRequirements} done
          </p>
          <button
            className="text-blue-600 text-sm hover:underline"
            onClick={() => navigate(`/projects/${id}/requirements`)}
          >
            Go to Requirements
          </button>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Bugs</h2>
          <p className="text-gray-500 text-sm mb-3">
            {totalBugs} total / {fixedBugs} fixed
          </p>
          <button
            className="text-blue-600 text-sm hover:underline"
            onClick={() => navigate(`/projects/${id}/bugs`)}
          >
            Go to Bugs
          </button>
        </div>
      </div>
    </div>
  );
}
