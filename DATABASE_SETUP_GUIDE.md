# Walican Database Setup Guide

## 🎯 Quick Setup (Recommended)

**Step 1: Execute SQL in Supabase Dashboard**
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/nkxeawivmzxbnoakpkvz/sql)
2. Copy the entire contents of `complete-setup.sql` 
3. Paste into the SQL editor
4. Click **"Run"** to execute

**Step 2: Verify Setup**
```bash
node setup-database-v2.js
```

**Step 3: Generate TypeScript Types**
```bash
npx supabase gen types typescript --project-id nkxeawivmzxbnoakpkvz > lib/database.types.ts
```

---

## 📋 Database Schema Overview

### Core Tables
- **`events`** - Event information and metadata
- **`participants`** - People participating in events
- **`expenses`** - Individual expenses within events
- **`expense_splits`** - How expenses are split between participants
- **`settlements`** - Payment settlements between participants

### Key Features
- ✅ UUID primary keys
- ✅ Foreign key relationships with cascading deletes
- ✅ Optimized indexes for performance
- ✅ Row Level Security (RLS) enabled
- ✅ Flexible expense splitting (equal, custom, percentage)
- ✅ Multi-currency support
- ✅ Settlement tracking

---

## 🔧 Alternative Setup Methods

### Method 1: Supabase CLI (Requires Database Password)
```bash
# Link to your project
npx supabase link --project-ref nkxeawivmzxbnoakpkvz

# Push schema (if you have migration files)
npx supabase db push
```

### Method 2: Direct Database Connection
If you have the database password, you can connect directly using:
- pgAdmin
- psql command line
- Any PostgreSQL client

**Connection Details:**
- Host: `aws-1-ap-northeast-1.pooler.supabase.com`
- Database: `postgres`
- User: `postgres.nkxeawivmzxbnoakpkvz`
- Port: `6543`

---

## 🧪 Testing Your Setup

After executing the SQL, run the verification script:

```bash
node setup-database-v2.js
```

Expected output:
```
✅ Table 'events' exists
✅ Table 'participants' exists
✅ Table 'expenses' exists
✅ Table 'expense_splits' exists
✅ Table 'settlements' exists
```

---

## 🚀 Next Steps

1. **Generate TypeScript Types**
   ```bash
   npx supabase gen types typescript --project-id nkxeawivmzxbnoakpkvz > lib/database.types.ts
   ```

2. **Test the Application**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 and create a test event.

3. **Verify Data Flow**
   - Create an event
   - Add participants
   - Add expenses
   - Check expense splits
   - Verify in Supabase Dashboard

---

## 🔍 Troubleshooting

### Tables Not Created
- Double-check the SQL was executed without errors
- Verify you're in the correct Supabase project
- Check the SQL Editor for error messages

### Permission Issues
- Ensure you're using the service role key
- Verify RLS policies are set correctly
- Check that all policies allow the operations you need

### Connection Issues
- Verify environment variables in `.env.local`
- Test connection with the verification script
- Check Supabase project status in dashboard

### TypeScript Errors
- Ensure types are generated after tables are created
- Restart TypeScript service in your editor
- Verify the types file path is correct

---

## 📝 Environment Variables

Ensure your `.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nkxeawivmzxbnoakpkvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎉 Success Indicators

Your database is ready when:
- ✅ All 5 tables are created without errors
- ✅ Foreign key relationships work correctly
- ✅ RLS policies allow necessary operations
- ✅ TypeScript types are generated successfully
- ✅ Application can create and read data
- ✅ No console errors when testing basic operations

---

For questions or issues, check the Supabase documentation or verify your project configuration in the dashboard.