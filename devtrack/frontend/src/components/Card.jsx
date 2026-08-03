import { MoreHorizontal } from 'lucide-react';

/**
 * The panel every section sits in — the single most repeated shape in the
 * reference. Centralised so card radius, border and padding can't drift
 * between pages.
 */
export function Card({ title, action, className = '', bodyClass = '', children }) {
  return (
    <section className={`bg-card border border-line rounded-xl ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action ?? (
            <MoreHorizontal size={16} className="text-fg-faint shrink-0" aria-hidden />
          )}
        </header>
      )}
      <div className={bodyClass || 'px-5 pb-5'}>{children}</div>
    </section>
  );
}

/**
 * Stat tile: icon chip, big number, label, optional delta.
 * No sparkline — the reference draws one, but we store no historical series
 * for these figures and inventing a curve would be inventing data.
 */
export function StatCard({ icon: Icon, label, value, delta, deltaTone = 'muted' }) {
  const tones = {
    up: 'text-ok-fg',
    warn: 'text-warn-fg',
    muted: 'text-fg-muted',
  };
  return (
    <div className="bg-card border border-line rounded-xl p-4">
      <div className="flex items-start gap-2.5 mb-3 min-h-[2rem]">
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-tile grid place-items-center shrink-0">
            <Icon size={15} strokeWidth={1.75} className="text-fg-muted" />
          </span>
        )}
        {/* Wraps rather than truncates: labels like "Requirements done this
            week" are longer than a narrow tile, and a clipped label is worse
            than a two-line one. */}
        <span className="text-xs text-fg-muted leading-snug pt-0.5">{label}</span>
      </div>
      <div className="text-[28px] leading-none font-semibold tabular-nums">{value}</div>
      {delta && <div className={`text-xs mt-2 ${tones[deltaTone]}`}>{delta}</div>}
    </div>
  );
}
