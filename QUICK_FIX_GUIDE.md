# Quick Fix Guide: Database Setup

## The Problem

You're getting the error: **"JSON Parse error: Unexpected character: N"**

**This means**: Your Supabase database tables haven't been created yet.

## The Solution (3 Simple Steps)

### Step 1: Go to Supabase

Open your Supabase project:
https://uuyymkcidtcwfkiqjdrs.supabase.co

### Step 2: Run the SQL Script

1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase_schema.sql` in this project
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** button

You should see: "Success. No rows returned"

### Step 3: Restart Your App

1. Stop the development server
2. Start it again
3. Try submitting a property

## How to Verify It Worked

After running the SQL script, check the console logs. You should see:

```
[Supabase] ✅ Tables exist and are accessible
[Database] ✅ Supabase tables initialized successfully
```

## Still Having Issues?

1. **Check your Supabase dashboard**:
   - Go to: Database → Tables
   - You should see: `properties`, `users`, `activities` tables

2. **Check the database status endpoint**:
   - Visit: `http://YOUR_APP_URL/api/db-status`
   - You should see: `{"status": "ok"}`

3. **Check the detailed logs**:
   - Look for error code `42P01` - means tables don't exist
   - Look for RLS policy errors - means permissions issue

## What the SQL Script Does

The script creates 3 tables:
- `properties` - Stores all property listings
- `users` - Stores user accounts
- `activities` - Stores activity logs

It also sets up Row Level Security (RLS) policies to allow public access for development.

## Need More Help?

Check `BACKEND_DEBUGGING_GUIDE.md` for detailed troubleshooting.
