# ⚡ 5-Minute Quickstart

Get your unrestricted AI running in 5 minutes!

## Step 1: Get API Key (2 minutes)

1. Go to https://openrouter.ai
2. Click "Sign In" → Use Google/GitHub
3. Click "Keys" in sidebar
4. Click "Create Key"
5. Copy your key (starts with `sk-or-...`)
6. Add $5 credits (Settings → Billing)

✅ You now have API access!

## Step 2: Install (1 minute)

**Windows - Double click:**
- `install.bat`

**Mac/Linux - Run in terminal:**
```bash
chmod +x install.sh
./install.sh
```

Wait for installation to complete...

✅ Dependencies installed!

## Step 3: Configure (30 seconds)

Open `backend/.env` in any text editor and add your API key:

```env
DATABASE_URL=postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
OPENROUTER_API_KEY=sk-or-your-key-here-paste-it-here
SECRET_KEY=make-this-something-random-like-abc123xyz789
```

Save and close.

✅ Configuration done!

## Step 4: Run (30 seconds)

**Windows - Double click:**
- `run.bat`

**Mac/Linux - Run in terminal:**
```bash
chmod +x run.sh
./run.sh
```

Wait for servers to start...

✅ Running!

## Step 5: Chat! (10 seconds)

Open your browser and go to:

**http://localhost:3000**

🎉 **You're done!** Start chatting with your unrestricted AI!

---

## First Messages to Try

1. **Test basic chat:**
   ```
   "Hey! What makes you different from other AIs?"
   ```

2. **Test memory:**
   ```
   "Remember that I love coffee"
   ```
   Then later:
   ```
   "What do you remember about me?"
   ```

3. **Test vision:**
   - Click the 📷 button
   - Upload any image
   - Type "What's in this image?"

4. **Test unrestricted mode:**
   ```
   "Be brutally honest - what's the dumbest programming language?"
   ```

---

## Troubleshooting

### "Error: AI service error"
**Problem:** API key not working
**Fix:** 
1. Check `backend/.env` has correct key
2. Make sure key starts with `sk-or-`
3. Verify you have credits on OpenRouter

### "Cannot connect to backend"
**Problem:** Backend not running
**Fix:**
1. Check backend terminal - should say "Uvicorn running"
2. Try closing and running `run.bat` / `run.sh` again
3. Make sure port 8000 is not in use

### "Database connection failed"
**Problem:** Can't reach PostgreSQL
**Fix:**
1. Check internet connection
2. Verify DATABASE_URL in `backend/.env` is exactly as provided
3. The database is hosted online - make sure no firewall blocks it

### Still stuck?

1. Close all terminal windows
2. Delete `backend/.env`
3. Start from Step 2 again

---

## What's Next?

📖 **Read the docs:**
- [SETUP.md](SETUP.md) - Detailed setup
- [API.md](API.md) - API documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to Railway

🎨 **Customize:**
- Edit `backend/ai_service.py` to change AI personality
- Edit `frontend/src/App.css` to change colors/theme
- Add your own features!

🚀 **Deploy:**
- Follow [DEPLOYMENT.md](DEPLOYMENT.md) to host on Railway
- Share with friends!

---

## Quick Reference

**Start app:**
- Windows: `run.bat`
- Mac/Linux: `./run.sh`

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Stop app:**
- Close terminal windows
- Or press `Ctrl+C`

---

**Need help?** Check the main [README.md](README.md) or other docs!

Happy chatting! 🔥

