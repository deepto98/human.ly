#!/bin/bash

# Humanly - Convex Environment Variables Setup Script
# This script helps you set Convex environment variables

echo "🔧 Setting up Convex Environment Variables for Humanly"
echo "======================================================"
echo ""
echo "Note: You need to set these variables in the Convex dashboard:"
echo "https://dashboard.convex.dev/t/deepto-71174/humanly/settings/environment-variables"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local file first."
    exit 1
fi

echo "📋 Reading from .env.local..."
echo ""

# Function to extract value from .env.local
get_env_value() {
    grep "^$1=" .env.local | cut -d '=' -f 2-
}

echo "Required Convex Environment Variables:"
echo "======================================="
echo ""

# List all backend environment variables
echo "🔐 AUTHENTICATION:"
echo "  AUTH_RESEND_KEY=$(get_env_value AUTH_RESEND_KEY)"
echo "  AUTH_EMAIL=$(get_env_value AUTH_EMAIL)"
echo "  AUTH_GOOGLE_ID=$(get_env_value AUTH_GOOGLE_ID)"
echo "  AUTH_GOOGLE_SECRET=$(get_env_value AUTH_GOOGLE_SECRET)"
echo ""

echo "💳 STRIPE (optional):"
echo "  STRIPE_SECRET_KEY=$(get_env_value STRIPE_SECRET_KEY)"
echo "  STRIPE_WEBHOOK_SECRET=$(get_env_value STRIPE_WEBHOOK_SECRET)"
echo ""

echo "🤖 AI SERVICES:"
echo "  OPENAI_API_KEY=$(get_env_value OPENAI_API_KEY)"
echo "  FIRECRAWL_API_KEY=$(get_env_value FIRECRAWL_API_KEY)"
echo ""

echo "☁️ CLOUDFLARE R2:"
echo "  R2_ACCOUNT_ID=$(get_env_value R2_ACCOUNT_ID)"
echo "  R2_ACCESS_KEY_ID=$(get_env_value R2_ACCESS_KEY_ID)"
echo "  R2_SECRET_ACCESS_KEY=$(get_env_value R2_SECRET_ACCESS_KEY)"
echo "  R2_BUCKET_NAME=$(get_env_value R2_BUCKET_NAME)"
echo "  R2_PUBLIC_URL=$(get_env_value R2_PUBLIC_URL)"
echo ""

echo "🔍 MONITORING (optional):"
echo "  SENTRY_DSN=$(get_env_value SENTRY_DSN)"
echo ""

echo "📍 SITE URLs:"
echo "  HOST_URL=$(get_env_value HOST_URL)"
echo "  SITE_URL=$(get_env_value SITE_URL)"
echo ""

echo "======================================================"
echo ""
echo "🎯 QUICK SETUP OPTIONS:"
echo ""
echo "Option 1: Manual Setup (Recommended)"
echo "  1. Go to: https://dashboard.convex.dev/t/deepto-71174/humanly/settings/environment-variables"
echo "  2. Copy the values from above"
echo "  3. Add them one by one in the dashboard"
echo ""
echo "Option 2: Use Convex CLI"
echo "  Run these commands (replace <value> with actual values):"
echo ""

# Generate CLI commands
echo "  npx convex env set AUTH_RESEND_KEY \"$(get_env_value AUTH_RESEND_KEY)\""
echo "  npx convex env set AUTH_EMAIL \"$(get_env_value AUTH_EMAIL)\""
echo "  npx convex env set AUTH_GOOGLE_ID \"$(get_env_value AUTH_GOOGLE_ID)\""
echo "  npx convex env set AUTH_GOOGLE_SECRET \"$(get_env_value AUTH_GOOGLE_SECRET)\""
echo "  npx convex env set OPENAI_API_KEY \"$(get_env_value OPENAI_API_KEY)\""
echo "  npx convex env set FIRECRAWL_API_KEY \"$(get_env_value FIRECRAWL_API_KEY)\""
echo "  npx convex env set R2_ACCOUNT_ID \"$(get_env_value R2_ACCOUNT_ID)\""
echo "  npx convex env set R2_ACCESS_KEY_ID \"$(get_env_value R2_ACCESS_KEY_ID)\""
echo "  npx convex env set R2_SECRET_ACCESS_KEY \"$(get_env_value R2_SECRET_ACCESS_KEY)\""
echo "  npx convex env set R2_BUCKET_NAME \"$(get_env_value R2_BUCKET_NAME)\""
echo "  npx convex env set R2_PUBLIC_URL \"$(get_env_value R2_PUBLIC_URL)\""
echo "  npx convex env set HOST_URL \"$(get_env_value HOST_URL)\""
echo "  npx convex env set SITE_URL \"$(get_env_value SITE_URL)\""
echo ""
echo "======================================================"
echo ""
echo "💡 TIP: After setting variables, restart your Convex dev server:"
echo "   npm run dev:backend"
echo ""

