import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './VotingPhase.css'

const questionCopy = {
  group: {
    title: 'Who is the AI impostor?',
    subtitle: 'Lock in the identity of the mimic before the reveal.'
  },
  private: {
    title: 'Who did you talk to?',
    subtitle: 'Call the bluff. Was it a teammate or the AI puppeting them?'
  }
}

function VotingPhase({ players, gameMode, onSubmitVote }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const { title, subtitle } = questionCopy[gameMode] || questionCopy.group

  const playerCards = useMemo(() => (
    players.map((player, idx) => (
      <motion.button
        key={player.id}
        className={`ballot-card ${selectedPlayer === player.id ? 'selected' : ''}`}
        onClick={() => setSelectedPlayer(player.id)}
        whileHover={{ translateY: -6 }}
        whileTap={{ scale: 0.97 }}
        transition={{ delay: idx * 0.05 }}
      >
        <span className="ballot-initial">{player.username[0].toUpperCase()}</span>
        <strong>{player.username}</strong>
        <small>{selectedPlayer === player.id ? 'Chosen' : 'Tap to accuse'}</small>
      </motion.button>
    ))
  ), [players, selectedPlayer])

  const handleVote = () => {
    if (!selectedPlayer) return
    const voteData = gameMode === 'group'
      ? { voted_ai_id: selectedPlayer }
      : { guessed_partner_id: selectedPlayer }
    onSubmitVote(voteData)
    setSubmitted(true)
  }

  return (
    <section className="ballot">
      <header className="ballot-header">
        <span>Judgement Phase</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="selection"
            className="ballot-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="ballot-grid">
              {playerCards}
            </div>
            <motion.button
              className="ballot-submit"
              onClick={handleVote}
              disabled={!selectedPlayer}
              whileHover={{ scale: selectedPlayer ? 1.03 : 1 }}
              whileTap={{ scale: selectedPlayer ? 0.97 : 1 }}
            >
              Lock Vote
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            className="ballot-wait"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="ballot-wait__icon">✅</div>
            <h3>Vote submitted</h3>
            <p>Awaiting the rest of the squad… stay ready for the reveal.</p>
            <div className="ballot-wait__dots">
              <span></span><span></span><span></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default VotingPhase

