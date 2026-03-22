import { Router } from 'express';
import upload, { uploadPatrika } from '../middleware/upload.js';
import {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  toggleLike,
  deleteImage,
  updatePatrika,
  deletePatrika,
} from '../controllers/profileController.js';
import { matchProfiles } from '../controllers/matchController.js';

const router = Router();

// Non-parameterized routes first to avoid /:id collision
router.post('/match', matchProfiles);

router.get('/',          getProfiles);
router.get('/:id',       getProfile);
router.post('/',         upload.array('images', 10), createProfile);
router.put('/:id',       upload.array('images', 10), updateProfile);
router.delete('/:id',    deleteProfile);
router.patch('/:id/like', toggleLike);
router.delete('/:id/images', deleteImage);
router.put('/:id/patrika', uploadPatrika.single('patrika'), updatePatrika);
router.delete('/:id/patrika', deletePatrika);

export default router;
