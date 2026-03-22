import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL || ''}/api/profiles`;

export const isAbortError = (err) =>
  err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError';

export const fetchProfiles = (liked = false, signal) =>
  axios.get(BASE, { params: liked ? { liked: 'true' } : {}, signal }).then((r) => r.data);

export const fetchProfile = (id, signal) =>
  axios.get(`${BASE}/${id}`, { signal }).then((r) => r.data);

export const createProfile = (formData, signal) =>
  axios.post(BASE, formData, { headers: { 'Content-Type': 'multipart/form-data' }, signal }).then((r) => r.data);

export const updateProfile = (id, formData, signal) =>
  axios.put(`${BASE}/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, signal }).then((r) => r.data);

export const deleteProfile = (id, signal) =>
  axios.delete(`${BASE}/${id}`, { signal }).then((r) => r.data);

export const toggleLike = (id, signal) =>
  axios.patch(`${BASE}/${id}/like`, null, { signal }).then((r) => r.data);

export const deleteImage = (id, key, signal) =>
  axios.delete(`${BASE}/${id}/images`, { params: { key }, signal }).then((r) => r.data);

export const uploadPatrika = (id, formData, signal) =>
  axios.put(`${BASE}/${id}/patrika`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, signal }).then((r) => r.data);

export const deletePatrika = (id, signal) =>
  axios.delete(`${BASE}/${id}/patrika`, { signal }).then((r) => r.data);

export const matchProfiles = (profileAId, profileBId, language = 'en', signal) =>
  axios.post(`${BASE}/match`, { profileAId, profileBId, language }, { signal }).then((r) => r.data);
