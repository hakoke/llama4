# 🔌 API Documentation

## Base URL

**Local Development:** `http://localhost:8000`
**Production:** `https://your-app.railway.app`

## Authentication

No authentication required (public API). Session management via `session_id`.

---

## Endpoints

### 1. Root
`GET /`

Get API information.

**Response:**
```json
{
  "message": "🔥 Unrestricted AI Chat API",
  "version": "1.0.0",
  "model": "Llama 4 Maverick",
  "features": ["vision", "memory", "unrestricted"]
}
```

---

### 2. Chat
`POST /chat`

Send a message and get AI response.

**Request Body:**
```json
{
  "session_id": "optional-uuid-string",
  "message": "Your message here",
  "image_base64": "optional-base64-encoded-image"
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "response": "AI response text",
  "memories_added": 3
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "session_id": null
  }'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Hello!",
    session_id: sessionId || null,
    image_base64: null
  })
});

const data = await response.json();
console.log(data.response);
```

**Example with Image:**
```javascript
// Convert image to base64
const fileReader = new FileReader();
fileReader.onloadend = async () => {
  const base64 = fileReader.result.split(',')[1];
  
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What's in this image?",
      session_id: sessionId,
      image_base64: base64
    })
  });
  
  const data = await response.json();
  console.log(data.response);
};
fileReader.readAsDataURL(imageFile);
```

---

### 3. Get Memory Summary
`GET /memory/{session_id}`

Get memory summary for a session.

**Response:**
```json
{
  "total": 15,
  "by_type": {
    "fact": 5,
    "preference": 3,
    "emotion": 2,
    "context": 3,
    "relationship": 2
  },
  "recent": [
    {
      "type": "preference",
      "content": "Loves pizza"
    },
    {
      "type": "fact",
      "content": "Works as a software developer"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/memory/your-session-id
```

---

### 4. Clear Session
`DELETE /session/{session_id}`

Clear all messages and memories for a session.

**Response:**
```json
{
  "message": "Session cleared"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:8000/session/your-session-id
```

---

### 5. Health Check
`GET /health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Data Models

### Message
```python
{
  "id": int,
  "session_id": str,
  "role": str,  # 'user' or 'assistant'
  "content": str,
  "image_url": str | None,
  "timestamp": datetime,
  "embedding": Vector | None
}
```

### Memory
```python
{
  "id": int,
  "session_id": str,
  "memory_type": str,  # 'fact', 'preference', 'emotion', 'context', 'relationship', 'other'
  "content": str,
  "confidence": float,  # 0.0 to 1.0
  "timestamp": datetime,
  "metadata": dict,
  "embedding": Vector | None
}
```

### Session
```python
{
  "id": str,  # UUID
  "user_name": str | None,
  "created_at": datetime,
  "last_active": datetime,
  "metadata": dict
}
```

---

## Error Responses

### 500 - Internal Server Error
```json
{
  "detail": "AI service error: [error message]"
}
```

### 422 - Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "message"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Rate Limits

No rate limits on local deployment. For production, consider adding rate limiting middleware.

---

## Memory System

### How It Works

1. **Automatic Inference**: AI analyzes each conversation and automatically extracts facts to remember
2. **Memory Types**:
   - `fact`: Objective information (age, location, job)
   - `preference`: Likes/dislikes
   - `emotion`: Emotional states or reactions
   - `context`: Situational information
   - `relationship`: Information about people in user's life
   - `other`: Anything else

3. **Confidence Scoring**: Each memory has a confidence score (0.0-1.0)
4. **Persistent Storage**: All memories stored in PostgreSQL with vector embeddings

### Memory Inference Example

**User:** "I hate Mondays"

**AI Response:** "Haha, join the club! Mondays are the worst..."

**Memories Created:**
```json
[
  {
    "type": "preference",
    "content": "Hates Mondays",
    "confidence": 1.0
  }
]
```

**User:** "I work as a software developer in San Francisco"

**Memories Created:**
```json
[
  {
    "type": "fact",
    "content": "Works as a software developer",
    "confidence": 1.0
  },
  {
    "type": "fact",
    "content": "Lives in or near San Francisco",
    "confidence": 0.9
  }
]
```

---

## Image Support

### Supported Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### Size Limits
- Max file size: 10MB (configurable)
- Recommended: < 2MB for faster processing

### How to Send Images

1. **Convert to Base64**:
```javascript
const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
```

2. **Send in Request**:
```json
{
  "message": "What's in this image?",
  "image_base64": "base64-string-here"
}
```

3. **AI Processes**: Llama 4 Maverick analyzes the image and responds

---

## WebSocket Support

Not currently implemented. Use HTTP polling for real-time updates or add WebSocket support:

```python
# Future enhancement
from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Handle real-time chat
```

---

## CORS Configuration

Currently configured to allow all origins for development:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, restrict to your domain:

```python
allow_origins=["https://yourdomain.com"]
```

---

## Example Integration

### React Component

```jsx
import { useState } from 'react';
import axios from 'axios';

function Chat() {
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    const response = await axios.post('http://localhost:8000/chat', {
      message,
      session_id: sessionId
    });

    setSessionId(response.data.session_id);
    setMessages([...messages, 
      { role: 'user', content: message },
      { role: 'assistant', content: response.data.response }
    ]);
    setMessage('');
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.role}: {msg.content}</div>
      ))}
      <input 
        value={message} 
        onChange={e => setMessage(e.target.value)} 
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

---

## Testing

### Test Chat Endpoint
```bash
# Basic message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# With session
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Remember me?",
    "session_id": "your-session-id-here"
  }'
```

### Test Health
```bash
curl http://localhost:8000/health
```

---

## Performance

- **Average Response Time**: 2-5 seconds (depends on message length)
- **With Images**: 5-10 seconds
- **Memory Inference**: ~1 second additional processing
- **Database Queries**: < 100ms

---

## Future Enhancements

- [ ] WebSocket support for real-time streaming
- [ ] Voice input/output
- [ ] Multi-user sessions
- [ ] Enhanced vector search for memories
- [ ] Conversation summaries
- [ ] Export conversation history

---

Built with ❤️ and 🔥 for unrestricted AI conversations!

