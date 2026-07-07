import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

type CheckoutItem = {
  productId: number;
  quantity: number;
  unitPrice: number; // price in FCFA (or whatever your catalog uses)
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      items?: CheckoutItem[];
      total?: number;
      currency?: string;
    };

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const currency = body.currency ?? 'FCFA';

    // Persist in cents to avoid floating-point issues.
    const toCents = (amount: number) => Math.round(amount * 100);
    const createdAt = new Date().toISOString();

    const db = getDb();

    const totalCents = toCents(Number(body.total ?? items.reduce((s, it) => s + it.unitPrice * it.quantity, 0)));

    const insertOrder = db.prepare(
      `INSERT INTO orders (created_at, total_cents, currency, status)
       VALUES (?, ?, ?, ?)`
    );

    const info = insertOrder.run(createdAt, totalCents, currency, 'paid');
    const orderId = Number(info.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );

    const tx = db.transaction(() => {
      for (const it of items) {
        insertItem.run(
          orderId,
          Number(it.productId),
          Number(it.quantity),
          toCents(Number(it.unitPrice)),
          createdAt
        );
      }
    });

    tx();

    // Track purchase behavior in PostgreSQL
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001';
    for (const it of items) {
      try {
        await fetch(`${BACKEND_URL}/api/recommendations/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: req.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            eventType: 'purchase',
            productId: Number(it.productId),
            metadata: { quantity: Number(it.quantity) },
          }),
        });
      } catch (err) {
        console.error('Failed to log purchase interaction:', err);
      }
    }

    return NextResponse.json({
      status: 'success',
      orderId,
      createdAt,
    });
  } catch (e) {
    console.error('checkout error', e);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}

