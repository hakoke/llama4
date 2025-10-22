import uuid
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Iterable, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import (
    GameSession, Player, PersonalityProfile, GameMessage,
    GameRound, PlayerVote, GameResult, AIReasoning, UniversalKnowledge,
    MindGame, MindGameResponse
)
from web_scraper import web_scraper
from ai_impersonator import ai_impersonator

GROUP_CHAT_DURATION = 180
MIND_GAMES_TOTAL_DURATION = 300
GROUP_REACT_DURATION = 120
MIND_GAME_PROMPT_DURATION = 90

ALIAS_POOL = [
    "Neon Wolf", "Ghost Signal", "Pixel Viper", "Lunar Echo", "Prism Riot",
    "Static Nova", "Violet Glitch", "Cobalt Orchid", "Crimson Phantom", "Chrome Fox",
    "Cyber Relic", "Voltage Muse", "Holo Shade", "Mythic Pulse", "Vanta Bloom",
    "Ion Mirage", "Sable Ember", "Arcade Siren", "Zenith Blur", "Vox Mirage"
]

ALIAS_COLORS = [
    "#9D4EDD", "#00F5FF", "#FF006E", "#F15BB5", "#00BBF9",
    "#FEE440", "#4CC9F0", "#4361EE", "#F72585", "#3A0CA3"
]

MIND_GAME_LIBRARY = [
    {
        "prompt": "What is a petty hill you'd absolutely die on?",
        "instructions": "Answer honestly or craft a ridiculous stance—either way, make it feel like you.",
        "reveal_title": "Petty Hill Royale"
    },
    {
        "prompt": "Describe your ideal weekend without using any words about time (no 'morning', 'night', 'hours').",
        "instructions": "Lean into vibe, energy, sensory detail.",
        "reveal_title": "Weekend Flex"
    },
    {
        "prompt": "You have to expose a harmless secret about yourself. What are you confessing?",
        "instructions": "Keep it light, weird, or oddly revealing.",
        "reveal_title": "Confessional Booth"
    },
    {
        "prompt": "You're forced to ban one everyday behavior forever. What goes and why?",
        "instructions": "Be dramatic, be serious, or be chaotic—your call.",
        "reveal_title": "Ban Hammer"
    },
    {
        "prompt": "Drop the most you-coded emoji combo for the word 'disaster'.",
        "instructions": "Minimum two emojis. Bonus points for cursed combos.",
        "reveal_title": "Emoji Diagnostics"
    }
]

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
        alias, color = self._generate_alias(game_id)
        player = Player(
            id=str(uuid.uuid4()),
            game_id=game_id,
            username=username
        )
        player.alias = alias
        player.alias_color = color
        player.alias_badge = alias[0] if alias else username[:1].upper()
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
                GameMessage.phase == "learning",
                or_(GameMessage.sender_id == player.id, GameMessage.recipient_id == player.id)
            ).order_by(GameMessage.timestamp.asc()).all()
            
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
                settings["group_timeline"] = self._build_group_timeline(players)
                game.settings = settings
                # Preload mind games
                self._prepare_mind_games(game_id, players)
        
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
    
    def _generate_alias(self, game_id: str) -> (str, str):
        existing_aliases = {p.alias for p in self.db.query(Player).filter(Player.game_id == game_id).all()}
        available_aliases = [alias for alias in ALIAS_POOL if alias not in existing_aliases]
        alias = random.choice(available_aliases or ALIAS_POOL)
        color = random.choice(ALIAS_COLORS)
        return alias, color

    def _build_group_timeline(self, players: List[Player]) -> Dict:
        now = datetime.utcnow()
        return {
            "chat_start": now.isoformat(),
            "chat_end": (now + timedelta(seconds=GROUP_CHAT_DURATION)).isoformat(),
            "mind_games_start": (now + timedelta(seconds=GROUP_CHAT_DURATION)).isoformat(),
            "mind_games_end": (now + timedelta(seconds=GROUP_CHAT_DURATION + MIND_GAMES_TOTAL_DURATION)).isoformat(),
            "react_start": (now + timedelta(seconds=GROUP_CHAT_DURATION + MIND_GAMES_TOTAL_DURATION)).isoformat(),
            "react_end": (now + timedelta(seconds=GROUP_CHAT_DURATION + MIND_GAMES_TOTAL_DURATION + GROUP_REACT_DURATION)).isoformat()
        }

    def _prepare_mind_games(self, game_id: str, players: List[Player]):
        random.shuffle(MIND_GAME_LIBRARY)
        selected = MIND_GAME_LIBRARY[:3]
        for idx, game_def in enumerate(selected, start=1):
            mind_game = MindGame(
                game_id=game_id,
                sequence=idx,
                prompt=game_def["prompt"],
                instructions=game_def.get("instructions"),
                reveal_title=game_def.get("reveal_title"),
                duration_seconds=game_def.get("duration", MIND_GAME_PROMPT_DURATION)
            )
            self.db.add(mind_game)
        self.db.commit()

    def log_mind_game_response(self, game_id: str, mind_game_id: int, player: Player, response: str, is_ai: bool, latency_ms: Optional[int]):
        alias = player.alias if player else None
        alias_badge = player.alias_badge if player else None
        alias_color = player.alias_color if player else None
        existing = self.db.query(MindGameResponse).filter(
            MindGameResponse.mind_game_id == mind_game_id,
            MindGameResponse.player_id == (None if is_ai else player.id) if player else MindGameResponse.player_id.is_(None)
        ).first()

        if existing:
            existing.response = response
            existing.is_ai = is_ai
            existing.latency_ms = latency_ms
            existing.alias = alias
            existing.alias_badge = alias_badge
            existing.alias_color = alias_color
            existing.submitted_at = datetime.utcnow()
        else:
            entry = MindGameResponse(
                game_id=game_id,
                mind_game_id=mind_game_id,
                player_id=None if is_ai else (player.id if player else None),
                alias=alias,
                alias_badge=alias_badge,
                alias_color=alias_color,
                response=response,
                is_ai=is_ai,
                latency_ms=latency_ms
            )
            self.db.add(entry)

        self.db.commit()

    def collect_mind_game_reveal(self, game_id: str) -> Dict[int, Dict]:
        mind_games = self.get_mind_games(game_id)
        responses = self.get_mind_game_responses(game_id)
        responses_by_game: Dict[int, List] = {}
        for mg in mind_games:
            responses_by_game[mg.id] = []

        for entry in responses:
            payload = {
                "alias": entry.alias,
                "alias_badge": entry.alias_badge,
                "alias_color": entry.alias_color,
                "response": entry.response,
                "latency_ms": entry.latency_ms,
                "is_ai": entry.is_ai,
                "player_id": entry.player_id
            }
            responses_by_game.setdefault(entry.mind_game_id, []).append(payload)

        reveal = {}
        for mg in mind_games:
            reveal[mg.id] = {
                "sequence": mg.sequence,
                "prompt": mg.prompt,
                "instructions": mg.instructions,
                "reveal_title": mg.reveal_title,
                "responses": responses_by_game.get(mg.id, [])
            }
        return reveal

    def set_group_stage(self, game_id: str, stage: str, deadline: Optional[datetime] = None):
        game = self.get_game(game_id)
        if not game:
            return
        settings = game.settings or {}
        settings["group_stage"] = stage
        if deadline:
            settings["group_stage_deadline"] = deadline.isoformat()
        else:
            settings.pop("group_stage_deadline", None)
        game.settings = settings
        if stage in {"mind_games", "react"}:
            game.status = stage
        self.db.commit()

    def alias_payload(self, game_id: str) -> Dict:
        players = self.get_players(game_id)
        return {
            p.id: {
                "alias": p.alias,
                "badge": p.alias_badge,
                "color": p.alias_color,
                "username": p.username
            }
            for p in players
        }

    async def send_message(self, game_id: str, sender_id: str, content: str, 
                          recipient_id: Optional[str] = None, is_ai: bool = False,
                          impersonating_id: Optional[str] = None,
                          display_alias: Optional[str] = None,
                          alias_badge: Optional[str] = None,
                          alias_color: Optional[str] = None,
                          latency_ms: Optional[int] = None) -> GameMessage:
        """Send a message in the game"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        sender_player = None
        if sender_id and sender_id != "ai":
            sender_player = self.get_player(sender_id)
        elif sender_id == "ai" and impersonating_id:
            sender_player = self.get_player(impersonating_id)

        if sender_player:
            if display_alias is None:
                display_alias = sender_player.alias or sender_player.username
            if alias_badge is None:
                alias_badge = sender_player.alias_badge or (sender_player.username[:1].upper() if sender_player.username else "?")
            if alias_color is None:
                alias_color = sender_player.alias_color
        
        msg = GameMessage(
            game_id=game_id,
            round_number=game.current_round if game else 0,
            phase=game.status if game else "learning",
            sender_id=sender_id,
            recipient_id=recipient_id,
            content=content,
            is_ai=is_ai,
            impersonating_id=impersonating_id,
            display_alias=display_alias,
            alias_badge=alias_badge,
            alias_color=alias_color,
            latency_ms=latency_ms
        )
        
        self.db.add(msg)
        self.db.commit()
        return msg
    
    def submit_vote(self, game_id: str, voter_id: str, vote_data: Dict) -> PlayerVote:
        """Submit a player's vote/guess"""
        game = self.db.query(GameSession).filter(GameSession.id == game_id).first()
        if not game:
            raise ValueError("Game not found")
        
        vote = PlayerVote(
            id=str(uuid.uuid4()),
            game_id=game_id,
            voter_id=voter_id,
            voted_ai_id=vote_data.get("voted_ai_id"),
            guessed_partner_id=vote_data.get("guessed_partner_id")
        )
        self.db.add(vote)
        self.db.commit()
        return vote

    def get_mind_games(self, game_id: str) -> List[MindGame]:
        return self.db.query(MindGame).filter(MindGame.game_id == game_id).order_by(MindGame.sequence.asc()).all()

    def get_mind_game_responses(self, game_id: str) -> List[MindGameResponse]:
        return self.db.query(MindGameResponse).filter(MindGameResponse.game_id == game_id).all()
    
    def get_game(self, game_id: str) -> Optional[GameSession]:
        return self.db.query(GameSession).filter(GameSession.id == game_id).first()
    
    def get_players(self, game_id: str) -> List[Player]:
        return self.db.query(Player).filter(Player.game_id == game_id).all()
    
    def get_player(self, player_id: str) -> Optional[Player]:
        return self.db.query(Player).filter(Player.id == player_id).first()
    
    def get_messages(self, game_id: str, phase: Optional[str] = None) -> List[GameMessage]:
        query = self.db.query(GameMessage).filter(GameMessage.game_id == game_id)
        if phase:
            query = query.filter(GameMessage.phase == phase)
        return query.order_by(GameMessage.timestamp.asc()).all()
    
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
        analysis_text = await ai_impersonator.generate_game_analysis(game_id, players)
        player_insights = await ai_impersonator.extract_player_insights(game_id, players, analysis_text)
        
        result = GameResult(
            game_id=game_id,
            ai_success_rate=ai_success_rate,
            player_scores={p.id: p.score for p in players},
            analysis=analysis_text,
            player_insights=player_insights
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
    
    def get_personality_profile(self, player_id: str) -> Optional[PersonalityProfile]:
        return self.db.query(PersonalityProfile).filter(
            PersonalityProfile.player_id == player_id
        ).first()

