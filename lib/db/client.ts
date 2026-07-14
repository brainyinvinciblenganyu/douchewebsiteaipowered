import pg from 'pg';

interface DbPoolLike {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
}

const { Pool } = pg as { Pool: new (options?: Record<string, unknown>) => DbPoolLike };

let pool: DbPoolLike | null = null;

class InMemoryPool implements DbPoolLike {
  private users: Array<Record<string, unknown>> = [];
  private products: Array<Record<string, unknown>> = [];
  private recommendationCache: Array<Record<string, unknown>> = [];
  private orders: Array<Record<string, unknown>> = [];
  private orderItems: Array<Record<string, unknown>> = [];
  private productReviews: Array<Record<string, unknown>> = [];

  async query(text: string, params: unknown[] = []) {
    const normalized = text.trim().toLowerCase();

    if (normalized.includes('create table if not exists')) {
      return { rows: [] };
    }

    if (normalized.includes('insert into users')) {
      const [email, passwordHash, role, name, companyName, location] = params as [string, string, string, string | null, string | null, string | null];
      const user = {
        id: `user-${this.users.length + 1}`,
        email,
        password_hash: passwordHash,
        role,
        name,
        company_name: companyName,
        location,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      this.users.push(user);
      return { rows: [user] };
    }

    if (normalized.includes('from users where email = $1')) {
      const [email] = params as [string];
      const match = this.users.find((user) => String(user.email) === email) ?? null;
      return { rows: match ? [match] : [] };
    }

    if (normalized.includes('from users where id = $1')) {
      const [id] = params as [string];
      const match = this.users.find((user) => String(user.id) === id) ?? null;
      return { rows: match ? [match] : [] };
    }

    if (normalized.includes('insert into products')) {
      const [name, description, category, tags, price, currency, vendorUserId, assetName, assetType, assetSize, assetData, assetFile, status, stockQuantity] = params as [string, string | null, string | null, string[] | null, number, string, string | null, string | null, string | null, number | null, string | null, string | null, string | null, number | null];
      const product = {
        id: `product-${this.products.length + 1}`,
        name,
        description,
        category,
        tags: tags ?? [],
        price,
        currency,
        vendor_user_id: vendorUserId,
        asset_name: assetName,
        asset_type: assetType,
        asset_size: assetSize ?? 0,
        asset_data: assetData,
        asset_file: assetFile,
        status: status ?? 'published',
        stock_quantity: stockQuantity ?? 0,
        created_at: new Date().toISOString(),
      };
      this.products.push(product);
      return { rows: [product] };
    }

    if (normalized.includes('from products')) {
      return { rows: this.products.slice().reverse() };
    }

    if (normalized.includes('insert into recommendation_cache')) {
      const [userId, profileHash, recommendations, expiresAt] = params as [string | null, string, string, string];
      const row = {
        id: `cache-${this.recommendationCache.length + 1}`,
        user_id: userId,
        profile_hash: profileHash,
        recommendations: typeof recommendations === 'string' ? JSON.parse(recommendations) : recommendations,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
      };
      this.recommendationCache.push(row);
      return { rows: [row] };
    }

    if (normalized.includes('from recommendation_cache')) {
      const rows = this.recommendationCache.filter((row) => new Date(String(row.expires_at)) > new Date());
      return { rows: rows.slice().reverse() };
    }

    if (normalized.includes('insert into orders')) {
      const [userId, totalAmount, currency, status] = params as [string | null, number, string, string];
      const order = {
        id: `order-${this.orders.length + 1}`,
        user_id: userId,
        total_amount: totalAmount,
        currency,
        status: status ?? 'paid',
        created_at: new Date().toISOString(),
      };
      this.orders.push(order);
      return { rows: [order] };
    }

    if (normalized.includes('insert into order_items')) {
      const [orderId, productId, productName, quantity, unitPrice] = params as [string, string | null, string, number, number];
      const product = this.products.find((p) => String(p.id) === String(productId));
      const item = {
        id: `oi-${this.orderItems.length + 1}`,
        order_id: orderId,
        product_id: productId ?? null,
        product_name: productName,
        quantity,
        unit_price: unitPrice,
        vendor_user_id: (product?.vendor_user_id ?? null) as string | null,
        created_at: new Date().toISOString(),
      };
      this.orderItems.push(item);
      return { rows: [item] };
    }

    if (normalized.includes('update orders') && normalized.includes("status = 'cancelled'")) {
      const [orderId, userId] = params as [string, string];
      const order = this.orders.find(
        (o) => String(o.id) === String(orderId) && String(o.user_id) === String(userId) && o.status === 'pending',
      );
      if (!order) return { rows: [] };
      order.status = 'cancelled';
      return { rows: [{ id: order.id }] };
    }

    if (normalized.includes('from orders')) {
      const isVendor = normalized.includes('p.vendor_user_id');
      const filterValue = params[0];
      const matched = this.orders.filter((o) => {
        const items = this.orderItems.filter((oi) => oi.order_id === o.id);
        if (isVendor) {
          return items.some((oi) => String(oi.vendor_user_id) === String(filterValue));
        }
        return String(o.user_id) === String(filterValue);
      });

      const rows: Array<Record<string, unknown>> = [];
      for (const o of matched) {
        const items = this.orderItems.filter((oi) => oi.order_id === o.id);
        for (const it of items) {
          rows.push({
            order_id: o.id,
            customer_id: o.user_id,
            total_amount: o.total_amount,
            currency: o.currency,
            status: o.status,
            created_at: o.created_at,
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: it.quantity,
            unit_price: it.unit_price,
            vendor_user_id: it.vendor_user_id,
          });
        }
      }
      return { rows };
    }

    if (normalized.includes('insert into product_reviews')) {
      const [productId, userId, rating, title, body] = params as [string, string, number, string | null, string | null];
      const existingIndex = this.productReviews.findIndex(
        (r) => String(r.product_id) === String(productId) && String(r.user_id) === String(userId),
      );
      const row = {
        id: existingIndex > -1 ? this.productReviews[existingIndex]!.id : `review-${this.productReviews.length + 1}`,
        product_id: productId,
        user_id: userId,
        rating,
        title: title ?? null,
        body: body ?? null,
        created_at: new Date().toISOString(),
      };
      if (existingIndex > -1) this.productReviews[existingIndex] = row;
      else this.productReviews.push(row);
      return { rows: [row] };
    }

    if (normalized.includes('from product_reviews')) {
      const [productId] = params as [string];
      const matches = this.productReviews.filter((r) => String(r.product_id) === String(productId));

      if (normalized.includes('count(*)')) {
        const count = matches.length;
        const average = count > 0 ? matches.reduce((sum, r) => sum + Number(r.rating), 0) / count : 0;
        return { rows: [{ count, average }] };
      }

      const rows = matches
        .slice()
        .sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())
        .map((r) => ({ ...r, author_name: null }));
      return { rows };
    }

    return { rows: [] };
  }
}

class FallbackPool implements DbPoolLike {
  private active: DbPoolLike;
  private fallback: DbPoolLike;
  private usingFallback = false;

  constructor(primary: DbPoolLike, fallback: DbPoolLike) {
    this.active = primary;
    this.fallback = fallback;
  }

  async query(text: string, params?: unknown[]) {
    if (this.usingFallback) {
      return this.fallback.query(text, params);
    }

    try {
      return await this.active.query(text, params);
    } catch (error) {
      console.warn('Database query failed, falling back to in-memory store.', error);
      this.usingFallback = true;
      return this.fallback.query(text, params);
    }
  }
}

export function getPool(): DbPoolLike {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    pool = new InMemoryPool();
    return pool;
  }

  const primaryPool = new Pool({
    connectionString: databaseUrl,
    max: 5,
  });

  pool = new FallbackPool(primaryPool as DbPoolLike, new InMemoryPool());
  return pool;
}
