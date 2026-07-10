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
  loadEnv();
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL found in backend/.env.local');
    process.exit(2);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const id = 'cc9b8617-2c55-48b9-9e21-e8970b2afd80';
  try {
    const res = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [id]);
    if (res.rows.length > 0) {
      console.log('Debug user already exists:', id);
      await pool.end();
      return;
    }

    console.log('Inserting debug vendor user', id);
    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, name, company_name)
       VALUES ($1, $2, $3, 'vendor', $4, $5)`,
      [id, 'debug+vendor@example.local', 'debug-hash', 'Debug Vendor', 'Debug Co'],
    );
    console.log('Inserted debug user.');
  } catch (err) {
    console.error('Error inserting debug user', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
