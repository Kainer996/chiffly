// ============================================
// XP Engine — Active Experience & Achievement System
// Awards XP for player actions, tracks achievements, level progression
// ============================================

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const XP_CONFIG = {
        // XP Awards
        VISIT_VENUE: 25,              // First visit to a venue each session
        REVISIT_VENUE: 5,             // Revisiting same venue
        TIME_ACTIVE_5MIN: 10,         // Every 5 minutes of activity
        TIME_ACTIVE_15MIN: 30,        // Every 15 minutes of activity
        ENTER_FULLSCREEN: 15,         // Exploring map in fullscreen
        CHANGE_WEATHER: 5,            // Experimenting with weather controls
        INVITE_FRIEND: 50,            // Generating an invite link
        REGISTER_ACCOUNT: 100,        // Creating registered account
        SIGN_IN: 10,                  // Signing in (once per session)
        EXPLORE_MAP: 20,              // Clicking multiple buildings
        NIGHT_OWL: 25,                // Active between 11pm-5am
        EARLY_BIRD: 25,               // Active between 5am-7am
        DAILY_RETURN: 50,             // Visiting on consecutive days
        ACHIEVEMENT_UNLOCK: 100,      // Bonus for unlocking achievement
        GENERATION_UNLOCK: 200,       // Unlocking a new generation
        
        // Level progression
        BASE_XP_PER_LEVEL: 200,       // XP needed for level 2
        LEVEL_MULTIPLIER: 1.15,       // Each level requires 15% more XP
        MAX_LEVEL: 100,               // Level cap
    };

    // ========== ACHIEVEMENTS ==========
    const ACHIEVEMENTS = [
        // Exploration
        { id: 'first_visit', name: 'First Steps', desc: 'Visit your first venue', icon: '👣', xp: 25, condition: (stats) => stats.venuesVisited >= 1 },
        { id: 'explorer', name: 'Town Explorer', desc: 'Visit all 6 main venues', icon: '🗺️', xp: 100, condition: (stats) => stats.venuesVisited >= 6 },
        { id: 'local', name: 'Local Regular', desc: 'Visit 10 different venues', icon: '🏘️', xp: 200, condition: (stats) => stats.totalVenueVisits >= 10 },
        
        // Time-based
        { id: 'night_owl', name: 'Night Owl', desc: 'Active during night hours', icon: '🦉', xp: 50, condition: (stats) => stats.nightOwlVisits >= 1 },
        { id: 'early_bird', name: 'Early Bird', desc: 'Active during early morning', icon: '🌅', xp: 50, condition: (stats) => stats.earlyBirdVisits >= 1 },
        { id: 'dedicated', name: 'Dedicated Visitor', desc: 'Active for 30 minutes', icon: '⏱️', xp: 75, condition: (stats) => stats.totalActiveMinutes >= 30 },
        { id: 'marathoner', name: 'Town Marathoner', desc: 'Active for 2 hours', icon: '🏃', xp: 250, condition: (stats) => stats.totalActiveMinutes >= 120 },
        
        // Engagement
        { id: 'weatherman', name: 'Weather Wizard', desc: 'Try all 4 weather types', icon: '🌤️', xp: 50, condition: (stats) => stats.weatherChanges >= 4 },
        { id: 'fullscreen_fan', name: 'Immersion Master', desc: 'Use fullscreen mode 5 times', icon: '🖥️', xp: 40, condition: (stats) => stats.fullscreenEnters >= 5 },
        { id: 'inviter', name: 'Friend Recruiter', desc: 'Generate an invite link', icon: '📧', xp: 60, condition: (stats) => stats.invitesGenerated >= 1 },
        { id: 'daily_visitor', name: 'Daily Regular', desc: 'Visit on 3 consecutive days', icon: '📅', xp: 150, condition: (stats) => stats.consecutiveDays >= 3 },
        
        // Progression
        { id: 'level_5', name: 'Rising Star', desc: 'Reach Level 5', icon: '⭐', xp: 0, condition: (stats) => stats.level >= 5 },
        { id: 'level_10', name: 'Veteran', desc: 'Reach Level 10', icon: '🌟', xp: 0, condition: (stats) => stats.level >= 10 },
        { id: 'level_25', name: 'Town Legend', desc: 'Reach Level 25', icon: '👑', xp: 0, condition: (stats) => stats.level >= 25 },
        
        // Hidden achievements
        { id: 'inspector', name: 'Inspector Gadget', desc: 'Open browser dev tools', icon: '🔍', xp: 10, condition: (stats) => stats.devToolsOpened >= 1, hidden: true },
    ];

    // ========== STATE ==========
    let playerStats = {
        xp: 0,
        level: 1,
        coins: 0,
        gems: 0,
        achievements: [],
        venuesVisited: 0,
        totalVenueVisits: 0,
        nightOwlVisits: 0,
        earlyBirdVisits: 0,
        totalActiveMinutes: 0,
        weatherChanges: 0,
        fullscreenEnters: 0,
        invitesGenerated: 0,
        consecutiveDays: 0,
        lastVisitDate: null,
        sessionStartTime: Date.now(),
        visitedVenues: [],
        devToolsOpened: 0,
    };

    let activityInterval = null;
    let visitedThisSession = new Set();

    // ========== CORE FUNCTIONS ==========

    function init() {
        loadPlayerData();
        trackDailyVisit();
        startActivityTimer();
        setupEventListeners();
        updateHUD();
        checkTimeBasedAchievements();
        console.log('🎮 XP Engine initialized', playerStats);
    }

    function loadPlayerData() {
        try {
            const saved = localStorage.getItem('chifftown_xp_data');
            if (saved) {
                const data = JSON.parse(saved);
                playerStats = { ...playerStats, ...data };
                playerStats.sessionStartTime = Date.now();
            }
        } catch (e) {
            console.error('Error loading XP data:', e);
        }
    }

    function savePlayerData() {
        try {
            localStorage.setItem('chifftown_xp_data', JSON.stringify(playerStats));
        } catch (e) {
            console.error('Error saving XP data:', e);
        }
    }

    function awardXP(amount, reason = '', showNotification = true) {
        if (amount <= 0) return;

        const oldLevel = playerStats.level;
        playerStats.xp += amount;
        
        // Calculate new level
        playerStats.level = calculateLevel(playerStats.xp);
        
        // Save immediately
        savePlayerData();
        updateHUD();

        // Show notification
        if (showNotification) {
            showXPNotification(amount, reason);
        }

        // Check for level up
        if (playerStats.level > oldLevel) {
            handleLevelUp(oldLevel, playerStats.level);
        }

        // Check achievements
        checkAchievements();
    }

    function calculateLevel(xp) {
        let level = 1;
        let xpRequired = 0;
        
        while (level < XP_CONFIG.MAX_LEVEL) {
            const nextLevelXP = Math.floor(XP_CONFIG.BASE_XP_PER_LEVEL * Math.pow(XP_CONFIG.LEVEL_MULTIPLIER, level - 1));
            if (xp < xpRequired + nextLevelXP) break;
            xpRequired += nextLevelXP;
            level++;
        }
        
        return level;
    }

    function getXPForNextLevel(currentLevel) {
        return Math.floor(XP_CONFIG.BASE_XP_PER_LEVEL * Math.pow(XP_CONFIG.LEVEL_MULTIPLIER, currentLevel - 1));
    }

    function getCurrentLevelProgress() {
        let xpForCurrentLevel = 0;
        for (let i = 1; i < playerStats.level; i++) {
            xpForCurrentLevel += getXPForNextLevel(i);
        }
        
        const xpInCurrentLevel = playerStats.xp - xpForCurrentLevel;
        const xpNeededForNext = getXPForNextLevel(playerStats.level);
        const progress = (xpInCurrentLevel / xpNeededForNext) * 100;
        
        return {
            current: xpInCurrentLevel,
            needed: xpNeededForNext,
            progress: Math.min(progress, 100)
        };
    }

    function handleLevelUp(oldLevel, newLevel) {
        // Award bonus coins and gems
        const coinReward = newLevel * 50;
        const gemReward = Math.floor(newLevel / 5);
        
        playerStats.coins += coinReward;
        playerStats.gems += gemReward;
        
        savePlayerData();
        updateHUD();
        
        // Show epic level-up celebration
        showLevelUpNotification(oldLevel, newLevel, coinReward, gemReward);
        triggerConfetti();
        
        console.log(`🎉 LEVEL UP! ${oldLevel} → ${newLevel}`);
    }

    function checkAchievements() {
        ACHIEVEMENTS.forEach(achievement => {
            // Skip if already unlocked
            if (playerStats.achievements.includes(achievement.id)) return;
            
            // Check condition
            if (achievement.condition(playerStats)) {
                unlockAchievement(achievement);
            }
        });
    }

    function unlockAchievement(achievement) {
        playerStats.achievements.push(achievement.id);
        
        // Award bonus XP if specified
        if (achievement.xp > 0) {
            playerStats.xp += achievement.xp;
            playerStats.xp += XP_CONFIG.ACHIEVEMENT_UNLOCK; // Bonus for unlocking
        }
        
        savePlayerData();
        updateHUD();
        
        showAchievementNotification(achievement);
        console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
    }

    // ========== ACTIVITY TRACKING ==========

    function trackDailyVisit() {
        const today = new Date().toDateString();
        const lastVisit = playerStats.lastVisitDate;
        
        if (lastVisit !== today) {
            // Check if consecutive day
            if (lastVisit) {
                const lastDate = new Date(lastVisit);
                const todayDate = new Date(today);
                const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 1) {
                    playerStats.consecutiveDays += 1;
                    awardXP(XP_CONFIG.DAILY_RETURN, 'Daily Return', true);
                } else {
                    playerStats.consecutiveDays = 1;
                }
            } else {
                playerStats.consecutiveDays = 1;
            }
            
            playerStats.lastVisitDate = today;
            savePlayerData();
        }
    }

    function checkTimeBasedAchievements() {
        const hour = new Date().getHours();
        
        // Night Owl (11pm - 5am)
        if (hour >= 23 || hour < 5) {
            if (playerStats.nightOwlVisits === 0) {
                awardXP(XP_CONFIG.NIGHT_OWL, 'Night Owl', true);
            }
            playerStats.nightOwlVisits += 1;
        }
        
        // Early Bird (5am - 7am)
        if (hour >= 5 && hour < 7) {
            if (playerStats.earlyBirdVisits === 0) {
                awardXP(XP_CONFIG.EARLY_BIRD, 'Early Bird', true);
            }
            playerStats.earlyBirdVisits += 1;
        }
        
        savePlayerData();
        checkAchievements();
    }

    function startActivityTimer() {
        // Award XP every 5 minutes of activity
        activityInterval = setInterval(() => {
            playerStats.totalActiveMinutes += 5;
            awardXP(XP_CONFIG.TIME_ACTIVE_5MIN, 'Active Time', false);
            
            // Bigger bonus every 15 minutes
            if (playerStats.totalActiveMinutes % 15 === 0) {
                awardXP(XP_CONFIG.TIME_ACTIVE_15MIN - XP_CONFIG.TIME_ACTIVE_5MIN, '15 Min Milestone', true);
            }
            
            checkAchievements();
        }, 5 * 60 * 1000); // 5 minutes
    }

    // ========== EVENT LISTENERS ==========

    function setupEventListeners() {
        // Track venue visits
        document.querySelectorAll('.map-hotspot, .venue-item').forEach(link => {
            link.addEventListener('click', function(e) {
                const venueName = this.dataset.venue || this.querySelector('.venue-name')?.textContent || 'Unknown';
                trackVenueVisit(venueName);
            });
        });

        // Track fullscreen enters
        const fullscreenBtn = document.querySelector('.fullscreen-btn, [onclick*="toggleMapFullscreen"]');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    playerStats.fullscreenEnters += 1;
                    awardXP(XP_CONFIG.ENTER_FULLSCREEN, 'Fullscreen Mode', true);
                    savePlayerData();
                    checkAchievements();
                }
            });
        }

        // Track weather changes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.weather-btn') || e.target.closest('[class*="time-btn"]')) {
                playerStats.weatherChanges += 1;
                awardXP(XP_CONFIG.CHANGE_WEATHER, 'Weather Control', false);
                savePlayerData();
                checkAchievements();
            }
        });

        // Track invite generation
        const copyInviteBtn = document.querySelector('[onclick*="copyInviteLink"]');
        if (copyInviteBtn) {
            copyInviteBtn.addEventListener('click', () => {
                if (playerStats.invitesGenerated === 0) {
                    awardXP(XP_CONFIG.INVITE_FRIEND, 'Friend Invite', true);
                }
                playerStats.invitesGenerated += 1;
                savePlayerData();
                checkAchievements();
            });
        }

        // Track registration
        document.addEventListener('click', (e) => {
            if (e.target.closest('#signUpForm [type="submit"]')) {
                setTimeout(() => {
                    if (localStorage.getItem('chiffly_user_type') === 'registered') {
                        awardXP(XP_CONFIG.REGISTER_ACCOUNT, 'Account Registered', true);
                    }
                }, 500);
            }
        });

        // Track dev tools opening (hidden achievement)
        const detectDevTools = () => {
            if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
                if (playerStats.devToolsOpened === 0) {
                    playerStats.devToolsOpened = 1;
                    savePlayerData();
                    checkAchievements();
                }
            }
        };
        window.addEventListener('resize', detectDevTools);
        setInterval(detectDevTools, 1000);

        // Save progress before leaving
        window.addEventListener('beforeunload', savePlayerData);
    }

    function trackVenueVisit(venueName) {
        if (!visitedThisSession.has(venueName)) {
            visitedThisSession.add(venueName);
            
            // First visit to this venue
            if (!playerStats.visitedVenues.includes(venueName)) {
                playerStats.visitedVenues.push(venueName);
                playerStats.venuesVisited += 1;
                awardXP(XP_CONFIG.VISIT_VENUE, `Discovered ${venueName}`, true);
            } else {
                // Revisit
                awardXP(XP_CONFIG.REVISIT_VENUE, `Visited ${venueName}`, false);
            }
            
            playerStats.totalVenueVisits += 1;
            savePlayerData();
            checkAchievements();
        }
    }

    // ========== HUD UPDATES ==========

    function updateHUD() {
        // Update level
        const levelEl = document.getElementById('hudLevel');
        if (levelEl) levelEl.textContent = `Lvl ${playerStats.level}`;

        // Update XP bar
        const progress = getCurrentLevelProgress();
        const xpFillEl = document.getElementById('hudXpFill');
        if (xpFillEl) xpFillEl.style.width = `${progress.progress}%`;

        // Update XP text
        const xpEl = document.getElementById('hudXp');
        const xpMaxEl = document.getElementById('hudXpMax');
        if (xpEl) xpEl.textContent = Math.floor(progress.current);
        if (xpMaxEl) xpMaxEl.textContent = progress.needed;

        // Update coins
        const coinsEl = document.getElementById('hudCoins');
        if (coinsEl) coinsEl.textContent = playerStats.coins;

        // Update gems
        const gemsEl = document.getElementById('hudGems');
        if (gemsEl) gemsEl.textContent = playerStats.gems;
    }

    // ========== NOTIFICATIONS ==========

    function showXPNotification(amount, reason) {
        const notification = createNotificationElement({
            type: 'xp',
            icon: '✨',
            title: `+${amount} XP`,
            message: reason,
            color: '#40E0D0'
        });
        
        displayNotification(notification);
    }

    function showLevelUpNotification(oldLevel, newLevel, coins, gems) {
        const notification = createNotificationElement({
            type: 'levelup',
            icon: '🎉',
            title: `Level ${newLevel}!`,
            message: `+${coins} 🪙  +${gems} 💎`,
            color: '#c9a84c',
            duration: 5000
        });
        
        displayNotification(notification);
    }

    function showAchievementNotification(achievement) {
        const notification = createNotificationElement({
            type: 'achievement',
            icon: achievement.icon,
            title: 'Achievement Unlocked!',
            message: `${achievement.name} - ${achievement.desc}`,
            color: '#f4c542',
            duration: 6000
        });
        
        displayNotification(notification);
    }

    function createNotificationElement(options) {
        const div = document.createElement('div');
        div.className = `xp-notification xp-notification-${options.type}`;
        div.innerHTML = `
            <div class="xp-notif-icon">${options.icon}</div>
            <div class="xp-notif-content">
                <div class="xp-notif-title">${options.title}</div>
                <div class="xp-notif-message">${options.message}</div>
            </div>
        `;
        
        Object.assign(div.style, {
            position: 'fixed',
            top: '100px',
            right: '-400px',
            background: 'rgba(10, 10, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `2px solid ${options.color}`,
            borderRadius: '15px',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: `0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px ${options.color}40`,
            zIndex: '10000',
            minWidth: '300px',
            maxWidth: '400px',
            transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fontFamily: "'Inter', sans-serif",
            color: '#f0eef6'
        });
        
        const icon = div.querySelector('.xp-notif-icon');
        Object.assign(icon.style, {
            fontSize: '2rem',
            flexShrink: '0'
        });
        
        const title = div.querySelector('.xp-notif-title');
        Object.assign(title.style, {
            fontWeight: '700',
            fontSize: '1.1rem',
            color: options.color,
            marginBottom: '0.2rem',
            fontFamily: "'Playfair Display', serif"
        });
        
        const message = div.querySelector('.xp-notif-message');
        Object.assign(message.style, {
            fontSize: '0.9rem',
            color: 'rgba(240, 238, 246, 0.8)'
        });
        
        return {
            element: div,
            duration: options.duration || 3000
        };
    }

    let notificationQueue = [];
    let isShowingNotification = false;

    function displayNotification(notification) {
        notificationQueue.push(notification);
        if (!isShowingNotification) {
            processNotificationQueue();
        }
    }

    function processNotificationQueue() {
        if (notificationQueue.length === 0) {
            isShowingNotification = false;
            return;
        }

        isShowingNotification = true;
        const notification = notificationQueue.shift();
        
        document.body.appendChild(notification.element);
        
        // Slide in
        setTimeout(() => {
            notification.element.style.right = '20px';
        }, 10);
        
        // Slide out
        setTimeout(() => {
            notification.element.style.right = '-400px';
            notification.element.style.opacity = '0';
            
            setTimeout(() => {
                notification.element.remove();
                processNotificationQueue();
            }, 500);
        }, notification.duration);
    }

    function triggerConfetti() {
        const colors = ['#c9a84c', '#40E0D0', '#f4c542', '#c0c0c0'];
        const count = 100;
        
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 5 + Math.random() * 10;
            const duration = 2 + Math.random() * 2;
            
            Object.assign(piece.style, {
                position: 'fixed',
                width: `${size}px`,
                height: `${size}px`,
                background: color,
                top: '50%',
                left: '50%',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                pointerEvents: 'none',
                zIndex: '9999',
                transform: 'translate(-50%, -50%)',
                opacity: '1'
            });
            
            document.body.appendChild(piece);
            
            // Animate
            const xOffset = (Math.random() - 0.5) * window.innerWidth;
            const yOffset = 400 + Math.random() * 400;
            const rotation = Math.random() * 720;
            
            piece.animate([
                { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
                { transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            setTimeout(() => piece.remove(), duration * 1000);
        }
    }

    // ========== PUBLIC API ==========

    window.XPEngine = {
        init,
        awardXP,
        getPlayerStats: () => ({ ...playerStats }),
        getAchievements: () => ACHIEVEMENTS.filter(a => !a.hidden),
        getUnlockedAchievements: () => ACHIEVEMENTS.filter(a => playerStats.achievements.includes(a.id)),
        resetProgress: () => {
            if (confirm('Reset all progress? This cannot be undone!')) {
                localStorage.removeItem('chifftown_xp_data');
                location.reload();
            }
        }
    };

    // Auto-initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🎮 XP Engine loaded');
})();
