# Google OAuth Setup for Humanly

## Overview

Humanly uses Google OAuth for quick sign-in. Here's how to set it up:

## Steps to Get Google OAuth Credentials

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create a New Project (if needed)
- Click on the project dropdown at the top
- Click "New Project"
- Name it "Humanly" or your preferred name
- Click "Create"

### 3. Enable Google+ API
- In your project, go to "APIs & Services" > "Library"
- Search for "Google+ API"
- Click on it and click "Enable"

### 4. Create OAuth Consent Screen
- Go to "APIs & Services" > "OAuth consent screen"
- Choose "External" (for testing) or "Internal" (if you have a Google Workspace)
- Fill in:
  - App name: **Humanly**
  - User support email: your email
  - Developer contact: your email
- Click "Save and Continue"
- Skip the scopes page (click "Save and Continue")
- Add test users if external (your email addresses)
- Click "Save and Continue"

### 5. Create OAuth Client ID
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- Choose "Web application"
- Name: **Humanly Web Client**
- Authorized JavaScript origins:
  ```
  http://localhost:5173
  https://your-production-domain.com
  ```
- Authorized redirect URIs:
  ```
  http://localhost:5173/api/auth/callback/google
  https://your-production-domain.com/api/auth/callback/google
  ```
- Click "Create"
- **Copy the Client ID and Client Secret**

### 6. Add to Your .env.local File

Add these lines to your `.env.local` file:

```bash
# Google OAuth
AUTH_GOOGLE_ID=your_client_id_here.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your_client_secret_here
```

## Testing

1. Start your Convex backend:
   ```bash
   npm run dev:backend
   ```

2. Start your frontend:
   ```bash
   npm run dev:frontend
   ```

3. Open http://localhost:5173

4. Click "Get Started" 

5. The auth modal will appear - click "Continue with Google"

6. You should be redirected to Google's login page

7. After authorization, you'll be redirected back to Humanly

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console exactly matches:
  - `http://localhost:5173/api/auth/callback/google` (for local dev)
  - Don't forget the `http://` or `https://`

### Error: "Access blocked: This app's request is invalid"
- Make sure you've enabled the Google+ API
- Check that your OAuth consent screen is configured

### Google login button doesn't work
- Verify `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are in `.env.local`
- Restart your Convex backend after adding env vars
- Check browser console for errors

## Production Deployment

When deploying to production:

1. Add your production domain to:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

2. Set the environment variables in your Convex dashboard:
   - Go to https://dashboard.convex.dev/
   - Select your project
   - Go to "Settings" > "Environment Variables"
   - Add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

## Security Notes

- **Never commit** your Google Client Secret to version control
- Keep your `.env.local` file in `.gitignore`
- In production, use environment variables through your hosting platform
- Regularly rotate your client secret if compromised

