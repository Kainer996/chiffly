/**
 * ============================================
 * CHIFFTOWN ACTIVITY FEED SYSTEM
 * ============================================
 * Real-time feed showing what's happening across town
 * Displays room joins, achievements, tips, game wins, etc.
 * 
 * Features:
 * - Floating feed panel (toggle visibility)
 * - Real-time updates via Socket.io
 * - Activity categories with icons
 * - Auto-scroll with pause on hover
 * - Activity history (last 50 items)
 * - Click to navigate to relevant rooms
 * 
 * Version: 1.0.0
 * ============================================
 */

(function() {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const CONFIG = {
        maxActivities: 50,          // Max activities to keep in memory
        displayCount: 15,           // Activities shown at once
        fadeOutTime: 30000,         // Time before activity fades (ms)
        pollInterval: 5000,         // Fallback poll interval (ms)
        autoHideDelay: 300000       // Auto-hide after 5 min of no interaction
    };

    // Activity type configurations
    const ACTIVITY_TYPES = {
        'room_join': {
            icon: '🚪',
            color: '#4fc3f7',
            template: '{user} entered {room}'
        },
        'room_leave': {
            icon: '👋',
            color: '#94a3b8',
            template: '{user} left {room}'
        },
        'tip_sent': {
            icon: '💰',
            color: '#ffc107',
            template: '{user} tipped {target} in {room}'
        },
        'achievement': {
            icon: '🏆',
            color: '#f59e0b',
            template: '{user} unlocked "{achievement}"'
        },
        'level_up': {
            icon: '⬆️',
            color: '#22c55e',
            template: '{user} reached Level {level}!'
        },
        'game_win': {
            icon: '🎮',
            color: '#8b5cf6',
            template: '{user} won at {game}'
        },
        'challenge_complete': {
            icon: '✅',
            color: '#14b8a6',
            template: '{user} completed a daily challenge'
        },
        'generation_unlock': {
            icon: '🔓',
            color: '#f97316',
            template: '{user} unlocked Generation {gen}!'
        },
        'friendship': {
            icon: '💕',
            color: '#ec4899',
            template: '{user} and {target} became {level}'
        },
        'stream_start': {
            icon: '🎬',
            color: '#ef4444',
            template: '{user} started streaming in {room}'
        },
        'high_score': {
            icon: '🥇',
            color: '#eab308',
            template: '{user} set a new high score in {game}!'
        },
        'emote': {
            icon: '😊',
            color: '#06b6d4',
            template: '{user} reacted with {emote} in {room}',
            subtle: true  // Less prominent
        },
        'new_user': {
            icon: '🌟',
            color: '#a855f7',
            template: '{user} joined Chifftown!'
        },
        'casino_jackpot': {
            icon: '🎰',
            color: '#fbbf24',
            template: '{user} hit the jackpot! +{amount} coins'
        }
    };

    // Room name mappings
    const ROOM_NAMES = {
        'pub': 'The Chiff Inn',
        'nightclub': 'Neon Pulse',
        'cinema': 'Starlight Cinema',
        'games': 'Pixel Palace',
        'arcade': 'Pixel Palace',
        'lounge': 'Velvet Sky',
        'casino': 'The Golden Dice',
        'questing': 'Adventure Guild',
        'adventure': 'Adventure Guild',
        'wellness': 'Wellness Centre',
        'newspaper': 'Good News 24',
        'serotonin': 'Serotonin Boost',
        'apartment': 'Your Apartment'
    };

    // ==========================================
    // STATE
    // ==========================================

    let activities = [];
    let isVisible = false;
    let isPaused = false;
    let socket = null;
    let feedElement = null;
    let autoHideTimer = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        console.log('📰 Activity Feed System initializing...');
        
        // Create UI elements
        createFeedButton();
        createFeedPanel();
        
        // Setup socket listener
        setupSocketListener();
        
        // Load recent activities from server
        loadRecentActivities();
        
        console.log('✅ Activity Feed System ready!');
    }

    // ==========================================
    // UI CREATION
    // ==========================================

    function createFeedButton() {
        if (document.getElementById('activity-feed-btn')) return;

        const button = document.createElement('button');
        button.id = 'activity-feed-btn';
        button.className = 'activity-feed-btn';
        button.innerHTML = `
            <span class="feed-btn-icon">📰</span>
            <span class="feed-btn-label">Feed</span>
            <span class="feed-btn-badge" id="feed-badge" style="display: none;">0</span>
        `;
        button.title = 'Activity Feed';
        button.addEventListener('click', toggleFeed);
        
        document.body.appendChild(button);
    }

    function createFeedPanel() {
        if (document.getElementById('activity-feed-panel')) return;

        const panelHTML = `
            <div id="activity-feed-panel" class="activity-feed-panel">
                <div class="feed-header">
                    <div class="feed-title">
                        <span class="feed-title-icon">📰</span>
                        <span>Town Activity</span>
                    </div>
                    <div class="feed-controls">
                        <button class="feed-filter-btn active" data-filter="all" title="All">
                            <i class="fas fa-globe"></i>
                        </button>
                        <button class="feed-filter-btn" data-filter="social" title="Social">
                            <i class="fas fa-users"></i>
                        </button>
                        <button class="feed-filter-btn" data-filter="games" title="Games">
                            <i class="fas fa-gamepad"></i>
                        </button>
                        <button class="feed-close-btn" id="feed-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="feed-content" id="feed-content">
                    <div class="feed-empty">
                        <span class="feed-empty-icon">🌙</span>
                        <p>No recent activity</p>
                        <p class="feed-empty-hint">The town is quiet... for now</p>
                    </div>
                </div>
                <div class="feed-footer">
                    <span class="feed-live-indicator">
                        <span class="live-dot"></span>
                        Live
                    </span>
                    <span class="feed-count" id="feed-count">0 activities</span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
        
        feedElement = document.getElementById('activity-feed-panel');
        
        // Event listeners
        document.getElementById('feed-close-btn').addEventListener('click', closeFeed);
        
        // Filter buttons
        document.querySelectorAll('.feed-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                applyFilter(filter);
                
                // Update active state
                document.querySelectorAll('.feed-filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Pause on hover
        const content = document.getElementById('feed-content');
        content.addEventListener('mouseenter', () => { isPaused = true; });
        content.addEventListener('mouseleave', () => { isPaused = false; });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('activity-feed-panel');
            const btn = document.getElementById('activity-feed-btn');
            
            if (isVisible && 
                !panel.contains(e.target) && 
                !btn.contains(e.target)) {
                closeFeed();
            }
        });
    }

    // ==========================================
    // FEED CONTROLS
    // ==========================================

    function toggleFeed() {
        if (isVisible) {
            closeFeed();
        } else {
            openFeed();
        }
    }

    function openFeed() {
        const panel = document.getElementById('activity-feed-panel');
        const btn = document.getElementById('activity-feed-btn');
        const badge = document.getElementById('feed-badge');
        
        panel.classList.add('active');
        btn.classList.add('active');
        badge.style.display = 'none';
        badge.textContent = '0';
        
        isVisible = true;
        resetAutoHide();
        
        // Render activities
        renderActivities();
    }

    function closeFeed() {
        const panel = document.getElementById('activity-feed-panel');
        const btn = document.getElementById('activity-feed-btn');
        
        panel.classList.remove('active');
        btn.classList.remove('active');
        
        isVisible = false;
        clearTimeout(autoHideTimer);
    }

    function resetAutoHide() {
        clearTimeout(autoHideTimer);
        autoHideTimer = setTimeout(() => {
            if (isVisible) closeFeed();
        }, CONFIG.autoHideDelay);
    }

    // ==========================================
    // ACTIVITY MANAGEMENT
    // ==========================================

    function addActivity(activity) {
        // Validate activity
        if (!activity || !activity.type) return;
        
        // Add timestamp if missing
        if (!activity.timestamp) {
            activity.timestamp = Date.now();
        }
        
        // Add unique ID
        activity.id = activity.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Check for duplicate (same user, type, and data within 5 seconds)
        const isDuplicate = activities.some(a => 
            a.type === activity.type && 
            a.data?.user === activity.data?.user &&
            Math.abs(a.timestamp - activity.timestamp) < 5000
        );
        
        if (isDuplicate) return;
        
        // Add to front of array
        activities.unshift(activity);
        
        // Trim to max
        if (activities.length > CONFIG.maxActivities) {
            activities = activities.slice(0, CONFIG.maxActivities);
        }
        
        // Update UI
        if (isVisible) {
            renderActivities();
        } else {
            // Show badge count
            incrementBadge();
        }
        
        // Log for debugging
        console.log('📰 New activity:', activity.type, activity.data);
    }

    function incrementBadge() {
        const badge = document.getElementById('feed-badge');
        if (!badge) return;
        
        const current = parseInt(badge.textContent) || 0;
        badge.textContent = Math.min(current + 1, 99);
        badge.style.display = 'flex';
    }

    // ==========================================
    // RENDERING
    // ==========================================

    function renderActivities(filter = 'all') {
        const content = document.getElementById('feed-content');
        const count = document.getElementById('feed-count');
        
        if (!content) return;
        
        // Filter activities
        let filtered = activities;
        if (filter === 'social') {
            filtered = activities.filter(a => 
                ['room_join', 'tip_sent', 'friendship', 'emote', 'new_user'].includes(a.type)
            );
        } else if (filter === 'games') {
            filtered = activities.filter(a => 
                ['game_win', 'high_score', 'casino_jackpot', 'achievement'].includes(a.type)
            );
        }
        
        // Show empty state if no activities
        if (filtered.length === 0) {
            content.innerHTML = `
                <div class="feed-empty">
                    <span class="feed-empty-icon">🌙</span>
                    <p>No recent activity</p>
                    <p class="feed-empty-hint">The town is quiet... for now</p>
                </div>
            `;
            count.textContent = '0 activities';
            return;
        }
        
        // Render activities
        const activitiesHTML = filtered.slice(0, CONFIG.displayCount).map(activity => {
            return renderActivity(activity);
        }).join('');
        
        content.innerHTML = activitiesHTML;
        count.textContent = `${filtered.length} activit${filtered.length === 1 ? 'y' : 'ies'}`;
        
        // Add click handlers for room navigation
        content.querySelectorAll('.activity-item[data-room]').forEach(item => {
            item.addEventListener('click', () => {
                const room = item.dataset.room;
                if (room) {
                    navigateToRoom(room);
                }
            });
        });
    }

    function renderActivity(activity) {
        const typeConfig = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES['room_join'];
        const data = activity.data || {};
        
        // Build message from template
        let message = typeConfig.template;
        
        // Replace placeholders
        if (data.user) message = message.replace('{user}', `<strong>${escapeHtml(data.user)}</strong>`);
        if (data.target) message = message.replace('{target}', `<strong>${escapeHtml(data.target)}</strong>`);
        if (data.room) message = message.replace('{room}', `<em>${getRoomName(data.room)}</em>`);
        if (data.achievement) message = message.replace('{achievement}', escapeHtml(data.achievement));
        if (data.level) message = message.replace('{level}', data.level);
        if (data.gen) message = message.replace('{gen}', data.gen);
        if (data.game) message = message.replace('{game}', escapeHtml(data.game));
        if (data.emote) message = message.replace('{emote}', data.emote);
        if (data.amount) message = message.replace('{amount}', data.amount);
        
        // Calculate time ago
        const timeAgo = formatTimeAgo(activity.timestamp);
        
        // Is this activity subtle (less prominent)?
        const subtleClass = typeConfig.subtle ? 'subtle' : '';
        
        // Clickable if has room data
        const clickable = data.room ? 'clickable' : '';
        const roomData = data.room ? `data-room="${data.room}"` : '';
        
        return `
            <div class="activity-item ${subtleClass} ${clickable}" ${roomData}>
                <div class="activity-icon" style="background: ${typeConfig.color}20; color: ${typeConfig.color};">
                    ${typeConfig.icon}
                </div>
                <div class="activity-content">
                    <p class="activity-message">${message}</p>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    function applyFilter(filter) {
        renderActivities(filter);
    }

    // ==========================================
    // SOCKET INTEGRATION
    // ==========================================

    function setupSocketListener() {
        // Wait for socket to be available
        const checkSocket = setInterval(() => {
            if (window.socket && window.socket.connected) {
                clearInterval(checkSocket);
                socket = window.socket;
                
                // Listen for activity events
                socket.on('activity', (activity) => {
                    addActivity(activity);
                });
                
                // Listen for specific events and convert to activities
                socket.on('user-joined', (data) => {
                    // Only add if we're not the one joining
                    const currentUser = getCurrentUser();
                    if (data.username && data.username !== currentUser?.username) {
                        addActivity({
                            type: 'room_join',
                            data: {
                                user: data.username,
                                room: getCurrentRoomType()
                            }
                        });
                    }
                });
                
                socket.on('tip-received', (data) => {
                    addActivity({
                        type: 'tip_sent',
                        data: {
                            user: data.fromUsername,
                            target: data.toUsername,
                            room: getCurrentRoomType()
                        }
                    });
                });
                
                socket.on('achievement-unlocked', (data) => {
                    addActivity({
                        type: 'achievement',
                        data: {
                            user: data.username,
                            achievement: data.achievement
                        }
                    });
                });
                
                socket.on('level-up', (data) => {
                    addActivity({
                        type: 'level_up',
                        data: {
                            user: data.username,
                            level: data.level
                        }
                    });
                });
                
                console.log('🔌 Activity Feed socket listener attached');
            }
        }, 1000);
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkSocket), 30000);
    }

    // ==========================================
    // API INTEGRATION
    // ==========================================

    async function loadRecentActivities() {
        try {
            const response = await fetch('/api/activities/recent');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data.activities)) {
                    // Add activities in reverse order (oldest first)
                    data.activities.reverse().forEach(activity => {
                        addActivity(activity);
                    });
                }
            }
        } catch (error) {
            console.log('📰 Could not load recent activities (endpoint may not exist)');
        }
    }

    // ==========================================
    // UTILITIES
    // ==========================================

    function getCurrentUser() {
        try {
            const userData = localStorage.getItem('chifftown_user');
            if (userData) {
                return JSON.parse(userData);
            }
        } catch (e) {}
        return null;
    }

    function getCurrentRoomType() {
        const path = window.location.pathname.toLowerCase();
        
        if (path.includes('pub')) return 'pub';
        if (path.includes('nightclub')) return 'nightclub';
        if (path.includes('cinema')) return 'cinema';
        if (path.includes('games') || path.includes('arcade')) return 'arcade';
        if (path.includes('lounge')) return 'lounge';
        if (path.includes('casino')) return 'casino';
        if (path.includes('questing') || path.includes('adventure')) return 'questing';
        if (path.includes('wellness')) return 'wellness';
        if (path.includes('newspaper')) return 'newspaper';
        if (path.includes('apartment')) return 'apartment';
        
        return 'town';
    }

    function getRoomName(roomType) {
        return ROOM_NAMES[roomType] || roomType;
    }

    function navigateToRoom(roomType) {
        const roomUrls = {
            'pub': '/pub.html',
            'nightclub': '/nightclub.html',
            'cinema': '/cinema.html',
            'games': '/games.html',
            'arcade': '/games.html',
            'lounge': '/lounge.html',
            'casino': '/casino.html',
            'questing': '/questing.html',
            'adventure': '/questing.html',
            'wellness': '/wellness.html',
            'newspaper': '/newspaper.html'
        };
        
        const url = roomUrls[roomType];
        if (url) {
            window.location.href = url;
        }
    }

    function formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    window.ActivityFeed = {
        init,
        addActivity,
        openFeed,
        closeFeed,
        toggleFeed,
        getActivities: () => [...activities]
    };

    // ==========================================
    // AUTO-INITIALIZE
    // ==========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
