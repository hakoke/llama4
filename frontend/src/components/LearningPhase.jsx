import { useState, useEffect, useRef } from 'react'
import './LearningPhase.css'

function LearningPhase({ messages, onSendMessage, username, onBackToMenu }) {
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const messagesEndRef = useRef(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const progress = ((180 - timeLeft) / 180) * 100
  
  return (
    <div className="learning-phase">
      <div className="phase-header">
        <button className="back-btn-small" onClick={onBackToMenu}>
          ← Leave Game
        </button>
        <h1>Learning Phase</h1>
        <p>The AI is getting to know you...</p>
      </div>
      
      <div className="timer-section">
        <div className="timer-circle">
          <svg className="timer-svg" viewBox="0 0 100 100">
            <circle
              className="timer-bg"
              cx="50"
              cy="50"
              r="45"
            />
            <circle
              className="timer-progress"
              cx="50"
              cy="50"
              r="45"
              style={{
                strokeDashoffset: 283 - (283 * progress) / 100
              }}
            />
          </svg>
          <div className="timer-text">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
      
      <div className="chat-container">
        <div className="messages-list">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.sender_id === 'ai' ? 'ai' : 'user'}`}
            >
              <div className="message-bubble">
                <span className="message-sender">
                  {msg.sender_id === 'ai' ? '🤖 AI' : `👤 ${username}`}
                </span>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-section">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your response..."
          />
          <button onClick={handleSend} disabled={!input.trim()}>
            Send 🚀
          </button>
        </div>
      </div>
      
      <div className="learning-tip">
        💡 Tip: The AI is observing your typing style, emoji usage, and personality!
      </div>
    </div>
  )
}

export default LearningPhase

