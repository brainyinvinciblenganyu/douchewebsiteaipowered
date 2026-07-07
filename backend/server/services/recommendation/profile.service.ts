import { getInteractions } from '../../repositories/recommendation.repository.js';
import { products } from '../../../../lib/mockData.js';

export interface ShoppingProfile {
  favoriteCategories: { category: string; count: number }[];
  favoriteBrands: { brand: string; count: number }[];
  recentSearches: string[];
  recentlyViewedProductIds: number[];
  purchaseHistoryIds: number[];
  averageSpending: number;
  preferredPriceRange: { min: number; max: number };
  wishlistProductIds: number[];
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
    shoppingFrequency: 'new',
  };

  if (!userId) return defaultProfile;

  const interactions = await getInteractions(userId, 200);
  if (!interactions.length) return defaultProfile;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  // Brand counts
  const brandCounts: Record<string, number> = {};
  // Unique sets/lists
  const recentSearches = new Set<string>();
  const recentlyViewedProductIds = new Set<number>();
  const purchaseHistoryIds = new Set<number>();
  const wishlistProductIds = new Set<number>();

  let totalPurchaseCents = 0;
  let purchaseCount = 0;

  // Replay wishlist in chronological order (oldest to newest)
  const chronological = [...interactions].reverse();
  for (const row of chronological) {
    if (row.event_type === 'wishlist_add' && row.product_id) {
      wishlistProductIds.add(row.product_id);
    } else if (row.event_type === 'wishlist_remove' && row.product_id) {
      wishlistProductIds.delete(row.product_id);
    }
  }

  // Prices of all products user interacted with to compute budget / preferred price range
  const interactedPrices: number[] = [];

  for (const row of interactions) {
    // Categories and Brands can be derived from the product mockData if row.product_id is present
    let category = row.category;
    let brand = row.brand;

    if (row.product_id) {
      const prod = products.find((p) => p.id === row.product_id);
      if (prod) {
        category = category || prod.category;
        brand = brand || prod.vendorName;
        interactedPrices.push(prod.price);
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
      const prod = products.find((p) => p.id === row.product_id);
      if (prod) {
        totalPurchaseCents += prod.price * 100;
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
    shoppingFrequency,
  };
}
