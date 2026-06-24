CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  headline VARCHAR NOT NULL,
  body_text TEXT NOT NULL,
  cta VARCHAR NOT NULL,
  image_url VARCHAR,
  video_url VARCHAR,
  landing_url VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active',  -- 'active', 'paused', 'ended'
  style VARCHAR NOT NULL,  -- '销售驱动', '教育科普', '娱乐感性'
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ads_campaign ON ads(campaign_id);
CREATE INDEX idx_ads_status ON ads(status);
