Status: In development. This is a personal portfolio project. Features and integrations are still being implemented and tested.

# CIY — Craft It Yourself

CIY (Craft It Yourself) is a web application for generating, debugging, and updating Minecraft Paper/Spigot plugins using large language models. Users can describe a plugin in plain English, inspect the generated Java source files and `pom.xml` / `plugin.yml` configuration in an in-browser code viewer, download the project as a `.zip` archive, or diagnose stack traces and migrate existing plugin archives across Minecraft versions (`1.19.4` – `1.21.4`).

---

## Technology Stack

- **Framework:** Next.js 14 (`14.2.0`, App Router) with React 18
- **Styling & UI:** Tailwind CSS 3.4, Framer Motion, Lucide React, Radix UI Slot, Highlight.js, Sonner
- **AI Providers:**
  - Google Gemini (`@google/generative-ai`)
  - Anthropic Claude (`@anthropic-ai/sdk`)
  - OpenAI (`openai`)
  - Hybrid orchestration mode (`CIY OmniAgent`) combining blueprint planning with code generation
- **Authentication & Database:** Supabase (`@supabase/supabase-js`) with PostgreSQL schema and Row-Level Security policies (`lib/supabase/schema.sql`), plus a local storage / signed-token fallback for local development
- **Billing:** Stripe (`stripe` SDK) for subscription plans, one-time credit passes, checkout sessions, and webhooks
- **Rate Limiting & Observability:** Upstash Redis REST pipeline (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) with an in-memory sliding-window fallback, Sentry (`@sentry/node`), PostHog (`posthog-js`), and Resend (contact endpoint)
- **Packaging & Compilation:** JSZip (`jszip`) for client/server `.zip` handling and a local Apache Maven (`mvn clean package`) compilation route (`/api/compile`)

---

## Main Features in Source

- **Plugin Generator (`/create`, `/api/generate`, `/api/generate/stream`):**
  - Supports multiple complexity tiers (`Simple`, `Medium`, `Advanced`) and target Minecraft versions (`1.19.4` to `1.21.4`).
  - Streams generated multi-file plugin source code over Server-Sent Events (SSE) and parses output into structured file trees (`CodeViewer`).
  - Exports complete Maven project structures (`pom.xml`, `plugin.yml`, Java sources) as downloadable `.zip` archives.
- **Plugin Debugger (`/debug`, `/api/debug`):**
  - Accepts server error logs / stack traces and existing plugin `.zip` uploads (`ZipUploader` with path-traversal and size sanitization in `lib/server/zipSanitizer.js`).
  - Produces patched files and renders changes in a side-by-side/unified diff viewer (`DiffViewer`).
- **Plugin Version Updater (`/update`, `/api/update`):**
  - Analyzes uploaded plugin source archives and updates API usage and metadata for newer Paper/Spigot releases.
- **Maven Compiler Endpoint (`/api/compile`):**
  - Sanitizes `pom.xml` declarations to strip non-whitelisted Maven plugins and execution tags, writes source files to a temporary build directory, invokes `mvn clean package`, and returns the compiled `.jar` encoded in Base64.
- **Explore & Community Catalog (`/explore`, `/marketplace`, `/api/plugins`):**
  - Displays sample plugins (`lib/examplePlugins.js`) and supports Supabase-backed community plugin listings and voting (`/api/plugins/[id]/vote`).
- **Session & Credit Entitlements (`/pricing`, `/account`, `/api/session/*`, `/api/stripe/*`):**
  - Issues HMAC-SHA256 signed credit tokens (`lib/server/session.js`) and integrates with Stripe Checkout and webhook claim verification.

---

## Local Setup & Installation

### Prerequisites

- **Node.js** 18.17+ (or 20+ LTS) and `npm`
- *(Optional, for local `.jar` compilation via `/api/compile`)* **Java JDK 17/21** and **Apache Maven (`mvn`)** available on your system `PATH`

### 1. Install Dependencies

```bash
npm ci
```

### 2. Configure Environment Variables

Copy the example environment file to `.env.local`:

```bash
cp .env.local.example .env.local
```

Populate `.env.local` with at least one AI provider key (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`) and a `CIY_SESSION_SECRET` (at least 32 characters). Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Run the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Production Build (Local Verification)

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Optional (set explicitly for your deployment) | Canonical base URL used for metadata, sitemap, and Stripe redirects |
| `CIY_SESSION_SECRET` | **Required for session routes in all environments** | Secret key (>= 32 chars) used to HMAC-sign session and credit tokens |
| `GEMINI_API_KEY` | At least one AI key required for generation | Google Gemini API key for server-side generation routes |
| `ANTHROPIC_API_KEY` | Optional (required for Claude / Hybrid) | Anthropic API key for Claude models and Hybrid Architect step |
| `OPENAI_API_KEY` | Optional (required for OpenAI provider) | OpenAI API key for GPT models |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional in dev | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional in dev | Supabase anonymous client key |
| `SUPABASE_URL` | Optional in dev | Server-side Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional in dev | Supabase service-role key for server-side credit/profile updates |
| `STRIPE_SECRET_KEY` | Optional in dev | Stripe secret key for Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Optional in dev | Stripe webhook signing secret for `/api/stripe/webhook` |
| `STRIPE_PRICE_STARTER` | Optional in dev | Stripe Price ID for Starter monthly plan |
| `STRIPE_PRICE_CRAFTER` | Optional in dev | Stripe Price ID for Crafter monthly plan |
| `STRIPE_PRICE_MASTER` | Optional in dev | Stripe Price ID for Master monthly plan |
| `STRIPE_PRICE_PASS_NORMAL` | Optional in dev | Stripe Price ID for Normal credit pack |
| `STRIPE_PRICE_PASS_MEDIUM` | Optional in dev | Stripe Price ID for Medium credit pack |
| `STRIPE_PRICE_PASS_ADVANCED` | Optional in dev | Stripe Price ID for Advanced credit pack |
| `UPSTASH_REDIS_REST_URL` | Optional in dev | Upstash Redis REST endpoint for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional in dev | Upstash Redis bearer token |
| `SENTRY_DSN` | Optional | Sentry DSN for server error reporting |
| `SENTRY_RELEASE` | Optional | Release identifier attached to Sentry events |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project key for client analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | PostHog ingestion host (defaults to `https://us.i.posthog.com`) |
| `RESEND_API_KEY` | Optional | Resend API key for `/api/contact` transactional emails |
| `CONTACT_TO_EMAIL` | Optional | Destination email address for contact submissions |
| `CONTACT_FROM_EMAIL` | Optional | Verified sender address for Resend |

---

## Vercel Deployment Notes & Current Limitations

### Vercel Import Settings (Next.js 14)

- **Framework Preset:** Next.js (this project uses **Next.js 14** — `14.2.0`)
- **Root Directory:** `./`
- **Build Command:** `next build` (or default `npm run build`)
- **Output Directory:** `.next` (Next.js default)
- **Install Command:** `npm ci`
- **Environment Variables:** Configure the required variables from the table above in the Vercel project settings before building.

### Important Limitation: Maven Compilation (`/api/compile`)

- The `/api/compile` route writes generated Java files to `scratch/builds/<uuid>` and spawns `mvn clean package` via Node's `child_process.exec`.
- **Vercel serverless functions do not provide a Java JDK or Apache Maven (`mvn`)**, and the deployment filesystem outside `/tmp` is read-only.
- As a result, **in-browser `.jar` compilation will not run on a standard Vercel deployment** unless `/api/compile` is adapted to delegate builds to an external Java/Maven build service or containerized worker (e.g., Railway, Fly.io, Cloud Run, or a dedicated build runner).
- Source code generation (`/create`), debugging (`/debug`), version updating (`/update`), code inspection, and `.zip` project downloads are intended for Node.js hosting. Configure their integrations and validate them on the selected deployment; this repository does not establish that they have been deployed successfully.

### Additional Development Limitations

- When Supabase environment variables are not configured, authentication and credit tracking fall back to client-side local storage and signed session tokens for local prototyping. To persist accounts, credits, and community plugins, run `lib/supabase/schema.sql` in a Supabase project and configure the Supabase environment variables.
- When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are omitted, rate limiting falls back to an in-memory `Map`, which does not share state across serverless instances.
