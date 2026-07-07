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
      const [name, description, category, tags, price, currency, vendorUserId, assetName, assetType, assetSize, assetData, assetFile, status] = params as [string, string | null, string | null, string[] | null, number, string, string | null, string | null, string | null, number | null, string | null, string | null, string | null];
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
