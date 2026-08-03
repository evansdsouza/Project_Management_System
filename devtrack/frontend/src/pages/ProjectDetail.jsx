import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject } from '../api/projects';
import { listRequirements } from '../api/requirements';
import { listBugs } from '../api/bugs';
import { SkeletonCard } from '../components/Skeleton';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getProject(id)
      .then(setProject)
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    listRequirements(id).then(setRequirements).catch(() => setRequirements([]));
    listBugs(id).then(setBugs).catch(() => setBugs([]));
  }, [id]);

  const totalRequirements = requirements.length;
  const doneRequirements = requirements.filter((r) => r.status === 'Done').length;
  const totalBugs = bugs.length;
  const fixedBugs = bugs.filter((b) => b.status === 'Fixed').length;

  // (Done Requirements + Fixed Bugs) / (Total Requirements + Total Bugs) — TRD §6.7
  const totalItems = totalRequirements + totalBugs;
  const progress = totalItems === 0
    ? 0
    : Math.round(((doneRequirements + fixedBugs) / totalItems) * 100);

  if (loading) return <SkeletonCard />;

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Project not found</p>
        <Link to="/projects" className="text-blue-600 hover:underline">Back to Project List</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}

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
