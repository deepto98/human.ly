# Humanly - AI Interview Platform 🎯

**Reinvent interviews with AI-powered agents that adapt, evaluate, and engage.**

Humanly is a complete SaaS platform for creating intelligent interview agents. Design custom interview experiences with AI-generated questions, conduct interactive voice interviews, and get automated evaluation with detailed analytics.

![Neobrutalist Design](https://img.shields.io/badge/Design-Neobrutalist-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-lime?style=for-the-badge)

## ✨ Features

### 🎨 For Administrators

- **Create AI Interview Agents** - Build custom interview agents in 3 easy steps
- **Smart Knowledge Sources** - Generate questions from topics, URLs, web search, or documents
- **AI Question Generation** - Powered by GPT-4 for intelligent MCQ and subjective questions
- **Flexible Configuration** - Customize agent personality, voice, and conversational style
- **Shareable Links** - One-click sharing for candidates
- **Comprehensive Analytics** - View all attempts, scores, and detailed breakdowns
- **Neobrutalist UI** - Modern, bold, and engaging interface

### 🎤 For Candidates

- **Interactive Interviews** - Chat with AI agents that speak and listen
- **Voice & Text Input** - Answer by typing or speaking
- **Webcam Integration** - Professional interview experience
- **Instant Feedback** - Get immediate responses and evaluation
- **Progress Tracking** - See where you are in the interview

### 🤖 AI-Powered Features

- **Automatic Question Generation** - From any content source
- **Smart Evaluation** - AI evaluates subjective answers against key points
- **Conversational AI** - Natural dialogue flow with Text-to-Speech
- **Adaptive Scoring** - Fair evaluation with partial credit

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- API Keys:
  - OpenAI (required)
  - Firecrawl (required)
  - Google OAuth (required)
  - Resend (required)
  - Cloudflare R2 (optional)

### Installation

1. **Clone and Install**
```bash
git clone <your-repo>
cd human.ly
npm install
```

2. **Initialize Convex**
Convex is already initialized! Your project: https://dashboard.convex.dev/t/deepto-71174/humanly

3. **Set Environment Variables**

**Add to Convex (backend):**
```bash
npx convex env set OPENAI_API_KEY "your-key"
npx convex env set FIRECRAWL_API_KEY "your-key"
npx convex env set AUTH_RESEND_KEY "your-key"
npx convex env set AUTH_EMAIL "noreply@yourdomain.com"
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"
npx convex env set HOST_URL "http://localhost:5173"
npx convex env set SITE_URL "http://localhost:5173"
```

**Note:** `.env.local` is only for frontend (auto-created by Convex). Backend variables must be set in Convex dashboard or via CLI.

See `ENV_VARIABLES.md` for detailed instructions.

4. **Start Development**
```bash
npm run dev
```

This runs both backend (Convex) and frontend (Vite).

5. **Open App**
```bash
http://localhost:5173
```

## 📖 Documentation

- **[FEATURES_READY.md](FEATURES_READY.md)** - Complete feature list and testing guide
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[ENV_VARIABLES.md](ENV_VARIABLES.md)** - Environment variables explained
- **[GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md)** - Google OAuth configuration
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - Technical implementation details

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- TanStack Start (Vite + TanStack Router)
- React 18
- TailwindCSS + Neobrutalist design
- Shadcn UI (customized)
- Framer Motion
- React Webcam
- Web Speech API

**Backend:**
- Convex (Database + Backend functions)
- Convex Auth (Google OAuth + Email OTP)
- OpenAI GPT-4
- Firecrawl
- Cloudflare R2
- Stripe (optional)
- Resend

**Development:**
- TypeScript
- ESLint + Prettier
- npm

### Project Structure

```
/convex                 Backend functions
  /lib                  Integration libraries
  schema.ts             Database schema
  agents.ts             Agent management
  knowledgeSources.ts   Content scraping
  questions.ts          Question generation
  interviews.ts         Interview sessions
  auth.ts               Authentication

/src
  /routes               Pages (TanStack Router)
  /ui                   Reusable components
  /utils                Helper functions
  router.tsx            App router config

/docs                   Original template docs
```

## 🎯 User Flows

### Admin: Create Interview Agent

1. **Dashboard** → Click "Create Agent"
2. **Knowledge Sources** → Choose source type:
   - Topic-based
   - URL scraping
   - Web search
   - Document upload
3. **Questions** → Configure & generate:
   - Set MCQ count and marks
   - Set Subjective count and marks
   - Click "Generate"
   - Review and edit questions
4. **Agent Behavior** → Customize:
   - Name, gender, appearance
   - Voice type
   - Conversational style
   - Follow-up settings
5. **Publish** → Get shareable link!

### Candidate: Take Interview

1. **Open Link** → Enter name and email
2. **Permissions** → Grant camera/screen access
3. **Introduction** → Meet AI agent, introduce yourself
4. **Questions** → Answer one by one (type or speak)
5. **Complete** → See results, done!

### Admin: Review Results

1. **Dashboard** → Click agent → "View Attempts"
2. **Attempts List** → See all candidates and scores
3. **Detailed View** → Click candidate to see:
   - Full conversation
   - Question-by-question breakdown
   - Scores and evaluation
   - Video recording (if R2 configured)

## 🎨 Design Philosophy

### Neobrutalism

Humanly uses a **neobrutalist design** system:
- Thick black borders (3-4px)
- Offset drop shadows
- Vibrant flat colors
- Bold typography
- No gradients (except decorative)
- High contrast
- Playful and energetic

**Why?** Stands out from typical AI platforms with purple gradients. Feels human, accessible, and fun!

## 🔑 API Keys Required

### Essential:
- **OpenAI** - Question generation & evaluation → https://platform.openai.com/
- **Firecrawl** - Web scraping → https://firecrawl.dev/
- **Google OAuth** - Authentication → https://console.cloud.google.com/
- **Resend** - Email OTP codes → https://resend.com/

### Optional:
- **Cloudflare R2** - Video recording storage → https://dash.cloudflare.com/
- **Stripe** - Subscriptions → https://stripe.com/
- **D-ID/HeyGen** - Animated avatars → https://www.d-id.com/ or https://www.heygen.com/
- **Sentry** - Error tracking → https://sentry.io/

## 📊 Database Schema

Built on Convex with reactive queries:

- `interviewAgents` - Agent configurations
- `knowledgeSources` - Scraped content
- `questions` - MCQ & subjective questions
- `interviews` - Interview sessions
- `interviewResponses` - Answers & scores
- `recordings` - Video metadata
- `users` - Authentication
- `subscriptions` - Stripe (optional)

All tables have proper indexes for performance.

## 🧪 Testing

See `FEATURES_READY.md` for complete testing guide.

**Quick Test:**

1. Start: `npm run dev`
2. Open: http://localhost:5173
3. Sign in with Google
4. Create agent with topic "Python Programming"
5. Generate 5 MCQs, 3 Subjective
6. Configure agent behavior
7. Publish and get link
8. Open link in incognito to take interview

## 🚀 Deployment

### Convex Backend
Automatically deployed to Convex cloud. Set environment variables in Convex dashboard for production.

### Frontend
Can deploy to:
- Netlify (configured in `netlify.toml`)
- Vercel
- Cloudflare Pages
- Any Vite-compatible host

**Build:**
```bash
npm run build
```

## 🤝 Contributing

Built with love for the future of interviews!

## 📄 License

See LICENSE file.

## 🙏 Credits

Built on top of:
- [Convex](https://convex.dev/) - Reactive backend
- [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- Original template by [DanielKanem](https://github.com/get-convex/convex-saas)

---

**Made with ❤️ for better interviews**

**Status:** ✅ Core platform ready to use!

**Total Commits:** 28

**Lines of Code:** ~5000+ lines across frontend and backend

See `IMPLEMENTATION_STATUS.md` for what's implemented and what's optional.
