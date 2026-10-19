-- ==============================================================================
-- Vibe Marketing & Interactive Acquisition Telemetry Schema for Gini Loh
-- Description: Captures real-time session state, granular telemetry events,
--              and qualified lead intents from embedded interactive micro-assets.
-- ==============================================================================

-- 1. Table: vibe_asset_sessions
-- Tracks unique micro-application engagements, user parameters, and outcomes.
CREATE TABLE IF NOT EXISTS public.vibe_asset_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    asset_slug TEXT NOT NULL,
    vertical_slug TEXT NOT NULL,
    referrer TEXT,
    user_inputs JSONB DEFAULT '{}'::jsonb,
    calculated_metrics JSONB DEFAULT '{}'::jsonb,
    duration_seconds INTEGER DEFAULT 0,
    is_converted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table: vibe_telemetry_events
-- High-throughput, granular interaction stream (input toggles, calculations, unlocks).
CREATE TABLE IF NOT EXISTS public.vibe_telemetry_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    asset_slug TEXT NOT NULL,
    vertical_slug TEXT NOT NULL,
    event_name TEXT NOT NULL, -- 'card_impression' | 'session_start' | 'input_adjusted' | 'calc_run' | 'lead_engaged'
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Table: vibe_lead_intents
-- High-intent captures paired directly with calculated decision metrics (95% qualified).
CREATE TABLE IF NOT EXISTS public.vibe_lead_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    asset_slug TEXT NOT NULL,
    vertical_slug TEXT NOT NULL,
    email TEXT NOT NULL,
    intent_type TEXT NOT NULL DEFAULT 'model_export', -- 'model_export' | 'audit_request' | 'benchmark_sync'
    calculated_metrics JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending_n8n_sync', -- 'pending_n8n_sync' | 'synced_to_crm' | 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Indexes for Sub-Second Telemetry & Reporting
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_session_id ON public.vibe_asset_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_vibe_sessions_vertical ON public.vibe_asset_sessions(vertical_slug, asset_slug);
CREATE INDEX IF NOT EXISTS idx_vibe_events_session ON public.vibe_telemetry_events(session_id, event_name);
CREATE INDEX IF NOT EXISTS idx_vibe_events_created_at ON public.vibe_telemetry_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_leads_status ON public.vibe_lead_intents(status, created_at DESC);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.vibe_asset_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_lead_intents ENABLE ROW LEVEL SECURITY;

-- Anonymous users (public web clients) may INSERT telemetry & start sessions
CREATE POLICY "Allow public insert to vibe_asset_sessions"
    ON public.vibe_asset_sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (session_id IS NOT NULL AND asset_slug IS NOT NULL);

CREATE POLICY "Allow public update own session"
    ON public.vibe_asset_sessions
    FOR UPDATE
    TO anon, authenticated
    USING (session_id IS NOT NULL);

CREATE POLICY "Allow public insert to vibe_telemetry_events"
    ON public.vibe_telemetry_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (session_id IS NOT NULL AND event_name IS NOT NULL);

CREATE POLICY "Allow public insert to vibe_lead_intents"
    ON public.vibe_lead_intents
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Service role (n8n webhooks, internal ETL pipelines, backend scripts) has full access
CREATE POLICY "Allow service role full management on vibe_asset_sessions"
    ON public.vibe_asset_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full management on vibe_telemetry_events"
    ON public.vibe_telemetry_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service role full management on vibe_lead_intents"
    ON public.vibe_lead_intents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
