import { useState, useEffect, useRef } from 'react'
import './GamePhase.css'

function GamePhase({ gameMode, messages, players, onSendMessage, playerId }) {
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(gameMode === 'group' ? 300 : 120)
  const messagesEndRef = useRef(null)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
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
  
  const getPlayerName = (senderId) => {
    if (senderId === 'ai') return '❓'
    if (senderId === playerId) return 'You'
    const player = players.find(p => p.id === senderId)
    return player ? player.username : 'Unknown'
  }
  
  return (
    <div className="game-phase">
      <div className="game-header">
        <div className="game-info">
          <h1>{gameMode === 'group' ? '👥 Group Chat' : '💬 Private Chat'}</h1>
          <p className="game-objective">
            {gameMode === 'group' 
              ? 'One of you is the AI. Can you find them?'
              : 'Are you talking to a real person or the AI?'}
          </p>
        </div>
        
        <div className="game-timer">
          <span className="timer-icon">⏱️</span>
          <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>
      </div>
      
      <div className="participants-bar">
        {players.map(player => (
          <div 
            key={player.id}
            className={`participant ${player.id === playerId ? 'you' : ''}`}
          >
            <div className="participant-avatar">
              {player.username[0].toUpperCase()}
            </div>
            <span className="participant-name">
              {player.id === playerId ? 'You' : player.username}
            </span>
          </div>
        ))}
      </div>
      
      <div className="chat-area">
        <div className="messages-container">
          {messages.map((msg, idx) => {
            const isOwn = msg.sender_id === playerId
            const sender = getPlayerName(msg.sender_id)
            
            return (
              <div
                key={idx}
                className={`chat-message ${isOwn ? 'own' : 'other'}`}
              >
                {!isOwn && <span className="message-sender-name">{sender}</span>}
                <div className="message-content">
                  {msg.content}
                </div>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="message-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="message-input"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
      
      <div className="game-hint">
        🔍 Look for unusual typing patterns, unnatural responses, or perfect grammar!
      </div>
    </div>
  )
}

export default GamePhase

