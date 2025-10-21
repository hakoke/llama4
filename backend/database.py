from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from pgvector.sqlalchemy import Vector
from config import get_settings

settings = get_settings()

# Update database URL to new one
DATABASE_URL = "postgresql://postgres:wlfrfCfSOCDAKFwzOqRogeixzVOXiyET@turntable.proxy.rlwy.net:39953/railway"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# GAME TABLES

class GameSession(Base):
    __tablename__ = "game_sessions"
    
    id = Column(String, primary_key=True, index=True)
    mode = Column(String)  # 'group' or 'private'
    status = Column(String)  # 'lobby', 'learning', 'researching', 'playing', 'voting', 'finished'
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    current_round = Column(Integer, default=0)
    total_rounds = Column(Integer, default=1)
    settings = Column(JSON, nullable=True)

class UserAccount(Base):
    __tablename__ = "user_accounts"
    
    id = Column(String, primary_key=True, index=True)
    nickname = Column(String, unique=True, index=True)  # Just a nickname, no password!
    created_at = Column(DateTime, default=datetime.utcnow)
    games_played = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    # AI learns about this person over time
    persistent_profile = Column(JSON, nullable=True)

class Player(Base):
    __tablename__ = "players"
    
    id = Column(String, primary_key=True, index=True)
    game_id = Column(String, ForeignKey('game_sessions.id'), index=True)
    user_account_id = Column(String, ForeignKey('user_accounts.id'), nullable=True)  # Link to account
    username = Column(String)  # Display name for this game
    social_handles = Column(JSON, nullable=True)  # {instagram, twitter, linkedin, facebook, github, etc}
    joined_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Integer, default=0)
    is_connected = Column(Boolean, default=True)

class PersonalityProfile(Base):
    __tablename__ = "personality_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey('game_sessions.id'), index=True)
    player_id = Column(String, ForeignKey('players.id'), index=True)
    
    # Learned from chat
    typing_patterns = Column(JSON, nullable=True)  # caps, typos, speed, etc
    writing_style = Column(JSON, nullable=True)  # words, phrases, emoji usage
    personality_traits = Column(JSON, nullable=True)  # interests, preferences
    
    # Scraped from web
    web_data = Column(JSON, nullable=True)
    instagram_data = Column(JSON, nullable=True)
    linkedin_data = Column(JSON, nullable=True)
    twitter_data = Column(JSON, nullable=True)
    
    # AI impersonation strategy
    impersonation_notes = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.5)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class GameMessage(Base):
    __tablename__ = "game_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey('game_sessions.id'), index=True)
    round_number = Column(Integer, default=0)
    phase = Column(String)  # 'learning', 'game'
    
    sender_id = Column(String)  # player_id or 'ai'
    recipient_id = Column(String, nullable=True)  # for private messages
    impersonating_id = Column(String, nullable=True)  # if AI, who is it impersonating
    
    content = Column(Text)
    is_ai = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Style metadata
    typing_metadata = Column(JSON, nullable=True)

class GameRound(Base):
    __tablename__ = "game_rounds"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey('game_sessions.id'), index=True)
    round_number = Column(Integer)
    
    # For private mode
    participant1_id = Column(String, nullable=True)
    participant2_id = Column(String, nullable=True)
    ai_impersonating_id = Column(String, nullable=True)  # who is AI pretending to be
    
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=120)

class PlayerVote(Base):
    __tablename__ = "player_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey('game_sessions.id'), index=True)
    round_number = Column(Integer)
    voter_id = Column(String, ForeignKey('players.id'))
    
    # For group mode: who is the AI?
    voted_ai_id = Column(String, nullable=True)
    
    # For private mode: who did I talk to?
    guessed_partner_id = Column(String, nullable=True)
    actual_partner_id = Column(String, nullable=True)
    
    is_correct = Column(Boolean, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

class GameResult(Base):
    __tablename__ = "game_results"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey('game_sessions.id'), index=True)
    
    winner_ids = Column(JSON, nullable=True)  # list of player IDs
    ai_success_rate = Column(Float)  # % of players fooled
    
    player_scores = Column(JSON, nullable=True)
    round_results = Column(JSON, nullable=True)
    
    analysis = Column(Text, nullable=True)  # AI's summary
    created_at = Column(DateTime, default=datetime.utcnow)

# UNIVERSAL AI CONSCIOUSNESS

class UniversalKnowledge(Base):
    __tablename__ = "universal_knowledge"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)  # 'typing_patterns', 'personality_markers', etc
    pattern = Column(Text)
    description = Column(Text)
    
    success_rate = Column(Float, default=0.5)
    times_used = Column(Integer, default=0)
    times_successful = Column(Integer, default=0)
    
    confidence = Column(Float, default=0.5)
    last_updated = Column(DateTime, default=datetime.utcnow)
    meta_info = Column(JSON, nullable=True)

class AIReasoning(Base):
    __tablename__ = "ai_reasoning"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, ForeignKey('game_sessions.id'), index=True)
    
    phase = Column(String)  # 'learning', 'impersonation', 'reflection'
    reasoning_chain = Column(Text)  # AI's thought process
    decision = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    
    learned_insight = Column(Text, nullable=True)  # what it learned
    added_to_universal = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

# ORIGINAL CHAT TABLES (keep for backwards compatibility)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    role = Column(String)
    content = Column(Text)
    image_url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    embedding = Column(Vector(1536), nullable=True)

class Memory(Base):
    __tablename__ = "memories"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    memory_type = Column(String)
    content = Column(Text)
    confidence = Column(Float, default=1.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    meta_info = Column(JSON, nullable=True)
    embedding = Column(Vector(1536), nullable=True)

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    meta_info = Column(JSON, nullable=True)

def init_db():
    """Initialize database and create tables"""
    # Enable pgvector extension
    with engine.connect() as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.commit()
    
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

