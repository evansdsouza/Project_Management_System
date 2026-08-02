import { useState, useEffect, useRef } from 'react';
import { getBugHistory } from '../api/bugs';

export function BugHistoryPopover({ bugId, statusKey }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const ref = useRef(null);

  // Drop cached history whenever the bug's status changes, so reopening
  // the popover after a status update doesn't show a stale timeline.
  useEffect(() => { setHistory(null); }, [statusKey]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function toggle() {
    if (!open && !history) {
      setHistory(await getBugHistory(bugId));
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={toggle} className="text-gray-400 hover:text-gray-600" title="Status history">
        🕘
      </button>
      {open && (
        <div className="absolute z-10 mt-1 right-0 bg-white border border-gray-200 rounded shadow-md p-3 w-64 text-left">
          {history?.length ? (
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id}>
                  <span className="font-medium">{h.status}</span>{' '}
                  <span className="text-gray-400">{new Date(h.changed_at).toLocaleString()}</span>
                  {h.note && <p className="text-gray-500">{h.note}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No history yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
