-- Admin table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_own" ON public.admins
  FOR SELECT USING (user_id = auth.uid());

-- Allow admins to read ALL agents
CREATE POLICY "agents_admin_select_all" ON public.agents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Allow admins to update agents (suspend/activate)
CREATE POLICY "agents_admin_update" ON public.agents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Allow admins to read ALL commissions
CREATE POLICY "commissions_admin_select_all" ON public.commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Allow admins to update commissions
CREATE POLICY "commissions_admin_update" ON public.commissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Allow admins to read ALL subscriptions
CREATE POLICY "subscriptions_admin_select_all" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );
