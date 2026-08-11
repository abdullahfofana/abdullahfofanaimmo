# Supabase Connection Guide

## ✅ Step 1: Environment Variables (COMPLETED)

Your environment variables are already set up correctly in the `env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://uuyymkcidtcwfkiqjdrs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔄 Step 2: Create Database Tables in Supabase

### Option A: Using Supabase Dashboard SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard/project/uuyymkcidtcwfkiqjdrs

2. Click on **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy the entire contents of `supabase_schema.sql` file

5. Paste it into the SQL Editor

6. Click **Run** or press `Ctrl/Cmd + Enter`

7. You should see success messages for:
   - Created 3 tables (properties, users, activities)
   - Created 6 indexes
   - Enabled RLS on all tables
   - Created 10 policies

### Option B: Check if Tables Already Exist

1. Go to **Table Editor** in the left sidebar

2. You should see three tables:
   - `properties`
   - `users`
   - `activities`

3. If you see these tables, you're good to go!

### ⚠️ If You Get Errors

**Error: "relation already exists"**
- This is fine! It means your tables are already created. You can ignore this error.

**Error: "policy already exists"**
- The script now handles this automatically by dropping existing policies first.

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Try running the script in chunks (tables first, then indexes, then policies)

## 📊 Step 3: Verify Connection

After running the SQL script, your app should automatically connect to Supabase. 

### Check Backend Logs

When you restart your app, you should see in the console:

```
[Supabase] ✅ Supabase configured successfully
[Database] ✅ Using Supabase as database
[Database] ✅ Supabase tables initialized successfully
```

### Test the Connection

1. Try submitting a property through your app
2. Check the console logs - you should see:
   ```
   [Backend] Using Supabase: true
   [Backend] Inserting property into Supabase
   [Backend] Property created in Supabase: [id]
   ```

3. Go to Supabase **Table Editor** → **properties** table
4. You should see your newly created property!

## 🐛 Troubleshooting

### Error: "JSON Parse error: Unexpected character: N"

This usually means:
1. **Tables not created yet** - Run the SQL script from `supabase_schema.sql`
2. **Backend not responding** - Check if you see backend initialization logs
3. **Wrong URL** - Verify your EXPO_PUBLIC_SUPABASE_URL is correct

### Error: "Network request failed"

This means:
1. **No internet connection** - Check your connection
2. **Supabase project paused** - Go to dashboard and unpause it
3. **Wrong credentials** - Double-check your URL and anon key

### Backend Using Local JSON Instead of Supabase

Check logs for:
```
[Database] ⚠️ Using local JSON file database (fallback)
```

This means environment variables aren't being read. Solution:
1. Restart the development server completely
2. Verify the `env` file is in the project root
3. Check that there are no extra spaces in the env file

## ✨ Success Indicators

You'll know everything is working when you see:

1. ✅ In startup logs:
   - `[Supabase] ✅ Supabase configured successfully`
   - `[Database] ✅ Using Supabase as database`
   - `[Database] ✅ Supabase tables initialized successfully`

2. ✅ When creating a property:
   - `[Backend] Using Supabase: true`
   - `[Backend] Property created in Supabase: [id]`
   - No errors in console

3. ✅ In Supabase Dashboard:
   - Can see properties in the `properties` table
   - Can see activities in the `activities` table

## 🎯 Next Steps After Setup

Once connected:
- Your app will automatically use Supabase for all data storage
- All property submissions will be saved to Supabase
- Admin actions will be tracked in the activities table
- Data persists across app restarts
- You can view/edit data directly in Supabase dashboard

## 📝 Important Notes

- **RLS (Row Level Security)** is enabled on all tables with public policies
- This is fine for development, but you should add proper authentication for production
- The `is_test` flag helps identify test properties
- All timestamps are stored in ISO 8601 format
- JSONB columns allow flexible nested data structures

## Need Help?

If you're still having issues:
1. Check the console logs for detailed error messages
2. Verify all three tables exist in Supabase
3. Make sure RLS policies are created
4. Try creating a test property to see detailed logs
