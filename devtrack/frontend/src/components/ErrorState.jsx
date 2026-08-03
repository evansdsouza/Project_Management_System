/**
 * Shown when a fetch fails. Its job is to be distinguishable from EmptyState:
 * "we couldn't load this" and "there is nothing here" look identical to a user
 * otherwise, and the second wrongly invites them to start creating things.
 */
export function ErrorState({ message = "Couldn't load this. Check that the API is running.", onRetry }) {
  return (
    <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm flex items-center justify-between gap-4">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
