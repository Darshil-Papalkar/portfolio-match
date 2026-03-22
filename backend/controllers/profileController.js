import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3.js';
import Profile from '../models/Profile.js';

const PROFILE_FIELDS = ['name', 'age', 'gender', 'religion', 'caste', 'education', 'occupation', 'location', 'height', 'about'];
const PRESIGN_TTL = 60 * 60; // 1 hour

const deleteS3Object = (key) =>
  s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));

const presignImageObj = async (img) => ({
  ...img,
  url: await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: img.key }),
    { expiresIn: PRESIGN_TTL }
  ),
});

// Replace stored URLs with fresh presigned URLs before sending to client
const presign = async (profile) => {
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  obj.images = await Promise.all(obj.images.map(presignImageObj));
  if (obj.patrikaImage?.key) {
    obj.patrikaImage = await presignImageObj(obj.patrikaImage);
  }
  return obj;
};

// GET /api/profiles?liked=true
export const getProfiles = async (req, res) => {
  try {
    const filter = req.query.liked === 'true' ? { isLiked: true } : {};
    const profiles = await Profile.find(filter).sort({ updatedAt: -1 });
    res.json(await Promise.all(profiles.map(presign)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/profiles/:id
export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(await presign(profile));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/profiles  (multipart/form-data)
export const createProfile = async (req, res) => {
  try {
    const data = {};
    PROFILE_FIELDS.forEach((f) => { if (req.body[f] !== undefined) data[f] = req.body[f]; });

    data.images = (req.files || []).map((file) => ({ key: file.key, url: file.location }));

    const profile = await Profile.create(data);
    res.status(201).json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/profiles/:id  (multipart/form-data — appends new images)
export const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    PROFILE_FIELDS.forEach((f) => { if (req.body[f] !== undefined) profile[f] = req.body[f]; });

    const newImages = (req.files || []).map((file) => ({ key: file.key, url: file.location }));
    if (newImages.length) profile.images.push(...newImages);

    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/profiles/:id
export const deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    await Promise.allSettled(profile.images.map((img) => deleteS3Object(img.key)));
    if (profile.patrikaImage?.key) {
      await deleteS3Object(profile.patrikaImage.key).catch(() => {});
    }
    await Profile.findByIdAndDelete(req.params.id);
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/profiles/:id/like
export const toggleLike = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.isLiked = !profile.isLiked;
    await profile.save();
    res.json({ isLiked: profile.isLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/profiles/:id/images?key=<s3key>
export const deleteImage = async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ message: 'Image key is required' });

    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    await deleteS3Object(key);
    profile.images = profile.images.filter((img) => img.key !== key);
    await profile.save();
    res.json({ images: profile.images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/profiles/:id/patrika  (multipart — single file field "patrika")
export const updatePatrika = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (!req.file) return res.status(400).json({ message: 'Patrika image is required' });

    // Delete old patrika from S3 if it exists
    if (profile.patrikaImage?.key) {
      await deleteS3Object(profile.patrikaImage.key).catch(() => {});
    }

    profile.patrikaImage = { key: req.file.key, url: req.file.location };
    await profile.save();
    res.json({ patrikaImage: profile.patrikaImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/profiles/:id/patrika
export const deletePatrika = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (profile.patrikaImage?.key) {
      await deleteS3Object(profile.patrikaImage.key).catch(() => {});
    }
    profile.patrikaImage = undefined;
    await profile.save();
    res.json({ message: 'Patrika removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
