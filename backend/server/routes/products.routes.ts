import { Router, type Request, type Response } from 'express';
import type { File as MulterFile } from 'multer';
import { createProduct, listProducts } from '../../../lib/db/queries.js';
import { getSessionFromRequest } from '../../../lib/auth/session.js';

function getFirstUploadedFile(req: Request): { buffer: Buffer; mimetype?: string } | null {
  const anyReq = req as Request & { files?: Record<string, MulterFile[]> };
  const files = anyReq.files;
  if (!files) return null;

  const candidates = ['asset_file', 'file', 'model'];
  for (const key of candidates) {
    const arr = files[key];
    if (arr && arr.length > 0) {
      return {
        buffer: arr[0].buffer,
        mimetype: arr[0].mimetype,
      };
    }
  }

  // fallback: first file of any field
  const keys = Object.keys(files);
  if (keys.length === 0) return null;
  const first = files[keys[0]]?.[0];
  if (!first) return null;
  return { buffer: first.buffer, mimetype: first.mimetype };
}

const router = Router();

function getStringValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) return item.trim();
    }
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return null;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const vendorUserId = getStringValue(req.query.vendor_user_id) ?? getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0])?.userId ?? null;
    const products = await listProducts(vendorUserId ? { vendorUserId } : undefined);
    res.json({ products });
  } catch (error) {
    console.error('Failed to list products', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    // With multer: req.body contains text fields; uploaded file is available on req.files.
    const payload = req.body ?? {};

    const uploaded = getFirstUploadedFile(req);

    // Multer text fields arrive as strings (even for numeric-ish fields) from multipart.
    const priceRaw = payload.price ?? 0;
    const price = typeof priceRaw === 'number' ? priceRaw : Number(String(priceRaw));

    const tagsRaw = payload.tags ?? [];
    const tags = Array.isArray(tagsRaw)
      ? tagsRaw.map((t) => String(t))
      : typeof tagsRaw === 'string'
        ? tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const vendorUserId = getStringValue(payload.vendor_user_id)
      ?? getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0])?.userId
      ?? null;

    const asset_file = uploaded ? uploaded.buffer : null;

    const product = await createProduct({
      name: payload.name?.toString().trim() || 'Untitled product',
      description: payload.description ?? null,
      category: payload.category ?? null,
      tags,
      price: Number.isFinite(price) ? price : 0,
      currency: payload.currency ?? 'FCFA',
      vendor_user_id: vendorUserId,
      asset_name: payload.asset_name ?? (uploaded ? 'uploaded-asset' : null),
      asset_type: payload.asset_type ?? uploaded?.mimetype ?? null,
      asset_size: payload.asset_size ? Number(payload.asset_size) : uploaded ? uploaded.buffer.byteLength : null,
      asset_data: payload.asset_data ?? null,
      asset_file,
      status: payload.status ?? 'published',
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Failed to create product', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;
