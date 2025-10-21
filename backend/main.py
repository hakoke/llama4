from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
import base64
from io import BytesIO
from PIL import Image

from database import init_db, get_db, SessionLocal
from memory_service import MemoryService
from ai_service import ai_service

app = FastAPI(title="Unrestricted AI Chat API")

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Models
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    image_base64: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str
    memories_added: int

class MemorySummary(BaseModel):
    total: int
    by_type: dict
    recent: List[dict]

# Routes
@app.get("/")
async def root():
    return {
        "message": "🔥 Unrestricted AI Chat API",
        "version": "1.0.0",
        "model": "Llama 4 Maverick",
        "features": ["vision", "memory", "unrestricted"]
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Send a message and get AI response"""
    
    # Create or get session
    session_id = request.session_id or str(uuid.uuid4())
    memory_service = MemoryService(db)
    
    # Store user message
    memory_service.store_message(
        session_id=session_id,
        role="user",
        content=request.message,
        image_url="has_image" if request.image_base64 else None
    )
    
    # Get context
    memories = memory_service.get_memories(session_id)
    recent_messages = memory_service.get_recent_messages(session_id)
    
    # Generate response
    try:
        response = await ai_service.generate_response(
            messages=recent_messages,
            memories=memories,
            image_data=request.image_base64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    
    # Store assistant response
    memory_service.store_message(
        session_id=session_id,
        role="assistant",
        content=response
    )
    
    # Infer and store new memories
    new_memories = await ai_service.infer_memories(
        message=request.message,
        response=response,
        existing_memories=memories
    )
    
    memories_added = 0
    for memory_data in new_memories:
        try:
            memory_service.store_memory(session_id, memory_data)
            memories_added += 1
        except Exception as e:
            print(f"Error storing memory: {e}")
    
    return ChatResponse(
        session_id=session_id,
        response=response,
        memories_added=memories_added
    )

@app.get("/memory/{session_id}", response_model=MemorySummary)
async def get_memory_summary(session_id: str, db: Session = Depends(get_db)):
    """Get memory summary for a session"""
    memory_service = MemoryService(db)
    summary = memory_service.get_memory_summary(session_id)
    return summary

@app.delete("/session/{session_id}")
async def clear_session(session_id: str, db: Session = Depends(get_db)):
    """Clear all data for a session"""
    memory_service = MemoryService(db)
    memory_service.clear_session(session_id)
    return {"message": "Session cleared"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

