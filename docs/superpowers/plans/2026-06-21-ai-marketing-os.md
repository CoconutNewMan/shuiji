# AI Marketing OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack AI SaaS platform for marketers — File management, Page analysis, copy generation, landing page creation, and Admin UI.

**Architecture:** React + Vite (Vercel) → Supabase Edge Functions (Deno/TypeScript) → Claude API. All secrets live exclusively in Edge Function environment variables. PostgreSQL with RLS enforced at the database level.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6, @supabase/supabase-js, Supabase Edge Functions (Deno), Claude API (claude-sonnet-4-6), Vercel

## Global Constraints

- Claude model: `claude-sonnet-4-6`
- Supabase project ref: `tfbubpuzvqwryyajimtw`
- Supabase URL: `https://tfbubpuzvqwryyajimtw.supabase.co`
- Supabase anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmYnVicHV6dnF3cnl5cWppbXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTg3MzQsImV4cCI6MjA5NzU5NDczNH0.v39EOCNX8KQ8iVlXxrigpKfRCU6EpwIBMGLms5h80eE`
- Supabase service role key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmYnVicHV6dnF3cnl5cWppbXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAxODczNCwiZXhwIjoyMDk3NTk0NzM0fQ.3pbMZq7YlGU44AcIq0n1esTh3JoMqbmvpsvemZp56IU`
- Claude API key: `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`
- All Edge Functions MUST verify JWT before processing (except `/initialize`)
- Admin operations MUST verify `is_admin = true` server-side in Edge Function
- Claude API Key MUST NOT appear in any frontend file or any git-tracked file
- Free tier: max 2 files, 5000 token balance
- UI language: Chinese (Simplified)
- No payment integration in v1
- DB init: `/initialize` Edge Function uses postgres package + `DATABASE_URL` secret (user copies from Supabase Dashboard > Project Settings > Database > Connection string > URI)

---

## File Structure

```
BaoKuan/
├── .env                              # gitignored
├── .env.example
├── .gitignore
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/index.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useFiles.ts
│   ├── components/
│   │   ├── AuthGuard.tsx
│   │   ├── AdminGuard.tsx
│   │   ├── FileCard.tsx
│   │   ├── ToolCard.tsx
│   │   └── TokenBadge.tsx
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── FilePage.tsx
│       ├── Analysis.tsx
│       ├── Copy.tsx
│       ├── Landing.tsx
│       └── Admin.tsx
└── supabase/
    └── functions/
        ├── _shared/
        │   ├── cors.ts
        │   └── auth.ts
        ├── initialize/index.ts
        ├── scrape-page/index.ts
        ├── analyze-page/index.ts
        ├── generate-copy/index.ts
        ├── generate-landing/index.ts
        └── admin/index.ts
```

---

### Task 1: Project Scaffold

**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `.gitignore`, `.env`, `.env.example`, `vercel.json`, `src/index.css`, `src/main.tsx`

**Interfaces:**
- Produces: working `npm run dev` and `npm run build`

- [ ] **Step 1: Scaffold Vite React TS project**

Run in `C:\Users\hawki\OneDrive\Desktop\File\BaoKuan`:
```
npm create vite@latest . -- --template react-ts
```
When prompted about existing files, choose to remove them and continue.

- [ ] **Step 2: Install dependencies**

```
npm install @supabase/supabase-js react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind — replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules
dist
.env
.env.local
supabase/.env
```

- [ ] **Step 6: Create `.env`**

```
VITE_SUPABASE_URL=https://tfbubpuzvqwryyajimtw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmYnVicHV6dnF3cnl5cWppbXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTg3MzQsImV4cCI6MjA5NzU5NDczNH0.v39EOCNX8KQ8iVlXxrigpKfRCU6EpwIBMGLms5h80eE
```

- [ ] **Step 7: Create `.env.example`**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 8: Create `vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 9: Replace `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 10: Verify dev server starts**

Run: `npm run dev`
Expected: Vite server at `http://localhost:5173` with no errors in terminal.

- [ ] **Step 11: Commit**

```
git init
git add -A
git commit -m "feat: scaffold React + Vite + Tailwind"
```

---

### Task 2: Types + Supabase Client + API Layer

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/supabase.ts`
- Create: `src/lib/api.ts`

**Interfaces:**
- Produces: `supabase` client singleton; typed `callFunction(name, body, token)` helper; all shared TS types

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
export interface AppUser {
  id: string
  email: string
  tier: 'free' | 'pro' | 'enterprise'
  token_balance: number
  max_files: number
  is_admin: boolean
  created_at: string
}

export interface File {
  id: string
  user_id: string
  name: string
  industry: string | null
  direction: string | null
  created_at: string
}

export interface AnalysisContent {
  source: 'url' | 'manual'
  input_url?: string
  raw_text: string
  analysis: string
  swot: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
}

export interface CopyContent {
  analysis_id: string
  versions: {
    title: [string, string]
    body: [string, string]
    cta: [string, string]
  }
}

export interface LandingContent {
  copy_id: string
  html: string
}

export interface FileData {
  id: string
  file_id: string
  data_type: 'page_analysis' | 'copy' | 'landing_page'
  content: AnalysisContent | CopyContent | LandingContent
  created_at: string
}

export interface AdminUser extends AppUser {
  files_count?: number
}
```

- [ ] **Step 2: Create `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) throw new Error('Missing Supabase env vars')

export const supabase = createClient(url, key)
```

- [ ] **Step 3: Create `src/lib/api.ts`**

```typescript
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

export async function callFunction<T>(
  name: string,
  body: Record<string, unknown>,
  token: string
): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Function call failed')
  }

  return res.json()
}

export async function callAdmin<T>(
  path: string,
  method: string,
  token: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/admin/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Admin call failed')
  }

  return res.json()
}
```

- [ ] **Step 4: Commit**

```
git add src/types/index.ts src/lib/supabase.ts src/lib/api.ts
git commit -m "feat: add types, supabase client, api helpers"
```

---

### Task 3: Edge Function Shared Helpers

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/auth.ts`

**Interfaces:**
- Produces: `corsHeaders` object; `verifyUser(req)` → `{ supabase, user, dbUser }`; `verifyAdmin(req)` → same + admin check

- [ ] **Step 1: Create `supabase/functions/_shared/cors.ts`**

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PATCH, DELETE',
}
```

- [ ] **Step 2: Create `supabase/functions/_shared/auth.ts`**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

export async function verifyUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    throw new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: dbUser, error: dbError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (dbError || !dbUser) {
    throw new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return { supabase: supabaseAdmin, user, dbUser }
}

export async function verifyAdmin(req: Request) {
  const result = await verifyUser(req)
  if (!result.dbUser.is_admin) {
    throw new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  return result
}
```

- [ ] **Step 3: Commit**

```
git add supabase/
git commit -m "feat: add edge function shared helpers"
```

---

### Task 4: Initialize Edge Function (DB Auto-Setup)

**Files:**
- Create: `supabase/functions/initialize/index.ts`

**Interfaces:**
- Produces: `POST /initialize` — creates all tables + RLS policies if they don't exist
- Requires: `DATABASE_URL` secret set in Supabase Edge Functions (postgres connection string)

**Pre-condition:** User must get `DATABASE_URL` from:
Supabase Dashboard → Project Settings → Database → Connection string → URI (Direct connection, port 5432)
Set it as a secret: `supabase secrets set DATABASE_URL="postgresql://postgres:[password]@db.tfbubpuzvqwryyajimtw.supabase.co:5432/postgres"`

- [ ] **Step 1: Create `supabase/functions/initialize/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  token_balance INTEGER DEFAULT 5000,
  max_files INTEGER DEFAULT 2,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS file_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('page_analysis', 'copy', 'landing_page')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS facebook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  fb_page_url TEXT NOT NULL,
  fb_page_name TEXT,
  page_type TEXT CHECK (page_type IN ('own', 'competitor', 'reference')),
  last_scanned TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_select_own' AND tablename = 'users') THEN
    CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own' AND tablename = 'users') THEN
    CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'files_all_own' AND tablename = 'files') THEN
    CREATE POLICY "files_all_own" ON files FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'file_data_all_own' AND tablename = 'file_data') THEN
    CREATE POLICY "file_data_all_own" ON file_data FOR ALL USING (
      EXISTS (SELECT 1 FROM files WHERE files.id = file_data.file_id AND files.user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_learning_all_own' AND tablename = 'ai_learning') THEN
    CREATE POLICY "ai_learning_all_own" ON ai_learning FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'facebook_pages_all_own' AND tablename = 'facebook_pages') THEN
    CREATE POLICY "facebook_pages_all_own" ON facebook_pages FOR ALL USING (
      EXISTS (SELECT 1 FROM files WHERE files.id = facebook_pages.file_id AND files.user_id = auth.uid())
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_file_data_file_id ON file_data(file_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_user_id ON ai_learning(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pages_file_id ON facebook_pages(file_id);
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const pool = new Pool(Deno.env.get('DATABASE_URL')!, 1, true)
    const conn = await pool.connect()
    try {
      await conn.queryObject(SQL)
    } finally {
      conn.release()
    }
    await pool.end()

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Initialize error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```
git add supabase/functions/initialize/
git commit -m "feat: add initialize edge function for DB auto-setup"
```

---

### Task 5: Auth Hook + Login Page

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/pages/Login.tsx`

**Interfaces:**
- Produces: `useAuth()` → `{ user, dbUser, session, loading, login, register, logout }`

- [ ] **Step 1: Create `src/hooks/useAuth.ts`**

```typescript
import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AppUser } from '../types'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchDbUser(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchDbUser(session.user.id)
      else { setDbUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchDbUser(userId: string) {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    setDbUser(data)
    setLoading(false)
  }

  async function register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
      })
    }
    return data
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { session, user, dbUser, loading, login, register, logout }
}
```

- [ ] **Step 2: Create `src/pages/Login.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
        navigate('/dashboard')
      } else {
        await register(email, password)
        setSuccess('注册成功！请检查邮箱验证链接，然后登入。')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Marketing OS</h1>
        <p className="text-gray-500 mb-6">营销人的 AI 作战室</p>

        <div className="flex border-b mb-6">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              {t === 'login' ? '登入' : '注册'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">电子邮件</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '处理中...' : tab === 'login' ? '登入' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
git add src/hooks/useAuth.ts src/pages/Login.tsx
git commit -m "feat: add auth hook and login/register page"
```

---

### Task 6: Routing + Guards + App Shell

**Files:**
- Create: `src/components/AuthGuard.tsx`
- Create: `src/components/AdminGuard.tsx`
- Create: `src/components/TokenBadge.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/hooks/useAuth.ts`
- Produces: protected routes; token balance badge

- [ ] **Step 1: Create `src/components/AuthGuard.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}
```

- [ ] **Step 2: Create `src/components/AdminGuard.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { dbUser, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>
  if (!dbUser?.is_admin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
```

- [ ] **Step 3: Create `src/components/TokenBadge.tsx`**

```tsx
import { useAuth } from '../hooks/useAuth'

export default function TokenBadge() {
  const { dbUser } = useAuth()
  if (!dbUser) return null
  const pct = Math.min(100, (dbUser.token_balance / 5000) * 100)
  const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span>{dbUser.token_balance.toLocaleString()} tokens</span>
    </div>
  )
}
```

- [ ] **Step 4: Replace `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import AdminGuard from './components/AdminGuard'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FilePage from './pages/FilePage'
import Analysis from './pages/Analysis'
import Copy from './pages/Copy'
import Landing from './pages/Landing'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/file/:id" element={<AuthGuard><FilePage /></AuthGuard>} />
        <Route path="/file/:id/analysis" element={<AuthGuard><Analysis /></AuthGuard>} />
        <Route path="/file/:id/copy" element={<AuthGuard><Copy /></AuthGuard>} />
        <Route path="/file/:id/landing" element={<AuthGuard><Landing /></AuthGuard>} />
        <Route path="/admin" element={<AuthGuard><AdminGuard><Admin /></AdminGuard></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Create placeholder pages so routes compile**

Create `src/pages/Dashboard.tsx`, `src/pages/FilePage.tsx`, `src/pages/Analysis.tsx`, `src/pages/Copy.tsx`, `src/pages/Landing.tsx`, `src/pages/Admin.tsx` — each as a minimal placeholder:

```tsx
// Example for Dashboard.tsx (repeat pattern for the others, changing the label)
export default function Dashboard() {
  return <div className="p-8 text-gray-500">Dashboard — coming soon</div>
}
```

- [ ] **Step 6: Verify build compiles**

```
npm run build
```
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```
git add src/
git commit -m "feat: add routing, guards, app shell"
```

---

### Task 7: File CRUD — Hook + Dashboard Page

**Files:**
- Create: `src/hooks/useFiles.ts`
- Create: `src/components/FileCard.tsx`
- Replace: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`; `useAuth()` from `src/hooks/useAuth.ts`
- Produces: `useFiles(userId)` → `{ files, loading, createFile, deleteFile }`

- [ ] **Step 1: Create `src/hooks/useFiles.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { File } from '../types'

export function useFiles(userId: string | undefined) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFiles = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  async function createFile(name: string, industry: string, direction: string) {
    const { data, error } = await supabase
      .from('files')
      .insert({ user_id: userId, name, industry, direction })
      .select()
      .single()
    if (error) throw error
    setFiles((prev) => [data, ...prev])
    return data
  }

  async function deleteFile(id: string) {
    const { error } = await supabase.from('files').delete().eq('id', id)
    if (error) throw error
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return { files, loading, createFile, deleteFile, refetch: fetchFiles }
}
```

- [ ] **Step 2: Create `src/components/FileCard.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { File } from '../types'

interface Props {
  file: File
  onDelete: (id: string) => void
}

export default function FileCard({ file, onDelete }: Props) {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex justify-between items-start hover:shadow-md transition-shadow">
      <div
        className="cursor-pointer flex-1"
        onClick={() => navigate(`/file/${file.id}`)}
      >
        <h3 className="font-semibold text-gray-900">{file.name}</h3>
        {file.industry && <p className="text-sm text-gray-500 mt-1">{file.industry}</p>}
        {file.direction && <p className="text-sm text-gray-400 mt-0.5">{file.direction}</p>}
      </div>
      <button
        onClick={() => {
          if (confirm(`确定删除「${file.name}」？`)) onDelete(file.id)
        }}
        className="text-gray-400 hover:text-red-500 transition-colors ml-4 text-sm"
      >
        删除
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Replace `src/pages/Dashboard.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useFiles } from '../hooks/useFiles'
import FileCard from '../components/FileCard'
import TokenBadge from '../components/TokenBadge'

export default function Dashboard() {
  const { dbUser, logout } = useAuth()
  const { files, loading, createFile, deleteFile } = useFiles(dbUser?.id)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [direction, setDirection] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const canCreate = files.length < (dbUser?.max_files ?? 2)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await createFile(name, industry, direction)
      setShowForm(false)
      setName(''); setIndustry(''); setDirection('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-900">AI Marketing OS</h1>
        <div className="flex items-center gap-4">
          <TokenBadge />
          {dbUser?.is_admin && (
            <button onClick={() => navigate('/admin')} className="text-sm text-purple-600 hover:underline">
              管理后台
            </button>
          )}
          <span className="text-sm text-gray-500">{dbUser?.email}</span>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">登出</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">我的 Files</h2>
          <button
            onClick={() => setShowForm(true)}
            disabled={!canCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            + 新建 File
          </button>
        </div>

        {!canCreate && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-4">
            免费版最多 {dbUser?.max_files} 个 File。升级 Pro 可建更多。
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border p-5 mb-4 space-y-3">
            <h3 className="font-medium text-gray-900">新建 File</h3>
            <input
              placeholder="File 名称（例：品牌A）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="行业（例：餐饮、电商）"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="方向/定位（例：高端路线）"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {creating ? '创建中...' : '创建'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
                取消
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">加载中...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">还没有 File，点击「新建 File」开始</p>
        ) : (
          <div className="space-y-3">
            {files.map((f) => (
              <FileCard key={f.id} file={f} onDelete={deleteFile} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Expected: login → dashboard shows File list with create form. Create a file → it appears in the list.

- [ ] **Step 5: Commit**

```
git add src/
git commit -m "feat: file CRUD - hook, dashboard, file card"
```

---

### Task 8: File Home Page

**Files:**
- Create: `src/components/ToolCard.tsx`
- Replace: `src/pages/FilePage.tsx`

**Interfaces:**
- Consumes: `useAuth()`, React Router `useParams`

- [ ] **Step 1: Create `src/components/ToolCard.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  description: string
  icon: string
  href: string
  comingSoon?: boolean
}

export default function ToolCard({ title, description, icon, href, comingSoon }: Props) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => !comingSoon && navigate(href)}
      className={`bg-white rounded-xl border p-5 transition-all ${
        comingSoon
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md hover:border-blue-300 cursor-pointer'
      }`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {comingSoon && (
        <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">即将推出</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/pages/FilePage.tsx`**

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { File } from '../types'
import ToolCard from '../components/ToolCard'
import TokenBadge from '../components/TokenBadge'

export default function FilePage() {
  const { id } = useParams<{ id: string }>()
  const [file, setFile] = useState<File | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('files').select('*').eq('id', id!).single().then(({ data }) => setFile(data))
  }, [id])

  if (!file) return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
          <h1 className="text-lg font-bold text-gray-900">{file.name}</h1>
          {file.industry && <span className="text-sm text-gray-400">{file.industry}</span>}
        </div>
        <TokenBadge />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">选择工具</h2>
        <div className="grid grid-cols-2 gap-4">
          <ToolCard
            icon="🔍"
            title="Page 分析"
            description="分析竞品 Facebook Page，生成 SWOT"
            href={`/file/${id}/analysis`}
          />
          <ToolCard
            icon="✍️"
            title="文案库"
            description="AI 生成标题、正文、CTA 各两版"
            href={`/file/${id}/copy`}
          />
          <ToolCard
            icon="🚀"
            title="落地页"
            description="AI 生成完整 HTML 落地页"
            href={`/file/${id}/landing`}
          />
          <ToolCard
            icon="🖼️"
            title="图片生成"
            description="AI 生成营销图片"
            href=""
            comingSoon
          />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
git add src/
git commit -m "feat: file home page with tool cards"
```

---

### Task 9: scrape-page Edge Function

**Files:**
- Create: `supabase/functions/scrape-page/index.ts`

**Interfaces:**
- Consumes: JWT token (user auth)
- Produces: `POST /scrape-page` — `{ url: string }` → `{ text: string, title: string }`

- [ ] **Step 1: Create `supabase/functions/scrape-page/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyUser } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    await verifyUser(req)

    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `无法访问该页面 (${response.status})`, fallback: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const html = await response.text()

    // Extract visible text — strip tags, collapse whitespace
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000) // cap at 8k chars to keep Claude prompt reasonable

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : url

    if (text.length < 100) {
      return new Response(JSON.stringify({ error: 'Facebook 限制了自动抓取，请手动粘贴内容', fallback: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ text, title, fallback: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof Response) return err
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```
git add supabase/functions/scrape-page/
git commit -m "feat: scrape-page edge function"
```

---

### Task 10: analyze-page Edge Function

**Files:**
- Create: `supabase/functions/analyze-page/index.ts`

**Interfaces:**
- Consumes: JWT; `{ file_id: string, text: string, source: 'url'|'manual', input_url?: string }`
- Produces: saves to `file_data`; returns `{ id: string, analysis: string, swot: {...} }`
- Token cost: 2000 deducted from `users.token_balance`

- [ ] **Step 1: Create `supabase/functions/analyze-page/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyUser } from '../_shared/auth.ts'

const TOKEN_COST = 2000

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { supabase, user, dbUser } = await verifyUser(req)

    if (dbUser.token_balance < TOKEN_COST) {
      return new Response(JSON.stringify({ error: 'Token 余额不足，请升级套餐' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { file_id, text, source, input_url } = await req.json()

    // Verify file belongs to user
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, user_id')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return new Response(JSON.stringify({ error: '无权访问该 File' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Call Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('CLAUDE_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `你是一位资深营销策略师。请分析以下 Facebook Page 内容，给出营销洞察和 SWOT 分析。

内容：
${text}

请用 JSON 格式回复，结构如下：
{
  "analysis": "200字以内的整体营销分析",
  "swot": {
    "strengths": ["优势1", "优势2", "优势3"],
    "weaknesses": ["劣势1", "劣势2"],
    "opportunities": ["机会1", "机会2"],
    "threats": ["威胁1", "威胁2"]
  }
}

只输出 JSON，不要其他内容。`,
        }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      throw new Error(`Claude API 错误: ${err}`)
    }

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content[0].text.trim()
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude 返回格式错误')
    const parsed = JSON.parse(jsonMatch[0])

    // Save to file_data
    const content = {
      source,
      input_url: input_url ?? null,
      raw_text: text.slice(0, 2000),
      analysis: parsed.analysis,
      swot: parsed.swot,
    }

    const { data: saved, error: saveError } = await supabase
      .from('file_data')
      .insert({ file_id, data_type: 'page_analysis', content })
      .select()
      .single()

    if (saveError) throw new Error(saveError.message)

    // Deduct tokens
    await supabase
      .from('users')
      .update({ token_balance: dbUser.token_balance - TOKEN_COST })
      .eq('id', user.id)

    return new Response(JSON.stringify({ id: saved.id, ...content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof Response) return err
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```
git add supabase/functions/analyze-page/
git commit -m "feat: analyze-page edge function with Claude + token deduction"
```

---

### Task 11: generate-copy Edge Function

**Files:**
- Create: `supabase/functions/generate-copy/index.ts`

**Interfaces:**
- Consumes: JWT; `{ file_id: string, analysis_id: string }`
- Produces: saves to `file_data`; returns `{ id, versions: { title: [v1,v2], body: [v1,v2], cta: [v1,v2] } }`
- Token cost: 1500

- [ ] **Step 1: Create `supabase/functions/generate-copy/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyUser } from '../_shared/auth.ts'

const TOKEN_COST = 1500

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { supabase, user, dbUser } = await verifyUser(req)

    if (dbUser.token_balance < TOKEN_COST) {
      return new Response(JSON.stringify({ error: 'Token 余额不足，请升级套餐' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { file_id, analysis_id } = await req.json()

    // Verify file + get analysis content
    const { data: file } = await supabase
      .from('files')
      .select('id, user_id, name, industry, direction')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single()

    if (!file) {
      return new Response(JSON.stringify({ error: '无权访问该 File' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: analysisRow } = await supabase
      .from('file_data')
      .select('content')
      .eq('id', analysis_id)
      .eq('file_id', file_id)
      .single()

    if (!analysisRow) {
      return new Response(JSON.stringify({ error: '找不到分析数据' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const analysis = analysisRow.content as { analysis: string; swot: Record<string, string[]> }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('CLAUDE_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `你是资深营销文案专家。根据以下品牌分析，生成两套营销文案。

品牌：${file.name}
行业：${file.industry ?? '未指定'}
定位：${file.direction ?? '未指定'}
分析摘要：${analysis.analysis}
优势：${(analysis.swot?.strengths ?? []).join('、')}

请生成两套风格不同的文案（版本A较专业正式，版本B较亲切活泼）。

用 JSON 格式回复：
{
  "title": ["版本A标题（20字以内）", "版本B标题（20字以内）"],
  "body": ["版本A正文（100字以内）", "版本B正文（100字以内）"],
  "cta": ["版本A行动呼吁（10字以内）", "版本B行动呼吁（10字以内）"]
}

只输出 JSON，不要其他内容。`,
        }],
      }),
    })

    if (!claudeRes.ok) throw new Error(`Claude API 错误: ${await claudeRes.text()}`)

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content[0].text.trim()
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Claude 返回格式错误')
    const versions = JSON.parse(jsonMatch[0])

    const content = { analysis_id, versions }

    const { data: saved, error: saveError } = await supabase
      .from('file_data')
      .insert({ file_id, data_type: 'copy', content })
      .select()
      .single()

    if (saveError) throw new Error(saveError.message)

    await supabase
      .from('users')
      .update({ token_balance: dbUser.token_balance - TOKEN_COST })
      .eq('id', user.id)

    return new Response(JSON.stringify({ id: saved.id, versions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof Response) return err
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```
git add supabase/functions/generate-copy/
git commit -m "feat: generate-copy edge function"
```

---

### Task 12: generate-landing Edge Function

**Files:**
- Create: `supabase/functions/generate-landing/index.ts`

**Interfaces:**
- Consumes: JWT; `{ file_id: string, copy_id: string }`
- Produces: saves to `file_data`; returns `{ id, html: string }`
- Token cost: 3000

- [ ] **Step 1: Create `supabase/functions/generate-landing/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyUser } from '../_shared/auth.ts'

const TOKEN_COST = 3000

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { supabase, user, dbUser } = await verifyUser(req)

    if (dbUser.token_balance < TOKEN_COST) {
      return new Response(JSON.stringify({ error: 'Token 余额不足，请升级套餐' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { file_id, copy_id, version = 0 } = await req.json()

    const { data: file } = await supabase
      .from('files')
      .select('id, user_id, name, industry, direction')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single()

    if (!file) {
      return new Response(JSON.stringify({ error: '无权访问该 File' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: copyRow } = await supabase
      .from('file_data')
      .select('content')
      .eq('id', copy_id)
      .eq('file_id', file_id)
      .single()

    if (!copyRow) {
      return new Response(JSON.stringify({ error: '找不到文案数据' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { versions } = copyRow.content as { versions: { title: string[]; body: string[]; cta: string[] } }
    const v = version as number
    const title = versions.title[v] ?? versions.title[0]
    const body = versions.body[v] ?? versions.body[0]
    const cta = versions.cta[v] ?? versions.cta[0]

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('CLAUDE_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `你是专业的落地页设计师和前端工程师。请根据以下内容生成一个完整的 HTML 落地页。

品牌：${file.name}
行业：${file.industry ?? ''}
标题：${title}
正文：${body}
行动呼吁：${cta}

要求：
- 完整的单页 HTML，包含内联 CSS（不用外部依赖）
- 现代美观的设计，响应式布局
- 颜色方案专业，符合行业调性
- 包含：Hero 区域、特点介绍、CTA 按钮
- 中文内容
- 只输出 HTML 代码，从 <!DOCTYPE html> 开始，不要加其他说明`,
        }],
      }),
    })

    if (!claudeRes.ok) throw new Error(`Claude API 错误: ${await claudeRes.text()}`)

    const claudeData = await claudeRes.json()
    const html = claudeData.content[0].text.trim()

    const content = { copy_id, html }

    const { data: saved, error: saveError } = await supabase
      .from('file_data')
      .insert({ file_id, data_type: 'landing_page', content })
      .select()
      .single()

    if (saveError) throw new Error(saveError.message)

    await supabase
      .from('users')
      .update({ token_balance: dbUser.token_balance - TOKEN_COST })
      .eq('id', user.id)

    return new Response(JSON.stringify({ id: saved.id, html }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof Response) return err
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```
git add supabase/functions/generate-landing/
git commit -m "feat: generate-landing edge function"
```

---

### Task 13: Analysis Page UI

**Files:**
- Replace: `src/pages/Analysis.tsx`

**Interfaces:**
- Consumes: `callFunction()` from `src/lib/api.ts`; `useAuth()`; React Router `useParams`

- [ ] **Step 1: Replace `src/pages/Analysis.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callFunction } from '../lib/api'
import { supabase } from '../lib/supabase'
import { FileData, AnalysisContent } from '../types'

export default function Analysis() {
  const { id: fileId } = useParams<{ id: string }>()
  const { session, dbUser } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'url' | 'manual'>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<FileData[]>([])
  const [selected, setSelected] = useState<FileData | null>(null)

  useEffect(() => {
    supabase
      .from('file_data')
      .select('*')
      .eq('file_id', fileId!)
      .eq('data_type', 'page_analysis')
      .order('created_at', { ascending: false })
      .then(({ data }) => setHistory(data ?? []))
  }, [fileId])

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let inputText = text
      let source: 'url' | 'manual' = mode

      if (mode === 'url') {
        const scrapeRes = await callFunction<{ text: string; fallback: boolean; error?: string }>(
          'scrape-page',
          { url },
          session!.access_token
        )
        if (scrapeRes.fallback) {
          setError(scrapeRes.error ?? '无法抓取，请手动粘贴内容')
          setMode('manual')
          setLoading(false)
          return
        }
        inputText = scrapeRes.text
      }

      const result = await callFunction<AnalysisContent & { id: string }>(
        'analyze-page',
        { file_id: fileId, text: inputText, source, input_url: mode === 'url' ? url : undefined },
        session!.access_token
      )

      const newEntry: FileData = {
        id: result.id,
        file_id: fileId!,
        data_type: 'page_analysis',
        content: result,
        created_at: new Date().toISOString(),
      }
      setHistory((prev) => [newEntry, ...prev])
      setSelected(newEntry)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '分析失败')
    } finally {
      setLoading(false)
    }
  }

  const content = selected?.content as AnalysisContent | undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/file/${fileId}`)} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
        <h1 className="text-lg font-bold">Page 分析</h1>
        <span className="text-sm text-gray-400 ml-auto">{dbUser?.token_balance.toLocaleString()} tokens 余额</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Input form */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex gap-2 mb-4">
            {(['url', 'manual'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === m ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {m === 'url' ? '网址抓取' : '手动输入'}
              </button>
            ))}
          </div>

          <form onSubmit={handleAnalyze} className="space-y-3">
            {mode === 'url' ? (
              <input
                type="url"
                placeholder="https://www.facebook.com/pagename"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <textarea
                placeholder="粘贴竞品的帖子文案、简介或任何营销内容..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '分析中...' : '开始分析 (-2000 tokens)'}
            </button>
          </form>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">历史分析</h2>
            <div className="space-y-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${selected?.id === item.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                >
                  {new Date(item.created_at).toLocaleString('zh-CN')} — {(item.content as AnalysisContent).source === 'url' ? '网址抓取' : '手动输入'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {content && (
          <div className="bg-white rounded-xl border p-5 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">分析摘要</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{content.analysis}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">SWOT 分析</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((key) => {
                  const labels = { strengths: '💪 优势', weaknesses: '⚠️ 劣势', opportunities: '🌱 机会', threats: '⚡ 威胁' }
                  const colors = { strengths: 'bg-green-50 border-green-200', weaknesses: 'bg-red-50 border-red-200', opportunities: 'bg-blue-50 border-blue-200', threats: 'bg-amber-50 border-amber-200' }
                  return (
                    <div key={key} className={`rounded-lg border p-3 ${colors[key]}`}>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">{labels[key]}</h4>
                      <ul className="space-y-1">
                        {(content.swot[key] ?? []).map((item, i) => (
                          <li key={i} className="text-xs text-gray-600">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => navigate(`/file/${fileId}/copy`)}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              用此分析生成文案 →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```
git add src/pages/Analysis.tsx
git commit -m "feat: analysis page UI"
```

---

### Task 14: Copy Page UI

**Files:**
- Replace: `src/pages/Copy.tsx`

- [ ] **Step 1: Replace `src/pages/Copy.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callFunction } from '../lib/api'
import { supabase } from '../lib/supabase'
import { FileData, AnalysisContent, CopyContent } from '../types'

export default function Copy() {
  const { id: fileId } = useParams<{ id: string }>()
  const { session, dbUser } = useAuth()
  const navigate = useNavigate()

  const [analyses, setAnalyses] = useState<FileData[]>([])
  const [copies, setCopies] = useState<FileData[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCopy, setSelectedCopy] = useState<FileData | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('file_data').select('*').eq('file_id', fileId!).eq('data_type', 'page_analysis').order('created_at', { ascending: false }),
      supabase.from('file_data').select('*').eq('file_id', fileId!).eq('data_type', 'copy').order('created_at', { ascending: false }),
    ]).then(([{ data: a }, { data: c }]) => {
      setAnalyses(a ?? [])
      setCopies(c ?? [])
      if (a && a.length > 0) setSelectedAnalysis(a[0].id)
      if (c && c.length > 0) setSelectedCopy(c[0])
    })
  }, [fileId])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await callFunction<{ id: string; versions: CopyContent['versions'] }>(
        'generate-copy',
        { file_id: fileId, analysis_id: selectedAnalysis },
        session!.access_token
      )
      const newEntry: FileData = {
        id: result.id,
        file_id: fileId!,
        data_type: 'copy',
        content: { analysis_id: selectedAnalysis, versions: result.versions },
        created_at: new Date().toISOString(),
      }
      setCopies((prev) => [newEntry, ...prev])
      setSelectedCopy(newEntry)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  const content = selectedCopy?.content as CopyContent | undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/file/${fileId}`)} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
        <h1 className="text-lg font-bold">文案库</h1>
        <span className="text-sm text-gray-400 ml-auto">{dbUser?.token_balance.toLocaleString()} tokens 余额</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Generate form */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-medium text-gray-900 mb-3">生成文案</h2>
          {analyses.length === 0 ? (
            <div className="text-sm text-gray-500">
              先去做 <button onClick={() => navigate(`/file/${fileId}/analysis`)} className="text-blue-600 underline">Page 分析</button>，再来生成文案
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-3">
              <select
                value={selectedAnalysis}
                onChange={(e) => setSelectedAnalysis(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {new Date(a.created_at).toLocaleString('zh-CN')} — {(a.content as AnalysisContent).source === 'url' ? '网址抓取' : '手动输入'}
                  </option>
                ))}
              </select>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '生成中...' : '生成文案 (-1500 tokens)'}
              </button>
            </form>
          )}
        </div>

        {/* History */}
        {copies.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">历史文案</h2>
            <div className="flex gap-2 flex-wrap">
              {copies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCopy(c)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${selectedCopy?.id === c.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {new Date(c.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {content && (
          <div className="space-y-4">
            {(['title', 'body', 'cta'] as const).map((field) => {
              const labels = { title: '标题', body: '正文', cta: '行动呼吁' }
              return (
                <div key={field} className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">{labels[field]}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {content.versions[field].map((v, i) => (
                      <div key={i} className="relative border border-gray-200 rounded-lg p-3 group">
                        <span className="text-xs text-gray-400 mb-1 block">版本 {i + 1}</span>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{v}</p>
                        <button
                          onClick={() => copyToClipboard(v)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded transition-opacity"
                        >
                          复制
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <button
              onClick={() => navigate(`/file/${fileId}/landing`)}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              用此文案生成落地页 →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```
git add src/pages/Copy.tsx
git commit -m "feat: copy library page UI"
```

---

### Task 15: Landing Page UI

**Files:**
- Replace: `src/pages/Landing.tsx`

- [ ] **Step 1: Replace `src/pages/Landing.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callFunction } from '../lib/api'
import { supabase } from '../lib/supabase'
import { FileData, CopyContent, LandingContent } from '../types'

export default function Landing() {
  const { id: fileId } = useParams<{ id: string }>()
  const { session, dbUser } = useAuth()
  const navigate = useNavigate()

  const [copies, setCopies] = useState<FileData[]>([])
  const [landings, setLandings] = useState<FileData[]>([])
  const [selectedCopy, setSelectedCopy] = useState<string>('')
  const [selectedVersion, setSelectedVersion] = useState<0 | 1>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [selectedLanding, setSelectedLanding] = useState<FileData | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('file_data').select('*').eq('file_id', fileId!).eq('data_type', 'copy').order('created_at', { ascending: false }),
      supabase.from('file_data').select('*').eq('file_id', fileId!).eq('data_type', 'landing_page').order('created_at', { ascending: false }),
    ]).then(([{ data: c }, { data: l }]) => {
      setCopies(c ?? [])
      setLandings(l ?? [])
      if (c && c.length > 0) setSelectedCopy(c[0].id)
      if (l && l.length > 0) {
        setSelectedLanding(l[0])
        setPreviewHtml((l[0].content as LandingContent).html)
      }
    })
  }, [fileId])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await callFunction<{ id: string; html: string }>(
        'generate-landing',
        { file_id: fileId, copy_id: selectedCopy, version: selectedVersion },
        session!.access_token
      )
      const newEntry: FileData = {
        id: result.id,
        file_id: fileId!,
        data_type: 'landing_page',
        content: { copy_id: selectedCopy, html: result.html },
        created_at: new Date().toISOString(),
      }
      setLandings((prev) => [newEntry, ...prev])
      setSelectedLanding(newEntry)
      setPreviewHtml(result.html)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!previewHtml) return
    const blob = new Blob([previewHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'landing-page.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/file/${fileId}`)} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
        <h1 className="text-lg font-bold">落地页生成</h1>
        <span className="text-sm text-gray-400 ml-auto">{dbUser?.token_balance.toLocaleString()} tokens 余额</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Generate form */}
        <div className="bg-white rounded-xl border p-5">
          {copies.length === 0 ? (
            <div className="text-sm text-gray-500">
              先去<button onClick={() => navigate(`/file/${fileId}/copy`)} className="text-blue-600 underline">生成文案</button>，再来建落地页
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">选择文案</label>
                <select
                  value={selectedCopy}
                  onChange={(e) => setSelectedCopy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {copies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {new Date(c.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">文案版本</label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(Number(e.target.value) as 0 | 1)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>版本 A（专业）</option>
                  <option value={1}>版本 B（活泼）</option>
                </select>
              </div>
              <div className="flex-1" />
              {error && <p className="text-red-500 text-sm w-full">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '生成中...' : '生成落地页 (-3000 tokens)'}
              </button>
            </form>
          )}
        </div>

        {/* History selector */}
        {landings.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-gray-400">历史版本：</span>
            {landings.map((l) => (
              <button
                key={l.id}
                onClick={() => { setSelectedLanding(l); setPreviewHtml((l.content as LandingContent).html) }}
                className={`px-3 py-1 rounded-full border text-xs transition-colors ${selectedLanding?.id === l.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                {new Date(l.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        )}

        {/* Preview + Download */}
        {previewHtml && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3 border-b bg-gray-50">
              <span className="text-sm font-medium text-gray-700">预览</span>
              <button
                onClick={handleDownload}
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                下载 HTML
              </button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="w-full"
              style={{ height: '600px', border: 'none' }}
              sandbox="allow-scripts"
              title="Landing page preview"
            />
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```
git add src/pages/Landing.tsx
git commit -m "feat: landing page UI with iframe preview and download"
```

---

### Task 16: Admin Edge Function

**Files:**
- Create: `supabase/functions/admin/index.ts`

**Interfaces:**
- Consumes: JWT + `is_admin = true`
- Produces: `GET /admin/users`, `PATCH /admin/users/:id`, `DELETE /admin/users/:id`, `GET /admin/files`, `DELETE /admin/files/:id`, `GET /admin/stats`

- [ ] **Step 1: Create `supabase/functions/admin/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAdmin } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { supabase } = await verifyAdmin(req)
    const url = new URL(req.url)
    const segments = url.pathname.replace('/admin/', '').split('/')
    const resource = segments[0]
    const resourceId = segments[1]

    // GET /admin/stats
    if (resource === 'stats' && req.method === 'GET') {
      const [{ count: userCount }, { count: fileCount }, { count: callCount }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('files').select('*', { count: 'exact', head: true }),
        supabase.from('file_data').select('*', { count: 'exact', head: true }),
      ])
      return new Response(JSON.stringify({ userCount, fileCount, callCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /admin/users
    if (resource === 'users' && req.method === 'GET' && !resourceId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // PATCH /admin/users/:id
    if (resource === 'users' && req.method === 'PATCH' && resourceId) {
      const updates = await req.json()
      const allowed = ['tier', 'token_balance', 'is_admin', 'max_files']
      const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
      const { data, error } = await supabase.from('users').update(filtered).eq('id', resourceId).select().single()
      if (error) throw new Error(error.message)
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /admin/users/:id
    if (resource === 'users' && req.method === 'DELETE' && resourceId) {
      await supabase.from('users').delete().eq('id', resourceId)
      await supabase.auth.admin.deleteUser(resourceId)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // GET /admin/files
    if (resource === 'files' && req.method === 'GET' && !resourceId) {
      const { data } = await supabase
        .from('files')
        .select('*, users(email)')
        .order('created_at', { ascending: false })
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // DELETE /admin/files/:id
    if (resource === 'files' && req.method === 'DELETE' && resourceId) {
      await supabase.from('files').delete().eq('id', resourceId)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof Response) return err
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```
git add supabase/functions/admin/
git commit -m "feat: admin edge function"
```

---

### Task 17: Admin UI Page

**Files:**
- Replace: `src/pages/Admin.tsx`

- [ ] **Step 1: Replace `src/pages/Admin.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callAdmin } from '../lib/api'
import { AdminUser, File } from '../types'

type Tab = 'stats' | 'users' | 'files'

interface Stats { userCount: number; fileCount: number; callCount: number }

export default function Admin() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [files, setFiles] = useState<(File & { users: { email: string } })[]>([])
  const [loading, setLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<AdminUser>>({})

  const token = session!.access_token

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'stats') setStats(await callAdmin<Stats>('stats', 'GET', token))
      if (t === 'users') setUsers(await callAdmin<AdminUser[]>('users', 'GET', token))
      if (t === 'files') setFiles(await callAdmin<(File & { users: { email: string } })[]>('files', 'GET', token))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadTab(tab) }, [tab, loadTab])

  async function saveUser(id: string) {
    await callAdmin(`users/${id}`, 'PATCH', token, editValues)
    setEditingUser(null)
    loadTab('users')
  }

  async function deleteUser(id: string) {
    if (!confirm('确定删除此用户？此操作不可恢复。')) return
    await callAdmin(`users/${id}`, 'DELETE', token)
    loadTab('users')
  }

  async function deleteFile(id: string) {
    if (!confirm('确定删除此 File？')) return
    await callAdmin(`files/${id}`, 'DELETE', token)
    loadTab('files')
  }

  const tierOptions = ['free', 'pro', 'enterprise']

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
        <h1 className="text-lg font-bold text-purple-700">管理后台</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex gap-1 mb-6 border-b">
          {(['stats', 'users', 'files'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'stats' ? '系统数据' : t === 'users' ? '用户管理' : 'File 管理'}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400 text-sm">加载中...</p>}

        {/* Stats */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '总用户数', value: stats.userCount },
              { label: '总 File 数', value: stats.fileCount },
              { label: 'AI 调用次数', value: stats.callCount },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border p-5 text-center">
                <div className="text-3xl font-bold text-purple-600">{value ?? 0}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['电子邮件', '套餐', 'Tokens', 'Admin', '注册时间', '操作'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{u.email}</td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <select
                          value={editValues.tier ?? u.tier}
                          onChange={(e) => setEditValues((v) => ({ ...v, tier: e.target.value as AdminUser['tier'] }))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          {tierOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.tier === 'free' ? 'bg-gray-100 text-gray-600' : u.tier === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {u.tier}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <input
                          type="number"
                          value={editValues.token_balance ?? u.token_balance}
                          onChange={(e) => setEditValues((v) => ({ ...v, token_balance: Number(e.target.value) }))}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                        />
                      ) : (
                        u.token_balance.toLocaleString()
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <input
                          type="checkbox"
                          checked={editValues.is_admin ?? u.is_admin}
                          onChange={(e) => setEditValues((v) => ({ ...v, is_admin: e.target.checked }))}
                        />
                      ) : (
                        u.is_admin ? '✓' : '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveUser(u.id)} className="text-xs text-green-600 hover:underline">保存</button>
                          <button onClick={() => setEditingUser(null)} className="text-xs text-gray-400 hover:underline">取消</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingUser(u.id); setEditValues({}) }} className="text-xs text-blue-600 hover:underline">编辑</button>
                          <button onClick={() => deleteUser(u.id)} className="text-xs text-red-500 hover:underline">删除</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Files */}
        {tab === 'files' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['File 名称', '所有者', '行业', '创建时间', '操作'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-4 py-3 text-gray-500">{f.users?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{f.industry ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(f.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteFile(f.id)} className="text-xs text-red-500 hover:underline">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```
git add src/pages/Admin.tsx
git commit -m "feat: admin UI page"
```

---

### Task 18: Deploy Edge Functions + Vercel

**Pre-conditions:** Supabase CLI installed, logged in, linked to project.

- [ ] **Step 1: Install Supabase CLI**

```
npm install -g supabase
```

- [ ] **Step 2: Login and link project**

```
supabase login
supabase link --project-ref tfbubpuzvqwryyajimtw
```

- [ ] **Step 3: Set Edge Function secrets**

```
supabase secrets set CLAUDE_API_KEY="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"
supabase secrets set DATABASE_URL="postgresql://postgres:[YOUR_DB_PASSWORD]@db.tfbubpuzvqwryyajimtw.supabase.co:5432/postgres"
```

`[YOUR_DB_PASSWORD]`: find in Supabase Dashboard → Project Settings → Database → Database Password

- [ ] **Step 4: Deploy all Edge Functions**

```
supabase functions deploy initialize --project-ref tfbubpuzvqwryyajimtw
supabase functions deploy scrape-page --project-ref tfbubpuzvqwryyajimtw
supabase functions deploy analyze-page --project-ref tfbubpuzvqwryyajimtw
supabase functions deploy generate-copy --project-ref tfbubpuzvqwryyajimtw
supabase functions deploy generate-landing --project-ref tfbubpuzvqwryyajimtw
supabase functions deploy admin --project-ref tfbubpuzvqwryyajimtw
```

- [ ] **Step 5: Run initialize to create DB tables**

```
curl -X POST https://tfbubpuzvqwryyajimtw.supabase.co/functions/v1/initialize \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmYnVicHV6dnF3cnl5cWppbXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAxODczNCwiZXhwIjoyMDk3NTk0NzM0fQ.3pbMZq7YlGU44AcIq0n1esTh3JoMqbmvpsvemZp56IU"
```
Expected: `{"success":true}`

- [ ] **Step 6: Set first admin**

In Supabase Dashboard → Table Editor → users → find your row → set `is_admin = true`

OR via the SQL Editor:
```sql
UPDATE users SET is_admin = true WHERE email = 'your.gm01@gmail.com';
```

- [ ] **Step 7: Deploy to Vercel**

```
npm install -g vercel
vercel --prod
```
When prompted:
- Link to existing project? No → create new
- Project name: `ai-marketing-os`
- Framework: Vite

Add environment variables in Vercel Dashboard → Project → Settings → Environment Variables:
- `VITE_SUPABASE_URL` = `https://tfbubpuzvqwryyajimtw.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full anon key)

- [ ] **Step 8: Re-deploy with env vars**

```
vercel --prod
```

- [ ] **Step 9: Smoke test**

1. Open deployed URL → Login page appears
2. Register with `your.gm01@gmail.com` → success message
3. Login → Dashboard shows empty File list
4. Create a File → appears in list
5. Click File → 4 tool cards
6. Analysis: paste some text → analysis + SWOT shows
7. Copy: generate → 6 copy fields with 2 versions each
8. Landing: generate → iframe preview + download button
9. `/admin` → stats, users, files visible

- [ ] **Step 10: Final commit**

```
git add -A
git commit -m "feat: complete AI Marketing OS v1"
```
