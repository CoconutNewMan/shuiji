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

// Task 1: Video-to-Ad Platform Types
export type VideoPlatform = 'tiktok' | 'youtube' | 'instagram' | 'xiaohongshu' | 'douyin';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AdStyle = '销售驱动' | '教育科普' | '娱乐感性';

export interface VideoInput {
  id: string;
  campaign_id: string;
  video_url?: string;
  video_file_url?: string;
  platform: VideoPlatform;
  extracted_text?: string;
  extraction_status: ExtractionStatus;
  extraction_error_message?: string;
  extracted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AICopy {
  id: string;
  campaign_id: string;
  video_input_id: string;
  style: AdStyle;
  headline: string;
  body_text: string;
  cta_suggestions?: string[];
  image_suggestion?: string;
  used_in_ad_id?: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  product_name: string;
  product_description: string;
  product_features: string;
  budget_daily: number;
  budget_total: number;
  status: 'draft' | 'active' | 'paused' | 'ended';
  created_at: string;
}

export interface Ad {
  id: string;
  campaign_id: string;
  headline: string;
  body_text: string;
  cta: string;
  image_url?: string;
  video_url?: string;
  landing_url: string;
  status: 'active' | 'paused' | 'ended';
  style: AdStyle;
  ai_generated: boolean;
  created_at: string;
}
