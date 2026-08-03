import { Button } from './Button';

export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="text-center py-16 text-gray-500">
      <p className="mb-4">{message}</p>
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
