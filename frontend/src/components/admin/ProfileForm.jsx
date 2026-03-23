import { useState, useEffect, useRef } from 'react';
import { createProfile, updateProfile, deleteImage, uploadPatrika, deletePatrika, isAbortError } from '../../services/api.js';
import LumaSpin from '../ui/LumaSpin.jsx';
import { DatetimePicker } from '../ui/DatetimePicker.jsx';

const TEXT_FIELDS = [
  { name: 'name',       label: 'Full Name',  type: 'text',   required: true,  span: 2 },
  { name: 'age',        label: 'Age',        type: 'number', required: true },
  { name: 'gender',     label: 'Gender',     type: 'select', required: true,
    options: ['Male', 'Female', 'Other'] },
  { name: 'religion',   label: 'Religion',   type: 'text' },
  { name: 'caste',      label: 'Caste',      type: 'text' },
  { name: 'education',  label: 'Education',  type: 'text' },
  { name: 'occupation', label: 'Occupation', type: 'text' },
  { name: 'location',   label: 'Location',   type: 'text' },
];

const FEET_OPTIONS = ['4', '5', '6', '7'];
const INCH_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

// Parse "5'6\"" → { heightFt: '5', heightIn: '6' }
const parseHeight = (h) => {
  if (!h) return { heightFt: '5', heightIn: '0' };
  const m = h.match(/(\d+)[^\d]+(\d+)/);
  return m ? { heightFt: m[1], heightIn: m[2] } : { heightFt: '5', heightIn: '0' };
};

// Build a Date from stored "YYYY-MM-DD" + "HH:MM:SS AM" strings
const buildBirthDateTime = (dob, tob) => {
  if (!dob) return null;
  const base = new Date(`${dob}T00:00:00`);
  if (tob) {
    const [timePart, ampm] = tob.split(' ');
    let [h, m, s] = (timePart || '').split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    base.setHours(h, m || 0, s || 0, 0);
  }
  return base;
};

const EMPTY = {
  name: '', age: '', gender: 'Male',
  religion: '', caste: '', education: '',
  occupation: '', location: '', heightFt: '5', heightIn: '0', about: '',
  birthLocation: '',
};

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white';

export default function ProfileForm({ profile, onSuccess, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [existingImages, setExistingImages] = useState([]);
  // Each pending upload: { id, file, preview }
  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingPatrika, setExistingPatrika] = useState(null);
  const [pendingPatrika, setPendingPatrika] = useState(null); // { file, preview }
  const [deletingPatrika, setDeletingPatrika] = useState(false);
  const [birthDateTime, setBirthDateTime] = useState(
    () => profile ? buildBirthDateTime(profile.dateOfBirth, profile.timeOfBirth) : null
  );
  const birthPickerRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [error, setError] = useState(null);
  const submitAbortRef = useRef(null);
  const deleteAbortRef = useRef(null);

  const isEdit = !!profile;

  useEffect(() => {
    return () => {
      submitAbortRef.current?.abort();
      deleteAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (profile) {
      const { name, age, gender, religion, caste, education, occupation, location, height, about, dateOfBirth, timeOfBirth, birthLocation, images, patrikaImage } = profile;
      const { heightFt, heightIn } = parseHeight(height);
      setForm({ name, age: String(age), gender, religion: religion || '', caste: caste || '', education: education || '', occupation: occupation || '', location: location || '', heightFt, heightIn, about: about || '', birthLocation: birthLocation || '' });
      setBirthDateTime(buildBirthDateTime(dateOfBirth, timeOfBirth));
      setExistingImages(images || []);
      setExistingPatrika(patrikaImage || null);
    } else {
      setForm(EMPTY);
      setBirthDateTime(null);
      setExistingImages([]);
      setExistingPatrika(null);
    }
    setPendingFiles([]);
    setPendingPatrika(null);
  }, [profile]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onFileChange = (e) => {
    const added = Array.from(e.target.files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...added]);
    // Reset input so the same file can be re-added after removal
    e.target.value = '';
  };

  const removePending = (id) => {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const onPatrikaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (pendingPatrika) URL.revokeObjectURL(pendingPatrika.preview);
    setPendingPatrika({ file, preview: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const removePendingPatrika = () => {
    if (pendingPatrika) URL.revokeObjectURL(pendingPatrika.preview);
    setPendingPatrika(null);
  };

  const handleDeleteExistingPatrika = async () => {
    if (!window.confirm('Remove the patrika image?')) return;
    deleteAbortRef.current?.abort();
    deleteAbortRef.current = new AbortController();
    const { signal } = deleteAbortRef.current;
    setDeletingPatrika(true);
    try {
      await deletePatrika(profile._id, signal);
      if (!signal.aborted) setExistingPatrika(null);
    } catch (err) {
      if (!isAbortError(err)) alert('Failed to remove patrika. Try again.');
    } finally {
      if (!signal.aborted) setDeletingPatrika(false);
    }
  };

  const handleDeleteExisting = async (key) => {
    if (!window.confirm('Remove this photo?')) return;
    deleteAbortRef.current?.abort();
    deleteAbortRef.current = new AbortController();
    const { signal } = deleteAbortRef.current;
    setDeletingKey(key);
    try {
      await deleteImage(profile._id, key, signal);
      if (!signal.aborted) setExistingImages((prev) => prev.filter((img) => img.key !== key));
    } catch (err) {
      if (!isAbortError(err)) alert('Failed to remove photo. Try again.');
    } finally {
      if (!signal.aborted) setDeletingKey(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    submitAbortRef.current?.abort();
    submitAbortRef.current = new AbortController();
    const { signal } = submitAbortRef.current;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      const { heightFt, heightIn, ...rest } = form;
      Object.entries(rest).forEach(([k, v]) => fd.append(k, v));
      fd.append('height', `${heightFt}'${heightIn}"`);
      // Prefer the live picker value; fall back to birthDateTime state (edit pre-fill)
      const bd = birthPickerRef.current?.getDate() ?? birthDateTime;
      if (bd && !isNaN(bd)) {
        const y  = bd.getFullYear();
        const mo = String(bd.getMonth() + 1).padStart(2, '0');
        const dy = String(bd.getDate()).padStart(2, '0');
        fd.append('dateOfBirth', `${y}-${mo}-${dy}`);
        let h    = bd.getHours();
        const ap = h >= 12 ? 'PM' : 'AM';
        h        = h % 12 || 12;
        const mi = String(bd.getMinutes()).padStart(2, '0');
        const se = String(bd.getSeconds()).padStart(2, '0');
        fd.append('timeOfBirth', `${String(h).padStart(2, '0')}:${mi}:${se} ${ap}`);
      }
      pendingFiles.forEach(({ file }) => fd.append('images', file));

      let savedProfile;
      if (isEdit) {
        savedProfile = await updateProfile(profile._id, fd, signal);
      } else {
        savedProfile = await createProfile(fd, signal);
      }

      // Upload patrika separately if one is pending
      if (!signal.aborted && pendingPatrika) {
        const pfd = new FormData();
        pfd.append('patrika', pendingPatrika.file);
        await uploadPatrika(savedProfile._id, pfd, signal);
      }

      if (!signal.aborted) onSuccess?.();
    } catch (err) {
      if (!isAbortError(err)) setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      if (!signal.aborted) setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5">
      {/* Text fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEXT_FIELDS.map((field) => (
          <div key={field.name} className={field.span === 2 ? 'col-span-2' : ''}>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              {field.label}
              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {field.type === 'select' ? (
              <select name={field.name} value={form[field.name]} onChange={onChange} required={field.required} className={inputCls}>
                {field.options.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={onChange}
                required={field.required}
                placeholder={field.placeholder}
                min={field.name === 'age' ? 18 : undefined}
                max={field.name === 'age' ? 80 : undefined}
                className={inputCls}
              />
            )}
          </div>
        ))}

        {/* Height — two dropdowns (shares row with Location) */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Height</label>
          <div className="flex gap-1.5">
            <select name="heightFt" value={form.heightFt} onChange={onChange} className={inputCls}>
              {FEET_OPTIONS.map((ft) => <option key={ft} value={ft}>{ft} ft</option>)}
            </select>
            <select name="heightIn" value={form.heightIn} onChange={onChange} className={inputCls}>
              {INCH_OPTIONS.map((inch) => <option key={inch} value={inch}>{inch}"</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-1">Selected height: <span className="font-medium text-gray-600">{form.heightFt}'{form.heightIn}"</span></p>
        </div>

        {/* Date & Time of Birth / Birth Location — single row */}
        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Date + Time picker (timescape) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Date &amp; Time of Birth</label>
            <DatetimePicker
              key={profile?._id || 'new'}
              ref={birthPickerRef}
              value={birthDateTime || undefined}
              onChange={setBirthDateTime}
              format={[['months', 'days', 'years'], ['hours', 'minutes', 'am/pm']]}
            />
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Click a field to select it, then <span className="font-medium text-gray-500">type digits</span> or use <span className="font-medium text-gray-500">↑ ↓ arrow keys</span> to change the value.
            </p>
          </div>

          {/* Birth Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Birth Location</label>
            <input
              type="text"
              name="birthLocation"
              value={form.birthLocation}
              onChange={onChange}
              placeholder="City, State"
              className={inputCls}
            />
          </div>

        </div>

        {/* About — full width textarea */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">About</label>
          <textarea
            name="about"
            value={form.about}
            onChange={onChange}
            rows={3}
            placeholder="Write a brief bio…"
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      {/* Existing images (edit mode) */}
      {isEdit && existingImages.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Current Photos</p>
          <div className="flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <div key={img.key} className="relative w-20 h-20 rounded-lg overflow-hidden border border-rose-100">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteExisting(img.key)}
                  disabled={deletingKey === img.key}
                  className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all text-white text-xl font-bold"
                  aria-label="Remove photo"
                >
                  {deletingKey === img.key ? '…' : '×'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New image upload */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          {isEdit ? 'Add More Photos' : 'Upload Photos'}
        </p>
        <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-rose-200 rounded-xl p-4 hover:border-rose-400 transition-colors">
          <span className="text-2xl">📷</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600">Click to add photos</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP · max 10 MB each · up to 10 files</p>
          </div>
          <input type="file" multiple accept="image/*" onChange={onFileChange} className="hidden" />
        </label>

        {/* Pending upload previews */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {pendingFiles.map(({ id, preview }) => (
              <div key={id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-rose-100 group">
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePending(id)}
                  className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none shadow transition opacity-0 group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {pendingFiles.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">{pendingFiles.length} photo{pendingFiles.length !== 1 ? 's' : ''} queued for upload</p>
        )}
      </div>

      {/* Patrika / Kundali Image */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Patrika / Kundali Image
          <span className="ml-1 text-gray-400 normal-case font-normal">(1 image · used for compatibility matching)</span>
        </p>

        {/* Existing patrika (edit mode) */}
        {isEdit && existingPatrika && !pendingPatrika && (
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-amber-200 flex-shrink-0">
              <img src={existingPatrika.url} alt="Patrika" className="w-full h-full object-cover" />
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-amber-700">Patrika uploaded ✓</p>
              <button
                type="button"
                onClick={handleDeleteExistingPatrika}
                disabled={deletingPatrika}
                className="mt-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 underline"
              >
                {deletingPatrika ? 'Removing…' : 'Remove patrika'}
              </button>
            </div>
          </div>
        )}

        {/* Pending patrika preview */}
        {pendingPatrika && (
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-amber-200 flex-shrink-0 group">
              <img src={pendingPatrika.preview} alt="Patrika preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removePendingPatrika}
                className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none shadow transition opacity-0 group-hover:opacity-100"
                aria-label="Remove patrika"
              >×</button>
            </div>
            <p className="text-xs text-gray-500">New patrika queued for upload</p>
          </div>
        )}

        {/* File input */}
        {!pendingPatrika && (
          <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-amber-200 rounded-xl p-3 hover:border-amber-400 transition-colors">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600">
                {isEdit && existingPatrika ? 'Replace patrika image' : 'Upload patrika image'}
              </p>
              <p className="text-xs text-gray-400">JPG, PNG · max 10 MB</p>
            </div>
            <input type="file" accept="image/*" onChange={onPatrikaChange} className="hidden" />
          </label>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold hover:bg-rose-700 disabled:opacity-50 transition text-sm"
        >
          {isEdit ? 'Update Profile' : 'Create Profile'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Saving overlay */}
      {submitting && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/80 backdrop-blur-sm">
          <LumaSpin size={60} />
          <p className="text-sm font-semibold tracking-wide text-rose-600">
            {isEdit ? 'Updating profile…' : 'Creating profile…'}
          </p>
        </div>
      )}
    </form>
  );
}
