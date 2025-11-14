# Humanly Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- API keys for required services

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Convex
Convex has already been initialized. The project is configured at:
https://dashboard.convex.dev/t/deepto-71174/humanly

Your `.env.local` file has been created with `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`.

### 3. Configure Environment Variables
Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your API keys:

**Required for core functionality:**
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `FIRECRAWL_API_KEY` - Get from https://firecrawl.dev/
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - Cloudflare R2 credentials

**Optional (for full features):**
- `AUTH_RESEND_KEY` - For email authentication (https://resend.com/)
- `STRIPE_SECRET_KEY` - For subscription features (https://stripe.com/)
- `DID_API_KEY` or `HEYGEN_API_KEY` - For animated avatars
- `SENTRY_DSN` - For error tracking

### 4. Start Development

Open two terminal windows:

**Terminal 1 - Start Convex backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Start Vite frontend:**
```bash
npm run dev:frontend
```

Or run both together:
```bash
npm run dev
```

### 5. Access the App
Open your browser to: http://localhost:5173

## Setting Up Cloudflare R2

1. Go to https://dash.cloudflare.com/
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., "humanly-storage")
4. Create an API token with R2 read/write permissions
5. Add credentials to `.env.local`

## Setting Up Firecrawl

1. Go to https://firecrawl.dev/
2. Sign up and get your API key
3. Add to `.env.local` as `FIRECRAWL_API_KEY`

## Setting Up OpenAI

1. Go to https://platform.openai.com/
2. Create an API key
3. Add to `.env.local` as `OPENAI_API_KEY`

## Troubleshooting

### Type errors during Convex dev
```bash
npm install --save-dev @types/yauzl
```

### Cannot find module errors
```bash
npm install
```

### Convex functions not updating
Restart the Convex dev server (`npm run dev:backend`)

## Project Structure

```
/convex              - Backend functions and schema
  /lib              - Integration libraries (Firecrawl, OpenAI, R2)
  schema.ts         - Database schema
  agents.ts         - Agent management functions
  knowledgeSources.ts - Knowledge source functions
  questions.ts      - Question management functions

/src
  /routes           - TanStack Router pages
  /ui               - Reusable UI components
  /utils            - Utility functions
```

## Next Steps

1. Test the homepage at http://localhost:5173
2. Sign up/login to create your first interview agent
3. Navigate to the knowledge sources page
4. Start building your interview!

## Support

For issues or questions, check:
- Convex Dashboard: https://dashboard.convex.dev/
- Documentation: See docs/ folder
