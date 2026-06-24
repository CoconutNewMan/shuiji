CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  product_name VARCHAR NOT NULL,
  product_description TEXT NOT NULL,
  product_features TEXT NOT NULL,
  budget_daily NUMERIC NOT NULL,
  budget_total NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',  -- 'draft', 'active', 'paused', 'ended'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
