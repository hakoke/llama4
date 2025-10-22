import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ResultsPhase.css'

function ResultsPhase({ results, players, onPlayAgain, mindGameReveals, latencyStats, aliases }) {
  const [expandedProfile, setExpandedProfile] = useState(null)
  const [showMindGames, setShowMindGames] = useState(false)

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
    playerId: player.id,
    score: results.scores?.[player.id] ?? 0
  })).sort((a, b) => b.score - a.score)

  const deceptionMetrics = {
    totalMessages: results.total_messages || 0,
    aiMessages: results.ai_messages || 0,
    avgLatency: latencyStats?.average || 0,
    aliasChanges: results.alias_changes || 0
  }

  return (
    <section className="reveal">
      <header className="reveal-header">
        <span>Post-Game Analysis</span>
        <h2>The AI drops the mask</h2>
        <p className="reveal-subtitle">Full deception breakdown — personas, latency, mind games, and receipts</p>
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

          {deceptionMetrics && (
            <div className="deception-metrics">
              <h4>Deception stats</h4>
              <ul>
                {deceptionMetrics.aiMessages > 0 && (
                  <li><span>AI messages sent:</span> <strong>{deceptionMetrics.aiMessages}</strong></li>
                )}
                {deceptionMetrics.avgLatency > 0 && (
                  <li><span>Avg response latency:</span> <strong>{Math.round(deceptionMetrics.avgLatency)}ms</strong></li>
                )}
                {deceptionMetrics.aliasChanges > 0 && (
                  <li><span>Persona shifts:</span> <strong>{deceptionMetrics.aliasChanges}</strong></li>
                )}
              </ul>
            </div>
          )}
        </div>

        {mindGameReveals && mindGameReveals.length > 0 && (
          <div className="reveal-card mind-games-recap">
            <h3>Mind Games recap</h3>
            <button className="toggle-btn" onClick={() => setShowMindGames(!showMindGames)}>
              {showMindGames ? 'Hide' : 'Show'} all answers
            </button>
            <AnimatePresence>
              {showMindGames && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mind-games-list"
                >
                  {mindGameReveals.map((game, idx) => (
                    <div key={idx} className="mind-game-recap-item">
                      <h4>Prompt #{game.sequence}: {game.prompt}</h4>
                      <ul>
                        {game.responses?.map((resp, ridx) => {
                          const aliasInfo = resp.alias ? { alias: resp.alias, badge: resp.alias_badge, color: resp.alias_color } : aliases?.[resp.player_id] || {}
                          return (
                            <li key={ridx} className={resp.is_ai ? 'ai-answer' : ''}>
                              <div className="alias-tag" style={{ borderColor: aliasInfo?.color }}>
                                <span className="badge" style={{ backgroundColor: aliasInfo?.color }}>
                                  {aliasInfo?.badge || '?'}
                                </span>
                                {aliasInfo?.alias || 'Unknown'}
                                {resp.is_ai && <span className="ai-flag">AI</span>}
                              </div>
                              <p>{resp.response}</p>
                              {resp.latency_ms && <small>Latency: {resp.latency_ms}ms</small>}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="reveal-card analysis">
          <h3>AI confession log</h3>
          <div className="analysis-text">
            <pre>{results.analysis}</pre>
          </div>
        </div>

        <div className="reveal-card insights">
          <h3>Player dossiers</h3>
          <div className="insights-list">
            {results.player_insights?.length ? results.player_insights.map((insight, idx) => (
              <div key={idx} className={`insights-item ${expandedProfile === idx ? 'expanded' : ''}`}>
                <header onClick={() => setExpandedProfile(expandedProfile === idx ? null : idx)}>
                  <span>{insight.username}</span>
                  <span className="expand-icon">{expandedProfile === idx ? '−' : '+'}</span>
                </header>
                <div className="insight-content">
                  <p><strong>Typing:</strong> {insight.typing_style}</p>
                  <p><strong>Persona:</strong> {insight.personality}</p>
                  {insight.discovery && <p><strong>Intel:</strong> {insight.discovery}</p>}
                  {insight.notes && <p className="notes">{insight.notes}</p>}
                  {latencyStats?.[players.find(p => p.username === insight.username)?.id] && (
                    <p><strong>Latency profile:</strong> {Math.round(latencyStats[players.find(p => p.username === insight.username).id].average)}ms avg</p>
                  )}
                </div>
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

