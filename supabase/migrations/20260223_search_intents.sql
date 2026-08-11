-- Migration: Create search_intents and match_notifications tables
-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)
-- ─── search_intents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.search_intents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    criteria JSONB NOT NULL DEFAULT '{}',
    created_at BIGINT NOT NULL DEFAULT (
        EXTRACT(
            EPOCH
            FROM NOW()
        ) * 1000
    )::BIGINT
);
CREATE INDEX IF NOT EXISTS idx_search_intents_user_id ON public.search_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_search_intents_created_at ON public.search_intents(created_at DESC);
-- ─── match_notifications ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    property_title TEXT NOT NULL,
    match_reason TEXT,
    timestamp BIGINT NOT NULL DEFAULT (
        EXTRACT(
            EPOCH
            FROM NOW()
        ) * 1000
    )::BIGINT,
    read BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_match_notifications_user_id ON public.match_notifications(user_id, read);
-- ─── Row Level Security (RLS) ──────────────────────────────────────────────
ALTER TABLE public.search_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_notifications ENABLE ROW LEVEL SECURITY;
-- Allow service role (backend) full access
CREATE POLICY "service_role_all_search_intents" ON public.search_intents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_match_notifications" ON public.match_notifications FOR ALL USING (true) WITH CHECK (true);