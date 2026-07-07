import multer from 'multer';

// Multer config for in-memory uploads so we can store bytes directly in Postgres bytea.
// Assumption: frontend sends the 3D model as a single file field named either `asset_file` or `file`.

export const productAssetUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (tune as needed)
  },
});

