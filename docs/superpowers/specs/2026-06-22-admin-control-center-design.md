# Admin Control Center — Design Spec
**Date:** 2026-06-22  
**Status:** Approved

---

## Overview

Build a two-tier admin control center on top of the existing BaoKuan frontend:

- **超级总台 `/admin`** — Super admin only (you). Full visibility across all projects.
- **子后台 `/portal/:tenantId`** — Per-project admin. Fully isolated from other tenants.

Existing routes (`/admin/dashboard`, `/admin/members`, `/admin/commissions`) are upgraded and extended, not replaced.

---

## Architecture

### Tech Stack
- Frontend: React + TypeScript + Tailwind (existing)
- Backend: Supabase (Auth + PostgreSQL + Edge Functions)
- Auth: Supabase JWT with custom claims (`role`, `tenant_id`)

### Two Login Entries
| Entry | Route | Who |
|---|---|---|
| 超级管理员 | `/admin/login` | You only, `role = super_admin` |
| 项目方 | `/portal/login` | Tenant admins, `role = tenant_admin` |

### Data Isolation Strategy
Single Supabase project. Row Level Security (RLS) isolates all tenant data by `tenant_id`.

- Tenant admins: all queries auto-filtered by `WHERE tenant_id = auth.jwt()->>'tenant_id'`
- Super admin: uses Supabase service role key **only inside Edge Functions** — never exposed to the frontend

---

## Database Schema

### New Tables

```sql
-- Projects / tenants
tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  status text DEFAULT 'active',  -- active | suspended
  theme_color text,              -- optional per-tenant brand color
  created_at timestamptz
)

-- Sub-admin accounts
tenant_admins (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  failed_attempts int DEFAULT 0,
  locked boolean DEFAULT false,
  locked_at timestamptz,
  created_at timestamptz
)

-- Work tasks
tasks (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo',   -- todo | in_progress | done
  assignee text,
  due_date date,
  created_at timestamptz
)

-- Announcements
announcements (
  id uuid PRIMARY KEY,
  tenant_id uuid,               -- NULL = broadcast to all tenants
  title text NOT NULL,
  content text NOT NULL,
  published_at timestamptz
)

-- Login audit log
login_attempts (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  success boolean,
  ip text,
  attempted_at timestamptz
)
```

### Existing Tables — Extended
- `agents`: add `tenant_id uuid` column
- `commissions`: add `tenant_id uuid` column

### RLS Policies (tenant tables)
```sql
-- Tenant admins can only read/write their own tenant's data
CREATE POLICY "tenant_isolation" ON tasks
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- Same pattern applied to: announcements, agents, commissions
```

Super admin bypasses RLS via service role (Edge Functions only).

---

## Security Design

### Login Lockout
- Track failed attempts in `tenant_admins.failed_attempts`
- After **5 consecutive failures** → set `locked = true`, record `locked_at`
- Locked accounts cannot log in at all — display message: "账号已锁定，请联系管理员解锁"
- Super admin manually unlocks from `/admin/accounts` — must record unlock reason

### JWT Custom Claims
```json
{
  "role": "tenant_admin",
  "tenant_id": "uuid-of-tenant"
}
```
Set via Supabase Auth hook on sign-in. Frontend reads claims to determine which portal to show.

### Frontend Route Guards
- `AdminProtectedRoute`: checks `role = super_admin`, redirects to `/admin/login` if not
- `PortalProtectedRoute`: checks `role = tenant_admin` + valid `tenant_id`, redirects to `/portal/login`
- No cross-access: a tenant admin visiting `/admin/*` gets rejected

### Audit Log
All login attempts (success and failure) written to `login_attempts` table via Edge Function. Super admin can review from `/admin/logs`.

---

## Feature Modules

### 超级总台 `/admin/*`

| Route | Feature |
|---|---|
| `/admin/dashboard` | 汇总概览：所有项目数、总会员、总佣金、活跃项目 |
| `/admin/tenants` | 项目方列表：创建、停用、查看详情 |
| `/admin/tenants/:id` | 单项目详情：会员数、佣金、任务状态 |
| `/admin/accounts` | 子账号管理：创建账号、解锁锁定账号、查看锁定记录 |
| `/admin/members` | 全局会员总览（跨所有项目） |
| `/admin/commissions` | 全局佣金报表 + 图表（按项目/月份筛选） |
| `/admin/announcements` | 发布公告（指定项目或全员广播） |
| `/admin/logs` | 系统日志：登录记录、锁定事件、操作审计 |

### 子后台 `/portal/:tenantId/*`

| Route | Feature |
|---|---|
| `/portal/:id/dashboard` | 项目概览：会员数、本月佣金、待办任务数 |
| `/portal/:id/tasks` | 工作事项：新增/编辑/删除任务，拖拽状态（Todo → In Progress → Done） |
| `/portal/:id/members` | 本项目会员管理 |
| `/portal/:id/commissions` | 本项目佣金记录 + 月度报表 |
| `/portal/:id/announcements` | 查看超级 admin 发布的公告 |
| `/portal/:id/settings` | 修改密码（需验证旧密码） |

---

## UI Design

- **总台**: Dark sidebar (slate-900), professional enterprise feel
- **子后台**: Light sidebar, supports per-tenant `theme_color` accent
- Both share the same component library (existing Tailwind setup)
- Responsive: sidebar collapses on mobile

---

## Frontend Route Structure

```
/admin/login
/admin/dashboard
/admin/tenants
/admin/tenants/:id
/admin/accounts
/admin/members
/admin/commissions
/admin/announcements
/admin/logs

/portal/login
/portal/:id/dashboard
/portal/:id/tasks
/portal/:id/members
/portal/:id/commissions
/portal/:id/announcements
/portal/:id/settings
```

---

## Out of Scope (v1)
- Email notifications on lockout (can add later)
- 2FA for super admin (can add later)
- Per-tenant custom domain (can add later)
