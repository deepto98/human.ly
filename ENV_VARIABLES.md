# Environment Variables Setup for Humanly

## Understanding Environment Variables in Humanly

Humanly uses **TWO separate environment configurations**:

### 1. Frontend Variables (Vite) - `.env.local`
- Used by the React frontend
- Prefixed with `VITE_`
- Example: `VITE_CONVEX_URL`

### 2. Backend Variables (Convex) - Convex Dashboard
- Used by Convex backend functions
- Set in the Convex dashboard or via CLI
- Example: `OPENAI_API_KEY`, `AUTH_GOOGLE_ID`

## Why Environment Variables Don't Sync Automatically

**Important:** `.env.local` variables are NOT automatically synced to Convex!

- `.env.local` is only read by Vite (frontend)
- Convex backend needs its own environment variables
- They must be set separately in the Convex dashboard

## How to Set Convex Environment Variables

### Method 1: Convex Dashboard (Easiest)

1. Go to: https://dashboard.convex.dev/t/deepto-71174/humanly/settings/environment-variables

2. Click "Add Environment Variable"

3. Add each variable:
   ```
   Variable Name: AUTH_GOOGLE_ID
   Value: your_google_client_id
   ```

4. Click "Save"

5. Repeat for all variables listed below

### Method 2: Using Convex CLI (Faster)

Run these commands in your terminal:

```bash
npx convex env set AUTH_RESEND_KEY "your_key_here"
npx convex env set AUTH_EMAIL "your_email_here"
npx convex env set AUTH_GOOGLE_ID "your_google_id"
npx convex env set AUTH_GOOGLE_SECRET "your_google_secret"
npx convex env set OPENAI_API_KEY "your_openai_key"
npx convex env set FIRECRAWL_API_KEY "your_firecrawl_key"
npx convex env set R2_ACCOUNT_ID "your_account_id"
npx convex env set R2_ACCESS_KEY_ID "your_access_key"
npx convex env set R2_SECRET_ACCESS_KEY "your_secret_key"
npx convex env set R2_BUCKET_NAME "your_bucket_name"
npx convex env set R2_PUBLIC_URL "your_public_url"
npx convex env set HOST_URL "http://localhost:5173"
npx convex env set SITE_URL "http://localhost:5173"
```

### Method 3: Use Our Helper Script

We've created a helper script to show you all your variables:

```bash
./convex-env-setup.sh
```

This will:
- Read your `.env.local` file
- Display all variables that need to be set in Convex
- Provide CLI commands you can copy-paste

## Required Variables for Core Functionality

### Minimum to Test Basic Features:
```bash
# Required for Convex to work
CONVEX_DEPLOYMENT=<auto-set-by-convex>
VITE_CONVEX_URL=<auto-set-by-convex>

# Required for AI features
OPENAI_API_KEY=your_openai_key
FIRECRAWL_API_KEY=your_firecrawl_key

# Required for authentication
AUTH_RESEND_KEY=your_resend_key (for email OTP)
AUTH_GOOGLE_ID=your_google_id (for Google login)
AUTH_GOOGLE_SECRET=your_google_secret (for Google login)
```

### Optional (Can Add Later):
```bash
# For file uploads and recordings
R2_ACCOUNT_ID=your_r2_account
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=humanly-storage
R2_PUBLIC_URL=https://your-r2-url

# For subscriptions
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# For error tracking
SENTRY_DSN=your_sentry_dsn
```

## Verify Variables Are Set

### Check in Convex Dashboard:
https://dashboard.convex.dev/t/deepto-71174/humanly/settings/environment-variables

You should see all your variables listed there.

### Check in Your Code:

In Convex functions, you can access them via:
```typescript
import { OPENAI_API_KEY } from "./env";
```

### Test If Variables Work:

1. Set a variable in Convex dashboard
2. Restart your Convex dev server:
   ```bash
   npm run dev:backend
   ```
3. Check the console - you should NOT see "not configured" errors

## Common Issues

### Issue: "API key not configured"
**Solution:** Variable not set in Convex. Add it to the dashboard.

### Issue: Variable changes not reflected
**Solution:** Restart Convex dev server after adding variables:
```bash
# Stop the server (Ctrl+C)
npm run dev:backend
```

### Issue: Frontend can't access backend variables
**This is normal!** Backend variables are only accessible in Convex functions, not in React components.

### Issue: VITE_ prefixed variables not working in Convex
**This is normal!** `VITE_` variables are only for frontend. Don't use them in Convex functions.

## File Structure

```
├── .env.local                  # Frontend variables (Git ignored)
├── .env.example                # Template (check this in)
├── convex/
│   └── env.ts                  # Imports Convex environment variables
└── ENV_VARIABLES.md            # This file
```

## Security Best Practices

1. ✅ **Never commit `.env.local`** - Already in `.gitignore`
2. ✅ **Use different keys for development and production**
3. ✅ **Rotate keys regularly** if they're exposed
4. ✅ **Use environment-specific deployments** in Convex (dev/prod)
5. ❌ **Never hardcode API keys** in your code

## Quick Reference

| Variable | Where to Set | Used By |
|----------|-------------|---------|
| `VITE_CONVEX_URL` | `.env.local` | Frontend (auto-set) |
| `CONVEX_DEPLOYMENT` | `.env.local` | CLI (auto-set) |
| `AUTH_GOOGLE_ID` | Convex Dashboard | Backend auth |
| `OPENAI_API_KEY` | Convex Dashboard | Backend AI |
| `FIRECRAWL_API_KEY` | Convex Dashboard | Backend scraping |
| All others | Convex Dashboard | Backend |

## Need Help?

If environment variables still aren't working:

1. Run: `./convex-env-setup.sh` to see what you have
2. Check: https://dashboard.convex.dev/t/deepto-71174/humanly/settings/environment-variables
3. Verify: Variables are listed in the dashboard
4. Restart: Your Convex dev server
5. Check: Console logs for "not configured" errors

---

**Pro Tip:** Use the Convex CLI method - it's much faster than clicking through the dashboard for each variable!

