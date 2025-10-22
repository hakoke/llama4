from sqlalchemy.orm import Session
from database import Memory, Message, UniversalKnowledge
from datetime import datetime
from typing import List, Dict, Optional
import json
import asyncio

class MemoryService:
    def __init__(self, db: Session):
        self.db = db
    
    def store_memory(self, session_id: str, memory_data: Dict):
        """Store a new memory with semantic embedding"""
        # Use provided embedding or generate asynchronously
        embedding = memory_data.get("embedding")
        if not embedding:
            # For now, use sync pseudo-embedding; upgrade to async in background task
            embedding = self._generate_embedding(memory_data.get("content", ""))
            # Schedule async embedding generation in background
            asyncio.create_task(self._upgrade_memory_embedding(session_id, memory_data.get("content", "")))
        
        memory = Memory(
            session_id=session_id,
            memory_type=memory_data.get("type", "other"),
            content=memory_data["content"],
            confidence=memory_data.get("confidence", 1.0),
            meta_info=memory_data.get("metadata", {}),
            embedding=embedding
        )
        self.db.add(memory)
        self.db.commit()
        return memory
    
    async def _upgrade_memory_embedding(self, session_id: str, content: str):
        """Upgrade pseudo-embedding to real embedding in background"""
        try:
            from embedding_service import embedding_service
            
            # Generate real embedding
            real_embedding = await embedding_service.generate_embedding(content)
            
            # Update the most recent memory with this content
            memory = self.db.query(Memory).filter(
                Memory.session_id == session_id,
                Memory.content == content
            ).order_by(Memory.timestamp.desc()).first()
            
            if memory:
                memory.embedding = real_embedding
                self.db.commit()
        except Exception as e:
            print(f"Background embedding upgrade failed: {e}")
    
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

    async def retrieve_similar_memories(self, query: str, session_id: str, limit: int = 8) -> List[str]:
        """Retrieve memories semantically similar to query using embeddings"""
        try:
            from embedding_service import embedding_service
            
            # Generate query embedding
            query_embedding = await embedding_service.generate_embedding(query)
            
            # Get all memories with embeddings
            memories = self.db.query(Memory).filter(
                Memory.session_id == session_id,
                Memory.confidence > 0.5,
                Memory.embedding.isnot(None)
            ).all()
            
            if not memories:
                return []
            
            # Build candidate list
            candidates = []
            for mem in memories:
                embedding = mem.embedding if isinstance(mem.embedding, list) else json.loads(mem.embedding)
                candidates.append((mem.id, embedding, mem.content))
            
            # Find similar
            similar = await embedding_service.find_similar(query_embedding, candidates, top_k=limit)
            
            return [f"[{mem[2]}]" for mem in similar if mem[1] > 0.3]  # similarity threshold
        except Exception as e:
            print(f"Embedding retrieval error: {e}, falling back to recency")
            return self.get_memories(session_id, limit=limit)
    
    async def retrieve_universal_knowledge(self, query: str, category: Optional[str] = None, limit: int = 8) -> List[Dict]:
        """Retrieve universal knowledge using semantic search"""
        try:
            from embedding_service import embedding_service
            
            # Generate query embedding
            query_embedding = await embedding_service.generate_embedding(query)
            
            # Get relevant knowledge
            query = self.db.query(UniversalKnowledge).filter(
                UniversalKnowledge.confidence > 0.6
            )
            
            if category:
                query = query.filter(UniversalKnowledge.category == category)
            
            knowledge_entries = query.all()
            
            if not knowledge_entries:
                return []
            
            # Build candidates
            candidates = []
            for entry in knowledge_entries:
                # Combine pattern + description for embedding
                text = f"{entry.pattern}: {entry.description}"
                # Generate embedding if not cached
                if isinstance(entry.meta_info, dict) and "embedding" in entry.meta_info:
                    embedding = entry.meta_info["embedding"]
                else:
                    embedding = await embedding_service.generate_embedding(text)
                    # Store for future use
                    meta = entry.meta_info or {}
                    meta["embedding"] = embedding
                    entry.meta_info = meta
                
                candidates.append((entry.id, embedding, {
                    "category": entry.category,
                    "pattern": entry.pattern,
                    "description": entry.description,
                    "confidence": entry.confidence
                }))
            
            # Commit any meta updates
            self.db.commit()
            
            # Find similar
            similar = await embedding_service.find_similar(query_embedding, candidates, top_k=limit)
            
            return [item[2] for item in similar if item[1] > 0.25]
        except Exception as e:
            print(f"Universal knowledge retrieval error: {e}")
            # Fallback to highest confidence
            entries = self.db.query(UniversalKnowledge).filter(
                UniversalKnowledge.confidence > 0.6
            ).order_by(UniversalKnowledge.confidence.desc()).limit(limit).all()
            
            return [{
                "category": e.category,
                "pattern": e.pattern,
                "description": e.description,
                "confidence": e.confidence
            } for e in entries]
    
    def _generate_embedding(self, text: str):
        """Generate a lightweight pseudo-embedding for retrieval augmentation (deprecated)"""
        # This is now handled by embedding_service
        if not text:
            return [0.0] * 8
        buckets = [0.0] * 8
        for idx, ch in enumerate(text[:512]):
            buckets[idx % 8] += ord(ch)
        total = sum(buckets) or 1.0
        return [round(value / total, 6) for value in buckets]

