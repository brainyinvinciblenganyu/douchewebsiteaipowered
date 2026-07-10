import multer from 'multer';

// Multer config for in-memory uploads so we can store bytes directly in Postgres bytea.
// Assumption: frontend sends the 3D model as a single file field named either `asset_file` or `file`.
// Use BACKEND_MAX_UPLOAD_BYTES env var to control server max upload (bytes).
const MAX_UPLOAD_BYTES = Number(process.env.BACKEND_MAX_UPLOAD_BYTES) || 100 * 1024 * 1024; // default 100MB

export const productAssetUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
});

