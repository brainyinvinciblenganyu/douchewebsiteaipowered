import { getPool } from './client';
import { products as mockProducts } from '../mockData';

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  role: 'customer' | 'vendor';
  name: string | null;
  company_name: string | null;
  location: string | null;
  created_at: string;
};

export type DbProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  price: number;
  currency: string;
  vendor_user_id: string | null;
  asset_name: string | null;
  asset_type: string | null;
  asset_size: number | null;
  asset_data: string | null;
  // Stored in Postgres as `bytea`.
  asset_file: Buffer | null;
  status: string;
  created_at: string;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, email, password_hash, role, name, company_name, location, created_at
     FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  return (res.rows[0] as DbUser | undefined) ?? null;
}

export async function createUser(params: {
  email: string;
  password_hash: string;
  role: 'customer' | 'vendor';
  name?: string | null;
  company_name?: string | null;
  location?: string | null;
}): Promise<DbUser> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, company_name, location)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, password_hash, role, name, company_name, location, created_at`,
    [
      params.email,
      params.password_hash,
      params.role,
      params.name ?? null,
      params.company_name ?? null,
      params.location ?? null,
    ],
  );
  return res.rows[0] as DbUser;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, email, password_hash, role, name, company_name, location, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return (res.rows[0] as DbUser | undefined) ?? null;
}

export async function createProduct(params: {
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  price: number;
  currency?: string;
  vendor_user_id?: string | null;
  asset_name?: string | null;
  asset_type?: string | null;
  asset_size?: number | null;
  asset_data?: string | null;
  asset_file?: Buffer | null;
  status?: string;
}): Promise<DbProduct> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO products (name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, status, created_at`,
    [
      params.name?.trim() || 'Untitled product',
      params.description ?? null,
      params.category ?? null,
      params.tags ?? [],
      params.price,
      params.currency ?? 'FCFA',
      params.vendor_user_id ?? null,
      params.asset_name ?? null,
      params.asset_type ?? null,
      params.asset_size ?? null,
      params.asset_data ?? null,
      params.asset_file ?? null,
      params.status ?? 'published',
    ],
  );
  return res.rows[0] as DbProduct;
}

export async function listProducts(options?: {
  vendorUserId?: string | null;
}): Promise<DbProduct[]> {
  const pool = getPool();

  const vendorUserId = options?.vendorUserId?.toString().trim() || null;
  const queryText = vendorUserId
    ? `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, status, created_at
       FROM products WHERE vendor_user_id = $1 ORDER BY created_at DESC`
    : `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, status, created_at
       FROM products ORDER BY created_at DESC`;

  try {
    const res = await pool.query(queryText, vendorUserId ? [vendorUserId] : []);
    return (res.rows ?? []) as DbProduct[];
  } catch (error) {
    console.warn('List products query failed, using mock fallback:', error);

    const fallbackProducts = vendorUserId
      ? mockProducts.filter((product) => String(product.vendorId) === vendorUserId)
      : mockProducts;

    return fallbackProducts.map((product) => ({
      id: String(product.id),
      name: product.name,
      description: product.description,
      category: product.category,
      tags: product.tags,
      price: product.price,
      currency: product.currency,
      vendor_user_id: String(product.vendorId),
      asset_name: product.model,
      asset_type: 'model/gltf-binary',
      asset_size: 0,
      asset_data: null,
      asset_file: null,
      status: 'published',
      created_at: product.createdAt,
    }));
  }
}

export async function deleteProduct(
  productId: string,
  vendorUserId: string,
): Promise<boolean> {
  const pool = getPool();
  try {
    const res = await pool.query(
      `DELETE FROM products
       WHERE id = $1
         AND vendor_user_id = $2
       RETURNING id`,
      [productId, vendorUserId],
    );
    return (res.rows?.length ?? 0) > 0;
  } catch (error) {
    console.warn('deleteProduct query failed, fallback to mock:', error);
    return false;
  }
}

export async function getProductByIdForVendor(
  productId: string,
  vendorUserId: string,
): Promise<DbProduct | null> {
  const pool = getPool();
  try {
    const res = await pool.query(
      `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, status, created_at
       FROM products
       WHERE id = $1 AND vendor_user_id = $2
       LIMIT 1`,
      [productId, vendorUserId],
    );
    return (res.rows[0] as DbProduct | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function updateProduct(
  productId: string,
  vendorUserId: string,
  patch: {
    name?: string;
    description?: string | null;
    category?: string | null;
    tags?: string[];
    price?: number;
    currency?: string;
    status?: string;
    asset_name?: string | null;
    asset_type?: string | null;
    asset_size?: number | null;
    asset_data?: string | null;
    asset_file?: Buffer | null;
  },
): Promise<DbProduct | null> {
  const pool = getPool();

  const fields: Array<{ key: string; value: unknown }> = [];
  const pushIfDefined = (key: string, value: unknown) => {
    if (typeof value === 'undefined') return;
    fields.push({ key, value });
  };

  pushIfDefined('name', patch.name);
  pushIfDefined('description', patch.description);
  pushIfDefined('category', patch.category);
  pushIfDefined('tags', patch.tags);
  pushIfDefined('price', patch.price);
  pushIfDefined('currency', patch.currency);
  pushIfDefined('status', patch.status);
  pushIfDefined('asset_name', patch.asset_name);
  pushIfDefined('asset_type', patch.asset_type);
  pushIfDefined('asset_size', patch.asset_size);
  pushIfDefined('asset_data', patch.asset_data);
  pushIfDefined('asset_file', patch.asset_file);

  if (fields.length === 0) {
    return getProductByIdForVendor(productId, vendorUserId);
  }

  const queryText = `
    UPDATE products
    SET
      ${fields
        .map((f, idx) => `${f.key} = $${idx + 3}`)
        .join(', ')}
    WHERE id = $1
      AND vendor_user_id = $2
    RETURNING id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, status, created_at
  `;

  const values = [productId, vendorUserId, ...fields.map((f) => f.value)];

  const res = await pool.query(queryText, values);
  return (res.rows[0] as DbProduct | undefined) ?? null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProductById(id: string): Promise<DbProduct | null> {
  if (!UUID_RE.test(id)) return null;
  const pool = getPool();
  try {
    const res = await pool.query(
      `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, status, created_at
       FROM products WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (res.rows[0] as DbProduct | undefined) ?? null;
  } catch {
    return null;
  }
}

export type DbOrderItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  vendorUserId: string | null;
};

export type DbOrder = {
  id: string;
  userId: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: DbOrderItem[];
};

function groupOrderRows(rows: Array<Record<string, unknown>>): DbOrder[] {
  const map = new Map<string, DbOrder>();

  for (const r of rows) {
    const id = String(r.order_id);
    let order = map.get(id);
    if (!order) {
      order = {
        id,
        userId: (r.customer_id ?? null) as string | null,
        totalAmount: Number(r.total_amount ?? 0),
        currency: String(r.currency ?? 'FCFA'),
        status: String(r.status ?? 'paid'),
        createdAt: String(r.created_at),
        items: [],
      };
      map.set(id, order);
    }

    order.items.push({
      productId: r.product_id != null ? String(r.product_id) : null,
      productName: String(r.product_name ?? 'Unknown product'),
      quantity: Number(r.quantity ?? 0),
      unitPrice: Number(r.unit_price ?? 0),
      vendorUserId: r.vendor_user_id != null ? String(r.vendor_user_id) : null,
    });
  }

  return Array.from(map.values());
}

export async function createOrder(params: {
  userId: string | null;
  totalAmount: number;
  currency: string;
  status?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}): Promise<DbOrder> {
  const pool = getPool();
  const status = params.status ?? 'paid';

  const res = await pool.query(
    `INSERT INTO orders (user_id, total_amount, currency, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, total_amount, currency, status, created_at`,
    [params.userId, params.totalAmount, params.currency, status],
  );

  const order = res.rows[0];

  for (const it of params.items) {
    const pid = String(it.productId);
    const product = UUID_RE.test(pid) ? await getProductById(pid) : null;

    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        order.id,
        product ? pid : null,
        product?.name ?? 'Unknown product',
        Number(it.quantity),
        Number(it.unitPrice),
        new Date().toISOString(),
      ],
    );
  }

  return {
    id: String(order.id),
    userId: (order.user_id ?? null) as string | null,
    totalAmount: Number(order.total_amount),
    currency: String(order.currency),
    status: String(order.status),
    createdAt: String(order.created_at),
    items: [],
  };
}

export async function getOrdersForVendor(vendorUserId: string): Promise<DbOrder[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT o.id AS order_id, o.user_id AS customer_id, o.total_amount, o.currency, o.status, o.created_at,
            oi.product_id, oi.product_name, oi.quantity, oi.unit_price,
            p.vendor_user_id
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     WHERE p.vendor_user_id = $1
     ORDER BY o.created_at DESC`,
    [vendorUserId],
  );
  return groupOrderRows(res.rows as Array<Record<string, unknown>>);
}

export async function getOrdersForCustomer(userId: string): Promise<DbOrder[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT o.id AS order_id, o.user_id AS customer_id, o.total_amount, o.currency, o.status, o.created_at,
            oi.product_id, oi.product_name, oi.quantity, oi.unit_price
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId],
  );
  return groupOrderRows(res.rows as Array<Record<string, unknown>>);
}

