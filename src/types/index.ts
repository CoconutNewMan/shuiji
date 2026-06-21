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
