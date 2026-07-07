import { createHash } from 'crypto';
import { getUserProfile } from './profile.service.js';
import { rankAndSelectCandidates } from './ruleEngine.service.js';
import { rankWithGemini } from './gemini.service.js';
import { products, type Product } from '../../../../lib/mockData.js';
import { getCachedRecommendations, setCachedRecommendations } from '../../repositories/recommendation.repository.js';

export interface RecommendationItem {
  id: number;
  name: string;
  price: number;
  currency: string;
  category: string;
  model: string;
  images: string[];
  shortDescription: string;
  reason: string;
  score: number;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  isAiPowered: boolean;
}

function buildProfileHash(profile: ReturnType<typeof getUserProfile> extends Promise<infer T> ? T : never): string {
  return createHash('sha256').update(JSON.stringify(profile)).digest('hex');
}

export async function getRecommendations(userId: string | null): Promise<RecommendationResponse> {
  try {
    // 1. Load user profile (will be a default empty/new profile if userId is null)
    const profile = await getUserProfile(userId);
    const profileHash = buildProfileHash(profile);

    if (userId) {
      const cached = await getCachedRecommendations(userId, profileHash);
      if (cached?.recommendations?.length) {
        return {
          recommendations: cached.recommendations as RecommendationItem[],
          isAiPowered: false,
        };
      }
    }

    // 2. Apply rules and score all products in catalog
    const scoredCandidates = await rankAndSelectCandidates(profile, userId);

    // If there is no Gemini API key, or if Gemini call fails, we fall back to rule-based candidates
    let finalRecommendations: RecommendationItem[] = [];
    let isAiPowered = false;

    // 3. Send top scored candidates to Gemini for re-ranking and personalized reasons
    // Typically we send the top 20-50 candidates. Since our mock database is small (4 products),
    // we send all candidates, but the code is written to slice the top 20 candidates.
    const topCandidates = scoredCandidates.slice(0, 20);

    if (process.env.GEMINI_API_KEY && topCandidates.length > 0) {
      const geminiResult = await rankWithGemini(profile, topCandidates);
      if (geminiResult && geminiResult.length > 0) {
        isAiPowered = true;
        // Map Gemini recommendations back to full product details
        for (const item of geminiResult) {
          const original = products.find((p) => p.id === item.id);
          const scored = scoredCandidates.find((c) => c.id === item.id);
          if (original) {
            finalRecommendations.push({
              id: original.id,
              name: original.name,
              price: original.price,
              currency: original.currency,
              category: original.category,
              model: original.model,
              images: original.images || [],
              shortDescription: original.shortDescription,
              reason: item.reason,
              score: scored ? scored.score : 0,
            });
          }
        }
      }
    }

    // 4. Fallback to Rule-based Scoring Engine if Gemini was not used or failed
    if (finalRecommendations.length === 0) {
      // Take the top 4 candidates directly from the scored list
      finalRecommendations = scoredCandidates.slice(0, 4).map((c) => {
        // Map default reasons based on highest scoring category/action
        let reason = 'Popular on Douche';
        if (c.scoringBreakdown.wishlist > 0) {
          reason = 'Highly prioritized from your wishlist.';
        } else if (c.scoringBreakdown.cartMatch > 0) {
          reason = 'Pairs great with items in your cart.';
        } else if (c.scoringBreakdown.purchaseMatch > 0) {
          reason = 'Frequently bought together with your purchase history.';
        } else if (c.scoringBreakdown.recentlyViewed > 0) {
          reason = 'Matches products you recently explored.';
        } else if (c.scoringBreakdown.searchMatch > 0) {
          reason = 'Matches your recent searches.';
        } else if (c.scoringBreakdown.categoryMatch > 0) {
          reason = `Recommended based on your interest in ${c.category}.`;
        }

        return {
          id: c.id,
          name: c.name,
          price: c.price,
          currency: c.currency,
          category: c.category,
          model: c.model,
          images: c.images || [],
          shortDescription: c.shortDescription,
          reason,
          score: c.score,
        };
      });
    }

    if (userId && finalRecommendations.length > 0) {
      await setCachedRecommendations(userId, profileHash, finalRecommendations);
    }

    return {
      recommendations: finalRecommendations,
      isAiPowered,
    };
  } catch (error) {
    console.error('Error in recommendation pipeline:', error);
    // Safe final fallback: return first 4 products
    return {
      recommendations: products.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        category: p.category,
        model: p.model,
        images: p.images || [],
        shortDescription: p.shortDescription,
        reason: 'Trending product on Douche',
        score: 0,
      })),
      isAiPowered: false,
    };
  }
}
