# Chiffly Platform - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Server-Side APIs](#server-side-apis)
3. [Client-Side APIs](#client-side-apis)
4. [Socket.IO Events](#socketio-events)
5. [JavaScript Libraries](#javascript-libraries)
6. [Component Documentation](#component-documentation)
7. [Configuration](#configuration)
8. [Usage Examples](#usage-examples)

## Overview

Chiffly is a modern social streaming platform built with Node.js, Express.js, Socket.IO, and WebRTC. It features multiple themed sections including Adventure (Questing IRL), Tavern (Virtual Pub), Cinema, Night Club, Games Room, and Lounge.

### Technology Stack
- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO, WebRTC
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: Local Storage (for user sessions and XP system)

---

## Server-Side APIs

### HTTP Endpoints

#### Main Routes

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/` | Main homepage | `index.html` |
| `GET` | `/questing` | Adventure/Questing section | `questing.html` |
| `GET` | `/pub` | Virtual Pub section | `pub.html` |
| `GET` | `/stream` | Basic streaming interface | `stream.html` |
| `GET` | `/pub-stream` | Pub streaming interface | `pub-stream.html` |
| `GET` | `/nightclub` | Night Club section | `nightclub.html` |
| `GET` | `/games` | Games room section | `games.html` |
| `GET` | `/cinema` | Cinema section | `cinema.html` |
| `GET` | `/lounge` | Lounge section | `lounge.html` |

#### API Endpoints

| Method | Endpoint | Description | Response Format |
|--------|----------|-------------|-----------------|
| `GET` | `/api/debug` | Platform debug information | JSON |

**Debug Endpoint Response:**
```javascript
{
  totalRooms: number,
  totalUsers: number,
  pubRooms: number,
  rooms: Array<{
    id: string,
    name: string,
    type: string,
    participants: number,
    hasStreamer: boolean
  }>,
  nodeEnv: string,
  corsOrigins: string[]
}
```

### Server Configuration

#### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `DOMAIN_URL`: Production domain URL

#### CORS Configuration
```javascript
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? ['https://chifftown.com', 'https://www.chifftown.com', process.env.DOMAIN_URL]
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST"],
  credentials: true
}
```

---

## Client-Side APIs

### CVLogApp Class (app.js)

Main application class for streaming functionality.

#### Constructor
```javascript
const app = new CVLogApp();
```

#### Public Methods

##### `init()`
Initializes the application, sets up socket connections and event listeners.

**Usage:**
```javascript
app.init();
```

##### `joinRoom()`
Joins a streaming room with user credentials.

**Usage:**
```javascript
// Called automatically when form is submitted
// or manually with pre-filled data
app.joinRoom();
```

##### `leaveRoom()`
Leaves the current room and disconnects from streaming.

**Usage:**
```javascript
app.leaveRoom();
```

##### `toggleCamera()`
Toggles the user's camera on/off.

**Usage:**
```javascript
app.toggleCamera();
```

##### `toggleMicrophone()`
Toggles the user's microphone on/off.

**Usage:**
```javascript
app.toggleMicrophone();
```

##### `sendChatMessage()`
Sends a chat message to the current room.

**Usage:**
```javascript
app.sendChatMessage();
```

#### Properties

- `socket`: Socket.IO client instance
- `localStream`: MediaStream for user's camera/microphone
- `peerConnections`: Map of WebRTC peer connections
- `currentUser`: Current user information
- `currentRoom`: Current room ID
- `isStreamer`: Boolean indicating if user is a streamer
- `isCameraOn`: Boolean indicating camera state
- `isMicOn`: Boolean indicating microphone state

### Auth System (main-home.js)

#### User Session Management

##### `createUserSession(username, userType, rememberDuration)`
Creates a new user session with automatic expiry.

**Parameters:**
- `username` (string): User's display name
- `userType` (string): 'registered' or 'guest' (default: 'registered')
- `rememberDuration` (number): Session duration in hours (default: 24)

**Usage:**
```javascript
createUserSession('JohnDoe', 'registered', 24);
createUserSession('GuestUser', 'guest', 1);
```

##### `restoreUserSession()`
Automatically restores user session from localStorage if valid.

**Usage:**
```javascript
restoreUserSession();
```

#### Room Management Functions

##### `initializeRoomCards()`
Sets up room card interactions and access control.

**Usage:**
```javascript
initializeRoomCards();
```

##### `updateRoomAccessIndicators()`
Updates UI to show locked/unlocked rooms based on authentication.

**Usage:**
```javascript
updateRoomAccessIndicators();
```

### Homepage Functions (homepage.js)

#### Room List Management

##### `requestRoomList()`
Requests current room list from server.

**Usage:**
```javascript
requestRoomList();
```

##### `updateRoomsList(rooms)`
Updates the displayed room list.

**Parameters:**
- `rooms` (Array): Array of room objects

**Usage:**
```javascript
updateRoomsList([
  {
    id: 'room123',
    name: 'Adventure Room',
    description: 'Epic quests await!',
    participantCount: 5,
    maxParticipants: 10,
    hasStreamer: true
  }
]);
```

##### `showCreateRoomModal()`
Displays the room creation modal.

**Usage:**
```javascript
showCreateRoomModal();
```

##### `showJoinRoomModal(roomId)`
Displays the room joining modal for a specific room.

**Parameters:**
- `roomId` (string): ID of the room to join

**Usage:**
```javascript
showJoinRoomModal('room123');
```

### Pub Functions (pub.js)

Virtual Pub specific functionality.

#### Room Management

##### `showCreateRoomModal()`
Shows table reservation modal for the pub.

**Usage:**
```javascript
showCreateRoomModal();
```

##### `joinTable(roomId)`
Initiates joining a pub table.

**Parameters:**
- `roomId` (string): Table/room ID

**Usage:**
```javascript
joinTable('table123');
```

##### `updateStats(stats)`
Updates pub statistics display.

**Parameters:**
- `stats` (object): Statistics object with totalUsers, activeRooms, liveStreams

**Usage:**
```javascript
updateStats({
  totalUsers: 42,
  activeRooms: 8,
  liveStreams: 3
});
```

---

## Socket.IO Events

### Client to Server Events

#### Room Management

##### `join-room`
Join a streaming room.

**Payload:**
```javascript
{
  roomId: string,
  username: string,
  isStreamer: boolean,
  roomType: string  // 'questing' or 'pub'
}
```

**Example:**
```javascript
socket.emit('join-room', {
  roomId: 'room123',
  username: 'JohnDoe',
  isStreamer: false,
  roomType: 'questing'
});
```

##### `create-room`
Create a new room.

**Payload:**
```javascript
{
  name: string,
  description: string,
  maxParticipants: number,
  isPrivate: boolean,
  type: string  // 'questing' or 'pub'
}
```

**Example:**
```javascript
socket.emit('create-room', {
  name: 'Epic Adventure',
  description: 'Join us for mountain climbing!',
  maxParticipants: 8,
  isPrivate: false,
  type: 'questing'
});
```

#### Chat System

##### `chat-message`
Send a chat message.

**Payload:**
```javascript
{
  text: string
}
```

**Example:**
```javascript
socket.emit('chat-message', {
  text: 'Hello everyone!'
});
```

#### Platform Stats

##### `get-platform-stats`
Request platform statistics.

**Example:**
```javascript
socket.emit('get-platform-stats');
```

##### `get-room-list`
Request current room list.

**Example:**
```javascript
socket.emit('get-room-list');
```

#### WebRTC Signaling

##### `offer`
Send WebRTC offer for peer connection.

**Payload:**
```javascript
{
  target: string,  // Socket ID of target peer
  offer: RTCSessionDescription
}
```

##### `answer`
Send WebRTC answer for peer connection.

**Payload:**
```javascript
{
  target: string,  // Socket ID of target peer
  answer: RTCSessionDescription
}
```

##### `ice-candidate`
Send ICE candidate for peer connection.

**Payload:**
```javascript
{
  target: string,  // Socket ID of target peer
  candidate: RTCIceCandidate
}
```

#### Slot Management

##### `join-slot`
Join a participant slot in streaming view.

**Payload:**
```javascript
{
  slotNumber: number
}
```

##### `leave-slot`
Leave a participant slot.

**Payload:**
```javascript
{
  slotNumber: number
}
```

### Server to Client Events

#### Room Updates

##### `room-state`
Receive current room state when joining.

**Payload:**
```javascript
{
  streamer: {
    id: string,
    username: string,
    isStreamer: true
  } | null,
  participants: Array<{
    id: string,
    username: string,
    isStreamer: false
  }>,
  messages: Array<ChatMessage>
}
```

##### `user-joined`
Notification when a user joins the room.

**Payload:**
```javascript
{
  userId: string,
  username: string,
  isStreamer: boolean
}
```

##### `user-left`
Notification when a user leaves the room.

**Payload:**
```javascript
{
  userId: string,
  username: string
}
```

#### Platform Data

##### `platform-stats`
Receive platform statistics.

**Payload:**
```javascript
{
  totalUsers: number,
  activeRooms: number,
  liveStreams: number,
  questingUsers: number,
  questingRooms: number,
  pubUsers: number,
  pubRooms: number
}
```

##### `room-list`
Receive current room list.

**Payload:**
```javascript
{
  rooms: Array<RoomData>,
  users: Array<UserData>,
  stats: StatsData
}
```

#### Chat System

##### `chat-message`
Receive a chat message.

**Payload:**
```javascript
{
  id: string,
  userId: string,
  username: string,
  text: string,
  timestamp: string,
  isStreamer: boolean
}
```

---

## JavaScript Libraries

### XP System (xp-system.js)

Lightweight RPG-style experience and leveling system.

#### Global API: `window.xpSystem`

##### `addXp(username, amount, reason)`
Award experience points to a user.

**Parameters:**
- `username` (string): Target user
- `amount` (number): XP points to award
- `reason` (string): Optional reason for XP gain

**Usage:**
```javascript
xpSystem.addXp('JohnDoe', 50, 'completing a stream');
xpSystem.addXp('Alice', 25, 'joining a room');
```

##### `getUserData(username)`
Get user's XP data including level, achievements, and inventory.

**Parameters:**
- `username` (string): Target user

**Returns:**
```javascript
{
  xp: number,
  achievements: string[],
  inventory: string[],
  // ... other user data
}
```

**Usage:**
```javascript
const userData = xpSystem.getUserData('JohnDoe');
console.log(`Level: ${xpSystem.getLevel(userData.xp)}`);
```

##### `getLevel(totalXp)`
Calculate level from total XP.

**Parameters:**
- `totalXp` (number): Total experience points

**Returns:** `number` - User level

**Usage:**
```javascript
const level = xpSystem.getLevel(250); // Returns 3
```

#### Achievements System

Built-in achievements with automatic detection:

| Achievement | XP Required | Reward Item |
|-------------|-------------|-------------|
| First Steps | 10 | Wooden Mug |
| Camera Ready | 100 | Bronze Webcam |
| Rookie Broadcaster | 250 | Copper Mic |
| Streaming Star | 1000 | Silver Trophy |

---

## Component Documentation

### Room Cards Component

Interactive cards for navigating between platform sections.

#### HTML Structure
```html
<div class="room-card [theme]-room" data-href="[section].html">
  <div class="room-icon">
    <i class="fas fa-[icon]"></i>
  </div>
  <div class="room-content">
    <h3 class="room-title">[Title]</h3>
    <p class="room-description">[Description]</p>
  </div>
  <div class="room-overlay"></div>
</div>
```

#### Available Themes
- `tavern-room` - Virtual Pub
- `adventure-room` - Questing/Adventure
- `cinema-room` - Video streaming
- `club-room` - Night club/music
- `games-room` - Gaming
- `lounge-room` - Casual conversation

#### CSS Classes
- `.room-card` - Base card styling
- `.room-card.locked` - Applied when user authentication required
- `.access-lock` - Lock icon overlay for unauthenticated users

### Authentication Component

User sign-in/registration system with session management.

#### Key Elements
- `#signInBtn` - Main authentication button
- `#userMenu` - Dropdown menu for signed-in users
- `#userName` - Display element for username
- `#signOutBtn` - Sign out action

#### Session Storage Keys
- `chiffly_signed_in` - Boolean authentication status
- `chiffly_username` - Current username
- `chiffly_user_type` - 'registered' or 'guest'
- `chiffly_session_expiry` - Session expiration timestamp
- `chiffly_current_session` - Complete session data

### Chat Component

Real-time messaging interface.

#### HTML Structure
```html
<div class="chat-container">
  <div class="chat-messages" id="chatMessages">
    <!-- Messages populated here -->
  </div>
  <div class="chat-input-container">
    <input type="text" id="chatInput" placeholder="Type a message...">
    <button id="sendMessage">Send</button>
  </div>
</div>
```

#### Message Structure
```html
<div class="chat-message [streamer]">
  <div class="chat-message-header">
    <span class="chat-username [streamer]">[Username]</span>
    <span class="chat-timestamp">[Time]</span>
  </div>
  <div class="chat-text">[Message Text]</div>
</div>
```

### Video Streaming Component

WebRTC-based video streaming interface.

#### Main Video Element
```html
<video id="mainVideo" autoplay muted playsinline></video>
```

#### Participant Videos Container
```html
<div id="participantVideos">
  <!-- Participant videos added dynamically -->
</div>
```

#### Control Buttons
- `#toggleCamera` - Camera on/off toggle
- `#toggleMic` - Microphone on/off toggle
- `#leaveRoom` - Leave room action

---

## Configuration

### Server Configuration (chifftown-config.js)

Production deployment configuration for chifftown.com.

```javascript
module.exports = {
  NODE_ENV: 'production',
  DOMAIN_URL: 'chifftown.com',
  PORT: process.env.PORT || 3000,
  corsOptions: {
    origin: [
      'https://chifftown.com',
      'https://www.chifftown.com'
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
}
```

### Environment Variables (.env)

```bash
NODE_ENV=production
DOMAIN_URL=yourdomain.com
PORT=3000
```

---

## Usage Examples

### Basic Room Creation and Joining

#### 1. Create a New Adventure Room
```javascript
// Client-side room creation
socket.emit('create-room', {
  name: 'Mountain Hiking Adventure',
  description: 'Join us for a scenic mountain hike with live streaming!',
  maxParticipants: 12,
  isPrivate: false,
  type: 'questing'
});

// Server response
socket.on('room-created', (roomData) => {
  console.log('Room created:', roomData.id);
  // Redirect to streaming interface
  window.location.href = `adventure-stream.html?roomId=${roomData.id}&username=Host&isStreamer=true`;
});
```

#### 2. Join an Existing Room
```javascript
// Join as a participant
socket.emit('join-room', {
  roomId: 'abc123',
  username: 'AdventureSeeker',
  isStreamer: false,
  roomType: 'questing'
});

// Handle room state
socket.on('room-state', (data) => {
  console.log('Current streamer:', data.streamer);
  console.log('Participants:', data.participants);
  console.log('Recent messages:', data.messages);
});
```

### WebRTC Streaming Setup

#### Initialize Local Stream
```javascript
const app = new CVLogApp();

// Get user media and setup local stream
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  app.localStream = stream;
  document.getElementById('mainVideo').srcObject = stream;
});
```

#### Create Peer Connection
```javascript
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

// Add local stream
app.localStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, app.localStream);
});

// Handle remote stream
peerConnection.ontrack = (event) => {
  const [remoteStream] = event.streams;
  addParticipantVideo(senderId, username, remoteStream);
};
```

### Authentication Workflow

#### User Registration and Sign-in
```javascript
// Register new user
const result = registerUser('JohnDoe', 'john@example.com', 'password123');
if (result.success) {
  createUserSession('JohnDoe', 'registered', 168); // 7 days
  showNotification('Welcome to Chiffly!', 'success');
}

// Guest sign-in
createUserSession('GuestUser123', 'guest', 1); // 1 hour session
updateRoomAccessIndicators(); // Update UI
```

#### Session Management
```javascript
// Check authentication before room access
const isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
if (!isSignedIn) {
  showNotification('Please enter Chiffly first to access rooms!', 'warning');
  return;
}

// Auto-restore session on page load
document.addEventListener('DOMContentLoaded', () => {
  restoreUserSession();
});
```

### XP System Integration

#### Award XP for Platform Activities
```javascript
// Award XP for streaming
xpSystem.addXp(username, 100, 'starting a live stream');

// Award XP for participation
xpSystem.addXp(username, 25, 'joining a room');

// Award XP for chat activity
xpSystem.addXp(username, 5, 'sending a message');

// Check user progress
const userData = xpSystem.getUserData(username);
const level = xpSystem.getLevel(userData.xp);
console.log(`${username} is level ${level} with ${userData.xp} XP`);
```

### Real-time Chat Implementation

#### Send and Receive Messages
```javascript
// Send message
function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (message) {
    socket.emit('chat-message', { text: message });
    input.value = '';
  }
}

// Receive and display messages
socket.on('chat-message', (message) => {
  const chatContainer = document.getElementById('chatMessages');
  const messageElement = document.createElement('div');
  messageElement.className = `chat-message ${message.isStreamer ? 'streamer' : ''}`;
  
  messageElement.innerHTML = `
    <div class="chat-message-header">
      <span class="chat-username">${escapeHtml(message.username)}</span>
      <span class="chat-timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
    </div>
    <div class="chat-text">${escapeHtml(message.text)}</div>
  `;
  
  chatContainer.appendChild(messageElement);
  chatContainer.scrollTop = chatContainer.scrollHeight;
});
```

### Platform Statistics

#### Request and Display Stats
```javascript
// Request platform stats
socket.emit('get-platform-stats');

// Handle stats response
socket.on('platform-stats', (stats) => {
  document.getElementById('totalUsers').textContent = stats.totalUsers;
  document.getElementById('activeRooms').textContent = stats.activeRooms;
  document.getElementById('liveStreams').textContent = stats.liveStreams;
  
  console.log('Platform Statistics:', {
    'Total Users': stats.totalUsers,
    'Active Rooms': stats.activeRooms,
    'Live Streams': stats.liveStreams,
    'Questing Users': stats.questingUsers,
    'Pub Users': stats.pubUsers
  });
});
```

---

## Error Handling

### Common Error Scenarios

#### Media Access Errors
```javascript
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
} catch (error) {
  console.error('Media access denied:', error);
  showNotification('Camera/microphone access required for streaming', 'error');
}
```

#### Socket Connection Errors
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  updateStatus('error', 'Connection Failed');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  updateStatus('disconnected', 'Disconnected');
  
  if (reason === 'io server disconnect') {
    socket.connect(); // Manually reconnect
  }
});
```

#### WebRTC Connection Errors
```javascript
peerConnection.oniceconnectionstatechange = () => {
  if (peerConnection.iceConnectionState === 'failed') {
    console.error('WebRTC connection failed');
    showNotification('Connection to peer failed', 'error');
  }
};
```

---

## Security Considerations

### Input Sanitization
All user inputs are escaped to prevent XSS attacks:

```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### CORS Configuration
Production CORS settings restrict access to authorized domains:

```javascript
const corsOptions = {
  origin: ['https://chifftown.com', 'https://www.chifftown.com'],
  methods: ["GET", "POST"],
  credentials: true
};
```

### Session Security
- Session expiry prevents indefinite sessions
- User type validation for guest vs registered users
- LocalStorage used for client-side session management

---

This documentation covers all public APIs, functions, and components in the Chiffly platform. For additional support or feature requests, please refer to the project repository or contact the development team.