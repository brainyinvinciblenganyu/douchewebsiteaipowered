import { products } from './mockData';
import type { UserInteractions } from './interactionTracker';

export interface ProductSuggestion {
  id: number;
  name: string;
  price: number;
  category: string;
  model: string;
  score: number;
  reason: string;
}

const KEYWORDS: Record<string, string[]> = {
  furniture: ['chair', 'table', 'furniture', 'seat', 'wood', 'living', 'room', 'home'],
  vehicles: ['car', 'vehicle', 'ferrari', 'drive', 'auto', 'motor'],
};

function getCategoryFromTags(tags: string[]): string | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.includes('furniture') || lower.includes('chair') || lower.includes('table')) return 'Furniture';
    if (lower.includes('vehicle') || lower.includes('car')) return 'Vehicles';
  }
  return null;
}

function keywordCategory(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) {
      return category === 'furniture' ? 'Furniture' : 'Vehicles';
    }
  }
  return null;
}

export function scoreProducts(
  interactions: Partial<UserInteractions>,
  message = '',
  limit = 3
): ProductSuggestion[] {
  const viewed = interactions.viewedProductIds ?? [];
  const cart = new Set(interactions.cartProductIds ?? []);
  const vr = interactions.vrViewedIds ?? [];
  const tags = interactions.generatedTags ?? [];

  const lastViewed = viewed[0];
  const lastViewedProduct = products.find((p) => p.id === lastViewed);
  const tagCategory = getCategoryFromTags(tags);
  const messageCategory = keywordCategory(message);

  const scored = products.map((product) => {
    let score = 0;
    const reasons: string[] = [];

    if (lastViewedProduct && product.category === lastViewedProduct.category && product.id !== lastViewedProduct.id) {
      score += 5;
      reasons.push(`Pairs well with ${lastViewedProduct.name}`);
    }

    if (tagCategory && product.category === tagCategory) {
      score += 4;
      reasons.push('Matches your AI-generated style');
    }

    if (messageCategory && product.category === messageCategory) {
      score += 4;
      reasons.push(`Matches your interest in ${messageCategory}`);
    }

    if (viewed.includes(product.id) && !cart.has(product.id)) {
      score += 2;
      reasons.push('You recently viewed this');
    }

    if (vr.includes(product.id)) {
      score += 3;
      reasons.push('Great in VR showroom');
    }

    if (cart.has(product.id)) {
      score -= 10;
    }

    if (product.category === 'Furniture') score += 0.5;

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      model: product.model,
      score,
      reason: reasons[0] ?? 'Popular on Douche',
    };
  });

  return scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function findProductsByKeyword(message: string) {
  const lower = message.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
}

export function formatPrice(price: number) {
  return `FCFA ${price.toLocaleString()}`;
}
