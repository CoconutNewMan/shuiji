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
