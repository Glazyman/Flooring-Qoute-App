# FloorQuote Pro

Professional flooring estimates in under 2 minutes.

## Tech Stack

- **Next.js 16** — App Router
- **Supabase** — Auth + Postgres database
- **Stripe** — $1/month subscriptions
- **Tailwind CSS 4** — Styling
- **@react-pdf/renderer** — PDF generation

## Setup

### 1. Clone and install

```bash
cd floorquote-pro
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required values:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep secret)
- `STRIPE_SECRET_KEY` — from Stripe dashboard (use `sk_test_...` for dev)
- `STRIPE_WEBHOOK_SECRET` — from Stripe CLI or dashboard
- `STRIPE_PRICE_ID` — create a $1/month recurring price in Stripe and paste the ID
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for dev

### 3. Database setup

Run the migration in the **Supabase SQL Editor** (or `supabase db push`):

```bash
# Via Supabase CLI (if you have it installed):
supabase db push

# Or paste the contents of supabase/migrations/001_initial.sql
# directly into the Supabase SQL Editor
```

### 4. Stripe setup

1. Create a product in the [Stripe Dashboard](https://dashboard.stripe.com)
2. Add a recurring price of $1.00/month
3. Copy the Price ID (`price_...`) into `STRIPE_PRICE_ID`

**Webhook (local dev):**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

**Webhook events to enable (in production):**

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 5. Supabase Auth settings

In your Supabase dashboard → Authentication → Settings:

- Set **Site URL** to your app URL
- Add `http://localhost:3000/auth/callback` to **Redirect URLs**
- (Optional) Disable email confirmation for development

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## App Structure

```
src/
  app/
    (auth)/         — Login, Signup pages
    (app)/          — Gated app pages (dashboard, quotes, settings)
    api/            — API routes (quotes, billing, stripe webhook)
    billing/        — Subscription setup page
    auth/callback/  — Supabase auth callback
  components/
    AppNavigation   — Sidebar + mobile nav
    QuoteForm       — Full quote creation form (client component)
    QuotePdf        — PDF document renderer
    QuotesTable     — Saved quotes list
    SettingsForm    — Company settings form
  lib/
    calculations.ts — Pure quote calculation logic
    types.ts        — TypeScript types
    supabase/       — Supabase clients (browser, server, middleware)
    stripe.ts       — Stripe client
  middleware.ts     — Auth + subscription route protection
supabase/
  migrations/
    001_initial.sql — Full DB schema + RLS policies
```

## Quote Calculation Logic

```
1. base_sqft (manual input or sum of rooms)
2. adjusted_sqft = base_sqft × (1 + waste_pct / 100)
3. material_total = adjusted_sqft × material_cost_per_sqft
4. labor_total = adjusted_sqft × labor_cost_per_sqft
5. extras_total = removal + furniture + stairs + delivery + custom fees
6. subtotal = material_total + labor_total + extras_total
7. tax_amount = tax_enabled ? subtotal × (tax_pct / 100) : 0
8. markup_amount = subtotal × (markup_pct / 100)
9. final_total = subtotal + tax_amount + markup_amount
10. deposit_amount = final_total × (deposit_pct / 100)
11. remaining_balance = final_total - deposit_amount
```

