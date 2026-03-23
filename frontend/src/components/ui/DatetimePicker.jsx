import { forwardRef, useCallback, useImperativeHandle, useRef, Fragment } from 'react';
import { useTimescape } from 'timescape/react';
import { Input } from './Input.jsx';

// Utility: merge class strings and conditional objects
function cn(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') { out.push(arg); continue; }
    if (typeof arg === 'object') {
      for (const [k, v] of Object.entries(arg)) {
        if (v) out.push(k);
      }
    }
  }
  return out.join(' ');
}

// min-w-* removed — inputs use flex-1 inside their group
const inputBase = [
  'p-1 inline tabular-nums h-fit border-none outline-none select-none',
  'content-box caret-transparent rounded-sm text-center text-sm',
  'focus:bg-rose-50 focus-visible:ring-0 focus-visible:outline-none',
].join(' ');

const sepBase = 'text-xs text-gray-400 shrink-0';

const DEFAULTS = [
  ['months', 'days', 'years'],
  ['hours', 'minutes', 'am/pm'],
];

const INPUT_PLACEHOLDERS = {
  months: 'MM',
  days: 'DD',
  years: 'YYYY',
  hours: 'HH',
  minutes: 'MM',
  seconds: 'SS',
  'am/pm': 'AM',
};

// ── inner grid ──────────────────────────────────────────────────────────────
const DatetimeGrid = forwardRef(({ format, className, timescape, placeholders }, ref) => {
  return (
    <div
      className={cn(
        'flex items-center w-full p-1 border-2 rounded-lg gap-1',
        'border-gray-200 hover:border-rose-300 transition-colors',
        'focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/30',
        'selection:bg-transparent selection:text-gray-800',
        className,
      )}
      {...timescape.getRootProps()}
      ref={ref}
    >
      {format?.length
        ? format.map((group, i) => (
            <Fragment key={i === 0 ? 'dates' : 'times'}>
              {/* Each group gets flex-1 so date half and time half share width equally */}
              <div className="flex flex-1 items-center gap-1">
                {group?.length
                  ? group.map((unit, j) => (
                      <Fragment key={unit}>
                        <Input
                          className={cn(inputBase, 'flex-1', {
                            'bg-rose-50 text-rose-600 font-medium': unit === 'am/pm',
                          })}
                          {...timescape.getInputProps(unit)}
                          placeholder={placeholders[unit]}
                        />
                        {i === 0 && j < group.length - 1 ? (
                          <span className={sepBase}>/</span>
                        ) : (
                          j < group.length - 2 && (
                            <span className={sepBase}>:</span>
                          )
                        )}
                      </Fragment>
                    ))
                  : null}
              </div>
              {/* Divider between date and time groups */}
              {format[1]?.length && !i ? (
                <span className="text-gray-300 text-xl px-0.5 shrink-0">|</span>
              ) : null}
            </Fragment>
          ))
        : null}
    </div>
  );
});

DatetimeGrid.displayName = 'DatetimeGrid';

// ── public component ─────────────────────────────────────────────────────────
export const DatetimePicker = forwardRef(
  ({ value, format = DEFAULTS, placeholders, dtOptions, onChange, className }, ref) => {
    const handleDateChange = useCallback(
      (nextDate) => {
        onChange?.(nextDate);
      },
      [onChange],
    );

    const timescape = useTimescape({
      hour12: true,
      ...dtOptions,
      ...(value ? { date: value } : {}),
      onChangeDate: handleDateChange,
    });

    // Keep a ref that always points to the latest timescape instance so
    // getDate() returns the live value even between re-renders.
    const tsRef = useRef(timescape);
    tsRef.current = timescape;

    // Expose getDate() to parent refs so they can read the current date
    // at submit time without relying on onChangeDate state updates.
    useImperativeHandle(ref, () => ({
      getDate: () => tsRef.current.date,
    }), []);

    return (
      <DatetimeGrid
        format={format}
        className={className}
        timescape={timescape}
        placeholders={placeholders ?? INPUT_PLACEHOLDERS}
      />
    );
  },
);

DatetimePicker.displayName = 'DatetimePicker';
