-- =============================================================================
-- ImmoCI Enterprise RBAC & Security Audit Log Migration
-- File: supabase/migrations/20260918_audit_logs_rbac.sql
-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)
-- =============================================================================

-- ── 1. Create audit_logs Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    actor JSONB NOT NULL,
    target JSONB NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log indices for instant search & analytical queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs (severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs USING GIN ((actor -> 'id'));

-- ── 2. Create staff_accounts Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Agent Commercial',
    department TEXT NOT NULL DEFAULT 'Commercial & Ventes',
    status TEXT NOT NULL DEFAULT 'active',
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    avatar TEXT
);

CREATE INDEX IF NOT EXISTS idx_staff_accounts_email ON public.staff_accounts (email);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_role ON public.staff_accounts (role);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_status ON public.staff_accounts (status);

-- ── 3. Row Level Security (RLS) ──────────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypass RLS for server-side trusted operations)
CREATE POLICY "service_role_all_audit_logs"
    ON public.audit_logs FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_all_staff_accounts"
    ON public.staff_accounts FOR ALL
    USING (true)
    WITH CHECK (true);

-- Authenticated Users: Insert allowed for system event logging
CREATE POLICY "authenticated_insert_audit_logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Authenticated Users: Only Admins / Super Admins can view audit logs
CREATE POLICY "admins_select_audit_logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Staff Accounts: Admins have full access
CREATE POLICY "admins_manage_staff_accounts"
    ON public.staff_accounts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Staff Accounts: Staff can read their own profile
CREATE POLICY "staff_read_own_profile"
    ON public.staff_accounts FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid())
    );

-- ── 4. Seed Root Administrator in staff_accounts ─────────────────────────────
INSERT INTO public.staff_accounts (
    id, name, email, phone, role, department, status, permissions, created_at, last_active
) VALUES (
    'staff-root-001',
    'Abdullah Fofana',
    'abm.fofana@gmail.com',
    '+225 07 00 00 00 01',
    'Super Admin',
    'Platform Administration',
    'active',
    '["analytics.view","analytics.export","properties.view","properties.create","properties.edit","properties.delete","properties.approve","properties.reject","documents.view","documents.verify","documents.reject","users.view","users.edit","users.suspend","users.delete","staff.view","staff.create","staff.edit_roles","staff.edit_permissions","staff.suspend","staff.delete","reports.view","reports.export","integrations.view","integrations.manage","settings.view","settings.edit_general","settings.edit_security","support.view_tickets","support.reply_tickets","support.assign_tickets","audit.view","audit.export"]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'Super Admin',
    department = 'Platform Administration',
    permissions = EXCLUDED.permissions;
