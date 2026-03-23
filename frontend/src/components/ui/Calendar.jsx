import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';

/**
 * Calendar built on react-day-picker v9, rose theme.
 * Modifier classes (day-sel, day-tod, day-out, day-dis) are targeted
 * by CSS rules in index.css to style the inner .cal-btn button.
 */
export function Calendar({ className, selected, onSelect, disabled, captionLayout = 'dropdown', fromYear = 1920, toYear = new Date().getFullYear(), ...props }) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      captionLayout={captionLayout}
      fromYear={fromYear}
      toYear={toYear}
      classNames={{
        root: 'p-3 select-none',
        months: 'flex flex-col',
        month: 'w-full',
        month_caption: 'relative flex items-center justify-center h-10 mb-1',
        caption_label: 'text-sm font-semibold text-gray-800',
        /* dropdown caption layout */
        dropdowns: 'flex items-center justify-center gap-1.5 h-10',
        dropdown_root: [
          'relative flex items-center border border-gray-200 rounded-lg px-2.5 h-8',
          'hover:border-rose-300 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/30 transition-colors',
        ].join(' '),
        dropdown: 'absolute inset-0 opacity-0 cursor-pointer w-full',
        /* nav */
        nav: 'absolute inset-x-0 top-0 flex justify-between items-center h-10 pointer-events-none',
        button_previous: [
          'pointer-events-auto w-8 h-8 flex items-center justify-center rounded-lg',
          'text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors',
        ].join(' '),
        button_next: [
          'pointer-events-auto w-8 h-8 flex items-center justify-center rounded-lg',
          'text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors',
        ].join(' '),
        /* grid */
        month_grid: 'w-full border-collapse mt-1',
        weekdays: 'flex',
        weekday: 'w-9 h-8 flex items-center justify-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide',
        weeks: '',
        week: 'flex mt-0.5',
        day: 'relative w-9 h-9 flex items-center justify-center p-0',
        day_button: [
          'cal-btn w-9 h-9 flex items-center justify-center rounded-lg text-sm text-gray-700',
          'hover:bg-rose-50 hover:text-rose-600 transition-colors',
          'outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-1',
        ].join(' '),
      }}
      modifiersClassNames={{
        selected: 'day-sel',
        today:    'day-tod',
        outside:  'day-out',
        disabled: 'day-dis',
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left')  return <ChevronLeft  size={15} aria-hidden />;
          if (orientation === 'right') return <ChevronRight size={15} aria-hidden />;
          return <ChevronsUpDown size={13} aria-hidden />;
        },
      }}
      {...props}
    />
  );
}
