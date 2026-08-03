const VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-hover px-4 py-2 rounded-lg text-sm font-medium ' +
    'disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-tile border border-line-strong text-fg-muted hover:text-fg hover:bg-card-hover ' +
    'px-4 py-2 rounded-lg text-sm font-medium',
  danger:
    'bg-bad-bg border border-bad-fg/25 text-bad-fg hover:border-bad-fg/50 ' +
    'px-4 py-2 rounded-lg text-sm font-medium',
  ghost:
    'text-fg-muted hover:text-fg hover:bg-card-hover px-3 py-1.5 rounded-lg text-sm',
};

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button className={`${VARIANTS[variant]} transition-colors ${className}`} {...props} />
  );
}
