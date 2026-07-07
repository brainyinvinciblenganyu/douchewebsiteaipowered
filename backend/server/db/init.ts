import fs from 'fs';
import path from 'path';
import { getPool } from './client.js';

export async function initDatabase() {
  try {
    const pool = getPool();
    const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn(`Schema file not found at ${schemaPath}. Skipping database init.`);
      return;
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Initializing database schema...');
    await pool.query(schemaSql);
    console.log('✓ Database schema initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
  }
}
