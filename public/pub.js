// Socket.IO connection
const socket = io();

// DOM elements
const totalUsersSpan = document.getElementById('totalUsers');
const activeRoomsSpan = document.getElementById('activeRooms');
const liveStreamsSpan = document.getElementById('liveStreams');
const roomsList = document.getElementById('roomsList');
const usersList = document.getElementById('usersList');
const noRooms = document.getElementById('noRooms');
const noUsers = document.getElementById('noUsers');
const statusIndicator = document.getElementById('statusIndicator');

// Modal elements
const createRoomModal = document.getElementById('createRoomModal');
const joinRoomModal = document.getElementById('joinRoomModal');
const createRoomForm = document.getElementById('createRoomForm');
const joinRoomForm = document.getElementById('joinRoomForm');

// Buttons
const createTableBtn = document.getElementById('createTableBtn');
const refreshBtn = document.getElementById('refreshBtn');

// Data storage
let currentRooms = [];
let currentUsers = [];
let selectedRoomId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateConnectionStatus('connecting');
});

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to Virtual Pub');
    updateConnectionStatus('connected');
    requestRoomList();
});

socket.on('disconnect', () => {
    console.log('Disconnected from Virtual Pub');
    updateConnectionStatus('disconnected');
});

socket.on('room-list', (data) => {
    updateRoomList(data.rooms.filter(room => !room.type || room.type === 'pub'));
    updateUsersList(data.users);
    updateStats(data.stats);
});

socket.on('room-created', (roomData) => {
    console.log('Table reserved:', roomData);
    hideCreateRoomModal();
    requestRoomList();
    
    // Show success message
    showNotification('Table reserved successfully!', 'success');
});

socket.on('room-updated', (roomData) => {
    requestRoomList();
});

// Event listeners
function setupEventListeners() {
    // Button events
    createTableBtn.addEventListener('click', showCreateRoomModal);
    refreshBtn.addEventListener('click', requestRoomList);
    
    // Form events
    createRoomForm.addEventListener('submit', handleCreateRoom);
    joinRoomForm.addEventListener('submit', handleJoinRoom);
    
    // Modal events
    window.addEventListener('click', (e) => {
        if (e.target === createRoomModal) {
            hideCreateRoomModal();
        }
        if (e.target === joinRoomModal) {
            hideJoinRoomModal();
        }
    });
    
    // Auto-refresh
    setInterval(() => {
        if (socket.connected) {
            requestRoomList();
        }
    }, 30000); // Refresh every 30 seconds
}

// Room management
function requestRoomList() {
    socket.emit('get-room-list');
}

function updateRoomList(rooms) {
    currentRooms = rooms;
    
    if (rooms.length === 0) {
        roomsList.style.display = 'none';
        noRooms.style.display = 'block';
        return;
    }
    
    roomsList.style.display = 'grid';
    noRooms.style.display = 'none';
    
    roomsList.innerHTML = rooms.map(room => `
        <div class="room-card" onclick="selectRoom('${room.id}')">
            <div class="room-header">
                <div>
                    <div class="room-name">${escapeHtml(room.name)}</div>
                    <div class="room-status">
                        <i class="fas fa-circle"></i>
                        ${room.hasStreamer ? 'Active' : 'Waiting for Host'}
                    </div>
                </div>
            </div>
            <div class="room-description">
                ${escapeHtml(room.description) || 'Join the conversation at this cozy table.'}
            </div>
            <div class="room-stats">
                <div class="room-participants">
                    <i class="fas fa-users"></i>
                    ${room.participantCount}/${room.maxParticipants} patrons
                </div>
                <div class="room-actions">
                    <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); joinTable('${room.id}')">
                        <i class="fas fa-chair"></i> Join
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateUsersList(users) {
    currentUsers = users;
    
    if (users.length === 0) {
        usersList.style.display = 'none';
        noUsers.style.display = 'block';
        return;
    }
    
    usersList.style.display = 'flex';
    noUsers.style.display = 'none';
    
    usersList.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-avatar">
                ${user.username.charAt(0).toUpperCase()}
            </div>
            <div class="user-info">
                <div class="user-name">${escapeHtml(user.username)}</div>
                <div class="user-status">
                    ${user.isStreaming ? 
                        '<i class="fas fa-video"></i> Hosting a table' : 
                        user.roomName ? 
                            `<i class="fas fa-chair"></i> At ${escapeHtml(user.roomName)}` : 
                            '<i class="fas fa-coffee"></i> In the pub'
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats(stats) {
    if (totalUsersSpan) totalUsersSpan.textContent = stats.totalUsers || 0;
    if (activeRoomsSpan) activeRoomsSpan.textContent = stats.activeRooms || 0;
    if (liveStreamsSpan) liveStreamsSpan.textContent = stats.liveStreams || 0;
}

// Modal functions
function showCreateRoomModal() {
    createRoomModal.classList.add('show');
    document.getElementById('tableName').focus();
}

function hideCreateRoomModal() {
    createRoomModal.classList.remove('show');
    createRoomForm.reset();
}

function showJoinRoomModal(roomId) {
    selectedRoomId = roomId;
    joinRoomModal.classList.add('show');
    document.getElementById('username').focus();
}

function hideJoinRoomModal() {
    joinRoomModal.classList.remove('show');
    joinRoomForm.reset();
    selectedRoomId = null;
}

// Room actions
function selectRoom(roomId) {
    const room = currentRooms.find(r => r.id === roomId);
    if (room) {
        showJoinRoomModal(roomId);
    }
}

function joinTable(roomId) {
    showJoinRoomModal(roomId);
}

function handleCreateRoom(e) {
    e.preventDefault();
    
    const formData = new FormData(createRoomForm);
    const roomData = {
        name: formData.get('tableName') || document.getElementById('tableName').value,
        description: formData.get('tableDescription') || document.getElementById('tableDescription').value,
        maxParticipants: parseInt(formData.get('maxPatrons') || document.getElementById('maxPatrons').value),
        isPrivate: formData.has('isPrivate') || document.getElementById('isPrivate').checked,
        type: 'pub'
    };
    
    // Validate required fields
    if (!roomData.name.trim()) {
        showNotification('Please enter a table name', 'error');
        return;
    }
    
    socket.emit('create-room', roomData);
}

function handleJoinRoom(e) {
    e.preventDefault();
    
    if (!selectedRoomId) {
        showNotification('No table selected', 'error');
        return;
    }
    
    const formData = new FormData(joinRoomForm);
    const username = formData.get('username') || document.getElementById('username').value;
    const isHost = formData.has('joinAsHost') || document.getElementById('joinAsHost').checked;
    
    if (!username.trim()) {
        showNotification('Please enter your name', 'error');
        return;
    }
    
    // Navigate to pub streaming page
    const params = new URLSearchParams({
        room: selectedRoomId,
        username: username.trim(),
        host: isHost ? '1' : '0'
    });
    
    window.location.href = `/pub-stream?${params.toString()}`;
}

// Connection status
function updateConnectionStatus(status) {
    const icon = statusIndicator.querySelector('i');
    const text = statusIndicator.querySelector('span');
    
    statusIndicator.className = `status-indicator ${status}`;
    
    switch (status) {
        case 'connected':
            icon.className = 'fas fa-circle';
            text.textContent = 'Connected to Pub';
            break;
        case 'connecting':
            icon.className = 'fas fa-circle';
            text.textContent = 'Connecting...';
            break;
        case 'disconnected':
            icon.className = 'fas fa-circle';
            text.textContent = 'Disconnected';
            break;
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 2rem;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Global functions for onclick handlers
window.showCreateRoomModal = showCreateRoomModal;
window.hideCreateRoomModal = hideCreateRoomModal;
window.hideJoinRoomModal = hideJoinRoomModal;
window.selectRoom = selectRoom;
window.joinTable = joinTable;

// Auto-focus on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}); 