import { getInteractions } from '../../repositories/recommendation.repository.js';
import { listProducts, type DbProduct } from '../../../../lib/db/queries.js';

export interface ShoppingProfile {
  favoriteCategories: { category: string; count: number }[];
  // NOTE: "brand" here is the vendor's user id (vendor_user_id) — real products
  // don't have a separate brand field, vendor identity stands in for it.
  favoriteBrands: { brand: string; count: number }[];
  recentSearches: string[];
  recentlyViewedProductIds: string[];
  purchaseHistoryIds: string[];
  averageSpending: number;
  preferredPriceRange: { min: number; max: number };
  wishlistProductIds: string[];
  // Approximate "currently interested in buying" signal from recent cart_add
  // events. The schema has no cart-removal event type, so this can't perfectly
  // mirror the live cart — it's a recency-capped best-effort signal.
  recentCartProductIds: string[];
  shoppingFrequency: 'frequent' | 'moderate' | 'rare' | 'new';
}

export async function getUserProfile(userId: string | null): Promise<ShoppingProfile> {
  const defaultProfile: ShoppingProfile = {
    favoriteCategories: [],
    favoriteBrands: [],
    recentSearches: [],
    recentlyViewedProductIds: [],
    purchaseHistoryIds: [],
    averageSpending: 0,
    preferredPriceRange: { min: 0, max: 0 },
    wishlistProductIds: [],
    recentCartProductIds: [],
    shoppingFrequency: 'new',
  };

  if (!userId) return defaultProfile;

  const interactions = await getInteractions(userId, 200);
  if (!interactions.length) return defaultProfile;

  const catalog = await listProducts().catch(() => [] as DbProduct[]);
  const catalogById = new Map(catalog.map((p) => [p.id, p]));

  // Category counts
  const categoryCounts: Record<string, number> = {};
  // Brand (vendor) counts
  const brandCounts: Record<string, number> = {};
  // Unique sets/lists
  const recentSearches = new Set<string>();
  const recentlyViewedProductIds = new Set<string>();
  const purchaseHistoryIds = new Set<string>();
  const wishlistProductIds = new Set<string>();
  const recentCartProductIds = new Set<string>();

  let totalPurchaseCents = 0;
  let purchaseCount = 0;

  // Replay wishlist and recent cart adds in chronological order (oldest to newest)
  const chronological = [...interactions].reverse();
  for (const row of chronological) {
    if (row.event_type === 'wishlist_add' && row.product_id) {
      wishlistProductIds.add(row.product_id);
    } else if (row.event_type === 'wishlist_remove' && row.product_id) {
      wishlistProductIds.delete(row.product_id);
    } else if (row.event_type === 'cart_add' && row.product_id) {
      recentCartProductIds.add(row.product_id);
    }
  }

  // Prices of all products user interacted with to compute budget / preferred price range
  const interactedPrices: number[] = [];

  for (const row of interactions) {
    // Categories and vendor "brand" can be derived from the real catalog if row.product_id is present
    let category = row.category;
    let brand = row.brand;

    if (row.product_id) {
      const prod = catalogById.get(row.product_id);
      if (prod) {
        category = category || prod.category || null;
        brand = brand || prod.vendor_user_id || null;
        interactedPrices.push(Number(prod.price));
      }
    }

    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    if (brand) {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }

    if (row.event_type === 'search' && row.query) {
      recentSearches.add(row.query);
    }
    if (row.event_type === 'view' && row.product_id) {
      recentlyViewedProductIds.add(row.product_id);
    }
    if (row.event_type === 'purchase' && row.product_id) {
      purchaseHistoryIds.add(row.product_id);
      const prod = catalogById.get(row.product_id);
      if (prod) {
        totalPurchaseCents += Number(prod.price) * 100;
        purchaseCount += 1;
      }
    }
  }

  // Favorite categories sorted
  const favoriteCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Favorite brands sorted
  const favoriteBrands = Object.entries(brandCounts)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);

  // Spending habits
  const averageSpending = purchaseCount > 0 ? Math.round((totalPurchaseCents / purchaseCount) / 100) : 0;

  // Budget matching range
  let preferredPriceRange = { min: 0, max: 0 };
  if (interactedPrices.length > 0) {
    const min = Math.min(...interactedPrices);
    const max = Math.max(...interactedPrices);
    preferredPriceRange = { min, max };
  }

  // Shopping frequency
  const uniqueActiveDays = new Set<string>();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const row of interactions) {
    const date = new Date(row.created_at);
    if (date >= thirtyDaysAgo) {
      uniqueActiveDays.add(date.toDateString());
    }
  }

  let shoppingFrequency: ShoppingProfile['shoppingFrequency'] = 'new';
  if (uniqueActiveDays.size > 8) {
    shoppingFrequency = 'frequent';
  } else if (uniqueActiveDays.size > 2) {
    shoppingFrequency = 'moderate';
  } else if (uniqueActiveDays.size > 0) {
    shoppingFrequency = 'rare';
  }

  return {
    favoriteCategories,
    favoriteBrands,
    recentSearches: Array.from(recentSearches).slice(0, 10),
    recentlyViewedProductIds: Array.from(recentlyViewedProductIds).slice(0, 10),
    purchaseHistoryIds: Array.from(purchaseHistoryIds).slice(0, 10),
    averageSpending,
    preferredPriceRange,
    wishlistProductIds: Array.from(wishlistProductIds),
    recentCartProductIds: Array.from(recentCartProductIds).slice(0, 20),
    shoppingFrequency,
  };
}
