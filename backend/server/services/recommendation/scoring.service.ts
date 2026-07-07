import { type ShoppingProfile } from './profile.service.js';
import { type Product } from '../../../../lib/mockData.js';

// Define complementary items for e-commerce cross-sell rules
const COMPLEMENTARY_MAP: Record<string, string[]> = {
  'Furniture': ['Furniture', '3D Tech'],
  'Fashion': ['Fashion', 'Lifestyle'],
  'Lifestyle': ['Fashion', 'Furniture', '3D Tech'],
  '3D Tech': ['Furniture', 'Lifestyle'],
};

export function scoreSearchMatch(product: Product, recentSearches: string[]): number {
  if (!recentSearches.length) return 0;
  let points = 0;
  const nameLower = product.name.toLowerCase();
  const descLower = product.description.toLowerCase();
  const catLower = product.category.toLowerCase();
  const tags = product.tags || [];

  for (const search of recentSearches) {
    const sLower = search.toLowerCase().trim();
    if (!sLower) continue;

    if (nameLower.includes(sLower)) points += 25;
    else if (catLower.includes(sLower)) points += 20;
    else if (tags.some((t) => t.toLowerCase().includes(sLower))) points += 15;
    else if (descLower.includes(sLower)) points += 10;
  }

  // Cap search match points to avoid query flooding
  return Math.min(points, 40);
}

export function scoreCategoryMatch(product: Product, favoriteCategories: ShoppingProfile['favoriteCategories']): number {
  if (!favoriteCategories.length) return 0;
  
  // Top favorite category gets 40 points
  if (product.category === favoriteCategories[0].category) {
    return 40;
  }
  // Second gets 20 points
  if (favoriteCategories[1] && product.category === favoriteCategories[1].category) {
    return 20;
  }
  // Others get 10 points if they exist in history
  const inHistory = favoriteCategories.some((fc) => fc.category === product.category);
  return inHistory ? 10 : 0;
}

export function scorePurchaseHistory(product: Product, purchasedIds: number[], allProducts: Product[]): number {
  if (!purchasedIds.length) return 0;
  
  // If user already purchased this exact product, score it down unless consumable (not the case here)
  if (purchasedIds.includes(product.id)) {
    return -15; 
  }

  let points = 0;
  for (const id of purchasedIds) {
    const purchased = allProducts.find((p) => p.id === id);
    if (purchased) {
      const complementaryCats = COMPLEMENTARY_MAP[purchased.category] || [];
      if (complementaryCats.includes(product.category)) {
        points += 20;
      }
    }
  }

  return Math.min(points, 35);
}

export function scoreRecentlyViewed(product: Product, recentlyViewedIds: number[], allProducts: Product[]): number {
  if (!recentlyViewedIds.length) return 0;

  // Exact recently viewed matches get a slight boost to keep them accessible
  if (recentlyViewedIds.includes(product.id)) {
    return 15;
  }

  // Categories recently viewed get 10 points
  let points = 0;
  const recentCategories = new Set(
    recentlyViewedIds.map((id) => allProducts.find((p) => p.id === id)?.category).filter(Boolean)
  );

  if (recentCategories.has(product.category)) {
    points += 10;
  }

  return points;
}

export function scoreWishlist(product: Product, wishlistIds: number[]): number {
  if (wishlistIds.includes(product.id)) {
    return 30; // Priority boost for wishlist
  }
  return 0;
}

export function scoreCartCompatibility(product: Product, cartIds: number[], allProducts: Product[]): number {
  if (!cartIds.length) return 0;

  // If already in cart, score it down so we don't recommend a duplicate
  if (cartIds.includes(product.id)) {
    return -50;
  }

  let points = 0;
  for (const id of cartIds) {
    const cartProd = allProducts.find((p) => p.id === id);
    if (cartProd) {
      const complementaryCats = COMPLEMENTARY_MAP[cartProd.category] || [];
      if (complementaryCats.includes(product.category)) {
        points += 20; // Accessory/complementary match
      }
    }
  }

  return Math.min(points, 30);
}

export function scoreBrandPreference(product: Product, favoriteBrands: ShoppingProfile['favoriteBrands']): number {
  if (!favoriteBrands.length) return 0;

  // Top preferred brand gets 15 points
  if (product.vendorName === favoriteBrands[0].brand) {
    return 15;
  }
  
  const inHistory = favoriteBrands.some((fb) => fb.brand === product.vendorName);
  return inHistory ? 5 : 0;
}

export function scoreBudgetMatch(product: Product, range: ShoppingProfile['preferredPriceRange'], avgSpending: number): number {
  if (range.min === 0 && range.max === 0) return 10; // Default budget match for new profiles

  // Prefer products within range
  if (product.price >= range.min && product.price <= range.max) {
    return 10;
  }

  // Or close to average spending
  if (avgSpending > 0) {
    const diffPercent = Math.abs(product.price - avgSpending) / avgSpending;
    if (diffPercent <= 0.3) {
      return 8;
    }
  }

  return 2; // Outside budget match
}

export function scoreTrending(product: Product, trendingCounts: { productId: number; count: number }[]): number {
  let points = 0;

  // Add points based on product ratings (1-5 range)
  points += Math.round(product.rating * 3); // Max 15 points for rating

  // Add points based on global trending count in database
  const trend = trendingCounts.find((tc) => tc.productId === product.id);
  if (trend) {
    points += Math.min(trend.count * 2, 20); // Max 20 points for trend
  }

  return points;
}
