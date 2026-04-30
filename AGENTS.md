<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Application overview

FloorQuote Pro is a SaaS Next.js 16 app (App Router) for flooring contractors to generate estimates. It uses Supabase (hosted) for auth/database, Stripe for billing, and optionally OpenAI for blueprint scanning.

### Running the app

- **Dev server**: `npm run dev` (port 3000)
- **Lint**: `npm run lint` (ESLint; the codebase has pre-existing lint warnings/errors)
- **Build**: `npm run build`
- **Package manager**: npm (lockfile: `package-lock.json`)
- **Node.js**: v22+ works; no explicit `engines` constraint

### Required environment variables

A `.env.local` file is needed with at minimum these keys (see README for details):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `NEXT_PUBLIC_APP_URL`

Without real Supabase/Stripe credentials the server starts and pages render, but auth and payment flows will fail at runtime.

### Key caveats

- No Docker or local database setup is needed; the app uses hosted Supabase.
- No automated test suite exists (`npm test` is not defined).
- The `eslint` config uses Next.js 16-specific rules; expect `react-hooks/set-state-in-effect` errors from existing code.
- Stripe webhook testing locally requires `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI).
- `.env.local.example` is referenced in README but not committed; create `.env.local` manually.
- After changing `.env.local`, delete `.next/` (`rm -rf .next`) before restarting the dev server to avoid stale cached environment values.
- The app requires login to access any gated page. Use the Desktop pane to log in interactively, or provide Supabase credentials via environment secrets.
