import { Router, type Request, type Response } from 'express';
import type { File as MulterFile } from 'multer';

import {
  createProduct,
  deleteProduct,
  getProductById,
  getRatingSummary,
  getReviewsForProduct,
  listProducts,
  updateProduct,
  upsertReview,
} from '../../../lib/db/queries.js';

import { getSessionFromRequest } from '../../../lib/auth/session.js';

function getFirstUploadedFile(
  req: Request,
): { buffer: Buffer; mimetype?: string } | null {
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

function firstString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed) return trimmed;
      }
    }
    return null;
  }

  return null;
}

function parseTags(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .map((v) => String(v))
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return undefined;
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === 'undefined') return undefined;

  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'undefined') return undefined;
    const n = Number(String(first));
    return Number.isFinite(n) ? n : undefined;
  }

  const n = Number(String(value));
  return Number.isFinite(n) ? n : undefined;
}

function parseStock(value: unknown): number | undefined {
  if (typeof value === 'undefined') return undefined;

  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === 'undefined') return undefined;

  const n = Math.trunc(Number(String(raw)));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const vendorUserId = firstString(req.query.vendor_user_id);

    const products = await listProducts(vendorUserId ? { vendorUserId } : undefined);
    res.json({ products });
  } catch (error) {
    console.error('Failed to list products', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await getProductById(String(req.params.id));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error('Failed to get product', error);
    return res.status(500).json({ error: 'Failed to get product' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body ?? {};
    const uploaded = getFirstUploadedFile(req);

    const cookieHeader = (() => {
      const v = req.headers['cookie'];
      if (Array.isArray(v)) return v.join('; ');
      return (v ?? '').toString();
    })();

    const session = getSessionFromRequest(
      req as Parameters<typeof getSessionFromRequest>[0],
    );
    const vendorUserId = session?.userId ?? null;

    if (!vendorUserId) {
      console.warn('DEBUG /api/products POST unauthorized');
      console.warn('DEBUG AUTH_COOKIE_NAME:', process.env.AUTH_COOKIE_NAME || 'session');
      console.warn('DEBUG cookie header present:', Boolean(cookieHeader));
      console.warn('DEBUG cookie header (truncated):', cookieHeader.slice(0, 200));
      console.warn('DEBUG session:', session);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const asset_file = uploaded ? uploaded.buffer : null;

    const product = await createProduct({
      name: firstString(payload.name) ?? 'Untitled product',
      description:
        typeof payload.description === 'undefined'
          ? null
          : payload.description === null
            ? null
            : String(payload.description),
      category:
        typeof payload.category === 'undefined'
          ? null
          : payload.category === null
            ? null
            : String(payload.category),
      tags: parseTags(payload.tags) ?? [],
      price: parsePrice(payload.price) ?? 0,
      currency: firstString(payload.currency) ?? 'FCFA',
      vendor_user_id: vendorUserId,
      asset_name:
        typeof payload.asset_name === 'undefined'
          ? uploaded
            ? 'uploaded-asset'
            : null
          : String(payload.asset_name),
      asset_type:
        typeof payload.asset_type === 'undefined'
          ? uploaded?.mimetype ?? null
          : String(payload.asset_type),
      asset_size:
        typeof payload.asset_size === 'undefined'
          ? uploaded
            ? uploaded.buffer.byteLength
            : null
          : Number(String(Array.isArray(payload.asset_size) ? payload.asset_size[0] : payload.asset_size)),
      asset_data:
        typeof payload.asset_data === 'undefined'
          ? null
          : payload.asset_data === null
            ? null
            : String(payload.asset_data),
      asset_file,
      image_data:
        typeof payload.image_data === 'undefined'
          ? null
          : payload.image_data === null
            ? null
            : String(payload.image_data),
      // New products always start pending admin review — a vendor can't
      // bypass approval by sending status directly in the create payload.
      status: 'pending_review',
      stock_quantity: parseStock(payload.stock_quantity) ?? 0,
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Failed to create product', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const session = getSessionFromRequest(
      req as Parameters<typeof getSessionFromRequest>[0],
    );

    const vendorUserId = session?.userId ?? null;

    if (!vendorUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const deleted = await deleteProduct(req.params.id, String(vendorUserId));
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ status: 'deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const session = getSessionFromRequest(
      req as Parameters<typeof getSessionFromRequest>[0],
    );

    const vendorUserId = session?.userId ?? null;

    if (!vendorUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body ?? {};
    const uploaded = getFirstUploadedFile(req);

    const asset_file = uploaded ? uploaded.buffer : undefined;

    const updated = await updateProduct(req.params.id, String(vendorUserId), {
name:
        typeof payload.name === 'undefined'
          ? undefined
          : (Array.isArray(payload.name)
              ? firstString(payload.name[0]) ?? undefined
              : firstString(payload.name) ?? undefined),
      description:
        typeof payload.description === 'undefined'
          ? undefined
          : payload.description === null
            ? null
            : String(payload.description),
      category:
        typeof payload.category === 'undefined'
          ? undefined
          : payload.category === null
            ? null
            : String(payload.category),
      tags:
        typeof payload.tags === 'undefined'
          ? undefined
          : parseTags(payload.tags) ?? undefined,
      price:
        typeof payload.price === 'undefined' ? undefined : parsePrice(payload.price),
      currency:
        typeof payload.currency === 'undefined'
          ? undefined
          : firstString(payload.currency) ?? undefined,
      // A vendor may take their own listing down ('draft'/'archived'), but
      // can't self-publish — only admin approval can move a product to
      // 'published', so a client-sent 'published' is silently ignored here.
      status:
        typeof payload.status === 'undefined'
          ? undefined
          : (() => {
              const requested = firstString(payload.status);
              return requested === 'published' ? undefined : requested ?? undefined;
            })(),
      stock_quantity: parseStock(payload.stock_quantity),
      asset_name:
        uploaded
          ? typeof payload.asset_name === 'undefined'
            ? 'uploaded-asset'
            : String(payload.asset_name)
          : undefined,
      asset_type:
        uploaded
          ? typeof payload.asset_type === 'undefined'
            ? uploaded.mimetype ?? null
            : String(payload.asset_type)
          : undefined,
      asset_size:
        uploaded
          ? typeof payload.asset_size === 'undefined'
            ? uploaded.buffer.byteLength
            : Number(String(Array.isArray(payload.asset_size) ? payload.asset_size[0] : payload.asset_size))
          : undefined,
      asset_data:
        typeof payload.asset_data === 'undefined'
          ? undefined
          : payload.asset_data === null
            ? null
            : String(payload.asset_data),
      asset_file,
      image_data:
        typeof payload.image_data === 'undefined'
          ? undefined
          : payload.image_data === null
            ? null
            : String(payload.image_data),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const [summary, reviews] = await Promise.all([
      getRatingSummary(productId),
      getReviewsForProduct(productId),
    ]);

    const session = getSessionFromRequest(
      req as Parameters<typeof getSessionFromRequest>[0],
    );
    const myReview = session
      ? reviews.find((r) => r.userId === session.userId) ?? null
      : null;

    return res.status(200).json({ summary, reviews, myReview });
  } catch (error) {
    console.error('Failed to load reviews', error);
    return res.status(500).json({ error: 'Failed to load reviews' });
  }
});

router.post('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const session = getSessionFromRequest(
      req as Parameters<typeof getSessionFromRequest>[0],
    );

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body ?? {};
    const rating = Number(payload.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const title = firstString(payload.title);
    const body = firstString(payload.body);

    const review = await upsertReview({
      productId: req.params.id,
      userId: session.userId,
      rating,
      title,
      body,
    });

    const summary = await getRatingSummary(req.params.id);

    return res.status(200).json({ review, summary });
  } catch (error) {
    console.error('Failed to submit review', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;

