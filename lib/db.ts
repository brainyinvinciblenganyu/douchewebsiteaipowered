import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

function getDbPath() {
  // Create a local data folder inside the project so it persists across dev runs.
  return path.join(process.cwd(), 'data', 'douche.sqlite');
}

export function getDb() {
  if (db) return db;

  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  initSchema(db);
  return db;
}

function initSchema(dbConn: Database.Database) {
  // Orders
  dbConn.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

  // Order items
  dbConn.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
  `);

  // Helpful indexes for trending queries
  dbConn.exec(`
    CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
  `);
}

