import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL || ''}/api/profiles`;

export const fetchProfiles = (liked = false) =>
  axios.get(BASE, { params: liked ? { liked: 'true' } : {} }).then((r) => r.data);

export const fetchProfile = (id) =>
  axios.get(`${BASE}/${id}`).then((r) => r.data);

export const createProfile = (formData) =>
  axios.post(BASE, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const updateProfile = (id, formData) =>
  axios.put(`${BASE}/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);

export const deleteProfile = (id) =>
  axios.delete(`${BASE}/${id}`).then((r) => r.data);

export const toggleLike = (id) =>
  axios.patch(`${BASE}/${id}/like`).then((r) => r.data);

export const deleteImage = (id, key) =>
  axios.delete(`${BASE}/${id}/images`, { params: { key } }).then((r) => r.data);
