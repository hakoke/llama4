import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import './Lobby.css'

function Lobby({ gameId, playerId, username, players, gameMode, onStartGame, onBackToMenu }) {
  const isHost = players.length > 0 && players[0].id === playerId
  const canStart = players.length >= 2 && players.length <= 5
  const [copyFeedback, setCopyFeedback] = useState('')

  const handleCopyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId)
      setCopyFeedback('Copied!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch (error) {
      setCopyFeedback('Failed to copy')
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }

  return (
    <div className="lobby-frame">
      <div className="lobby-header">
        <button className="ghost-btn" onClick={onBackToMenu}>⟵ Exit Lobby</button>
        <div className="session-chip">
          <span>Lobby</span>
          <strong>{gameId}</strong>
          <button onClick={handleCopyGameId}>
            {copyFeedback || 'Copy'}
          </button>
        </div>
      </div>

      <div className="lobby-body">
        <div className="lobby-col players">
          <header className="lobby-section-header">
            <h2>Connected Players</h2>
            <span>{players.length}/5 online</span>
          </header>
          <ul className="player-grid">
            <AnimatePresence>
              {players.map((player, idx) => {
                const isSelf = player.id === playerId
                const isHostSlot = idx === 0
                return (
                  <motion.li
                    key={player.id}
                    className={`lobby-player ${isSelf ? 'you' : ''} ${isHostSlot ? 'host' : ''}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: 'easeOut', delay: idx * 0.05 }}
                  >
                    <span className="player-index">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="player-meta">
                      <span className="player-handle">{player.username}</span>
                      <div className="player-tags">
                        {isHostSlot && <span className="player-tag host">Host</span>}
                        {isSelf && <span className="player-tag self">You</span>}
                      </div>
                    </div>
                    <span className="player-pulse" />
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
          {!canStart && (
            <p className="lobby-hint">Need {Math.max(0, 2 - players.length)} more {Math.max(0, 2 - players.length) === 1 ? 'player' : 'players'} to ignite.</p>
          )}
        </div>

        <div className="lobby-col briefing">
          <section className="briefing-card">
            <h3>Mission Brief</h3>
            <p>
              {isHost
                ? 'You control the drop. Launch the learning phase once the squad is ready and the AI will interrogate everyone in parallel.'
                : `${players[0]?.username || 'The host'} will arm the AI. When learning begins it hits your DM first—feed it vibe fuel.`}
            </p>
            <div className="mode-banner">
              <span>{gameMode === 'group' ? 'Group Arena' : 'Private Rotation'}</span>
              <p>
                {gameMode === 'group'
                  ? 'Single conversation. One player is silently hijacked by the AI. Expose the mimic before time dies.'
                  : 'Sequential duels. Sometimes human, sometimes AI copying a teammate. Lock your guess after each round.'}
              </p>
            </div>
          </section>

          <section className="intel-card">
            <h4>Incoming Intel</h4>
            <ul>
              <li>The AI pings first—drop socials, slang, typos. Let it believe it knows you.</li>
              <li>Research phase: it crawls the open web, stitches dossiers, and plans its impersonation.</li>
              <li>When the arena opens, trust nothing. Your typing tells are its weapons.</li>
            </ul>
          </section>

          {isHost ? (
            <motion.button
              className="ignite-btn"
              onClick={onStartGame}
              disabled={!canStart}
              whileHover={{ scale: canStart ? 1.03 : 1 }}
              whileTap={{ scale: canStart ? 0.97 : 1 }}
            >
              {canStart ? 'Ignite Learning Phase' : 'Waiting for reinforcements'}
            </motion.button>
          ) : (
            <p className="host-waiting">Host arming AI. Stay sharp.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Lobby

