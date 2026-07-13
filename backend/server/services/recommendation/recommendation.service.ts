import { createHash } from 'crypto';
import { getUserProfile } from './profile.service.js';
import { rankAndSelectCandidates, type ScoredProduct } from './ruleEngine.service.js';
import { rankWithGemini } from './gemini.service.js';
import { listProducts } from '../../../../lib/db/queries.js';
import { getCachedRecommendations, setCachedRecommendations } from '../../repositories/recommendation.repository.js';

export interface RecommendationItem {
  id: string;
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

function toRecommendationItem(product: ScoredProduct, reason: string): RecommendationItem {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    currency: product.currency,
    category: product.category || 'General',
    model: product.asset_name || 'chair.glb',
    images: [],
    shortDescription: (product.description || '').slice(0, 160),
    reason,
    score: product.score,
  };
}

function defaultReasonFor(c: ScoredProduct): string {
  if (c.scoringBreakdown.wishlist > 0) return 'Highly prioritized from your wishlist.';
  if (c.scoringBreakdown.cartMatch > 0) return 'Pairs great with items in your cart.';
  if (c.scoringBreakdown.purchaseMatch > 0) return 'Frequently bought together with your purchase history.';
  if (c.scoringBreakdown.collaborative > 0) return 'Popular with shoppers who have similar taste to you.';
  if (c.scoringBreakdown.recentlyViewed > 0) return 'Matches products you recently explored.';
  if (c.scoringBreakdown.searchMatch > 0) return 'Matches your recent searches.';
  if (c.scoringBreakdown.categoryMatch > 0) return `Recommended based on your interest in ${c.category}.`;
  return 'Popular on Douche';
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
          recommendations: cached.recommendations as unknown as RecommendationItem[],
          isAiPowered: false,
        };
      }
    }

    // 2. Apply content-based + collaborative rules and score the real catalog
    const scoredCandidates = await rankAndSelectCandidates(profile, userId);

    // If there is no Gemini API key, or if Gemini call fails, we fall back to rule-based candidates
    let finalRecommendations: RecommendationItem[] = [];
    let isAiPowered = false;

    // 3. Send top scored candidates to Gemini for re-ranking and personalized reasons
    const topCandidates = scoredCandidates.slice(0, 20);

    if (process.env.GEMINI_API_KEY && topCandidates.length > 0) {
      const geminiResult = await rankWithGemini(profile, topCandidates);
      if (geminiResult && geminiResult.length > 0) {
        isAiPowered = true;
        for (const item of geminiResult) {
          const scored = scoredCandidates.find((c) => c.id === item.id);
          if (scored) {
            finalRecommendations.push(toRecommendationItem(scored, item.reason));
          }
        }
      }
    }

    // 4. Fallback to rule-based scoring engine if Gemini was not used or failed
    if (finalRecommendations.length === 0) {
      finalRecommendations = scoredCandidates.slice(0, 4).map((c) => toRecommendationItem(c, defaultReasonFor(c)));
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
    // Safe final fallback: return the first 4 published products with no scoring
    const fallbackCatalog = await listProducts().catch(() => []);
    return {
      recommendations: fallbackCatalog.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        category: p.category || 'General',
        model: p.asset_name || 'chair.glb',
        images: [],
        shortDescription: (p.description || '').slice(0, 160),
        reason: 'Trending product on Douche',
        score: 0,
      })),
      isAiPowered: false,
    };
  }
}
