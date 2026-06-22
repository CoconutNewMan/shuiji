# Admin Control Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-tier admin system — a super admin control center at `/admin` and fully isolated per-tenant sub-portals at `/portal/:tenantId`, with login lockout security.

**Architecture:** Single Supabase project with RLS-based multi-tenancy. Super admin uses the existing `admins` table check. Tenant admins authenticate via Supabase Auth and are verified against a new `tenant_admins` table. All tenant data is filtered by `tenant_id` at the RLS level.

**Tech Stack:** React + TypeScript + Vite + Tailwind CSS + Supabase (Auth + PostgreSQL) + React Router v6

## Global Constraints

- Never expose service role key to the frontend — all privileged operations go through Supabase RLS or are done in the Supabase dashboard
- All new pages follow existing Tailwind patterns (see `AdminLayoutPage.tsx`)
- All new routes must be added to `src/App.tsx`
- TypeScript strict — no `any` types
- Chinese UI labels (zh-CN) to match existing pages

---

## File Map

**New files to create:**
- `src/types/tenant.ts` — shared types for tenants, tenant_admins, tasks, announcements
- `src/hooks/useTenantAdmin.ts` — auth hook for portal (mirrors `useAdmin.ts`)
- `src/components/PortalProtectedRoute.tsx` — route guard for `/portal/*`
- `src/pages/admin/AdminTenantsPage.tsx` — manage project tenants
- `src/pages/admin/AdminAccountsPage.tsx` — manage tenant admin accounts + unlock
- `src/pages/admin/AdminAnnouncementsPage.tsx` — publish announcements
- `src/pages/admin/AdminLogsPage.tsx` — login audit log
- `src/pages/portal/PortalLoginPage.tsx` — tenant admin login
- `src/pages/portal/PortalLayoutPage.tsx` — portal sidebar layout
- `src/pages/portal/PortalDashboardPage.tsx` — project overview
- `src/pages/portal/PortalTasksPage.tsx` — work tasks (kanban-style)
- `src/pages/portal/PortalMembersPage.tsx` — tenant members
- `src/pages/portal/PortalCommissionsPage.tsx` — tenant commissions
- `src/pages/portal/PortalAnnouncementsPage.tsx` — read-only announcements
- `src/pages/portal/PortalSettingsPage.tsx` — change password

**Files to modify:**
- `src/App.tsx` — add all new routes
- `src/pages/admin/AdminLayoutPage.tsx` — add new sidebar nav items
- `src/pages/admin/AdminDashboardPage.tsx` — add cross-tenant stats

---

## Task 1: Database Schema (Supabase Dashboard)

**Files:**
- No code files — run SQL in Supabase Dashboard → SQL Editor

**Interfaces:**
- Produces: tables `tenants`, `tenant_admins`, `tasks`, `announcements`, `login_attempts`; columns `tenant_id` added to `agents` and `commissions`

- [ ] **Step 1: Open Supabase Dashboard → SQL Editor, run the following SQL**

```sql
-- Tenants (projects)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  theme_color text DEFAULT '#0ea5e9',
  created_at timestamptz DEFAULT now()
);

-- Tenant admin accounts
CREATE TABLE IF NOT EXISTS tenant_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL UNIQUE,
  failed_attempts int NOT NULL DEFAULT 0,
  locked boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Work tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  assignee text,
  due_date date,
  created_at timestamptz DEFAULT now()
);

-- Announcements (tenant_id NULL = broadcast to all)
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  published_at timestamptz DEFAULT now()
);

-- Login audit log
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  success boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);

-- Extend existing tables with tenant_id
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
```

- [ ] **Step 2: Enable RLS on new tables**

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: Create RLS policies**

```sql
-- tenant_admins table: users can only read their own row
CREATE POLICY "tenant_admin_self" ON tenant_admins
  FOR SELECT USING (user_id = auth.uid());

-- tasks: tenant_admins can CRUD their own tenant's tasks
-- We use a helper function to get tenant_id from tenant_admins table
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM tenant_admins WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "tasks_tenant_isolation" ON tasks
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- announcements: tenant_admins can read their own + broadcasts (tenant_id IS NULL)
CREATE POLICY "announcements_read" ON announcements
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = get_my_tenant_id());

-- login_attempts: no direct client access (insert via anon, no select)
CREATE POLICY "login_attempts_insert" ON login_attempts
  FOR INSERT WITH CHECK (true);
```

- [ ] **Step 4: Grant anon/authenticated access to login_attempts insert**

```sql
GRANT INSERT ON login_attempts TO anon, authenticated;
GRANT SELECT ON tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT ON announcements TO authenticated;
GRANT SELECT ON tenant_admins TO authenticated;
```

- [ ] **Step 5: Verify in Supabase Table Editor that all 5 new tables exist with correct columns**

---

## Task 2: Shared Types

**Files:**
- Create: `src/types/tenant.ts`

**Interfaces:**
- Produces: `Tenant`, `TenantAdmin`, `Task`, `Announcement` types used by all portal/admin pages

- [ ] **Step 1: Create `src/types/tenant.ts`**

```typescript
export interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  theme_color: string;
  created_at: string;
}

export interface TenantAdmin {
  id: string;
  tenant_id: string;
  user_id: string | null;
  email: string;
  failed_attempts: number;
  locked: boolean;
  locked_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  assignee: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  tenant_id: string | null;
  title: string;
  content: string;
  published_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/tenant.ts
git commit -m "feat: add tenant shared types"
```

---

## Task 3: Portal Auth Hook + Route Guard

**Files:**
- Create: `src/hooks/useTenantAdmin.ts`
- Create: `src/components/PortalProtectedRoute.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`, `useAuth` from `src/hooks/useAuth.ts`
- Produces: `useTenantAdmin()` → `{ tenantId, locked, loading }`, `PortalProtectedRoute` component

- [ ] **Step 1: Create `src/hooks/useTenantAdmin.ts`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useTenantAdmin() {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTenantId(null); setLoading(false); return; }
    supabase
      .from('tenant_admins')
      .select('tenant_id, locked')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setTenantId(data?.tenant_id ?? null);
        setLocked(data?.locked ?? false);
        setLoading(false);
      });
  }, [user]);

  return { tenantId, locked, loading };
}
```

- [ ] **Step 2: Create `src/components/PortalProtectedRoute.tsx`**

```typescript
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTenantAdmin } from '../hooks/useTenantAdmin';

export default function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { tenantId, locked, loading: adminLoading } = useTenantAdmin();
  const { id } = useParams<{ id: string }>();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user || !tenantId) return <Navigate to="/portal/login" replace />;
  if (locked) return <Navigate to="/portal/login?locked=1" replace />;
  // Prevent tenant A from accessing tenant B's portal
  if (id && id !== tenantId) return <Navigate to="/portal/login" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTenantAdmin.ts src/components/PortalProtectedRoute.tsx
git commit -m "feat: add portal auth hook and route guard"
```

---

## Task 4: Portal Login Page

**Files:**
- Create: `src/pages/portal/PortalLoginPage.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`
- Produces: portal login page at `/portal/login`, tracks failed attempts, shows locked message

- [ ] **Step 1: Create `src/pages/portal/PortalLoginPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isLocked = params.get('locked') === '1';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if account is locked before attempting login
    const { data: adminRow } = await supabase
      .from('tenant_admins')
      .select('locked, failed_attempts, tenant_id')
      .eq('email', email.toLowerCase())
      .single();

    if (adminRow?.locked) {
      setError('账号已锁定，请联系管理员解锁。');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      // Increment failed attempts
      const newAttempts = (adminRow?.failed_attempts ?? 0) + 1;
      const shouldLock = newAttempts >= 5;

      await supabase
        .from('tenant_admins')
        .update({
          failed_attempts: newAttempts,
          locked: shouldLock,
          locked_at: shouldLock ? new Date().toISOString() : null,
        })
        .eq('email', email.toLowerCase());

      await supabase.from('login_attempts').insert({ email, success: false });

      if (shouldLock) {
        setError('登录失败次数过多，账号已锁定。请联系管理员解锁。');
      } else {
        setError(`密码错误。已失败 ${newAttempts}/5 次。`);
      }
      setLoading(false);
      return;
    }

    // Success — reset failed attempts
    await supabase
      .from('tenant_admins')
      .update({ failed_attempts: 0 })
      .eq('email', email.toLowerCase());

    await supabase.from('login_attempts').insert({ email, success: true });

    // Get tenant_id and redirect
    const tenantId = adminRow?.tenant_id;
    if (tenantId) {
      navigate(`/portal/${tenantId}/dashboard`);
    } else {
      setError('找不到关联项目，请联系管理员。');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">项目后台登录</h1>
        <p className="text-gray-500 text-sm mb-6">请使用管理员提供的账号登录</p>

        {isLocked && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            账号已锁定，请联系管理员解锁。
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/portal/PortalLoginPage.tsx
git commit -m "feat: add portal login page with lockout after 5 failures"
```

---

## Task 5: Portal Layout + Shell Pages

**Files:**
- Create: `src/pages/portal/PortalLayoutPage.tsx`
- Create: `src/pages/portal/PortalDashboardPage.tsx`
- Create: `src/pages/portal/PortalMembersPage.tsx`
- Create: `src/pages/portal/PortalCommissionsPage.tsx`
- Create: `src/pages/portal/PortalAnnouncementsPage.tsx`
- Create: `src/pages/portal/PortalSettingsPage.tsx`

**Interfaces:**
- Consumes: `useTenantAdmin()` from Task 3, `supabase` from `src/lib/supabase.ts`
- Produces: portal shell with sidebar navigation

- [ ] **Step 1: Create `src/pages/portal/PortalLayoutPage.tsx`**

```typescript
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function PortalLayoutPage() {
  const { signOut } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/portal/login');
  }

  const nav = [
    { to: `/portal/${id}/dashboard`, icon: '📊', label: '项目概览' },
    { to: `/portal/${id}/tasks`, icon: '✅', label: '工作事项' },
    { to: `/portal/${id}/members`, icon: '👥', label: '会员管理' },
    { to: `/portal/${id}/commissions`, icon: '💰', label: '佣金记录' },
    { to: `/portal/${id}/announcements`, icon: '📢', label: '公告中心' },
    { to: `/portal/${id}/settings`, icon: '⚙️', label: '账号设置' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-sky-900 text-white flex flex-col">
        <div className="p-6 border-b border-sky-800">
          <h1 className="text-lg font-bold">🏢 项目后台</h1>
          <p className="text-sky-300 text-sm mt-1 truncate">{id}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sky-600 text-white' : 'text-sky-200 hover:bg-sky-800'}`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sky-800">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm text-sky-200 hover:text-white hover:bg-sky-800 rounded-lg transition-all text-left"
          >
            🚪 退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/pages/portal/PortalDashboardPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function PortalDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState({ members: 0, thisMonthComm: 0, pendingTasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const thisMonth = new Date().toISOString().slice(0, 7);
    Promise.all([
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
      supabase.from('commissions').select('amount').eq('tenant_id', id).eq('month', thisMonth),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('tenant_id', id).neq('status', 'done'),
    ]).then(([{ count: members }, { data: comm }, { count: pending }]) => {
      setStats({
        members: members ?? 0,
        thisMonthComm: comm?.reduce((s, r) => s + Number(r.amount), 0) ?? 0,
        pendingTasks: pending ?? 0,
      });
      setLoading(false);
    });
  }, [id]);

  const cards = [
    { label: '项目会员', value: stats.members, icon: '👥', color: 'bg-blue-500' },
    { label: '本月佣金', value: `RM ${stats.thisMonthComm.toFixed(2)}`, icon: '💰', color: 'bg-yellow-500' },
    { label: '待完成任务', value: stats.pendingTasks, icon: '📋', color: 'bg-orange-500' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">项目概览</h2>
      {loading ? (
        <div className="text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm p-6">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-xl mb-4`}>
                {card.icon}
              </div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/pages/portal/PortalTasksPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Task } from '../../types/tenant';

const COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'todo', label: '待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'done', label: '已完成' },
];

export default function PortalTasksPage() {
  const { id } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');

  async function load() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
  }

  useEffect(() => { load(); }, [id]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('tasks').insert({ tenant_id: id, title, description, assignee });
    setTitle(''); setDescription(''); setAssignee(''); setShowForm(false);
    load();
  }

  async function moveTask(taskId: string, status: Task['status']) {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    load();
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">工作事项</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
        >
          + 新增任务
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTask} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <input
            placeholder="任务标题 *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <textarea
            placeholder="描述（可选）"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            placeholder="负责人（可选）"
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">保存</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map(col => (
          <div key={col.key} className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3">{col.label} ({tasks.filter(t => t.status === col.key).length})</h3>
            <div className="space-y-2">
              {tasks.filter(t => t.status === col.key).map(task => (
                <div key={task.id} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                  {task.assignee && <p className="text-xs text-sky-600 mt-1">👤 {task.assignee}</p>}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {COLUMNS.filter(c => c.key !== col.key).map(c => (
                      <button
                        key={c.key}
                        onClick={() => moveTask(task.id, c.key)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        → {c.label}
                      </button>
                    ))}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/pages/portal/PortalMembersPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Agent { id: string; name: string; email: string; status: string; created_at: string; }

export default function PortalMembersPage() {
  const { id } = useParams<{ id: string }>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('agents').select('*').eq('tenant_id', id).order('created_at', { ascending: false })
      .then(({ data }) => { setAgents(data ?? []); setLoading(false); });
  }, [id]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">会员管理</h2>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">姓名</th>
                <th className="px-6 py-3 text-left">邮箱</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">加入时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{a.name}</td>
                  <td className="px-6 py-4 text-gray-500">{a.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.status === 'active' ? '活跃' : '停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(a.created_at).toLocaleDateString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && <div className="p-8 text-center text-gray-400">暂无会员</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/pages/portal/PortalCommissionsPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Commission { id: string; agent_id: string; amount: number; month: string; }

export default function PortalCommissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('commissions').select('*').eq('tenant_id', id).order('month', { ascending: false })
      .then(({ data }) => { setRecords(data ?? []); setLoading(false); });
  }, [id]);

  const total = records.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">佣金记录</h2>
      <p className="text-gray-500 text-sm mb-6">累计佣金：<span className="font-semibold text-gray-900">RM {total.toFixed(2)}</span></p>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">月份</th>
                <th className="px-6 py-3 text-left">会员ID</th>
                <th className="px-6 py-3 text-right">金额 (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{r.month}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{r.agent_id}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{Number(r.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && <div className="p-8 text-center text-gray-400">暂无记录</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/pages/portal/PortalAnnouncementsPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Announcement } from '../../types/tenant';

export default function PortalAnnouncementsPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // RLS policy already filters: tenant_id = my tenant OR tenant_id IS NULL
    supabase.from('announcements').select('*').order('published_at', { ascending: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false); });
  }, [id]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">公告中心</h2>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                {!item.tenant_id && (
                  <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">全员</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{item.content}</p>
              <p className="text-gray-400 text-xs mt-3">{new Date(item.published_at).toLocaleString('zh-CN')}</p>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-gray-400 py-12">暂无公告</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create `src/pages/portal/PortalSettingsPage.tsx`**

```typescript
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PortalSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage(''); setError('');
    if (newPassword !== confirm) { setError('两次输入的新密码不一致'); return; }
    if (newPassword.length < 8) { setError('新密码至少需要8位'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) { setError(err.message); } else { setMessage('密码修改成功'); setCurrentPassword(''); setNewPassword(''); setConfirm(''); }
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">账号设置</h2>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">修改密码</h3>
        <form onSubmit={handleChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
            {loading ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit all portal pages**

```bash
git add src/pages/portal/
git commit -m "feat: add portal layout and all portal sub-pages"
```

---

## Task 6: Super Admin — New Pages

**Files:**
- Create: `src/pages/admin/AdminTenantsPage.tsx`
- Create: `src/pages/admin/AdminAccountsPage.tsx`
- Create: `src/pages/admin/AdminAnnouncementsPage.tsx`
- Create: `src/pages/admin/AdminLogsPage.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`, `Tenant`, `TenantAdmin`, `Announcement` from `src/types/tenant.ts`
- Produces: 4 new admin pages for tenant management, account management, announcements, logs

- [ ] **Step 1: Create `src/pages/admin/AdminTenantsPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Tenant } from '../../types/tenant';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#0ea5e9');
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    setTenants(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addTenant(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('tenants').insert({ name, theme_color: themeColor });
    setName(''); setThemeColor('#0ea5e9'); setShowForm(false);
    load();
  }

  async function toggleStatus(tenant: Tenant) {
    await supabase.from('tenants').update({ status: tenant.status === 'active' ? 'suspended' : 'active' }).eq('id', tenant.id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">项目方管理</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
          + 新增项目方
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTenant} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <input placeholder="项目方名称 *" value={name} onChange={e => setName(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">主题色</label>
            <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="h-8 w-16 rounded cursor-pointer" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">创建</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">项目方</th>
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">创建时间</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.theme_color }} />
                      <span className="font-medium text-gray-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{t.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.status === 'active' ? '运营中' : '已停用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(t.created_at).toLocaleDateString('zh-CN')}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(t)}
                      className={`text-xs px-3 py-1 rounded-lg transition-colors ${t.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {t.status === 'active' ? '停用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && <div className="p-8 text-center text-gray-400">暂无项目方</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/pages/admin/AdminAccountsPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { TenantAdmin, Tenant } from '../../types/tenant';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<(TenantAdmin & { tenant_name: string })[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  async function load() {
    const [{ data: admins }, { data: t }] = await Promise.all([
      supabase.from('tenant_admins').select('*').order('created_at', { ascending: false }),
      supabase.from('tenants').select('id, name'),
    ]);
    const tenantMap = Object.fromEntries((t ?? []).map(x => [x.id, x.name]));
    setAccounts((admins ?? []).map(a => ({ ...a, tenant_name: tenantMap[a.tenant_id] ?? '-' })));
    setTenants(t ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    // Create Supabase Auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      setFormError(error?.message ?? '创建失败');
      return;
    }
    await supabase.from('tenant_admins').insert({
      tenant_id: tenantId,
      user_id: data.user.id,
      email: email.toLowerCase(),
    });
    setEmail(''); setPassword(''); setTenantId(''); setShowForm(false);
    load();
  }

  async function unlock(account: TenantAdmin) {
    if (!unlockReason.trim()) { alert('请填写解锁原因'); return; }
    await supabase.from('tenant_admins').update({
      locked: false,
      failed_attempts: 0,
      locked_at: null,
    }).eq('id', account.id);
    // Log the unlock action
    await supabase.from('login_attempts').insert({
      email: account.email,
      success: true,
    });
    setUnlockingId(null);
    setUnlockReason('');
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">子账号管理</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
          + 新增账号
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAccount} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <select value={tenantId} onChange={e => setTenantId(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">选择项目方 *</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="email" placeholder="邮箱 *" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <input type="password" placeholder="初始密码（至少8位）*" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">创建</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">邮箱</th>
                <th className="px-6 py-3 text-left">所属项目</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">失败次数</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map(a => (
                <tr key={a.id} className={`hover:bg-gray-50 ${a.locked ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{a.email}</td>
                  <td className="px-6 py-4 text-gray-500">{a.tenant_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {a.locked ? '🔒 已锁定' : '✅ 正常'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{a.failed_attempts}/5</td>
                  <td className="px-6 py-4">
                    {a.locked && (
                      unlockingId === a.id ? (
                        <div className="flex gap-2 items-center">
                          <input placeholder="解锁原因 *" value={unlockReason} onChange={e => setUnlockReason(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-32" />
                          <button onClick={() => unlock(a)} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">确认</button>
                          <button onClick={() => setUnlockingId(null)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setUnlockingId(a.id)}
                          className="text-xs px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                          解锁
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && <div className="p-8 text-center text-gray-400">暂无账号</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/pages/admin/AdminAnnouncementsPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Announcement, Tenant } from '../../types/tenant';

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetTenantId, setTargetTenantId] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: ann }, { data: t }] = await Promise.all([
      supabase.from('announcements').select('*').order('published_at', { ascending: false }),
      supabase.from('tenants').select('id, name').eq('status', 'active'),
    ]);
    setItems(ann ?? []);
    setTenants(t ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('announcements').insert({
      title,
      content,
      tenant_id: targetTenantId || null,
    });
    setTitle(''); setContent(''); setTargetTenantId(''); setShowForm(false);
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm('确定删除这条公告？')) return;
    await supabase.from('announcements').delete().eq('id', id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">公告管理</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors">
          + 发布公告
        </button>
      </div>

      {showForm && (
        <form onSubmit={publish} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-3">
          <input placeholder="公告标题 *" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <textarea placeholder="公告内容 *" value={content} onChange={e => setContent(e.target.value)} required rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <select value={targetTenantId} onChange={e => setTargetTenantId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">全员广播</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700">发布</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">取消</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    {!item.tenant_id && <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">全员</span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{item.content}</p>
                  <p className="text-gray-400 text-xs mt-3">{new Date(item.published_at).toLocaleString('zh-CN')}</p>
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700 ml-4">删除</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center text-gray-400 py-12">暂无公告</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/pages/admin/AdminLogsPage.tsx`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface LogEntry { id: string; email: string; success: boolean; attempted_at: string; }

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('login_attempts').select('*').order('attempted_at', { ascending: false }).limit(200)
      .then(({ data }) => { setLogs(data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">系统日志</h2>
      {loading ? <div className="text-gray-500">加载中...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">时间</th>
                <th className="px-6 py-3 text-left">邮箱</th>
                <th className="px-6 py-3 text-left">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className={`hover:bg-gray-50 ${!log.success ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 text-gray-500">{new Date(log.attempted_at).toLocaleString('zh-CN')}</td>
                  <td className="px-6 py-4 text-gray-900">{log.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.success ? '✅ 成功' : '❌ 失败'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="p-8 text-center text-gray-400">暂无记录</div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminTenantsPage.tsx src/pages/admin/AdminAccountsPage.tsx src/pages/admin/AdminAnnouncementsPage.tsx src/pages/admin/AdminLogsPage.tsx
git commit -m "feat: add admin tenants, accounts, announcements, and logs pages"
```

---

## Task 7: Wire Up Routes + Update Admin Sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/admin/AdminLayoutPage.tsx`

**Interfaces:**
- Consumes: all new page components from Tasks 4–6, `PortalProtectedRoute` from Task 3

- [ ] **Step 1: Replace `src/App.tsx` with the following**

```typescript
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import PortalProtectedRoute from './components/PortalProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrgChartPage from './pages/OrgChartPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayoutPage from './pages/admin/AdminLayoutPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminCommissionsPage from './pages/admin/AdminCommissionsPage';
import AdminTenantsPage from './pages/admin/AdminTenantsPage';
import AdminAccountsPage from './pages/admin/AdminAccountsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalLayoutPage from './pages/portal/PortalLayoutPage';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';
import PortalTasksPage from './pages/portal/PortalTasksPage';
import PortalMembersPage from './pages/portal/PortalMembersPage';
import PortalCommissionsPage from './pages/portal/PortalCommissionsPage';
import PortalAnnouncementsPage from './pages/portal/PortalAnnouncementsPage';
import PortalSettingsPage from './pages/portal/PortalSettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Super admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayoutPage />
          </AdminProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="members" element={<AdminMembersPage />} />
        <Route path="commissions" element={<AdminCommissionsPage />} />
        <Route path="tenants" element={<AdminTenantsPage />} />
        <Route path="accounts" element={<AdminAccountsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
      </Route>

      {/* Tenant portal routes */}
      <Route path="/portal/login" element={<PortalLoginPage />} />
      <Route
        path="/portal/:id"
        element={
          <PortalProtectedRoute>
            <PortalLayoutPage />
          </PortalProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PortalDashboardPage />} />
        <Route path="tasks" element={<PortalTasksPage />} />
        <Route path="members" element={<PortalMembersPage />} />
        <Route path="commissions" element={<PortalCommissionsPage />} />
        <Route path="announcements" element={<PortalAnnouncementsPage />} />
        <Route path="settings" element={<PortalSettingsPage />} />
      </Route>

      {/* Agent-facing routes */}
      <Route
        path="/*"
        element={
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
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 2: Replace `src/pages/admin/AdminLayoutPage.tsx` with expanded sidebar**

```typescript
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  const nav = [
    { to: '/admin/dashboard', icon: '📊', label: '系统概览' },
    { to: '/admin/tenants', icon: '🏢', label: '项目方管理' },
    { to: '/admin/accounts', icon: '🔑', label: '子账号管理' },
    { to: '/admin/members', icon: '👥', label: '全局会员' },
    { to: '/admin/commissions', icon: '💰', label: '全局佣金' },
    { to: '/admin/announcements', icon: '📢', label: '公告管理' },
    { to: '/admin/logs', icon: '🔍', label: '系统日志' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold">⚡ 超级总台</h1>
          <p className="text-gray-400 text-sm mt-1">管理控制中心</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-left"
          >
            🚪 退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/pages/admin/AdminLayoutPage.tsx
git commit -m "feat: wire up all admin and portal routes, expand admin sidebar"
```

---

## Task 8: Supabase Admin API Fix

> **Note:** `supabase.auth.admin.createUser()` requires the service role key, which must NOT be in the frontend. For v1, create tenant admin accounts directly in Supabase Dashboard → Authentication → Users, then manually insert into `tenant_admins` table. Update `AdminAccountsPage.tsx` to remove the `auth.admin.createUser` call.

**Files:**
- Modify: `src/pages/admin/AdminAccountsPage.tsx` lines 47–57

- [ ] **Step 1: Replace the `createAccount` function in `AdminAccountsPage.tsx`**

```typescript
async function createAccount(e: React.FormEvent) {
  e.preventDefault();
  setFormError('');
  // Insert the record — super admin must first create the auth user
  // in Supabase Dashboard > Authentication > Users, then come back here
  const { error } = await supabase.from('tenant_admins').insert({
    tenant_id: tenantId,
    email: email.toLowerCase(),
    user_id: null, // will be linked when the user first logs in
  });
  if (error) { setFormError(error.message); return; }
  setEmail(''); setPassword(''); setTenantId(''); setShowForm(false);
  load();
}
```

- [ ] **Step 2: Update the form — remove password field from `AdminAccountsPage.tsx`**

Remove the password `<input>` element from the form JSX (the one with `type="password"`).

- [ ] **Step 3: Update `PortalLoginPage.tsx` — link user_id on first login**

In the success branch of `handleLogin`, after resetting failed attempts, add:

```typescript
// Link user_id if not yet linked
const { data: { user: currentUser } } = await supabase.auth.getUser();
if (currentUser && !adminRow?.user_id) {
  await supabase
    .from('tenant_admins')
    .update({ user_id: currentUser.id })
    .eq('email', email.toLowerCase());
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminAccountsPage.tsx src/pages/portal/PortalLoginPage.tsx
git commit -m "fix: use dashboard-first account creation, link user_id on first login"
```

---

## Task 9: Build Verification

**Files:** None — verification only

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

- [ ] **Step 3: Verify these routes load without errors**

| URL | Expected |
|---|---|
| `http://localhost:5173/admin/login` | Admin login page |
| `http://localhost:5173/admin/dashboard` | Redirects to login (not authenticated) |
| `http://localhost:5173/portal/login` | Portal login page |
| `http://localhost:5173/portal/fake-id/dashboard` | Redirects to portal login |

- [ ] **Step 4: Log in as super admin and verify all 7 sidebar items navigate correctly**

- [ ] **Step 5: In Supabase Dashboard, create a test tenant and tenant_admin, then log in via `/portal/login` and verify the portal loads**

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete admin control center with tenant portal"
```
