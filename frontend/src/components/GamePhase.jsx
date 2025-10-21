import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './GamePhase.css'

function GamePhase({ gameMode, messages, players, onSendMessage, playerId, gameId, deadline, duration }) {
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(duration || (gameMode === 'group' ? 300 : 120))

  useEffect(() => {
    if (!deadline) return
    let triggered = false
    const tick = () => {
      const remaining = Math.max(0, Math.floor(deadline - Date.now() / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0 && !triggered) {
        triggered = true
        triggerVotingPhase()
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const triggerVotingPhase = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      await fetch(`${API_URL}/game/${gameId}/voting`, { method: 'POST' })
    } catch (error) {
      console.error('Error starting voting:', error)
    }
  }

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

  const resolvedName = (senderId) => {
    if (senderId === 'ai') return 'Synth'
    if (senderId === playerId) return 'You'
    return players.find((p) => p.id === senderId)?.username ?? 'Unknown'
  }

  return (
    <section className="play-arena">
      <header className="arena-header">
        <div>
          <span>{gameMode === 'group' ? 'Group Arena' : 'Private Rotation'}</span>
          <h2>{gameMode === 'group' ? 'One impostor. One room. Hunt the mimic.' : 'One-on-one mind games. Was it human or AI?'}</h2>
        </div>
        <div className="arena-timer">
          <span>Remaining</span>
          <strong>{formatTime(timeLeft)}</strong>
        </div>
      </header>

      <aside className="arena-sidebar">
        <h3>Live Roster</h3>
        <ul>
          {players.map((player) => (
            <li key={player.id} className={player.id === playerId ? 'you' : ''}>
              <span>{player.username}</span>
              {player.id === playerId && <small>you</small>}
            </li>
          ))}
        </ul>
      </aside>

      <div className="arena-chat">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isOwn = msg.sender_id === playerId
            const isAI = msg.impersonated_by === 'ai'
            return (
              <motion.div
                key={`${idx}-${msg.timestamp}`}
                className={`arena-message ${isOwn ? 'own' : ''} ${isAI ? 'ai' : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {!isOwn && <header>{resolvedName(msg.sender_id)}</header>}
                <p>{msg.content}</p>
                <time>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="arena-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={gameMode === 'group' ? 'Accuse, joke, bait... the AI is listening.' : 'Trust your gut? Call their bluff?'}
        />
        <motion.button
          onClick={handleSend}
          disabled={!input.trim()}
          whileHover={{ scale: input.trim() ? 1.03 : 1 }}
          whileTap={{ scale: input.trim() ? 0.96 : 1 }}
        >
          Send
        </motion.button>
      </div>

      <footer className="arena-footer">
        <span>Tip:</span>
        <p>The AI leans on perfect grammar, suspiciously quick replies, or over-eager slang. Watch for tells.</p>
      </footer>
    </section>
  )
}

export default GamePhase

