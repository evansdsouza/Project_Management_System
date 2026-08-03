const COLORS = {
  green: 'bg-ok-bg text-ok-fg border-ok-fg/20',
  blue: 'bg-info-bg text-info-fg border-info-fg/20',
  red: 'bg-bad-bg text-bad-fg border-bad-fg/20',
  amber: 'bg-warn-bg text-warn-fg border-warn-fg/20',
  gray: 'bg-mute-bg text-mute-fg border-line-strong',
};

// Every enum value used anywhere in the app, mapped to its badge color per
// UI/UX §5 — one lookup table instead of an if/else chain re-derived per page.
const STATUS_COLORS = {
  'Not Started': 'gray', 'In Progress': 'blue', 'Done': 'green',
  'Open': 'red', 'Partial Fix': 'amber', 'Fixed': 'green',
  'Critical': 'red', 'High': 'amber', 'Medium': 'blue', 'Low': 'gray',
  'In Backlog': 'gray', 'Active': 'blue',
};

export function Badge({ value, color }) {
  const resolvedColor = color || STATUS_COLORS[value] || 'gray';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${COLORS[resolvedColor]}`}
    >
      {/* The dot carries the status at a glance in a dense table, the way the
          reference's task list does — the label confirms rather than cues. */}
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {value}
    </span>
  );
}
