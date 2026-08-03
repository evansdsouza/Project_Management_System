/** Shared by the Dashboard cards and the Reports per-project list, so the
 *  same percentage reads identically in both places. */
export function ProgressBar({ value }) {
  return (
    <div className="h-1.5 bg-tile rounded-full overflow-hidden">
      <div
        className="h-full bg-accent rounded-full transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
