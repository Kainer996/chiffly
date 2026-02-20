const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { UserSystem, XP_REWARDS } = require('./user-system');

const app = express();
const server = http.createServer(app);

// Initialize user system
const userSystem = new UserSystem();
userSystem.init();

// Environment variables with defaults
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration for production
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? ['https://chifftown.com', 'https://www.chifftown.com', process.env.DOMAIN_URL, `https://${process.env.DOMAIN_URL}`].filter(Boolean)
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST"],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.'));

// Metered TURN Server credentials (keep secret!)
const METERED_API_KEY = process.env.METERED_API_KEY || 'ay6wPA7qecPBLXC8p1_A45Z0gFuhTdn8fhqHg_IVgGWjxrZo';
const METERED_APP_NAME = 'chiffly';

// Store active rooms and users
const rooms = new Map();
const users = new Map();

// Arcade game stores
const tttGames = new Map(); // Tic Tac Toe
const rpsGames = new Map(); // Rock Paper Scissors
const triviaGames = new Map(); // Trivia

// Events system
const EVENTS_FILE = path.join(__dirname, 'data', 'events.json');
let townEvents = [];

// Gossip system
const GOSSIP_FILE = path.join(__dirname, 'data', 'gossip.json');
let gossipTips = [];

// Leaderboard system
const LEADERBOARD_FILE = path.join(__dirname, 'data', 'leaderboards.json');
let leaderboards = { snake: [], memory: [], reaction: [], runner: [], wordScramble: [], breakout: [] };

// Movie showings system
const SHOWINGS_FILE = path.join(__dirname, 'data', 'showings.json');
let movieShowings = [];

// Friendships system
const FRIENDSHIPS_FILE = path.join(__dirname, 'data', 'friendships.json');
let friendships = {};

// Daily rewards system
const DAILY_REWARDS_FILE = path.join(__dirname, 'data', 'daily-rewards.json');
let dailyRewards = {};
const LAUNCH_DATE = new Date('2024-01-01').getTime(); // Set your actual launch date

// Activity Feed system
const MAX_ACTIVITIES = 100;
let recentActivities = [];

// Log an activity and broadcast to all connected clients
function logActivity(type, data) {
  const activity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now()
  };
  
  // Add to front of array
  recentActivities.unshift(activity);
  
  // Trim to max
  if (recentActivities.length > MAX_ACTIVITIES) {
    recentActivities = recentActivities.slice(0, MAX_ACTIVITIES);
  }
  
  // Broadcast to all clients
  io.emit('activity', activity);
  
  console.log(`📰 Activity: ${type}`, data);
  return activity;
}

// Load events from file
async function loadEvents() {
  try {
    const data = await fs.readFile(EVENTS_FILE, 'utf8');
    townEvents = JSON.parse(data);
    console.log(`✅ Loaded ${townEvents.length} town events`);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error loading events:', err);
    townEvents = [];
  }
}

// Load gossip tips
async function loadGossip() {
  try {
    const data = await fs.readFile(GOSSIP_FILE, 'utf8');
    gossipTips = JSON.parse(data);
    console.log(`✅ Loaded ${gossipTips.length} gossip tips`);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error loading gossip:', err);
    gossipTips = [];
  }
}

async function saveGossip() {
  try {
    await fs.writeFile(GOSSIP_FILE, JSON.stringify(gossipTips, null, 2));
  } catch (err) {
    console.error('Error saving gossip:', err);
  }
}

// Load leaderboards
async function loadLeaderboards() {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    leaderboards = JSON.parse(data);
    console.log(`✅ Loaded leaderboards data`);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error loading leaderboards:', err);
    leaderboards = { snake: [], memory: [], reaction: [], runner: [], wordScramble: [], breakout: [] };
  }
}

async function saveLeaderboards() {
  try {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboards, null, 2));
  } catch (err) {
    console.error('Error saving leaderboards:', err);
  }
}

// Load movie showings
async function loadShowings() {
  try {
    const data = await fs.readFile(SHOWINGS_FILE, 'utf8');
    movieShowings = JSON.parse(data);
    console.log(`✅ Loaded ${movieShowings.length} movie showings`);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error loading showings:', err);
    movieShowings = [];
  }
}

async function saveShowings() {
  try {
    await fs.writeFile(SHOWINGS_FILE, JSON.stringify(movieShowings, null, 2));
  } catch (err) {
    console.error('Error saving showings:', err);
  }
}

// Load friendships
async function loadFriendships() {
  try {
    const data = await fs.readFile(FRIENDSHIPS_FILE, 'utf8');
    friendships = JSON.parse(data);
    console.log(`✅ Loaded friendships data`);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error loading friendships:', err);
    friendships = {};
  }
}

async function saveFriendships() {
  try {
    await fs.writeFile(FRIENDSHIPS_FILE, JSON.stringify(friendships, null, 2));
  } catch (err) {
    console.error('Error saving friendships:', err);
  }
}

// Load daily rewards
async function loadDailyRewards() {
  try {
    const data = await fs.readFile(DAILY_REWARDS_FILE, 'utf8');
    dailyRewards = JSON.parse(data);
    console.log(`✅ Loaded daily rewards data`);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Error loading daily rewards:', err);
    dailyRewards = {};
  }
}

async function saveDailyRewards() {
  try {
    await fs.writeFile(DAILY_REWARDS_FILE, JSON.stringify(dailyRewards, null, 2));
  } catch (err) {
    console.error('Error saving daily rewards:', err);
  }
}

// Friendship level calculation
function getFriendshipLevel(points) {
  if (points < 10) return 'Stranger';
  if (points < 30) return 'Acquaintance';
  if (points < 60) return 'Friend';
  if (points < 100) return 'Close Friend';
  return 'Best Friend';
}

// Update friendship points
async function updateFriendship(user1, user2, points, io) {
  if (!user1 || !user2 || user1 === user2) return;
  
  const key = [user1, user2].sort().join('|');
  
  if (!friendships[key]) {
    friendships[key] = {
      users: [user1, user2],
      points: 0,
      level: 'Stranger',
      interactions: 0,
      lastInteraction: Date.now()
    };
  }
  
  const oldLevel = friendships[key].level;
  friendships[key].points += points;
  friendships[key].interactions++;
  friendships[key].lastInteraction = Date.now();
  friendships[key].level = getFriendshipLevel(friendships[key].points);
  
  // Notify if level up
  if (friendships[key].level !== oldLevel) {
    const users = userSystem.users;
    if (users[user1] && users[user1].socketId) {
      io.to(users[user1].socketId).emit('friendship-level-up', {
        friend: user2,
        level: friendships[key].level,
        points: friendships[key].points
      });
    }
    if (users[user2] && users[user2].socketId) {
      io.to(users[user2].socketId).emit('friendship-level-up', {
        friend: user1,
        level: friendships[key].level,
        points: friendships[key].points
      });
    }
  }
  
  await saveFriendships();
  return friendships[key];
}

// Get friendship between two users
function getFriendship(user1, user2) {
  if (!user1 || !user2) return null;
  const key = [user1, user2].sort().join('|');
  return friendships[key] || { users: [user1, user2], points: 0, level: 'Stranger', interactions: 0 };
}

async function saveEvents() {
  try {
    await fs.writeFile(EVENTS_FILE, JSON.stringify(townEvents, null, 2));
  } catch (err) {
    console.error('Error saving events:', err);
  }
}

// Get active events (current time is between startTime and endTime)
function getActiveEvents() {
  const now = Date.now();
  return townEvents.filter(event => {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    return now >= start && now <= end;
  });
}

// Initialize events on startup
loadEvents();
loadGossip();
loadFriendships();
loadDailyRewards();
loadLeaderboards();
loadShowings();

// Game helper functions
function checkTTTWinner(board) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6]            // diagonals
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function rpsResult(c1, c2) {
  if (c1 === c2) return 0;
  if ((c1 === 'rock' && c2 === 'scissors') || (c1 === 'scissors' && c2 === 'paper') || (c1 === 'paper' && c2 === 'rock')) return 1;
  return 2;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function decodeHTMLEntities(text) {
  const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&apos;': "'", '&eacute;': 'é', '&ouml;': 'ö', '&uuml;': 'ü', '&ntilde;': 'ñ', '&rsquo;': "'", '&lsquo;': "'", '&rdquo;': '"', '&ldquo;': '"', '&hellip;': '…', '&ndash;': '–', '&mdash;': '—' };
  return text.replace(/&[^;]+;/g, match => entities[match] || match);
}

function sendTriviaQuestion(gameId) {
  const game = triviaGames.get(gameId);
  if (!game || game.state !== 'playing') return;
  
  const q = game.questions[game.currentQ];
  game.answers = new Map();
  
  io.to('trivia-' + gameId).emit('trivia-question', {
    index: game.currentQ,
    total: game.questions.length,
    question: q.question,
    options: q.options,
    category: q.category,
    difficulty: q.difficulty,
    timeLimit: 15
  });
  
  // Auto-advance after timeout
  game.timer = setTimeout(() => advanceTriviaQuestion(gameId), 17000);
}

function advanceTriviaQuestion(gameId) {
  const game = triviaGames.get(gameId);
  if (!game) return;
  if (game.timer) clearTimeout(game.timer);
  
  const q = game.questions[game.currentQ];
  
  // Send scoreboard
  io.to('trivia-' + gameId).emit('trivia-scores', {
    correctAnswer: q.correct,
    scores: game.players.map(p => ({ username: p.username, score: p.score })).sort((a, b) => b.score - a.score)
  });
  
  game.currentQ++;
  if (game.currentQ >= game.questions.length) {
    // Game over
    setTimeout(async () => {
      io.to('trivia-' + gameId).emit('trivia-game-over', {
        scores: game.players.map(p => ({ username: p.username, score: p.score })).sort((a, b) => b.score - a.score),
        winner: game.players.reduce((a, b) => a.score > b.score ? a : b).username
      });
      
      // Award XP for completing trivia
      if (userSystem.loaded) {
        for (const player of game.players) {
          if (player.username) {
            await userSystem.addXP(player.username, XP_REWARDS.ARCADE_GAME, 'Playing Trivia', io);
            userSystem.trackGamePlayed(player.username);
          }
        }
      }
      
      triviaGames.delete(gameId);
    }, 3000);
  } else {
    setTimeout(() => sendTriviaQuestion(gameId), 3000);
  }
}

// Clean up stale games every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  for (const [gid, game] of tttGames) {
    if (now - game.createdAt > maxAge) tttGames.delete(gid);
  }
  for (const [gid, game] of rpsGames) {
    if (now - game.createdAt > maxAge) rpsGames.delete(gid);
  }
  for (const [gid, game] of triviaGames) {
    if (now - game.createdAt > maxAge) triviaGames.delete(gid);
  }
}, 5 * 60 * 1000);

// TURN Server credentials endpoint - fetches from Metered
app.get('/api/turn-credentials', async (req, res) => {
  try {
    const response = await fetch(
      `https://${METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
    );
    const iceServers = await response.json();
    res.json(iceServers);
  } catch (error) {
    console.error('Error fetching TURN credentials:', error);
    // Fallback to our own coturn server
    res.json([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'turn:13.49.240.95:3478', username: 'chiffly', credential: 'chiffly2026secure' },
      { urls: 'turn:13.49.240.95:3478?transport=tcp', username: 'chiffly', credential: 'chiffly2026secure' }
    ]);
  }
});

// Serve the main homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the Questing IRL section
app.get('/questing', (req, res) => {
  res.sendFile(path.join(__dirname, 'questing.html'));
});

// Serve the Virtual Pub section
app.get('/pub', (req, res) => {
  res.sendFile(path.join(__dirname, 'pub.html'));
});

// Serve the streaming page
app.get('/stream', (req, res) => {
  res.sendFile(path.join(__dirname, 'stream.html'));
});

// Serve the pub streaming page
app.get('/pub-stream', (req, res) => {
  res.sendFile(path.join(__dirname, 'pub-stream.html'));
});

// Serve the nightclub section
app.get('/nightclub', (req, res) => {
  res.sendFile(path.join(__dirname, 'nightclub.html'));
});

// Serve the games room section
app.get('/games', (req, res) => {
  res.sendFile(path.join(__dirname, 'games.html'));
});

// Serve the cinema section
app.get('/cinema', (req, res) => {
  res.sendFile(path.join(__dirname, 'cinema.html'));
});

// Serve the lounge section
app.get('/lounge', (req, res) => {
  res.sendFile(path.join(__dirname, 'lounge.html'));
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    totalRooms: rooms.size,
    totalUsers: users.size,
    pubRooms: Array.from(rooms.values()).filter(room => room.type === 'pub').length,
    rooms: Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      type: room.type,
      participants: room.participants.size,
      hasStreamer: !!room.streamer
    })),
    nodeEnv: NODE_ENV,
    corsOrigins: corsOptions.origin
  });
});

// User stats endpoint
app.get('/api/user/:username', (req, res) => {
  if (!userSystem.loaded) {
    return res.status(503).json({ error: 'User system not ready' });
  }
  
  const stats = userSystem.getUserStats(req.params.username);
  if (!stats) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(stats);
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  if (!userSystem.loaded) {
    return res.status(503).json({ error: 'User system not ready' });
  }
  
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = userSystem.getLeaderboard(limit);
  res.json(leaderboard);
});

// User activity endpoint
app.get('/api/activity/:username', (req, res) => {
  if (!userSystem.loaded) {
    return res.status(503).json({ error: 'User system not ready' });
  }
  
  const limit = parseInt(req.query.limit) || 20;
  const activity = userSystem.getRecentActivity(req.params.username, limit);
  res.json(activity);
});

// Global activity endpoint
app.get('/api/activity', (req, res) => {
  if (!userSystem.loaded) {
    return res.status(503).json({ error: 'User system not ready' });
  }
  
  const limit = parseInt(req.query.limit) || 50;
  const activity = userSystem.getAllActivity(limit);
  res.json(activity);
});

// Activity Feed endpoint (real-time feed)
app.get('/api/activities/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  res.json({ 
    activities: recentActivities.slice(0, limit),
    total: recentActivities.length
  });
});

// Shop purchase endpoint
app.post('/api/shop/buy', async (req, res) => {
  const { username, itemId } = req.body;
  
  if (!username || !itemId) {
    return res.status(400).json({ error: 'Missing username or itemId' });
  }
  
  if (!userSystem.loaded) {
    return res.status(503).json({ error: 'System not ready' });
  }
  
  const user = userSystem.users[username];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Find item price (In a real app, items would be in a DB/file)
  // Hardcoding here to match frontend for simplicity, should be shared config
  const SHOP_ITEMS = {
    'color_gold': 500, 'color_teal': 300, 'color_pink': 300, 'color_lime': 300,
    'title_rich': 1000, 'title_night': 200, 'title_party': 200, 'title_gamer': 500,
    'badge_star': 1500
  };
  
  const price = SHOP_ITEMS[itemId];
  if (!price) {
    return res.status(400).json({ error: 'Invalid item' });
  }
  
  // Check funds
  const currentCoins = userSystem.getCoins(username);
  if (currentCoins < price) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }
  
  // Check if already owned
  if (user.inventory && (user.inventory.includes(itemId))) {
    return res.status(400).json({ error: 'Item already owned' });
  }
  
  // Process purchase
  userSystem.updateCoins(username, -price);
  
  if (!user.inventory) user.inventory = [];
  user.inventory.push(itemId);
  
  // If it's a color, we might want to set it as active immediately?
  // For now just add to inventory. Frontend can handle equipping later.
  
  await userSystem.saveUsers();
  
  logActivity('shop_purchase', { user: username, item: itemId });
  
  res.json({ success: true, newBalance: userSystem.getCoins(username), inventory: user.inventory });
});

// Events endpoints
app.get('/api/events', (req, res) => {
  const activeEvents = getActiveEvents();
  res.json(activeEvents);
});

app.post('/api/events', async (req, res) => {
  const { name, description, venue, startTime, endTime, xpMultiplier } = req.body;
  
  if (!name || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields: name, startTime, endTime' });
  }
  
  const newEvent = {
    id: uuidv4(),
    name,
    description: description || '',
    venue: venue || 'Town Square',
    startTime,
    endTime,
    xpMultiplier: xpMultiplier || 1,
    createdAt: new Date().toISOString()
  };
  
  townEvents.push(newEvent);
  await saveEvents();
  
  // Broadcast new event to all connected clients
  io.emit('new-event', newEvent);
  
  res.json(newEvent);
});

// Room occupancy endpoint
app.get('/api/occupancy', (req, res) => {
  const occupancy = {
    pub: Array.from(rooms.values()).filter(r => r.type === 'pub').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    nightclub: Array.from(rooms.values()).filter(r => r.type === 'nightclub').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    cinema: Array.from(rooms.values()).filter(r => r.type === 'cinema').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    arcade: Array.from(rooms.values()).filter(r => r.type === 'arcade' || r.type === 'games').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    lounge: Array.from(rooms.values()).filter(r => r.type === 'lounge').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    questing: Array.from(rooms.values()).filter(r => r.type === 'questing' || r.type === 'adventure').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    wellness: Array.from(rooms.values()).filter(r => r.type === 'wellness').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    casino: Array.from(rooms.values()).filter(r => r.type === 'casino').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0),
    apartment: Array.from(rooms.values()).filter(r => r.type === 'apartment').reduce((sum, r) => sum + r.participants.size + (r.streamer ? 1 : 0), 0)
  };
  res.json(occupancy);
});

// Gossip endpoints
app.get('/api/gossip', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const recentGossip = gossipTips.slice(-limit).reverse();
  res.json(recentGossip);
});

app.post('/api/gossip', async (req, res) => {
  const { tip, author } = req.body;
  
  if (!tip || tip.length < 10 || tip.length > 500) {
    return res.status(400).json({ error: 'Tip must be between 10-500 characters' });
  }
  
  const newTip = {
    id: uuidv4(),
    tip: tip.trim(),
    author: author || 'Anonymous',
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  gossipTips.push(newTip);
  await saveGossip();
  
  // Broadcast to connected clients
  io.emit('new-gossip', newTip);
  
  res.json({ success: true, tip: newTip });
});

// Hot Takes endpoint - superlatives from user stats
app.get('/api/hot-takes', (req, res) => {
  if (!userSystem.loaded) {
    return res.status(503).json({ error: 'User system not ready' });
  }
  
  const users = Object.values(userSystem.users);
  const hotTakes = [];
  
  // Highest level
  const topLevel = users.sort((a, b) => b.level - a.level)[0];
  if (topLevel) {
    hotTakes.push({
      title: '🏆 Town Champion',
      winner: topLevel.username,
      stat: `Level ${topLevel.level}`,
      desc: 'Highest level in Chifftown'
    });
  }
  
  // Most social (messages sent)
  const mostSocial = users.sort((a, b) => (b.stats?.messagesSent || 0) - (a.stats?.messagesSent || 0))[0];
  if (mostSocial && mostSocial.stats?.messagesSent > 0) {
    hotTakes.push({
      title: '🦋 Social Butterfly',
      winner: mostSocial.username,
      stat: `${mostSocial.stats.messagesSent} messages`,
      desc: 'Most talkative citizen'
    });
  }
  
  // Most generous (tips sent)
  const mostGenerous = users.sort((a, b) => (b.stats?.tipsSent || 0) - (a.stats?.tipsSent || 0))[0];
  if (mostGenerous && mostGenerous.stats?.tipsSent > 0) {
    hotTakes.push({
      title: '💰 Big Spender',
      winner: mostGenerous.username,
      stat: `${mostGenerous.stats.tipsSent} tips sent`,
      desc: 'Most generous tipper'
    });
  }
  
  // Most popular (tips received)
  const mostPopular = users.sort((a, b) => (b.stats?.tipsReceived || 0) - (a.stats?.tipsReceived || 0))[0];
  if (mostPopular && mostPopular.stats?.tipsReceived > 0) {
    hotTakes.push({
      title: '⭐ Fan Favorite',
      winner: mostPopular.username,
      stat: `${mostPopular.stats.tipsReceived} tips received`,
      desc: 'Most tipped streamer'
    });
  }
  
  // Arcade champion
  const arcadeChamp = users.sort((a, b) => (b.stats?.gamesPlayed || 0) - (a.stats?.gamesPlayed || 0))[0];
  if (arcadeChamp && arcadeChamp.stats?.gamesPlayed > 0) {
    hotTakes.push({
      title: '🎮 Arcade Master',
      winner: arcadeChamp.username,
      stat: `${arcadeChamp.stats.gamesPlayed} games played`,
      desc: 'Ultimate gamer'
    });
  }
  
  // Casino high roller (most coins)
  const highRoller = users.sort((a, b) => (b.coins || 0) - (a.coins || 0))[0];
  if (highRoller && highRoller.coins > 100) {
    hotTakes.push({
      title: '🎰 High Roller',
      winner: highRoller.username,
      stat: `${highRoller.coins} coins`,
      desc: 'Richest in town'
    });
  }
  
  res.json(hotTakes);
});

// Edition number endpoint (days since launch)
app.get('/api/edition', (req, res) => {
  const now = Date.now();
  const daysSinceLaunch = Math.floor((now - LAUNCH_DATE) / (1000 * 60 * 60 * 24)) + 1;
  res.json({
    volume: 1,
    issue: daysSinceLaunch,
    launchDate: new Date(LAUNCH_DATE).toISOString()
  });
});

// Daily rewards check
app.post('/api/daily-reward', async (req, res) => {
  const { username } = req.body;
  
  if (!username || !userSystem.loaded) {
    return res.status(400).json({ error: 'Username required' });
  }
  
  const user = userSystem.getOrCreateUser(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  if (!dailyRewards[username]) {
    dailyRewards[username] = {
      lastClaim: null,
      streak: 0,
      totalClaims: 0
    };
  }
  
  const userReward = dailyRewards[username];
  const lastClaimDate = userReward.lastClaim ? new Date(userReward.lastClaim).toDateString() : null;
  
  // Already claimed today
  if (lastClaimDate === today) {
    return res.json({
      alreadyClaimed: true,
      streak: userReward.streak,
      nextReward: calculateDailyReward(userReward.streak + 1)
    });
  }
  
  // Calculate streak
  if (lastClaimDate === yesterday) {
    // Continue streak
    userReward.streak++;
  } else if (lastClaimDate !== null) {
    // Streak broken
    userReward.streak = 1;
  } else {
    // First claim
    userReward.streak = 1;
  }
  
  // Reset streak after 7 days
  if (userReward.streak > 7) {
    userReward.streak = 1;
  }
  
  const reward = calculateDailyReward(userReward.streak);
  
  // Award coins and stardust
  userSystem.updateCoins(username, reward.coins);
  userSystem.updateStardust(username, reward.stardust);
  
  // Award XP
  await userSystem.addXP(username, reward.xp, `Daily check-in (Day ${userReward.streak})`, io);
  
  userReward.lastClaim = Date.now();
  userReward.totalClaims++;
  
  await saveDailyRewards();
  
  res.json({
    claimed: true,
    reward,
    streak: userReward.streak,
    nextReward: calculateDailyReward(userReward.streak < 7 ? userReward.streak + 1 : 1)
  });
});

function calculateDailyReward(day) {
  const baseCoins = 10 * day;
  const baseStardust = Math.floor(day / 2);
  const xp = 15 + (day * 5);
  
  return {
    coins: baseCoins,
    stardust: baseStardust,
    xp: xp,
    day: day
  };
}

// Friendship endpoints
app.get('/api/friendship/:user1/:user2', (req, res) => {
  const friendship = getFriendship(req.params.user1, req.params.user2);
  res.json(friendship);
});

app.get('/api/friendships/:username', (req, res) => {
  const username = req.params.username;
  const userFriendships = Object.values(friendships)
    .filter(f => f.users.includes(username))
    .map(f => ({
      friend: f.users.find(u => u !== username),
      level: f.level,
      points: f.points,
      interactions: f.interactions,
      lastInteraction: f.lastInteraction
    }))
    .sort((a, b) => b.points - a.points);
  
  res.json(userFriendships);
});

// Leaderboard endpoints
app.get('/api/leaderboard/:game', (req, res) => {
  const game = req.params.game;
  if (!leaderboards[game]) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const top = leaderboards[game]
    .sort((a, b) => {
      // For reaction game, lower is better
      if (game === 'reaction') return a.score - b.score;
      return b.score - a.score;
    })
    .slice(0, 10);
  
  res.json(top);
});

app.get('/api/leaderboard', (req, res) => {
  // Overall top players across all games
  const allPlayers = {};
  
  Object.entries(leaderboards).forEach(([game, scores]) => {
    scores.forEach((entry, index) => {
      if (!allPlayers[entry.username]) {
        allPlayers[entry.username] = {
          username: entry.username,
          totalScore: 0,
          gamesPlayed: 0,
          topPositions: 0
        };
      }
      
      allPlayers[entry.username].gamesPlayed++;
      allPlayers[entry.username].totalScore += entry.score;
      
      // Count top 3 positions
      const rank = scores
        .sort((a, b) => game === 'reaction' ? a.score - b.score : b.score - a.score)
        .findIndex(e => e.username === entry.username && e.score === entry.score);
      if (rank < 3) allPlayers[entry.username].topPositions++;
    });
  });
  
  const overall = Object.values(allPlayers)
    .sort((a, b) => {
      // Sort by top positions first, then games played, then total score
      if (b.topPositions !== a.topPositions) return b.topPositions - a.topPositions;
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return b.totalScore - a.totalScore;
    })
    .slice(0, 10);
  
  res.json(overall);
});

app.post('/api/leaderboard/:game', async (req, res) => {
  const game = req.params.game;
  const { username, score } = req.body;
  
  if (!leaderboards[game]) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!username || score === undefined || score === null) {
    return res.status(400).json({ error: 'Username and score required' });
  }
  
  // Basic validation
  if (typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid score' });
  }
  
  // Server-side validation based on game type
  if (game === 'snake' && score > 1000) {
    return res.status(400).json({ error: 'Score too high' });
  }
  if (game === 'memory' && score > 10000) {
    return res.status(400).json({ error: 'Score too high' });
  }
  if (game === 'reaction' && (score < 50 || score > 10000)) {
    return res.status(400).json({ error: 'Invalid reaction time' });
  }
  if (game === 'runner' && score > 100000) {
    return res.status(400).json({ error: 'Score too high' });
  }
  if (game === 'breakout' && score > 100000) {
    return res.status(400).json({ error: 'Score too high' });
  }
  if (game === 'wordScramble' && score > 100) {
    return res.status(400).json({ error: 'Score too high' });
  }
  
  const entry = {
    username,
    score,
    date: new Date().toISOString()
  };
  
  leaderboards[game].push(entry);
  
  // Keep only top 100 per game
  leaderboards[game] = leaderboards[game]
    .sort((a, b) => game === 'reaction' ? a.score - b.score : b.score - a.score)
    .slice(0, 100);
  
  await saveLeaderboards();
  
  // Calculate rank
  const rank = leaderboards[game].findIndex(e => 
    e.username === username && e.score === score
  ) + 1;
  
  // Award XP based on rank
  if (userSystem.loaded) {
    let xp = XP_REWARDS.ARCADE_GAME; // 5 XP for playing
    if (rank <= 10) xp += XP_REWARDS.LEADERBOARD; // +15 for top 10
    if (rank === 1) xp += 10; // +10 more for #1 (total +25)
    
    await userSystem.addXP(username, xp, `${game} - Rank #${rank}`, io);
    userSystem.trackGamePlayed(username);
  }
  
  res.json({
    success: true,
    rank,
    entry,
    isTopTen: rank <= 10
  });
});

// Movie showings endpoints
app.get('/api/showings', (req, res) => {
  const now = Date.now();
  
  // Return upcoming showings (not ended yet)
  const upcoming = movieShowings
    .filter(showing => new Date(showing.time).getTime() + (showing.duration || 120) * 60 * 1000 > now)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(0, 10);
  
  res.json(upcoming);
});

app.post('/api/showings', async (req, res) => {
  const { movieName, time, description, duration } = req.body;
  
  if (!movieName || !time) {
    return res.status(400).json({ error: 'Movie name and time required' });
  }
  
  const newShowing = {
    id: uuidv4(),
    movieName: movieName.trim(),
    time: new Date(time).toISOString(),
    description: description?.trim() || '',
    duration: duration || 120, // default 2 hours
    createdAt: new Date().toISOString()
  };
  
  movieShowings.push(newShowing);
  await saveShowings();
  
  // Broadcast to connected clients
  io.emit('new-showing', newShowing);
  
  res.json(newShowing);
});

app.delete('/api/showings/:id', async (req, res) => {
  const id = req.params.id;
  
  const index = movieShowings.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Showing not found' });
  }
  
  const removed = movieShowings.splice(index, 1)[0];
  await saveShowings();
  
  // Broadcast deletion
  io.emit('showing-cancelled', { id });
  
  res.json({ success: true, removed });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  console.log('Total connected users:', io.sockets.sockets.size);

  // Handle platform stats request
  socket.on('get-platform-stats', () => {
    const questingRooms = Array.from(rooms.values()).filter(room => room.type === 'questing' || !room.type);
    const pubRooms = Array.from(rooms.values()).filter(room => room.type === 'pub');
    const questingUsers = Array.from(users.values()).filter(user => {
      const room = rooms.get(user.roomId);
      return room && (room.type === 'questing' || !room.type);
    });
    const pubUsers = Array.from(users.values()).filter(user => {
      const room = rooms.get(user.roomId);
      return room && room.type === 'pub';
    });

    const stats = {
      totalUsers: users.size,
      activeRooms: rooms.size,
      liveStreams: Array.from(rooms.values()).filter(room => room.streamer).length,
      questingUsers: questingUsers.length,
      questingRooms: questingRooms.length,
      pubUsers: pubUsers.length,
      pubRooms: pubRooms.length
    };

    socket.emit('platform-stats', stats);
  });

  // Handle homepage room list request
  socket.on('get-room-list', () => {
    const roomsData = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name || `Room ${room.id}`,
      description: room.description || '',
      participantCount: room.participants.size + (room.streamer ? 1 : 0),
      maxParticipants: room.maxParticipants || 10,
      hasStreamer: !!room.streamer,
      isPrivate: room.isPrivate || false,
      type: room.type || 'questing',
      theme: room.theme || 'default'
    }));

    const usersData = Array.from(users.values()).map(user => ({
      id: user.id,
      username: user.username,
      isStreaming: user.isStreamer,
      roomName: rooms.get(user.roomId)?.name || null
    }));

    const stats = {
      totalUsers: users.size,
      activeRooms: rooms.size,
      liveStreams: Array.from(rooms.values()).filter(room => room.streamer).length
    };

    socket.emit('room-list', {
      rooms: roomsData,
      users: usersData,
      stats: stats
    });
  });

  // Handle room creation
  socket.on('create-room', (data) => {
    const roomId = uuidv4();
    console.log('🏠 Creating room:', roomId, 'Type:', data.type, 'Name:', data.name, 'Theme:', data.theme);
    
    const newRoom = {
      id: roomId,
      name: data.name,
      description: data.description,
      maxParticipants: data.maxParticipants || 10,
      isPrivate: data.isPrivate || false,
      type: data.type || 'questing',
      theme: data.theme || 'default',
      streamer: null,
      participants: new Map(),
      messages: [],
      createdAt: new Date().toISOString()
    };

    rooms.set(roomId, newRoom);
    console.log('📊 Total rooms now:', rooms.size);
    
    socket.emit('room-created', {
      id: roomId,
      name: newRoom.name,
      description: newRoom.description,
      maxParticipants: newRoom.maxParticipants,
      hasStreamer: false,
      participantCount: 0
    });

    // Broadcast room list update to all connected clients
    io.emit('room-updated', {
      id: roomId,
      name: newRoom.name,
      description: newRoom.description,
      maxParticipants: newRoom.maxParticipants,
      hasStreamer: false,
      participantCount: 0
    });
  });

  // Check daily reward
  socket.on('check-daily-reward', async (data) => {
    const { username } = data;
    
    if (!username || !userSystem.loaded) return;
    
    const today = new Date().toDateString();
    
    if (!dailyRewards[username]) {
      dailyRewards[username] = {
        lastClaim: null,
        streak: 0,
        totalClaims: 0
      };
    }
    
    const userReward = dailyRewards[username];
    const lastClaimDate = userReward.lastClaim ? new Date(userReward.lastClaim).toDateString() : null;
    
    // Check if can claim today
    if (lastClaimDate !== today) {
      socket.emit('daily-reward-available', {
        streak: userReward.streak,
        nextReward: calculateDailyReward(userReward.streak + 1)
      });
    }
  });

  // Handle user joining a room
  socket.on('join-room', async (data) => {
    const { roomId, username, isStreamer, roomType } = data;
    
    // Check daily reward on first join
    if (username) {
      const today = new Date().toDateString();
      
      if (!dailyRewards[username]) {
        dailyRewards[username] = {
          lastClaim: null,
          streak: 0,
          totalClaims: 0
        };
      }
      
      const userReward = dailyRewards[username];
      const lastClaimDate = userReward.lastClaim ? new Date(userReward.lastClaim).toDateString() : null;
      
      // Notify if daily reward available
      if (lastClaimDate !== today) {
        socket.emit('daily-reward-available', {
          streak: userReward.streak,
          nextReward: calculateDailyReward(userReward.streak + 1)
        });
      }
    }
    
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        name: roomType === 'pub' ? `Table ${roomId.slice(0, 6)}` : `Adventure ${roomId.slice(0, 6)}`,
        description: roomType === 'pub' ? 'A cozy conversation spot!' : 'A spontaneous quest begins!',
        maxParticipants: 10,
        isPrivate: false,
        type: roomType || 'questing',
        streamer: null,
        participants: new Map(),
        messages: [],
        createdAt: new Date().toISOString()
      });
    }

    const room = rooms.get(roomId);
    
    // Add user to room
    const user = {
      id: socket.id,
      username,
      isStreamer,
      roomId
    };

    if (isStreamer && !room.streamer) {
      room.streamer = user;
      // Award XP for starting a streaming session
      if (username && userSystem.loaded) {
        userSystem.getOrCreateUser(username, socket.id);
        await userSystem.addXP(username, XP_REWARDS.STREAMING_SESSION, 'Starting a streaming session', io);
        userSystem.trackStreamingSession(username);
      }
    } else if (!isStreamer) {
      room.participants.set(socket.id, user);
    }

    users.set(socket.id, user);
    socket.join(roomId);

    // Award XP for joining room
    if (username && userSystem.loaded) {
      userSystem.getOrCreateUser(username, socket.id);
      await userSystem.addXP(username, XP_REWARDS.JOIN_ROOM, `Joining ${room.name}`, io);
      userSystem.trackRoomJoin(username, roomType || 'questing');
    }

    // Notify room about new user
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      username,
      isStreamer
    });

    // Log activity for room join
    if (username && username !== 'Guest') {
      if (isStreamer) {
        logActivity('stream_start', { user: username, room: roomType || room.type || 'pub' });
      } else {
        logActivity('room_join', { user: username, room: roomType || room.type || 'pub' });
      }
    }

    // Send current room state to new user
    socket.emit('room-state', {
      streamer: room.streamer,
      participants: Array.from(room.participants.values()),
      messages: room.messages.slice(-50), // Last 50 messages
      type: room.type || 'pub',
      theme: room.theme || 'default'
    });

    // Broadcast room update when streamer joins
    if (isStreamer) {
      io.emit('room-updated', {
        id: roomId,
        name: room.name,
        description: room.description,
        maxParticipants: room.maxParticipants,
        hasStreamer: true,
        participantCount: room.participants.size + 1,
        type: room.type
      });
    }

    console.log(`${username} joined room ${roomId} as ${isStreamer ? 'streamer' : 'participant'}`);
  });

  // Handle theme change (host only)
  socket.on('set-theme', (data) => {
    const user = users.get(socket.id);
    if (!user || !user.isStreamer) return;
    const room = rooms.get(user.roomId);
    if (!room) return;
    room.theme = data.theme || 'default';
    console.log(`🎨 Theme changed in room ${user.roomId} to: ${room.theme}`);
    // Broadcast theme change to all users in the room
    io.to(user.roomId).emit('theme-changed', { theme: room.theme });
  });

  // Handle tip event
  socket.on('send-tip', async (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const room = rooms.get(user.roomId);
    if (!room || !room.streamer) return;
    
    // Update friendship (tips are worth 5 friendship points)
    if (user.username && room.streamer.username) {
      await updateFriendship(user.username, room.streamer.username, 5, io);
    }
    
    // Award XP for tipping
    if (userSystem.loaded) {
      if (user.username) {
        await userSystem.addXP(user.username, XP_REWARDS.TIP_SENT, `Tipping ${room.streamer.username}`, io);
        userSystem.trackTipSent(user.username);
      }
      if (room.streamer.username) {
        await userSystem.addXP(room.streamer.username, XP_REWARDS.TIP_RECEIVED, `Received tip from ${user.username}`, io);
        userSystem.trackTipReceived(room.streamer.username);
      }
    }
    
    // Broadcast tip to everyone in the room
    io.to(user.roomId).emit('tip-received', {
      from: user.username,
      amount: data.amount,
      to: room.streamer.username
    });
    
    // Log activity for tip
    if (user.username && room.streamer.username) {
      logActivity('tip_sent', { 
        user: user.username, 
        target: room.streamer.username,
        room: room.type || 'pub'
      });
    }
  });

  // Handle chat messages
  socket.on('chat-message', async (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      userId: socket.id,
      username: user.username,
      text: data.text,
      timestamp: new Date().toISOString(),
      isStreamer: user.isStreamer
    };

    const room = rooms.get(user.roomId);
    if (room) {
      room.messages.push(message);
      // Keep only last 100 messages
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }
      
      // Update friendships with other users in the room
      if (user.username) {
        const otherUsers = Array.from(room.participants.values())
          .filter(u => u.username && u.username !== user.username)
          .map(u => u.username);
        
        if (room.streamer && room.streamer.username !== user.username) {
          otherUsers.push(room.streamer.username);
        }
        
        // Update friendship points (1 point per message, max once per minute per user pair)
        for (const otherUser of otherUsers) {
          await updateFriendship(user.username, otherUser, 1, io);
        }
      }
    }

    // Award XP for chat message
    if (user.username && userSystem.loaded) {
      await userSystem.addXP(user.username, XP_REWARDS.CHAT_MESSAGE, 'Sending a message', io);
      userSystem.trackMessage(user.username);
      
      // Bonus XP based on friendship level with room members
      if (room) {
        const roomUsers = Array.from(room.participants.values()).map(u => u.username).filter(Boolean);
        if (room.streamer?.username) roomUsers.push(room.streamer.username);
        
        for (const otherUser of roomUsers) {
          if (otherUser !== user.username) {
            const friendship = getFriendship(user.username, otherUser);
            if (friendship && friendship.level !== 'Stranger') {
              const bonusXP = { 'Acquaintance': 1, 'Friend': 2, 'Close Friend': 3, 'Best Friend': 5 }[friendship.level] || 0;
              if (bonusXP > 0) {
                await userSystem.addXP(user.username, bonusXP, `Chatting with ${friendship.level} ${otherUser}`, io);
              }
            }
          }
        }
      }
    }

    // Broadcast message to all users in the room
    io.to(user.roomId).emit('chat-message', message);
  });

  // Handle quick emotes (floating reactions)
  socket.on('emote', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { emote, username, timestamp } = data;
    
    // Validate emote (basic check)
    if (!emote || typeof emote !== 'string' || emote.length > 10) return;
    
    console.log(`😊 ${username || user.username} sent emote ${emote} in room ${user.roomId}`);
    
    // Broadcast emote to all other users in the same room
    socket.to(user.roomId).emit('emote', {
      emote,
      username: username || user.username,
      timestamp: timestamp || Date.now()
    });
  });

  // Handle participant slot join
  socket.on('join-slot', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { slotNumber } = data;
    console.log(`👤 ${user.username} joined slot ${slotNumber} in room ${user.roomId}`);

    // Broadcast to all other users in the room that this user joined a slot
    socket.to(user.roomId).emit('user-joined-slot', {
      userId: socket.id,
      username: user.username,
      slotNumber: slotNumber
    });
    
    // Also notify the participant that they should update their peer connections
    socket.emit('slot-join-confirmed', {
      slotNumber: slotNumber
    });
  });

  // Handle participant slot leave
  socket.on('leave-slot', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { slotNumber } = data;
    console.log(`👤 ${user.username} left slot ${slotNumber} in room ${user.roomId}`);

    // Broadcast to all other users in the room that this user left a slot
    socket.to(user.roomId).emit('user-left-slot', {
      userId: socket.id,
      username: user.username,
      slotNumber: slotNumber
    });
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // === ARCADE GAME EVENTS ===
  
  // Tic Tac Toe
  socket.on('ttt-find-game', (data) => {
    const username = data.username;
    // Find waiting TTT game or create one
    let found = false;
    for (const [gid, game] of tttGames) {
      if (!game.player2 && game.player1.id !== socket.id) {
        game.player2 = { id: socket.id, username, symbol: 'O' };
        socket.join('ttt-' + gid);
        found = true;
        io.to('ttt-' + gid).emit('ttt-start', {
          gameId: gid,
          player1: { username: game.player1.username, symbol: 'X' },
          player2: { username, symbol: 'O' },
          board: game.board,
          turn: 'X'
        });
        break;
      }
    }
    if (!found) {
      const gid = uuidv4().slice(0, 8);
      tttGames.set(gid, {
        player1: { id: socket.id, username, symbol: 'X' },
        player2: null,
        board: Array(9).fill(null),
        turn: 'X',
        createdAt: Date.now()
      });
      socket.join('ttt-' + gid);
      socket.emit('ttt-waiting', { gameId: gid });
    }
  });

  socket.on('ttt-move', async (data) => {
    const game = tttGames.get(data.gameId);
    if (!game || !game.player2) return;
    const player = game.player1.id === socket.id ? game.player1 : game.player2;
    if (player.symbol !== game.turn) return;
    if (game.board[data.cell] !== null) return;
    
    game.board[data.cell] = player.symbol;
    const winner = checkTTTWinner(game.board);
    const draw = !winner && game.board.every(c => c !== null);
    game.turn = game.turn === 'X' ? 'O' : 'X';
    
    io.to('ttt-' + data.gameId).emit('ttt-update', {
      board: game.board,
      turn: game.turn,
      winner: winner,
      draw: draw,
      lastMove: { cell: data.cell, symbol: player.symbol, username: player.username }
    });
    
    if (winner || draw) {
      // Award XP for completing game
      if (userSystem.loaded) {
        if (game.player1.username) {
          await userSystem.addXP(game.player1.username, XP_REWARDS.ARCADE_GAME, 'Playing Tic Tac Toe', io);
          userSystem.trackGamePlayed(game.player1.username);
        }
        if (game.player2.username) {
          await userSystem.addXP(game.player2.username, XP_REWARDS.ARCADE_GAME, 'Playing Tic Tac Toe', io);
          userSystem.trackGamePlayed(game.player2.username);
        }
      }
      tttGames.delete(data.gameId);
    }
  });

  socket.on('ttt-leave', (data) => {
    if (data.gameId && tttGames.has(data.gameId)) {
      io.to('ttt-' + data.gameId).emit('ttt-opponent-left', {});
      tttGames.delete(data.gameId);
      socket.leave('ttt-' + data.gameId);
    }
  });

  // Rock Paper Scissors
  socket.on('rps-find-game', (data) => {
    const username = data.username;
    let found = false;
    for (const [gid, game] of rpsGames) {
      if (!game.player2 && game.player1.id !== socket.id) {
        game.player2 = { id: socket.id, username, choice: null };
        socket.join('rps-' + gid);
        found = true;
        io.to('rps-' + gid).emit('rps-start', {
          gameId: gid,
          player1: game.player1.username,
          player2: username
        });
        break;
      }
    }
    if (!found) {
      const gid = uuidv4().slice(0, 8);
      rpsGames.set(gid, {
        player1: { id: socket.id, username, choice: null },
        player2: null,
        round: 1,
        scores: [0, 0],
        createdAt: Date.now()
      });
      socket.join('rps-' + gid);
      socket.emit('rps-waiting', { gameId: gid });
    }
  });

  socket.on('rps-choose', async (data) => {
    const game = rpsGames.get(data.gameId);
    if (!game || !game.player2) return;
    if (game.player1.id === socket.id) game.player1.choice = data.choice;
    else if (game.player2.id === socket.id) game.player2.choice = data.choice;
    
    if (game.player1.choice && game.player2.choice) {
      const result = rpsResult(game.player1.choice, game.player2.choice);
      if (result === 1) game.scores[0]++;
      else if (result === 2) game.scores[1]++;
      
      io.to('rps-' + data.gameId).emit('rps-result', {
        p1Choice: game.player1.choice,
        p2Choice: game.player2.choice,
        p1Name: game.player1.username,
        p2Name: game.player2.username,
        winner: result === 0 ? 'draw' : result === 1 ? game.player1.username : game.player2.username,
        scores: game.scores,
        round: game.round
      });
      
      game.player1.choice = null;
      game.player2.choice = null;
      game.round++;
      
      if (game.round > 5) {
        io.to('rps-' + data.gameId).emit('rps-game-over', {
          scores: game.scores,
          winner: game.scores[0] > game.scores[1] ? game.player1.username : game.scores[1] > game.scores[0] ? game.player2.username : 'Draw'
        });
        
        // Award XP for completing RPS game
        if (userSystem.loaded) {
          if (game.player1.username) {
            await userSystem.addXP(game.player1.username, XP_REWARDS.ARCADE_GAME, 'Playing Rock Paper Scissors', io);
            userSystem.trackGamePlayed(game.player1.username);
          }
          if (game.player2.username) {
            await userSystem.addXP(game.player2.username, XP_REWARDS.ARCADE_GAME, 'Playing Rock Paper Scissors', io);
            userSystem.trackGamePlayed(game.player2.username);
          }
        }
        
        rpsGames.delete(data.gameId);
      }
    } else {
      // Notify opponent that this player has chosen
      socket.to('rps-' + data.gameId).emit('rps-opponent-chose', {});
    }
  });

  socket.on('rps-leave', (data) => {
    if (data.gameId && rpsGames.has(data.gameId)) {
      io.to('rps-' + data.gameId).emit('rps-opponent-left', {});
      rpsGames.delete(data.gameId);
      socket.leave('rps-' + data.gameId);
    }
  });

  // Trivia Quiz
  socket.on('trivia-find-game', (data) => {
    const username = data.username;
    let found = false;
    for (const [gid, game] of triviaGames) {
      if (game.state === 'waiting' && !game.players.find(p => p.id === socket.id) && game.players.length < 8) {
        game.players.push({ id: socket.id, username, score: 0 });
        socket.join('trivia-' + gid);
        found = true;
        io.to('trivia-' + gid).emit('trivia-player-joined', {
          gameId: gid,
          players: game.players.map(p => ({ username: p.username, score: p.score })),
          hostCanStart: game.players.length >= 2
        });
        break;
      }
    }
    if (!found) {
      const gid = uuidv4().slice(0, 8);
      triviaGames.set(gid, {
        players: [{ id: socket.id, username, score: 0 }],
        questions: [],
        currentQ: -1,
        state: 'waiting',
        answers: new Map(),
        host: socket.id,
        createdAt: Date.now()
      });
      socket.join('trivia-' + gid);
      socket.emit('trivia-waiting', { gameId: gid });
    }
  });

  socket.on('trivia-start', async (data) => {
    const game = triviaGames.get(data.gameId);
    if (!game || game.host !== socket.id || game.state !== 'waiting') return;
    if (game.players.length < 1) return;
    
    // Fetch questions from Open Trivia DB
    try {
      const resp = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
      const json = await resp.json();
      game.questions = json.results.map(q => ({
        question: decodeHTMLEntities(q.question),
        correct: decodeHTMLEntities(q.correct_answer),
        options: shuffle([decodeHTMLEntities(q.correct_answer), ...q.incorrect_answers.map(a => decodeHTMLEntities(a))]),
        category: q.category,
        difficulty: q.difficulty
      }));
    } catch (e) {
      // Fallback questions
      game.questions = [
        { question: 'What is the capital of France?', correct: 'Paris', options: ['Paris', 'London', 'Berlin', 'Madrid'], category: 'Geography', difficulty: 'easy' },
        { question: 'What year did the Moon landing happen?', correct: '1969', options: ['1969', '1965', '1972', '1959'], category: 'History', difficulty: 'easy' },
        { question: 'What is the largest planet?', correct: 'Jupiter', options: ['Jupiter', 'Saturn', 'Neptune', 'Earth'], category: 'Science', difficulty: 'easy' },
        { question: 'Who painted the Mona Lisa?', correct: 'Leonardo da Vinci', options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Picasso'], category: 'Art', difficulty: 'easy' },
        { question: 'What is H2O?', correct: 'Water', options: ['Water', 'Oxygen', 'Hydrogen', 'Helium'], category: 'Science', difficulty: 'easy' }
      ];
    }
    
    game.state = 'playing';
    game.currentQ = 0;
    game.answers = new Map();
    
    io.to('trivia-' + data.gameId).emit('trivia-game-started', {
      totalQuestions: game.questions.length,
      players: game.players.map(p => ({ username: p.username, score: p.score }))
    });
    
    // Send first question after a short delay
    setTimeout(() => sendTriviaQuestion(data.gameId), 2000);
  });

  socket.on('trivia-answer', (data) => {
    const game = triviaGames.get(data.gameId);
    if (!game || game.state !== 'playing') return;
    const player = game.players.find(p => p.id === socket.id);

    if (!player || game.answers.has(socket.id)) return;
    
    const q = game.questions[game.currentQ];
    const correct = data.answer === q.correct;
    if (correct) {
      // Score based on speed (data.timeLeft is seconds remaining)
      player.score += 100 + (data.timeLeft || 0) * 10;
    }
    game.answers.set(socket.id, { answer: data.answer, correct });
    
    socket.emit('trivia-answer-result', { correct, correctAnswer: q.correct });
    
    // If all players answered, advance
    if (game.answers.size >= game.players.length) {
      advanceTriviaQuestion(data.gameId);
    }
  });

  socket.on('trivia-leave', (data) => {
    if (data.gameId && triviaGames.has(data.gameId)) {
      const game = triviaGames.get(data.gameId);
      game.players = game.players.filter(p => p.id !== socket.id);
      socket.leave('trivia-' + data.gameId);
      if (game.players.length === 0) {
        triviaGames.delete(data.gameId);
      } else {
        io.to('trivia-' + data.gameId).emit('trivia-player-left', {
          players: game.players.map(p => ({ username: p.username, score: p.score }))
        });
      }
    }
  });

  // === CASINO EVENTS ===
  socket.on('casino-game-played', async (data) => {
    const { username, game, bet, won, jackpot } = data;
    
    if (!username || !userSystem.loaded) return;
    
    // Award XP for playing casino games
    let xp = XP_REWARDS.ARCADE_GAME; // 5 XP base
    let reason = `Playing ${game}`;
    
    if (jackpot) {
      xp = 10; // Bonus XP for jackpot
      reason = `Jackpot on ${game}!`;
    }
    
    await userSystem.addXP(username, xp, reason, io);
    userSystem.trackGamePlayed(username);
    
    // Track coins (update user system)
    if (won > 0) {
      userSystem.updateCoins(username, won - bet); // Net win
    } else {
      userSystem.updateCoins(username, -bet); // Loss
    }
  });

  socket.on('casino-update-coins', (data) => {
    const { username, coins } = data;
    if (username && userSystem.loaded) {
      userSystem.updateCoins(username, coins, true); // true = set absolute value
    }
  });

  // Handle apartment registration
  socket.on('register', (username) => {
    if (username && userSystem.loaded) {
      const user = userSystem.getOrCreateUser(username, socket.id);
      socket.username = username;
      console.log(`🏠 Apartment registered for user: ${username}`);
    }
  });

  // Handle apartment data updates
  socket.on('updateApartment', async (data) => {
    const { username, apartmentData } = data;
    
    if (!username || !userSystem.loaded) {
      console.error('Cannot update apartment: user system not loaded or no username');
      return;
    }
    
    if (!userSystem.users[username]) {
      console.error(`Cannot update apartment: user ${username} not found`);
      return;
    }
    
    // Save apartment data to user profile
    userSystem.users[username].apartmentData = apartmentData;
    await userSystem.saveUsers();
    
    console.log(`✅ Apartment updated for ${username}`);
    socket.emit('apartmentUpdated', { success: true });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const room = rooms.get(user.roomId);
      if (room) {
        if (room.streamer && room.streamer.id === socket.id) {
          room.streamer = null;
        } else {
          room.participants.delete(socket.id);
        }

        // Notify room about user leaving
        socket.to(user.roomId).emit('user-left', {
          userId: socket.id,
          username: user.username
        });

        // Clean up empty rooms
        if (!room.streamer && room.participants.size === 0) {
          rooms.delete(user.roomId);
        }
      }
      users.delete(socket.id);
    }
    // Clean up arcade games on disconnect
    for (const [gid, game] of tttGames) {
      if (game.player1?.id === socket.id || game.player2?.id === socket.id) {
        io.to('ttt-' + gid).emit('ttt-opponent-left', {});
        tttGames.delete(gid);
      }
    }
    for (const [gid, game] of rpsGames) {
      if (game.player1?.id === socket.id || game.player2?.id === socket.id) {
        io.to('rps-' + gid).emit('rps-opponent-left', {});
        rpsGames.delete(gid);
      }
    }
    for (const [gid, game] of triviaGames) {
      game.players = game.players.filter(p => p.id !== socket.id);
      if (game.players.length === 0) {
        if (game.timer) clearTimeout(game.timer);
        triviaGames.delete(gid);
      } else {
        io.to('trivia-' + data.gameId).emit('trivia-player-left', {
          players: game.players.map(p => ({ username: p.username, score: p.score }))
        });
      }
    }

    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Chiffly Streaming Platform running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the platform`);
});
