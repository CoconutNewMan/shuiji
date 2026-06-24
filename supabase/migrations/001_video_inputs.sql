CREATE TABLE video_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  video_url VARCHAR,
  video_file_url VARCHAR,  -- S3 URL after upload
  platform VARCHAR NOT NULL,  -- 'tiktok', 'youtube', 'instagram', 'xiaohongshu', 'douyin'
  extracted_text TEXT,
  extraction_status VARCHAR DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  extraction_error_message TEXT,
  extracted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, video_url)
);

CREATE INDEX idx_video_inputs_campaign ON video_inputs(campaign_id);
CREATE INDEX idx_video_inputs_status ON video_inputs(extraction_status);
