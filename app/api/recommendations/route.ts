import { NextResponse } from 'next/server';
import { scoreProducts } from '../../../lib/recommendationEngine';
import type { UserInteractions } from '../../../lib/interactionTracker';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<UserInteractions> & { message?: string; limit?: number };
    const suggestions = scoreProducts(body, body.message ?? '', body.limit ?? 4);

    return NextResponse.json({
      suggestions,
      count: suggestions.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
