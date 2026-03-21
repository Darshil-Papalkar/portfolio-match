import { useState } from 'react';
import ImageCarousel from './ImageCarousel.jsx';
import { toggleLike } from '../services/api.js';

const Tag = ({ children }) => (
  <span className="bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full border border-rose-100">
    {children}
  </span>
);

export default function ProfileCard({ profile, onLikeToggle }) {
  const [liked, setLiked] = useState(profile.isLiked);
  const [busy, setBusy] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await toggleLike(profile._id);
      setLiked(res.isLiked);
      onLikeToggle?.(profile._id, res.isLiked);
    } catch {
      // silently fail
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-none w-72 bg-white rounded-2xl shadow-sm hover:shadow-md border border-rose-100/80 overflow-hidden transition-shadow duration-300">
      <ImageCarousel images={profile.images} />

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

        {/* About */}
        {profile.about && (
          <p className="text-xs text-gray-500 border-t border-rose-50 pt-2.5 line-clamp-3 leading-relaxed">
            {profile.about}
          </p>
        )}
      </div>
    </div>
  );
}
