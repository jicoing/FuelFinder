# FuelFinder - Supabase & Premium Setup Guide

This guide covers setting up Supabase for authentication/data sync and Cashfree for payments to enable the freemium model.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Supabase Setup](#supabase-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Cashfree Setup (Payments)](#cashfree-setup-payments)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

1. **Clone & Install**
   ```bash
   cd FuelFinder
   npm install
   ```

2. **Set up Supabase** (see detailed steps below)
   - Create project
   - Run schema.sql
   - Get API keys

3. **Create `.env` file** with your credentials

4. **Start dev server**
   ```bash
   node node_modules/vite/bin/vite.js
   # or on Linux/Mac:
   # npx vite
   ```

5. **Open** http://localhost:5173/

---

## Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) → Sign up/Login
2. Click **"New Project"**
3. Fill in:
   - **Organization**: Select or create one
   - **Project name**: `fuelfinder` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
4. Wait 1-2 minutes for provisioning

### 1.2 Get API Credentials

1. In your new project, go to **Settings** (gear icon) → **API**
2. Copy these values:
   ```
   Project URL: https://xxx.supabase.co
   anon/public key: eyJ...
   service_role key: eyJ...
   ```
3. Keep the service_role key secret - it has admin privileges

---

## Database Configuration

### 2.1 Run Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy entire contents of `FuelFinder/supabase/schema.sql`
4. Paste into editor
5. Press **Ctrl+Enter** or click **Run**
6. Verify: All statements should return "Success. No rows returned"

### 2.2 Verify Tables

After running schema, check in **Table Editor**:
- ✅ `profiles` table exists
- ✅ `trip_calculations` table exists
- ✅ `saved_stations` table exists

### 2.3 Enable Realtime (Optional)

For real-time sync across devices:
1. Go to **Realtime** → **Quick start**
2. Enable replication for tables if needed

---

## Environment Variables

### 3.1 Create `.env` File

In the **FuelFinder root directory** (where `package.json` is), create `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Cashfree Configuration (for payments - optional initially)
VITE_CASHFREE_CLIENT_ID=your-client-id
VITE_CASHFREE_CLIENT_SECRET=your-client-secret
VITE_CASHFREE_ENV=sandbox  # or 'production' when live
```

**Important:**
- `VITE_` prefix makes variables accessible in client code
- `SUPABASE_SERVICE_ROLE_KEY` is for server-side only (not used yet but will be for payment verification)
- Do NOT commit `.env` to git (it's in `.gitignore`)

### 3.2 Restart Dev Server

After creating `.env`, restart Vite:

```bash
# Stop current server (Ctrl+C)
# Then restart:
node node_modules/vite/bin/vite.js
```

---

## Cashfree Setup (Payments)

*(Optional - skip if just testing auth)*

### 4.1 Create Account

1. Go to [cashfree.com](https://www.cashfree.com)
2. Sign up as a merchant
3. Complete KYC verification (takes 1-3 business days)
4. Once approved, get credentials from **Dashboard** → **Developers** → **API Keys**

### 4.2 Configure Webhook (Production)

For payment status updates:

1. In Cashfree dashboard, go to **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/cashfree`
3. Select events: `ORDER_PAID`, `ORDER_REFUNDED`, `ORDER_FAILED`
4. Copy webhook secret key to `.env` if using webhook verification

### 4.3 Sandbox Testing

1. Enable **Sandbox mode** in Cashfree dashboard
2. Use test credentials in `.env`: `VITE_CASHFREE_ENV=sandbox`
3. Test with Cashfree's test card numbers:
   ```
   Card: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25
   ```

---

## Testing

### 5.1 Test Authentication

1. Open http://localhost:5173/
2. Click **"Sign In"** button (top right)
3. Click **"Sign Up"** tab
4. Enter test email/password + name
5. Click **"Create Account"**
6. Check Supabase dashboard → **Authentication** → **Users** - your user should appear
7. Check **Table Editor** → `profiles` - profile should auto-create

### 5.2 Test Calculator Sync

1. Sign in with your test account
2. Go to **Calculator** page
3. Enter values and click **"Save Calculation"**
4. Refresh the page - data should persist (from Supabase)
5. Check `trip_calculations` table in Supabase - your calculation should be there

### 5.3 Test Freemium Limits

1. **Without auth**: localStorage works (no limit checks yet)
2. **With auth (free tier)**:
   - Try saving >10 calculations - should show limit error
   - Try saving stations - limited to 5

### 5.4 Test Premium Upgrade (Sandbox)

1. Sign in → Click **"Upgrade"** button
2. Enter test payment details (use Cashfree sandbox card)
3. Complete payment
4. In Supabase `profiles` table, update your user:
   ```sql
   UPDATE profiles 
   SET subscription_tier = 'premium', 
       subscription_status = 'active',
       customer_id = 'cf_customer_id_from_webhook'
   WHERE id = 'your-user-id';
   ```
5. Refresh app - you should see "Pro" badge and unlimited features

---

## Production Deployment

### 6.1 Environment Checklist

- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Enable email confirmations in Supabase Auth settings
- [ ] Set `VITE_CASHFREE_ENV=production`
- [ ] Add production domain to Supabase "Allowed domains" under Auth → URL Configuration
- [ ] Configure proper CORS in Supabase if needed

### 6.2 Database Setup for Production

The provided schema includes Row Level Security (RLS). For production:

1. **Review RLS policies** - ensure they're correct
2. **Add any additional indexes** if querying on different columns
3. **Set up backups** in Supabase (Project Settings → Backups)
4. **Consider connection pooling** for high traffic

### 6.3 Payment Flow

For full payment integration, you need:

1. **Server-side verification** (to prevent fraud):
   - Create `/api/verify-payment` endpoint in Express
   - Use `SUPABASE_SERVICE_ROLE_KEY` to update user tier
   - Verify Cashfree signature on webhooks

2. **Webhook handler** (recommended):
   ```typescript
   // server/routes.ts
   app.post('/api/webhooks/cashfree', async (req, res) => {
     // Verify signature
     // Update subscription tier in Supabase
     // Respond 200 OK
   });
   ```

3. **Customer portal** (optional):
   - Let users manage/cancel subscriptions
   - Use Cashfree's subscription APIs

### 6.4 Deploy to Vercel/Replit/Railway

**For Vercel**:
1. Import repo
2. Add environment variables in Vercel dashboard
3. Build command: (empty - Vite handles it)
4. Output directory: `dist/public`

**For Replit** (already configured):
1. Just push to Replit
2. Set secrets in Replit Secrets (same as `.env`)
3. Click **Deploy**

**For Railway**:
1. Connect GitHub repo
2. Add environment variables
3. Build command: `npm run build`
4. Start command: `node --条件判断 node_modules/vite/bin/vite.js` (or configure properly)

---

## Architecture

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Payments | Cashfree |
| Hosting | Vercel/Replit/Railway |

### Data Flow

```
User Action → Frontend → Supabase Client → Supabase Database
                                    ↓
                              Real-time sync across devices
```

For payments:
```
User clicks "Upgrade" → Cashfree Checkout → Webhook → Update profile tier
```

### Database Schema

```
profiles
├── id (UUID, primary key)
├── email
├── full_name
├── subscription_tier ('free' | 'premium')
├── subscription_status
└── created_at

trip_calculations
├── id (UUID)
├── user_id (FK → profiles)
├── type ('distanceToCost' | 'budgetToDistance')
├── distance, mileage, fuel_rate, budget
├── fuel_needed, total_cost, etc.
└── created_at

saved_stations
├── id (UUID)
├── user_id (FK → profiles)
├── name, brand, lat, lon
└── created_at
```

---

## Troubleshooting

### "Supabase URL and API key are required"

**Fix**: Create `.env` file with correct credentials and restart server.

### "Failed to fetch calculation data"

**Check**:
- User is signed in (check `user` state in React DevTools)
- Supabase RLS policies are applied correctly
- Network tab for CORS errors

### "Could not find location" for ZIP codes

**Cause**: Nominatim (OSM geocoding) doesn't have that ZIP in their database, or the country-specific endpoint failed.

**Fix** (already implemented):
- App tries fallback without country filter
- Shows helpful tip to change country

### Payment not working in sandbox

**Check**:
- `VITE_CASHFREE_ENV=sandbox` is set
- Using test card numbers (not real cards)
- Cashfree account is in sandbox mode

### TypeScript errors

**Fix**: Install missing types:
```bash
npm i -D @types/lucide-react
```

### Port 5173 already in use

**Fix**:
```bash
# Find process using port 5173
netstat -ano | findstr :5173
# Kill it or use different port
# Or just restart Vite - it will auto-use 5174
```

---

## Next Steps

1. Set up Supabase and run schema
2. Configure `.env` with your keys
3. Test sign up/sign in flow
4. Integrate payment system:
   - Server-side payment verification endpoint
   - Webhook handler to auto-upgrade users on payment
   - Subscription management UI
5. Deploy to production
6. Set up monitoring (Sentry, LogRocket)
7. Add analytics (PostHog, Mixpanel)

---

## Support

- Supabase Docs: https://supabase.com/docs
- Cashfree Docs: https://docs.cashfree.com/
- App Issues: Create issue on GitHub
- Questions: Reach out to developer

---

## License

MIT - see LICENSE file for details.