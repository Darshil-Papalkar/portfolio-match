import { useState, useRef, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './Calendar.jsx';

/**
 * A date picker field: a styled button that opens a Calendar popover.
 * Fires `onChange({ target: { name, value: 'YYYY-MM-DD' } })` to match
 * the existing form onChange pattern.
 */
export function DatePicker({ name, value, onChange, maxDate, placeholder = 'Pick a date', className = '' }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Parse stored YYYY-MM-DD string → Date (avoid timezone shift)
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  // Cap at maxDate (today by default)
  const disabledDays = maxDate
    ? { after: new Date(`${maxDate}T23:59:59`) }
    : undefined;

  const handleSelect = (date) => {
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onChange({ target: { name, value: `${y}-${m}-${d}` } });
    }
    setOpen(false);
  };

  // Human-readable display
  const display = selected
    ? selected.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between',
          'bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400',
          open
            ? 'border-rose-400 ring-2 ring-rose-400/30'
            : 'border-gray-200 hover:border-rose-300',
        ].join(' ')}
      >
        <span className={display ? 'text-gray-800' : 'text-gray-400'}>
          {display || placeholder}
        </span>
        <CalendarIcon size={14} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {/* Calendar popover */}
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-rose-100 rounded-2xl shadow-xl shadow-rose-100/60">
          <Calendar
            selected={selected}
            onSelect={handleSelect}
            disabled={disabledDays}
            toYear={new Date().getFullYear()}
          />
        </div>
      )}
    </div>
  );
}
