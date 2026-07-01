import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { products } from '../../products/products';

type Range = 'last30' | 'monthToDate';

function startDate(range: Range) {
  const now = new Date();
  if (range === 'last30') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }

  // monthToDate
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range');

    const range: Range = rangeParam === 'monthToDate' ? 'monthToDate' : 'last30';
    const from = startDate(range);

    const db = getDb();

    // Trending by quantity sold (could also be revenue).
    const rows = db
      .prepare(
        `SELECT product_id, SUM(quantity) as units
         FROM order_items
         WHERE created_at >= ?
         GROUP BY product_id
         ORDER BY units DESC
         LIMIT 6`
      )
      .all(from) as { product_id: number; units: number }[];

    const byId = new Map(products.map((p) => [p.id, p] as const));

    const suggestions = rows
      .map((r) => {
        const p = byId.get(r.product_id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          model: p.model,
          score: r.units,
          reason:
            range === 'last30'
              ? `Trending over the last 30 days: ${r.units} unit(s) sold.`
              : `Trending this month so far: ${r.units} unit(s) sold.`,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      range,
      from,
      suggestions,
      count: suggestions.length,
    });
  } catch (e) {
    console.error('trending error', e);
    return NextResponse.json({ error: 'Failed to load trending' }, { status: 500 });
  }
}

