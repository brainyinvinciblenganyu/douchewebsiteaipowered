import { NextResponse } from 'next/server';
import { createProduct, listProducts } from '../../../lib/db/queries';

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to list products', error);
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
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

    return NextResponse.json({ product, products: [product] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create product', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
