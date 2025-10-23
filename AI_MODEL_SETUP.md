# AI Model Configuration

## Issues Fixed ✅

### 1. Database Schema Issues
- ✅ Added missing columns to `players` table: `alias`, `alias_color`, `alias_badge`
- ✅ Added missing columns to `game_messages` table: `display_alias`, `alias_badge`, `latency_ms`, `alias_color`

### 2. AI Model Configuration
- ✅ Made model names configurable in `config.py`
- ✅ Added better error handling and logging
- ✅ Improved fallback responses when AI is unavailable

## Current AI Model Setup ✅

Your app is configured to use a **local vLLM server** at `http://98.85.228.199:8000`

**Current Model:** `Qwen/Qwen2.5-14B-Instruct-AWQ` ✅ CONFIGURED

### Upgrading to 32B (When Ready)

When you upgrade your vLLM server, just change ONE line in `backend/config.py`:

```python
local_model_name: str = "Qwen/Qwen2.5-32B-Instruct-AWQ"  # Changed from 14B to 32B
```

That's it! The app will automatically use the new model.

## Configuration Options

### Use OpenRouter as Backup (Optional)

If you want a backup when your EC2 server is down:

1. Get an API key from https://openrouter.ai/
2. Update `backend/config.py`:
```python
use_local_model: bool = False  # Switch to OpenRouter
openrouter_api_key: str = "YOUR-API-KEY-HERE"
```

3. Or use environment variables:
```bash
export USE_LOCAL_MODEL=false
export OPENROUTER_API_KEY=your-key-here
```

### Verify EC2 Server is Running

Check if your vLLM server is accessible:

```bash
curl http://98.85.228.199:8000/v1/models
```

Should return your model list including `Qwen/Qwen2.5-14B-Instruct-AWQ`.

## Testing After Fix

1. Restart your backend server
2. Create a new game
3. Start the learning phase
4. The AI should now respond to messages

## Current Fallback Behavior

When the AI model fails, it will now:
- Log detailed error information
- Return a simple fallback message: "Hey! How's it going?"
- Allow the game to continue (won't crash)

This lets you play-test the game even if AI isn't working.

