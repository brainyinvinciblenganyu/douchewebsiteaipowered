import { getUserProfile, type ShoppingProfile } from './profile.service.js';
import * as scoring from './scoring.service.js';
import { type ScorableProduct } from './scoring.service.js';
import { getCollaborativeCandidates, getTrendingProducts } from '../../repositories/recommendation.repository.js';
import { listProducts, getRatingSummariesForProducts } from '../../../../lib/db/queries.js';

export interface ScoredProduct extends ScorableProduct {
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
    collaborative: number;
  };
}

// Collaborative co-occurrence counts are unbounded and sparse on a small
// dataset; cap the per-product boost so it nudges the content-based score
// rather than dominating it while the dataset is thin.
const MAX_COLLABORATIVE_BOOST = 25;
const COLLABORATIVE_POINTS_PER_SIMILAR_USER = 5;

export async function rankAndSelectCandidates(
  profile: ShoppingProfile,
  userId: string | null,
): Promise<ScoredProduct[]> {
  const catalog = await listProducts().catch(() => []);
  if (catalog.length === 0) return [];

  const productIds = catalog.map((p) => p.id);

  const [trendingCounts, ratingSummaries, collaborativeCandidates] = await Promise.all([
    getTrendingProducts(50).catch(() => []),
    getRatingSummariesForProducts(productIds).catch(() => new Map()),
    userId ? getCollaborativeCandidates(userId, 50).catch(() => []) : Promise.resolve([]),
  ]);

  const collaborativeByProductId = new Map(
    collaborativeCandidates.map((c) => [c.productId, c.coOccurrenceScore]),
  );

  const products: ScorableProduct[] = catalog.map((product) => ({
    ...product,
    rating: ratingSummaries.get(product.id)?.average ?? 0,
  }));

  const cartProductIds = profile.recentCartProductIds;

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

    const rawCollaborative = (collaborativeByProductId.get(product.id) ?? 0) * COLLABORATIVE_POINTS_PER_SIMILAR_USER;
    const collaborative = Math.min(rawCollaborative, MAX_COLLABORATIVE_BOOST);

    const totalScore =
      searchMatch +
      categoryMatch +
      purchaseMatch +
      recentlyViewed +
      wishlist +
      cartMatch +
      brandPreference +
      budgetMatch +
      trending +
      collaborative;

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
        collaborative,
      },
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}
