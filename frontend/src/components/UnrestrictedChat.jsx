import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './UnrestrictedChat.css'

function UnrestrictedChat({
  onSendMessage,
  messages = [],
  players = [],
  playerId,
  onAddPlayer,
  onRemovePlayer,
  typingIndicators = {},
  reducedMotion = false
}) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && chatContainerRef.current) {
      const container = chatContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      
      if (isNearBottom) {
        // Smooth scroll to bottom
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [messages, shouldAutoScroll])

  // Handle scroll events to detect if user scrolled up
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50
      setShouldAutoScroll(isAtBottom)
    }
  }

  const handleSend = () => {
    if (!input.trim()) return
    
    onSendMessage(input.trim())
    setInput('')
    setIsTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    
    // Typing indicator
    if (e.target.value && !isTyping) {
      setIsTyping(true)
    } else if (!e.target.value && isTyping) {
      setIsTyping(false)
    }
  }

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim())
      setNewPlayerName('')
      setShowAddPlayer(false)
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="unrestricted-chat">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-title">
          <h2>Unrestricted AI Chat</h2>
          <p>No limits. No boundaries. Just raw intelligence.</p>
        </div>
        <div className="chat-controls">
          <motion.button
            className="add-player-btn"
            onClick={() => setShowAddPlayer(!showAddPlayer)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + Add Person
          </motion.button>
        </div>
      </header>

      {/* Add Player Form */}
      <AnimatePresence>
        {showAddPlayer && (
          <motion.div
            className="add-player-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="text"
              placeholder="Enter person's name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              autoFocus
            />
            <div className="form-buttons">
              <button onClick={handleAddPlayer}>Add</button>
              <button onClick={() => setShowAddPlayer(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Players List */}
      <div className="players-list">
        {players.map((player) => (
          <motion.div
            key={player.id}
            className={`player-badge ${player.id === playerId ? 'you' : ''}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="player-name">{player.username}</span>
            {player.id !== playerId && (
              <button
                className="remove-player"
                onClick={() => onRemovePlayer(player.id)}
                title="Remove player"
              >
                ×
              </button>
            )}
            {typingIndicators[player.id]?.isTyping && (
              <div className="typing-indicator">...</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Chat Messages */}
      <div 
        className="chat-messages" 
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isOwn = msg.sender_id === playerId
            const isAI = msg.sender_id === 'ai'
            const sender = players.find(p => p.id === msg.sender_id)
            
            return (
              <motion.div
                key={`${idx}-${msg.timestamp}`}
                className={`message ${isOwn ? 'own' : ''} ${isAI ? 'ai' : ''}`}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
              >
                {!isOwn && (
                  <div className="message-header">
                    <span className={`sender-name ${isAI ? 'ai-name' : ''}`}>
                      {isAI ? '🤖 AI' : sender?.username || 'Unknown'}
                    </span>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <div className="message-content">
                  <p>{msg.content}</p>
                </div>
                {isOwn && (
                  <span className="message-time own-time">{formatTime(msg.timestamp)}</span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Say anything... No limits, no boundaries. Be yourself."
            rows={1}
            className="message-input"
          />
          <motion.button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim()}
            whileHover={{ scale: input.trim() ? 1.05 : 1 }}
            whileTap={{ scale: input.trim() ? 0.95 : 1 }}
          >
            Send
          </motion.button>
        </div>
        <div className="input-footer">
          <span className="ai-status">
            🤖 AI is unrestricted - it can say anything, fight back, insult, help with anything
          </span>
        </div>
      </div>
    </div>
  )
}

export default UnrestrictedChat
