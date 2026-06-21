# AI Marketing Operating System — Design Spec
Date: 2026-06-21

## Overview

A SaaS platform for marketers. Users create "Files" (one per brand/project), then use AI tools inside each File to analyze competitors, generate copy, and build landing pages. Powered by Claude AI, Supabase, and deployed on Vercel.

---

## Infrastructure

| Component | Choice |
|-----------|--------|
| Frontend | React + TypeScript + Vite |
| Hosting | Vercel |
| Backend | Supabase Edge Functions (TypeScript) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email + password) |
| AI | Claude API (claude-sonnet-4-6) |

**Claude API Key:** stored only in Supabase Edge Function environment variables. Never in frontend code or git.

---

## Security Model

1. **Transport**: HTTPS everywhere (Vercel enforces this)
2. **Auth**: Supabase JWT — every Edge Function call validates the token before doing anything
3. **Authorization**: Edge Functions verify `file.user_id === auth.uid()` before processing requests
4. **Data**: PostgreSQL RLS — database-level enforcement, blocks cross-user reads/writes even if API is bypassed
5. **Secrets**: Claude API Key and Service Role Key only in Supabase environment variables, in `.gitignore` locally

---

## Database Schema

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  token_balance INTEGER DEFAULT 5000,
  max_files INTEGER DEFAULT 2,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files (one per brand/project, max 2 for free tier)
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  direction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- File Data (stores AI output per tool)
CREATE TABLE IF NOT EXISTS file_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('page_analysis', 'swot', 'copy', 'landing_page')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Learning (pattern storage for future personalization)
CREATE TABLE IF NOT EXISTS ai_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  context JSONB,
  effectiveness FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facebook Pages (tracked pages per file)
CREATE TABLE IF NOT EXISTS facebook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  fb_page_id TEXT NOT NULL,
  fb_page_name TEXT,
  fb_page_url TEXT,
  page_type TEXT CHECK (page_type IN ('own', 'competitor', 'reference')),
  last_scanned TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Auto-init strategy**: On app startup, the frontend calls a `/initialize` Edge Function (using Service Role Key) that checks if tables exist and creates them if not. No manual SQL required.

---

## Page Structure & Routes

```
/                   Login / Register
/dashboard          File list (max 2 files for free tier)
/file/:id           File home — 4 tool cards
/file/:id/analysis  Page analysis + SWOT
/file/:id/copy      Copy library
/file/:id/landing   Landing page generator + preview
/admin              Admin UI (is_admin = true only)
```

---

## User Flow

```
Register / Login (Supabase Auth)
    ↓
Dashboard — see File list, create new File
    ↓
Create File (name, industry, direction)
    ↓
File Home — 4 tool cards:
    ├── Page Analysis
    │     Input: Facebook Page URL (scraped) OR manual text paste
    │     Output: Structured analysis + SWOT matrix (Claude)
    │     Fallback: If scrape fails → prompt user to paste manually
    │
    ├── Copy Library
    │     Input: Select from saved analysis results
    │     Output: Title (2 versions) + Body (2 versions) + CTA (2 versions)
    │     Format: Structured cards, copy-to-clipboard per field
    │
    ├── Landing Page
    │     Input: Select from saved copy
    │     Output: Claude-generated HTML → iframe preview → download button
    │
    └── Image / Video (placeholder — "Coming Soon")
```

---

## Edge Functions

| Function | Auth | Description |
|----------|------|-------------|
| `POST /scrape-page` | JWT required | Fetch Facebook public page HTML, extract text |
| `POST /analyze-page` | JWT required | Claude analysis + SWOT from text input |
| `POST /generate-copy` | JWT required | Claude generates structured copy (title/body/CTA × 2) |
| `POST /generate-landing` | JWT required | Claude generates full HTML landing page |
| `POST /initialize` | Service Role | Creates DB tables if not exist (called once on app start) |
| `GET /admin/users` | JWT + is_admin | List all users |
| `PATCH /admin/users/:id` | JWT + is_admin | Update tier / token balance / active status |
| `DELETE /admin/users/:id` | JWT + is_admin | Delete user |
| `GET /admin/files` | JWT + is_admin | List all files |
| `DELETE /admin/files/:id` | JWT + is_admin | Delete any file |
| `GET /admin/stats` | JWT + is_admin | Total users, files, Claude API call count |

---

## Admin UI (`/admin`)

Access: `users.is_admin = true` only. Frontend redirects non-admin to dashboard. Edge Functions also verify `is_admin` server-side.

**Sections:**
- **Users**: table with email, tier, token balance, created date — edit tier, top up tokens, delete
- **Files**: table with file name, owner email, created date — delete
- **Stats**: total users, total files, Claude API calls (counted from `file_data` rows)

**Bootstrap**: First admin is set by running a direct SQL update in Supabase Dashboard: `UPDATE users SET is_admin = true WHERE email = 'your@email.com'`

---

## Tier Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Files | 2 | 10 | Unlimited |
| Token balance | 5,000 | 50,000 | 500,000 |
| Image gen | — | ✓ (placeholder) | ✓ |
| Video gen | — | — | ✓ (placeholder) |

Token top-up and tier upgrade UI: placeholder only, no real payment in v1.

---

## Token Deduction (approximate)

| Action | Est. tokens |
|--------|-------------|
| Page analysis + SWOT | ~2,000 |
| Copy generation | ~1,500 |
| Landing page | ~3,000 |

Each Edge Function deducts from `users.token_balance` after successful Claude call. If balance < required, return 402 error with upgrade prompt.

---

## Out of Scope (v1)

- Real payment / Stripe integration
- Video generation (Seedance) — placeholder UI only
- Image generation — placeholder UI only
- WhatsApp integration — placeholder UI only
- Email marketing tools
- Multi-language UI (Chinese only for v1)

---

## Environment Variables

**Local `.env` (gitignored):**
```
VITE_SUPABASE_URL=https://tfbubpuzvqwryyajimtw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Supabase Edge Function secrets:**
```
CLAUDE_API_KEY=sk-ant-api03-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_URL=https://tfbubpuzvqwryyajimtw.supabase.co
```

**Vercel environment variables:** same as local `.env` above (VITE_ prefixed).
