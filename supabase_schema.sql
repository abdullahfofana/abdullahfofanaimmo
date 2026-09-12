-- =============================================================================
-- IMMOCI — SUPABASE MASTER DATABASE SCHEMA & SECURITY POLICIES
-- Project: ImmoCI (Côte d'Ivoire Real Estate Platform)
-- =============================================================================

-- ─── 1. PROPERTIES TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'villa', 'land', 'commercial')),
  status TEXT NOT NULL CHECK (status IN ('sale', 'rent')),
  bedrooms INTEGER,
  bathrooms INTEGER,
  area NUMERIC NOT NULL,
  location JSONB NOT NULL,
  photos JSONB NOT NULL,
  video TEXT,
  document TEXT,
  features JSONB NOT NULL,
  agent JSONB NOT NULL,
  payment JSONB NOT NULL,
  "submissionStatus" TEXT NOT NULL DEFAULT 'pending',
  "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "rejectionReason" TEXT,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if properties table was previously created
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "submissionStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;


-- ─── 2. USERS TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin', 'agent', 'landlord', 'renter', 'support')),
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── 3. ACTIVITIES TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  "user" TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ─── 4. CONVERSATIONS TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  property_data JSONB,
  buyer_id TEXT NOT NULL,
  buyer_data JSONB NOT NULL,
  agent_id TEXT NOT NULL,
  agent_data JSONB NOT NULL,
  last_message TEXT DEFAULT '',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count_buyer INTEGER DEFAULT 0,
  unread_count_agent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  case_status TEXT DEFAULT 'Open',
  department TEXT DEFAULT 'Customer Care',
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS case_status TEXT DEFAULT 'Open';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Customer Care';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- ─── 5. MESSAGES TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'agent', 'admin', 'support')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;


-- ─── 6. USER FAVORITES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

-- ─── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_submission_status ON properties("submissionStatus");
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_property ON conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_property ON user_favorites(property_id);

-- ─── AUTOMATIC UPDATED_AT TRIGGER ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_properties ON properties;
CREATE TRIGGER set_updated_at_properties
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_users ON users;
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_conversations ON conversations;
CREATE TRIGGER set_updated_at_conversations
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ─── ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES ────────────────────────────
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- ─── CLEAN SLATE: DROP ALL PREVIOUS POLICIES ──────────────────────────────────
DROP POLICY IF EXISTS allow_public_read_properties ON properties;
DROP POLICY IF EXISTS allow_public_insert_properties ON properties;
DROP POLICY IF EXISTS allow_public_update_properties ON properties;
DROP POLICY IF EXISTS allow_public_delete_properties ON properties;
DROP POLICY IF EXISTS properties_public_read ON properties;
DROP POLICY IF EXISTS properties_auth_insert ON properties;
DROP POLICY IF EXISTS properties_anon_insert ON properties;
DROP POLICY IF EXISTS properties_admin_update ON properties;
DROP POLICY IF EXISTS properties_staff_or_admin_update ON properties;
DROP POLICY IF EXISTS properties_admin_delete ON properties;

DROP POLICY IF EXISTS allow_public_read_users ON users;
DROP POLICY IF EXISTS allow_public_insert_users ON users;
DROP POLICY IF EXISTS allow_public_update_users ON users;
DROP POLICY IF EXISTS allow_public_delete_users ON users;
DROP POLICY IF EXISTS users_auth_read ON users;
DROP POLICY IF EXISTS users_self_insert ON users;
DROP POLICY IF EXISTS users_self_or_admin_update ON users;
DROP POLICY IF EXISTS users_admin_delete ON users;

DROP POLICY IF EXISTS allow_public_read_activities ON activities;
DROP POLICY IF EXISTS allow_public_insert_activities ON activities;
DROP POLICY IF EXISTS activities_auth_read ON activities;
DROP POLICY IF EXISTS activities_auth_insert ON activities;
DROP POLICY IF EXISTS activities_anon_insert ON activities;

DROP POLICY IF EXISTS conversations_public_access ON conversations;
DROP POLICY IF EXISTS conversations_participant_access ON conversations;

DROP POLICY IF EXISTS messages_public_access ON messages;
DROP POLICY IF EXISTS messages_participant_access ON messages;

DROP POLICY IF EXISTS user_favorites_own_access ON user_favorites;

-- ─── 7. POLICIES: PROPERTIES ───────────────────────────────────────────────────
-- Public can browse and read all properties
CREATE POLICY properties_public_read
  ON properties
  FOR SELECT
  USING (true);

-- Only authenticated users (agents / landlords / admins) can post properties
CREATE POLICY properties_auth_insert
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update any property; agents/landlords can update their own
CREATE POLICY properties_staff_or_admin_update
  ON properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin')
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()::text AND u.role IN ('agent', 'landlord')
      )
      AND (agent->>'phone') = (
        SELECT phone FROM users WHERE id = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin', 'agent', 'landlord')
    )
  );

-- Only admins can delete a property
CREATE POLICY properties_admin_delete
  ON properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- ─── 8. POLICIES: USERS ────────────────────────────────────────────────────────
-- Authenticated users can read profiles (needed for agent/seller contact)
CREATE POLICY users_auth_read
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- New authenticated users can insert their own profile
CREATE POLICY users_self_insert
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- Users can update their own profile; admins can update any profile
CREATE POLICY users_self_or_admin_update
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid()::text = id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin')
    )
  );

-- Only admins can delete user accounts
CREATE POLICY users_admin_delete
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin')
    )
  );

-- ─── 9. POLICIES: ACTIVITIES ───────────────────────────────────────────────────
-- Authenticated users can view activities
CREATE POLICY activities_auth_read
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert activity events
CREATE POLICY activities_auth_insert
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── 10. POLICIES: CONVERSATIONS & MESSAGES ────────────────────────────────────
-- Conversations: participants (buyer/agent), company staff, or anonymous inquiries
DROP POLICY IF EXISTS conversations_participant_access ON conversations;
CREATE POLICY conversations_participant_access
  ON conversations
  FOR ALL
  TO authenticated, anon
  USING (
    auth.uid() IS NULL
    OR auth.uid()::text = buyer_id
    OR auth.uid()::text = agent_id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin', 'agent', 'landlord', 'support')
    )
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR auth.uid()::text = buyer_id
    OR auth.uid()::text = agent_id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin', 'agent', 'landlord', 'support')
    )
  );

-- Messages: participants or company staff, allowing guest leads to submit inquiries
DROP POLICY IF EXISTS messages_participant_access ON messages;
CREATE POLICY messages_participant_access
  ON messages
  FOR ALL
  TO authenticated, anon
  USING (
    auth.uid() IS NULL
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (
          auth.uid()::text = c.buyer_id
          OR auth.uid()::text = c.agent_id
          OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin', 'agent', 'landlord', 'support')
          )
        )
    )
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR (
      auth.uid()::text = sender_id
      AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
          AND (
            auth.uid()::text = c.buyer_id
            OR auth.uid()::text = c.agent_id
            OR EXISTS (
              SELECT 1 FROM users u
              WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin', 'agent', 'landlord', 'support')
            )
          )
      )
    )
  );

-- ─── 11. POLICIES: USER FAVORITES ──────────────────────────────────────────────
-- Each user has private access to their own favorites
CREATE POLICY user_favorites_own_access
  ON user_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ─── 12. SUPABASE REALTIME REPLICATION SETUP ──────────────────────────────────
-- Enable full replica identity so updates (read receipts, unread counts) emit complete row data
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

