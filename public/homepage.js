// Socket.IO connection
const socket = io();

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const totalUsersSpan = document.getElementById('totalUsers');
const activeRoomsSpan = document.getElementById('activeRooms');
const liveStreamsSpan = document.getElementById('liveStreams');
const roomsList = document.getElementById('roomsList');
const usersList = document.getElementById('usersList');
const noRooms = document.getElementById('noRooms');
const noUsers = document.getElementById('noUsers');

// Modals
const createRoomModal = document.getElementById('createRoomModal');
const joinRoomModal = document.getElementById('joinRoomModal');
const createRoomForm = document.getElementById('createRoomForm');
const joinRoomForm = document.getElementById('joinRoomForm');

// Data storage
let currentRooms = new Map();
let currentUsers = new Map();
let selectedRoomId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    requestRoomList();
});

// Socket event handlers
socket.on('connect', () => {
    updateStatus('connected', 'Connected');
    requestRoomList();
});

socket.on('disconnect', () => {
    updateStatus('disconnected', 'Disconnected');
});

socket.on('room-list', (data) => {
    updateRoomsList(data.rooms);
    updateUsersList(data.users);
    updateStats(data.stats);
});

socket.on('room-created', (roomData) => {
    currentRooms.set(roomData.id, roomData);
    renderRooms();
    hideCreateRoomModal();
    // Automatically join the created room
    showJoinRoomModal(roomData.id);
});

socket.on('room-updated', (roomData) => {
    currentRooms.set(roomData.id, roomData);
    renderRooms();
});

socket.on('room-deleted', (roomId) => {
    currentRooms.delete(roomId);
    renderRooms();
});

socket.on('user-online', (userData) => {
    currentUsers.set(userData.id, userData);
    renderUsers();
});

socket.on('user-offline', (userId) => {
    currentUsers.delete(userId);
    renderUsers();
});

// Event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('createRoomBtn').addEventListener('click', showCreateRoomModal);
    document.getElementById('refreshBtn').addEventListener('click', requestRoomList);
    
    // Logo click to refresh
    document.querySelector('.nav-logo').addEventListener('click', () => {
        window.location.reload();
    });

    // Forms
    createRoomForm.addEventListener('submit', handleCreateRoom);
    joinRoomForm.addEventListener('submit', handleJoinRoom);

    // Modal close events
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideAllModals();
        }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });
}

// Status management
function updateStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`;
    statusIndicator.querySelector('span').textContent = text;
}

// Data requests
function requestRoomList() {
    socket.emit('get-room-list');
}

// Room management
function updateRoomsList(rooms) {
    currentRooms.clear();
    rooms.forEach(room => {
        currentRooms.set(room.id, room);
    });
    renderRooms();
}

function renderRooms() {
    const roomsArray = Array.from(currentRooms.values());
    
    if (roomsArray.length === 0) {
        roomsList.style.display = 'none';
        noRooms.style.display = 'block';
        return;
    }

    roomsList.style.display = 'grid';
    noRooms.style.display = 'none';

    roomsList.innerHTML = roomsArray.map(room => `
        <div class="room-card" onclick="showJoinRoomModal('${room.id}')">
            <div class="room-header">
                <div>
                    <div class="room-title">${escapeHtml(room.name)}</div>
                    <div class="room-status ${room.hasStreamer ? 'live' : ''}">
                        <i class="fas fa-circle"></i>
                        ${room.hasStreamer ? 'Live Stream' : 'Waiting for Leader'}
                    </div>
                </div>
            </div>
            <div class="room-description">
                ${escapeHtml(room.description || 'Join this adventure and explore together!')}
            </div>
            <div class="room-footer">
                <div class="room-participants">
                    <i class="fas fa-users"></i>
                    ${room.participantCount}/${room.maxParticipants} Questers
                </div>
                <button class="btn btn-primary room-join-btn" onclick="event.stopPropagation(); showJoinRoomModal('${room.id}')">
                    <i class="fas fa-compass"></i> Join Quest
                </button>
            </div>
        </div>
    `).join('');
}

// User management
function updateUsersList(users) {
    currentUsers.clear();
    users.forEach(user => {
        currentUsers.set(user.id, user);
    });
    renderUsers();
}

function renderUsers() {
    const usersArray = Array.from(currentUsers.values());
    
    if (usersArray.length === 0) {
        usersList.style.display = 'none';
        noUsers.style.display = 'block';
        return;
    }

    usersList.style.display = 'flex';
    noUsers.style.display = 'none';

    usersList.innerHTML = usersArray.map(user => `
        <div class="user-card">
            <div class="user-avatar">
                ${user.username.charAt(0).toUpperCase()}
            </div>
            <div class="user-info">
                <div class="user-name">${escapeHtml(user.username)}</div>
                <div class="user-status ${user.isStreaming ? 'streaming' : ''}">
                    <i class="fas fa-circle"></i>
                    ${user.isStreaming ? 'Live Streaming' : user.roomName ? `In ${user.roomName}` : 'In Lobby'}
                </div>
            </div>
        </div>
    `).join('');
}

// Stats management
function updateStats(stats) {
    totalUsersSpan.textContent = stats.totalUsers || 0;
    activeRoomsSpan.textContent = stats.activeRooms || 0;
    liveStreamsSpan.textContent = stats.liveStreams || 0;
}

// Modal management
function showCreateRoomModal() {
    createRoomModal.classList.add('show');
    document.getElementById('adventureName').focus();
}

function hideCreateRoomModal() {
    createRoomModal.classList.remove('show');
    createRoomForm.reset();
}

function showJoinRoomModal(roomId = null) {
    selectedRoomId = roomId;
    joinRoomModal.classList.add('show');
    document.getElementById('username').focus();
    
    // Pre-fill room info if available
    if (roomId && currentRooms.has(roomId)) {
        const room = currentRooms.get(roomId);
        const modalTitle = joinRoomModal.querySelector('.modal-header h2');
        modalTitle.innerHTML = `<i class="fas fa-sign-in-alt"></i> Join "${escapeHtml(room.name)}"`;
    }
}

function hideJoinRoomModal() {
    joinRoomModal.classList.remove('show');
    joinRoomForm.reset();
    selectedRoomId = null;
}

function hideAllModals() {
    hideCreateRoomModal();
    hideJoinRoomModal();
}

// Form handlers
function handleCreateRoom(e) {
    e.preventDefault();
    
    const formData = new FormData(createRoomForm);
    const roomData = {
        name: formData.get('adventureName') || document.getElementById('adventureName').value,
        description: formData.get('adventureDescription') || document.getElementById('adventureDescription').value,
        maxParticipants: parseInt(document.getElementById('maxParticipants').value),
        isPrivate: document.getElementById('isPrivate').checked
    };

    // Validate
    if (!roomData.name.trim()) {
        alert('Please enter an adventure name');
        return;
    }

    socket.emit('create-room', roomData);
}

function handleJoinRoom(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const isStreamer = document.getElementById('joinAsStreamer').checked;

    if (!username) {
        alert('Please enter your name');
        return;
    }

    if (!selectedRoomId) {
        alert('No room selected');
        return;
    }

    // Redirect to streaming page with parameters
    const params = new URLSearchParams({
        roomId: selectedRoomId,
        username: username,
        isStreamer: isStreamer.toString()
    });
    
            window.location.href = `/chiffly/stream.html?${params.toString()}`;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateRoomId() {
    return Math.random().toString(36).substr(2, 9);
}

// Auto-refresh room list every 30 seconds
setInterval(() => {
    if (socket.connected) {
        requestRoomList();
    }
}, 30000);

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && socket.connected) {
        requestRoomList();
    }
});

// Global functions for onclick handlers
window.showCreateRoomModal = showCreateRoomModal;
window.hideCreateRoomModal = hideCreateRoomModal;
window.showJoinRoomModal = showJoinRoomModal;
window.hideJoinRoomModal = hideJoinRoomModal; 