import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="text-center py-16 border border-dashed border-line rounded-xl bg-card/40">
      <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-tile mb-4">
        <Inbox size={19} strokeWidth={1.75} className="text-fg-faint" />
      </span>
      <p className="mb-4 text-sm text-fg-muted">{message}</p>
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
