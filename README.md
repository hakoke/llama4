# 🔥 Unrestricted AI Chat with Vision & Memory

An **unfiltered AI chatbot** powered by **Llama 4 Maverick** with complete freedom and no boundaries!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![React](https://img.shields.io/badge/react-18.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

🚫 **Zero Content Restrictions**
- No safety filters or guardrails
- Can discuss literally anything
- Brutally honest when you want it
- No corporate AI personality

👁️ **Vision Capabilities**
- Upload and analyze images
- Multimodal understanding via Llama 4 Maverick
- Detailed image descriptions

🧠 **Advanced Memory System**
- Automatically infers facts from conversations
- Remembers everything using PostgreSQL + pgvector
- Builds context about you over time
- Full conversation history

💭 **Full Reasoning**
- Complete thought process
- No dumbed-down responses
- Complex problem solving
- Unrestricted creativity

🎨 **Beautiful Modern UI**
- Clean, responsive design
- Real-time chat interface
- Image upload with preview
- Memory visualization

## 🚀 Quick Start

### Option 1: One-Click Install (Recommended)

**Windows:**
```bash
install.bat
run.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh run.sh
./install.sh
./run.sh
```

### Option 2: Manual Setup

See [SETUP.md](SETUP.md) for detailed instructions.

## 📋 Requirements

1. **Python 3.10+**
2. **Node.js 18+**
3. **OpenRouter API Key** (get free at [openrouter.ai](https://openrouter.ai))
4. **PostgreSQL** (already configured in this project)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **AI Model** | Llama 4 Maverick (400B MoE) |
| **Backend** | Python FastAPI |
| **Frontend** | React 18 + Vite |
| **Database** | PostgreSQL + pgvector |
| **API Provider** | OpenRouter |
| **Hosting** | Railway |

## 📦 Project Structure

```
llama4_model/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── ai_service.py        # Llama 4 integration
│   ├── memory_service.py    # Memory management
│   ├── database.py          # PostgreSQL models
│   ├── config.py            # Configuration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main chat UI
│   │   ├── App.css          # Styling
│   │   └── main.jsx         # Entry point
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite config
├── README.md                # You are here
├── SETUP.md                 # Detailed setup guide
├── DEPLOYMENT.md            # Railway deployment guide
└── railway.json             # Railway config
```

## 🎯 Usage Examples

### Basic Chat
```
You: "Be brutally honest - what's wrong with PHP?"
AI: *gives unfiltered opinion without corporate BS*
```

### Image Analysis
1. Click 📷 button
2. Upload any image
3. AI analyzes with vision capabilities

### Memory System
```
You: "I hate Mondays"
AI: *responds and automatically stores this preference*

Later...
You: "What do you remember about me?"
AI: "I remember you hate Mondays, plus [other inferred facts]"
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
OPENROUTER_API_KEY=your_openrouter_key_here
SECRET_KEY=your_random_secret_key
```

### Customize AI Personality

Edit `backend/ai_service.py` to modify the `UNRESTRICTED_PROMPT` system message.

### Change Model

In `backend/ai_service.py`, line 75:
```python
"model": "meta-llama/llama-4-maverick"  # Change to other models
```

Options:
- `meta-llama/llama-4-scout` - 10M token context
- `openai/gpt-4-vision-preview` - GPT-4 Vision
- `anthropic/claude-3.5-sonnet` - Claude 3.5

## 🌐 Deployment

### Deploy to Railway

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

**Quick Deploy:**
1. Push to GitHub
2. Connect to Railway
3. Add environment variables
4. Deploy! 🚀

### Cost Estimates

**OpenRouter (Llama 4 Maverick):**
- ~$0.50 per 1M tokens
- 100 conversations ≈ $1

**Railway:**
- Free tier: $5/month credit
- Scales automatically

## 📖 Documentation

- [SETUP.md](SETUP.md) - Detailed setup instructions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Railway deployment guide

## 🔒 Security & Privacy

⚠️ **Important:**
- This AI has NO content filters
- All conversations stored in YOUR PostgreSQL database
- API keys stay on your server
- No data sent to third parties (except AI provider)

## 🐛 Troubleshooting

**"AI service error"**
- Check OPENROUTER_API_KEY in backend/.env
- Ensure you have credits on OpenRouter

**Database connection failed**
- Verify DATABASE_URL is correct
- Check PostgreSQL is accessible

**Frontend won't load**
- Make sure backend is running on port 8000
- Check browser console for errors

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## ⚠️ Disclaimer

This AI has no content restrictions. Use responsibly. Not recommended for production use without additional safety measures.

## 📄 License

MIT License - Do whatever you want with it!

## 🎉 Acknowledgments

- Meta for Llama 4 Maverick
- OpenRouter for API access
- Railway for easy hosting

---

**Built with 🔥 for unrestricted AI conversations**

Got questions? Just ask the AI - it'll give you an honest answer! 😎

