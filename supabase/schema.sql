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
