import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import ImageViewerModal from './ui/ImageViewerModal.jsx';

const PLACEHOLDER = 'https://placehold.co/400x560/fce7f3/be123c?text=No+Photo';

const ease = [0.22, 1, 0.36, 1];

/** One labelled detail row in the info panel */
const DetailRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-rose-400 w-20 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-600 leading-snug">{value}</span>
    </div>
  );
};

export default function ProfileDetailDialog({ profile, onClose }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showImgHint, setShowImgHint] = useState(true);
  const touchStartX = useRef(null);

  /* Merge profile images + patrika image */
  const allImages = [
    ...(profile.images || []),
    ...(profile.patrikaImage ? [profile.patrikaImage] : []),
  ];
  const imgs = allImages.length > 0 ? allImages : [{ url: PLACEHOLDER }];

  /* Split name for editorial two-line display */
  const nameParts  = profile.name.trim().split(' ');
  const firstName  = nameParts[0];
  const restOfName = nameParts.slice(1).join(' ');

  /* Keyboard + scroll-lock + img hint timeout */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const hintTimer = setTimeout(() => setShowImgHint(false), 4000);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(hintTimer);
    };
  }, [onClose]);

  const goPrev = () => setImgIndex((i) => (i === 0 ? imgs.length - 1 : i - 1));
  const goNext = () => setImgIndex((i) => (i === imgs.length - 1 ? 0 : i + 1));

  const prevImg = (e) => { e.stopPropagation(); goPrev(); };
  const nextImg = (e) => { e.stopPropagation(); goNext(); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  return (
    <AnimatePresence>
      {/* ── Backdrop ────────────────────────────────────────────── */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      {/* ── Dialog shell ────────────────────────────────────────── */}
      <motion.div
        key="dialog"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.article
          className="relative flex flex-col md:flex-row w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden"
          style={{ maxHeight: '90vh' }}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ duration: 0.4, ease }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ══ LEFT — portrait / image carousel ══════════════════ */}
          <div
            className="relative w-full h-64 sm:h-72 shrink-0 bg-rose-50 overflow-hidden md:w-72 md:h-auto md:min-h-[480px] md:self-stretch"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <motion.img
              key={imgIndex}
              src={imgs[imgIndex].url}
              alt={profile.name}
              className="w-full h-full object-cover cursor-zoom-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
              onClick={(e) => { e.stopPropagation(); setViewerOpen(true); }}
            />

            {/* gradient polish */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

            {imgs.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition"
                  aria-label="Previous photo"
                >‹</button>
                <button
                  onClick={nextImg}
                  className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition z-20"
                  aria-label="Next photo"
                >›</button>

                {/* dot strip */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imgs.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                      className={`rounded-full transition-all duration-200 ${
                        i === imgIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                      }`}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-3 left-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
              {imgIndex + 1}/{imgs.length}
            </div>

            {/* 4-second zoom hint */}
            <AnimatePresence>
              {showImgHint && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    animate={{ scale: [1, 1.08, 1, 1.08, 1] }}
                    transition={{ duration: 3, times: [0, 0.25, 0.5, 0.75, 1] }}
                  >
                    <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 shadow-lg">
                      <ZoomIn size={22} className="text-white" />
                    </div>
                    <span className="text-white text-[11px] font-semibold bg-black/45 px-3 py-1 rounded-full tracking-wide">
                      Tap to expand
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══ RIGHT — editorial info block ═══════════════════════
               On md+: overlaps the image edge by 24px for editorial
               layering. On mobile: stacks below the image.           */}
          <motion.div
            className="relative flex-1 bg-white md:overflow-y-auto md:-ml-6 md:rounded-l-3xl md:shadow-[-12px_0_32px_rgba(0,0,0,0.06)] md:z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
          >
            <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-4 md:gap-6 min-h-full">

              {/* Role / occupation label */}
              <motion.p
                className="text-[10px] font-semibold tracking-[0.3em] uppercase text-rose-400"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                {profile.occupation || 'Profile'}
              </motion.p>

              {/* Editorial name — first name light, surname normal */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.3 }}
              >
                <p className="text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight text-gray-900 font-extralight">
                  {firstName}
                  {restOfName && (
                    <>
                      <br />
                      <span className="font-normal">{restOfName}</span>
                    </>
                  )}
                </p>
              </motion.div>

              {/* Detail grid */}
              <motion.div
                className="flex flex-col gap-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <DetailRow label="Age"       value={profile.age ? `${profile.age} yrs` : null} />
                <DetailRow label="Gender"    value={profile.gender} />
                <DetailRow label="Height"    value={profile.height} />
                <DetailRow
                  label="Religion"
                  value={profile.religion
                    ? `${profile.religion}${profile.caste ? ` · ${profile.caste}` : ''}`
                    : null}
                />
                <DetailRow label="Education"  value={profile.education} />
                <DetailRow label="Location"   value={profile.location} />
                <DetailRow label="Born"        value={profile.dateOfBirth} />
                <DetailRow label="Birth Time"  value={profile.timeOfBirth} />
                <DetailRow label="Birth Place" value={profile.birthLocation} />
              </motion.div>

              {/* Bio */}
              {profile.about && (
                <motion.div
                  className="border-t border-rose-100/80 pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <p className="text-sm leading-[1.85] text-gray-500">{profile.about}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ── Close button ──────────────────────────────────────── */}
          <motion.button
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-rose-50 border border-rose-100/80 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors shadow-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            aria-label="Close"
          >
            <X size={15} />
          </motion.button>

        </motion.article>
      </motion.div>

      {viewerOpen && (
        <ImageViewerModal
          imgs={imgs}
          index={imgIndex}
          onIndexChange={setImgIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}
