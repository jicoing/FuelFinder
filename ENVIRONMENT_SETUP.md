# Environment Variables Setup

This document explains how to configure environment variables for the FindMyFuel app with Cashfree payment integration.

---

## Required Variables

### Supabase
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Cashfree
```env
CASHFREE_CLIENT_ID=your_cashfree_client_id
CASHFREE_CLIENT_SECRET=your_cashfree_client_secret
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret
CASHFREE_ENV=sandbox  # or 'production'
```

### App Configuration
```env
FRONTEND_URL=http://localhost:5001  # your app's public URL
PORT=5001  # server port
```

---

## Development Setup (Local)

### Step 1: Create `.env` file

In the **project root** (`FuelFinder/`), create a file named `.env`:

```env
# Supabase credentials (from Supabase dashboard > Project Settings > API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cashfree credentials (from Cashfree dashboard > Settings > API Keys)
CASHFREE_CLIENT_ID=your_client_id
CASHFREE_CLIENT_SECRET=your_client_secret
CASHFREE_WEBHOOK_SECRET=your_webhook_secret
CASHFREE_ENV=sandbox

# App settings
FRONTEND_URL=http://localhost:5001
PORT=5001
```

### Step 2: Restart the server

After saving the `.env` file, restart your development server:

```bash
npm run dev
```

---

## Production Setup

### Replit / Hosting Platforms

Most platforms have a **Secrets** or **Environment Variables** section:

1. Open your app on the platform
2. Go to **Settings** (or **Secrets** / **Environment Variables**)
3. Add each variable with the same names as above
4. Deploy/restart the app

### Docker

Add to your `Dockerfile`:

```dockerfile
ENV SUPABASE_URL=...
ENV SUPABASE_ANON_KEY=...
# ... other env vars
```

### Vercel / Netlify

Use the platform's dashboard:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment

---

## Setting Up Cashfree

1. **Sign up** at [Cashfree.com](https://www.cashfree.com/)
2. **Get API keys**:
   - Go to **Settings** → **API Keys**
   - Copy `Client ID` and `Client Secret`
   - Also generate a `Webhook Secret`
3. **Configure Webhook**:
   - URL: `https://your-app-url.com/api/webhooks/cashfree`
   - Events: Select `ORDER_STATUS_CHANGED`
   - Save

---

## Verifying Setup

After setting environment variables, check logs:

```bash
# Should see:
[express] serving on port 5001
```

If you see errors about missing variables, check:
- `.env` file location (must be in project root)
- Variable names (must match exactly)
- Server restart after changes

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `CASHFREE_CLIENT_ID undefined` | Check `.env` file, restart server |
| `Supabase connection failed` | Verify `SUPABASE_URL` and keys are correct |
| Webhook not working | Ensure `CASHFREE_WEBHOOK_SECRET` is set, signature verification enabled |
| Server won't start | Check for typos in `.env`, ensure no quotes around values |

---

## Security Notes

- **Never commit** `.env` to Git. Add it to `.gitignore`.
- Use **service role key** only on server-side (never expose to frontend).
- In production, use platform **Secrets** instead of `.env` file.
- Rotate keys periodically and after any security incident.