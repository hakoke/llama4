import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './GamePhase.css'

function GamePhase({
  stage = 'playing',
  gameMode = 'group',
  messages = [],
  players,
  onSendMessage,
  playerId,
  gameId,
  deadline,
  duration = 300,
  aliases,
  onTimerExpired,
  headerTag,
  headerTitle,
  tipMessage,
  typingIndicators = {},
  submissionStatus = {},
  reducedMotion = false,
  onTyping
}) {
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!deadline) return
    let triggered = false
    let warningTriggered = false
    let criticalTriggered = false
    
    const tick = () => {
      const remaining = Math.max(0, Math.floor(deadline - Date.now() / 1000))
      setTimeLeft(remaining)
      
      // Timer warnings
      if (remaining === 10 && !warningTriggered) {
        warningTriggered = true
        // Audio warning at 10 seconds
        if (window.audioController) {
          window.audioController.playTimerWarning()
        }
        if (window.hapticController && window.hapticController.isAvailable()) {
          window.hapticController.timerWarning()
        }
      }
      
      if (remaining <= 3 && remaining > 0 && !criticalTriggered) {
        criticalTriggered = true
        // Critical warning at 3 seconds
        if (window.audioController) {
          window.audioController.playTimerCritical()
        }
        if (window.hapticController && window.hapticController.isAvailable()) {
          window.hapticController.timerCritical()
        }
      }
      
      if (remaining <= 0 && !triggered) {
        triggered = true
        onTimerExpired?.()
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline, onTimerExpired])

  useEffect(() => {
    if (input.trim() && !isTyping) {
      setIsTyping(true)
      onTyping?.(true)
    }
    if (!input.trim() && isTyping) {
      setIsTyping(false)
      onTyping?.(false)
    }
    const debounce = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        onTyping?.(false)
      }
    }, 1500)
    return () => clearTimeout(debounce)
  }, [input, isTyping, onTyping])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
      if (isTyping) {
        setIsTyping(false)
        onTyping?.(false)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const disableInput = useMemo(() => timeLeft <= 0, [timeLeft])

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }, [messages])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const resolvedAlias = (msg) => {
    if (msg.alias) return msg.alias
    const aliasEntry = aliases?.[msg.sender_id]
    if (aliasEntry) return aliasEntry.alias
    if (msg.sender_id === playerId) return 'You'
    if (msg.sender_id === 'ai' && msg.impersonated_by) {
      const targetAlias = aliases?.[msg.impersonated_by]
      if (targetAlias) return targetAlias.alias
    }
    return players.find((p) => p.id === msg.sender_id)?.username ?? 'Unknown'
  }

  return (
    <section className={`play-arena stage-${stage}`}>
      <header className="arena-header">
        <div>
          <span>{headerTag || (gameMode === 'group' ? 'Group Arena' : 'Private Rotation')}</span>
          <h2>{headerTitle || (gameMode === 'group' ? 'One impostor. One room. Hunt the mimic.' : 'One-on-one mind games. Was it human or AI?')}</h2>
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
              <div className="roster-alias">
                <span>{player.username}</span>
                <small>{aliases?.[player.id]?.alias || player.alias || 'Alias pending'}</small>
              </div>
              <div
                className={`typing-dot ${typingIndicators[player.id]?.isTyping ? 'active' : ''}`}
                aria-hidden="true"
                style={{ borderColor: aliases?.[player.id]?.color }}
              />
            </li>
          ))}
        </ul>
      </aside>

      <div className="arena-chat">
        <AnimatePresence initial={false}>
          {orderedMessages.map((msg, idx) => {
            const isOwn = msg.sender_id === playerId
            const isAI = msg.impersonated_by === 'ai'
            const aliasColor = msg.alias_color || aliases?.[msg.sender_id]?.color
            const aliasBadge = msg.alias_badge || aliases?.[msg.sender_id]?.badge || '?' 
            const typingHalo = typingIndicators[msg.sender_id]?.isTyping
            return (
              <motion.div
                key={`${idx}-${msg.timestamp}`}
                className={`arena-message ${isOwn ? 'own' : ''} ${isAI ? 'ai' : ''} ${typingHalo ? 'typing' : ''}`}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
                transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
                role="listitem"
              >
                {!isOwn && (
                  <header>
                    <span className="alias-shell" style={{ borderColor: aliasColor }}>
                      <span className="alias-badge" style={{ backgroundColor: aliasColor }}>
                        {aliasBadge}
                      </span>
                      <span>{resolvedAlias(msg)}</span>
                    </span>
                  </header>
                )}
                <p>{msg.content}</p>
                <time>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <div className="arena-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={gameMode === 'group' ? 'Accuse, joke, bait... the AI is listening.' : 'Trust your gut? Call their bluff?'}
          aria-disabled={disableInput}
          disabled={disableInput}
        />
        <motion.button
          onClick={handleSend}
          disabled={!input.trim() || disableInput}
          whileHover={{ scale: input.trim() && !disableInput ? 1.03 : 1 }}
          whileTap={{ scale: input.trim() && !disableInput ? 0.96 : 1 }}
        >
          {disableInput ? 'Locked' : 'Send'}
        </motion.button>
      </div>

      {tipMessage && (
        <footer className="arena-footer">
          <span>Tip:</span>
          <p>{tipMessage}</p>
        </footer>
      )}
    </section>
  )
}

export default GamePhase

