import { useRef } from 'react';

export default function HorizontalScroll({ title, subtitle, count, children, emptyMessage = 'No profiles found.' }) {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 304, behavior: 'smooth' });
  };

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {title}
            {count !== undefined && (
              <span className="text-xs font-normal bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center text-lg leading-none transition"
            aria-label="Scroll left"
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center text-lg leading-none transition"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-3"
      >
        {count === 0 ? (
          <p className="text-gray-400 text-sm py-8 px-2">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
