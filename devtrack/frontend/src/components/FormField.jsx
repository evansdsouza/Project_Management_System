export function FormField({ label, error, children }) {
  return (
    <div className="space-y-1.5 mb-4">
      <label className="block text-xs font-medium text-fg-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-bad-fg">{error}</p>}
    </div>
  );
}

/** Shared input styling — every form control in the app uses this string, so
 *  focus ring and field colour stay identical across the six modals. */
export const INPUT_CLASS =
  'bg-tile border border-line-strong rounded-lg px-3 py-2 w-full text-sm text-fg ' +
  'placeholder:text-fg-faint focus:outline-none focus:border-accent focus:ring-1 ' +
  'focus:ring-accent transition-colors';
