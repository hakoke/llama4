import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GamePhase from './GamePhase'
import './MindGamesStage.css'

function MindGamesStage({
  activeMindGame,
  mindGameReveals,
  players,
  aliases,
  deadline,
  onSendMessage,
  onSubmitResponse,
  submissionStatus,
  playerId,
  messages,
  typingIndicators,
  reducedMotion,
  onTyping,
  audioController,
  accessibilityMode
}) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setSubmitted(false)
    setAnswer('')
    setStatusMessage('')
  }, [activeMindGame])

  useEffect(() => {
    if (!deadline) return
    let warningTriggered = false
    let criticalTriggered = false
    
    const tick = () => {
      const remaining = Math.max(0, Math.floor(deadline - Date.now() / 1000))
      setTimeLeft(remaining)
      
      // Timer warnings for mind games
      if (remaining === 10 && !warningTriggered) {
        warningTriggered = true
        if (window.audioController) {
          window.audioController.playTimerWarning()
        }
        if (window.hapticController && window.hapticController.isAvailable()) {
          window.hapticController.timerWarning()
        }
      }
      
      if (remaining <= 3 && remaining > 0 && !criticalTriggered) {
        criticalTriggered = true
        if (window.audioController) {
          window.audioController.playTimerCritical()
        }
        if (window.hapticController && window.hapticController.isAvailable()) {
          window.hapticController.timerCritical()
        }
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const handleSubmit = () => {
    if (!answer.trim()) return
    onSubmitResponse?.({ mind_game_id: activeMindGame?.id, answer: answer.trim() })
    setSubmitted(true)
    setStatusMessage('Answer locked — watch the reveal queue')
  }

  const activeReveal = mindGameReveals.find((bundle) => bundle.sequence === activeMindGame?.sequence)

  const renderStatus = () => {
    const status = submissionStatus?.[activeMindGame?.id]
    if (!status) return statusMessage
    if (status.error === 'deadline_expired') return 'Missed the deadline — answer not submitted'
    if (status.status === 'pending') return 'Sending…'
    if (status.status === 'submitted') return 'Delivered'
    if (status.error) return `Error: ${status.error}`
    return statusMessage
  }

  return (
    <div className="mind-games-stage">
      <div className="mind-games-grid">
        <section className="mind-games-panel">
          <header>
            <span>Mind Games</span>
            <h2>{activeMindGame?.reveal_title || 'Decoded Prompt'}</h2>
          </header>

          <AnimatePresence mode="sync">
            {activeMindGame ? (
              <motion.div
                key={activeMindGame.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mind-game-card"
              >
                <div className="prompt">
                  <h3>Prompt #{activeMindGame.sequence}</h3>
                  <p>{activeMindGame.prompt}</p>
                </div>
                {activeMindGame.instructions && (
                  <div className="instructions">
                    <h4>Instructions</h4>
                    <p>{activeMindGame.instructions}</p>
                  </div>
                )}
                <footer>
                  <span>Time Left</span>
                  <strong>{timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : '--:--'}</strong>
                </footer>
              </motion.div>
            ) : (
              <motion.div
                key="no-active"
                className="mind-game-wait"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <h3>Waiting for next prompt…</h3>
                <p>Stay sharp. Watch the chat for tells while the AI tallies responses.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {activeMindGame && (
            <div className="mind-game-input">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={460}
                disabled={submitted}
                placeholder="Drop your answer privately. The reveal hits after the timer."
                aria-disabled={submitted}
              />
              <motion.button
                whileHover={{ scale: answer.trim() ? 1.03 : 1 }}
                whileTap={{ scale: answer.trim() ? 0.97 : 1 }}
                className="submit-btn"
                disabled={submitted || !answer.trim()}
                onClick={handleSubmit}
              >
                {submitted
                  ? submissionStatus?.[activeMindGame.id]?.status === 'submitted'
                    ? 'Delivered'
                    : 'Sending…'
                  : 'Send Answer'}
              </motion.button>
              {renderStatus() && <p className="submission-status" role="status">{renderStatus()}</p>}
            </div>
          )}
        </section>

        <section className="mind-games-reveal">
          <header>
            <span>Reveal Queue</span>
            <h3>Answers Unmasked</h3>
          </header>
          <div className="reveal-list">
            {mindGameReveals
              .sort((a, b) => a.sequence - b.sequence)
              .map((bundle) => (
                <div key={bundle.sequence} className="reveal-card">
                  <div className="reveal-header">
                    <h4>Prompt #{bundle.sequence}</h4>
                    <p>{bundle.prompt}</p>
                  </div>
                  <ul>
                    {bundle.responses?.map((entry, idx) => {
                      const aliasInfo = entry.alias ? { alias: entry.alias, badge: entry.alias_badge, color: entry.alias_color } : aliases?.[entry.player_id] || {}
                      return (
                        <li key={idx}>
                          <span className="alias-chip" style={{ borderColor: aliasInfo?.color }}>
                            <span className="alias-badge" style={{ backgroundColor: aliasInfo?.color }}>
                              {aliasInfo?.badge || '?'}
                            </span>
                            {aliasInfo?.alias || 'Unknown'}
                          </span>
                          <p>{entry.response}</p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="mind-games-chat">
        <GamePhase
          stage="mind_games"
          gameMode="group"
          messages={messages}
          players={players}
          onSendMessage={onSendMessage}
          playerId={playerId}
          deadline={deadline}
          aliases={aliases}
          duration={300}
          headerTag="Side Channel"
          headerTitle="Chat stays masked. Compare notes quietly while prompts roll."
          tipMessage="Don’t give your alias away. React cryptically and let others over-explain themselves."
          typingIndicators={typingIndicators}
          reducedMotion={reducedMotion}
          onTyping={onTyping}
        />
      </div>
    </div>
  )
}

const messagesForMindGames = (bundles) => {
  const entries = []
  bundles.forEach((bundle) => {
    bundle.responses?.forEach((response) => {
      if (response.chat_echo) entries.push(response.chat_echo)
    })
  })
  return entries
}

export default MindGamesStage


