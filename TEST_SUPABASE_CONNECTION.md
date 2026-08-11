# Test Supabase Connection

## ✅ Your Environment Variables Are Set

The following environment variables are configured correctly:

```
EXPO_PUBLIC_SUPABASE_URL=https://uuyymkcidtcwfkiqjdrs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 🔍 How to Test the Connection

### Method 1: Check Backend Startup Logs

When you start your app, look for these logs in the console:

**✅ Good Signs:**
```
[Supabase] ✅ Supabase configured successfully
[Database] ✅ Using Supabase as database
[Database] ✅ Supabase tables initialized successfully
```

**❌ Bad Signs:**
```
[Supabase] ❌ Error accessing tables: relation "properties" does not exist
[Database] ❌ Supabase initialization failed: relation "properties" does not exist
```

### Method 2: Use the Test Connection Endpoint

I've added a test endpoint you can access directly in your browser or with curl:

**Open in browser:**
```
http://localhost:[PORT]/api/test-connection
```

Or if you're using the tunnel URL, replace localhost with your tunnel domain.

**Response if tables exist:**
```json
{
  "status": "ok",
  "message": "All tables are accessible",
  "timestamp": "...",
  "environment": {
    "supabase_url_set": true,
    "supabase_key_set": true
  },
  "tests": {
    "properties": { "accessible": true, "error": null, "row_count": 0 },
    "users": { "accessible": true, "error": null, "row_count": 0 },
    "activities": { "accessible": true, "error": null, "row_count": 0 }
  }
}
```

**Response if tables DON'T exist:**
```json
{
  "status": "error",
  "message": "Some tables are not accessible. Please run the SQL script to create them.",
  "tests": {
    "properties": {
      "accessible": false,
      "error": "relation \"properties\" does not exist",
      "error_code": "42P01"
    }
  }
}
```

## 🛠️ Fix: Create the Database Tables

If tables don't exist (error code `42P01`), follow these steps:

### Step 1: Go to Supabase SQL Editor

1. Open: https://supabase.com/dashboard/project/uuyymkcidtcwfkiqjdrs
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the SQL Script

Copy the entire contents of `supabase_schema.sql` and paste it into the editor.

Click **Run** or press `Ctrl/Cmd + Enter`.

### Step 3: Verify Tables Were Created

Go to "Table Editor" in the left sidebar. You should see:
- ✅ properties
- ✅ users
- ✅ activities

### Step 4: Test Again

Restart your app or visit `/api/test-connection` again. You should now see all tables as accessible!

## 🎯 What Each Error Code Means

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `42P01` | Table does not exist | Run the SQL script to create tables |
| `42501` | Permission denied | Check RLS policies are created |
| `PGRST301` | JWT expired or invalid | Check your anon key is correct |
| Connection timeout | Network issue | Check internet connection |

## 🔧 Quick Fix Commands

### Check if Supabase is accessible
```bash
curl https://uuyymkcidtcwfkiqjdrs.supabase.co
```
Should return: "ok" or Supabase welcome message

### Check if your anon key works
Try making a simple query using your browser dev tools console:
```javascript
fetch('https://uuyymkcidtcwfkiqjdrs.supabase.co/rest/v1/properties?limit=1', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
  }
}).then(r => r.json()).then(console.log)
```

## ✨ Once Everything Works

You'll be able to:
- ✅ Submit properties through the app
- ✅ View them in Supabase dashboard
- ✅ Approve/reject submissions
- ✅ Track activities
- ✅ All data persists permanently

## 🆘 Still Having Issues?

1. **Restart your development server completely**
2. **Clear your browser/app cache**
3. **Check Supabase project isn't paused** (free tier pauses after inactivity)
4. **Verify the SQL script ran successfully** (check Table Editor)
5. **Look at backend logs** for detailed error messages

The most common issue is simply that the SQL script hasn't been run yet to create the tables!
