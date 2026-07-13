import { Router, type Request, type Response } from 'express';
import { getSessionFromRequest } from '../../../lib/auth/session.js';
import { findUserById } from '../../../lib/db/queries.js';
import { buildBrainyContext, buildBrainyPrompt } from '../services/brainy/context.service.js';
import { streamGeminiChat } from '../services/brainy/gemini.stream.service.js';
import { buildRuleBasedReply } from '../services/brainy/fallback.service.js';

const router = Router();

function writeSseChunk(res: Response, text: string) {
  res.write(`data: ${JSON.stringify({ text })}\n\n`);
}

router.post('/chat', async (req: Request, res: Response) => {
  // Brainy is available to everyone. Logged-in users get a personalized,
  // account-grounded context; anonymous visitors get general catalog context.
  const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
  const user = session ? await findUserById(session.userId) : null;

  const payload = req.body ?? {};
  const message = String(payload.message ?? '').trim();
  const history = Array.isArray(payload.history) ? payload.history : [];

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const context = await buildBrainyContext(user);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Rule-based fallback: emit the whole reply as one chunk so the frontend's
      // streaming reader works identically whether or not Gemini is configured.
      writeSseChunk(res, buildRuleBasedReply(message, context));
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const prompt = buildBrainyPrompt(message, context, history);
    for await (const chunk of streamGeminiChat(prompt)) {
      writeSseChunk(res, chunk);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Brainy chat error:', error);
    writeSseChunk(res, "Sorry, I'm having trouble responding right now. Please try again.");
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
