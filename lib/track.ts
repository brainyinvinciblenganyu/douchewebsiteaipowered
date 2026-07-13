/**
 * Utility to send user interaction tracking events from the client
 */
export async function trackEvent(params: {
  eventType: 'view' | 'cart_add' | 'wishlist_add' | 'wishlist_remove' | 'rate' | 'search' | 'purchase';
  productId?: string;
  query?: string;
  category?: string | null;
  brand?: string | null;
  rating?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    const res = await fetch('/api/recommendations/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      console.warn('Tracking event log warning:', await res.text());
    }
  } catch (error) {
    console.error('Tracking event error:', error);
  }
}
