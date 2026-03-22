import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();
import multerS3 from 'multer-s3';
import s3Client from '../config/s3.js';

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      cb(null, `profiles/${uniqueSuffix}-${file.originalname}`);
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

export const uploadPatrika = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      cb(null, `patrikas/${uniqueSuffix}-${file.originalname}`);
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

export default upload;
