# Todo: make vendor product delete + edit real-time

- [x] Implement backend DB helpers: deleteProduct + updateProduct

- [ ] Implement backend REST endpoints: DELETE /api/products/:id and PUT /api/products/:id (multipart upload)
- [ ] Implement Next.js proxy: app/api/products/route.ts (DELETE + PUT)
- [ ] Update frontend edit client to call DELETE + PUT and then refresh the product list (prefill optional fields; keep 3D unless replaced)

- [ ] Update routing if needed (ensure /vendor/products/[id]/edit/page.tsx exists and renders ProductEditClient)
- [ ] Run frontend + backend sanity checks (lint/build and basic fetch calls)

