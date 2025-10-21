import { useState } from 'react'
import './VotingPhase.css'

function VotingPhase({ players, gameMode, onSubmitVote }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  
  const handleVote = () => {
    if (selectedPlayer) {
      const voteData = gameMode === 'group' 
        ? { voted_ai_id: selectedPlayer }
        : { guessed_partner_id: selectedPlayer }
      
      onSubmitVote(voteData)
      setSubmitted(true)
    }
  }
  
  return (
    <div className="voting-phase">
      <div className="voting-content">
        <h1 className="voting-title">
          {gameMode === 'group' ? '🤔 Who is the AI?' : '🤔 Who did you talk to?'}
        </h1>
        
        <p className="voting-instruction">
          {gameMode === 'group'
            ? 'Vote for who you think was being impersonated by the AI'
            : 'Guess who you were chatting with this round'}
        </p>
        
        {!submitted ? (
          <>
            <div className="players-grid">
              {players.map(player => (
                <div
                  key={player.id}
                  className={`player-vote-card ${selectedPlayer === player.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlayer(player.id)}
                >
                  <div className="player-vote-avatar">
                    {player.username[0].toUpperCase()}
                  </div>
                  <div className="player-vote-name">{player.username}</div>
                  {selectedPlayer === player.id && (
                    <div className="selection-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              className="submit-vote-btn"
              onClick={handleVote}
              disabled={!selectedPlayer}
            >
              Submit Vote
            </button>
          </>
        ) : (
          <div className="vote-submitted">
            <div className="checkmark-animation">✅</div>
            <h2>Vote Submitted!</h2>
            <p>Waiting for other players...</p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VotingPhase

