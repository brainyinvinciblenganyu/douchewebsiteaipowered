import { NextResponse } from 'next/server';
import { products } from '../../products/products';
import { findProductsByKeyword, formatPrice, scoreProducts } from '../../../lib/recommendationEngine';
import type { UserInteractions } from '../../../lib/interactionTracker';

type ChatPayload = Partial<UserInteractions> & {
  message?: string;
  history?: { role: string; content: string }[];
  currentPage?: string;
};

function getViewedNames(ids: number[] = []) {
  return products.filter((p) => ids.includes(p.id)).map((p) => p.name);
}

function buildGreeting(ctx: ChatPayload) {
  const viewed = getViewedNames(ctx.viewedProductIds);
  if (ctx.currentPage?.startsWith('/product/') && viewed.length) {
    return `I see you're exploring **${viewed[0]}**. I can suggest similar items or answer questions about it.`;
  }
  if (ctx.currentPage === '/vr') {
    return "Welcome to VR mode! Tell me what you're looking for and I'll suggest products to try in the showroom.";
  }
  if (ctx.currentPage === '/cart' && (ctx.cartProductIds?.length ?? 0) > 0) {
    return 'Your cart looks great. Want accessory recommendations before checkout?';
  }
  if (ctx.currentPage === '/ai-generator') {
    return "Upload an image in the AI 3D Lab and I'll help you find matching products from our catalog.";
  }
  if (viewed.length) {
    return `Welcome back! Based on your browsing (${viewed.slice(0, 2).join(', ')}), I can recommend products you'll love.`;
  }
  return 'Hello! I\'m your Douche AI assistant. Ask me for recommendations, prices, or help finding African products in 3D & VR.';
}

export async function POST(req: Request) {
  try {
    const ctx = (await req.json()) as ChatPayload;
    const message = String(ctx.message ?? '').trim();
    const lower = message.toLowerCase();

    if (!message) {
      return NextResponse.json({
        reply: buildGreeting(ctx),
        suggestions: scoreProducts(ctx, '', 3),
      });
    }

    const suggestions = scoreProducts(ctx, message, 3);
    const viewedNames = getViewedNames(ctx.viewedProductIds);
    let reply = '';

    if (lower.includes('hello') || lower.includes('hi') || lower === 'hey') {
      reply = buildGreeting(ctx);
    } else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('similar')) {
      if (suggestions.length) {
        const list = suggestions.map((s) => `**${s.name}** (${formatPrice(s.price)}) — ${s.reason}`).join('\n');
        reply = viewedNames.length
          ? `Based on your activity around ${viewedNames.join(', ')}, here are my top picks:\n\n${list}`
          : `Here are my top picks for you:\n\n${list}`;
      } else {
        reply = "Browse our Royal Chair or Coffee Table — they're customer favorites with stunning 3D previews.";
      }
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
      const matches = findProductsByKeyword(message);
      const targets = matches.length ? matches : products;
      reply = targets
        .slice(0, 4)
        .map((p) => `**${p.name}**: ${formatPrice(p.price)} (${p.category})`)
        .join('\n');
    } else if (lower.includes('cart')) {
      const cartIds = ctx.cartProductIds ?? [];
      if (!cartIds.length) {
        reply = 'Your cart is empty. Visit Products to add items — I can recommend great picks!';
      } else {
        const items = products.filter((p) => cartIds.includes(p.id));
        const total = items.reduce((sum, p) => sum + p.price, 0);
        reply = `You have ${items.length} item(s): ${items.map((p) => p.name).join(', ')}.\nEstimated subtotal: **${formatPrice(total)}**.`;
      }
    } else if (lower.includes('vr') || lower.includes('virtual')) {
      reply =
        'Visit our **VR Showroom** at /vr to explore products immersively. I recommend the Royal Chair and Coffee Table for the best VR experience.';
    } else if (lower.includes('3d') || lower.includes('generate') || lower.includes('upload')) {
      reply =
        'Head to **AI 3D Lab** (/ai-generator) to upload a photo and convert it into an interactive 3D model — completely free on our platform.';
    } else if (lower.includes('about') || lower.includes('douche') || lower.includes('afroverse')) {
      reply =
        'Douche is an African e-commerce platform combining 3D visualization, VR shopping, and AI personalization. We showcase furniture, vehicles, and crafts from African artisans.';
    } else {
      const matches = findProductsByKeyword(message);
      if (matches.length) {
        reply = matches
          .slice(0, 3)
          .map((p) => `**${p.name}** — ${formatPrice(p.price)}. ${p.description.slice(0, 80)}...`)
          .join('\n\n');
      } else if (suggestions.length) {
        reply = `I couldn't find an exact match, but you might like:\n\n${suggestions
          .map((s) => `**${s.name}** (${formatPrice(s.price)})`)
          .join('\n')}`;
      } else {
        reply =
          'I can help with product recommendations, prices, VR showroom info, and our AI 3D Lab. Try asking "recommend a chair" or "show me prices".';
      }
    }

    return NextResponse.json({
      reply,
      suggestions: suggestions.length ? suggestions : scoreProducts(ctx, message, 2),
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
