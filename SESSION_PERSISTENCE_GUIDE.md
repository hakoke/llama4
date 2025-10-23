# Session Persistence & Leave Game Feature

## Features Implemented ✅

### 1. **Auto-Reconnect on Refresh**
Players can now refresh the page and automatically rejoin their game!

**How it works:**
- Game state (gameId, playerId, username, phase, gameMode) is saved to localStorage
- When page loads, it checks for a saved session
- If session is less than 2 hours old, auto-reconnects
- Fetches latest game state from server
- Re-establishes WebSocket connection

**User Experience:**
- Refresh page → Instantly back in your game
- Close tab → Reopen within 2 hours → Game restored
- Session expires after 2 hours of inactivity

### 2. **Leave Game Confirmation Modal**
Beautiful confirmation dialog when leaving an active game.

**Features:**
- Animated modal with cyberpunk aesthetic
- Gradient text and glowing effects
- Two buttons: "Stay" and "Leave Game"
- Backdrop blur and smooth animations
- Mobile responsive
- Click outside to cancel
- Matches the game's visual style

**Triggers:**
- Click "⟵ Leave Game" button in Lobby
- Click "⟵ Leave Game" button in Learning Phase
- Shows warning: "You'll disconnect from the game and lose your progress"

### 3. **Session Management**
Properly clears session when:
- Player confirms leaving
- Game ends naturally
- Session expires (2 hours)
- Reconnection fails

## Files Modified

### Backend
- `backend/ai_impersonator.py` - AI now prioritizes asking for name/socials/location first

### Frontend
- `frontend/src/GameApp.jsx` - Session persistence, reconnect logic, Leave Game modal
- `frontend/src/GameApp.css` - Modal styling with animations
- `frontend/src/components/Lobby.jsx` - Updated button text to "Leave Game"
- `frontend/src/components/LearningPhase.jsx` - Updated button text + auto-scroll
- `frontend/src/components/GamePhase.jsx` - Auto-scroll for chat

## Testing Checklist

✅ Join a game → Refresh page → Should auto-reconnect
✅ Click "Leave Game" → See confirmation modal
✅ Click "Stay" → Modal closes, game continues
✅ Click "Leave Game" (confirm) → Returns to menu
✅ Close tab → Reopen within 2 hours → Auto-reconnect
✅ New messages → Chat auto-scrolls to bottom
✅ AI first message → Asks for name and socials

## Technical Details

**LocalStorage Key:** `unmasked_session`

**Stored Data:**
```json
{
  "gameId": "uuid",
  "playerId": "uuid",
  "username": "string",
  "phase": "lobby|learning|playing|etc",
  "gameMode": "group|private",
  "timestamp": 1234567890
}
```

**Session Expiry:** 2 hours (7,200,000ms)

## UI/UX Improvements

- **No more accidental exits** - Confirmation required
- **Seamless refresh** - Players won't lose progress
- **Visual feedback** - Beautiful modal with animations
- **Auto-scroll** - No manual scrolling needed
- **AI priorities** - Gets important info (name, socials) first

## Upgrade Notes

When you upgrade to 32B model, session persistence works the same. Just update:
```python
# backend/config.py
local_model_name: str = "Qwen/Qwen2.5-32B-Instruct-AWQ"
```

Game sessions will continue seamlessly!

