import { type ShoppingProfile } from './profile.service.js';
import { type ScoredProduct } from './ruleEngine.service.js';

export interface GeminiRecommendation {
  id: number;
  reason: string;
}

export async function rankWithGemini(
  profile: ShoppingProfile,
  candidates: ScoredProduct[]
): Promise<GeminiRecommendation[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined. Falling back to rule engine candidates.');
    return null;
  }

  // Only pass the essential candidate info to save token cost and improve speed
  const candidateInfo = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    price: c.price,
    score: c.score,
    shortDescription: c.shortDescription,
    tags: c.tags,
  }));

  const prompt = `
You are the AI recommendation engine for the "Douche" e-commerce platform.
Your task is to rank the candidate products and generate highly personalized, engaging explanations for why each product is recommended for the user based on their shopping profile.

User Shopping Profile:
${JSON.stringify(profile, null, 2)}

Candidate Products (scored and pre-selected by our backend rule engine):
${JSON.stringify(candidateInfo, null, 2)}

Instructions:
1. Re-rank the candidates to select the top products (up to 4) that best match the user's preferences.
2. For each recommended product, generate a short (1-2 sentences), premium, and persuasive explanation ("reason") written in a helpful and conversational tone (e.g. "Since you recently viewed the Royal Chair, this matching Coffee Table will perfect your living room setup.").
3. NEVER invent or recommend any products that are not present in the Candidate Products list.
4. Return the results in a structured JSON object with the following schema:
{
  "recommendations": [
    {
      "id": number (must match a product ID in the candidates),
      "reason": "explanation string"
    }
  ]
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      console.error('Empty response from Gemini API');
      return null;
    }

    const parsed = JSON.parse(textResponse.trim()) as { recommendations?: GeminiRecommendation[] };
    return parsed.recommendations || null;
  } catch (error) {
    console.error('Failed to rank recommendations with Gemini:', error);
    return null;
  }
}
