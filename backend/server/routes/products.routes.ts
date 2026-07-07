import { Router, type Request, type Response } from 'express';
import { createProduct, listProducts } from '../../../lib/db/queries.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await listProducts();
    res.json({ products });
  } catch (error) {
    console.error('Failed to list products', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = req.body ?? {};
    const product = await createProduct({
      name: payload.name?.toString().trim() || 'Untitled product',
      description: payload.description ?? null,
      category: payload.category ?? null,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      price: Number(payload.price ?? 0),
      currency: payload.currency ?? 'FCFA',
      vendor_user_id: payload.vendor_user_id ?? null,
      asset_name: payload.asset_name ?? null,
      asset_type: payload.asset_type ?? null,
      asset_size: payload.asset_size ?? null,
      asset_data: payload.asset_data ?? null,
      asset_file: payload.asset_file ?? null,
      status: payload.status ?? 'published',
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Failed to create product', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;
