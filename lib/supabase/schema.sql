-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code TEXT UNIQUE NOT NULL,
  brand_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  business_type TEXT CHECK (business_type IN ('B2C','B2B','Both')),
  contact_name TEXT,
  contact_phone TEXT,
  preferred_channel TEXT CHECK (preferred_channel IN ('telegram','zalo','both')),
  telegram_chat_id TEXT,
  zalo_user_id TEXT,
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding','active','paused','churned')),
  plan TEXT DEFAULT 'pilot' CHECK (plan IN ('pilot','starter','growth','agency')),
  setup_fee_paid BOOLEAN DEFAULT false,
  monthly_fee_paid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  profile_data JSONB NOT NULL,
  embedding VECTOR(1536),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, version)
);
CREATE INDEX ON brand_profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  post_code TEXT UNIQUE NOT NULL,
  platforms TEXT[] NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('regular','promo','story','tip','viral','seasonal')),
  copy_vi TEXT,
  copy_en TEXT,
  hook_alternatives JSONB,
  visual_brief TEXT,
  best_post_time TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','visual_pending','review_pending','approved','scheduled','published','failed','rejected')),
  ayrshare_post_id TEXT,
  rejection_reason TEXT,
  auto_approve_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE visual_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES content_queue(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image','video','carousel')),
  source_type TEXT CHECK (source_type IN ('gpt_image','unsplash','pexels','remotion','client_upload')),
  template_id TEXT,
  image_prompt TEXT,
  storage_url TEXT,
  cdn_url TEXT,
  file_size_kb INTEGER,
  dimensions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','rendering','ready','approved','rejected')),
  moderation_flag BOOLEAN DEFAULT false,
  moderation_note TEXT,
  rendered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram','zalo')),
  module TEXT NOT NULL CHECK (module IN ('brief_bot','content_request','report','general')),
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  message TEXT NOT NULL,
  message_metadata JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_conv_client ON conversation_history(client_id, created_at DESC);

CREATE TABLE rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  chunk_type TEXT NOT NULL CHECK (chunk_type IN ('brand_profile','content_history','performance_data','client_instruction','industry_knowledge')),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_rag_client ON rag_chunks(client_id, chunk_type);

CREATE TABLE posting_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  post_id UUID REFERENCES content_queue(id),
  platform TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  ayrshare_payload JSONB,
  ayrshare_response JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','published','failed')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  period_type TEXT CHECK (period_type IN ('week','month')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  raw_data JSONB NOT NULL,
  summary_text_vi TEXT,
  summary_text_en TEXT,
  sent_via TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  module TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd NUMERIC(10,6),
  latency_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON clients FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON brand_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON content_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON visual_assets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON conversation_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON rag_chunks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON posting_schedule FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON analytics_cache FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON ai_logs FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION match_rag_chunks(
  client_id_param UUID,
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 8
)
RETURNS TABLE (id UUID, chunk_type TEXT, content TEXT, metadata JSONB, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT id, chunk_type, content, metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM rag_chunks
  WHERE client_id = client_id_param AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
