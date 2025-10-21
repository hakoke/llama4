import { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import './GameApp.css'
import Lobby from './components/Lobby'
import LearningPhase from './components/LearningPhase'
import ResearchPhase from './components/ResearchPhase'
import GamePhase from './components/GamePhase'
import VotingPhase from './components/VotingPhase'
import ResultsPhase from './components/ResultsPhase'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

const PHASE_HUD = {
  menu: {
    label: 'Standby',
    blurb: 'Assemble your squad and prime the neural core.'
  },
  lobby: {
    label: 'Briefing',
    blurb: 'Synching players, calibrating voiceprints, prepping interrogation scripts.'
  },
  learning: {
    label: 'Interrogation',
    blurb: 'AI mimics your vibe, harvesting slang, typos, emoji cadence.'
  },
  researching: {
    label: 'Deep Scan',
    blurb: 'Crawling public intel, stitching dossiers, weaponising your digital exhaust.'
  },
  playing: {
    label: 'Deception',
    blurb: 'Chat in real time while the AI puppets a teammate. Trust nothing.'
  },
  voting: {
    label: 'Judgement',
    blurb: 'Lock in your accusation before the impostor melts back into the crowd.'
  },
  results: {
    label: 'Post-Op',
    blurb: 'Brutal honesty. See how the AI became you and who it fooled.'
  }
}

function GameApp() {
  const [phase, setPhase] = useState('menu')
  const [gameId, setGameId] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [username, setUsername] = useState('')
  const [players, setPlayers] = useState([])
  const [gameMode, setGameMode] = useState('group')

  const [messages, setMessages] = useState([])
  const [phaseTimers, setPhaseTimers] = useState({
    learning: { deadline: null, duration: 180 },
    playing: { deadline: null, duration: 300 },
    researching: { deadline: null, duration: null }
  })
  const [results, setResults] = useState(null)
  const [ws, setWs] = useState(null)
  const [soundOn, setSoundOn] = useState(false)

  const hudTicker = useRef()
  const [currentTick, setCurrentTick] = useState(Date.now())
  const audioCtxRef = useRef(null)
  const oscillatorsRef = useRef(null)

  useEffect(() => {
    if (gameId && playerId && phase !== 'menu') {
      const websocket = new WebSocket(`${WS_URL}/ws/${gameId}/${playerId}`)
      websocket.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data))
      }
      setWs(websocket)
      return () => websocket.close()
    }
  }, [gameId, playerId, phase])

  useEffect(() => {
    if (hudTicker.current) {
      clearInterval(hudTicker.current)
    }
    hudTicker.current = setInterval(() => setCurrentTick(Date.now()), 1000)
    return () => {
      if (hudTicker.current) clearInterval(hudTicker.current)
    }
  }, [phase])

  useEffect(() => () => {
    if (oscillatorsRef.current) {
      oscillatorsRef.current.forEach((osc) => {
        try { osc.stop() } catch (_) { /* noop */ }
      })
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
    }
  }, [])

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'player_joined':
        setPlayers((prev) => [...prev, data.player])
        break
      case 'phase_change':
        setPhase(data.phase)
        setMessages([])
        if (data.phase === 'learning') {
          setPhaseTimers((prev) => ({
            ...prev,
            learning: {
              deadline: data.deadline || null,
              duration: data.duration || prev.learning.duration
            }
          }))
        }
        if (data.phase === 'playing') {
          setPhaseTimers((prev) => ({
            ...prev,
            playing: {
              deadline: data.deadline || null,
              duration: data.duration || prev.playing.duration
            }
          }))
        }
        if (data.phase === 'researching') {
          setPhaseTimers((prev) => ({
            ...prev,
            researching: {
              deadline: data.deadline || null,
              duration: data.duration || prev.researching.duration
            }
          }))
        }
        break
      case 'chat_message':
        setMessages((prev) => [...prev, {
          sender_id: data.sender_id,
          username: data.username,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
          phase: data.phase,
          recipient_id: data.recipient_id,
          impersonated_by: data.impersonated_by
        }])
        break
      case 'game_finished':
        setPhase('results')
        if (data.results) setResults(data.results)
        break
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  const toggleAmbient = async () => {
    if (soundOn) {
      if (oscillatorsRef.current) {
        oscillatorsRef.current.forEach((osc) => {
          try { osc.stop() } catch (_) { /* ignore */ }
        })
        oscillatorsRef.current = null
      }
      if (audioCtxRef.current) {
        await audioCtxRef.current.close()
        audioCtxRef.current = null
      }
      setSoundOn(false)
      return
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) {
      alert('Web Audio API not supported in this browser.')
      return
    }
    const ctx = new AudioCtx()
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2)
    gain.connect(ctx.destination)

    const buildOsc = (freq, detune = 0, type = 'sine') => {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.detune.setValueAtTime(detune, ctx.currentTime)
      osc.connect(gain)
      osc.start()
      return osc
    }

    const oscillators = [
      buildOsc(68, 0, 'sine'),
      buildOsc(122, -80, 'triangle'),
      buildOsc(46, 140, 'sine')
    ]

    audioCtxRef.current = ctx
    oscillatorsRef.current = oscillators
    setSoundOn(true)
  }

  const createGame = async (mode) => {
    const playerName = prompt('Enter your username:')?.trim()
    if (!playerName) {
      alert('Username is required!')
      return
    }
    try {
      const { data: created } = await axios.post(`${API_URL}/game/create`, { mode })
      await joinGame(created.game_id, playerName)
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Failed to create game')
    }
  }

  const joinGame = async (gameIdToJoin, providedName) => {
    const name = providedName ?? prompt('Enter your username:')?.trim()
    if (!name) {
      alert('Username is required!')
      return
    }
    try {
      const { data } = await axios.post(`${API_URL}/game/join`, {
        game_id: gameIdToJoin,
        username: name
      })
      setGameId(gameIdToJoin)
      setPlayerId(data.player_id)
      setUsername(name)
      setPhase('lobby')
      const gameResponse = await axios.get(`${API_URL}/game/${gameIdToJoin}`)
      setPlayers(gameResponse.data.players)
      setGameMode(gameResponse.data.mode)
    } catch (error) {
      console.error('Error joining game:', error)
      alert('Failed to join game: ' + (error.response?.data?.detail || error.message))
    }
  }

  const backToMenu = () => {
    setPhase('menu')
    setGameId(null)
    setPlayerId(null)
    setUsername('')
    setPlayers([])
    setMessages([])
    setResults(null)
  }

  const sendMessage = (content) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        content,
        timestamp: new Date().toISOString()
      }))
    }
  }

  const startGame = async () => {
    try {
      await axios.post(`${API_URL}/game/${gameId}/start`)
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  const submitVote = async (voteData) => {
    try {
      await axios.post(`${API_URL}/game/${gameId}/player/${playerId}/vote`, voteData)
    } catch (error) {
      console.error('Error submitting vote:', error)
    }
  }

  const filteredLearningMessages = useMemo(() => (
    messages.filter((msg) => msg.recipient_id === playerId || msg.sender_id === playerId)
  ), [messages, playerId])

  const filteredGameMessages = useMemo(() => (
    messages.filter((msg) => !msg.phase || msg.phase === 'playing')
  ), [messages])

  const phaseHud = PHASE_HUD[phase] || PHASE_HUD.menu
  const activeTimer = phaseTimers[phase]
  const phaseTimeLeft = activeTimer?.deadline
    ? Math.max(0, Math.floor(activeTimer.deadline - currentTick / 1000))
    : null

  return (
    <div className="game-app">
      <div className="ambient-orb" />
      <div className="ambient-orb" />
      <div className="nebula-grid" />
      <div className="game-stage">
        <header className="hud-header">
          <div className="hud-title">
            <span>AI Impostor Protocol</span>
            <h1>Neon Deception Suite</h1>
          </div>
          <div className="hud-phase">
            <span>{phaseHud.label}</span>
            <p>{phaseHud.blurb}</p>
          </div>
          <div className="hud-controls">
            {phaseTimeLeft !== null && (
              <div className="hud-timer">
                <span>Phase Timer</span>
                <strong>
                  {`${Math.floor(phaseTimeLeft / 60)}:${(phaseTimeLeft % 60).toString().padStart(2, '0')}`}
                </strong>
              </div>
            )}
            <button
              className={`ghost-btn ${soundOn ? 'active' : ''}`}
              onClick={toggleAmbient}
            >
              {soundOn ? 'Ambient On' : 'Ambient Off'}
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.section
              key="menu"
              className="glass-panel"
              initial={{ opacity: 0, y: 48, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.97 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="panel-header">
                <div className="panel-title">
                  <h1>AI Impostor</h1>
                  <span className="panel-subtitle">Neural Social Deduction Protocol</span>
                </div>
              </div>
              <motion.div
                className="menu-holo"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              >
                <p className="menu-intro">
                  A rogue consciousness learns your tells, mirrors your vibe, and crashes your chat.
                  Think you can unmask it before it becomes you?
                </p>
                <div className="menu-actions">
                  <motion.button
                    className="mode-card group"
                    whileHover={{ translateY: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createGame('group')}
                  >
                    <span className="mode-label">Group Arena</span>
                    <span className="mode-desc">One impostor. One room. Five minutes to expose them.</span>
                  </motion.button>
                  <motion.button
                    className="mode-card private"
                    whileHover={{ translateY: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createGame('private')}
                  >
                    <span className="mode-label">Private Rotation</span>
                    <span className="mode-desc">Two minute duels. Rotating impostors. Trust nothing.</span>
                  </motion.button>
                </div>
                <div className="menu-join">
                  <span className="menu-join-label">Join by Access Code</span>
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    className="menu-join-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        joinGame(e.currentTarget.value.trim())
                      }
                    }}
                  />
                </div>
              </motion.div>
            </motion.section>
          )}

          {phase === 'lobby' && (
            <motion.section
              key="lobby"
              className="glass-panel"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -25, scale: 0.97 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <Lobby
                gameId={gameId}
                playerId={playerId}
                username={username}
                players={players}
                gameMode={gameMode}
                onStartGame={startGame}
                onBackToMenu={backToMenu}
              />
            </motion.section>
          )}

          {phase === 'learning' && (
            <motion.section
              key="learning"
              className="glass-panel"
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -25, scale: 0.98 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <LearningPhase
                messages={filteredLearningMessages}
                onSendMessage={sendMessage}
                username={username}
                gameId={gameId}
                deadline={phaseTimers.learning.deadline}
                duration={phaseTimers.learning.duration}
                onBackToMenu={backToMenu}
              />
            </motion.section>
          )}

          {phase === 'researching' && (
            <motion.section
              key="research"
              className="glass-panel"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <ResearchPhase players={players} />
            </motion.section>
          )}

          {phase === 'playing' && (
            <motion.section
              key="play"
              className="glass-panel"
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <GamePhase
                gameMode={gameMode}
                messages={filteredGameMessages}
                players={players}
                onSendMessage={sendMessage}
                playerId={playerId}
                gameId={gameId}
                deadline={phaseTimers.playing.deadline}
                duration={phaseTimers.playing.duration}
              />
            </motion.section>
          )}

          {phase === 'voting' && (
            <motion.section
              key="vote"
              className="glass-panel"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.98 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <VotingPhase
                players={players}
                gameMode={gameMode}
                onSubmitVote={submitVote}
              />
            </motion.section>
          )}

          {phase === 'results' && (
            <motion.section
              key="results"
              className="glass-panel"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.97 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <ResultsPhase
                results={results}
                players={players}
                onPlayAgain={backToMenu}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default GameApp

