/** Shared by the Dashboard cards and the Reports per-project list, so the
 *  same percentage reads identically in both places. */
export function ProgressBar({ value }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
