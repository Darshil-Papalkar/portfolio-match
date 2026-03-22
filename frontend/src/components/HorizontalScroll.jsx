import { useRef } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function HorizontalScroll({ title, subtitle, count, children, emptyMessage = 'No profiles found.', onScrollEnd }) {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 304, behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    const el = e.currentTarget;
    // Fire when within one card-width (~304px) of the end
    if (onScrollEnd && el.scrollWidth - el.scrollLeft - el.clientWidth < 320) {
      onScrollEnd();
    }
  };

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2">
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
      <motion.div
        ref={ref}
        className="flex gap-4 overflow-x-auto scrollbar-hide py-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onScroll={handleScroll}
      >
        {count === 0 ? (
          <p className="text-gray-400 text-sm py-8 px-2">{emptyMessage}</p>
        ) : (
          children
        )}
      </motion.div>
    </section>
  );
}
