import { AlertTriangle } from 'lucide-react';

/**
 * Shown when a fetch fails. Its job is to be distinguishable from EmptyState:
 * "we couldn't load this" and "there is nothing here" look identical to a user
 * otherwise, and the second wrongly invites them to start creating things.
 */
export function ErrorState({ message = "Couldn't load this. Check that the API is running.", onRetry }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-bad-bg border border-bad-fg/25 text-bad-fg rounded-xl p-4 text-sm">
      <span className="flex items-center gap-2.5">
        <AlertTriangle size={16} strokeWidth={1.75} className="shrink-0" />
        {message}
      </span>
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
