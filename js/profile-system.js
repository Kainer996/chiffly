/**
 * profile-system.js
 * Handles the user profile modal, fetching stats, and displaying progress.
 */
(function() {
    console.log('👤 Profile System initializing...');

    // State
    let currentUser = null;
    let profileModal = null;

    // Configuration
    const API_BASE = '/api';

    // Core System
    const ProfileSystem = {
        init: function() {
            // Create modal on init
            this.createModal();
            this.attachEventListeners();
            console.log('✅ Profile System ready!');
        },

        createModal: function() {
            if (document.getElementById('profileModal')) return;

            const modal = document.createElement('div');
            modal.id = 'profileModal';
            modal.className = 'profile-modal-overlay';
            modal.style.display = 'none'; // Hidden by default

            modal.innerHTML = `
                <div class="profile-modal-content">
                    <button class="profile-close-btn" onclick="ProfileSystem.closeProfile()">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="profile-header-section">
                        <div class="profile-avatar-large">
                            <i class="fas fa-user-astronaut"></i>
                        </div>
                        <div class="profile-identity">
                            <h2 id="profileUsername">Traveler</h2>
                            <div class="profile-badges" id="profileBadges">
                                <!-- Badges injected here -->
                            </div>
                        </div>
                        <div class="profile-level-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" class="level-bg"></circle>
                                <circle cx="50" cy="50" r="45" class="level-progress" id="levelProgressCircle"></circle>
                            </svg>
                            <div class="level-number">
                                <span class="label">LVL</span>
                                <span class="value" id="profileLevel">1</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-xp-section">
                        <div class="xp-bar-container">
                            <div class="xp-bar-fill" id="profileXpFill" style="width: 0%"></div>
                            <div class="xp-text">
                                <span id="profileCurrentXp">0</span> / <span id="profileNextXp">100</span> XP
                            </div>
                        </div>
                        <p class="xp-next-milestone" id="profileNextReward">Next Reward: Level 2</p>
                    </div>

                    <div class="profile-tabs">
                        <button class="profile-tab active" onclick="ProfileSystem.switchTab('stats')">Stats</button>
                        <button class="profile-tab" onclick="ProfileSystem.switchTab('achievements')">Achievements</button>
                        <button class="profile-tab" onclick="ProfileSystem.switchTab('inventory')">Inventory</button>
                    </div>

                    <div class="profile-body">
                        <!-- STATS TAB -->
                        <div id="tab-stats" class="profile-tab-content active">
                            <div class="stats-grid">
                                <div class="stat-box">
                                    <i class="fas fa-door-open"></i>
                                    <div class="stat-val" id="statRooms">0</div>
                                    <div class="stat-lbl">Rooms Joined</div>
                                </div>
                                <div class="stat-box">
                                    <i class="fas fa-comment-dots"></i>
                                    <div class="stat-val" id="statMessages">0</div>
                                    <div class="stat-lbl">Messages</div>
                                </div>
                                <div class="stat-box">
                                    <i class="fas fa-coins"></i>
                                    <div class="stat-val" id="statTips">0</div>
                                    <div class="stat-lbl">Tips Sent</div>
                                </div>
                                <div class="stat-box">
                                    <i class="fas fa-gamepad"></i>
                                    <div class="stat-val" id="statGames">0</div>
                                    <div class="stat-lbl">Games Played</div>
                                </div>
                                <div class="stat-box">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <div class="stat-val" id="statVisits">0</div>
                                    <div class="stat-lbl">Venues Visited</div>
                                </div>
                                <div class="stat-box">
                                    <i class="fas fa-clock"></i>
                                    <div class="stat-val" id="statOnline">Now</div>
                                    <div class="stat-lbl">Last Seen</div>
                                </div>
                            </div>
                        </div>

                        <!-- ACHIEVEMENTS TAB -->
                        <div id="tab-achievements" class="profile-tab-content">
                            <div class="achievements-grid" id="achievementsGrid">
                                <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
                            </div>
                        </div>

                        <!-- INVENTORY TAB -->
                        <div id="tab-inventory" class="profile-tab-content">
                            <div class="inventory-grid" id="inventoryGrid">
                                <div class="empty-state">Inventory is empty</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            profileModal = modal;

            // Close when clicking background
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeProfile();
            });
            
            // ESC key support
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeProfile();
                }
            });
        },

        attachEventListeners: function() {
            // Hook into navbar profile link
            setTimeout(() => {
                const navProfile = document.querySelector('a[href="profile.html"]');
                if (navProfile) {
                    navProfile.removeAttribute('href');
                    navProfile.style.cursor = 'pointer';
                    navProfile.onclick = (e) => {
                        e.preventDefault();
                        this.openProfile();
                    };
                }

                // Hook into HUD avatar
                const hudAvatar = document.getElementById('hudAvatar');
                if (hudAvatar) {
                    hudAvatar.style.cursor = 'pointer';
                    hudAvatar.onclick = () => this.openProfile();
                }
            }, 1000); // Wait for DOM
        },

        openProfile: async function(targetUsername = null) {
            if (!profileModal) this.createModal();
            
            // Get current user if no target
            if (!targetUsername) {
                try {
                    const userStr = localStorage.getItem('chifftown_user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        targetUsername = user.username || user.displayName;
                    }
                } catch (e) {
                    console.error('Error reading user from localStorage', e);
                }
            }

            if (!targetUsername) {
                // Flash the sign-in button if not logged in
                const signInBtn = document.getElementById('signInBtn');
                if (signInBtn) {
                    signInBtn.classList.add('flash-attention');
                    setTimeout(() => signInBtn.classList.remove('flash-attention'), 1000);
                }
                return;
            }

            // Show modal
            profileModal.style.display = 'flex';
            // Force reflow
            void profileModal.offsetWidth;
            profileModal.classList.add('active');
            
            // Fetch data
            try {
                const response = await fetch(`${API_BASE}/user/${targetUsername}`);
                if (!response.ok) throw new Error('User not found');
                
                const data = await response.json();
                this.populateProfile(data);
            } catch (error) {
                console.error('Failed to load profile:', error);
                document.getElementById('profileUsername').textContent = 'Error loading profile';
            }
        },

        closeProfile: function() {
            if (profileModal) {
                profileModal.classList.remove('active');
                setTimeout(() => {
                    profileModal.style.display = 'none';
                }, 300); // Wait for fade out
            }
        },

        switchTab: function(tabName) {
            // Update buttons
            document.querySelectorAll('.profile-tab').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase().includes(tabName)) {
                    btn.classList.add('active');
                }
            });

            // Update content
            document.querySelectorAll('.profile-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const target = document.getElementById(`tab-${tabName}`);
            if (target) target.classList.add('active');
        },

        populateProfile: function(data) {
            // 1. Identity
            document.getElementById('profileUsername').textContent = data.username;
            document.getElementById('profileLevel').textContent = data.level;
            
            // 2. Level Circle
            const circle = document.getElementById('levelProgressCircle');
            const circumference = 2 * Math.PI * 45; // r=45
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            
            const xpPercent = data.levelData.xpInLevel / data.levelData.xpForNextLevel;
            const offset = circumference - (xpPercent * circumference);
            circle.style.strokeDashoffset = offset;

            // 3. XP Bar
            document.getElementById('profileXpFill').style.width = `${xpPercent * 100}%`;
            document.getElementById('profileCurrentXp').textContent = data.levelData.xpInLevel;
            document.getElementById('profileNextXp').textContent = data.levelData.xpForNextLevel;
            document.getElementById('profileNextReward').textContent = `Next Reward: Level ${data.level + 1}`;
            
            // 4. Stats
            if (data.stats) {
                document.getElementById('statRooms').textContent = data.stats.roomsJoined || 0;
                document.getElementById('statMessages').textContent = data.stats.messagesSent || 0;
                document.getElementById('statTips').textContent = data.stats.tipsSent || 0;
                document.getElementById('statGames').textContent = data.stats.gamesPlayed || 0;
                document.getElementById('statVisits').textContent = (data.stats.venuesVisited || []).length;
                
                // Last seen
                const lastSeen = data.lastSeen ? new Date(data.lastSeen) : new Date();
                const now = new Date();
                const diffMins = Math.floor((now - lastSeen) / 60000);
                
                let timeText = 'Just now';
                if (diffMins > 1440) timeText = `${Math.floor(diffMins/1440)}d ago`;
                else if (diffMins > 60) timeText = `${Math.floor(diffMins/60)}h ago`;
                else if (diffMins > 0) timeText = `${diffMins}m ago`;
                
                document.getElementById('statOnline').textContent = timeText;
            }

            // 5. Achievements
            const achGrid = document.getElementById('achievementsGrid');
            if (data.achievements && data.achievements.length > 0) {
                achGrid.innerHTML = data.achievements.map(ach => `
                    <div class="achievement-card unlocked">
                        <div class="ach-icon">${ach.icon || '🏆'}</div>
                        <div class="ach-info">
                            <div class="ach-name">${ach.name}</div>
                            <div class="ach-desc">${ach.desc}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                achGrid.innerHTML = `<div class="empty-state">No achievements yet. Start exploring!</div>`;
            }

            // 6. Inventory
            const invGrid = document.getElementById('inventoryGrid');
            if (data.inventory && data.inventory.length > 0) {
                invGrid.innerHTML = data.inventory.map(item => `
                    <div class="inventory-item">
                        <div class="inv-icon">🎒</div>
                        <div class="inv-name">${item}</div>
                    </div>
                `).join('');
            } else {
                invGrid.innerHTML = `<div class="empty-state">Inventory is empty.</div>`;
            }

            // 7. Badges
            const badgesContainer = document.getElementById('profileBadges');
            let badgesHtml = '';
            
            if (data.level >= 25) badgesHtml += `<span class="badge badge-gold">Legend</span>`;
            else if (data.level >= 10) badgesHtml += `<span class="badge badge-silver">Veteran</span>`;
            else if (data.level >= 5) badgesHtml += `<span class="badge badge-bronze">Regular</span>`;
            else badgesHtml += `<span class="badge badge-new">Newcomer</span>`;
            
            badgesContainer.innerHTML = badgesHtml;
        }
    };

    // Expose globally
    window.ProfileSystem = ProfileSystem;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ProfileSystem.init());
    } else {
        ProfileSystem.init();
    }

})();
