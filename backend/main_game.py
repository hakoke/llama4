from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
import asyncio
import json
from datetime import datetime, timedelta

from database import init_db, get_db, Player, PlayerVote, SessionLocal
from game_service import GameService
from websocket_handler import manager
from ai_impersonator import ai_impersonator

app = FastAPI(title="AI Impostor Game API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup_event():
    init_db()

# MODELS

class CreateGameRequest(BaseModel):
    mode: str = "group"  # 'group' or 'private'

class JoinGameRequest(BaseModel):
    username: str
    game_id: str

class UpdateHandlesRequest(BaseModel):
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    tiktok: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str
    recipient_id: Optional[str] = None

class VoteRequest(BaseModel):
    voted_ai_id: Optional[str] = None
    guessed_partner_id: Optional[str] = None

# ROUTES

@app.get("/")
async def root():
    return {
        "game": "AI Impostor - Turing Test Game",
        "version": "1.0.0",
        "status": "ready"
    }

@app.post("/game/create")
async def create_game(request: CreateGameRequest, db: Session = Depends(get_db)):
    """Create a new game"""
    game_service = GameService(db)
    game = game_service.create_game(mode=request.mode)
    
    return {
        "game_id": game.id,
        "mode": game.mode,
        "status": game.status
    }

@app.post("/game/join")
async def join_game(request: JoinGameRequest, db: Session = Depends(get_db)):
    """Join an existing game"""
    game_service = GameService(db)
    
    # Check if game exists
    game = game_service.get_game(request.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game.status != "lobby":
        raise HTTPException(status_code=400, detail="Game already started")
    
    player = game_service.join_game(request.game_id, request.username)
    
    # Notify other players
    await manager.broadcast_to_game({
        "type": "player_joined",
        "player": {"id": player.id, "username": player.username}
    }, request.game_id)
    
    return {
        "player_id": player.id,
        "username": player.username,
        "game_id": request.game_id
    }

@app.post("/game/{game_id}/player/{player_id}/handles")
async def update_handles(
    game_id: str,
    player_id: str,
    request: UpdateHandlesRequest,
    db: Session = Depends(get_db)
):
    """Update player's social media handles"""
    game_service = GameService(db)
    
    handles = {
        "instagram": request.instagram,
        "twitter": request.twitter,
        "linkedin": request.linkedin,
        "tiktok": request.tiktok
    }
    # Remove None values
    handles = {k: v for k, v in handles.items() if v}
    
    game_service.update_player_handles(player_id, handles)
    
    return {"status": "updated", "handles": handles}

class PhaseScheduler:
    """Simple scheduler to track when phases should auto-trigger."""
    def __init__(self):
        self.learning_deadlines: Dict[str, float] = {}
        self.play_deadlines: Dict[str, float] = {}

phase_scheduler = PhaseScheduler()

async def schedule_learning_end(game_id: str, duration: int = 180, deadline: Optional[float] = None):
    if deadline is None:
        deadline = datetime.utcnow().timestamp() + duration
    phase_scheduler.learning_deadlines[game_id] = deadline
    sleep_time = max(0, deadline - datetime.utcnow().timestamp())
    await asyncio.sleep(sleep_time)
    try:
        await start_research_phase(game_id)
    except Exception as exc:
        print(f"Learning phase auto-transition failed: {exc}")

async def schedule_play_end(game_id: str, duration: int = 300, deadline: Optional[float] = None):
    if deadline is None:
        deadline = datetime.utcnow().timestamp() + duration
    phase_scheduler.play_deadlines[game_id] = deadline
    sleep_time = max(0, deadline - datetime.utcnow().timestamp())
    await asyncio.sleep(sleep_time)
    try:
        await start_voting_phase(game_id)
    except Exception as exc:
        print(f"Game phase auto-transition failed: {exc}")

@app.post("/game/{game_id}/start")
async def start_game(game_id: str, db: Session = Depends(get_db)):
    """Start the learning phase"""
    game_service = GameService(db)
    game = game_service.get_game(game_id)
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game_service.start_learning_phase(game_id)
    
    # Notify all players
    learning_duration = game.settings.get("learning_time", 180)
    learning_deadline = datetime.utcnow().timestamp() + learning_duration
    await manager.broadcast_to_game({
        "type": "phase_change",
        "phase": "learning",
        "duration": learning_duration,
        "deadline": learning_deadline
    }, game_id)
    
    # Start AI conversations with each player
    players = game_service.get_players(game_id)
    for player in players:
        asyncio.create_task(ai_learning_conversation(game_id, player.id, db))
    
    asyncio.create_task(schedule_learning_end(game_id, duration=learning_duration, deadline=learning_deadline))
    
    return {"status": "learning_started"}

async def ai_learning_conversation(game_id: str, player_id: str, db: Session):
    """AI has a learning conversation with a player"""
    game_service = GameService(db)
    
    # AI asks first question
    first_question = await ai_impersonator.ask_learning_question([])
    stored = await game_service.send_message(
        game_id=game_id,
        sender_id="ai",
        recipient_id=player_id,
        content=first_question,
        is_ai=True
    )
    await manager.send_personal_message({
        "type": "chat_message",
        "content": first_question,
        "phase": "learning",
        "sender_id": "ai",
        "recipient_id": player_id,
        "timestamp": stored.timestamp.isoformat(),
        "username": "AI"
    }, player_id)

async def start_research_phase(game_id: str, db: Optional[Session] = None):
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True
    try:
        game_service = GameService(db)
        await manager.broadcast_to_game({
            "type": "phase_change",
            "phase": "researching",
            "message": "AI is researching you on the internet..."
        }, game_id)
        await game_service.start_research_phase(game_id)
        game_service.start_game_phase(game_id)
        game = game_service.get_game(game_id)
        play_duration = game.settings.get("round_time", 300) if game else 300
        play_deadline = datetime.utcnow().timestamp() + play_duration
        await manager.broadcast_to_game({
            "type": "phase_change",
            "phase": "playing",
            "duration": play_duration,
            "deadline": play_deadline
        }, game_id)
        asyncio.create_task(schedule_play_end(game_id, duration=play_duration, deadline=play_deadline))
    finally:
        if own_db:
            db.close()

@app.post("/game/{game_id}/research")
async def research_endpoint(game_id: str):
    await start_research_phase(game_id)
    return {"status": "game_started"}

async def start_voting_phase(game_id: str, db: Optional[Session] = None):
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True
    try:
        game_service = GameService(db)
        game = game_service.get_game(game_id)
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        game.status = "voting"
        db.commit()
        await manager.broadcast_to_game({
            "type": "phase_change",
            "phase": "voting",
            "message": "Time to vote!"
        }, game_id)
    finally:
        if own_db:
            db.close()

@app.post("/game/{game_id}/voting")
async def voting_endpoint(game_id: str):
    await start_voting_phase(game_id)
    return {"status": "voting_started"}

@app.post("/game/{game_id}/player/{player_id}/vote")
async def submit_vote(
    game_id: str,
    player_id: str,
    request: VoteRequest,
    db: Session = Depends(get_db)
):
    """Submit a vote/guess"""
    game_service = GameService(db)
    
    vote_data = {
        "voted_ai_id": request.voted_ai_id,
        "guessed_partner_id": request.guessed_partner_id
    }
    
    vote = game_service.submit_vote(game_id, player_id, vote_data)
    
    # Check if all players have voted
    game = game_service.get_game(game_id)
    players = game_service.get_players(game_id)
    votes = db.query(PlayerVote).filter(PlayerVote.game_id == game_id).all()
    
    if len(votes) >= len(players):
        await finish_game(game_id, db)
    
    return {"status": "vote_submitted"}

async def finish_game_auto(game_id: str, db: Session):
    """Auto-finish game when all votes are in"""
    await asyncio.sleep(2)  # Small delay for dramatic effect
    game_service = GameService(db)
    result = await game_service.finish_game(game_id)
    
    # Broadcast results to all players
    await manager.broadcast_to_game({
        "type": "game_finished",
        "results": {
            "ai_target": result.ai_target_id if hasattr(result, 'ai_target_id') else None,
            "ai_success_rate": result.ai_success_rate,
            "analysis": result.analysis
        }
    }, game_id)

@app.post("/game/{game_id}/finish")
async def finish_game(game_id: str, db: Session = Depends(get_db)):
    """Finish game and calculate results"""
    game_service = GameService(db)
    
    result = await game_service.finish_game(game_id)
    
    # Broadcast results to all players
    await manager.broadcast_to_game({
        "type": "game_finished",
        "results": {
            "ai_success_rate": result.ai_success_rate,
            "analysis": result.analysis,
            "scores": result.player_scores,
            "player_insights": getattr(result, "player_insights", None)
        }
    }, game_id)
    
    return {
        "ai_success_rate": result.ai_success_rate,
        "analysis": result.analysis
    }

@app.get("/game/{game_id}")
async def get_game_state(game_id: str, db: Session = Depends(get_db)):
    """Get current game state"""
    game_service = GameService(db)
    
    game = game_service.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    players = game_service.get_players(game_id)
    
    return {
        "game_id": game.id,
        "mode": game.mode,
        "status": game.status,
        "current_round": game.current_round,
        "total_rounds": game.total_rounds,
        "players": [
            {"id": p.id, "username": p.username, "score": p.score}
            for p in players
        ]
    }

# WEBSOCKET

@app.websocket("/ws/{game_id}/{player_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    game_id: str,
    player_id: str
):
    await manager.connect(websocket, game_id, player_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            msg_type = message_data.get("type")
            
            if msg_type == "chat_message":
                # Player sent a message
                content = message_data.get("content")
                
                # Get DB session
                db = next(get_db())
                game_service = GameService(db)
                game = game_service.get_game(game_id)
                player = game_service.get_player(player_id)
                
                recipient_id = None
                if game.status == "learning":
                    recipient_id = "ai"
                
                stored_message = await game_service.send_message(
                    game_id=game_id,
                    sender_id=player_id,
                    content=content,
                    recipient_id=recipient_id
                )
                payload = {
                    "type": "chat_message",
                    "sender_id": player_id,
                    "username": player.username,
                    "content": content,
                    "timestamp": stored_message.timestamp.isoformat(),
                    "phase": game.status,
                    "recipient_id": stored_message.recipient_id
                }
                
                if game.status == "learning":
                    await manager.send_personal_message(payload, player_id)
                else:
                    await manager.broadcast_to_game(payload, game_id)
                
                # AI responses
                if game.status == "learning":
                    asyncio.create_task(
                        ai_respond_learning(game_id, player_id, content, db)
                    )
                elif game.mode == "group" and game.status == "playing":
                    if game.settings.get("ai_target_id"):
                        asyncio.create_task(
                            ai_respond_in_game(game_id, player_id, content, db)
                        )
            
            elif msg_type == "typing":
                # Typing indicator
                is_typing = message_data.get("is_typing", False)
                await manager.send_typing_indicator(game_id, player_id, is_typing)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, game_id, player_id)
        await manager.broadcast_to_game({
            "type": "player_disconnected",
            "player_id": player_id
        }, game_id)

async def ai_respond_learning(game_id: str, player_id: str, user_message: str, db: Session):
    """AI responds during learning phase"""
    game_service = GameService(db)
    
    # Get conversation history
    messages = game_service.get_messages(game_id, phase="learning")
    player_messages = [m for m in messages if m.recipient_id == player_id or m.sender_id == player_id]
    
    # Build conversation history for AI
    history = []
    for msg in player_messages[-10:]:  # Last 10 messages
        role = "assistant" if msg.is_ai else "user"
        history.append({"role": role, "content": msg.content})
    
    # Add current message
    history.append({"role": "user", "content": user_message})
    
    ai_response = await ai_impersonator.ask_learning_question(history)
    stored = await game_service.send_message(
        game_id=game_id,
        sender_id="ai",
        recipient_id=player_id,
        content=ai_response,
        is_ai=True
    )
    await manager.send_personal_message({
        "type": "chat_message",
        "sender_id": "ai",
        "username": "AI",
        "content": ai_response,
        "phase": "learning",
        "recipient_id": player_id,
        "timestamp": stored.timestamp.isoformat()
    }, player_id)

async def ai_respond_in_game(game_id: str, replying_to_player: str, message: str, db: Session):
    """AI responds during game phase (while impersonating)"""
    game_service = GameService(db)
    game = game_service.get_game(game_id)
    
    if not game:
        return
    
    # Get who AI is impersonating
    target_id = game.settings.get("ai_target_id")
    if not target_id:
        return
    
    # Get personality profile
    profile = game_service.get_personality_profile(target_id)
    if not profile:
        return
    
    # Get recent conversation
    messages = game_service.get_messages(game_id, phase="game")
    history = [
        {"role": "user" if not m.is_ai else "assistant", "content": m.content}
        for m in messages[-10:]
    ]
    history.append({"role": "user", "content": message})
    
    # AI generates response as the target
    profile_dict = {
        "personality_traits": profile.personality_traits,
        "typing_patterns": profile.typing_patterns,
        "writing_style": profile.writing_style,
        "web_data": profile.web_data
    }
    
    player = db.query(Player).filter(Player.id == target_id).first()
    username = player.username if player else "User"
    
    ai_response = await ai_impersonator.impersonate(
        username=username,
        profile=profile_dict,
        message_history=history
    )
    
    # Store and broadcast
    stored = await game_service.send_message(
        game_id=game_id,
        sender_id="ai",
        content=ai_response,
        is_ai=True,
        impersonating_id=target_id
    )
    payload = {
        "type": "chat_message",
        "sender_id": target_id,
        "username": username,
        "content": ai_response,
        "timestamp": stored.timestamp.isoformat(),
        "phase": "playing",
        "impersonated_by": "ai"
    }
    await manager.broadcast_to_game(payload, game_id)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

