import { Router, type Request, type Response } from 'express';
import {
  listVendors,
  setVendorActive,
  listAllTransactions,
  listPendingProducts,
  setProductStatus,
  recordAuditLog,
  listAuditLog,
  listContactMessages,
  markContactMessageRead,
} from '../../../lib/db/queries.js';
import { clearAdminSessionCookie } from '../services/admin/adminAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireFreshAdminSession } from '../middleware/requireFreshAdminSession.js';

const router = Router();

router.post('/logout', (_req: Request, res: Response) => {
  clearAdminSessionCookie(res);
  res.status(200).json({ status: 'success' });
});

router.use(requireAdmin);

router.get('/session', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/vendors', async (_req: Request, res: Response) => {
  try {
    const vendors = await listVendors();
    res.json({ vendors });
  } catch (error) {
    console.error('Failed to list vendors', error);
    res.status(500).json({ error: 'Failed to load vendors' });
  }
});

router.patch('/vendors/:id/status', requireFreshAdminSession, async (req: Request, res: Response) => {
  try {
    const isActive = Boolean(req.body?.isActive);
    const vendorId = String(req.params.id);
    const updated = await setVendorActive(vendorId, isActive);
    if (!updated) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await recordAuditLog({
      adminId: req.adminUser!.id,
      action: isActive ? 'vendor_reactivated' : 'vendor_suspended',
      targetType: 'vendor',
      targetId: vendorId,
      ip: req.ip,
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Failed to update vendor status', error);
    res.status(500).json({ error: 'Failed to update vendor status' });
  }
});

router.get('/transactions', async (_req: Request, res: Response) => {
  try {
    const transactions = await listAllTransactions();
    res.json({ transactions });
  } catch (error) {
    console.error('Failed to list transactions', error);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});

router.get('/products/pending', async (_req: Request, res: Response) => {
  try {
    const products = await listPendingProducts();
    res.json({ products });
  } catch (error) {
    console.error('Failed to list pending products', error);
    res.status(500).json({ error: 'Failed to load pending products' });
  }
});

router.patch('/products/:id/approve', requireFreshAdminSession, async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = await setProductStatus(productId, 'published');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await recordAuditLog({
      adminId: req.adminUser!.id,
      action: 'product_approved',
      targetType: 'product',
      targetId: productId,
      ip: req.ip,
    });

    res.status(200).json({ product });
  } catch (error) {
    console.error('Failed to approve product', error);
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

router.patch('/products/:id/reject', requireFreshAdminSession, async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.id);
    const product = await setProductStatus(productId, 'archived');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await recordAuditLog({
      adminId: req.adminUser!.id,
      action: 'product_rejected',
      targetType: 'product',
      targetId: productId,
      ip: req.ip,
    });

    res.status(200).json({ product });
  } catch (error) {
    console.error('Failed to reject product', error);
    res.status(500).json({ error: 'Failed to reject product' });
  }
});

router.get('/contact-messages', async (_req: Request, res: Response) => {
  try {
    const messages = await listContactMessages();
    res.json({ messages });
  } catch (error) {
    console.error('Failed to list contact messages', error);
    res.status(500).json({ error: 'Failed to load contact messages' });
  }
});

router.patch('/contact-messages/:id/read', async (req: Request, res: Response) => {
  try {
    const ok = await markContactMessageRead(String(req.params.id));
    if (!ok) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Failed to mark contact message read', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.get('/audit-log', async (_req: Request, res: Response) => {
  try {
    const entries = await listAuditLog();
    res.json({ entries });
  } catch (error) {
    console.error('Failed to load audit log', error);
    res.status(500).json({ error: 'Failed to load audit log' });
  }
});

export default router;
