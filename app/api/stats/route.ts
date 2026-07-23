import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../lib/apiConfig';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/stats`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy stats', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
