import GamePhase from './GamePhase'

function ReactStage({ messages, players, aliases, onSendMessage, playerId, deadline }) {
  return (
    <GamePhase
      stage="react"
      gameMode="group"
      messages={messages}
      players={players}
      onSendMessage={onSendMessage}
      playerId={playerId}
      deadline={deadline}
      aliases={aliases}
      duration={120}
      headerTag="Aftershock"
      headerTitle="React to the reveals. Compare notes. Set the final trap."
      tipMessage="Call out contradictions, reference specific answers, and watch who stalls when pressed."
    />
  )
}

export default ReactStage


