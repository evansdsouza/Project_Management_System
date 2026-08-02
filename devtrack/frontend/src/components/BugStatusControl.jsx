import { useState, useEffect, useRef } from 'react';
import { Badge } from './Badge';
import { updateBugStatus } from '../api/bugs';
import { useToast } from './ToastProvider';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Partial Fix', 'Fixed'];

export function BugStatusControl({ bug, onStatusChanged }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const showToast = useToast();

  // Close when clicking anywhere outside the control.
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function handleSelect(status) {
    setOpen(false);
    try {
      await updateBugStatus(bug.id, { status });
      showToast(`Status updated to ${status}`);
      onStatusChanged();
    } catch {
      showToast('Failed to update status', 'error');
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} title="Change status">
        <Badge value={bug.status} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded shadow-md">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 whitespace-nowrap"
              onClick={() => handleSelect(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
