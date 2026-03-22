import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageViewerModal({ imgs, index, onIndexChange, onClose }) {
  const touchStartX = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((i) => (i === imgs.length - 1 ? 0 : i + 1));
      if (e.key === 'ArrowLeft')  onIndexChange((i) => (i === 0 ? imgs.length - 1 : i - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [imgs.length, onClose, onIndexChange]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0
        ? onIndexChange((i) => (i === imgs.length - 1 ? 0 : i + 1))
        : onIndexChange((i) => (i === 0 ? imgs.length - 1 : i - 1));
    }
    touchStartX.current = null;
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="viewer-backdrop"
        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Shell */}
      <motion.div
        key="viewer-shell"
        className="fixed inset-0 z-[10001] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <motion.img
          key={index}
          src={imgs[index].url}
          alt=""
          className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl select-none"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />

        {/* Prev */}
        {imgs.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange((i) => (i === 0 ? imgs.length - 1 : i - 1)); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 border border-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center transition"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Next */}
        {imgs.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange((i) => (i === imgs.length - 1 ? 0 : i + 1)); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 border border-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center transition"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Close */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/25 border border-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center transition"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Counter */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          {/* Dot strip */}
          {imgs.length > 1 && (
            <div className="flex gap-1.5">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onIndexChange(() => i); }}
                  className={`rounded-full transition-all duration-200 pointer-events-auto ${
                    i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}
          <span className="text-white/60 text-xs">{index + 1} / {imgs.length}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
