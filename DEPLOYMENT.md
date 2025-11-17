# Deploying Humanly to Netlify

## Prerequisites

1. GitHub account
2. Netlify account (free tier works)
3. All API keys ready (OpenAI, Firecrawl, Google OAuth, etc.)

---

## Step 1: Push to GitHub

```bash
# If not already done, create a new repo on GitHub
# Then push your code:

git remote add origin https://github.com/your-username/humanly.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Netlify

### Option A: Via Netlify Dashboard (Easiest)

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub"
4. Select your `humanly` repository
5. Netlify will auto-detect the settings from `netlify.toml`
6. Click "Deploy site"

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

---

## Step 3: Configure Environment Variables

### In Netlify Dashboard:

1. Go to your site → **Site configuration** → **Environment variables**
2. Add these variables:

```bash
# Convex (REQUIRED)
VITE_CONVEX_URL=<your-convex-url-from-.env.local>
CONVEX_DEPLOYMENT=<your-deployment-from-.env.local>
```

**Note:** Frontend only needs `VITE_CONVEX_URL`. All backend variables (OpenAI, Firecrawl, etc.) are set in Convex dashboard.

---

## Step 4: Configure Convex for Production

### Set Production Environment Variables in Convex:

1. Go to https://dashboard.convex.dev/t/deepto-71174/humanly
2. Go to **Settings** → **Environment Variables**
3. Set these for production:

```bash
# Update URLs for production
SITE_URL=https://your-site.netlify.app
HOST_URL=https://your-site.netlify.app

# All other API keys (same as dev)
OPENAI_API_KEY=your-key
FIRECRAWL_API_KEY=your-key
AUTH_RESEND_KEY=your-key
AUTH_EMAIL=noreply@yourdomain.com
AUTH_GOOGLE_ID=your-google-id
AUTH_GOOGLE_SECRET=your-google-secret

# Optional
R2_ACCOUNT_ID=your-account
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=humanly-storage
R2_PUBLIC_URL=https://your-r2-url
```

---

## Step 5: Update Google OAuth for Production

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins:**
   ```
   https://your-site.netlify.app
   ```
6. Add to **Authorized redirect URIs:**
   ```
   https://your-site.netlify.app/api/auth/callback/google
   ```
7. Save

---

## Step 6: Deploy Convex Functions

```bash
# Deploy Convex to production
npx convex deploy

# This will:
# - Bundle your functions
# - Deploy to Convex cloud
# - Use production environment variables
```

---

## Deployment Checklist

### Before Deploying:

- [ ] Code pushed to GitHub
- [ ] All environment variables documented
- [ ] Google OAuth configured for production domain
- [ ] Convex functions tested locally

### After Deploying:

- [ ] Set `VITE_CONVEX_URL` in Netlify
- [ ] Update `SITE_URL` and `HOST_URL` in Convex
- [ ] Add production domain to Google OAuth
- [ ] Test authentication
- [ ] Test agent creation
- [ ] Test interview taking
- [ ] Test all knowledge source types

---

## Automatic Deploys

Once set up, Netlify will automatically:
- ✅ Deploy on every push to `main` branch
- ✅ Build with `npm run build`
- ✅ Deploy Convex functions automatically
- ✅ Serve from global CDN

---

## Custom Domain (Optional)

### Add Your Domain:

1. In Netlify → **Domain management**
2. Click "Add custom domain"
3. Enter your domain (e.g., `humanly.ai`)
4. Follow DNS configuration instructions
5. Enable HTTPS (automatic with Netlify)

### Update After Adding Domain:

1. **Convex Environment Variables:**
   ```bash
   SITE_URL=https://humanly.ai
   HOST_URL=https://humanly.ai
   ```

2. **Google OAuth:**
   - Add `https://humanly.ai` to JavaScript origins
   - Add `https://humanly.ai/api/auth/callback/google` to redirect URIs

---

## Monitoring & Logs

### Netlify Logs:
- Build logs: Site → **Deploys** → Click deployment
- Function logs: Real-time in dashboard

### Convex Logs:
- https://dashboard.convex.dev/t/deepto-71174/humanly/logs
- Real-time backend function logs
- Error tracking

---

## Troubleshooting

### Build Fails

**Check:** `npm run build` works locally
```bash
npm run build
```

### Site Loads but Shows Errors

**Check:** `VITE_CONVEX_URL` is set in Netlify

### Authentication Doesn't Work

**Check:** 
- Google OAuth redirect URIs include your Netlify URL
- `SITE_URL` and `HOST_URL` set correctly in Convex
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` set in Convex

### Functions Don't Work

**Check:**
- Convex functions deployed: `npx convex deploy`
- Environment variables set in Convex dashboard
- Logs in Convex dashboard for errors

---

## Deployment Commands Reference

```bash
# Build locally to test
npm run build
npm run preview

# Deploy Convex functions
npx convex deploy

# Deploy to Netlify (if using CLI)
netlify deploy --prod

# Check build status
netlify status

# View logs
netlify logs
```

---

## Production URLs

After deployment, you'll have:

- **Frontend:** `https://your-site.netlify.app`
- **Convex Backend:** Managed automatically
- **Dashboard:** https://dashboard.convex.dev/

---

## Cost Estimates

### Netlify:
- **Starter (Free):** 100GB bandwidth, 300 build minutes
- Typically enough for early stage

### Convex:
- **Free Tier:** Generous limits for development
- **Production:** Pay as you grow

### API Services:
- **OpenAI:** ~$0.01-0.03 per agent created
- **Firecrawl:** Credits based on usage
- **Cloudflare R2:** ~$0.015/GB storage

---

## Security Notes

1. ✅ Never commit API keys to Git
2. ✅ Use environment variables for all secrets
3. ✅ Set different keys for dev/prod
4. ✅ Enable HTTPS (automatic with Netlify)
5. ✅ Rotate keys if exposed

---

## Next Steps After Deployment

1. Test all flows on production
2. Monitor error rates
3. Set up alerts (optional)
4. Configure custom domain
5. Share with users!

---

**Ready to deploy? Just push to GitHub and connect to Netlify!** 🚀

