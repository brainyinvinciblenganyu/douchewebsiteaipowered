import fs from 'fs';
import path from 'path';
import pg from 'pg';

function loadEnv() {
  const envPath = path.join(process.cwd(), 'backend', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

async function main() {
  try {
    loadEnv();
    if (!process.env.DATABASE_URL) {
      console.error('No DATABASE_URL found in backend/.env.local');
      process.exit(2);
    }

    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
    const res = await pool.query(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_name = 'products'
       ORDER BY ordinal_position`
    );
    console.log('products table columns:');
    console.table(res.rows);
    await pool.end();
  } catch (err) {
    console.error('Error inspecting products columns', err);
    process.exit(1);
  }
}

main();
