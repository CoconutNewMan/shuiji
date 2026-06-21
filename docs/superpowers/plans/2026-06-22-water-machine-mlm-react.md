# 买水机三代分成平台 — React + Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Vite + React + TypeScript + Supabase 项目基础上，构建买水机月租三代佣金分成平台，支持中/英/马来三语言。

**Architecture:** React Router 管理页面路由，Supabase Auth 处理登录注册，Supabase PostgreSQL 存储会员/佣金/订阅数据，Supabase RLS 保障数据安全，佣金计算通过 Supabase Database Function 触发。支付集成 Curlec（信用卡月租）。

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Supabase JS v2, Curlec Payment API

## Global Constraints

- 品牌名用占位符 `[BRAND]`，上线前全局替换
- 月租金额用占位符 `RM_PRICE`，上线前填入
- 佣金比例固定：直推 40%，第2代 3%，第3代 2%（存储在 Supabase 环境变量）
- 货币只支持 MYR
- 三语言：`zh`（中文默认）、`en`（English）、`ms`（Bahasa Malaysia）
- 组织图只显示自己以下3代，不显示完整树
- 所有数据库操作通过 Supabase RLS 保护（用户只能读自己的数据）
- Tailwind CSS 用 v4 语法（无需 tailwind.config.js，用 CSS @import）

---

## File Map

```
src/
├── main.tsx                    # 入口，加 Router + LangProvider
├── App.tsx                     # 路由配置
├── index.css                   # Tailwind v4 @import + 全局样式
├── lib/
│   ├── supabase.ts             # Supabase client
│   └── i18n.ts                 # 翻译字典 + useTranslation hook
├── pages/
│   ├── HomePage.tsx            # 公开首页（产品展示 + 佣金介绍）
│   ├── ProductsPage.tsx        # 产品列表页
│   ├── LoginPage.tsx           # 代理登录
│   ├── RegisterPage.tsx        # 代理注册（含推荐人ID）
│   ├── DashboardPage.tsx       # 会员仪表板
│   └── OrgChartPage.tsx        # 组织图（3代）
├── components/
│   ├── Navbar.tsx              # 顶部导航 + 语言切换
│   ├── Footer.tsx              # 页脚
│   ├── ProtectedRoute.tsx      # 需要登录才能访问的路由守卫
│   └── OrgNode.tsx             # 组织图单个节点卡片
├── hooks/
│   └── useAuth.ts              # Supabase Auth 封装
└── types/
    └── index.ts                # 共享 TypeScript 类型
```

**Supabase SQL（需在 Supabase Dashboard 执行）:**
```
supabase/
└── schema.sql                  # 所有表 + RLS + 函数
```

---

## Task 1: 项目基础配置（Tailwind + Supabase client + i18n + 路由）

**Files:**
- Modify: `src/index.css`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Create: `src/lib/supabase.ts`
- Create: `src/lib/i18n.ts`
- Create: `src/types/index.ts`
- Create: `src/hooks/useAuth.ts`
- Modify: `index.html` (title)

**Interfaces:**
- Produces:
  - `supabase` client (default export from `src/lib/supabase.ts`)
  - `useTranslation()` hook → `{ t: (key: string) => string, lang: string, setLang: (l: string) => void }`
  - `useAuth()` hook → `{ user, session, loading, signIn, signUp, signOut }`
  - Route structure: `/`, `/products`, `/login`, `/register`, `/dashboard`, `/org`

- [ ] **Step 1: 安装额外依赖（如果没有）**

```bash
cd C:\Users\hawki\OneDrive\Desktop\File\BaoKuan
npm list @supabase/supabase-js react-router-dom
```

两个都已在 package.json，无需安装。

- [ ] **Step 2: 更新 index.html**

将 `<title>baokuan</title>` 改为 `<title>[BRAND]</title>`。

- [ ] **Step 3: 更新 src/index.css（Tailwind v4 语法）**

完全替换内容：

```css
@import "tailwindcss";

:root {
  --brand-blue: #0369a1;
  --brand-blue-light: #0284c7;
}

* {
  font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
}

.gradient-text {
  background: linear-gradient(135deg, #0369a1, #0284c7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-primary {
  @apply px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all;
}

.btn-secondary {
  @apply px-6 py-3 bg-white text-sky-600 border-2 border-sky-600 rounded-lg font-semibold hover:bg-sky-50 transition-all;
}

.card {
  @apply bg-white rounded-2xl shadow-sm border border-gray-200;
}
```

- [ ] **Step 4: 创建 src/types/index.ts**

```typescript
export interface Agent {
  id: string;
  user_id: string;
  referrer_id: string | null;
  name: string;
  email: string;
  phone: string;
  ic_number: string;
  wallet_balance: number;
  commission_total: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export interface Commission {
  id: string;
  agent_id: string;
  source_agent_id: string;
  level: 1 | 2 | 3;
  amount: number;
  month: string; // YYYY-MM
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
}

export interface Subscription {
  id: string;
  agent_id: string;
  monthly_amount: number;
  status: 'active' | 'paused' | 'cancelled';
  next_billing_date: string;
  curlec_subscription_id: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  referrer_id: string | null;
}

export type Lang = 'zh' | 'en' | 'ms';
```

- [ ] **Step 5: 创建 src/lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 6: 创建 src/lib/i18n.ts**

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import type { Lang } from '../types';

const translations: Record<Lang, Record<string, string>> = {
  zh: {
    nav_home: '首页',
    nav_products: '产品',
    nav_login: '代理登录',
    nav_dashboard: '仪表板',
    nav_logout: '退出登录',
    hero_title: '[BRAND] 净水机',
    hero_subtitle: '优质净水，健康生活。加入代理网络，开始赚取被动收入。',
    hero_browse: '浏览产品',
    hero_join: '成为代理',
    products_title: '我们的净水机',
    products_subtitle: '选择适合你的型号，每月轻松租用',
    monthly_rental: '月租',
    join_as_agent: '成为代理',
    commission_title: '三代佣金制度',
    commission_desc: '每当你的下线支付月租，佣金自动入账钱包。',
    level1_label: '直推 40%',
    level2_label: '第二代 3%',
    level3_label: '第三代 2%',
    login_title: '代理登录',
    login_subtitle: '访问你的仪表板和佣金',
    email_label: '邮箱',
    password_label: '密码',
    btn_login: '登录',
    no_account: '还没有账户？',
    become_agent: '成为代理',
    forgot_password: '忘记密码？',
    register_title: '成为代理',
    register_subtitle: '开始你的被动收入之旅',
    name_label: '姓名',
    phone_label: '电话',
    ic_label: '身份证号',
    referrer_label: '推荐人ID（选填）',
    referrer_placeholder: '留空则为独立代理',
    terms_text: '我同意服务条款和隐私政策',
    btn_register: '立即注册',
    already_account: '已有账户？',
    login_now: '立即登录',
    dashboard_title: '我的仪表板',
    rental_status: '月租状态',
    status_active: '已激活',
    status_inactive: '未激活',
    monthly_commission: '本月佣金',
    wallet_balance: '钱包余额',
    team_size: '团队规模',
    team_sub: '下3代成员',
    view_org: '查看组织图',
    org_title: '我的组织图',
    org_you: '你',
    org_level1: '第一代（直推）',
    org_level2: '第二代',
    org_level3: '第三代',
    org_empty: '暂无下线',
    members_unit: '人',
    commission_records: '佣金记录',
    withdraw: '申请提现',
    footer_rights: '版权所有',
    loading: '加载中...',
    error_login: '邮箱或密码错误',
    error_register: '注册失败，请重试',
    success_register: '注册成功！请登录',
  },
  en: {
    nav_home: 'Home',
    nav_products: 'Products',
    nav_login: 'Agent Login',
    nav_dashboard: 'Dashboard',
    nav_logout: 'Logout',
    hero_title: '[BRAND] Water Purifier',
    hero_subtitle: 'Pure water, healthy life. Join our agent network and earn passive income.',
    hero_browse: 'Browse Products',
    hero_join: 'Become an Agent',
    products_title: 'Our Water Purifiers',
    products_subtitle: 'Choose your model, easy monthly rental',
    monthly_rental: 'Monthly Rental',
    join_as_agent: 'Become Agent',
    commission_title: '3-Generation Commission',
    commission_desc: 'Every time your downline pays their monthly rental, commission is automatically credited to your wallet.',
    level1_label: 'Direct 40%',
    level2_label: '2nd Gen 3%',
    level3_label: '3rd Gen 2%',
    login_title: 'Agent Login',
    login_subtitle: 'Access your dashboard and commissions',
    email_label: 'Email',
    password_label: 'Password',
    btn_login: 'Login',
    no_account: "Don't have an account?",
    become_agent: 'Become an Agent',
    forgot_password: 'Forgot password?',
    register_title: 'Become an Agent',
    register_subtitle: 'Start your passive income journey',
    name_label: 'Full Name',
    phone_label: 'Phone',
    ic_label: 'IC Number',
    referrer_label: 'Referrer ID (optional)',
    referrer_placeholder: 'Leave blank if no referrer',
    terms_text: 'I agree to the Terms of Service and Privacy Policy',
    btn_register: 'Register Now',
    already_account: 'Already have an account?',
    login_now: 'Login now',
    dashboard_title: 'My Dashboard',
    rental_status: 'Monthly Rental',
    status_active: 'Active',
    status_inactive: 'Inactive',
    monthly_commission: 'This Month Commission',
    wallet_balance: 'Wallet Balance',
    team_size: 'Team Size',
    team_sub: 'Next 3 generations',
    view_org: 'View Org Chart',
    org_title: 'My Organisation Chart',
    org_you: 'You',
    org_level1: '1st Generation (Direct)',
    org_level2: '2nd Generation',
    org_level3: '3rd Generation',
    org_empty: 'No downlines yet',
    members_unit: 'members',
    commission_records: 'Commission Records',
    withdraw: 'Request Withdrawal',
    footer_rights: 'All rights reserved',
    loading: 'Loading...',
    error_login: 'Invalid email or password',
    error_register: 'Registration failed, please try again',
    success_register: 'Registration successful! Please login.',
  },
  ms: {
    nav_home: 'Utama',
    nav_products: 'Produk',
    nav_login: 'Log Masuk Ejen',
    nav_dashboard: 'Papan Pemuka',
    nav_logout: 'Log Keluar',
    hero_title: '[BRAND] Penapis Air',
    hero_subtitle: 'Air tulen, hidup sihat. Sertai rangkaian ejen dan jana pendapatan pasif.',
    hero_browse: 'Lihat Produk',
    hero_join: 'Jadi Ejen',
    products_title: 'Penapis Air Kami',
    products_subtitle: 'Pilih model anda, sewa bulanan yang mudah',
    monthly_rental: 'Sewa Bulanan',
    join_as_agent: 'Jadi Ejen',
    commission_title: 'Komisen 3 Generasi',
    commission_desc: 'Setiap kali downline anda membayar sewa bulanan, komisen dikreditkan secara automatik ke dompet anda.',
    level1_label: 'Terus 40%',
    level2_label: 'Gen ke-2 3%',
    level3_label: 'Gen ke-3 2%',
    login_title: 'Log Masuk Ejen',
    login_subtitle: 'Akses papan pemuka dan komisen anda',
    email_label: 'E-mel',
    password_label: 'Kata Laluan',
    btn_login: 'Log Masuk',
    no_account: 'Tiada akaun?',
    become_agent: 'Jadi Ejen',
    forgot_password: 'Lupa kata laluan?',
    register_title: 'Jadi Ejen',
    register_subtitle: 'Mulakan perjalanan pendapatan pasif anda',
    name_label: 'Nama Penuh',
    phone_label: 'Telefon',
    ic_label: 'No. Kad Pengenalan',
    referrer_label: 'ID Perujuk (pilihan)',
    referrer_placeholder: 'Kosongkan jika tiada perujuk',
    terms_text: 'Saya bersetuju dengan Terma Perkhidmatan dan Dasar Privasi',
    btn_register: 'Daftar Sekarang',
    already_account: 'Sudah ada akaun?',
    login_now: 'Log masuk sekarang',
    dashboard_title: 'Papan Pemuka Saya',
    rental_status: 'Sewa Bulanan',
    status_active: 'Aktif',
    status_inactive: 'Tidak Aktif',
    monthly_commission: 'Komisen Bulan Ini',
    wallet_balance: 'Baki Dompet',
    team_size: 'Saiz Pasukan',
    team_sub: '3 generasi bawah',
    view_org: 'Lihat Carta Organisasi',
    org_title: 'Carta Organisasi Saya',
    org_you: 'Anda',
    org_level1: 'Generasi ke-1 (Terus)',
    org_level2: 'Generasi ke-2',
    org_level3: 'Generasi ke-3',
    org_empty: 'Tiada downline lagi',
    members_unit: 'ahli',
    commission_records: 'Rekod Komisen',
    withdraw: 'Mohon Pengeluaran',
    footer_rights: 'Hak cipta terpelihara',
    loading: 'Memuatkan...',
    error_login: 'E-mel atau kata laluan tidak sah',
    error_register: 'Pendaftaran gagal, sila cuba lagi',
    success_register: 'Pendaftaran berjaya! Sila log masuk.',
  },
};

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

import { createContext, useContext, useState, useEffect } from 'react';

export const LangContext = createContext<LangContextType>({
  lang: 'zh',
  setLang: () => {},
  t: (key) => key,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'zh';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] ?? translations['zh']?.[key] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LangContext);
}
```

- [ ] **Step 7: 创建 src/hooks/useAuth.ts**

```typescript
import { useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password });

  const signOut = () => supabase.auth.signOut();

  return { user, session, loading, signIn, signUp, signOut };
}
```

- [ ] **Step 8: 更新 src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { LangProvider } from './lib/i18n.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <App />
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 9: 更新 src/App.tsx（路由配置）**

```tsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrgChartPage from './pages/OrgChartPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/org" element={
            <ProtectedRoute><OrgChartPage /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 10: 创建占位符页面和组件（让 App.tsx 能编译）**

创建这些空文件（内容只是 export default function，一行）：
- `src/components/Navbar.tsx` → `export default function Navbar() { return <nav />; }`
- `src/components/Footer.tsx` → `export default function Footer() { return <footer />; }`
- `src/components/ProtectedRoute.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/ProductsPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/OrgChartPage.tsx`

ProtectedRoute 需要逻辑：
```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../lib/i18n';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="flex items-center justify-center min-h-screen">{t('loading')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 11: 创建 .env.local（不提交 git）**

```bash
# 在项目根目录创建 .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

同时确认 `.gitignore` 包含 `.env.local`。

- [ ] **Step 12: 验证编译通过**

```bash
cd C:\Users\hawki\OneDrive\Desktop\File\BaoKuan
npm run build
```

预期：build 成功，无 TypeScript 错误。（如果有 Supabase URL 未配置的 runtime 错误，build 本身应该仍然通过）

- [ ] **Step 13: Commit**

```bash
git add src/ index.html .gitignore
git commit -m "feat: setup project foundation — Tailwind, Supabase client, i18n, routing"
```

---

## Task 2: Supabase 数据库 Schema

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces: 表 `agents`、`commissions`、`subscriptions`，RLS 策略，`calculate_commission` 函数

**注意:** 这个 SQL 需要在 Supabase Dashboard → SQL Editor 手动执行。文件保存在项目中作为文档记录。

- [ ] **Step 1: 创建 supabase/schema.sql**

```sql
-- ============================================
-- 买水机三代分成平台 — Supabase Schema
-- ============================================

-- 代理表（扩展 Supabase auth.users）
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  ic_number TEXT NOT NULL,
  wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 佣金记录表
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  source_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  amount NUMERIC(10, 2) NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM format
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 月租订阅表
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  monthly_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_billing_date DATE,
  curlec_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_referrer_id ON public.agents(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON public.commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_month ON public.commissions(month);
CREATE INDEX IF NOT EXISTS idx_subscriptions_agent_id ON public.subscriptions(agent_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- agents: 用户只能读自己的记录
CREATE POLICY "agents_select_own" ON public.agents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "agents_insert_own" ON public.agents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 允许读取推荐链（用于组织图查询——只读自己以下3代）
CREATE POLICY "agents_select_downlines" ON public.agents
  FOR SELECT USING (
    id IN (
      -- Level 1
      SELECT id FROM public.agents WHERE referrer_id IN (
        SELECT id FROM public.agents WHERE user_id = auth.uid()
      )
      UNION
      -- Level 2
      SELECT a2.id FROM public.agents a2
      JOIN public.agents a1 ON a2.referrer_id = a1.id
      WHERE a1.referrer_id IN (
        SELECT id FROM public.agents WHERE user_id = auth.uid()
      )
      UNION
      -- Level 3
      SELECT a3.id FROM public.agents a3
      JOIN public.agents a2 ON a3.referrer_id = a2.id
      JOIN public.agents a1 ON a2.referrer_id = a1.id
      WHERE a1.referrer_id IN (
        SELECT id FROM public.agents WHERE user_id = auth.uid()
      )
    )
  );

-- commissions: 用户只能读自己的佣金
CREATE POLICY "commissions_select_own" ON public.commissions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

-- subscriptions: 用户只能读/改自己的订阅
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

-- ============================================
-- 佣金计算函数（由 webhook 或管理员触发）
-- 输入：付款代理 ID + 月租金额
-- 输出：向上3代各发佣金
-- ============================================
CREATE OR REPLACE FUNCTION public.distribute_commission(
  p_source_agent_id UUID,
  p_monthly_amount NUMERIC,
  p_month TEXT  -- YYYY-MM
) RETURNS VOID AS $$
DECLARE
  v_current_id UUID := p_source_agent_id;
  v_level INTEGER := 1;
  v_rates NUMERIC[] := ARRAY[0.40, 0.03, 0.02];
  v_referrer_id UUID;
  v_commission NUMERIC;
BEGIN
  -- 向上遍历3代
  WHILE v_level <= 3 AND v_current_id IS NOT NULL LOOP
    -- 获取当前代理的推荐人
    SELECT referrer_id INTO v_referrer_id
    FROM public.agents
    WHERE id = v_current_id;

    EXIT WHEN v_referrer_id IS NULL;

    -- 计算佣金
    v_commission := p_monthly_amount * v_rates[v_level];

    -- 插入佣金记录
    INSERT INTO public.commissions (agent_id, source_agent_id, level, amount, month)
    VALUES (v_referrer_id, p_source_agent_id, v_level, v_commission, p_month);

    -- 更新钱包余额
    UPDATE public.agents
    SET wallet_balance = wallet_balance + v_commission,
        commission_total = commission_total + v_commission
    WHERE id = v_referrer_id;

    v_current_id := v_referrer_id;
    v_level := v_level + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: 创建 README 指引**

在 `supabase/README.md` 写：

```markdown
# Supabase 设置指引

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并执行 `schema.sql` 的全部内容
4. 在项目根目录创建 `.env.local`：
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema — agents, commissions, subscriptions tables with RLS and commission distribution function"
```

---

## Task 3: Navbar + Footer 组件

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`

**Interfaces:**
- Consumes: `useTranslation()`, `useAuth()`, React Router `Link`/`useNavigate`
- Produces: 完整 Navbar（导航链接 + 语言切换 + 登录/登出），Footer（品牌 + 版权）

- [ ] **Step 1: 实现 Navbar.tsx**

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import type { Lang } from '../types';

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const langs: { code: Lang; label: string }[] = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'EN' },
    { code: 'ms', label: 'BM' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center text-white text-xl">
            💧
          </div>
          <span className="font-bold text-lg text-gray-900">[BRAND]</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-700 hover:text-sky-600 font-medium transition-colors">
            {t('nav_home')}
          </Link>
          <Link to="/products" className="text-gray-700 hover:text-sky-600 font-medium transition-colors">
            {t('nav_products')}
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-sky-600 font-medium transition-colors">
                {t('nav_dashboard')}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-sky-600 font-medium transition-colors"
              >
                {t('nav_logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">
              {t('nav_login')}
            </Link>
          )}
        </nav>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 text-sm">
          {langs.map((l, i) => (
            <span key={l.code} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">|</span>}
              <button
                onClick={() => setLang(l.code)}
                className={`px-1 transition-colors ${
                  lang === l.code ? 'text-sky-600 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {l.label}
              </button>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 实现 Footer.tsx**

```tsx
import { useTranslation } from '../lib/i18n';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p>© {new Date().getFullYear()} [BRAND]. {t('footer_rights')}.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: 验证编译**

```bash
npm run build
```

预期：build 成功。

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.tsx src/components/Footer.tsx
git commit -m "feat: implement Navbar with language switcher and auth state, Footer"
```

---

## Task 4: 首页 + 产品页

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/ProductsPage.tsx`

**Interfaces:**
- Consumes: `useTranslation()`, React Router `Link`
- Produces: 首页（Hero + 佣金三格 + CTA），产品页（3个水机卡片）

- [ ] **Step 1: 实现 HomePage.tsx**

```tsx
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-2 bg-sky-400/20 rounded-full text-sky-200 text-sm font-semibold mb-6 border border-sky-400/30">
              💧 Pure Water, Healthy Life
            </div>
            <h1 className="text-5xl font-black leading-tight mb-6">{t('hero_title')}</h1>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed">{t('hero_subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="btn-primary bg-white text-sky-700 hover:bg-gray-100 inline-flex items-center gap-2">
                💧 {t('hero_browse')}
              </Link>
              <Link to="/register" className="btn-primary inline-flex items-center gap-2">
                🚀 {t('hero_join')}
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-sky-300 to-blue-600 rounded-3xl p-12 text-center">
              <div className="text-8xl mb-4">💧</div>
              <p className="text-white font-bold text-xl">[BRAND]</p>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Plan */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 gradient-text">{t('commission_title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('commission_desc')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="text-6xl font-black gradient-text mb-3">40%</div>
              <h3 className="text-xl font-bold mb-2">{t('level1_label')}</h3>
              <p className="text-gray-500 text-sm">你直接推荐的会员每月付租，你得 40%</p>
            </div>
            <div className="card p-8 text-center border-sky-200">
              <div className="text-6xl font-black gradient-text mb-3">3%</div>
              <h3 className="text-xl font-bold mb-2">{t('level2_label')}</h3>
              <p className="text-gray-500 text-sm">下线推荐的会员付租，你得 3%</p>
            </div>
            <div className="card p-8 text-center">
              <div className="text-6xl font-black gradient-text mb-3">2%</div>
              <h3 className="text-xl font-bold mb-2">{t('level3_label')}</h3>
              <p className="text-gray-500 text-sm">三层推荐的会员付租，你得 2%</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-6 gradient-text">准备好开始了吗？</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary">{t('hero_join')}</Link>
            <Link to="/products" className="btn-secondary">{t('hero_browse')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 实现 ProductsPage.tsx**

```tsx
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import type { Lang } from '../types';

interface Product {
  id: number;
  name: Record<Lang, string>;
  features: Record<Lang, string[]>;
  image: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: { zh: '净水机 Pro 标准版', en: 'Water Purifier Pro Standard', ms: 'Penapis Air Pro Standard' },
    features: {
      zh: ['RO 反渗透过滤', '冷热双温', '免费安装维修'],
      en: ['RO Filtration', 'Hot & Cold', 'Free Installation & Service'],
      ms: ['Penapisan RO', 'Panas & Sejuk', 'Pasang & Servis Percuma'],
    },
    image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=Pro',
  },
  {
    id: 2,
    name: { zh: '净水机 Plus 豪华版', en: 'Water Purifier Plus Deluxe', ms: 'Penapis Air Plus Deluxe' },
    features: {
      zh: ['8级过滤系统', '冷热温三温', '智能水质显示', '免费安装维修'],
      en: ['8-Stage Filter', 'Hot/Warm/Cold', 'Smart Water Quality Display', 'Free Installation & Service'],
      ms: ['Penapis 8 Peringkat', 'Panas/Suam/Sejuk', 'Paparan Kualiti Air Pintar', 'Pasang & Servis Percuma'],
    },
    image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=Plus',
  },
  {
    id: 3,
    name: { zh: '净水机 Lite 入门版', en: 'Water Purifier Lite Basic', ms: 'Penapis Air Lite Asas' },
    features: {
      zh: ['5级过滤系统', '常温出水', '免费安装维修'],
      en: ['5-Stage Filter', 'Room Temperature', 'Free Installation & Service'],
      ms: ['Penapis 5 Peringkat', 'Suhu Bilik', 'Pasang & Servis Percuma'],
    },
    image: 'https://placehold.co/400x400/e0f2fe/0369a1?text=Lite',
  },
];

export default function ProductsPage() {
  const { t, lang } = useTranslation();

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-2 gradient-text">{t('products_title')}</h1>
          <p className="text-lg text-gray-600">{t('products_subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="card overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-square bg-sky-50 flex items-center justify-center">
                <img src={product.image} alt={product.name[lang as Lang]} className="w-2/3 h-2/3 object-contain" />
              </div>
              <div className="p-6">
                <p className="text-xs text-sky-600 font-semibold uppercase tracking-wide mb-2">
                  {t('monthly_rental')}
                </p>
                <h3 className="font-bold text-xl mb-4">{product.name[lang as Lang]}</h3>
                <ul className="space-y-2 mb-6">
                  {product.features[lang as Lang].map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-sky-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('monthly_rental')}</p>
                    <p className="text-2xl font-black gradient-text">RM_PRICE</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
                    40% {t('level1_label').split(' ')[0]}
                  </span>
                </div>
                <Link to="/register" className="btn-primary w-full block text-center text-sm">
                  💧 {t('join_as_agent')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 验证编译**

```bash
npm run build
```

预期：build 成功。

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/ProductsPage.tsx
git commit -m "feat: implement HomePage with commission plan display and ProductsPage with water machine cards"
```

---

## Task 5: 登录 + 注册页面

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/RegisterPage.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `useTranslation()`, Supabase `agents` table
- Produces: 登录表单（email+password → Supabase Auth），注册表单（创建 auth.user + agents 记录）

- [ ] **Step 1: 实现 LoginPage.tsx**

```tsx
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(t('error_login'));
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-md mx-auto px-4">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              💧
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('login_title')}</h1>
            <p className="text-gray-500">{t('login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t('email_label')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('password_label')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? t('loading') : t('btn_login')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              {t('no_account')}{' '}
              <Link to="/register" className="text-sky-600 font-semibold hover:text-sky-700">
                {t('become_agent')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 实现 RegisterPage.tsx**

```tsx
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', ic_number: '', referrer_id: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Create Supabase auth user
    const { data, error: signUpError } = await signUp(form.email, form.password);
    if (signUpError || !data.user) {
      setError(t('error_register'));
      setLoading(false);
      return;
    }

    // 2. Look up referrer agent if referrer_id provided
    let referrerId: string | null = null;
    if (form.referrer_id.trim()) {
      const { data: referrer } = await supabase
        .from('agents')
        .select('id')
        .eq('id', form.referrer_id.trim())
        .single();
      referrerId = referrer?.id ?? null;
    }

    // 3. Create agent profile
    const { error: agentError } = await supabase.from('agents').insert({
      user_id: data.user.id,
      referrer_id: referrerId,
      name: form.name,
      phone: form.phone,
      ic_number: form.ic_number,
    });

    setLoading(false);
    if (agentError) {
      setError(t('error_register'));
      return;
    }

    navigate('/login', { state: { message: t('success_register') } });
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 gradient-text">{t('register_title')}</h1>
            <p className="text-gray-500">{t('register_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('name_label')}</label>
                <input type="text" onChange={set('name')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('email_label')}</label>
                <input type="email" onChange={set('email')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('phone_label')}</label>
                <input type="tel" onChange={set('phone')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('ic_label')}</label>
                <input type="text" onChange={set('ic_number')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('referrer_label')}</label>
              <input
                type="text"
                placeholder={t('referrer_placeholder')}
                onChange={set('referrer_id')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('password_label')}</label>
              <input type="password" onChange={set('password')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-sky-600" required minLength={8} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1" />
              <span className="text-sm text-gray-700">{t('terms_text')}</span>
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? t('loading') : t('btn_register')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t('already_account')}{' '}
            <Link to="/login" className="text-sky-600 font-semibold">{t('login_now')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 验证编译**

```bash
npm run build
```

预期：build 成功。

- [ ] **Step 4: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/RegisterPage.tsx
git commit -m "feat: implement LoginPage and RegisterPage with Supabase Auth integration"
```

---

## Task 6: 仪表板页面

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `useTranslation()`, Supabase `agents` + `commissions` + `subscriptions` tables
- Produces: 仪表板（月租状态 + 本月佣金 + 钱包余额 + 团队规模 + 快捷操作）

- [ ] **Step 1: 实现 DashboardPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Agent, Commission, Subscription } from '../types';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [monthlyCommission, setMonthlyCommission] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Fetch agent profile
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setAgent(agentData);

      if (!agentData) { setLoading(false); return; }

      // Fetch active subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('agent_id', agentData.id)
        .eq('status', 'active')
        .single();
      setSubscription(subData);

      // Fetch this month's commissions
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: commData } = await supabase
        .from('commissions')
        .select('amount')
        .eq('agent_id', agentData.id)
        .eq('month', thisMonth);
      const total = (commData ?? []).reduce((sum: number, c: Pick<Commission, 'amount'>) => sum + c.amount, 0);
      setMonthlyCommission(total);

      // Count team (level 1 only for display; full count via org chart)
      const { count } = await supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', agentData.id);
      setTeamCount(count ?? 0);

      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        {t('loading')}
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">{t('dashboard_title')}</h1>
            <p className="text-gray-500 mt-1">{agent?.name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('rental_status')}</p>
            <div className={`text-2xl font-black mb-1 ${subscription ? 'text-emerald-600' : 'text-gray-400'}`}>
              {subscription ? t('status_active') : t('status_inactive')}
            </div>
            <p className="text-xs text-gray-400">Curlec Auto-Debit</p>
          </div>
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('monthly_commission')}</p>
            <div className="text-3xl font-black gradient-text mb-1">
              RM {monthlyCommission.toFixed(2)}
            </div>
          </div>
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('wallet_balance')}</p>
            <div className="text-3xl font-black gradient-text mb-1">
              RM {(agent?.wallet_balance ?? 0).toFixed(2)}
            </div>
          </div>
          <div className="card p-6">
            <p className="text-gray-500 text-sm font-semibold mb-2">{t('team_size')}</p>
            <div className="text-3xl font-black gradient-text mb-1">{teamCount}</div>
            <p className="text-xs text-gray-400">{t('team_sub')}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4">{t('org_title')}</h3>
            <p className="text-gray-500 text-sm mb-4">{t('team_sub')}</p>
            <Link to="/org" className="btn-primary inline-block">
              {t('view_org')}
            </Link>
          </div>
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4">{t('commission_records')}</h3>
            <p className="text-gray-500 text-sm mb-4">
              {t('monthly_commission')}: RM {monthlyCommission.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">
              Agent ID: {agent?.id?.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 验证编译**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: implement DashboardPage with monthly rental status, commission, wallet and team stats"
```

---

## Task 7: 组织图页面

**Files:**
- Modify: `src/pages/OrgChartPage.tsx`
- Create: `src/components/OrgNode.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `useTranslation()`, Supabase `agents` table (3 levels)
- Produces: 3层组织图（只显示自己以下，不显示完整树）

- [ ] **Step 1: 创建 src/components/OrgNode.tsx**

```tsx
import type { TeamMember } from '../types';

interface OrgNodeProps {
  member: TeamMember;
  color: 'sky' | 'emerald' | 'orange';
}

const colorMap = {
  sky: 'bg-sky-100 text-sky-700 border-sky-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
};

const dotColor = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
};

export default function OrgNode({ member, color }: OrgNodeProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colorMap[color]}`}>
      <div className={`w-8 h-8 ${dotColor[color]} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{member.name}</p>
        <p className="text-xs opacity-70 truncate">{member.email}</p>
      </div>
      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
        member.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
      }`}>
        {member.status}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: 实现 OrgChartPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import OrgNode from '../components/OrgNode';
import type { TeamMember } from '../types';

interface OrgData {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  agentId: string;
}

export default function OrgChartPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get own agent id
      const { data: self } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!self) { setLoading(false); return; }

      // Level 1: direct downlines
      const { data: l1 } = await supabase
        .from('agents')
        .select('id, name, email, status, created_at, referrer_id')
        .eq('referrer_id', self.id)
        .order('created_at', { ascending: false });

      const level1: TeamMember[] = l1 ?? [];

      // Level 2: downlines of level 1
      let level2: TeamMember[] = [];
      if (level1.length > 0) {
        const l1Ids = level1.map((a) => a.id);
        const { data: l2 } = await supabase
          .from('agents')
          .select('id, name, email, status, created_at, referrer_id')
          .in('referrer_id', l1Ids)
          .order('created_at', { ascending: false });
        level2 = l2 ?? [];
      }

      // Level 3: downlines of level 2
      let level3: TeamMember[] = [];
      if (level2.length > 0) {
        const l2Ids = level2.map((a) => a.id);
        const { data: l3 } = await supabase
          .from('agents')
          .select('id, name, email, status, created_at, referrer_id')
          .in('referrer_id', l2Ids)
          .order('created_at', { ascending: false });
        level3 = l3 ?? [];
      }

      setOrg({ agentId: self.id, level1, level2, level3 });
      setLoading(false);
    };

    load();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('loading')}</div>;
  }

  const levels = [
    { key: 'org_level1' as const, members: org?.level1 ?? [], color: 'sky' as const },
    { key: 'org_level2' as const, members: org?.level2 ?? [], color: 'emerald' as const },
    { key: 'org_level3' as const, members: org?.level3 ?? [], color: 'orange' as const },
  ];

  return (
    <section className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-8">{t('org_title')}</h1>

        {/* Root node */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2">
            💧
          </div>
          <p className="font-semibold text-sky-700">{t('org_you')}</p>
          <p className="text-xs text-gray-400">ID: {org?.agentId?.slice(0, 8)}</p>
        </div>

        {/* 3 Levels */}
        <div className="space-y-8">
          {levels.map(({ key, members, color }, idx) => (
            <div key={key}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  color === 'sky' ? 'bg-sky-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'
                }`} />
                <h3 className="font-bold text-gray-700">{t(key)}</h3>
                <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold ${
                  color === 'sky' ? 'bg-sky-100 text-sky-700' :
                  color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {members.length} {t('members_unit')}
                </span>
              </div>
              {members.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-2 pl-6">
                  {members.map((m) => (
                    <OrgNode key={m.id} member={m} color={color} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm pl-6">{t('org_empty')}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 验证编译**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/OrgChartPage.tsx src/components/OrgNode.tsx
git commit -m "feat: implement OrgChartPage showing 3-level downline tree and OrgNode component"
```

---

## Task 8: 最终验证 + 品牌占位符检查

**Files:**
- No new files — verification only

- [ ] **Step 1: 全局检查品牌占位符**

```bash
grep -rn "\[BRAND\]\|RM_PRICE" src/ index.html
```

确认所有占位符都在位，没有硬编码品牌名。

- [ ] **Step 2: 全局检查无 SmartCloud/电智云 残留**

```bash
grep -rn "SmartCloud\|电智云\|smartcloud" src/ index.html
```

预期：无结果。

- [ ] **Step 3: 最终 build**

```bash
npm run build
```

预期：build 成功，dist/ 生成。

- [ ] **Step 4: 开发服务器验证**

```bash
npm run dev
```

在浏览器访问 http://localhost:5173，手动验证：
- [ ] 首页加载 — 看到 [BRAND] + 佣金三格
- [ ] 语言切换 EN → 文字切换
- [ ] 语言切换 BM → 马来文
- [ ] 产品页 — 3个水机卡片
- [ ] 点击「成为代理」→ 跳转注册页
- [ ] 注册页表单显示
- [ ] 登录页表单显示
- [ ] `/dashboard` 未登录 → 跳转 `/login`（ProtectedRoute 正常）

- [ ] **Step 5: 最终 commit**

```bash
git add -A
git commit -m "chore: final verification — build passes, all pages accessible, brand placeholders in place"
```

---

## 上线前 Checklist

| 项目 | 动作 |
|------|------|
| Supabase 项目创建 | 在 supabase.com 新建项目，执行 `supabase/schema.sql` |
| `.env.local` 配置 | 填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` |
| 品牌名确定 | 全局替换 `[BRAND]` |
| 月租金额确定 | 全局替换 `RM_PRICE` |
| Curlec 支付集成 | 单独任务（账号申请后实施）|
| 部署 | Vercel / Netlify 连接 GitHub repo，设置环境变量 |
