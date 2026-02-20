# Chifftown Arcade & Cinema Update

## ✅ TASK 1: SINGLE PLAYER ARCADE GAMES WITH GLOBAL LEADERBOARD

### 5 New Single-Player Games Added to games.html:

1. **🐍 Snake Game**
   - Classic snake gameplay with arrow key controls
   - CSS-based grid rendering (20x20)
   - Speed increases as snake grows
   - Score = food eaten

2. **🃏 Memory Match**
   - 4x4 grid with emoji pairs (16 cards total)
   - Flip two cards at a time to find matches
   - Score = 10000 - (moves × 50) - (time × 10)
   - Track moves and time

3. **⚡ Reaction Speed Test**
   - 5 rounds testing click reaction time
   - Screen changes color randomly (2-5 second wait)
   - Score = average reaction time in milliseconds (lower is better)
   - Detects "too early" clicks

4. **🏃 Endless Runner**
   - Auto-running character with jump mechanic
   - Press SPACE or click/tap to jump over obstacles
   - Score = distance traveled in meters
   - Difficulty increases over time

5. **🔤 Word Scramble**
   - 50+ word bank of technology/coding terms
   - 30 seconds per word to unscramble
   - Score = total words solved
   - Option to skip words

### Global Leaderboard System:

**Backend (server.js):**
- New data file: `/data/leaderboards.json`
- Structure: `{ "snake": [...], "memory": [...], "reaction": [...], "runner": [...], "wordScramble": [] }`
- API endpoints:
  - `GET /api/leaderboard/:game` - Top 10 for specific game
  - `GET /api/leaderboard` - Overall champions (aggregated stats)
  - `POST /api/leaderboard/:game` - Submit score (with server-side validation)
- XP Rewards:
  - +5 XP for playing any arcade game
  - +15 XP for reaching top 10
  - +25 XP total for #1 position
- Server-side score validation prevents cheating

**Frontend (games.html):**
- Leaderboard panel with tabs for each game + "Overall Champions"
- Medal system: 🥇🥈🥉 for top 3
- Gold/silver/bronze color coding
- Shows rank, username, and score
- Automatically loads on page load

---

## ✅ TASK 2: CINEMA MOVIE SHOWINGS

### New Features Added to cinema.html:

**Schedule a Showing Form:**
- Movie name, showtime (datetime picker), description, duration (minutes)
- Form toggles on/off with button
- Default duration: 120 minutes (2 hours)
- Default time: 1 hour from now

**Upcoming Showings Panel:**
- Grid display of scheduled movies
- Each card shows:
  - Date and time (e.g., "Mon, Feb 12 @ 7:00 PM")
  - Movie title with 🎬 emoji
  - Optional description
  - Dynamic countdown timer
- **"NOW SHOWING" Highlight:**
  - Special gold styling when movie is currently playing
  - Diagonal banner with "NOW SHOWING" text
  - Shows remaining time
- Countdown displays:
  - "Starts in Xd Xh" (days/hours)
  - "Starts in Xh Xm" (hours/minutes)  
  - "Starts in X minutes"
  - "🎬 NOW SHOWING (X min remaining)" - during the showing
  - "Ended" - after showing finished
- Auto-refreshes every 60 seconds

**Backend (server.js):**
- New data file: `/data/showings.json`
- API endpoints:
  - `GET /api/showings` - Upcoming showings (next 10, not yet ended)
  - `POST /api/showings` - Schedule new showing
  - `DELETE /api/showings/:id` - Cancel showing
- Real-time updates via Socket.IO:
  - `new-showing` event broadcasts to all clients
  - `showing-cancelled` event broadcasts to all clients
- Showings stored with: `{ id, movieName, time, description, duration, createdAt }`

---

## Design Compliance:

✅ **Arcade**: Deep green terminal theme with Press Start 2P font for headings  
✅ **Cinema**: Dark charcoal with red/gold accents, Playfair Display headings  
✅ **No pink/purple colors used**  
✅ **All existing functionality preserved**

---

## Files Modified:

1. `/home/ubuntu/chiffly/server.js` - Added leaderboard & showings APIs
2. `/home/ubuntu/chiffly/games.html` - Added 5 games + leaderboard UI
3. `/home/ubuntu/chiffly/cinema.html` - Added showings form + display
4. `/home/ubuntu/chiffly/data/leaderboards.json` - New file (created)
5. `/home/ubuntu/chiffly/data/showings.json` - New file (created)

---

## Testing:

Server restarted successfully via PM2:
```
✅ Loaded leaderboards data
✅ Loaded 0 movie showings
Chiffly Streaming Platform running on port 3000
```

All features are live at: **http://chifftown.com** (or localhost:3000)

- Arcade: `/games.html`
- Cinema: `/cinema.html`

---

## Next Steps:

The newspaper integration mentioned in Task 2 (showings appearing in newspaper) would require updating the newspaper page to call `GET /api/showings` and display the data. The API is ready and available.
