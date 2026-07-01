import { NextResponse } from 'next/server';
import { products } from '../lib/mockData';

export async function POST(req: Request) {
  try {
    const { message, history, viewedProductIds } = await req.json();

    const viewedProducts = products.filter((product) => viewedProductIds.includes(product.id));
    const viewedNames = viewedProducts.map((product) => product.name).join(', ');

    const systemPrompt = `
      You are a helpful AI assistant for an e-commerce store called "Douche" that sells African products, 3D models, and VR experiences.

      Available Products:
      ${JSON.stringify(products.map((product) => ({ id: product.id, name: product.name, price: product.price, category: product.category })))}

      The user has viewed the following products: ${viewedNames || 'None yet'}.

      If the user asks for recommendations, suggest products based on what they have viewed or similar categories.
      Keep responses concise and helpful.
    `;

    const reply = typeof message === 'string' && (message.toLowerCase().includes('recommend') || message.toLowerCase().includes('suggest'))
      ? viewedProducts.length > 0
        ? `Since you were looking at ${viewedNames}, I recommend checking out our other items in the ${viewedProducts[0].category} category.`
        : 'I recommend starting with our Royal Chair or the Ferrari model. They are very popular!'
      : 'I can help you with that! We have a great selection of 3D and VR-ready African products. Feel free to browse our catalog!';

    return NextResponse.json({ reply, systemPrompt });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}