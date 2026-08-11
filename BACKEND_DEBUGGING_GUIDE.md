# Backend Debugging Guide

## Current Issue

The error **"JSON Parse error: Unexpected character: N"** means the backend is returning plain text instead of JSON. Based on your logs and setup, here's what's happening:

### Root Cause
Your Supabase credentials are configured correctly in the `env` file, BUT the database tables have not been created yet in your Supabase project. When the backend tries to query a non-existent table, Supabase returns an error, causing the tRPC request to fail.

### Why This Error
1. **Supabase credentials**: ✅ Correctly set in `env` file
2. **Backend initialization**: ✅ Backend loads and tries to connect to Supabase
3. **Database tables**: ❌ Tables don't exist in Supabase yet (Error code: 42P01)
4. **Result**: The property creation fails because there's no `properties` table to insert into

## Fixes Applied

### 1. **Enhanced API Route Handler** (`app/api/[...route]+api.ts`)
- Added comprehensive error handling
- Added logging to track request flow
- Ensured all errors return JSON responses
- Added environment variable checks on startup

### 2. **Improved Hono Server** (`backend/hono.ts`)
- Enhanced CORS configuration
- Added detailed request/response logging
- Improved error messages in 404 handler
- Added timing metrics for requests
- Better tRPC error handling

### 3. **Better tRPC Client** (`lib/trpc.ts`)
- Added detailed error logging
- Better detection of non-JSON responses
- Specific error messages for 404 errors
- Enhanced debugging information

### 4. **Safer Supabase Client** (`backend/supabase.ts`)
- Created fallback client when credentials are missing
- Better error handling during initialization
- More informative error messages
- Detailed setup instructions

## How to Fix

### Step 1: Create Database Tables

1. **Open your Supabase project dashboard**: https://uuyymkcidtcwfkiqjdrs.supabase.co
2. **Navigate to the SQL Editor** (left sidebar)
3. **Create a new query** and paste the SQL script from `supabase_schema.sql`
4. **Run the script** to create all tables and policies

### Step 2: Verify Connection

After running the SQL script, you can verify the connection by:

1. **Check the logs** when the app starts - you should see:
   ```
   [Supabase] ✅ Tables exist and are accessible
   [Database] ✅ Supabase tables initialized successfully
   ```

2. **Or visit the health check endpoint** in your browser:
   - Go to: `http://YOUR_APP_URL/api/db-status`
   - You should see: `{"status": "ok", "message": "Database connection successful"}`

### Step 3: Test Property Submission

Once tables are created, try submitting a property again. You should see successful logs:
```
[Backend] Inserting property into Supabase
[Backend] Property created in Supabase: [id]
```

## Current Status

**Environment Variables**: ✅ Configured
- `EXPO_PUBLIC_SUPABASE_URL`: https://uuyymkcidtcwfkiqjdrs.supabase.co
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: ✅ SET

**Database Tables**: ❌ Not created yet (Action required)
- You need to run the SQL script in your Supabase SQL Editor
- The script is available in `supabase_schema.sql`

## How to Verify It's Working

### 1. Check Backend Health
The logs will now show detailed information:
```
[API Route] Initializing backend API routes
[API Route] EXPO_PUBLIC_SUPABASE_URL: SET
[API Route] EXPO_PUBLIC_SUPABASE_ANON_KEY: SET
[Hono] Initializing Hono server
[Supabase] ✅ Supabase configured successfully
[Database] ✅ Using Supabase as database
```

### 2. Monitor Property Submission
When you submit a property, you'll see:
```
[PropertySubmission] Starting property submission...
[tRPC] Fetching: /api/trpc/properties.create
[API Route] Incoming request: POST /api/trpc/properties.create
[Backend] Received property create request
[Backend] Using Supabase: true
[Backend] Property created in Supabase: 123456
[PropertySubmission] Property created successfully: 123456
```

### 3. Check for Errors
If there are errors, you'll now see clear messages:
- **404 Error**: "Backend endpoint not found. The tRPC server is not responding..."
- **Connection Error**: "Cannot connect to backend server..."
- **Supabase Error**: "Failed to create property: [specific error]"

## Database Setup

Your Supabase tables should be created using the SQL script in `supabase_schema.sql`. The backend will:

1. **Try to connect** to Supabase on startup
2. **Test the connection** by querying the properties table
3. **Fall back** to local JSON file if Supabase isn't available
4. **Log detailed errors** if tables don't exist or RLS policies are wrong

## Detailed Troubleshooting

### If You See "JSON Parse error: Unexpected character: N"
**Likely cause**: Database tables don't exist
**Solution**: 
1. Check logs for error code `42P01` (relation does not exist)
2. Run the SQL script in Supabase SQL Editor
3. Verify tables are created in Supabase dashboard → Database → Tables

### If You See "JSON Parse error: Unexpected character: <" or "S"
**Likely cause**: Backend is returning HTML error page instead of JSON
**Solution**:
1. Check if the backend route exists and is properly configured
2. Verify tRPC endpoint is accessible: `http://YOUR_APP_URL/api/trpc`
3. Check server logs for detailed error messages

### If You See "Supabase not configured"
**Likely cause**: Environment variables not loaded
**Solution**:
1. Verify `env` file exists and has both credentials
2. Restart the development server completely
3. Check logs show "SUPABASE_URL: SET" and "SUPABASE_KEY: SET"

### If You See "Network request failed"
**Likely cause**: Cannot reach backend server
**Solution**:
1. Verify backend server is running
2. Check `EXPO_PUBLIC_RORK_API_BASE_URL` is set correctly
3. Try accessing health endpoint: `http://YOUR_APP_URL/api/health`

### If Database Operations Fail After Tables Created
**Likely cause**: RLS (Row Level Security) policies are too restrictive
**Solution**:
1. Check Supabase logs in dashboard → Logs → API
2. Verify RLS policies allow public insert/update:
   - Go to Database → Tables → properties → Policies
   - Ensure "Allow public insert" and "Allow public update" policies exist
3. Re-run the SQL script if policies are missing

## Debug Endpoints

We've added helpful endpoints to diagnose issues:

### 1. Health Check
```
GET /api/health
```
Returns basic server status and whether Supabase is configured.

### 2. Database Status Check
```
GET /api/db-status
```
Tests actual database connection and table accessibility.
**Returns**:
- `status: "ok"` - Database is working correctly
- `status: "error"` with `error_code: "42P01"` - Tables don't exist
- `status: "error"` with other codes - Configuration or permission issues

### 3. Root Endpoint
```
GET /
```
Shows API information and available endpoints.

## Understanding the Logs

When you start the app, watch for these key log patterns:

### ✅ Everything Working
```
[Supabase] ✅ Supabase configured successfully
[Supabase] Testing connection to database...
[Supabase] ✅ Tables exist and are accessible
[Database] ✅ Supabase tables initialized successfully
```

### ❌ Tables Not Created (Current Issue)
```
[Supabase] ✅ Supabase configured successfully
[Supabase] Testing connection to database...
[Supabase] ❌ Error accessing tables
[Supabase] Error code: 42P01
[Supabase] ========================================
[Supabase] TABLE DOES NOT EXIST
[Supabase] ========================================
[Database] ❌ Supabase initialization failed
[Database] ACTION REQUIRED: Create database tables
```

### ❌ Credentials Not Set
```
[Supabase] ⚠️ Supabase credentials not configured
[Database] ⚠️ Using local JSON file database (fallback)
```

## Next Steps

1. **Create the database tables** using the SQL script in `supabase_schema.sql`
2. **Restart the development server** after creating tables
3. **Check logs** to confirm tables are accessible
4. **Test property submission** - should now work successfully
5. **Verify in Supabase dashboard** - check Database → Tables → properties for new entries

## Quick Reference: SQL Script Location

The SQL script you need to run is in the file: **`supabase_schema.sql`**

You can also find it printed in the logs when initialization fails, or use the health check endpoint `/api/db-status` to see if tables are missing.
