# Image-to-3D integration (HF Shape-E)

## Goal
Replace the current PHP demo image→3D flow with a real Next.js API route that uses an open-source model via Hugging Face inference, saves the resulting `.glb`, and returns a URL for the existing `ModelViewer`.

## Steps
1. Update `app/api/generate-3d/route.ts`:
   - Accept `multipart/form-data` image upload.
   - Read image bytes.
   - Call Hugging Face Inference API for `openai/shap-e`.
   - Save response GLB bytes to `public/models/` under a unique name.
   - Return `{ modelUrl }`.
   - Handle missing env vars / HF token and return clear errors.

2. Update `components/AI3DGenerator.tsx`:
   - Change fetch target from `http://localhost/douche/backend/api/generate-3d.php` to `/api/generate-3d`.
   - Keep UI status updates.

3. Validate locally:
   - Run dev server.
   - Upload an image.
   - Confirm `.glb` appears under `public/models/` and the viewer renders it.

## Notes
- HF token should be provided via env var (e.g. `HF_TOKEN`).
- Current code already has a Next route; it will be fully replaced.

