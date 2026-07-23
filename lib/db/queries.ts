import { getPool } from './client';

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  role: 'customer' | 'vendor' | 'admin';
  name: string | null;
  company_name: string | null;
  location: string | null;
  is_active: boolean;
  totp_secret: string | null;
  totp_enabled: boolean;
  totp_recovery_codes: string[] | null;
  avatar_data: string | null;
  created_at: string;
};

export type DbProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  price: number;
  currency: string;
  vendor_user_id: string | null;
  asset_name: string | null;
  asset_type: string | null;
  asset_size: number | null;
  asset_data: string | null;
  // Stored in Postgres as `bytea`.
  asset_file: Buffer | null;
  image_data: string | null;
  status: string;
  stock_quantity: number;
  created_at: string;
};

const USER_COLUMNS = 'id, email, password_hash, role, name, company_name, location, is_active, totp_secret, totp_enabled, totp_recovery_codes, avatar_data, created_at';

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  return (res.rows[0] as DbUser | undefined) ?? null;
}

export async function createUser(params: {
  email: string;
  password_hash: string;
  role: 'customer' | 'vendor' | 'admin';
  name?: string | null;
  company_name?: string | null;
  location?: string | null;
}): Promise<DbUser> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, company_name, location)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${USER_COLUMNS}`,
    [
      params.email,
      params.password_hash,
      params.role,
      params.name ?? null,
      params.company_name ?? null,
      params.location ?? null,
    ],
  );
  return res.rows[0] as DbUser;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return (res.rows[0] as DbUser | undefined) ?? null;
}

export async function updateUserProfile(
  userId: string,
  patch: { name?: string | null; company_name?: string | null; location?: string | null; avatar_data?: string | null },
): Promise<DbUser | null> {
  const pool = getPool();

  const fields: Array<{ key: string; value: unknown }> = [];
  const pushIfDefined = (key: string, value: unknown) => {
    if (typeof value === 'undefined') return;
    fields.push({ key, value });
  };

  pushIfDefined('name', patch.name);
  pushIfDefined('company_name', patch.company_name);
  pushIfDefined('location', patch.location);
  pushIfDefined('avatar_data', patch.avatar_data);

  if (fields.length === 0) return findUserById(userId);

  const res = await pool.query(
    `UPDATE users SET ${fields.map((f, idx) => `${f.key} = $${idx + 2}`).join(', ')}
     WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [userId, ...fields.map((f) => f.value)],
  );
  return (res.rows[0] as DbUser | undefined) ?? null;
}

export async function createSessionRecord(
  userId: string,
  ttlSeconds: number,
): Promise<{ id: string } | null> {
  const pool = getPool();
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const res = await pool.query(
      `INSERT INTO sessions (user_id, expires_at) VALUES ($1, $2) RETURNING id`,
      [userId, expiresAt],
    );
    const row = res.rows[0] as { id?: string } | undefined;
    return row?.id ? { id: row.id } : null;
  } catch (error) {
    console.warn('createSessionRecord failed (non-fatal, login still succeeds):', error);
    return null;
  }
}

export async function revokeSessionRecord(sessionId: string): Promise<void> {
  const pool = getPool();
  try {
    await pool.query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [sessionId]);
  } catch (error) {
    console.warn('revokeSessionRecord failed (non-fatal):', error);
  }
}

export async function createProduct(params: {
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  price: number;
  currency?: string;
  vendor_user_id?: string | null;
  asset_name?: string | null;
  asset_type?: string | null;
  asset_size?: number | null;
  asset_data?: string | null;
  asset_file?: Buffer | null;
  image_data?: string | null;
  status?: string;
  stock_quantity?: number;
}): Promise<DbProduct> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO products (name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity, created_at`,
    [
      params.name?.trim() || 'Untitled product',
      params.description ?? null,
      params.category ?? null,
      params.tags ?? [],
      params.price,
      params.currency ?? 'FCFA',
      params.vendor_user_id ?? null,
      params.asset_name ?? null,
      params.asset_type ?? null,
      params.asset_size ?? null,
      params.asset_data ?? null,
      params.asset_file ?? null,
      params.image_data ?? null,
      params.status ?? 'pending_review',
      params.stock_quantity ?? 0,
    ],
  );
  return res.rows[0] as DbProduct;
}

export async function listProducts(options?: {
  vendorUserId?: string | null;
}): Promise<DbProduct[]> {
  const pool = getPool();

  const vendorUserId = options?.vendorUserId?.toString().trim() || null;
  // The public/customer-facing path (no vendorUserId) only ever shows approved
  // products. A vendor viewing their own catalog sees every status (draft,
  // pending_review, published, archived) so they can track their submissions.
  const queryText = vendorUserId
    ? `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity, created_at
       FROM products WHERE vendor_user_id = $1 ORDER BY created_at DESC`
    : `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity, created_at
       FROM products WHERE status = 'published' ORDER BY created_at DESC`;

  const res = await pool.query(queryText, vendorUserId ? [vendorUserId] : []);
  return (res.rows ?? []) as DbProduct[];
}

export async function deleteProduct(
  productId: string,
  vendorUserId: string,
): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    `DELETE FROM products
     WHERE id = $1
       AND vendor_user_id = $2
     RETURNING id`,
    [productId, vendorUserId],
  );
  return (res.rows?.length ?? 0) > 0;
}

export async function getProductByIdForVendor(
  productId: string,
  vendorUserId: string,
): Promise<DbProduct | null> {
  const pool = getPool();
  try {
    const res = await pool.query(
      `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity, created_at
       FROM products
       WHERE id = $1 AND vendor_user_id = $2
       LIMIT 1`,
      [productId, vendorUserId],
    );
    return (res.rows[0] as DbProduct | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function updateProduct(
  productId: string,
  vendorUserId: string,
  patch: {
    name?: string;
    description?: string | null;
    category?: string | null;
    tags?: string[];
    price?: number;
    currency?: string;
    status?: string;
    asset_name?: string | null;
    asset_type?: string | null;
    asset_size?: number | null;
    asset_data?: string | null;
    asset_file?: Buffer | null;
    image_data?: string | null;
    stock_quantity?: number;
  },
): Promise<DbProduct | null> {
  const pool = getPool();

  const fields: Array<{ key: string; value: unknown }> = [];
  const pushIfDefined = (key: string, value: unknown) => {
    if (typeof value === 'undefined') return;
    fields.push({ key, value });
  };

  pushIfDefined('name', patch.name);
  pushIfDefined('description', patch.description);
  pushIfDefined('category', patch.category);
  pushIfDefined('tags', patch.tags);
  pushIfDefined('price', patch.price);
  pushIfDefined('currency', patch.currency);
  pushIfDefined('status', patch.status);
  pushIfDefined('asset_name', patch.asset_name);
  pushIfDefined('asset_type', patch.asset_type);
  pushIfDefined('asset_size', patch.asset_size);
  pushIfDefined('asset_data', patch.asset_data);
  pushIfDefined('asset_file', patch.asset_file);
  pushIfDefined('image_data', patch.image_data);
  pushIfDefined('stock_quantity', patch.stock_quantity);

  if (fields.length === 0) {
    return getProductByIdForVendor(productId, vendorUserId);
  }

  const queryText = `
    UPDATE products
    SET
      ${fields
        .map((f, idx) => `${f.key} = $${idx + 3}`)
        .join(', ')}
    WHERE id = $1
      AND vendor_user_id = $2
    RETURNING id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity, created_at
  `;

  const values = [productId, vendorUserId, ...fields.map((f) => f.value)];

  const res = await pool.query(queryText, values);
  return (res.rows[0] as DbProduct | undefined) ?? null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProductById(id: string): Promise<DbProduct | null> {
  if (!UUID_RE.test(id)) return null;
  const pool = getPool();
  try {
    const res = await pool.query(
      `SELECT id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity, created_at
       FROM products WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (res.rows[0] as DbProduct | undefined) ?? null;
  } catch {
    return null;
  }
}

export type DbOrderItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  vendorUserId: string | null;
};

export type DbOrder = {
  id: string;
  userId: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: DbOrderItem[];
};

function groupOrderRows(rows: Array<Record<string, unknown>>): DbOrder[] {
  const map = new Map<string, DbOrder>();

  for (const r of rows) {
    const id = String(r.order_id);
    let order = map.get(id);
    if (!order) {
      order = {
        id,
        userId: (r.customer_id ?? null) as string | null,
        totalAmount: Number(r.total_amount ?? 0),
        currency: String(r.currency ?? 'FCFA'),
        status: String(r.status ?? 'paid'),
        createdAt: String(r.created_at),
        items: [],
      };
      map.set(id, order);
    }

    order.items.push({
      productId: r.product_id != null ? String(r.product_id) : null,
      productName: String(r.product_name ?? 'Unknown product'),
      quantity: Number(r.quantity ?? 0),
      unitPrice: Number(r.unit_price ?? 0),
      vendorUserId: r.vendor_user_id != null ? String(r.vendor_user_id) : null,
    });
  }

  return Array.from(map.values());
}

export async function createOrder(params: {
  userId: string | null;
  totalAmount: number;
  currency: string;
  status?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}): Promise<DbOrder> {
  const pool = getPool();
  const status = params.status ?? 'paid';

  const res = await pool.query(
    `INSERT INTO orders (user_id, total_amount, currency, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, total_amount, currency, status, created_at`,
    [params.userId, params.totalAmount, params.currency, status],
  );

  const order = res.rows[0];

  for (const it of params.items) {
    const pid = String(it.productId);
    const product = UUID_RE.test(pid) ? await getProductById(pid) : null;

    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        order.id,
        product ? pid : null,
        product?.name ?? 'Unknown product',
        Number(it.quantity),
        Number(it.unitPrice),
        new Date().toISOString(),
      ],
    );
  }

  return {
    id: String(order.id),
    userId: (order.user_id ?? null) as string | null,
    totalAmount: Number(order.total_amount),
    currency: String(order.currency),
    status: String(order.status),
    createdAt: String(order.created_at),
    items: [],
  };
}

export async function getOrdersForVendor(vendorUserId: string): Promise<DbOrder[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT o.id AS order_id, o.user_id AS customer_id, o.total_amount, o.currency, o.status, o.created_at,
            oi.product_id, oi.product_name, oi.quantity, oi.unit_price,
            p.vendor_user_id
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     WHERE p.vendor_user_id = $1
     ORDER BY o.created_at DESC`,
    [vendorUserId],
  );
  return groupOrderRows(res.rows as Array<Record<string, unknown>>);
}

export type VendorCustomer = {
  id: string;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

export async function listCustomersForVendor(vendorUserId: string): Promise<VendorCustomer[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT u.id, u.name, u.email,
            COUNT(DISTINCT o.id)::int AS order_count,
            COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS total_spent,
            MAX(o.created_at) AS last_order_at
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     JOIN users u ON u.id = o.user_id
     WHERE p.vendor_user_id = $1
     GROUP BY u.id, u.name, u.email
     ORDER BY last_order_at DESC`,
    [vendorUserId],
  );

  return (res.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: (row.name as string | null) ?? null,
    email: String(row.email),
    orderCount: Number(row.order_count ?? 0),
    totalSpent: Number(row.total_spent ?? 0),
    lastOrderAt: String(row.last_order_at),
  }));
}

export async function getOrdersForCustomer(userId: string): Promise<DbOrder[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT o.id AS order_id, o.user_id AS customer_id, o.total_amount, o.currency, o.status, o.created_at,
            oi.product_id, oi.product_name, oi.quantity, oi.unit_price
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId],
  );
  return groupOrderRows(res.rows as Array<Record<string, unknown>>);
}

// Customers can only drop their own order, and only while it's still pending
// (nothing to "cancel" once a vendor has already started fulfilling it).
export async function cancelOrderForCustomer(orderId: string, userId: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE orders
     SET status = 'cancelled'
     WHERE id = $1 AND user_id = $2 AND status = 'pending'
     RETURNING id`,
    [orderId, userId],
  );
  return (res.rows?.length ?? 0) > 0;
}

export type DbProductReview = {
  id: string;
  productId: string;
  userId: string | null;
  authorName: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
};

export type RatingSummary = {
  average: number;
  count: number;
};

export async function getRatingSummary(productId: string): Promise<RatingSummary> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
     FROM product_reviews
     WHERE product_id = $1`,
    [productId],
  );
  const row = res.rows[0] as { count?: number; average?: number } | undefined;
  return {
    count: Number(row?.count ?? 0),
    average: Number(row?.average ?? 0),
  };
}

export async function getRatingSummariesForProducts(
  productIds: string[],
): Promise<Map<string, RatingSummary>> {
  const map = new Map<string, RatingSummary>();
  if (productIds.length === 0) return map;

  const pool = getPool();
  const res = await pool.query(
    `SELECT product_id, COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
     FROM product_reviews
     WHERE product_id = ANY($1::uuid[])
     GROUP BY product_id`,
    [productIds],
  );

  for (const row of res.rows as Array<{ product_id: string; count: number; average: number }>) {
    map.set(String(row.product_id), { count: Number(row.count), average: Number(row.average) });
  }
  return map;
}

export async function getReviewsForProduct(productId: string): Promise<DbProductReview[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT r.id, r.product_id, r.user_id, u.name AS author_name, r.rating, r.title, r.body, r.created_at
     FROM product_reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId],
  );
  return (res.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    productId: String(row.product_id),
    userId: row.user_id != null ? String(row.user_id) : null,
    authorName: (row.author_name as string | null) ?? null,
    rating: Number(row.rating),
    title: (row.title as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}

export async function upsertReview(params: {
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  body?: string | null;
}): Promise<DbProductReview> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO product_reviews (product_id, user_id, rating, title, body)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id) DO UPDATE
       SET rating = EXCLUDED.rating,
           title = EXCLUDED.title,
           body = EXCLUDED.body,
           created_at = now()
     RETURNING id, product_id, user_id, rating, title, body, created_at`,
    [params.productId, params.userId, params.rating, params.title ?? null, params.body ?? null],
  );
  const row = res.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    productId: String(row.product_id),
    userId: row.user_id != null ? String(row.user_id) : null,
    authorName: null,
    rating: Number(row.rating),
    title: (row.title as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export type DbEmailMessage = {
  id: string;
  contactEmail: string;
  contactName: string | null;
  direction: 'inbound' | 'outbound';
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  messageId: string | null;
  source: 'imap' | 'contact_form' | 'admin_reply';
  isRead: boolean;
  createdAt: string;
};

export type EmailConversationSummary = {
  contactEmail: string;
  contactName: string | null;
  lastSubject: string | null;
  lastPreview: string | null;
  lastDirection: 'inbound' | 'outbound';
  lastCreatedAt: string;
  unreadCount: number;
};

function mapEmailMessageRow(row: Record<string, unknown>): DbEmailMessage {
  return {
    id: String(row.id),
    contactEmail: String(row.contact_email),
    contactName: (row.contact_name as string | null) ?? null,
    direction: row.direction as 'inbound' | 'outbound',
    subject: (row.subject as string | null) ?? null,
    bodyText: (row.body_text as string | null) ?? null,
    bodyHtml: (row.body_html as string | null) ?? null,
    messageId: (row.message_id as string | null) ?? null,
    source: row.source as 'imap' | 'contact_form' | 'admin_reply',
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}

export async function listEmailConversations(): Promise<EmailConversationSummary[]> {
  const pool = getPool();

  const latest = await pool.query(
    `SELECT DISTINCT ON (contact_email) contact_email, contact_name, subject, body_text, direction, created_at
     FROM email_messages
     ORDER BY contact_email, created_at DESC`,
  );

  const unread = await pool.query(
    `SELECT contact_email, COUNT(*)::int AS unread_count
     FROM email_messages
     WHERE direction = 'inbound' AND is_read = false
     GROUP BY contact_email`,
  );

  const unreadByEmail = new Map<string, number>();
  for (const row of unread.rows as Array<{ contact_email: string; unread_count: number }>) {
    unreadByEmail.set(row.contact_email, Number(row.unread_count));
  }

  const conversations = (latest.rows as Array<Record<string, unknown>>).map((row) => ({
    contactEmail: String(row.contact_email),
    contactName: (row.contact_name as string | null) ?? null,
    lastSubject: (row.subject as string | null) ?? null,
    lastPreview: (row.body_text as string | null) ?? null,
    lastDirection: row.direction as 'inbound' | 'outbound',
    lastCreatedAt: String(row.created_at),
    unreadCount: unreadByEmail.get(String(row.contact_email)) ?? 0,
  }));

  conversations.sort((a, b) => (a.lastCreatedAt < b.lastCreatedAt ? 1 : -1));
  return conversations;
}

export async function getEmailThread(contactEmail: string): Promise<DbEmailMessage[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, contact_email, contact_name, direction, subject, body_text, body_html, message_id, source, is_read, created_at
     FROM email_messages
     WHERE contact_email = $1
     ORDER BY created_at ASC`,
    [contactEmail],
  );
  return (res.rows as Array<Record<string, unknown>>).map(mapEmailMessageRow);
}

export async function insertEmailMessage(params: {
  contactEmail: string;
  contactName?: string | null;
  direction: 'inbound' | 'outbound';
  subject?: string | null;
  bodyText?: string | null;
  bodyHtml?: string | null;
  messageId?: string | null;
  source: 'imap' | 'contact_form' | 'admin_reply';
  isRead?: boolean;
}): Promise<DbEmailMessage> {
  const pool = getPool();
  const res = await pool.query(
    `INSERT INTO email_messages (contact_email, contact_name, direction, subject, body_text, body_html, message_id, source, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, contact_email, contact_name, direction, subject, body_text, body_html, message_id, source, is_read, created_at`,
    [
      params.contactEmail.trim().toLowerCase(),
      params.contactName ?? null,
      params.direction,
      params.subject ?? null,
      params.bodyText ?? null,
      params.bodyHtml ?? null,
      params.messageId ?? null,
      params.source,
      params.isRead ?? params.direction === 'outbound',
    ],
  );
  return mapEmailMessageRow(res.rows[0] as Record<string, unknown>);
}

export async function emailMessageExistsByMessageId(messageId: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT 1 FROM email_messages WHERE message_id = $1 LIMIT 1`,
    [messageId],
  );
  return (res.rows?.length ?? 0) > 0;
}

export async function markEmailThreadRead(contactEmail: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE email_messages SET is_read = true WHERE contact_email = $1 AND direction = 'inbound' AND is_read = false`,
    [contactEmail.trim().toLowerCase()],
  );
}

// Messages submitted through the public Contact page (see contact.routes.ts,
// which writes these with source = 'contact_form'). Read-only for admins —
// no reply/send flow, unlike the old email inbox.
export async function listContactMessages(): Promise<DbEmailMessage[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, contact_email, contact_name, direction, subject, body_text, body_html, message_id, source, is_read, created_at
     FROM email_messages
     WHERE source = 'contact_form'
     ORDER BY created_at DESC`,
  );
  return (res.rows as Array<Record<string, unknown>>).map(mapEmailMessageRow);
}

export async function markContactMessageRead(id: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE email_messages SET is_read = true WHERE id = $1 AND source = 'contact_form' RETURNING id`,
    [id],
  );
  return (res.rows?.length ?? 0) > 0;
}

// ---- Admin panel ----

export type VendorSummary = {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  location: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
};

export async function listVendors(): Promise<VendorSummary[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT u.id, u.email, u.name, u.company_name, u.location, u.is_active, u.created_at,
            COUNT(p.id)::int AS product_count
     FROM users u
     LEFT JOIN products p ON p.vendor_user_id = u.id
     WHERE u.role = 'vendor'
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
  );

  return (res.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    email: String(row.email),
    name: (row.name as string | null) ?? null,
    companyName: (row.company_name as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    isActive: Boolean(row.is_active),
    productCount: Number(row.product_count ?? 0),
    createdAt: String(row.created_at),
  }));
}

export async function setVendorActive(vendorId: string, isActive: boolean): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE users SET is_active = $2 WHERE id = $1 AND role = 'vendor' RETURNING id`,
    [vendorId, isActive],
  );
  return (res.rows?.length ?? 0) > 0;
}

export type PendingProduct = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  currency: string;
  vendorUserId: string | null;
  vendorName: string | null;
  vendorEmail: string | null;
  createdAt: string;
};

export async function listPendingProducts(): Promise<PendingProduct[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT p.id, p.name, p.category, p.price, p.currency, p.vendor_user_id, p.created_at,
            u.name AS vendor_name, u.email AS vendor_email
     FROM products p
     LEFT JOIN users u ON u.id = p.vendor_user_id
     WHERE p.status = 'pending_review'
     ORDER BY p.created_at ASC`,
  );

  return (res.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    category: (row.category as string | null) ?? null,
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? 'FCFA'),
    vendorUserId: row.vendor_user_id != null ? String(row.vendor_user_id) : null,
    vendorName: (row.vendor_name as string | null) ?? null,
    vendorEmail: (row.vendor_email as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}

export async function setProductStatus(
  productId: string,
  status: 'published' | 'archived',
): Promise<DbProduct | null> {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE products SET status = $2
     WHERE id = $1
     RETURNING id, name, description, category, tags, price, currency, vendor_user_id, asset_name, asset_type, asset_size, asset_data, asset_file, image_data, status, stock_quantity, created_at`,
    [productId, status],
  );
  return (res.rows[0] as DbProduct | undefined) ?? null;
}

export type AdminTransaction = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  itemCount: number;
  createdAt: string;
};

export async function listAllTransactions(): Promise<AdminTransaction[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT o.id, o.user_id AS customer_id, o.total_amount, o.currency, o.status, o.created_at,
            u.name AS customer_name, u.email AS customer_email,
            COUNT(oi.id)::int AS item_count
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id, u.name, u.email
     ORDER BY o.created_at DESC`,
  );

  return (res.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    customerName: (row.customer_name as string | null) ?? null,
    customerEmail: (row.customer_email as string | null) ?? null,
    totalAmount: Number(row.total_amount ?? 0),
    currency: String(row.currency ?? 'FCFA'),
    status: String(row.status ?? 'pending'),
    itemCount: Number(row.item_count ?? 0),
    createdAt: String(row.created_at),
  }));
}

// ---- Admin auth hardening: rate limiting, audit log, TOTP ----

export async function recordAdminLoginAttempt(params: {
  identifier: string;
  ip: string | null;
  succeeded: boolean;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO admin_login_attempts (identifier, ip, succeeded) VALUES ($1, $2, $3)`,
    [params.identifier.trim().toLowerCase(), params.ip, params.succeeded],
  );
}

export async function countRecentFailedAttempts(params: {
  identifier: string;
  ip: string | null;
  windowMinutes: number;
}): Promise<{ byIdentifier: number; byIp: number }> {
  const pool = getPool();
  const identifier = params.identifier.trim().toLowerCase();

  const byIdentifierRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM admin_login_attempts
     WHERE identifier = $1 AND succeeded = false AND created_at > now() - ($2 || ' minutes')::interval`,
    [identifier, params.windowMinutes],
  );

  const byIpRes = params.ip
    ? await pool.query(
        `SELECT COUNT(*)::int AS count FROM admin_login_attempts
         WHERE ip = $1 AND succeeded = false AND created_at > now() - ($2 || ' minutes')::interval`,
        [params.ip, params.windowMinutes],
      )
    : null;

  return {
    byIdentifier: Number((byIdentifierRes.rows[0] as { count?: number } | undefined)?.count ?? 0),
    byIp: Number((byIpRes?.rows[0] as { count?: number } | undefined)?.count ?? 0),
  };
}

export async function enableTotp(params: {
  userId: string;
  secret: string;
  recoveryCodes: string[];
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE users SET totp_secret = $2, totp_enabled = true, totp_recovery_codes = $3 WHERE id = $1`,
    [params.userId, params.secret, params.recoveryCodes],
  );
}

export async function consumeRecoveryCode(userId: string, hashedCode: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query(
    `UPDATE users SET totp_recovery_codes = array_remove(totp_recovery_codes, $2)
     WHERE id = $1 AND totp_recovery_codes @> ARRAY[$2]::text[]
     RETURNING id`,
    [userId, hashedCode],
  );
  return (res.rows?.length ?? 0) > 0;
}

export type AuditLogEntry = {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
};

export async function recordAuditLog(params: {
  adminId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, metadata, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.adminId,
      params.action,
      params.targetType ?? null,
      params.targetId ?? null,
      JSON.stringify(params.metadata ?? {}),
      params.ip ?? null,
    ],
  );
}

export async function listAuditLog(limit = 200): Promise<AuditLogEntry[]> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT a.id, a.admin_id, u.email AS admin_email, a.action, a.target_type, a.target_id, a.metadata, a.ip, a.created_at
     FROM admin_audit_log a
     LEFT JOIN users u ON u.id = a.admin_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit],
  );

  return (res.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    adminId: row.admin_id != null ? String(row.admin_id) : null,
    adminEmail: (row.admin_email as string | null) ?? null,
    action: String(row.action),
    targetType: (row.target_type as string | null) ?? null,
    targetId: (row.target_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    ip: (row.ip as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}

// Counts only — safe to expose on a public, unauthenticated endpoint (no
// vendor emails/PII, unlike listVendors).
export async function getPublicStats(): Promise<{ productCount: number; vendorCount: number }> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM products WHERE status = 'published') AS product_count,
       (SELECT COUNT(*)::int FROM users WHERE role = 'vendor' AND is_active = true) AS vendor_count`,
  );
  const row = (res.rows[0] as Record<string, unknown>) ?? {};
  return {
    productCount: Number(row.product_count ?? 0),
    vendorCount: Number(row.vendor_count ?? 0),
  };
}

