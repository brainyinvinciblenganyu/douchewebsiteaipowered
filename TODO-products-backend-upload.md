# TODO: Vendor product creation - backend 3D upload wiring

- [ ] Implement multipart/form-data handling in backend `backend/server/index.ts` (via `multer`) for product creation.
- [ ] Add/modify `backend/server/routes/products.routes.ts` POST `/api/products` to accept:
  - JSON body (existing behavior)
  - multipart payload (fields + uploaded file)
- [ ] Map uploaded file into DB columns:
  - Prefer storing binary into `products.asset_file` (bytea)
  - Also set `asset_name`, `asset_type`, `asset_size`
- [ ] Ensure vendor_user_id is derived from logged-in vendor session (using existing auth cookie/session helpers).
- [ ] Verify frontend request compatibility (FormData key name, route path) once Network tab is available.


