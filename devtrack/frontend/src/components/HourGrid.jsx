import { useMemo, useRef, useEffect } from 'react';
import { isToday, minutesToTimeStr } from '../utils/date';
import { dayStatus, DAY_STATUS_CLASSES, groupByDate, layoutEntries, gridWindow } from '../utils/timeLogLayout';

const HOUR_PX = 48;

/**
 * Vertical hour grid for N days — Day view passes 1 day, Week view passes 7.
 * Presentational: it positions blocks and reports clicks, nothing else.
 */
export function HourGrid({
  days,
  entries,
  target,
  trackingStart,
  onSelectSlot,
  onSelectEntry,
}) {
  const scrollRef = useRef(null);
  const byDate = useMemo(() => groupByDate(entries), [entries]);
  // Window derives from the data so an entry at 03:00 expands the grid rather
  // than being clipped out of sight.
  const { startHour, endHour } = useMemo(() => gridWindow(entries), [entries]);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const gridStartMin = startHour * 60;
  const bodyHeight = (endHour - startHour) * HOUR_PX;

  // Land on the working day rather than at whatever hour the window starts.
  // The 10px headroom keeps the topmost hour label from being clipped in half
  // by the scroll edge (labels are centred on their line via -translate-y-1/2).
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (8 - startHour) * HOUR_PX - 10);
    }
  }, [startHour]);

  function handleSlotClick(e, dateStr, hour) {
    // offsetY is relative to the hour cell that was clicked, not the column,
    // so it only tells us which HALF of that hour — the hour itself has to
    // come from the cell we bound the handler to.
    const halfHour = e.nativeEvent.offsetY >= HOUR_PX / 2 ? 30 : 0;
    onSelectSlot?.(dateStr, minutesToTimeStr(hour * 60 + halfHour));
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= gridStartMin && nowMinutes <= endHour * 60;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Day headers, tinted by the same rule the month cells use — this is
          what makes Day/Week/Month read as one system. */}
      <div className="flex border-b border-gray-200 bg-white">
        <div className="w-14 shrink-0" />
        {days.map(({ dateStr, date }) => {
          const dayEntries = byDate.get(dateStr) ?? [];
          const total = dayEntries.reduce((sum, e) => sum + Number(e.hours), 0);
          const status = dayStatus(total, dateStr, target, trackingStart);
          return (
            <div
              key={dateStr}
              className={`flex-1 text-center py-2 border-l border-gray-100 ${DAY_STATUS_CLASSES[status]}`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div
                className={`text-sm font-semibold ${
                  isToday(dateStr) ? 'underline underline-offset-4' : ''
                }`}
              >
                {date.getDate()}
              </div>
              <div className="text-xs opacity-80">{total.toFixed(2)}h</div>
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="overflow-y-auto max-h-[60vh]">
        <div className="flex" style={{ height: bodyHeight }}>
          <div className="w-14 shrink-0 relative">
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute right-2 text-xs text-gray-400 -translate-y-1/2"
                style={{ top: i * HOUR_PX }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {days.map(({ dateStr }) => {
            const dayEntries = byDate.get(dateStr) ?? [];
            const blocks = layoutEntries(dayEntries, gridStartMin, HOUR_PX);
            return (
              <div key={dateStr} className="flex-1 relative border-l border-gray-100">
                {/* Hour lines double as click targets — no separate hit layer. */}
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-100 hover:bg-blue-50/40 cursor-pointer"
                    style={{ top: i * HOUR_PX, height: HOUR_PX }}
                    onClick={(e) => handleSlotClick(e, dateStr, h)}
                  />
                ))}

                {showNowLine && isToday(dateStr) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                    style={{ top: ((nowMinutes - gridStartMin) / 60) * HOUR_PX }}
                  />
                )}

                {blocks.map(({ entry, top, height, leftPct, widthPct }) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectEntry?.(entry)}
                    title={`${entry.start_time.slice(0, 5)}–${entry.end_time.slice(0, 5)} · ${Number(entry.hours).toFixed(2)} h logged`}
                    className="absolute z-10 rounded bg-blue-100 border border-blue-300 text-blue-900 text-xs px-1.5 py-1 overflow-hidden text-left hover:bg-blue-200"
                    style={{
                      top,
                      height,
                      left: `${leftPct}%`,
                      width: `calc(${widthPct}% - 4px)`,
                    }}
                  >
                    <div className="font-medium truncate">
                      {entry.project_name ?? 'Deleted project'}
                    </div>
                    {/* hours is shown explicitly because it is deliberately
                        independent of the block's visual span. */}
                    <div className="opacity-75 truncate">
                      {Number(entry.hours).toFixed(2)} h
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
