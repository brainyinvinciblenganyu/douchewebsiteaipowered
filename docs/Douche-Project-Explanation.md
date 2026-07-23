---
title: "Douche — AI-Powered 3D E-Commerce Platform"
subtitle: "System Explanation & Final-Year Defense Guide"
date: "2026-07-23"
---

# Douche — AI-Powered 3D E-Commerce Platform

## System Explanation & Final-Year Defense Guide

---

## 1. High-Level Architecture

The system is a **three-tier architecture** with two separate Node.js runtimes talking over HTTP:

```
Browser (React / Next.js App Router, client components)
        |  fetch() with credentials: 'include'
        v
Next.js API routes  (app/api/**/route.ts)  -- runs on the Next.js server
        |  proxies most requests over plain HTTP to...
        v
Express backend  (backend/server/index.ts, separate process, port 3001)
        |  raw parameterized SQL via `pg`
        v
PostgreSQL (Neon serverless Postgres)
        |
        +-- Google Gemini API (REST, called directly with fetch -- no SDK)
```

**Why two servers instead of one?** The Next.js app (`app/api/*`) is mostly a thin **proxy layer**: each route forwards the request (with cookies) to the real Express backend at `BACKEND_API_BASE_URL` and passes the JSON straight through. The actual business logic — auth, database queries, recommendation scoring, Gemini calls — all lives in the Express backend (`backend/server/`). This separation means the "brain" of the app (backend) can be deployed, restarted, or scaled independently of the Next.js frontend, and it's the classic pattern for a Next.js frontend sitting in front of a hand-rolled REST API rather than using Next.js server actions for everything.

---

## 2. Technology Stack

**Frontend**

- **Next.js 16** (App Router, `app/` directory), React 19, TypeScript
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations (recommendations page transitions)
- **react-three-fiber + @react-three/drei** — renders `.glb` 3D models in the browser (`ModelViewer.tsx`), used on the homepage, `/products`, `/product/[id]`, and `/recommendations`
- **lucide-react** for icons

**Backend (separate Express app in `backend/`)**

- **Express 4** + TypeScript, run directly with **tsx** (no build step in dev — `tsx server/index.ts`)
- **pg** (node-postgres) — raw SQL, no ORM (Prisma/TypeORM are not used anywhere)
- **express-rate-limit** — brute-force protection on admin login
- **otplib** + **qrcode** — TOTP two-factor authentication for admins
- **nodemailer** (SMTP send) and **imapflow** + **mailparser** (IMAP receive) — for the vendor-to-customer email feature
- **zod** — request body validation/schemas
- **cookie-parser**, **cors**

**Database**

- **PostgreSQL**, hosted on **Neon** (serverless Postgres). Schema is plain SQL (`backend/server/db/schema.sql`), re-run idempotently (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) on every backend boot via `initDatabase()` — a lightweight, hand-rolled substitute for a formal migration tool like Prisma Migrate or Knex.
- A fallback **in-memory store** (`InMemoryPool` in `lib/db/client.ts`) is used only when `DATABASE_URL` isn't set at all (local dev without a database).

**AI**

- **Google Gemini** (`gemini-flash-latest` model), called via **raw REST `fetch()`** to `generativelanguage.googleapis.com` — not through the official `@google/generative-ai` SDK, even though that package is listed in `package.json`/lockfile. The actual calls are hand-written `fetch()` requests for both streaming (chat) and non-streaming (recommendation re-ranking) use cases.

**Auth**

- Home-rolled, HMAC-SHA256-signed session tokens (not a JWT library — a similar concept, simpler format: `base64url(payload).base64url(HMAC-SHA256(payload))`), stored in an `httpOnly` cookie.
- Passwords hashed with **PBKDF2** (Node's built-in `crypto.pbkdf2`, 210,000 iterations, SHA-256), not bcrypt/argon2 — hand-rolled with Node's crypto module, no external dependency.

---

## 3. Authentication & Authorization Model

There are **three roles**: `customer`, `vendor`, `admin` — enforced by a DB check constraint (`users_role_check`).

- **Customer/vendor login** (`/api/auth/login`, `/api/auth/register`): standard email+password. Public registration can only ever create `customer` or `vendor` accounts (`registerSchema` restricts `role` to `z.enum(['customer', 'vendor'])`) — there is **no public path to create an admin account**.
- **Admin accounts** can only be created by someone with direct server/database access, running `npx tsx tools/create_admin_user.ts <email> <password> [name]` — a CLI script that hashes the password with the same PBKDF2 function and inserts a row with `role = 'admin'` directly.
- **Admin login** lives at a deliberately obscure, non-guessable route: `/ops-7f3k2` (not linked from anywhere in the public site nav). It's a two-step flow:
  1. Email + password -> if correct and the account has no TOTP secret yet, the server generates one, returns a QR code (rendered with the `qrcode` package) and a short-lived signed "setup token" — nothing is written to the database yet.
  2. The admin scans the QR with Google Authenticator (or any TOTP app) and submits the 6-digit code back to `/admin-login/confirm-2fa-setup`. Only once that code verifies does the server persist the TOTP secret and issue a set of one-time recovery codes.
  3. On every subsequent login, email + password + a valid 6-digit code (with a +/-30s clock-skew tolerance) are all required. A recovery code can be used instead of the TOTP code if the authenticator device is lost (each recovery code works once, stored hashed).
- **`requireAdmin` middleware**: every admin API route is gated by this. On **every single request** it re-verifies the session against the live database (not just the signed cookie) — so if an admin is deleted or demoted, their still-valid session token stops working immediately. Any failure returns a generic `404 Not found` (not `401`/`403`) — unauthenticated admin routes look like they don't exist at all.
- **`requireFreshAdminSession` middleware**: layered on top of `requireAdmin` for *mutating* actions (suspend a vendor, approve/reject a product). If the admin's last full login (password+TOTP) was more than 15 minutes ago, the request is rejected with `{ reauthRequired: true }`, and the frontend automatically logs them out and forces a fresh login — a "step-up auth" pattern.
- **Rate limiting + audit log**: `express-rate-limit` throttles the login endpoint; every login attempt (success or failure) is recorded in `admin_login_attempts` (IP + identifier); every sensitive admin action is written to `admin_audit_log` with the admin's id, action name, target, IP, and timestamp.
- **CORS**: the backend only allows credentialed requests from an explicit allow-list (`ALLOWED_ORIGINS` env var + `localhost:3000` for dev) — it does **not** reflect arbitrary origins.

---

## 4. Database Schema (PostgreSQL)

| Table | Purpose |
|---|---|
| `users` | customers, vendors, admins — one table, `role` column discriminates. Holds password hash, TOTP secret/recovery codes (admin only), profile fields. |
| `sessions` | optional DB-backed session records (for revocation tracking) alongside the signed cookie. |
| `products` | vendor listings — name, price, category, tags, `status` (`draft` -> `pending_review` -> `published`/`archived`), and the 3D asset (`asset_file bytea` / `asset_data` base64 / `asset_name`), plus an optional 2D `image_data`. |
| `user_interactions` | the event log that powers recommendations: `view`, `cart_add`, `wishlist_add`, `wishlist_remove`, `rate`, `search`, `purchase`. |
| `recommendation_cache` | per-user cached recommendation results, keyed by a SHA-256 hash of their profile, with a 30-minute TTL. |
| `orders` / `order_items` | order history and line items. |
| `product_reviews` | 1-5 star ratings + text, one per (product, user). |
| `email_messages` | every inbound/outbound message — contact-form submissions (`source = 'contact_form'`), vendor replies, and (historically) synced Gmail messages. |
| `admin_audit_log` | every sensitive admin action. |
| `admin_login_attempts` | DB-backed (not in-memory) login attempt log, so rate limiting survives a server restart. |

All queries are **raw parameterized SQL** (`pool.query(text, [params])`) — no ORM. Parameterization is what prevents SQL injection.

---

## 5. Full API Route Reference

### Next.js routes (`app/api/**`) — thin proxies to the Express backend, forwarding cookies

| Route | Method(s) | Purpose |
|---|---|---|
| `/api/auth/register`, `/login`, `/logout`, `/me` | POST/GET | customer/vendor auth |
| `/api/products`, `/api/products/[id]`, `/api/products/[id]/reviews` | GET/POST/PUT/DELETE | product catalog CRUD + reviews |
| `/api/cart/items` | GET/POST | cart |
| `/api/orders`, `/api/orders/[id]/cancel` | GET/POST/PATCH | orders |
| `/api/checkout` | POST | checkout |
| `/api/recommendations`, `/api/recommendations/track` | GET/POST | fetch personalized recs, log an interaction event |
| `/api/brainy/chat` | POST | streams the Brainy chat reply (SSE passthrough) |
| `/api/contact` | POST | public contact form |
| `/api/stats` | GET | public live counts (published products, active vendors) |
| `/api/trending` | GET | legacy — uses an old local SQLite-style store, not part of the live Postgres system |
| `/api/vendor/customers`, `/api/vendor/customers/message` | GET/POST | vendor's customer list + email-a-customer |
| `/api/admin/login`, `/logout`, `/confirm-2fa-setup`, `/session` | POST/GET | admin auth flow |
| `/api/admin/vendors`, `/api/admin/vendors/[id]/status` | GET/PATCH | admin vendor management |
| `/api/admin/transactions` | GET | admin order overview |
| `/api/admin/products/pending`, `/[id]/approve`, `/[id]/reject` | GET/PATCH | admin product moderation queue |
| `/api/admin/contact-messages`, `/[id]/read` | GET/PATCH | admin view of contact-form submissions |
| `/api/admin/audit-log` | GET | admin activity log |
| `/api/messages/*` | — | legacy/inactive proxy, superseded by `/api/admin/contact-messages` |

### Express backend routes (`backend/server/routes/*`) — where the real logic lives

| File | Mounted at | Key endpoints |
|---|---|---|
| `auth/index.ts` | `/api/auth` | register, login, me, update profile, logout |
| `adminAuth.routes.ts` | `/api/auth` | `/admin-login`, `/admin-login/confirm-2fa-setup` |
| `admin.routes.ts` | `/api/admin` | vendors, transactions, product approvals, audit log, contact messages — all behind `requireAdmin` |
| `products.routes.ts` | `/api/products` | vendor product CRUD (with Multer file upload for the 3D asset), public listing/reviews |
| `orders.routes.ts` | `/api/orders` | order creation, cancellation |
| `recommendation.routes.ts` | `/api/recommendations` | GET recommendations, POST track interaction |
| `brainy.routes.ts` | `/api/brainy` | POST `/chat` — SSE stream |
| `contact.routes.ts` | `/api/contact` | contact form -> stores message + sends notification email |
| `vendorCustomers.routes.ts` | `/api/vendor/customers` | vendor's customer list, send an email to a customer |
| (inline in `index.ts`) | `/api/stats` | public product/vendor counts |

---

## 6. How "Messaging" Actually Works — three genuinely separate systems

1. **Contact form -> Admin ("Contact Messages")**: A visitor submits `/contact`. The backend (`contact.routes.ts`) does two things in parallel: (a) **always** inserts a row into `email_messages` with `source: 'contact_form'`, `direction: 'inbound'` — this is what makes it show up in the admin panel, with **no dependency on email being configured at all**; (b) *if* SMTP credentials (`GMAIL_USER`/`GMAIL_APP_PASSWORD`) are set, it *also* fires an email notification to the admin and an auto-reply to the customer — best-effort, and failure here doesn't stop the message from being recorded. The admin views these on `/ops-7f3k2/contact-messages`, which polls `GET /api/admin/contact-messages` every 8 seconds and lets the admin mark a message read.

2. **Vendor -> Customer email**: A vendor can email one of their customers directly (`vendorCustomers.routes.ts`, `POST /api/vendor/customers/message`) via `nodemailer` SMTP. This requires `GMAIL_USER`/`GMAIL_APP_PASSWORD` — if not configured, it returns a clear `503` rather than failing silently.

3. **Brainy AI chat**: not "messaging" in the email sense — it's a real-time, streamed conversation over HTTP (see Section 7). No message is stored in `email_messages`; chat history only lives in the browser's React state for that session.

*(A fourth, older system — a full two-way Gmail inbox with IMAP sync and reply-from-admin-panel — existed earlier but was removed from the admin panel because outbound sending wasn't reliable; the contact-form-to-database path above replaced it and doesn't share that dependency.)*

---

## 7. Brainy — the AI Chat Assistant

**Where it lives:** a floating launcher button (`components/Brainy.tsx`) on every public page, which navigates to a **dedicated full page**, `/chat` (`app/chat/page.tsx`).

**How a message flows, end to end:**

1. Browser POSTs `{ message, history }` to `/api/brainy/chat` (Next.js proxy) -> forwarded to the Express backend's `POST /api/brainy/chat`.
2. The backend reads the session cookie (if any) and loads the real user record.
3. **`buildBrainyContext(user)`** assembles a JSON object of real facts from Postgres, different per role:
   - **Guest**: total product count, category list, a sample of 15 products.
   - **Vendor**: their own product count/catalog, category breakdown, total orders, total revenue, 5 most recent orders.
   - **Customer**: favorite categories, recent searches, wishlist count, shopping frequency, average spend, 5 most recent orders, and their **top 6 live personalized recommendations** (same engine as `/recommendations`, including each one's "reason").
4. **`buildBrainyPrompt(...)`** wraps that context, the last 6 turns of conversation history, and role-specific instructions into one prompt, explicitly telling the model: *"never invent orders/products/numbers not present here."*
5. If `GEMINI_API_KEY` is set, the backend calls Gemini's **streaming** endpoint (`streamGenerateContent?alt=sse`) and re-yields each text chunk to the browser as it arrives, using Server-Sent Events (`Content-Type: text/event-stream`). The browser reads the response body as a stream and appends each chunk to the assistant's message as it arrives — this is what makes it feel real-time.
6. If `GEMINI_API_KEY` is **not** set, `buildRuleBasedReply(...)` generates a keyword-matched canned response from the same real context facts — Brainy is never fully broken, it just loses free-form conversational ability.

**Why this is fast / low-data:** streaming means the first words of the reply reach the browser in a fraction of a second, and each SSE chunk is a tiny JSON object rather than re-sending the whole conversation.

---

## 8. Recommendation Engine — the core "AI" feature, in detail

**Step 1 — Build a shopping profile (`profile.service.ts`)**

For a logged-in customer, `getUserProfile(userId)` pulls their last 200 rows from `user_interactions` and derives: favorite categories & "favorite brands" (vendor IDs) ranked by frequency; recent search terms, recently-viewed product IDs, wishlist IDs; recent cart adds (approximated — there's no `cart_remove` event type); purchase history IDs; average spending and a min/max preferred price range; a `shoppingFrequency` bucket (`new`/`rare`/`moderate`/`frequent`) based on distinct active days in the last 30 days.

**Step 2 — Score every published product against that profile (`scoring.service.ts` + `ruleEngine.service.ts`)**

`rankAndSelectCandidates()` runs the entire published catalog through ten independent scoring functions and sums the points:

- `scoreSearchMatch` — matches recent search terms against name/category/tags/description (up to 40 pts)
- `scoreCategoryMatch` — is this the user's #1 or #2 favorite category? (40 / 20 / 10 pts)
- **`scorePurchaseHistory`** — the literal "you bought a table, so we recommend a chair" mechanism: a hardcoded `COMPLEMENTARY_MAP` (e.g. `Furniture -> [Furniture, 3D Tech]`) checks whether this candidate's category is complementary to something the user already bought, awarding points (up to 35) if so. Already-owned products are penalized (-15).
- `scoreRecentlyViewed` — boosts items looked at recently, or same-category items
- `scoreWishlist` — flat +30 if on their wishlist
- `scoreCartCompatibility` — complementary-category boost for the cart's contents; -50 if already in cart
- `scoreBrandPreference` — small boost for vendors bought from before
- `scoreBudgetMatch` — rewards products inside their observed price range or close to average spend
- `scoreTrending` — combines real average star rating with a global interaction-count trend
- **Collaborative filtering** (`getCollaborativeCandidates`) — genuine item-based collaborative filtering via SQL: find products this user engaged with -> find other users who engaged with any of the same products -> count how often those other users' *other* products co-occur -> bonus score, capped at 25 points.

All ten scores are summed into one `score` per product, sorted descending.

**Step 3 — Gemini re-ranks the top 20 and writes the human explanation (`gemini.service.ts`)**

The top 20 rule-scored candidates (id, name, category, price, score, description, tags) plus the full shopping profile are sent to Gemini in one prompt, instructed to: pick up to 4, never invent a product not in the candidate list, and write a short natural-language "reason" per pick. Gemini returns strict JSON (`{ recommendations: [{ id, reason }] }`), matched back against the scored candidates by id.

**Step 4 — Fallback chain, so it never breaks**

- No `GEMINI_API_KEY`, or the call fails -> fall back to the top 4 rule-scored candidates, with a rule-based reason generator (`defaultReasonFor`) that picks a canned sentence matching *why* each one scored highly (e.g. *"Frequently bought together with your purchase history."*).
- If the entire pipeline throws -> fall back further, to the first 4 published products with a generic "Trending product" reason.
- Successful results are cached per-user for 30 minutes, keyed by a hash of the profile.

**On the page (`/recommendations`)**: each card shows the product's real 3D model preview, price, a "Strong match / Good match / Worth a look" badge derived from the numeric score, and the reason text — plus an `isAiPowered` banner that's only true when Gemini actually produced the ranking.

---

## 9. Why Gemini API Specifically, and Why It's Needed

- **Natural-language explanation generation**: the rule engine can compute *that* a product scores highly and roughly *why*, but turning that into a fluent, varied sentence for every product/user combination is exactly what an LLM is suited for.
- **Re-ranking with soft judgment**: the rule engine is a rigid point system; Gemini can use holistic judgment across the whole candidate set in a way that's hard to encode as more `if` statements.
- **Conversational chat (Brainy)**: free-form Q&A is not something a rule-based keyword matcher can handle well — the clearest case where a general-purpose LLM is genuinely necessary.
- **It's optional, not load-bearing**: both features work — in a reduced form — with zero Gemini calls, an intentional design choice so a missing/expired API key or an outage degrades the app gracefully instead of breaking it.
- **Cost/latency control**: only the top 20 pre-filtered candidates (not the whole catalog) are ever sent to Gemini, and only a handful of scalar fields per candidate.

---

## 10. Real-Time Features — How "Live" Data Actually Works

There is **no WebSocket server and no Socket.IO** anywhere in this codebase. "Real-time" is achieved two different ways:

1. **Short-interval polling** (`lib/hooks/usePolling.ts`): calls a fetch function immediately, then again every N seconds via `setInterval`, pausing while the browser tab is in the background. Powers: the admin dashboard (8-10s intervals), the homepage featured product (10s), and the About page's live counts (30s).
2. **True streaming** for Brainy chat, via Server-Sent Events (Section 7).

Polling was the right tradeoff over WebSockets: no persistent connection/socket server needed, the data doesn't change fast enough for a few seconds of staleness to matter, and it's trivially easy to reason about compared to managing socket rooms/reconnection logic.

---

## 11. Testing — An Honest Account

There is **no automated test suite** — no Jest, Vitest, Playwright, or Cypress config, no `*.test.ts` files, no `test` script in either `package.json`. This should be stated plainly if asked, rather than overstated.

**What was actually done, throughout development:**

1. **Static type-checking** — `npx tsc --noEmit` run after every change, catching type mismatches, incorrect API shapes, and missing fields before runtime.
2. **Production build verification** — `npm run build` (Next.js) run to confirm every route compiles cleanly.
3. **Manual functional/smoke testing** — exercising real flows end-to-end: creating an admin account and logging in through the full TOTP setup flow, submitting the contact form and confirming it appears in the admin panel, watching the chat stream a real response, etc.
4. **Direct database cross-verification** — for anything presented as "real-time" (e.g. the `/api/stats` counts), the numbers were independently queried straight from Postgres with a one-off script and compared against what the API/UI displayed.
5. **Live endpoint verification** — using `curl` against both the Next.js proxy and the Express backend to confirm routes return expected status codes, including confirming admin routes return a disguised `404` when unauthenticated.

**Honest framing for a defense:** *"Given the project timeline, testing was manual and static rather than automated — TypeScript's type system plus build verification caught structural errors, and each feature was manually smoke-tested against the real database before being considered done. Given more time, the highest-value next step would be unit tests for the pure scoring functions in `scoring.service.ts` (deterministic, no I/O, easy to test with fixed inputs) and integration tests for the auth/session flow."*

---

## 12. Anticipated Defense Questions (with concise answers)

- **"Why raw SQL instead of an ORM like Prisma?"** -> Full control over exact queries (especially the collaborative-filtering CTE), no extra abstraction/build step; idempotent `CREATE TABLE IF NOT EXISTS` statements re-run on every boot instead of formal migrations.
- **"Why two servers (Next.js + Express) instead of one?"** -> Keeps the Next.js layer as a thin, deployable frontend/proxy while Express owns all business logic and can be deployed/restarted independently; made it straightforward to add Express-specific middleware (rate limiting, raw multipart file uploads).
- **"How do you prevent SQL injection?"** -> Every query uses parameterized placeholders (`$1, $2, ...`) via `pg`; user input is never string-concatenated into SQL.
- **"What happens if the Gemini API key is missing or the call fails?"** -> Both features (recommendations, chat) have a fully-functional rule-based fallback path — the app degrades gracefully rather than breaking.
- **"How is the admin account secured, given there's no signup form?"** -> Only creatable via a server-side CLI script; login requires password + mandatory TOTP 2FA; sessions re-validated against the DB on every request; sensitive actions require a session younger than 15 minutes; login route rate-limited and every attempt logged.
- **"How does the 3D preview work?"** -> Vendor uploads a `.glb` file (validated via Multer), stored as bytes in Postgres or on disk under `/public/models`; rendered with `react-three-fiber`/`@react-three/drei`'s `useGLTF` inside a `<Canvas>`, with orbit controls.
- **"What's the biggest limitation of the recommendation engine?"** -> The collaborative-filtering signal is capped low (max 25 points) because co-occurrence data is sparse on a small user base — designed to matter more as the platform grows.
- **"Is anything in the codebase legacy/unused?"** -> Yes: `components/ChatBot.tsx`, `lib/recommendationEngine.ts`, and `/api/chat`/`/api/trending` are an earlier prototype (mock in-memory data, no DB) superseded by Brainy and the real recommendation engine — still in the repo but not rendered/linked anywhere live.

---

## 13. Suggested Demo Flow for Defense Day

1. Show the homepage — point out the live "Featured product" and real product/vendor counts (open a DB client or the `/api/stats` endpoint side-by-side to prove it's not hardcoded).
2. Register a customer account, browse a few products (view, add to wishlist, add to cart) to generate `user_interactions` rows.
3. Visit `/recommendations` — show the reason box and match-strength badge; explain the scoring pipeline live.
4. Open `/chat`, ask Brainy something account-specific ("what have I recently viewed?") to show it's grounded in real data, then something general ("what's a good gift for a birthday") to show it's not purely templated.
5. Submit the contact form, then log into `/ops-7f3k2` (walk through the TOTP login) and show the message appearing in Contact Messages.
6. Approve/reject a pending vendor product from the admin panel and show the corresponding entry appear in the Audit Log in real time (polling).
