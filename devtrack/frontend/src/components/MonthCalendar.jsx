import { buildMonthGrid, isToday } from '../utils/date';
import { dayStatus, DAY_STATUS_CLASSES } from '../utils/timeLogLayout';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Presentational month grid — no fetching, no router. Takes `dayTotals` as a
 * Map<'YYYY-MM-DD', number> rather than raw time logs so it stays independent
 * of the TimeLog shape and the Dashboard can feed it from anywhere.
 */
export function MonthCalendar({
  anchor,
  dayTotals,
  target,
  trackingStart,
  selectedDate,
  onSelectDate,
  loading = false,
}) {
  const cells = buildMonthGrid(anchor);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-xs font-medium text-gray-500 text-center py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ dateStr, date, inMonth }) => {
          const total = dayTotals.get(dateStr) ?? 0;
          const status = dayStatus(total, dateStr, target, trackingStart);
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate?.(dateStr)}
              title={`${dateStr} — ${total.toFixed(2)}h logged`}
              className={[
                'h-20 rounded p-2 text-left transition-colors',
                DAY_STATUS_CLASSES[status],
                loading ? 'animate-pulse' : '',
                inMonth ? '' : 'opacity-40',
                isToday(dateStr) ? 'ring-2 ring-blue-600 ring-inset' : '',
                selectedDate === dateStr ? 'ring-2 ring-blue-500' : '',
                'hover:brightness-95',
              ].join(' ')}
            >
              <div className="text-sm font-medium">{date.getDate()}</div>
              {total > 0 && (
                <div className="text-xs mt-1 opacity-80">{total.toFixed(2)}h</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
