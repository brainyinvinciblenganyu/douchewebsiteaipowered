# TODO - AI Purchases Analytics (Trending Recommendations)

## Plan (approved)
1. Add server DB (SQLite) + schema for orders and order_items.
2. Implement checkout API route to persist purchases to DB.
3. Implement trending API route(s):
   - trending_last30 (last month / rolling 30 days)
   - trending_month_to_date (this month so far)
4. Wire trending results into recommendation engine/chat responses.
5. Add client-side call from cart checkout button to the checkout API.
6. Test end-to-end: add items to cart, checkout, see trending recommendations.
