from sqlalchemy.orm import Session
from database import Memory, Message
from datetime import datetime
from typing import List, Dict
import json

class MemoryService:
    def __init__(self, db: Session):
        self.db = db
    
    def store_memory(self, session_id: str, memory_data: Dict):
        """Store a new memory"""
        memory = Memory(
            session_id=session_id,
            memory_type=memory_data.get("type", "other"),
            content=memory_data["content"],
            confidence=memory_data.get("confidence", 1.0),
            metadata=memory_data.get("metadata", {})
        )
        self.db.add(memory)
        self.db.commit()
        return memory
    
    def get_memories(self, session_id: str, limit: int = 50) -> List[str]:
        """Get all memories for a session"""
        memories = self.db.query(Memory).filter(
            Memory.session_id == session_id,
            Memory.confidence > 0.5  # Only confident memories
        ).order_by(Memory.timestamp.desc()).limit(limit).all()
        
        return [f"[{m.memory_type}] {m.content}" for m in memories]
    
    def get_recent_messages(self, session_id: str, limit: int = 10) -> List[Dict]:
        """Get recent messages for context"""
        messages = self.db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.timestamp.desc()).limit(limit).all()
        
        return [
            {
                "role": m.role,
                "content": m.content,
                "image_url": m.image_url,
                "timestamp": m.timestamp.isoformat()
            }
            for m in reversed(messages)
        ]
    
    def store_message(self, session_id: str, role: str, content: str, image_url: str = None):
        """Store a message"""
        message = Message(
            session_id=session_id,
            role=role,
            content=content,
            image_url=image_url
        )
        self.db.add(message)
        self.db.commit()
        return message
    
    def get_memory_summary(self, session_id: str) -> Dict:
        """Get summary of memories by type"""
        memories = self.db.query(Memory).filter(
            Memory.session_id == session_id
        ).all()
        
        summary = {
            "total": len(memories),
            "by_type": {},
            "recent": []
        }
        
        for m in memories:
            summary["by_type"][m.memory_type] = summary["by_type"].get(m.memory_type, 0) + 1
        
        recent = sorted(memories, key=lambda x: x.timestamp, reverse=True)[:5]
        summary["recent"] = [{"type": m.memory_type, "content": m.content} for m in recent]
        
        return summary
    
    def clear_session(self, session_id: str):
        """Clear all data for a session"""
        self.db.query(Memory).filter(Memory.session_id == session_id).delete()
        self.db.query(Message).filter(Message.session_id == session_id).delete()
        self.db.commit()

