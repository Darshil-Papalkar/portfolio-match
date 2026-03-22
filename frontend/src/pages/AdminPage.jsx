import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProfiles, deleteProfile, toggleLike, isAbortError } from '../services/api.js';
import ProfileForm from '../components/admin/ProfileForm.jsx';

const fmt = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

export default function AdminPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProfile, setEditProfile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [likingId, setLikingId] = useState(null);
  const [search, setSearch] = useState('');
  const fetchAbortRef = useRef(null);
  const mutationAbortRef = useRef(null);

  const loadProfiles = useCallback(async () => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();
    const { signal } = fetchAbortRef.current;
    setLoading(true);
    try {
      const data = await fetchProfiles(false, signal);
      if (!signal.aborted) setProfiles(data);
    } catch (err) {
      if (!isAbortError(err) && !signal.aborted) {
        // swallow silently — admin page shows stale data on error
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    return () => {
      fetchAbortRef.current?.abort();
      mutationAbortRef.current?.abort();
    };
  }, [loadProfiles]);

  const openAdd = () => { setEditProfile(null); setShowForm(true); };
  const openEdit = (p) => { setEditProfile(p); setShowForm(true); };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? All their photos will also be removed from S3.`)) return;
    mutationAbortRef.current?.abort();
    mutationAbortRef.current = new AbortController();
    const { signal } = mutationAbortRef.current;
    setDeletingId(p._id);
    try {
      await deleteProfile(p._id, signal);
      if (!signal.aborted) setProfiles((prev) => prev.filter((x) => x._id !== p._id));
    } catch (err) {
      if (!isAbortError(err)) alert('Delete failed. Please try again.');
    } finally {
      if (!signal.aborted) setDeletingId(null);
    }
  };

  const handleToggleLike = async (p) => {
    if (likingId === p._id) return;
    mutationAbortRef.current?.abort();
    mutationAbortRef.current = new AbortController();
    const { signal } = mutationAbortRef.current;
    setLikingId(p._id);
    try {
      const { isLiked } = await toggleLike(p._id, signal);
      if (!signal.aborted) setProfiles((prev) => prev.map((x) => x._id === p._id ? { ...x, isLiked } : x));
    } catch (err) {
      if (!isAbortError(err)) alert('Failed to update like status.');
    } finally {
      if (!signal.aborted) setLikingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditProfile(null);
    loadProfiles();
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.occupation || '').toLowerCase().includes(q)
    );
  });

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage matrimonial profiles</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Add Profile
          </button>
        )}
      </div>

      {/* ── Form panel ── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-md border border-rose-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            {editProfile ? `Editing — ${editProfile.name}` : 'New Profile'}
          </h2>
          <ProfileForm
            profile={editProfile}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditProfile(null); }}
          />
        </div>
      )}

      {/* ── Profiles table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mr-3" />
          Loading…
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">💍</p>
          <p className="font-medium">No profiles yet.</p>
          <p className="text-sm mt-1">Click "Add Profile" to get started.</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, location, occupation…"
              className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <thead className="bg-rose-50 border-b border-rose-100 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-600 font-semibold">Profile</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Details</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Photos</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Liked</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Updated</th>
                  <th className="text-right px-5 py-3 text-gray-600 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-rose-50/30 transition-colors">
                    {/* Profile */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-rose-400 text-lg">👤</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.age} yrs &bull; {p.gender}</p>
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700 truncate max-w-[160px]">{p.occupation || <span className="text-gray-300">—</span>}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{p.location || '—'}</p>
                    </td>

                    {/* Photos */}
                    <td className="px-4 py-3">
                      <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                        {p.images?.length ?? 0} photos
                      </span>
                    </td>

                    {/* Liked */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleLike(p)}
                        disabled={likingId === p._id}
                        className={`text-xl transition-transform hover:scale-125 active:scale-95 disabled:opacity-40 leading-none ${p.isLiked ? 'text-rose-500' : 'text-gray-300'}`}
                        title={p.isLiked ? 'Click to unlike' : 'Click to like'}
                      >
                        {p.isLiked ? '♥' : '♡'}
                      </button>
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmt(p.updatedAt)}</td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p._id}
                          className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition disabled:opacity-40"
                        >
                          {deletingId === p._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {filtered.length === 0 && (
              <p className="text-center py-8 text-gray-400 text-sm">No profiles match your search.</p>
            )}
          </div>

          <p className="text-right text-xs text-gray-400 mt-2">
            {filtered.length} of {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </main>
  );
}
