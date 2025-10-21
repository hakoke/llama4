# 🚀 Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **OpenRouter API Key**: Get one at [openrouter.ai](https://openrouter.ai) for Llama 4 access
3. **PostgreSQL Database**: Already configured (provided connection string)

## Deployment Steps

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Unrestricted AI Chat"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy on Railway

#### Option A: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set OPENROUTER_API_KEY=your_key_here
railway variables set DATABASE_URL=postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
railway variables set SECRET_KEY=your_secret_key_here

# Deploy
railway up
```

#### Option B: Using Railway Dashboard

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
   - `DATABASE_URL`: `postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway`
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `SECRET_KEY`: Generate a random secret key
5. Click "Deploy"

### 3. Environment Variables

Set these in Railway dashboard under "Variables":

```env
DATABASE_URL=postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
OPENROUTER_API_KEY=your_openrouter_api_key
SECRET_KEY=your_random_secret_key_change_this
```

**Optional** (if Llama 4 not available on OpenRouter):
```env
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

### 4. Database Setup

The database will auto-initialize on first run. The app will:
- Create necessary tables (`messages`, `memories`, `sessions`)
- Enable pgvector extension
- Set up indexes

### 5. Access Your App

Once deployed, Railway will give you a URL like:
```
https://your-app-name.up.railway.app
```

Visit this URL to use your unrestricted AI chat!

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on: http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

## API Endpoints

- `POST /chat` - Send message and get response
- `GET /memory/{session_id}` - Get memory summary
- `DELETE /session/{session_id}` - Clear session
- `GET /health` - Health check

## Getting OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up / Login
3. Go to Keys section
4. Create new API key
5. Add credits (Llama 4 Maverick is ~$0.50 per 1M tokens)

## Troubleshooting

### Database Connection Issues

Make sure DATABASE_URL is exactly:
```
postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
```

### Llama 4 Not Available

The app will automatically fallback to:
1. GPT-4 Vision (via OpenRouter)
2. Claude 3.5 Sonnet (if ANTHROPIC_API_KEY set)

### Memory Not Working

Check that pgvector extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Features

✅ Unrestricted AI responses (no content filters)
✅ Vision capabilities (image understanding)
✅ Persistent memory with PostgreSQL
✅ Automatic context inference
✅ Beautiful modern UI
✅ Mobile responsive

## Cost Estimates

**OpenRouter (Llama 4 Maverick)**:
- ~$0.50 per 1M tokens
- Average conversation: ~10-20K tokens
- 100 conversations ≈ $1

**Railway**:
- Free tier: $5 credit/month
- Scales automatically

Enjoy your unrestricted AI! 🔥

