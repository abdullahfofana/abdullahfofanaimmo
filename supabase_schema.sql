-- Create properties table
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
  submissionStatus TEXT NOT NULL DEFAULT 'pending' CHECK (submissionStatus IN ('pending', 'approved', 'rejected')),
  submittedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewedAt TIMESTAMP WITH TIME ZONE,
  rejectionReason TEXT,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'landlord', 'renter')),
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  "user" TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure updated_at is maintained
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

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ─── Drop ALL existing policies for a clean slate ──────────────────────────────
DROP POLICY IF EXISTS allow_public_read_properties ON properties;
DROP POLICY IF EXISTS allow_public_insert_properties ON properties;
DROP POLICY IF EXISTS allow_public_update_properties ON properties;
DROP POLICY IF EXISTS allow_public_delete_properties ON properties;
DROP POLICY IF EXISTS allow_public_read_users ON users;
DROP POLICY IF EXISTS allow_public_insert_users ON users;
DROP POLICY IF EXISTS allow_public_update_users ON users;
DROP POLICY IF EXISTS allow_public_delete_users ON users;
DROP POLICY IF EXISTS allow_public_read_activities ON activities;
DROP POLICY IF EXISTS allow_public_insert_activities ON activities;
DROP POLICY IF EXISTS properties_public_read ON properties;
DROP POLICY IF EXISTS properties_auth_insert ON properties;
DROP POLICY IF EXISTS properties_anon_insert ON properties;
DROP POLICY IF EXISTS properties_admin_update ON properties;
DROP POLICY IF EXISTS properties_admin_delete ON properties;
DROP POLICY IF EXISTS users_auth_read ON users;
DROP POLICY IF EXISTS users_self_insert ON users;
DROP POLICY IF EXISTS users_self_or_admin_update ON users;
DROP POLICY IF EXISTS users_admin_delete ON users;
DROP POLICY IF EXISTS activities_auth_read ON activities;
DROP POLICY IF EXISTS activities_auth_insert ON activities;
DROP POLICY IF EXISTS activities_anon_insert ON activities;

-- ─── PROPERTIES ────────────────────────────────────────────────────────────────
-- Anyone (including anon) can read all properties
CREATE POLICY properties_public_read
  ON properties
  FOR SELECT
  USING (true);

-- Anyone (including anonymous guests) can submit a new property listing
CREATE POLICY properties_anon_insert
  ON properties
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can update a property status (approve / reject / edit)
CREATE POLICY properties_admin_update
  ON properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
        AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
        AND users.role = 'admin'
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
        AND users.role = 'admin'
    )
  );

-- ─── USERS ─────────────────────────────────────────────────────────────────────
-- Authenticated users can read user profiles (needed for agent lookup)
CREATE POLICY users_auth_read
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- New users can insert their own profile on first sign-up
CREATE POLICY users_self_insert
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- A user can update only their own profile; admins can update any profile
CREATE POLICY users_self_or_admin_update
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid()::text = id
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::text AND u.role = 'admin'
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
      WHERE u.id = auth.uid()::text AND u.role = 'admin'
    )
  );

-- ─── ACTIVITIES ────────────────────────────────────────────────────────────────
-- Authenticated users can read the activity log
CREATE POLICY activities_auth_read
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can insert activity events (system-generated from client)
CREATE POLICY activities_anon_insert
  ON activities
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

