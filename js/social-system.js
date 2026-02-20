// ============================================
// CHIFFTOWN SOCIAL SYSTEM (NEIGHBORS)
// ============================================
// Manages the Neighbors sidebar, friendship lists, and online status
// ============================================

(function() {
    'use strict';

    // State
    const state = {
        isOpen: false,
        activeTab: 'neighbors', // 'neighbors' | 'online'
        friendships: [],
        onlineUsers: [], // Map of username -> { roomId, roomName, isStreamer }
        currentUser: null
    };

    // DOM Elements
    let sidebar, toggleBtn, listContainer, tabNeighbors, tabOnline;

    // ========================================
    // INITIALIZATION
    // ========================================
    
    function init() {
        console.log('👥 Social System initializing...');
        
        // Get current user
        try {
            const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
            state.currentUser = user.username || user.displayName;
        } catch (e) {
            console.error('Error reading user data', e);
        }

        if (!state.currentUser) {
            console.log('No user logged in, Social System standby.');
            return;
        }

        createSidebar();
        createToggleButton();
        attachSocketListeners();
        
        // Initial Fetch
        fetchFriendships();
        fetchOnlineStatus();

        // Poll for updates every 30s
        setInterval(() => {
            if (state.isOpen) {
                fetchFriendships();
                fetchOnlineStatus();
            }
        }, 30000);
    }

    // ========================================
    // UI CREATION
    // ========================================

    function createToggleButton() {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'social-toggle-btn';
        toggleBtn.innerHTML = '<i class="fas fa-user-group"></i>';
        toggleBtn.title = "Neighbors & Friends";
        toggleBtn.onclick = toggleSidebar;
        document.body.appendChild(toggleBtn);
    }

    function createSidebar() {
        sidebar = document.createElement('div');
        sidebar.className = 'social-sidebar';
        sidebar.innerHTML = `
            <div class="social-header">
                <div class="social-title">
                    <i class="fas fa-heart"></i> Neighbors
                </div>
                <button class="social-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="social-tabs">
                <div class="social-tab active" data-tab="neighbors">My Circle</div>
                <div class="social-tab" data-tab="online">Online Now</div>
            </div>
            <div class="social-list">
                <div class="social-loading" style="text-align:center; padding:20px; color:#64748b;">
                    <i class="fas fa-spinner fa-spin"></i> Loading...
                </div>
            </div>
        `;

        document.body.appendChild(sidebar);

        // References
        listContainer = sidebar.querySelector('.social-list');
        tabNeighbors = sidebar.querySelector('[data-tab="neighbors"]');
        tabOnline = sidebar.querySelector('[data-tab="online"]');
        const closeBtn = sidebar.querySelector('.social-close');

        // Event Listeners
        closeBtn.onclick = closeSidebar;
        tabNeighbors.onclick = () => switchTab('neighbors');
        tabOnline.onclick = () => switchTab('online');
    }

    // ========================================
    // DATA FETCHING
    // ========================================

    async function fetchFriendships() {
        if (!state.currentUser) return;
        try {
            const res = await fetch(`/api/friendships/${state.currentUser}`);
            if (res.ok) {
                state.friendships = await res.json();
                renderList();
            }
        } catch (e) {
            console.error('Failed to fetch friendships', e);
        }
    }

    function fetchOnlineStatus() {
        if (typeof io !== 'undefined') {
            const socket = io(); // Reuse existing connection if possible, strictly mostly creates new. 
            // Better to grab the global socket if exposed, or just emit on a new one. 
            // Given main-home.js usage, we can emit on the global socket if we can find it, 
            // or just rely on 'room-list' event which broadcasts.
            // Let's emit a request.
            socket.emit('get-room-list');
        }
    }

    function attachSocketListeners() {
        if (typeof io === 'undefined') return;
        const socket = io();

        socket.on('room-list', (data) => {
            // data.users is array of { id, username, roomName... }
            state.onlineUsers = data.users || [];
            if (state.isOpen) renderList();
        });

        socket.on('friendship-level-up', (data) => {
            // { friend, level, points }
            // Show notification?
            if (window.showNotification) {
                window.showNotification(`💖 Friendship Up! You and ${data.friend} are now ${data.level}s!`, 'success');
            }
            fetchFriendships(); // Refresh list
        });
    }

    // ========================================
    // RENDERING
    // ========================================

    function renderList() {
        if (!listContainer) return;
        listContainer.innerHTML = '';

        let items = [];

        if (state.activeTab === 'neighbors') {
            // Sort: Online first, then by points
            items = state.friendships.map(f => {
                const onlineUser = state.onlineUsers.find(u => u.username === f.friend);
                return {
                    username: f.friend,
                    level: f.level,
                    points: f.points,
                    isOnline: !!onlineUser,
                    roomName: onlineUser ? onlineUser.roomName : null,
                    isStreamer: onlineUser ? onlineUser.isStreaming : false
                };
            }).sort((a, b) => {
                if (a.isOnline !== b.isOnline) return b.isOnline - a.isOnline; // Online first
                return b.points - a.points; // Then points
            });
        } else {
            // Online Tab: Everyone online excluding self
            items = state.onlineUsers
                .filter(u => u.username !== state.currentUser)
                .map(u => {
                    // Find friendship if exists
                    const friendData = state.friendships.find(f => f.friend === u.username);
                    return {
                        username: u.username,
                        level: friendData ? friendData.level : 'Stranger',
                        points: friendData ? friendData.points : 0,
                        isOnline: true,
                        roomName: u.roomName,
                        isStreamer: u.isStreaming
                    };
                });
        }

        if (items.length === 0) {
            listContainer.innerHTML = `
                <div class="social-empty">
                    <i class="fas fa-user-slash"></i>
                    <p>${state.activeTab === 'neighbors' ? "You haven't met anyone yet. Go explore!" : "No one else is online right now."}</p>
                </div>
            `;
            return;
        }

        items.forEach(user => {
            const card = document.createElement('div');
            card.className = `friend-card ${user.isOnline ? 'online' : ''}`;
            
            // Avatar Initials
            const initial = user.username.charAt(0).toUpperCase();
            
            // Level Class for color bars
            const levelClass = getLevelClass(user.level);
            
            // Progress calculation (simplified)
            const maxPoints = 100; // Cap for bar
            const percent = Math.min(100, (user.points / maxPoints) * 100);

            card.innerHTML = `
                <div class="friend-avatar">${initial}</div>
                <div class="friend-info">
                    <div class="friend-name-row">
                        <span class="friend-name">${user.username}</span>
                        <span class="friend-level">${user.level}</span>
                    </div>
                    <div class="friend-status">
                        ${user.isOnline ? 
                            `<span style="color:#4ade80">●</span> ${user.roomName || 'Exploring'}` : 
                            'Offline'}
                    </div>
                    <div class="relationship-container ${levelClass}">
                        <div class="relationship-progress">
                            <div class="relationship-fill" style="width: ${percent}%"></div>
                        </div>
                    </div>
                    ${user.isOnline && user.roomName ? `
                    <div class="friend-actions">
                        <button class="friend-btn join" onclick="window.location.href='/?join=${encodeURIComponent(user.roomName)}'">
                            <i class="fas fa-sign-in-alt"></i> Join Room
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    function getLevelClass(level) {
        switch(level) {
            case 'Best Friend': return 'level-best';
            case 'Close Friend': return 'level-close';
            case 'Friend': return 'level-friend';
            case 'Acquaintance': return 'level-acquaintance';
            default: return 'level-stranger';
        }
    }

    // ========================================
    // INTERACTION
    // ========================================

    function toggleSidebar() {
        state.isOpen = !state.isOpen;
        if (state.isOpen) {
            sidebar.classList.add('active');
            fetchFriendships();
            fetchOnlineStatus();
        } else {
            sidebar.classList.remove('active');
        }
    }

    function closeSidebar() {
        state.isOpen = false;
        sidebar.classList.remove('active');
    }

    function switchTab(tab) {
        state.activeTab = tab;
        
        // UI Update
        if (tab === 'neighbors') {
            tabNeighbors.classList.add('active');
            tabOnline.classList.remove('active');
        } else {
            tabNeighbors.classList.remove('active');
            tabOnline.classList.add('active');
        }
        
        renderList();
    }

    // Expose API
    window.SocialSystem = {
        init,
        toggle: toggleSidebar
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
