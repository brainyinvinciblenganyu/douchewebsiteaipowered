import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL as BACKEND_URL } from '../../../../lib/apiConfig';

// Returns live cart item details for the given product ids.
// Body: { productIds: number[] }
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { productIds?: unknown };
    const raw = Array.isArray(body?.productIds) ? body.productIds : [];

    const productIds = raw
      .map((v) => String(v))
      .filter((v) => v.trim().length > 0);

    if (productIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Efficient-ish: backend currently lacks a dedicated bulk-by-ids query,
    // but we still avoid fetching the cart-specific data from localStorage.
    // We ask backend for the full list and filter in the API.
    const backendRes = await fetch(`${BACKEND_URL}/api/products`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await backendRes.json();
    const products = Array.isArray(data?.products) ? data.products : [];

    const idSet = new Set(productIds.map(String));
    const items = products
      .filter((p: any) => idSet.has(String(p?.id)))
      .map((p: any) => ({
        id: String(p?.id),
        name: String(p?.name ?? ''),
        price: Number(p?.price ?? 0),
        currency: String(p?.currency ?? 'FCFA'),
        category: typeof p?.category === 'string' ? p.category : null,
        asset_name: typeof p?.asset_name === 'string' ? p.asset_name : null,
        asset_file: p?.asset_file ? String(p.asset_file) : null,
      }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to load cart items from backend', error);
    return NextResponse.json({ error: 'Failed to load cart items' }, { status: 500 });
  }
}

