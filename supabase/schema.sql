-- ============================================================
-- AI Social Manager — Supabase Schema
-- Run this in Supabase dashboard → SQL Editor → Run
-- ============================================================

-- Enable pgvector for RAG embeddings
create extension if not exists vector;

-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_code text unique not null,
  brand_name text not null,
  industry text not null,
  business_type text default 'B2C',
  preferred_channel text default 'telegram',
  telegram_chat_id text unique,
  zalo_user_id text,
  status text default 'onboarding', -- onboarding | active | paused | churned
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BRAND PROFILES
-- ============================================================
create table if not exists brand_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  version integer default 1,
  profile_data jsonb not null default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_brand_profiles_client_id on brand_profiles(client_id);
create index if not exists idx_brand_profiles_active on brand_profiles(client_id, is_active);

-- ============================================================
-- CONVERSATION HISTORY (Module 1 Brief Bot)
-- ============================================================
create table if not exists conversation_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  channel text not null default 'telegram',
  module text not null default 'brief_bot',
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz default now()
);

create index if not exists idx_conv_history_client on conversation_history(client_id, module, created_at);

-- ============================================================
-- CONTENT QUEUE (Module 2)
-- ============================================================
create table if not exists content_queue (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  post_code text unique not null,
  platforms text[] not null default '{}',
  content_type text not null default 'regular', -- regular | tip | promo | viral | story | motivation | seasonal
  copy_vi text,
  copy_en text,
  hook_alternatives jsonb default '[]',
  visual_brief text,
  status text default 'draft', -- draft | review_pending | approved | rejected | scheduled | published
  rejection_reason text,
  scheduled_at timestamptz,
  auto_approve_at timestamptz,
  ayrshare_id text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_content_queue_client on content_queue(client_id, status);
create index if not exists idx_content_queue_scheduled on content_queue(status, scheduled_at);

-- ============================================================
-- VISUAL ASSETS (Module 3)
-- ============================================================
create table if not exists visual_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references content_queue(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  asset_type text not null default 'image', -- image | video
  visual_type text, -- static_image | video_clip | carousel | story | remotion
  image_url text,
  storage_url text,
  image_prompt jsonb,
  remotion_brief jsonb,
  dimensions text,
  moderation_flag boolean default false,
  moderation_reason text,
  status text default 'pending', -- pending | ready | pending_moderation | pending_render | error
  created_at timestamptz default now()
);

create index if not exists idx_visual_assets_post on visual_assets(post_id);
create index if not exists idx_visual_assets_client on visual_assets(client_id);

-- ============================================================
-- RAG CHUNKS (pgvector embeddings)
-- ============================================================
create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  chunk_type text not null, -- brand_profile | past_content | feedback | industry_insight
  content text not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_rag_chunks_client on rag_chunks(client_id, chunk_type);

-- Vector similarity search function (used by RAG retriever)
create or replace function match_rag_chunks(
  query_embedding vector(1536),
  match_client_id uuid,
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  chunk_type text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id, content, chunk_type, metadata,
    1 - (embedding <=> query_embedding) as similarity
  from rag_chunks
  where client_id = match_client_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- AI LOGS (token usage + cost tracking)
-- ============================================================
create table if not exists ai_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  module text not null,
  model text not null default 'claude-sonnet-4-6',
  input_tokens integer default 0,
  output_tokens integer default 0,
  cost_usd numeric(10,6) default 0,
  latency_ms integer,
  success boolean default true,
  error_message text,
  created_at timestamptz default now()
);

create index if not exists idx_ai_logs_client on ai_logs(client_id, created_at);
create index if not exists idx_ai_logs_module on ai_logs(module, created_at);

-- ============================================================
-- ANALYTICS CACHE (Facebook/Instagram raw data)
-- ============================================================
create table if not exists analytics_cache (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  platform text not null, -- facebook | instagram | tiktok
  period_start date not null,
  period_end date not null,
  data jsonb not null default '{}',
  fetched_at timestamptz default now()
);

create index if not exists idx_analytics_client on analytics_cache(client_id, platform, period_start);

-- ============================================================
-- REPORTS (Module 5 weekly reports)
-- ============================================================
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  normalized_data jsonb,
  performance_analysis jsonb,
  recommendations jsonb,
  report_text text,
  language text default 'vi',
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_reports_client on reports(client_id, period_start desc);

-- ============================================================
-- ROW LEVEL SECURITY (basic — tighten later)
-- ============================================================
alter table clients enable row level security;
alter table brand_profiles enable row level security;
alter table conversation_history enable row level security;
alter table content_queue enable row level security;
alter table visual_assets enable row level security;
alter table rag_chunks enable row level security;
alter table ai_logs enable row level security;
alter table analytics_cache enable row level security;
alter table reports enable row level security;

-- Service role bypasses RLS (used by backend)
-- Anon role has no access (dashboard uses service role server-side)
-- If you add auth later, add policies per table

-- ============================================================
-- UPDATED_AT trigger helper
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger content_queue_updated_at before update on content_queue
  for each row execute function update_updated_at();
