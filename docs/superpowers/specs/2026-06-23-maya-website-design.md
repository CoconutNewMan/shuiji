# Maya Galactic Signature Website — Design Spec
Date: 2026-06-23

## Overview
A full-stack web app for 一号能量馆 that serves as both a **lead-generation tool** (Maya totem calculator → WhatsApp booking) and an **education platform** (learn Maya calendar system).

## Tech Stack
- **Frontend:** Next.js 14 (App Router)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel (free tier)
- **i18n:** next-intl (ZH / EN / BM)
- **Styling:** Tailwind CSS

## Pages / Routes
```
/[locale]/                        Homepage
/[locale]/query                   Maya totem calculator
/[locale]/learn                   Learning hub
/[locale]/learn/seals             20 seals list
/[locale]/learn/seals/[slug]      Single seal detail
/[locale]/learn/tones             13 tones list
/[locale]/learn/tones/[slug]      Single tone detail
/[locale]/learn/wavespell         Wavespell explainer
/[locale]/learn/13-moons          13 Moon Calendar explainer
/[locale]/blog                    Article list
/[locale]/blog/[slug]             Single article
/[locale]/auth/login              Login / Register
/[locale]/dashboard               User saved readings
/admin                            Admin panel (leads + content + articles)
```

## Key Features

### 1. Maya Calculator (/query)
- Input: name, phone, birthday
- Output: KIN number, seal, tone, oracle cross (guide/support/challenge/hidden), wavespell position, inner goddess, 13-moon date
- Save lead to Supabase `leads` table
- WhatsApp CTA button → wa.me/601168270881

### 2. User Accounts
- Supabase Auth (email + password)
- Logged-in users: readings auto-saved to `readings` table
- Dashboard: view history of own readings

### 3. Learning Content
- Seals and tones stored in Supabase `seals` / `tones` tables (editable via admin)
- Blog articles in `articles` table
- All content has ZH / EN / BM fields

### 4. Admin Panel (/admin)
- Password-protected (Supabase role: admin)
- View/export leads (name, phone, birthday, KIN, signature, timestamp)
- Edit seal/tone descriptions (WYSIWYG-lite textarea)
- Create/edit/delete blog articles
- "Open WhatsApp" quick-action per lead

### 5. i18n (ZH / EN / BM)
- next-intl with locale prefix routing
- Translation files: `messages/zh.json`, `messages/en.json`, `messages/bm.json`
- All UI strings + Maya content descriptions in all 3 languages

## Database Schema (Supabase)

### leads
| column | type |
|--------|------|
| id | uuid PK |
| created_at | timestamptz |
| name | text |
| phone | text |
| birthday | date |
| kin | int |
| signature | text |
| locale | text |

### readings (user-saved)
| column | type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK → auth.users |
| created_at | timestamptz |
| kin | int |
| data | jsonb |

### seals
| column | type |
|--------|------|
| id | int PK (1-20) |
| slug | text |
| color | text (R/W/B/Y) |
| name_zh / name_en / name_bm | text |
| keywords_zh / keywords_en / keywords_bm | text[] |
| description_zh / description_en / description_bm | text |

### tones
| column | type |
|--------|------|
| id | int PK (1-13) |
| name_zh / name_en / name_bm | text |
| question_zh / question_en / question_bm | text |
| description_zh / description_en / description_bm | text |

### articles
| column | type |
|--------|------|
| id | uuid PK |
| slug | text |
| published_at | timestamptz |
| title_zh / title_en / title_bm | text |
| body_zh / body_en / body_bm | text (markdown) |

## Booking Flow
- Every result page has a sticky WhatsApp button
- wa.me/601168270881 with pre-filled message including the user's KIN + signature
- No in-app payment in v1

## Deployment
1. `npx create-next-app` → push to GitHub
2. Connect GitHub to Vercel (auto-deploy on push)
3. Create Supabase project → run SQL schema
4. Add env vars to Vercel: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
