import { useState, useEffect } from 'react'
import axios from 'axios'
import './GameApp.css'
import Lobby from './components/Lobby'
import LearningPhase from './components/LearningPhase'
import ResearchPhase from './components/ResearchPhase'
import GamePhase from './components/GamePhase'
import VotingPhase from './components/VotingPhase'
import ResultsPhase from './components/ResultsPhase'

const API_URL = import.meta.env.VITE_API_URL || '/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

function GameApp() {
  const [phase, setPhase] = useState('menu') // menu, lobby, learning, researching, playing, voting, results
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
  
  // WebSocket connection
  useEffect(() => {
    if (gameId && playerId && phase !== 'menu') {
      const websocket = new WebSocket(`${WS_URL}/ws/${gameId}/${playerId}`)
      
      websocket.onopen = () => {
        console.log('WebSocket connected')
      }
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      }
      
      websocket.onclose = () => {
        console.log('WebSocket disconnected')
      }
      
      setWs(websocket)
      
      return () => {
        websocket.close()
      }
    }
  }, [gameId, playerId, phase])
  
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'player_joined':
        setPlayers(prev => [...prev, data.player])
        break
      
      case 'phase_change':
        setPhase(data.phase)
        setMessages([])
        if (data.phase === 'learning') {
          setPhaseTimers(prev => ({
            ...prev,
            learning: {
              deadline: data.deadline || null,
              duration: data.duration || prev.learning.duration
            }
          }))
        }
        if (data.phase === 'playing') {
          setPhaseTimers(prev => ({
            ...prev,
            playing: {
              deadline: data.deadline || null,
              duration: data.duration || prev.playing.duration
            }
          }))
        }
        if (data.phase === 'researching') {
          setPhaseTimers(prev => ({
            ...prev,
            researching: {
              deadline: data.deadline || null,
              duration: data.duration || prev.researching.duration
            }
          }))
        }
        break
      
      case 'chat_message':
        setMessages(prev => [...prev, {
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
        if (data.results) {
          setResults(data.results)
        }
        break
      
      default:
        console.log('Unknown message type:', data.type)
    }
  }
  
  const createGame = async (mode) => {
    try {
      const response = await axios.post(`${API_URL}/game/create`, { mode })
      setGameId(response.data.game_id)
      setGameMode(mode)
      setPhase('lobby')
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Failed to create game')
    }
  }
  
  const joinGame = async (gameIdToJoin) => {
    // Ask for username first
    const playerName = prompt('Enter your username:')
    if (!playerName || !playerName.trim()) {
      alert('Username is required!')
      return
    }
    
    try {
      const response = await axios.post(`${API_URL}/game/join`, {
        game_id: gameIdToJoin,
        username: playerName.trim()
      })
      
      setGameId(gameIdToJoin)
      setPlayerId(response.data.player_id)
      setUsername(playerName.trim())
      setPhase('lobby')
      
      // Fetch game state
      const gameResponse = await axios.get(`${API_URL}/game/${gameIdToJoin}`)
      setPlayers(gameResponse.data.players)
      setGameMode(gameResponse.data.mode)
    } catch (error) {
      console.error('Error joining game:', error)
      alert('Failed to join game: ' + (error.response?.data?.detail || error.message))
    }
  }
  
  const createAndJoinGame = async (mode) => {
    // Ask for username
    const playerName = prompt('Enter your username:')
    if (!playerName || !playerName.trim()) {
      alert('Username is required!')
      return
    }
    
    try {
      // Create game
      const createResponse = await axios.post(`${API_URL}/game/create`, { mode })
      const newGameId = createResponse.data.game_id
      
      // Join the game
      const joinResponse = await axios.post(`${API_URL}/game/join`, {
        game_id: newGameId,
        username: playerName.trim()
      })
      
      setGameId(newGameId)
      setPlayerId(joinResponse.data.player_id)
      setUsername(playerName.trim())
      setGameMode(mode)
      setPhase('lobby')
      
      // Fetch game state
      const gameResponse = await axios.get(`${API_URL}/game/${newGameId}`)
      setPlayers(gameResponse.data.players)
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Failed to create game')
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
  
  const updateHandles = async (handles) => {
    try {
      await axios.post(`${API_URL}/game/${gameId}/player/${playerId}/handles`, handles)
    } catch (error) {
      console.error('Error updating handles:', error)
    }
  }
  
  const startGame = async () => {
    try {
      await axios.post(`${API_URL}/game/${gameId}/start`)
      // Phase will change via WebSocket
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
  
  return (
    <div className="game-app">
      {phase === 'menu' && (
        <div className="menu-screen">
          <div className="menu-content">
            <h1 className="game-title">
              <span className="neon-text">AI IMPOSTOR</span>
            </h1>
            <p className="game-subtitle">Can you spot the AI?</p>
            
            <div className="menu-options">
              <div className="game-mode-selection">
                <h2>Create Game</h2>
                <button className="mode-btn group" onClick={() => createAndJoinGame('group')}>
                  <span className="mode-icon">👥</span>
                  <span className="mode-name">Group Mode</span>
                  <span className="mode-desc">Everyone chats, find the AI</span>
                </button>
                <button className="mode-btn private" onClick={() => createAndJoinGame('private')}>
                  <span className="mode-icon">💬</span>
                  <span className="mode-name">Private Mode</span>
                  <span className="mode-desc">1-on-1 rounds, guess who's who</span>
                </button>
              </div>
              
              <div className="join-game-section">
                <h2>Or Join Game</h2>
                <input
                  type="text"
                  placeholder="Enter Game ID and press Enter"
                  className="game-id-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      joinGame(e.target.value.trim())
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {phase === 'lobby' && (
        <Lobby
          gameId={gameId}
          playerId={playerId}
          username={username}
          players={players}
          gameMode={gameMode}
          onStartGame={startGame}
          onBackToMenu={backToMenu}
        />
      )}
      
      {phase === 'learning' && (
        <LearningPhase
          messages={messages.filter(msg => (msg.recipient_id === playerId) || (msg.sender_id === playerId))}
          onSendMessage={sendMessage}
          username={username}
          gameId={gameId}
          deadline={phaseTimers.learning.deadline}
          duration={phaseTimers.learning.duration}
          onBackToMenu={backToMenu}
        />
      )}
      
      {phase === 'researching' && (
        <ResearchPhase />
      )}
      
      {phase === 'playing' && (
        <GamePhase
          gameMode={gameMode}
          messages={messages.filter(msg => !msg.phase || msg.phase === 'playing')}
          players={players}
          onSendMessage={sendMessage}
          playerId={playerId}
          gameId={gameId}
          deadline={phaseTimers.playing.deadline}
          duration={phaseTimers.playing.duration}
        />
      )}
      
      {phase === 'voting' && (
        <VotingPhase
          players={players}
          gameMode={gameMode}
          onSubmitVote={submitVote}
        />
      )}
      
      {phase === 'results' && (
        <ResultsPhase
          results={results}
          onPlayAgain={backToMenu}
        />
      )}
    </div>
  )
}

export default GameApp

