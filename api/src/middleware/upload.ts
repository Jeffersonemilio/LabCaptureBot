import multer from 'multer';

// Store files in memory (as Buffer)
const storage = multer.memoryStorage();

// File size limit: 10MB
const limits = {
  fileSize: 10 * 1024 * 1024,
};

export const upload = multer({
  storage,
  limits,
});
