import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const PLACEHOLDER = 'https://placehold.co/400x300/fce7f3/be123c?text=No+Photo';

/**
 * Stacked image deck for ProfileCard.
 * - Merges profile.images + profile.patrikaImage into one list
 * - On hover: front card scales down to reveal back cards fanning out
 * - Prev / next arrows + dot indicators to cycle through all images
 */
const StackedImageCards = ({ images = [], patrikaImage }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allImages = [...images, ...(patrikaImage ? [patrikaImage] : [])];
  const imgs = allImages.length > 0 ? allImages : [{ url: PLACEHOLDER }];
  const hasMultiple = imgs.length > 1;
  const touchStartX = useRef(null);

  const goPrev = () => setActiveIndex((i) => (i === 0 ? imgs.length - 1 : i - 1));
  const goNext = () => setActiveIndex((i) => (i === imgs.length - 1 ? 0 : i + 1));

  const prev = (e) => { e.stopPropagation(); goPrev(); };
  const next = (e) => { e.stopPropagation(); goNext(); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  const leftIdx  = (activeIndex - 1 + imgs.length) % imgs.length;
  const rightIdx = (activeIndex + 1) % imgs.length;

  const spring = { type: 'spring', damping: 20, stiffness: 220 };

  return (
    <div
      className="relative w-full h-56 rounded-t-2xl overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Back cards (only rendered when multiple images exist) ─────────────
          They rotate around their centre. When the front card scales down on
          hover, the corners/edges of these rotated cards become visible.       */}
      {hasMultiple && (
        <>
          {/* Left back card */}
          <motion.div
            className="absolute inset-0"
            style={{ zIndex: 1 }}
            animate={{ rotate: isHovering ? -9 : -3 }}
            transition={spring}
          >
            <img
              src={imgs[leftIdx].url}
              alt={`Photo ${leftIdx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
            />
          </motion.div>

          {/* Right back card */}
          <motion.div
            className="absolute inset-0"
            style={{ zIndex: 1 }}
            animate={{ rotate: isHovering ? 9 : 3 }}
            transition={spring}
          >
            <img
              src={imgs[rightIdx].url}
              alt={`Photo ${rightIdx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
            />
          </motion.div>
        </>
      )}

      {/* ── Front card (active image) ────────────────────────────────────────
          Scales down on hover so the back cards become visible around it.     */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        animate={{ scale: isHovering && hasMultiple ? 0.86 : 1 }}
        transition={spring}
      >
        <img
          src={imgs[activeIndex].url}
          alt={`Photo ${activeIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
      </motion.div>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      {hasMultiple && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition z-10"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition z-10"
            aria-label="Next photo"
          >
            ›
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                className={`rounded-full transition-all duration-200 ${
                  i === activeIndex
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50'
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Count badge — fades slightly on hover to not clash with fanned cards */}
      <motion.div
        className="absolute top-2 right-2 z-10 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none"
        animate={{ opacity: isHovering ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {activeIndex + 1}/{imgs.length}
      </motion.div>
    </div>
  );
};

export default StackedImageCards;
