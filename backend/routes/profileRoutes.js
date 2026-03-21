import { Router } from 'express';
import upload from '../middleware/upload.js';
import {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  toggleLike,
  deleteImage,
} from '../controllers/profileController.js';

const router = Router();

router.get('/',          getProfiles);
router.get('/:id',       getProfile);
router.post('/',         upload.array('images', 10), createProfile);
router.put('/:id',       upload.array('images', 10), updateProfile);
router.delete('/:id',    deleteProfile);
router.patch('/:id/like', toggleLike);
router.delete('/:id/images', deleteImage);

export default router;
