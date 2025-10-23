import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './LearningPhase.css'

function LearningPhase({ messages, onSendMessage, username, onBackToMenu, gameId, deadline, duration }) {
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(duration || 180)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const remaining = Math.max(0, Math.floor(deadline - Date.now() / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        triggerResearchPhase()
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline, gameId])

  const triggerResearchPhase = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      await fetch(`${API_URL}/game/${gameId}/research`, { method: 'POST' })
    } catch (error) {
      console.error('Error starting research:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const totalTime = duration || 180
  const progress = totalTime ? Math.min(100, ((totalTime - timeLeft) / totalTime) * 100) : 0

  useEffect(() => {
    // Only auto-scroll if user is near bottom (within 100px) or if it's the first message
    const chatContainer = chatEndRef.current?.parentElement
    if (!chatContainer) return
    
    const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100
    const isFirstMessage = messages.length === 1
    
    if (isNearBottom || isFirstMessage) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }

  return (
    <section className="learning-visor">
      <div className="visor-header">
        <button className="ghost-btn" onClick={onBackToMenu}>⟵ Leave Game</button>
        <div className="timer-dial">
          <svg viewBox="0 0 120 120">
            <circle className="dial-bg" cx="60" cy="60" r="52" />
            <circle
              className="dial-progress"
              cx="60"
              cy="60"
              r="52"
              style={{ strokeDashoffset: 326 - (326 * progress) / 100 }}
            />
          </svg>
          <span>{formatTime(timeLeft)}</span>
        </div>
        <div className="session-meta">
          <span>Learning Phase</span>
          <p>The AI mirrors your tone, mining quirks it will weaponize.</p>
        </div>
      </div>

      <div className="visor-body">
        <div className="dialog-feed">
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const isAI = msg.sender_id === 'ai'
              return (
                <motion.div
                  key={`${idx}-${msg.timestamp}`}
                  className={`neural-message ${isAI ? 'ai' : 'human'}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut', delay: idx * 0.02 }}
                >
                  <header>
                    <span>{isAI ? 'Neural Probe' : username || 'You'}</span>
                    <time>{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </header>
                  <p>{msg.content}</p>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
        <aside className="ai-intel">
          <h3>AI telemetry</h3>
          <ul>
            <li>✅ Capturing slang, emoji cadence, typo signatures</li>
            <li>🧠 Tracking handle parity across platforms</li>
            <li>🔍 Logging topics for deeper web pulls next phase</li>
          </ul>
        </aside>
      </div>

      <div className="visor-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Drop your response… feed the mimic."
        />
        <motion.button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
          whileHover={{ scale: input.trim() ? 1.02 : 1 }}
          whileTap={{ scale: input.trim() ? 0.96 : 1 }}
        >
          Transmit
        </motion.button>
      </div>
    </section>
  )
}

export default LearningPhase

