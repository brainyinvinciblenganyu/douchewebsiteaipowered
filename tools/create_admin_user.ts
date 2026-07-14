import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { hashPassword } from '../lib/auth/password.js';

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
  const [, , email, password, name] = process.argv;

  if (!email || !password) {
    console.error('Usage: npx tsx tools/create_admin_user.ts <email> <password> [name]');
    process.exit(2);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(2);
  }

  loadEnv();
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL found in backend/.env.local');
    process.exit(2);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

  try {
    const existing = await pool.query('SELECT id, role FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      console.error(`A user with email ${normalizedEmail} already exists (role: ${existing.rows[0].role}).`);
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, 'admin', $3)
       RETURNING id, email, created_at`,
      [normalizedEmail, passwordHash, name ?? null],
    );

    console.log('Admin account created:');
    console.log(res.rows[0]);
    console.log('\nTOTP 2FA is not yet enabled for this account.');
    console.log('Log in at the admin route with this email/password — you will be prompted to scan a QR code and confirm a code to finish setup.');
  } catch (err) {
    console.error('Error creating admin user', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
