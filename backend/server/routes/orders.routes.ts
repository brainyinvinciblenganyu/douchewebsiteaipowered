import { Router, type Request, type Response } from 'express';
import { getSessionFromRequest } from '../../../lib/auth/session.js';
import {
  findUserById,
  createOrder,
  getOrdersForVendor,
  getOrdersForCustomer,
} from '../../../lib/db/queries.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body ?? {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const currency = typeof payload.currency === 'string' ? payload.currency : 'FCFA';
    const total = Number(
      payload.total ??
        items.reduce((sum: number, it: { unitPrice?: unknown; quantity?: unknown }) => sum + Number(it.unitPrice) * Number(it.quantity), 0),
    );

    const order = await createOrder({
      userId: session.userId,
      totalAmount: total,
      currency,
      status: typeof payload.status === 'string' ? payload.status : 'paid',

      items: items.map((it: { productId?: unknown; quantity?: unknown; unitPrice?: unknown }) => ({
        productId: String(it.productId),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
      })),
    });

    res.status(201).json({ status: 'success', orderId: order.id, createdAt: order.createdAt });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
    if (!session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orders =
      user.role === 'vendor'
        ? await getOrdersForVendor(user.id)
        : await getOrdersForCustomer(user.id);

    res.json({ orders });
  } catch (error) {
    console.error('Load orders error:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

export default router;

