import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBacklog } from '../api/backlog';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SkeletonRow } from '../components/Skeleton';

// Outlined rather than filled, unlike the priority and bug-type badges beside
// it: "what kind of thing is this" shouldn't compete visually with "how urgent
// is it", and a filled tag here would collide with the priority colours.
function KindTag({ kind }) {
  const isBug = kind === 'bug';
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
        isBug ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700'
      }`}
    >
      {isBug ? 'Bug' : 'Requirement'}
    </span>
  );
}

export default function Backlog() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listBacklog()
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Read-only page: rows lead to the parent Requirements/Bugs page, which is
  // the only place an item can actually be taken out of the backlog.
  const openItem = (item) =>
    navigate(`/projects/${item.project_id}/${item.kind === 'bug' ? 'bugs' : 'requirements'}`);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Backlog</h1>

      {error && (
        <ErrorState
          message="Couldn't load the backlog."
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      )}

      {loading && !error && (
        <div>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {!loading && !error && items?.length === 0 && (
        <EmptyState message="Nothing in the backlog." />
      )}

      {!loading && !error && items?.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2">Title</th>
              <th className="py-2">Type</th>
              <th className="py-2">Project</th>
              <th className="py-2">Priority</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              // Requirements and Bugs are separate tables, so their ids
              // collide — the key has to carry the kind as well.
              <tr
                key={`${item.kind}-${item.id}`}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => openItem(item)}
              >
                <td className="py-2">{item.title}</td>
                <td className="py-2">
                  <div className="flex items-center gap-1.5">
                    <KindTag kind={item.kind} />
                    {item.type && <Badge value={item.type} />}
                  </div>
                </td>
                <td className="py-2 text-gray-600">{item.project_name}</td>
                <td className="py-2"><Badge value={item.priority} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
