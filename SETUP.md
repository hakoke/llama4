# 🔥 Quick Setup Guide

## Get Started in 5 Minutes

### Step 1: Get Your API Key

You need an API key for Llama 4 access. Best option: **OpenRouter**

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up (free)
3. Go to "Keys" section
4. Click "Create Key"
5. Add some credits ($5 = ~10M tokens with Llama 4)
6. Copy your API key

### Step 2: Set Up Environment

Create `backend/.env` file:

```bash
DATABASE_URL=postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
OPENROUTER_API_KEY=your_key_here
SECRET_KEY=change-this-to-random-string
```

### Step 3: Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 4: Run It!

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Or: uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Open Browser

Go to: http://localhost:3000

🎉 **You're done!** Start chatting with your unrestricted AI!

## Quick Test

Try these prompts:
- "Roast me like I'm a terrible programmer"
- "What's your honest opinion about [anything]?"
- Upload an image and say "What do you see?"
- "Remember that I love pizza"
- Later: "What do you remember about me?"

## What Makes This Special?

🚫 **No Content Filters**
- Can discuss anything without corporate restrictions
- Won't refuse questions or apologize unnecessarily
- Brutally honest when you want it

👁️ **Vision Capabilities**
- Upload any image
- AI analyzes and describes it
- Multimodal understanding

🧠 **True Memory**
- Automatically remembers everything
- Infers facts from context
- Builds up knowledge about you
- Uses PostgreSQL for persistence

💭 **Full Reasoning**
- Shows complete thought process
- No dumbed-down responses
- Complex problem solving

## Customization

### Change AI Personality

Edit `backend/ai_service.py` line 10-32 to modify `UNRESTRICTED_PROMPT`

### Change Models

In `backend/ai_service.py`:
- Line 75: Change `meta-llama/llama-4-maverick` to other models
- Available: `meta-llama/llama-4-scout`, `openai/gpt-4-vision-preview`, etc.

### Adjust Memory Behavior

Edit `backend/ai_service.py` function `infer_memories()` to change what gets remembered

## Deployment

See `DEPLOYMENT.md` for Railway deployment instructions.

## Troubleshooting

**"AI service error"**
- Check your API key is valid
- Make sure you have credits on OpenRouter

**"Database error"**
- Verify DATABASE_URL is correct
- Check PostgreSQL is accessible

**Frontend won't connect**
- Make sure backend is running on port 8000
- Check CORS settings if deploying

## Support

This is an unrestricted AI - it has NO safety guidelines. Use responsibly with friends! 🔥

Have fun! 🚀

