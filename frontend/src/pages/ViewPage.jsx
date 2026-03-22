import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProfiles, isAbortError } from '../services/api.js';
import ProfileCard from '../components/ProfileCard.jsx';
import HorizontalScroll from '../components/HorizontalScroll.jsx';
import AnimatedLoadingSkeleton from '../components/ui/AnimatedLoadingSkeleton.jsx';
import { TextRoll } from '../components/ui/TextRoll.jsx';

const TITLE_WORDS = ['Find', 'Your', 'Perfect', 'Match'];

// Per-word char offsets so delays flow as one continuous sentence
const WORD_OFFSETS = TITLE_WORDS.reduce((acc, _word, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + TITLE_WORDS[i - 1].length + 1);
  return acc;
}, []);

const RollingTitle = () => (
  <h1 className="text-2xl sm:text-4xl font-bold text-rose-700 mb-2 flex flex-wrap justify-center gap-x-[0.3em] gap-y-1">
    {TITLE_WORDS.map((word, wi) => (
      <span key={word} className="whitespace-nowrap">
        <TextRoll
          getEnterDelay={(i) => (WORD_OFFSETS[wi] + i) * 0.1}
          getExitDelay={(i) => (WORD_OFFSETS[wi] + i) * 0.1 + 0.2}
        >
          {word}
        </TextRoll>
      </span>
    ))}
  </h1>
);

// card width (w-72 = 288) + gap-4 (16) = 304px per slot
const CARD_SLOT = 304;
const BATCH = 4;
const initialVisible = () => Math.max(3, Math.ceil(Math.min(window.innerWidth, 1200) / CARD_SLOT) + 1);

export default function ViewPage() {
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allVisible, setAllVisible] = useState(initialVisible);
  const [likedVisible, setLikedVisible] = useState(initialVisible);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfiles(false, signal);
      if (!signal.aborted) setAllProfiles(data);
    } catch (err) {
      if (!isAbortError(err)) setError('Failed to load profiles. Please try again.');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Update local liked state after toggle without re-fetching
  const handleLikeToggle = useCallback((id, isLiked) => {
    setAllProfiles((prev) =>
      prev.map((p) => (p._id === id ? { ...p, isLiked } : p))
    );
  }, []);

  const likedProfiles = allProfiles.filter((p) => p.isLiked);

  const visibleAll   = allProfiles.slice(0, allVisible);
  const visibleLiked = likedProfiles.slice(0, likedVisible);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-10">
          <RollingTitle />
          <p className="text-gray-500">Browse verified profiles and connect with your soulmate</p>
        </div>
        <AnimatedLoadingSkeleton />
      </main>
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
        <RollingTitle />
        <p className="text-gray-500">Browse verified profiles and connect with your soulmate</p>
      </div>

      {/* ── Liked Profiles ── */}
      {likedProfiles.length > 0 && (
        <HorizontalScroll
          title="❤️ Liked Profiles"
          subtitle="Profiles you've shown interest in"
          count={likedProfiles.length}
          onScrollEnd={() => setLikedVisible((n) => Math.min(n + BATCH, likedProfiles.length))}
        >
          {visibleLiked.map((profile) => (
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
        onScrollEnd={() => setAllVisible((n) => Math.min(n + BATCH, allProfiles.length))}
      >
        {visibleAll.map((profile) => (
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
