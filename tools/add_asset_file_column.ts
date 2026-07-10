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
    const sql = `ALTER TABLE products ADD COLUMN IF NOT EXISTS asset_file bytea;`;
    console.log('Running:', sql);
    await pool.query(sql);
    console.log('Column asset_file added (or already existed).');
    await pool.end();
  } catch (err) {
    console.error('Error adding asset_file column', err);
    process.exit(1);
  }
}

main();
