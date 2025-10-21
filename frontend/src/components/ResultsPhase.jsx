import './ResultsPhase.css'

function ResultsPhase({ results, onPlayAgain }) {
  if (!results) {
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
            {results.player_insights?.length ? (
              results.player_insights.map((insight, idx) => (
                <div className="insight-card" key={idx}>
                  <h3>{insight.username}</h3>
                  <p><strong>Typing style:</strong> {insight.typing_style}</p>
                  <p><strong>Personality:</strong> {insight.personality}</p>
                  {insight.discovery && (
                    <p><strong>Found:</strong> {insight.discovery}</p>
                  )}
                  {insight.notes && (
                    <p className="insight-notes">{insight.notes}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="insight-card placeholder">
                <p>The AI kept its secrets this time. Play another round to feed it more intel.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="play-again-section">
          <button 
            className="play-again-btn"
            onClick={onPlayAgain}
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

