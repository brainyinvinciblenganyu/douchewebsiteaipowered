import { type Request, type Response } from 'express';
import { getSessionFromRequest } from '../../../lib/auth/session.js';
import * as repo from '../repositories/recommendation.repository.js';
import { getRecommendations } from '../services/recommendation/recommendation.service.js';

export async function handleTrack(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
    const userId = session ? session.userId : null;

    const { eventType, productId, query, category, brand, rating, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Missing eventType' });
    }

    await repo.logInteraction({
      userId,
      eventType,
      productId: productId ? String(productId) : null,
      query: query || null,
      category: category || null,
      brand: brand || null,
      rating: rating ? Number(rating) : null,
      metadata: metadata || {},
    });

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Track error:', error);
    return res.status(500).json({ error: 'Failed to log interaction' });
  }
}

export async function handleGetRecommendations(req: Request, res: Response) {
  try {
    const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
    const userId = session ? session.userId : null;

    const recommendations = await getRecommendations(userId);
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    return res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
}
