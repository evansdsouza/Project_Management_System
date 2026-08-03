const COLORS = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  gray: 'bg-gray-100 text-gray-700',
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
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLORS[resolvedColor]}`}>
      {value}
    </span>
  );
}
