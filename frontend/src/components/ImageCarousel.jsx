import { useState } from 'react';

const PLACEHOLDER = 'https://placehold.co/400x300/fce7f3/be123c?text=No+Photo';

export default function ImageCarousel({ images = [] }) {
  const [current, setCurrent] = useState(0);
  const imgs = images.length > 0 ? images : [{ url: PLACEHOLDER, key: '__placeholder__' }];

  const prev = (e) => {
    e.stopPropagation();
    setCurrent((c) => (c === 0 ? imgs.length - 1 : c - 1));
  };

  const next = (e) => {
    e.stopPropagation();
    setCurrent((c) => (c === imgs.length - 1 ? 0 : c + 1));
  };

  return (
    <div className="relative w-full h-56 bg-rose-50 overflow-hidden rounded-t-2xl select-none">
      <img
        src={imgs[current].url}
        alt={`Photo ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
      />

      {imgs.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition"
            aria-label="Next photo"
          >
            ›
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Count badge */}
      <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
        {current + 1}/{imgs.length}
      </div>
    </div>
  );
}
