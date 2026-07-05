import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL');
  }

  pool = new Pool({
    connectionString: databaseUrl,
    // Neon works well with a small pool; keep it small.
    max: 5,
  });

  return pool;
}

