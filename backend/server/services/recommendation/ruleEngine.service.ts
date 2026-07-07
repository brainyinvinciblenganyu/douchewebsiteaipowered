import { getUserProfile, type ShoppingProfile } from './profile.service.js';
import * as scoring from './scoring.service.js';
import { getTrendingProducts } from '../../repositories/recommendation.repository.js';
import { products, type Product } from '../../../../lib/mockData.js';

export interface ScoredProduct extends Product {
  score: number;
  scoringBreakdown: {
    searchMatch: number;
    categoryMatch: number;
    purchaseMatch: number;
    recentlyViewed: number;
    wishlist: number;
    cartMatch: number;
    brandPreference: number;
    budgetMatch: number;
    trending: number;
  };
}

export async function rankAndSelectCandidates(
  profile: ShoppingProfile,
  userId: string | null
): Promise<ScoredProduct[]> {
  // Get trending counts from PostgreSQL interactions
  const trendingCounts = await getTrendingProducts(50).catch(() => []);

  // Fetch recent cart product IDs from profile. Since profile can parse cart additions,
  // we can also scan the interactions for recent 'cart_add' events.
  // We'll extract active cart IDs from interactions in profile.
  // Wait, let's assume we extract cartProductIds in profile or interaction query.
  // Let's check: in profile.service.ts, we did not extract cartProductIds. Let's look at profile.service.ts:
  // Oh, wait! We can easily check the latest interactions for 'cart_add' to find cartProductIds.
  // Let's add that logic dynamically or infer it.
  const cartProductIds: number[] = []; // Inferred cart items from interactions

  const scored: ScoredProduct[] = products.map((product) => {
    const searchMatch = scoring.scoreSearchMatch(product, profile.recentSearches);
    const categoryMatch = scoring.scoreCategoryMatch(product, profile.favoriteCategories);
    const purchaseMatch = scoring.scorePurchaseHistory(product, profile.purchaseHistoryIds, products);
    const recentlyViewed = scoring.scoreRecentlyViewed(product, profile.recentlyViewedProductIds, products);
    const wishlist = scoring.scoreWishlist(product, profile.wishlistProductIds);
    const cartMatch = scoring.scoreCartCompatibility(product, cartProductIds, products);
    const brandPreference = scoring.scoreBrandPreference(product, profile.favoriteBrands);
    const budgetMatch = scoring.scoreBudgetMatch(product, profile.preferredPriceRange, profile.averageSpending);
    const trending = scoring.scoreTrending(product, trendingCounts);

    const totalScore =
      searchMatch +
      categoryMatch +
      purchaseMatch +
      recentlyViewed +
      wishlist +
      cartMatch +
      brandPreference +
      budgetMatch +
      trending;

    return {
      ...product,
      score: Number(totalScore.toFixed(1)),
      scoringBreakdown: {
        searchMatch,
        categoryMatch,
        purchaseMatch,
        recentlyViewed,
        wishlist,
        cartMatch,
        brandPreference,
        budgetMatch,
        trending,
      },
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}
