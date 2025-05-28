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
    ? [process.env.DOMAIN_URL, `https://${process.env.DOMAIN_URL}`] 
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

// Store active rooms and users
const rooms = new Map();
const users = new Map();

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
      isPrivate: room.isPrivate || false
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
    const newRoom = {
      id: roomId,
      name: data.name,
      description: data.description,
      maxParticipants: data.maxParticipants || 10,
      isPrivate: data.isPrivate || false,
      type: data.type || 'questing', // 'questing' or 'pub'
      streamer: null,
      participants: new Map(),
      messages: [],
      createdAt: new Date().toISOString()
    };

    rooms.set(roomId, newRoom);
    
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
    const { roomId, username, isStreamer } = data;
    
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        name: `Adventure ${roomId.slice(0, 6)}`,
        description: 'A spontaneous quest begins!',
        maxParticipants: 10,
        isPrivate: false,
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
      messages: room.messages.slice(-50) // Last 50 messages
    });

    console.log(`${username} joined room ${roomId} as ${isStreamer ? 'streamer' : 'participant'}`);
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
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Chiffly Streaming Platform running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the platform`);
}); 