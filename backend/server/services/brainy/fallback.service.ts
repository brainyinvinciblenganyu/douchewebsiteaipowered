import { type BrainyContext } from './context.service.js';

// Used when GEMINI_API_KEY isn't set. Grounded in the same real DB facts
// Gemini would receive, just summarized with simple keyword rules instead of
// an LLM. Keeps Brainy fully functional with zero external dependency.
export function buildRuleBasedReply(message: string, context: BrainyContext): string {
  const lower = message.toLowerCase();
  const facts = context.facts;

  if (context.role === 'guest') {
    const categories = (facts.categories as string[]) || [];
    const totalProducts = Number(facts.totalProducts ?? 0);

    if (lower.includes('product') || lower.includes('catalog') || lower.includes('categor')) {
      return categories.length
        ? `We have ${totalProducts} product(s) across categories like ${categories.slice(0, 5).join(', ')}. Browse the full catalog, or log in for picks tailored to you.`
        : 'Browse our catalog to see what we have — log in to get personalized recommendations.';
    }
    if (lower.includes('order') || lower.includes('track') || lower.includes('cart')) {
      return 'Log in or create an account to place orders, track them, and keep a saved cart.';
    }
    if (lower.includes('recommend') || lower.includes('suggest')) {
      return "I can point you to popular products right now, but I'll give you truly personalized picks once you log in — it only takes a minute.";
    }
    return "Hi! I'm Brainy. Ask me about our products or categories — and log in any time for personalized recommendations and order tracking.";
  }

  if (context.role === 'vendor') {
    if (lower.includes('order') || lower.includes('sale') || lower.includes('revenue')) {
      const totalOrders = Number(facts.totalOrders ?? 0);
      const totalRevenue = Number(facts.totalRevenue ?? 0);
      if (totalOrders === 0) {
        return "You don't have any orders yet. Once customers start buying, I'll be able to break down your sales and top products here.";
      }
      return `You've had ${totalOrders} order(s) totaling FCFA ${totalRevenue.toLocaleString()}. Ask me "what's my top category" or "how many products do I have" for more.`;
    }
    if (lower.includes('product') || lower.includes('inventory') || lower.includes('catalog')) {
      const productCount = Number(facts.productCount ?? 0);
      const categories = facts.categoryBreakdown as Record<string, number> | undefined;
      const topCategory = categories
        ? Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0]
        : undefined;
      if (productCount === 0) {
        return "You haven't published any products yet. Head to your vendor dashboard to add your first listing.";
      }
      return `You have ${productCount} product(s) listed${topCategory ? `, mostly in ${topCategory}` : ''}. Want a breakdown by category or recent order status?`;
    }
    return `Hi ${context.userName || 'there'}! I'm Brainy, your selling assistant. Ask me about your orders, revenue, or product catalog.`;
  }

  if (lower.includes('order') || lower.includes('purchase') || lower.includes('track')) {
    const totalOrders = Number(facts.totalOrders ?? 0);
    if (totalOrders === 0) {
      return "You haven't placed any orders yet. Browse the catalog and I can help you find something you'll love.";
    }
    const recentOrders = (facts.recentOrders as { status: string; total: number; currency: string }[]) || [];
    const latest = recentOrders[0];
    return latest
      ? `Your most recent order is ${latest.status} — FCFA ${latest.total.toLocaleString()}. You've placed ${totalOrders} order(s) in total.`
      : `You've placed ${totalOrders} order(s) so far.`;
  }
  if (lower.includes('recommend') || lower.includes('suggest')) {
    const categories = (facts.favoriteCategories as { category: string; count: number }[]) || [];
    if (categories.length === 0) {
      return 'Browse a few products and I\'ll start learning your taste — then check the Recommendations page for personalized picks.';
    }
    return `Based on your activity, you seem to like ${categories.map((c) => c.category).join(', ')}. Check the Recommendations page for your personalized picks.`;
  }

  return `Hi ${context.userName || 'there'}! I'm Brainy, your shopping assistant. Ask me about your orders, or for product recommendations.`;
}
