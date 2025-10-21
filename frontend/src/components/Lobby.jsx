import { useState } from 'react'
import './Lobby.css'

function Lobby({ gameId, playerId, username, players, gameMode, onStartGame, onBackToMenu }) {
  const isHost = players.length > 0 && players[0].id === playerId
  const canStart = players.length >= 2 && players.length <= 8
  
  return (
    <div className="lobby-container">
      <div className="lobby-content">
        <div className="lobby-header-section">
          <button className="back-btn" onClick={onBackToMenu}>
            ← Back to Menu
          </button>
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
        </div>
        
        <div className="lobby-sections">
          <div className="players-section-full">
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
            {players.length < 2 && (
              <p className="waiting-message">Waiting for {2 - players.length} more player(s)...</p>
            )}
            
            <div className="lobby-info-box">
              <h3>ℹ️ What Happens Next</h3>
              <p>During the learning phase, the AI will ask you questions including your social media handles.</p>
              <p>Be ready to share: Instagram, Twitter, TikTok, LinkedIn, etc.</p>
            </div>
          </div>
        </div>
        
        {isHost && (
          <div className="host-controls">
            <button 
              className="start-game-btn"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? 'Start Game 🚀' : `Need ${2 - players.length} more players`}
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

