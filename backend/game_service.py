import uuid
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from database import (
    GameSession, Player, PersonalityProfile, GameMessage,
    GameRound, PlayerVote, GameResult, AIReasoning, UniversalKnowledge
)
from web_scraper import web_scraper
from ai_impersonator import ai_impersonator

class GameService:
    def __init__(self, db: Session):
        self.db = db
    
    # GAME CREATION
    
    def create_game(self, mode: str = "group") -> GameSession:
        """Create new game session"""
        game = GameSession(
            id=str(uuid.uuid4()),
            mode=mode,
            status="lobby",
            settings={"learning_time": 180, "round_time": 120 if mode == "private" else 300}
        )
        self.db.add(game)
        self.db.commit()
        return game
    
    def join_game(self, game_id: str, username: str) -> Player:
        """Add player to game"""
        player = Player(
            id=str(uuid.uuid4()),
            game_id=game_id,
            username=username
        )
        self.db.add(player)
        self.db.commit()
        return player
    
    def update_player_handles(self, player_id: str, handles: Dict[str, str]):
        """Update player's social media handles"""
        player = self.db.query(Player).filter(Player.id == player_id).first()
        if player:
            player.social_handles = handles
            self.db.commit()
    
    # GAME FLOW
    
    def start_learning_phase(self, game_id: str):
        """Start the learning phase"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        if game:
            game.status = "learning"
            game.started_at = datetime.utcnow()
            self.db.commit()
    
    async def start_research_phase(self, game_id: str):
        """DEEP research all players - AI takes its time!"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        if not game:
            return
        
        game.status = "researching"
        self.db.commit()
        
        # Get all players
        players = self.db.query(Player).filter(Player.game_id == game_id).all()
        
        # THOROUGH research for each player - don't rush!
        for player in players:
            # Get their chat messages from learning phase
            messages = self.db.query(GameMessage).filter(
                GameMessage.game_id == game_id,
                GameMessage.sender_id == player.id,
                GameMessage.phase == "learning"
            ).all()
            
            # Analyze typing patterns
            typing_analysis = await ai_impersonator.analyze_typing_patterns([m.content for m in messages])
            
            # Search web for info
            web_data = {}
            if player.social_handles:
                web_data = await web_scraper.search_person(player.username, player.social_handles)
            
            # Create personality profile
            profile = PersonalityProfile(
                game_id=game_id,
                player_id=player.id,
                typing_patterns=typing_analysis,
                web_data=web_data
            )
            
            # Ask AI to build impersonation strategy
            strategy = await ai_impersonator.build_impersonation_strategy(
                player.username,
                [m.content for m in messages],
                typing_analysis,
                web_data
            )
            
            profile.impersonation_notes = strategy["notes"]
            profile.confidence_score = strategy["confidence"]
            profile.writing_style = strategy["writing_style"]
            profile.personality_traits = strategy["personality"]
            
            self.db.add(profile)
        
        self.db.commit()
    
    def start_game_phase(self, game_id: str):
        """Start the actual game"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        if not game:
            return
        
        game.status = "playing"
        game.current_round = 1
        
        if game.mode == "group":
            game.total_rounds = 1
            # Pick random player for AI to impersonate
            players = self.db.query(Player).filter(Player.game_id == game_id).all()
            if players:
                target = random.choice(players)
                # Store in game settings
                settings = game.settings or {}
                settings["ai_target_id"] = target.id
                game.settings = settings
        
        elif game.mode == "private":
            # Create rounds for private mode
            players = self.db.query(Player).filter(Player.game_id == game_id).all()
            game.total_rounds = len(players)
            
            # Create pairings for each round
            self._create_private_rounds(game_id, players)
        
        self.db.commit()
    
    def _create_private_rounds(self, game_id: str, players: List[Player]):
        """Create round pairings for private mode"""
        player_ids = [p.id for p in players]
        
        for round_num in range(1, len(players) + 1):
            # Shuffle players each round
            shuffled = player_ids.copy()
            random.shuffle(shuffled)
            
            # Create pairs
            pairs = []
            for i in range(0, len(shuffled), 2):
                if i + 1 < len(shuffled):
                    pairs.append((shuffled[i], shuffled[i + 1]))
            
            # Randomly replace one person in random pair with AI
            if pairs:
                ai_pair_idx = random.randint(0, len(pairs) - 1)
                ai_replaces_idx = random.randint(0, 1)
                ai_impersonates_id = pairs[ai_pair_idx][ai_replaces_idx]
                
                # Create round
                game_round = GameRound(
                    game_id=game_id,
                    round_number=round_num,
                    participant1_id=pairs[ai_pair_idx][0] if ai_replaces_idx == 1 else "ai",
                    participant2_id=pairs[ai_pair_idx][1] if ai_replaces_idx == 0 else "ai",
                    ai_impersonating_id=ai_impersonates_id
                )
                self.db.add(game_round)
        
        self.db.commit()
    
    async def send_message(self, game_id: str, sender_id: str, content: str, 
                          recipient_id: Optional[str] = None, is_ai: bool = False,
                          impersonating_id: Optional[str] = None) -> GameMessage:
        """Send a message in the game"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        
        msg = GameMessage(
            game_id=game_id,
            round_number=game.current_round if game else 0,
            phase=game.status if game else "learning",
            sender_id=sender_id,
            recipient_id=recipient_id,
            content=content,
            is_ai=is_ai,
            impersonating_id=impersonating_id
        )
        
        self.db.add(msg)
        self.db.commit()
        return msg
    
    def submit_vote(self, game_id: str, voter_id: str, vote_data: Dict) -> PlayerVote:
        """Submit a player's vote/guess"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        
        vote = PlayerVote(
            game_id=game_id,
            round_number=game.current_round if game else 0,
            voter_id=voter_id,
            voted_ai_id=vote_data.get("voted_ai_id"),
            guessed_partner_id=vote_data.get("guessed_partner_id")
        )
        
        self.db.add(vote)
        self.db.commit()
        return vote
    
    async def finish_game(self, game_id: str) -> GameResult:
        """Calculate results and finish game"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        if not game:
            return None
        
        game.status = "finished"
        game.ended_at = datetime.utcnow()
        
        # Calculate results
        votes = self.db.query(PlayerVote).filter(PlayerVote.game_id == game_id).all()
        players = self.db.query(Player).filter(Player.game_id == game_id).all()
        
        if game.mode == "group":
            ai_target_id = game.settings.get("ai_target_id")
            correct_votes = sum(1 for v in votes if v.voted_ai_id == ai_target_id)
            ai_success_rate = 1 - (correct_votes / len(votes)) if votes else 0
        
        else:  # private mode
            # Calculate per-round success
            correct_guesses = sum(1 for v in votes if v.is_correct)
            ai_success_rate = 1 - (correct_guesses / len(votes)) if votes else 0
        
        # Generate AI's analysis of each player
        analysis = await ai_impersonator.generate_game_analysis(game_id, players)
        
        result = GameResult(
            game_id=game_id,
            ai_success_rate=ai_success_rate,
            player_scores={p.id: p.score for p in players},
            analysis=analysis
        )
        
        self.db.add(result)
        self.db.commit()
        
        # AI self-reflection and universal learning
        await self._ai_reflection(game_id, ai_success_rate)
        
        return result
    
    async def _ai_reflection(self, game_id: str, success_rate: float):
        """AI reflects on game and updates universal knowledge"""
        # Ask AI to reflect on what worked/didn't work
        reflection = await ai_impersonator.reflect_on_game(game_id, success_rate)
        
        reasoning = AIReasoning(
            game_id=game_id,
            phase="reflection",
            reasoning_chain=reflection["reasoning"],
            learned_insight=reflection["insight"]
        )
        self.db.add(reasoning)
        
        # Update universal knowledge if insight is valuable
        if reflection.get("add_to_universal") and reflection.get("pattern"):
            knowledge = UniversalKnowledge(
                category=reflection["category"],
                pattern=reflection["pattern"],
                description=reflection["insight"],
                confidence=success_rate
            )
            self.db.add(knowledge)
            reasoning.added_to_universal = True
        
        self.db.commit()
    
    # HELPER METHODS
    
    def get_game(self, game_id: str) -> Optional[GameSession]:
        return self.db.query(GameSession).filter(GameSession.id == game_id).first()
    
    def get_players(self, game_id: str) -> List[Player]:
        return self.db.query(Player).filter(Player.game_id == game_id).all()
    
    def get_personality_profile(self, player_id: str) -> Optional[PersonalityProfile]:
        return self.db.query(PersonalityProfile).filter(
            PersonalityProfile.player_id == player_id
        ).first()
    
    def get_messages(self, game_id: str, phase: Optional[str] = None, 
                    round_num: Optional[int] = None) -> List[GameMessage]:
        query = self.db.query(GameMessage).filter(GameMessage.game_id == game_id)
        
        if phase:
            query = query.filter(GameMessage.phase == phase)
        if round_num is not None:
            query = query.filter(GameMessage.round_number == round_num)
        
        return query.order_by(GameMessage.timestamp).all()

