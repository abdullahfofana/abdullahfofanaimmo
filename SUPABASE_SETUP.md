# Supabase Integration Setup Guide

## Overview
Your app now supports **Supabase** as the primary database with automatic fallback to local JSON file storage if Supabase is not configured.

## Current Status
✅ **Backend Integration Complete**
- Supabase client installed and configured
- All API routes updated (properties, users, activities)
- Automatic fallback to local JSON database
- Full CRUD operations supported

## The Issue You Were Facing

The error "JSON Parse error: Unexpected character: S" occurred because:
1. The backend server was returning HTML or plain text instead of JSON
2. This typically happens when the backend is not running properly or encounters an error
3. With Supabase, data will be stored in a cloud database instead of a local file, making it more reliable

## How to Connect Supabase

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: Choose any name (e.g., "Property App")
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose the closest region to your users
5. Click **"Create new project"** and wait 1-2 minutes for setup

### Step 2: Get Your Supabase Credentials
1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click on **"API"** in the Configuration section
3. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

### Step 3: Create Database Tables
1. In your Supabase project, click **"SQL Editor"** in the sidebar
2. Click **"New Query"**
3. Copy and paste the following SQL script:

```sql
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
  "submissionStatus" TEXT NOT NULL DEFAULT 'pending' CHECK ("submissionStatus" IN ('pending', 'approved', 'rejected')),
  "submittedAt" TEXT NOT NULL,
  "reviewedAt" TEXT,
  "rejectionReason" TEXT,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'landlord', 'renter')),
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  "user" TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties("submissionStatus");
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_submitted_at ON properties("submittedAt");
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Allow public insert on properties" ON properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on properties" ON properties FOR UPDATE USING (true);
CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on users" ON users FOR DELETE USING (true);
CREATE POLICY "Allow public read access on activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert on activities" ON activities FOR INSERT WITH CHECK (true);
```

4. Click **"Run"** to execute the script
5. You should see a success message: "Success. No rows returned"

### Step 4: Configure Your App
1. Open the `env` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-actual-key-here
```

### Step 5: Restart Your Development Server
1. Stop your current development server (Ctrl+C or Cmd+C)
2. Restart it with:
   ```bash
   npm start
   # or
   bun start
   ```

## Verification

After setup, check the console logs. You should see:
```
[Database] ✅ Using Supabase as database
[Supabase] Checking database tables...
[Supabase] ✅ Tables already exist and are accessible
```

When you submit a property, you should see:
```
[Backend] Using Supabase: true
[Backend] Inserting property into Supabase
[Backend] Property created in Supabase: 1234567890
```

## Testing Your Integration

1. **Submit a Test Property**: Go to the "Add Property" page and submit a property
2. **Check Supabase**: In your Supabase project, go to **Table Editor** → **properties** to see the data
3. **Check Admin Dashboard**: The property should appear in your admin dashboard
4. **Verify Users**: In the admin dashboard, create/edit users and check the **users** table in Supabase

## Troubleshooting

### Issue: "Supabase credentials not configured"
**Solution**: Make sure you've added `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your `env` file and restarted the server.

### Issue: "Failed to create property: relation 'properties' does not exist"
**Solution**: You need to run the SQL script from Step 3 to create the database tables.

### Issue: "Row Level Security policy violation"
**Solution**: Make sure you ran ALL the SQL from Step 3, including the policies section.

### Issue: Still getting "JSON Parse error"
**Solution**: 
1. Check if EXPO_PUBLIC_RORK_API_BASE_URL is set correctly (it can be empty for local dev)
2. Make sure the backend server is running
3. Check the console for error messages
4. If Supabase is configured correctly, the app will use it automatically

## Fallback Mode

If Supabase is NOT configured (credentials missing), the app will:
- Automatically use local JSON file storage (`db.json`)
- Show this log: `[Database] Using local JSON file database (fallback)`
- Continue working without cloud storage

## Benefits of Using Supabase

✅ **Persistent Data**: Data is stored in the cloud and won't be lost when restarting the server
✅ **Real-time Sync**: Multiple users can access and update data simultaneously
✅ **Scalability**: Can handle thousands of properties and users
✅ **Reliability**: No more "JSON Parse error" issues
✅ **Admin Dashboard Integration**: All changes reflect immediately in the app
✅ **Backup & Recovery**: Supabase automatically backs up your data

## Next Steps

Once Supabase is set up:
1. All property submissions will be saved to Supabase
2. Admin dashboard will show real-time data from Supabase
3. Users can be managed from the admin panel
4. All activities are tracked in the database

## Support

If you encounter any issues:
1. Check the browser/terminal console for error messages
2. Verify your Supabase credentials are correct
3. Make sure all database tables were created successfully
4. Check that Row Level Security policies are in place

---

**Current Database Mode**: Check your console logs to see if you're using Supabase or local fallback.
