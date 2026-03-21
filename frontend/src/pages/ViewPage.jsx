import { useState, useEffect, useCallback } from 'react';
import { fetchProfiles } from '../services/api.js';
import ProfileCard from '../components/ProfileCard.jsx';
import HorizontalScroll from '../components/HorizontalScroll.jsx';

export default function ViewPage() {
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfiles(false);
      setAllProfiles(data);
    } catch {
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Update local liked state after toggle without re-fetching
  const handleLikeToggle = useCallback((id, isLiked) => {
    setAllProfiles((prev) =>
      prev.map((p) => (p._id === id ? { ...p, isLiked } : p))
    );
  }, []);

  const likedProfiles = allProfiles.filter((p) => p.isLiked);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-rose-600">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading profiles…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={load}
          className="px-5 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero banner */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-rose-700 mb-2">Find Your Perfect Match</h1>
        <p className="text-gray-500">Browse verified profiles and connect with your soulmate</p>
      </div>

      {/* ── Liked Profiles ── */}
      {likedProfiles.length > 0 && (
        <HorizontalScroll
          title="❤️ Liked Profiles"
          subtitle="Profiles you've shown interest in"
          count={likedProfiles.length}
        >
          {likedProfiles.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </HorizontalScroll>
      )}

      {/* ── All Profiles ── */}
      <HorizontalScroll
        title="✨ All Profiles"
        subtitle="Sorted by latest activity"
        count={allProfiles.length}
        emptyMessage="No profiles yet. Check back soon!"
      >
        {allProfiles.map((profile) => (
          <ProfileCard
            key={profile._id}
            profile={profile}
            onLikeToggle={handleLikeToggle}
          />
        ))}
      </HorizontalScroll>
    </main>
  );
}
