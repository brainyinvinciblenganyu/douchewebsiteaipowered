import { getPool } from '../db/client.js';

export interface UserInteractionRow {
  id: string;
  user_id: string | null;
  event_type: string;
  product_id: string | null;
  query: string | null;
  category: string | null;
  brand: string | null;
  rating: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RecommendationCacheRow {
  recommendations: Record<string, unknown>[];
  created_at: string;
  expires_at: string;
}

export async function getCachedRecommendations(userId: string | null, profileHash: string): Promise<RecommendationCacheRow | null> {
  if (!userId) return null;

  const pool = getPool();
  const queryText = `
    SELECT recommendations, created_at, expires_at
    FROM recommendation_cache
    WHERE user_id = $1
      AND profile_hash = $2
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const res = await pool.query(queryText, [userId, profileHash]);
  const row = res.rows[0] as unknown as RecommendationCacheRow | undefined;
  if (!row) return null;

  return {
    ...row,
    recommendations: Array.isArray(row.recommendations) ? (row.recommendations as Record<string, unknown>[]) : [],
  };
}

export async function setCachedRecommendations(userId: string | null, profileHash: string, recommendations: unknown[], ttlMinutes = 30): Promise<void> {
  if (!userId) return;

  const pool = getPool();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  await pool.query(
    `
      INSERT INTO recommendation_cache (user_id, profile_hash, recommendations, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, profile_hash) DO UPDATE
        SET recommendations = EXCLUDED.recommendations,
            created_at = now(),
            expires_at = EXCLUDED.expires_at
    `,
    [userId, profileHash, JSON.stringify(recommendations), expiresAt],
  );
}

export async function logInteraction(params: {
  userId: string | null;
  eventType: string;
  productId?: string | null;
  query?: string | null;
  category?: string | null;
  brand?: string | null;
  rating?: number | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const pool = getPool();
  const queryText = `
    INSERT INTO user_interactions (user_id, event_type, product_id, query, category, brand, rating, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  await pool.query(queryText, [
    params.userId,
    params.eventType,
    params.productId ?? null,
    params.query ?? null,
    params.category ?? null,
    params.brand ?? null,
    params.rating ?? null,
    JSON.stringify(params.metadata ?? {}),
  ]);
}

export async function getInteractions(userId: string, limit = 100): Promise<UserInteractionRow[]> {
  const pool = getPool();
  const queryText = `
    SELECT id, user_id, event_type, product_id, query, category, brand, rating, metadata::text, created_at
    FROM user_interactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;
  const res = await pool.query(queryText, [userId, limit]);
  return res.rows.map((row: any) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
  }));
}

export async function getTrendingProducts(limit = 10): Promise<{ productId: string; count: number }[]> {
  const pool = getPool();
  const queryText = `
    SELECT product_id, COUNT(*) as count
    FROM user_interactions
    WHERE product_id IS NOT NULL
    GROUP BY product_id
    ORDER BY count DESC
    LIMIT $1
  `;
  const res = await pool.query(queryText, [limit]);
  return res.rows.map((row: any) => ({
    productId: String(row.product_id),
    count: Number(row.count),
  }));
}

export async function getCollaborativeCandidates(
  userId: string,
  limit = 20,
): Promise<{ productId: string; coOccurrenceScore: number }[]> {
  const pool = getPool();
  // Item-based co-occurrence: find products this user positively engaged with,
  // find other users who share at least one of those products, then rank the
  // *other* products those similar users engaged with by how often they co-occur.
  const queryText = `
    WITH my_products AS (
      SELECT DISTINCT product_id
      FROM user_interactions
      WHERE user_id = $1
        AND product_id IS NOT NULL
        AND event_type IN ('view', 'cart_add', 'wishlist_add', 'purchase')
    ),
    similar_users AS (
      SELECT DISTINCT ui.user_id
      FROM user_interactions ui
      JOIN my_products mp ON mp.product_id = ui.product_id
      WHERE ui.user_id IS NOT NULL
        AND ui.user_id != $1
        AND ui.event_type IN ('view', 'cart_add', 'wishlist_add', 'purchase')
    )
    SELECT ui.product_id, COUNT(DISTINCT ui.user_id)::int AS co_occurrence_score
    FROM user_interactions ui
    JOIN similar_users su ON su.user_id = ui.user_id
    WHERE ui.product_id IS NOT NULL
      AND ui.product_id NOT IN (SELECT product_id FROM my_products)
      AND ui.event_type IN ('view', 'cart_add', 'wishlist_add', 'purchase')
    GROUP BY ui.product_id
    ORDER BY co_occurrence_score DESC
    LIMIT $2
  `;
  const res = await pool.query(queryText, [userId, limit]);
  return res.rows.map((row: any) => ({
    productId: String(row.product_id),
    coOccurrenceScore: Number(row.co_occurrence_score),
  }));
}
