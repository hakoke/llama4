from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}  # game_id -> [websockets]
        self.player_connections: Dict[str, WebSocket] = {}  # player_id -> websocket
    
    async def connect(self, websocket: WebSocket, game_id: str, player_id: str):
        await websocket.accept()
        
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        
        self.active_connections[game_id].append(websocket)
        self.player_connections[player_id] = websocket
    
    def disconnect(self, websocket: WebSocket, game_id: str, player_id: str):
        if game_id in self.active_connections:
            if websocket in self.active_connections[game_id]:
                self.active_connections[game_id].remove(websocket)
        
        if player_id in self.player_connections:
            del self.player_connections[player_id]
    
    async def send_personal_message(self, message: dict, player_id: str):
        """Send message to specific player"""
        if player_id in self.player_connections:
            websocket = self.player_connections[player_id]
            try:
                await websocket.send_json(message)
            except:
                pass
    
    async def broadcast_to_game(self, message: dict, game_id: str, exclude_player: str = None):
        """Broadcast message to all players in a game"""
        if game_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[game_id]:
                # Skip if this is the excluded player
                if exclude_player:
                    player_id = self._get_player_id_from_connection(connection)
                    if player_id == exclude_player:
                        continue
                
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
            
            # Remove disconnected websockets
            for conn in disconnected:
                if conn in self.active_connections[game_id]:
                    self.active_connections[game_id].remove(conn)
    
    def _get_player_id_from_connection(self, websocket: WebSocket) -> str:
        """Find player ID for a websocket connection"""
        for player_id, conn in self.player_connections.items():
            if conn == websocket:
                return player_id
        return None
    
    async def send_typing_indicator(self, game_id: str, player_id: str, is_typing: bool):
        """Send typing indicator"""
        await self.broadcast_to_game({
            "type": "typing",
            "player_id": player_id,
            "is_typing": is_typing
        }, game_id, exclude_player=player_id)

manager = ConnectionManager()

