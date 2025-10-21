import { useState, useEffect } from 'react'
import axios from 'axios'
import './ResultsPhase.css'

const API_URL = import.meta.env.VITE_API_URL || '/api';

function ResultsPhase({ gameId }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // In a real implementation, this would come via WebSocket
    // For now, fetch from API
    const fetchResults = async () => {
      try {
        const response = await axios.get(`${API_URL}/game/${gameId}`)
        // Simulate results for now
        setResults({
          ai_success_rate: 0.67,
          analysis: "The AI successfully fooled 67% of players! Here's what it learned about each of you...",
          scores: {}
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching results:', error)
        setLoading(false)
      }
    }
    
    fetchResults()
  }, [gameId])
  
  if (loading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
        <p>Calculating results...</p>
      </div>
    )
  }
  
  return (
    <div className="results-phase">
      <div className="results-container">
        <h1 className="results-title">🎭 The Reveal</h1>
        
        <div className="ai-success-card">
          <h2>AI Success Rate</h2>
          <div className="success-meter">
            <div 
              className="success-fill"
              style={{ width: `${results.ai_success_rate * 100}%` }}
            >
              <span className="success-percentage">
                {Math.round(results.ai_success_rate * 100)}%
              </span>
            </div>
          </div>
          <p className="success-message">
            {results.ai_success_rate > 0.5 
              ? '🎉 The AI won! It fooled most of you!'
              : '👏 Humans win! You spotted the impostor!'}
          </p>
        </div>
        
        <div className="analysis-section">
          <h2>AI's Analysis</h2>
          <div className="analysis-text">
            {results.analysis}
          </div>
        </div>
        
        <div className="player-insights">
          <h2>What the AI Learned</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h3>Player 1</h3>
              <p>Typing style: Casual, uses lots of emojis 😊</p>
              <p>Personality: Outgoing and friendly</p>
              <p>Found on Instagram: 450 posts about travel</p>
            </div>
            {/* More player insights would be dynamically generated */}
          </div>
        </div>
        
        <div className="play-again-section">
          <button 
            className="play-again-btn"
            onClick={() => window.location.reload()}
          >
            Play Again 🔄
          </button>
          <button 
            className="share-btn"
            onClick={() => {
              navigator.clipboard.writeText(`I just played AI Impostor and the AI fooled ${Math.round(results.ai_success_rate * 100)}% of us!`)
              alert('Result copied to clipboard!')
            }}
          >
            Share Results 📱
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultsPhase

