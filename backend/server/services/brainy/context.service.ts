import {
  type DbUser,
  getOrdersForCustomer,
  getOrdersForVendor,
  listProducts,
} from '../../../../lib/db/queries.js';
import { getUserProfile } from '../recommendation/profile.service.js';

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

  const [profile, orders] = await Promise.all([
    getUserProfile(user.id),
    getOrdersForCustomer(user.id).catch(() => []),
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

  return `You are "Brainy", the AI shopping and selling assistant for the "Douche" AI-powered 3D e-commerce platform. You are talking to ${audience}.

Real data (use this to ground your answer — never invent orders, products, or numbers not present here):
${JSON.stringify(context.facts, null, 2)}

${historyText ? `Recent conversation:\n${historyText}\n` : ''}
Instructions:
- Answer the user's question directly and conversationally, using only the real data above.
- If asked about something not covered by the data (e.g. site-wide policies), answer helpfully and generally, but don't fabricate specific numbers.
- Keep responses concise (2-4 sentences unless the user asks for a list/detail).
- ${
    context.role === 'vendor'
      ? 'Speak as a business copilot: sales trends, inventory, what to restock or promote.'
      : context.role === 'customer'
        ? 'Speak as a personal shopping assistant: recommendations, order status, budget-aware suggestions.'
        : 'Speak as a friendly storefront guide: help them discover products and categories, and suggest creating an account to unlock personalized recommendations, order tracking, and saved carts.'
  }

User: ${userMessage}
Brainy:`;
}
