import {
  type DbUser,
  getOrdersForCustomer,
  getOrdersForVendor,
  listProducts,
} from '../../../../lib/db/queries.js';
import { getUserProfile } from '../recommendation/profile.service.js';
import { getRecommendations } from '../recommendation/recommendation.service.js';

export interface BrainyContext {
  role: 'customer' | 'vendor' | 'guest';
  userName: string | null;
  // Structured facts pulled straight from Postgres for this user — this is
  // what turns Brainy from "Gemini guessing" into a grounded assistant.
  facts: Record<string, unknown>;
}

// Anyone visiting the site can chat with Brainy, logged in or not. Guests get
// general, non-personalized catalog context instead of account-specific data.
async function buildGuestContext(): Promise<BrainyContext> {
  const catalog = await listProducts().catch(() => []);

  const categoryCounts: Record<string, number> = {};
  for (const p of catalog) {
    if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  return {
    role: 'guest',
    userName: null,
    facts: {
      totalProducts: catalog.length,
      categories: Object.keys(categoryCounts),
      sampleProducts: catalog.slice(0, 15).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        currency: p.currency,
      })),
    },
  };
}

export async function buildBrainyContext(user: DbUser | null): Promise<BrainyContext> {
  if (!user) {
    return buildGuestContext();
  }

  if (user.role === 'vendor') {
    const [products, orders] = await Promise.all([
      listProducts({ vendorUserId: user.id }).catch(() => []),
      getOrdersForVendor(user.id).catch(() => []),
    ]);

    const categoryCounts: Record<string, number> = {};
    for (const p of products) {
      if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const recentOrders = orders.slice(0, 5).map((o) => ({
      id: o.id,
      status: o.status,
      total: o.totalAmount,
      currency: o.currency,
      itemCount: o.items.length,
      createdAt: o.createdAt,
    }));

    return {
      role: 'vendor',
      userName: user.name || user.company_name || null,
      facts: {
        companyName: user.company_name,
        location: user.location,
        productCount: products.length,
        products: products.slice(0, 30).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: Number(p.price),
          currency: p.currency,
          status: p.status,
        })),
        categoryBreakdown: categoryCounts,
        totalOrders: orders.length,
        totalRevenue,
        recentOrders,
      },
    };
  }

  const [profile, orders, recommendationResult] = await Promise.all([
    getUserProfile(user.id),
    getOrdersForCustomer(user.id).catch(() => []),
    getRecommendations(user.id).catch(() => ({ recommendations: [], isAiPowered: false })),
  ]);

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.id,
    status: o.status,
    total: o.totalAmount,
    currency: o.currency,
    items: o.items.map((it) => it.productName),
    createdAt: o.createdAt,
  }));

  return {
    role: 'customer',
    userName: user.name,
    facts: {
      favoriteCategories: profile.favoriteCategories.slice(0, 5),
      recentSearches: profile.recentSearches,
      wishlistCount: profile.wishlistProductIds.length,
      shoppingFrequency: profile.shoppingFrequency,
      averageSpending: profile.averageSpending,
      totalOrders: orders.length,
      recentOrders,
      // Same hybrid (collaborative + content-based) engine that powers the
      // /recommendations page — Brainy should proactively surface these.
      personalizedRecommendations: recommendationResult.recommendations.slice(0, 6).map((r) => ({
        id: r.id,
        name: r.name,
        price: r.price,
        currency: r.currency,
        category: r.category,
        reason: r.reason,
      })),
    },
  };
}

export function buildBrainyPrompt(userMessage: string, context: BrainyContext, history: { role: string; content: string }[]): string {
  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'User' : 'Brainy'}: ${h.content}`)
    .join('\n');

  const audience =
    context.role === 'guest'
      ? 'a visitor who is not logged in'
      : `a ${context.role} named ${context.userName || 'there'}`;

  return `You are "Brainy", the AI assistant for the "Douche" AI-powered 3D e-commerce platform. You are talking to ${audience}.

You are a knowledgeable, general-purpose assistant first, with special access to this account's real Douche data. You are NOT restricted to only discussing Douche — you have broad general knowledge of e-commerce, online retail, shopping, business, and the wider world, just like any capable AI assistant. Freely answer general questions (e-commerce trends, other marketplaces or businesses, advice about shopping or selling online in any location, general knowledge, etc.) using your own knowledge.

Real Douche account data for this user (use this ONLY to ground answers about their account, orders, or our catalog — never invent orders, products, or numbers not present here; for anything else, use your general knowledge instead):
${JSON.stringify(context.facts, null, 2)}

${historyText ? `Recent conversation:\n${historyText}\n` : ''}
Instructions:
- Answer the user's actual question first, directly and conversationally. Only fall back on "I can't help with that" if the question is genuinely unanswerable — general knowledge questions are NOT out of scope.
- Use the real data above when the question is about this user's Douche account, orders, or our products. Use your own broad knowledge for everything else (other platforms, general e-commerce/business questions, locations, etc.).
- Keep responses concise (2-4 sentences unless the user asks for a list/detail).
- ${
    context.role === 'vendor'
      ? 'Speak as a business copilot: sales trends, inventory, what to restock or promote — and general e-commerce/selling advice when relevant.'
      : context.role === 'customer'
        ? `Speak as a personal shopping assistant: order status, budget-aware suggestions, and general shopping advice. The "personalizedRecommendations" in the data above are this user's real, freshly-computed picks (hybrid collaborative + content-based scoring) — proactively mention 1-3 of them with their "reason" when it fits the conversation (e.g. when they ask what to buy, say hi, or ask for recommendations), not just when explicitly asked.`
        : 'Speak as a friendly storefront guide: help them discover products and categories, answer general e-commerce questions, and suggest creating an account to unlock personalized recommendations, order tracking, and saved carts.'
  }

User: ${userMessage}
Brainy:`;
}
