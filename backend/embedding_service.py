"""
Embedding Service - Generates semantic embeddings for memory retrieval
Uses lightweight models for fast inference without GPU dependency
"""

import httpx
import json
import hashlib
from typing import List, Optional
from config import get_settings

settings = get_settings()

class EmbeddingService:
    def __init__(self):
        self.model_url = settings.local_model_url
        self.api_key = settings.openrouter_api_key
        self.use_local = settings.use_local_model
        self.cache = {}
        
    async def generate_embedding(self, text: str, use_cache: bool = True) -> List[float]:
        """Generate semantic embedding for text"""
        if not text or not text.strip():
            return [0.0] * 384  # Return zero vector for empty text
        
        # Simple caching to avoid redundant calls
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if use_cache and cache_key in self.cache:
            return self.cache[cache_key]
        
        # Try to use local model embeddings if available
        if self.use_local and self.model_url:
            try:
                embedding = await self._generate_local_embedding(text)
                if embedding:
                    self.cache[cache_key] = embedding
                    return embedding
            except Exception as e:
                print(f"Local embedding failed: {e}, falling back...")
        
        # Fallback to OpenRouter embedding endpoint (only if API key is configured)
        if self.api_key and self.api_key.strip():
            try:
                embedding = await self._generate_openrouter_embedding(text)
                self.cache[cache_key] = embedding
                return embedding
            except Exception as e:
                print(f"OpenRouter embedding failed: {e}, using deterministic fallback")
        else:
            print("OpenRouter API key not configured, using deterministic fallback")
        
        # Ultimate fallback: deterministic pseudo-embedding
        embedding = self._deterministic_embedding(text)
        self.cache[cache_key] = embedding
        return embedding
    
    async def _generate_local_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding using local vLLM server (if it supports embeddings)"""
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(
                    f"{self.model_url}/v1/embeddings",
                    headers={"Content-Type": "application/json"},
                    json={
                        "model": settings.local_model_name,
                        "input": text
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["data"][0]["embedding"]
            except Exception:
                pass
        
        return None
    
    async def _generate_openrouter_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenRouter's embedding models"""
        # Don't try OpenRouter if API key is empty
        if not self.api_key or self.api_key.strip() == "":
            raise Exception("OpenRouter API key not configured")
            
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "text-embedding-3-small",  # OpenAI's embedding model via OpenRouter
                    "input": text
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["data"][0]["embedding"]
            else:
                raise Exception(f"Embedding API error: {response.status_code}")
    
    def _deterministic_embedding(self, text: str, dimensions: int = 384) -> List[float]:
        """
        Generate deterministic pseudo-embedding using improved hashing
        Better than random but not semantic - suitable fallback
        """
        # Clean and normalize text
        text = text.lower().strip()
        
        # Multiple hash functions for different "features"
        embedding = []
        
        # Character-level features (first 96 dims)
        for i in range(96):
            chunk = text[i::96] if i < len(text) else ""
            hash_val = hashlib.sha256(f"{chunk}_{i}".encode()).digest()
            # Convert first 4 bytes to float in [-1, 1]
            val = int.from_bytes(hash_val[:4], 'big') / (2**31) - 1
            embedding.append(val)
        
        # Word-level features (next 96 dims)
        words = text.split()
        for i in range(96):
            word = words[i % len(words)] if words else ""
            hash_val = hashlib.sha256(f"word_{word}_{i}".encode()).digest()
            val = int.from_bytes(hash_val[:4], 'big') / (2**31) - 1
            embedding.append(val)
        
        # Bigram features (next 96 dims)
        bigrams = [text[i:i+2] for i in range(len(text)-1)] if len(text) > 1 else [text]
        for i in range(96):
            bigram = bigrams[i % len(bigrams)] if bigrams else ""
            hash_val = hashlib.sha256(f"bigram_{bigram}_{i}".encode()).digest()
            val = int.from_bytes(hash_val[:4], 'big') / (2**31) - 1
            embedding.append(val)
        
        # Semantic clustering features (last 96 dims)
        # Simple keyword-based "semantic" grouping
        keywords = {
            'positive': ['good', 'great', 'awesome', 'love', 'happy', 'yes'],
            'negative': ['bad', 'hate', 'angry', 'no', 'terrible'],
            'question': ['what', 'where', 'when', 'why', 'how', 'who'],
            'action': ['do', 'make', 'create', 'build', 'run', 'go'],
        }
        
        for i in range(96):
            category = list(keywords.keys())[i % len(keywords)]
            matches = sum(1 for kw in keywords[category] if kw in text)
            # Normalize to [-1, 1]
            val = (matches / max(len(keywords[category]), 1)) * 2 - 1
            embedding.append(val)
        
        # Ensure correct dimensions
        return embedding[:dimensions]
    
    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        mag1 = sum(a * a for a in vec1) ** 0.5
        mag2 = sum(b * b for b in vec2) ** 0.5
        
        if mag1 == 0 or mag2 == 0:
            return 0.0
        
        return dot_product / (mag1 * mag2)
    
    async def find_similar(self, query_embedding: List[float], 
                          candidate_embeddings: List[tuple], 
                          top_k: int = 5) -> List[tuple]:
        """
        Find most similar embeddings
        candidate_embeddings: List of (id, embedding, metadata) tuples
        Returns: List of (id, similarity_score, metadata) sorted by similarity
        """
        results = []
        for candidate_id, candidate_emb, metadata in candidate_embeddings:
            similarity = self.cosine_similarity(query_embedding, candidate_emb)
            results.append((candidate_id, similarity, metadata))
        
        # Sort by similarity descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

embedding_service = EmbeddingService()

