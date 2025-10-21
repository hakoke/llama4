# 🚀 DEPLOY NOW - Step by Step

## ✅ EC2 IP Added: `44.192.31.111`
## ✅ Serper Key: Ready
## ✅ Database: Ready
## ✅ Code: Complete

---

# 🎯 EXACT STEPS TO DEPLOY:

## Step 1: Test Locally (5 minutes)

### Open 2 Terminal Windows:

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python main_game.py
```

Wait for: `"Uvicorn running on http://0.0.0.0:8000"`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Wait for: `"Local: http://localhost:3000"`

**Then open browser:** http://localhost:3000

**Test it works!** (Create a game, join, send a message)

If it works locally, proceed to Step 2!

---

## Step 2: Push to GitHub (2 minutes)

```bash
git init
git add .
git commit -m "AI Impostor Game - Complete"
git branch -M main
git remote add origin https://github.com/hakoke/llama4
git push -u origin main
```

---

## Step 3: Deploy Backend to Railway (5 minutes)

1. Go to: https://railway.app
2. Click **"New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select: **hakoke/llama4**
5. Click **"Add variables"**
6. Add these:

```
DATABASE_URL = postgresql://postgres:wlfrfCfSOCDAKFwzOqRogeixzVOXiyET@turntable.proxy.rlwy.net:39953/railway

LOCAL_MODEL_URL = http://44.192.31.111:8000

USE_LOCAL_MODEL = true

SERPER_API_KEY = 7fcc6bcced0d9c273f6368ed725e6e2753017935

SECRET_KEY = ai-impostor-game-secret-2025

FRONTEND_URL = https://your-frontend.railway.app
```

(We'll update FRONTEND_URL after frontend deploys)

7. Under **"Settings"**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main_game.py`

8. Click **"Deploy"**

9. **Wait 2-3 minutes**

10. **Copy the backend URL** (looks like: `https://llama4-backend-production.up.railway.app`)

---

## Step 4: Deploy Frontend to Railway (5 minutes)

1. In Railway, click **"New"** → **"GitHub Repo"**
2. Select: **hakoke/llama4** again
3. Click **"Add variables"**:

```
VITE_API_URL = https://your-backend-url.railway.app
VITE_WS_URL = wss://your-backend-url.railway.app
```

(Replace with your actual backend URL from Step 3)

4. Under **"Settings"**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`

5. Click **"Deploy"**

6. **Wait 2-3 minutes**

7. **Copy the frontend URL**

---

## Step 5: Update Backend with Frontend URL (1 minute)

1. Go back to **Backend** service in Railway
2. Update the variable:
   ```
   FRONTEND_URL = https://your-frontend-url.railway.app
   ```
3. Click **"Save"**
4. Backend will redeploy automatically

---

## Step 6: PLAY! 🎮

Open your frontend URL in browser!

**It's LIVE!**

Invite friends, play the game, watch the AI fool everyone! 🔥

---

# 🐛 If Something Goes Wrong:

## Backend won't start?
**Check Railway logs:**
- Click on backend service
- Click "Deployments"
- Click latest deployment
- View logs

**Common fixes:**
- Make sure all env vars are set
- Check DATABASE_URL is correct
- Verify EC2 is running (ping http://44.192.31.111:8000/health)

## Frontend won't connect?
**Check:**
- VITE_API_URL points to backend URL (with https://)
- VITE_WS_URL points to backend URL (with wss://)
- Backend is running

## Database errors?
**The database auto-initializes on first run!**
Just wait 30 seconds for tables to create.

## EC2 model not responding?
**Check EC2 is running:**
```bash
curl http://44.192.31.111:8000/v1/models
```

Should return model info.

If not, SSH into EC2 and restart vLLM:
```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --quantization awq \
  --host 0.0.0.0 \
  --port 8000 \
  --gpu-memory-utilization 0.9
```

---

# 📊 Monitoring:

**Backend URL:** Your Railway backend URL
**Frontend URL:** Your Railway frontend URL
**EC2 Model:** http://44.192.31.111:8000
**Database:** Railway PostgreSQL

**All systems should be:**
- ✅ Backend: Running
- ✅ Frontend: Running
- ✅ EC2: Running vLLM
- ✅ Database: Connected

---

# 🎉 SUCCESS INDICATORS:

**You'll know it's working when:**
1. Frontend loads (you see the menu screen)
2. You can create a game
3. You can join with a username
4. You can send a message
5. AI responds within 5 seconds
6. Everything looks BEAUTIFUL with animations

---

# 💰 Cost Reminder:

**Railway:** $5/month free credit (you're good!)
**Serper:** 2,500 free searches (you're good!)
**EC2 g5.2xlarge:** ~$1.21/hour ($0.40 on spot)

**Remember to STOP EC2 when not playing to save money!**

In AWS Console: EC2 → Instances → Select instance → Instance State → Stop

---

# 🚀 YOU'RE READY!

**Follow the steps above and you'll be live in ~20 minutes!**

The game is INSANE, the UI is GORGEOUS, the AI is UNRESTRICTED!

**GO DEPLOY IT!** 🔥

---

## Quick Deploy Checklist:

- [ ] Test locally (both backend and frontend work)
- [ ] Push to GitHub
- [ ] Deploy backend to Railway (add env vars!)
- [ ] Deploy frontend to Railway (add backend URL!)
- [ ] Update backend with frontend URL
- [ ] Test the live site
- [ ] Invite friends
- [ ] PLAY! 🎮

**Everything is ready. Just follow the steps!**

