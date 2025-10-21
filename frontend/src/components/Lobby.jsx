import { useState } from 'react'
import './Lobby.css'

function Lobby({ gameId, playerId, players, gameMode, onUpdateHandles, onStartGame }) {
  const [handles, setHandles] = useState({
    instagram: '',
    twitter: '',
    linkedin: '',
    tiktok: ''
  })
  const [handlesSubmitted, setHandlesSubmitted] = useState(false)
  
  const handleSubmitHandles = () => {
    const filledHandles = Object.fromEntries(
      Object.entries(handles).filter(([_, v]) => v.trim() !== '')
    )
    onUpdateHandles(filledHandles)
    setHandlesSubmitted(true)
  }
  
  const isHost = players.length > 0 && players[0].id === playerId
  const canStart = players.length >= 3 && players.length <= 8
  
  return (
    <div className="lobby-container">
      <div className="lobby-content">
        <h1 className="lobby-title">Game Lobby</h1>
        <div className="game-id-display">
          <span>Game ID:</span>
          <code>{gameId}</code>
          <button 
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(gameId)}
          >
            📋 Copy
          </button>
        </div>
        
        <div className="lobby-sections">
          <div className="players-section">
            <h2>Players ({players.length})</h2>
            <div className="players-list">
              {players.map((player, idx) => (
                <div key={player.id} className="player-card">
                  <span className="player-number">{idx + 1}</span>
                  <span className="player-name">{player.username}</span>
                  {player.id === playerId && <span className="you-badge">YOU</span>}
                  {idx === 0 && <span className="host-badge">HOST</span>}
                </div>
              ))}
            </div>
            {players.length < 3 && (
              <p className="waiting-message">Waiting for {3 - players.length} more player(s)...</p>
            )}
          </div>
          
          <div className="handles-section">
            <h2>Social Media Handles</h2>
            <p className="handles-hint">
              The AI will search for you online to learn more about you!
            </p>
            
            {!handlesSubmitted ? (
              <div className="handles-form">
                <input
                  type="text"
                  placeholder="Instagram username"
                  value={handles.instagram}
                  onChange={(e) => setHandles({...handles, instagram: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Twitter/X handle"
                  value={handles.twitter}
                  onChange={(e) => setHandles({...handles, twitter: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="LinkedIn profile"
                  value={handles.linkedin}
                  onChange={(e) => setHandles({...handles, linkedin: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="TikTok username"
                  value={handles.tiktok}
                  onChange={(e) => setHandles({...handles, tiktok: e.target.value})}
                />
                <button className="submit-handles-btn" onClick={handleSubmitHandles}>
                  Submit Handles
                </button>
              </div>
            ) : (
              <div className="handles-submitted">
                <span className="check-icon">✅</span>
                <p>Handles submitted!</p>
              </div>
            )}
          </div>
        </div>
        
        {isHost && (
          <div className="host-controls">
            <button 
              className="start-game-btn"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? 'Start Game 🚀' : `Need ${3 - players.length} more players`}
            </button>
          </div>
        )}
        
        {!isHost && (
          <p className="waiting-for-host">Waiting for host to start the game...</p>
        )}
        
        <div className="game-mode-info">
          <h3>Mode: {gameMode === 'group' ? '👥 Group' : '💬 Private'}</h3>
          <p>
            {gameMode === 'group' 
              ? 'Everyone will chat together. Find the AI impostor!'
              : '1-on-1 rounds. Guess who you talked to each round!'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Lobby

