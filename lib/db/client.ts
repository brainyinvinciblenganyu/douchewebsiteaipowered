import pg from 'pg';

interface DbPoolLike {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
}

const { Pool } = pg as { Pool: new (options?: Record<string, unknown>) => DbPoolLike };

let pool: DbPoolLike | null = null;

class InMemoryUserPool implements DbPoolLike {
  private users: Array<Record<string, unknown>> = [];

  async query(text: string, params: unknown[] = []) {
    const normalized = text.trim().toLowerCase();

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

    return { rows: [] };
  }
}

export function getPool(): DbPoolLike {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    pool = new InMemoryUserPool();
    return pool;
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
  });

  return pool;
}
