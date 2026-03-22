import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ImageCarousel from './ImageCarousel.jsx';
import StackedImageCards from './ui/StackedImageCards.jsx';
import ProfileDetailDialog from './ProfileDetailDialog.jsx';
import { toggleLike } from '../services/api.js';
import { MousePointerClick } from 'lucide-react';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const Tag = ({ children }) => (
  <span className="bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full border border-rose-100">
    {children}
  </span>
);

export default function ProfileCard({ profile, onLikeToggle }) {
  const [liked, setLiked] = useState(profile.isLiked);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (busy) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    setBusy(true);
    try {
      const res = await toggleLike(profile._id, signal);
      if (!signal.aborted) {
        setLiked(res.isLiked);
        onLikeToggle?.(profile._id, res.isLiked);
      }
    } catch {
      // silently fail (including aborts)
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  };

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}
        className="flex-none w-72 bg-white rounded-2xl shadow-sm hover:shadow-md border border-rose-100/80 transition-shadow duration-300 cursor-pointer"
        onClick={() => setDialogOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Image section with hover overlay ───────────────────── */}
        <div className="relative overflow-hidden rounded-t-2xl">
          <motion.div
            animate={{ scale: hovered ? 1.04 : 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {profile.images?.length > 1 || profile.patrikaImage
              ? <StackedImageCards images={profile.images} patrikaImage={profile.patrikaImage} />
              : <ImageCarousel images={profile.images} />
            }
          </motion.div>

          {/* "Click to view" overlay — pointer-events-none so image nav still works */}
          <motion.div
            className="absolute inset-0 rounded-t-2xl bg-rose-950/50 flex items-center justify-center pointer-events-none"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-white text-xs font-semibold tracking-wide bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              Click to view details
            </span>
          </motion.div>

          {/* 5-second gliding cursor hint */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Cursor glides across the card in a natural arc */}
                <motion.div
                  animate={{ x: [-12, 20, 8, -16, 0], y: [8, -10, -22, -6, 0] }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                >
                  {/* Click ripple burst — fires twice */}
                  <motion.div
                    className="absolute -inset-5 rounded-full bg-white/25"
                    animate={{ scale: [0, 1.8, 0], opacity: [0, 0.65, 0] }}
                    transition={{ duration: 0.45, delay: 1.2, repeat: 2, repeatDelay: 1.15, ease: 'easeOut' }}
                  />
                  {/* Cursor icon presses on each click */}
                  <motion.div
                    animate={{ scale: [1, 0.78, 1, 0.78, 1] }}
                    transition={{ duration: 4, times: [0, 0.31, 0.41, 0.70, 0.80] }}
                  >
                    <MousePointerClick
                      size={26}
                      strokeWidth={1.75}
                      className="text-white"
                      style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.85))' }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-gray-800 leading-tight">{profile.name}</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {profile.age} yrs &bull; {profile.gender}
                {profile.height && ` · ${profile.height}`}
              </p>
            </div>
            <button
              onClick={handleLike}
              disabled={busy}
              className={`text-2xl transition-all duration-150 hover:scale-125 active:scale-95 leading-none ${
                liked ? 'text-rose-600 drop-shadow-sm' : 'text-gray-300'
              }`}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              {liked ? '♥' : '♡'}
            </button>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-1.5">
            {profile.location   && <Tag>📍 {profile.location}</Tag>}
            {profile.religion   && <Tag>🙏 {profile.religion}{profile.caste ? ` · ${profile.caste}` : ''}</Tag>}
            {profile.education  && <Tag>🎓 {profile.education}</Tag>}
            {profile.occupation && <Tag>💼 {profile.occupation}</Tag>}
          </div>

          {/* View details CTA */}
          <button
            onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
            className="w-full mt-1 py-2 rounded-xl text-xs font-semibold tracking-wide text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-400 transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </motion.div>

      {/* ── Detail dialog ─────────────────────────────────────────── */}
      <AnimatePresence>
        {dialogOpen && (
          <ProfileDetailDialog
            profile={profile}
            onClose={() => setDialogOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
