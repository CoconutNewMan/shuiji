CREATE TABLE ai_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  video_input_id UUID NOT NULL REFERENCES video_inputs(id) ON DELETE CASCADE,
  style VARCHAR NOT NULL,  -- '销售驱动', '教育科普', '娱乐感性'
  headline VARCHAR NOT NULL,
  body_text TEXT NOT NULL,
  cta_suggestions JSONB,  -- ["Button 1", "Button 2", "Button 3"]
  image_suggestion VARCHAR,  -- Frame number or URL
  used_in_ad_id UUID REFERENCES ads(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, video_input_id, style)
);

CREATE INDEX idx_ai_copies_campaign ON ai_copies(campaign_id);
CREATE INDEX idx_ai_copies_video ON ai_copies(video_input_id);
