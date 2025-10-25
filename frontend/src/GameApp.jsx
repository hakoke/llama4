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
import MindGamesStage from './components/MindGamesStage'
import ReactStage from './components/ReactStage'
import AccessibilityPanel from './components/AccessibilityPanel'
import UnrestrictedChat from './components/UnrestrictedChat'
import { audioController } from './utils/AudioController'
import { hapticController } from './utils/HapticController'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const GAME_NAME = 'Unmasked: The AI Among Us'

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
  mind_games: {
    label: 'Mind Games',
    blurb: 'Answer synchronized prompts in secret while the mimic studies every syllable.'
  },
  react: {
    label: 'Aftershock',
    blurb: 'React to the reveals, trade reads, and set traps before judgement.'
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
  
  // Unrestricted chat state
  const [chatSessionId, setChatSessionId] = useState(null)
  const [chatPlayers, setChatPlayers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatWs, setChatWs] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [menuError, setMenuError] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const [messages, setMessages] = useState([])
  const [phaseTimers, setPhaseTimers] = useState({
    learning: { deadline: null, duration: 180 },
    playing: { deadline: null, duration: 300 },
    researching: { deadline: null, duration: null },
    mind_games: { deadline: null, duration: 300 },
    react: { deadline: null, duration: 120 }
  })
  const [results, setResults] = useState(null)
  const [ws, setWs] = useState(null)
  const [soundOn, setSoundOn] = useState(false)
  const [aliases, setAliases] = useState({})
  const [timeline, setTimeline] = useState(null)
  const [activeMindGame, setActiveMindGame] = useState(null)
  const [mindGameReveals, setMindGameReveals] = useState([])
  const [submissionStatus, setSubmissionStatus] = useState({})
  const [typingIndicators, setTypingIndicators] = useState({})
  const [latencyStats, setLatencyStats] = useState({})
  const typingStateRef = useRef({})
  
  // Accessibility settings
  const [textSize, setTextSize] = useState('normal') // small, normal, large
  const [colorblindMode, setColorblindMode] = useState('none') // none, protanopia, deuteranopia, tritanopia
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [hapticsEnabled, setHapticsEnabled] = useState(true)
  const [audioVolume, setAudioVolume] = useState(70)

  const hudTicker = useRef()
  const [currentTick, setCurrentTick] = useState(Date.now())
  const audioCtxRef = useRef(null)
  const oscillatorsRef = useRef(null)

  // Session persistence - save game state
  useEffect(() => {
    if (gameId && playerId && phase !== 'menu') {
      const sessionData = {
        gameId,
        playerId,
        username,
        phase,
        gameMode,
        timestamp: Date.now()
      }
      localStorage.setItem('unmasked_session', JSON.stringify(sessionData))
    } else {
      localStorage.removeItem('unmasked_session')
    }
  }, [gameId, playerId, username, phase, gameMode])

  // Reconnect on refresh
  useEffect(() => {
    const savedSession = localStorage.getItem('unmasked_session')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        // Only reconnect if session is less than 2 hours old
        if (Date.now() - session.timestamp < 2 * 60 * 60 * 1000) {
          reconnectToGame(session)
        } else {
          localStorage.removeItem('unmasked_session')
        }
      } catch (error) {
        console.error('Error reconnecting:', error)
        localStorage.removeItem('unmasked_session')
      }
    }
  }, [])

  // Apply accessibility settings to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize)
    document.documentElement.setAttribute('data-colorblind', colorblindMode)
    document.documentElement.setAttribute('data-high-contrast', highContrast.toString())
    document.documentElement.setAttribute('data-reduced-motion', reducedMotion.toString())
    
    // Expose controllers to window for component access
    window.audioController = audioController
    window.hapticController = hapticController
    hapticController.setEnabled(hapticsEnabled)
  }, [textSize, colorblindMode, highContrast, reducedMotion, hapticsEnabled])

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
    
    // Start ambient audio for game phases
    if (phase === 'playing' || phase === 'mind_games' || phase === 'react') {
      audioController.startAmbient(phase)
    } else {
      audioController.stopAmbient()
    }
    
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
    audioController.cleanup()
  }, [])

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'player_joined':
        setPlayers((prev) => [...prev, data.player])
        audioController.playPlayerJoined()
        if (hapticsEnabled) hapticController.playerJoined()
        break
      case 'group_stage':
        setPhase(data.stage)
        if (data.aliases) setAliases(data.aliases)
        if (data.stage === 'mind_games') {
          setActiveMindGame(null)
          setMindGameReveals([])
        }
        audioController.playPhaseTransition()
        if (hapticsEnabled) hapticController.phaseTransition()
        break
      case 'phase_change':
        setPhase(data.phase)
        setMessages([])
        audioController.playPhaseTransition()
        if (hapticsEnabled) hapticController.phaseTransition()
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
        if (data.phase === 'mind_games') {
          setPhaseTimers((prev) => ({
            ...prev,
            mind_games: {
              deadline: data.deadline || null,
              duration: data.duration || prev.mind_games.duration
            }
          }))
        }
        if (data.phase === 'react') {
          setPhaseTimers((prev) => ({
            ...prev,
            react: {
              deadline: data.deadline || null,
              duration: data.duration || prev.react.duration
            }
          }))
        }
        if (data.timeline) {
          setTimeline(data.timeline)
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
          impersonated_by: data.impersonated_by,
          alias: data.alias,
          alias_badge: data.alias_badge,
          alias_color: data.alias_color,
          latency_ms: data.latency_ms
        }])
        if (data.sender_id !== playerId) {
          audioController.playMessageReceived()
        }
        // Clear typing indicator for this sender
        setTypingIndicators((prev) => {
          const updated = { ...prev }
          delete updated[data.sender_id]
          return updated
        })
        break
      case 'typing':
        setTypingIndicators((prev) => ({
          ...prev,
          [data.player_id]: {
            isTyping: data.is_typing,
            alias: data.alias,
            alias_badge: data.alias_badge,
            alias_color: data.alias_color
          }
        }))
        if (data.is_typing && hapticsEnabled) {
          hapticController.typing()
        }
        break
      case 'mind_game_prompt':
        setSubmissionStatus((prev) => ({ ...prev, [data.mind_game.id]: { status: 'pending' } }))
        setPhase('mind_games')
        setActiveMindGame({ ...data.mind_game, deadline: data.deadline })
        audioController.playPhaseTransition()
        if (hapticsEnabled) hapticController.mindGamePrompt()
        break
      case 'mind_game_ack':
        setSubmissionStatus((prev) => ({
          ...prev,
          [data.mind_game_id]: { status: 'submitted' }
        }))
        audioController.playMessageSent()
        if (hapticsEnabled) hapticController.success()
        break
      case 'mind_game_error':
        setSubmissionStatus((prev) => ({
          ...prev,
          [data.mind_game_id]: { status: 'error', error: data.reason }
        }))
        audioController.playMessageSent()
        if (hapticsEnabled) hapticController.error()
        break
      case 'mind_game_reveal':
        setMindGameReveals((prev) => {
          const others = prev.filter((entry) => entry.sequence !== data.mind_game.sequence)
          return [...others, data.mind_game]
        })
        setActiveMindGame(null)
        audioController.playRevealStinger()
        if (hapticsEnabled) hapticController.mindGameReveal()
        break
      case 'game_finished':
        setPhase('results')
        if (data.results) setResults(data.results)
        audioController.playAIRevealed()
        if (hapticsEnabled) hapticController.aiRevealed()
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

  const createGame = async (mode, providedName) => {
    const finalName = (providedName ?? playerName).trim()
    if (!finalName) {
      setMenuError('Enter a username to spawn a session.')
      return
    }
    setMenuError('')
    try {
      const { data: created } = await axios.post(`${API_URL}/game/create`, { mode })
      await joinGame(created.game_id, finalName, { skipModal: true })
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Failed to create game')
    }
  }

  const joinGame = async (gameIdToJoin, providedName, options = {}) => {
    const finalName = (providedName ?? playerName).trim()
    if (!finalName) {
      setMenuError('Enter a username before joining a game.')
      return
    }
    setMenuError('')
    try {
      const { data } = await axios.post(`${API_URL}/game/join`, {
        game_id: gameIdToJoin,
        username: finalName
      })
      setGameId(gameIdToJoin)
      setPlayerId(data.player_id)
      setUsername(finalName)
      setPhase('lobby')
      const gameResponse = await axios.get(`${API_URL}/game/${gameIdToJoin}`)
      setPlayers(gameResponse.data.players)
      setGameMode(gameResponse.data.mode)
      if (!options.skipModal) {
        setPlayerName('')
        setJoinCode('')
      }
    } catch (error) {
      console.error('Error joining game:', error)
      alert('Failed to join game: ' + (error.response?.data?.detail || error.message))
    }
  }

  const reconnectToGame = async (session) => {
    try {
      // Fetch current game state
      const gameResponse = await axios.get(`${API_URL}/game/${session.gameId}`)
      setGameId(session.gameId)
      setPlayerId(session.playerId)
      setUsername(session.username)
      setGameMode(session.gameMode)
      setPhase(gameResponse.data.status)
      setPlayers(gameResponse.data.players)
      
      // Reconnect websocket will happen automatically via useEffect
    } catch (error) {
      console.error('Failed to reconnect:', error)
      localStorage.removeItem('unmasked_session')
      // If reconnection fails, just stay on menu
    }
  }

  const confirmLeaveGame = () => {
    setShowLeaveConfirm(true)
  }

  const backToMenu = () => {
    setPhase('menu')
    setGameId(null)
    setPlayerId(null)
    setUsername('')
    setPlayers([])
    setMessages([])
    setResults(null)
    setShowLeaveConfirm(false)
    localStorage.removeItem('unmasked_session')
  }

  const sendMessage = (content) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat_message',
        content,
        timestamp: new Date().toISOString()
      }))
      audioController.playMessageSent()
      if (hapticsEnabled) hapticController.tap()
    }
  }

  const sendTypingIndicator = (isTyping) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping
      }))
    }
  }

  const submitMindGameResponse = ({ mind_game_id, answer }) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'mind_game_response',
        mind_game_id,
        answer,
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

  const joinExistingGame = async () => {
    const code = joinCode.trim()
    if (!code) {
      setMenuError('Enter an access code to join an existing session.')
      return
    }
    if (!playerName.trim()) {
      setMenuError('Set your username before joining a session.')
      return
    }
    
    // Check if it's a chat session ID (UUID format)
    const isChatSession = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)
    
    try {
      if (isChatSession) {
        // It's a chat session ID, join directly
        await joinChatSession(code, playerName)
      } else {
        // It's a regular game code, try regular game first
        await joinGame(code, playerName)
      }
    } catch (error) {
      // If regular game fails and it's not a chat session, try chat anyway
      if (!isChatSession) {
        try {
          await joinChatSession(code, playerName)
        } catch (chatError) {
          console.error('Error joining game/chat:', chatError)
          alert('Failed to join: ' + (error.response?.data?.detail || error.message))
        }
      } else {
        console.error('Error joining chat:', error)
        alert('Failed to join chat: ' + (error.response?.data?.detail || error.message))
      }
    }
  }

  const joinChatSession = async (sessionId, username) => {
    try {
      const response = await axios.post(`${API_URL}/chat/session/join`, {
        username: username,
        session_id: sessionId
      })
      
      setChatSessionId(sessionId)
      setPlayerId(response.data.player_id)
      setUsername(username)
      
      // Add all existing players including yourself
      const allPlayers = [
        ...(response.data.existing_players || []),
        {
          id: response.data.player_id,
          username: response.data.username
        }
      ]
      setChatPlayers(allPlayers)
      
      // Restore chat history
      if (response.data.chat_history) {
        setChatMessages(response.data.chat_history.map(msg => ({
          content: msg.content,
          sender_id: msg.sender_id,
          username: msg.username,
          timestamp: msg.timestamp,
          is_ai: msg.is_ai || false
        })))
      }
      
      setPhase('unrestricted_chat')
      
      // Connect to chat WebSocket
      connectToChat(sessionId, response.data.player_id)
      
    } catch (error) {
      console.error('Error joining chat:', error)
      throw error
    }
  }

  const filteredLearningMessages = useMemo(() => (
    messages.filter((msg) => msg.recipient_id === playerId || msg.sender_id === playerId)
  ), [messages, playerId])

  const playingMessages = useMemo(() => (
    messages.filter((msg) => !msg.phase || msg.phase === 'playing')
  ), [messages])

  const mindGamesMessages = useMemo(() => (
    messages.filter((msg) => msg.phase === 'mind_games')
  ), [messages])

  const reactMessages = useMemo(() => (
    messages.filter((msg) => msg.phase === 'react')
  ), [messages])

  const phaseHud = PHASE_HUD[phase] || PHASE_HUD.menu
  const activeTimer = phaseTimers[phase]
  const phaseTimeLeft = activeTimer?.deadline
    ? Math.max(0, Math.floor(activeTimer.deadline - currentTick / 1000))
    : null

  // Unrestricted Chat Functions
  const startUnrestrictedChat = async () => {
    if (!playerName.trim()) {
      setMenuError('Enter a username to start chatting')
      return
    }
    
    try {
      const response = await axios.post(`${API_URL}/chat/session/create`, {
        username: playerName.trim()
      })
      
      setChatSessionId(response.data.session_id)
      setPlayerId(response.data.player_id)
      setUsername(playerName.trim()) // Set the username state
      setChatPlayers([{
        id: response.data.player_id,
        username: response.data.username
      }])
      setPhase('unrestricted_chat')
      
      // Connect to chat WebSocket
      connectToChat(response.data.session_id, response.data.player_id)
      
    } catch (error) {
      console.error('Error starting chat:', error)
      alert('Failed to start chat session')
    }
  }

  const connectToChat = (sessionId, playerId) => {
    const websocket = new WebSocket(`${WS_URL}/ws/chat/${sessionId}/${playerId}`)
    
    websocket.onopen = () => {
      console.log('Connected to unrestricted chat')
      setChatWs(websocket)
    }
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'chat_message') {
        setChatMessages(prev => [...prev, {
          content: data.content,
          sender_id: data.sender_id,
          username: data.username,
          timestamp: data.timestamp,
          is_ai: data.is_ai || false
        }])
      } else if (data.type === 'player_added') {
        setChatPlayers(prev => [...prev, {
          id: data.player.id,
          username: data.player.username
        }])
      } else if (data.type === 'typing_indicator') {
        // Handle typing indicators
      }
    }
    
    websocket.onclose = () => {
      console.log('Disconnected from chat')
      setChatWs(null)
    }
    
    websocket.onerror = (error) => {
      console.error('Chat WebSocket error:', error)
    }
  }

  const sendChatMessage = (content) => {
    if (chatWs && chatWs.readyState === WebSocket.OPEN) {
      chatWs.send(JSON.stringify({
        type: 'chat_message',
        content: content,
        username: username || playerName // Use username if set, otherwise playerName
      }))
    }
  }

  const addChatPlayer = async (playerName) => {
    if (!chatSessionId) return
    
    try {
      const response = await axios.post(`${API_URL}/chat/session/${chatSessionId}/player/add`, {
        username: playerName
      })
      
      setChatPlayers(prev => [...prev, {
        id: response.data.player_id,
        username: response.data.username
      }])
      
    } catch (error) {
      console.error('Error adding player:', error)
      alert('Failed to add player')
    }
  }

  const removeChatPlayer = (playerIdToRemove) => {
    setChatPlayers(prev => prev.filter(p => p.id !== playerIdToRemove))
  }

  const leaveChat = () => {
    if (chatWs) {
      chatWs.close()
    }
    setChatSessionId(null)
    setChatPlayers([])
    setChatMessages([])
    setPhase('menu')
  }

  return (
    <div className="game-app">
      <div className="ambient-orb" />
      <div className="ambient-orb" />
      <div className="nebula-grid" />
      
      <AccessibilityPanel
        textSize={textSize}
        onTextSizeChange={setTextSize}
        colorblindMode={colorblindMode}
        onColorblindModeChange={setColorblindMode}
        highContrast={highContrast}
        onHighContrastChange={setHighContrast}
        reducedMotion={reducedMotion}
        onReducedMotionChange={setReducedMotion}
        hapticsEnabled={hapticsEnabled}
        onHapticsChange={setHapticsEnabled}
        audioVolume={audioVolume}
        onAudioVolumeChange={setAudioVolume}
      />
      
      <div className="game-stage">
        <header className="hud-header">
          <div className="hud-title">
            <span>Phase Console</span>
            <h1>{GAME_NAME}</h1>
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
                  <h1>{GAME_NAME}</h1>
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
                <div className="menu-field">
                  <label htmlFor="menu-username">Choose your codename</label>
                  <div className="menu-input-shell">
                    <input
                      id="menu-username"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="e.g. shadow cassette"
                    />
                  </div>
                </div>
                <div className="menu-actions">
                  <motion.button
                    className="mode-card group"
                    whileHover={{ translateY: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createGame('group', playerName)}
                  >
                    <span className="mode-label">Group Arena</span>
                    <span className="mode-desc">One impostor. One room. Five minutes to expose them.</span>
                  </motion.button>
                  <motion.button
                    className="mode-card private"
                    whileHover={{ translateY: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => createGame('private', playerName)}
                  >
                    <span className="mode-label">Private Rotation</span>
                    <span className="mode-desc">Two minute duels. Rotating impostors. Trust nothing.</span>
                  </motion.button>
                  <motion.button
                    className="mode-card unrestricted"
                    whileHover={{ translateY: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startUnrestrictedChat()}
                  >
                    <span className="mode-label">🤖 Unrestricted Chat</span>
                    <span className="mode-desc">No limits. No boundaries. Just raw AI intelligence.</span>
                  </motion.button>
                </div>
                <div className="menu-join">
                  <span className="menu-join-label">Have an access code?</span>
                  <div className="menu-join-controls">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          joinExistingGame()
                        }
                      }}
                      placeholder="ENTER CODE"
                      className="menu-join-input"
                    />
                    <button
                      type="button"
                      className="menu-join-button"
                      onClick={joinExistingGame}
                    >
                      Join Game
                    </button>
                  </div>
                </div>
                {menuError && <p className="menu-error">{menuError}</p>}
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
                onBackToMenu={confirmLeaveGame}
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
                onBackToMenu={confirmLeaveGame}
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
                stage="playing"
                gameMode={gameMode}
                messages={playingMessages}
                players={players}
                onSendMessage={sendMessage}
                playerId={playerId}
                gameId={gameId}
                deadline={phaseTimers.playing.deadline}
                duration={phaseTimers.playing.duration}
                aliases={aliases}
                typingIndicators={typingIndicators}
                onTyping={sendTypingIndicator}
                reducedMotion={reducedMotion}
                tipMessage="Watch for latency tells. Humans hesitate, the AI studies everyone before responding."
              />
            </motion.section>
          )}

          {phase === 'mind_games' && (
            <motion.section
              key="mind-games"
              className="glass-panel"
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <MindGamesStage
                activeMindGame={activeMindGame}
                mindGameReveals={mindGameReveals}
                players={players}
                aliases={aliases}
                deadline={phaseTimers.mind_games.deadline}
                onSendMessage={sendMessage}
                onSubmitResponse={submitMindGameResponse}
                submissionStatus={submissionStatus}
                playerId={playerId}
                messages={mindGamesMessages}
                typingIndicators={typingIndicators}
                onTyping={sendTypingIndicator}
                reducedMotion={reducedMotion}
                audioController={audioController}
              />
            </motion.section>
          )}

          {phase === 'react' && (
            <motion.section
              key="react"
              className="glass-panel"
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <ReactStage
                messages={reactMessages}
                players={players}
                aliases={aliases}
                onSendMessage={sendMessage}
                playerId={playerId}
                deadline={phaseTimers.react.deadline}
                typingIndicators={typingIndicators}
                onTyping={sendTypingIndicator}
                reducedMotion={reducedMotion}
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
                mindGameReveals={mindGameReveals}
                latencyStats={latencyStats}
                aliases={aliases}
              />
            </motion.section>
          )}

          {phase === 'unrestricted_chat' && (
            <motion.section
              key="unrestricted_chat"
              className="unrestricted-chat-container"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.97 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <UnrestrictedChat
                messages={chatMessages}
                players={chatPlayers}
                playerId={playerId}
                chatSessionId={chatSessionId}
                onSendMessage={sendChatMessage}
                onAddPlayer={addChatPlayer}
                onRemovePlayer={removeChatPlayer}
                typingIndicators={typingIndicators}
                reducedMotion={reducedMotion}
              />
              <div className="chat-controls">
                <button onClick={leaveChat} className="leave-chat-btn">
                  Leave Chat
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Leave Game Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-glow" />
              <h2>Abort Mission?</h2>
              <p>You'll disconnect from the game and lose your progress.</p>
              <div className="modal-actions">
                <motion.button
                  className="modal-btn cancel"
                  onClick={() => setShowLeaveConfirm(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Stay
                </motion.button>
                <motion.button
                  className="modal-btn confirm"
                  onClick={backToMenu}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Leave Game
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GameApp

