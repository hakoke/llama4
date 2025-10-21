import './ResultsPhase.css'

function ResultsPhase({ results, players, onPlayAgain }) {
  if (!results) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
        <p>Calculating results...</p>
      </div>
    )
  }

  const scoreCards = players.map((player) => ({
    username: player.username,
    score: results.scores?.[player.id] ?? 0
  })).sort((a, b) => b.score - a.score)

  return (
    <section className="reveal">
      <header className="reveal-header">
        <span>Post-Game Analysis</span>
        <h2>The AI drops the mask</h2>
      </header>

      <div className="reveal-grid">
        <div className="reveal-card success">
          <h3>AI Success Rate</h3>
          <div className="success-meter">
            <div
              className="success-meter__fill"
              style={{ width: `${results.ai_success_rate * 100}%` }}
            />
          </div>
          <p className="success-value">{Math.round(results.ai_success_rate * 100)}%</p>
          <p className="success-caption">
            {results.ai_success_rate > 0.5
              ? 'The AI dominated. Humanity hesitated.'
              : 'Humans outfoxed the mimic. For now.'}
          </p>
        </div>

        <div className="reveal-card analysis">
          <h3>AI confession log</h3>
          <pre>{results.analysis}</pre>
        </div>

        <div className="reveal-card insights">
          <h3>Player dossiers</h3>
          <div className="insights-list">
            {results.player_insights?.length ? results.player_insights.map((insight, idx) => (
              <div key={idx} className="insights-item">
                <header>
                  <span>{insight.username}</span>
                </header>
                <p><strong>Typing:</strong> {insight.typing_style}</p>
                <p><strong>Persona:</strong> {insight.personality}</p>
                {insight.discovery && <p><strong>Intel:</strong> {insight.discovery}</p>}
                {insight.notes && <p>{insight.notes}</p>}
              </div>
            )) : (
              <div className="insights-item placeholder">
                <p>The AI kept quiet. Replay to feed it more data.</p>
              </div>
            )}
          </div>
        </div>

        <div className="reveal-card scoreboard">
          <h3>Scoreboard</h3>
          <ul>
            {scoreCards.map((entry) => (
              <li key={entry.username}>
                <span>{entry.username}</span>
                <strong>{entry.score}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="reveal-actions">
        <button onClick={onPlayAgain}>Run it back</button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `Unmasked: The AI Among Us fooled ${Math.round(results.ai_success_rate * 100)}% of players. Can you beat it?`
            )
            alert('Result copied to clipboard!')
          }}
        >
          Share the chaos
        </button>
      </footer>
    </section>
  )
}

export default ResultsPhase

