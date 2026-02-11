const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);

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
    setTimeout(() => {
      io.to('trivia-' + gameId).emit('trivia-game-over', {
        scores: game.players.map(p => ({ username: p.username, score: p.score })).sort((a, b) => b.score - a.score),
        winner: game.players.reduce((a, b) => a.score > b.score ? a : b).username
      });
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

  // Handle user joining a room
  socket.on('join-room', (data) => {
    const { roomId, username, isStreamer, roomType } = data;
    
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
    } else if (!isStreamer) {
      room.participants.set(socket.id, user);
    }

    users.set(socket.id, user);
    socket.join(roomId);

    // Notify room about new user
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      username,
      isStreamer
    });

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
  socket.on('send-tip', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    const room = rooms.get(user.roomId);
    if (!room || !room.streamer) return;
    // Broadcast tip to everyone in the room
    io.to(user.roomId).emit('tip-received', {
      from: user.username,
      amount: data.amount,
      to: room.streamer.username
    });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
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
    }

    // Broadcast message to all users in the room
    io.to(user.roomId).emit('chat-message', message);
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

  socket.on('ttt-move', (data) => {
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

  socket.on('rps-choose', (data) => {
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
        io.to('trivia-' + gid).emit('trivia-player-left', {
          players: game.players.map(p => ({ username: p.username, score: p.score }))
        });
      }
    }

    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Chiffly Streaming Platform running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the platform`);
}); 