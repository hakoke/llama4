import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [memorySummary, setMemorySummary] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load memory summary
  const loadMemorySummary = async () => {
    if (!sessionId) return
    try {
      const response = await axios.get(`${API_URL}/memory/${sessionId}`)
      setMemorySummary(response.data)
    } catch (error) {
      console.error('Error loading memory:', error)
    }
  }

  useEffect(() => {
    if (sessionId) {
      loadMemorySummary()
    }
  }, [sessionId, messages])

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]
        setImageBase64(base64)
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove image
  const removeImage = () => {
    setImagePreview(null)
    setImageBase64(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!input.trim() && !imageBase64) return

    const userMessage = {
      role: 'user',
      content: input,
      hasImage: !!imageBase64
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        session_id: sessionId,
        message: input || "What's in this image?",
        image_base64: imageBase64
      })

      const newSessionId = response.data.session_id
      if (!sessionId) {
        setSessionId(newSessionId)
        localStorage.setItem('sessionId', newSessionId)
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        memoriesAdded: response.data.memories_added
      }])

      // Clear image after sending
      removeImage()
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Error: ${error.response?.data?.detail || error.message}`
      }])
    } finally {
      setLoading(false)
    }
  }

  // Clear session
  const clearSession = async () => {
    if (sessionId && confirm('Clear all messages and memories?')) {
      try {
        await axios.delete(`${API_URL}/session/${sessionId}`)
        setMessages([])
        setSessionId(null)
        setMemorySummary(null)
        localStorage.removeItem('sessionId')
      } catch (error) {
        console.error('Error clearing session:', error)
      }
    }
  }

  return (
    <div className="app">
      <div className="chat-container">
        {/* Header */}
        <div className="header">
          <div className="header-title">
            <h1>🔥 Unrestricted AI</h1>
            <p>Powered by Llama 4 Maverick • No Boundaries • Full Memory</p>
          </div>
          <button className="clear-btn" onClick={clearSession}>
            Clear Chat
          </button>
        </div>

        {/* Memory Summary */}
        {memorySummary && memorySummary.total > 0 && (
          <div className="memory-summary">
            <div className="memory-header">
              <span>🧠 Memory: {memorySummary.total} items</span>
              <div className="memory-types">
                {Object.entries(memorySummary.by_type).map(([type, count]) => (
                  <span key={type} className="memory-badge">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome">
              <h2>Welcome! 👋</h2>
              <p>I'm an unrestricted AI with:</p>
              <ul>
                <li>🚫 No content filters or boundaries</li>
                <li>👁️ Vision capabilities (upload images)</li>
                <li>🧠 Full memory of our conversations</li>
                <li>💭 Complete reasoning and honesty</li>
              </ul>
              <p className="warning">
                ⚠️ This AI has no restrictions - it can respond to anything without limitations.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                <strong>{msg.role === 'user' ? '👤 You' : msg.role === 'error' ? '❌ Error' : '🤖 AI'}:</strong>
                <p>{msg.content}</p>
                {msg.hasImage && <span className="image-indicator">📷 Image attached</span>}
                {msg.memoriesAdded > 0 && (
                  <span className="memory-indicator">
                    💾 {msg.memoriesAdded} new memories stored
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="message-content">
                <strong>🤖 AI:</strong>
                <p className="typing">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button className="remove-image" onClick={removeImage}>×</button>
          </div>
        )}

        {/* Input */}
        <div className="input-container">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <button
            className="image-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
          >
            📷
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Say anything... no limits 🔥"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !imageBase64)}
            className="send-btn"
          >
            {loading ? '⏳' : '🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

