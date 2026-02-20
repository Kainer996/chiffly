// ========================================
// CHIFFTOWN DAILY CHALLENGES SYSTEM
// ========================================
// Provides rotating daily challenges with XP rewards
// Integrates with xp-engine.js for progression tracking
// ========================================

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CHALLENGE_CONFIG = {
        dailyCount: 3,              // Number of challenges per day
        resetHour: 0,               // Reset at midnight (0 = 12:00 AM)
        completionXP: 100,          // Bonus XP for completing a challenge
        allCompleteBonusXP: 250,    // Bonus for completing all daily challenges
        storageKey: 'chifftown_daily_challenges'
    };

    // ========================================
    // CHALLENGE POOL
    // ========================================
    // Each challenge has: id, name, description, target, type, xpReward
    // Types: visit, action, time, social, exploration

    const CHALLENGE_POOL = [
        // EXPLORATION CHALLENGES
        {
            id: 'visit_3_venues',
            name: 'Town Explorer',
            description: 'Visit 3 different venues',
            type: 'visit',
            target: 3,
            xpReward: 100,
            icon: '🗺️'
        },
        {
            id: 'visit_all_venues',
            name: 'Grand Tour',
            description: 'Visit all 6 venues in Chifftown',
            type: 'visit',
            target: 6,
            xpReward: 200,
            icon: '🏆'
        },
        {
            id: 'fullscreen_explorer',
            name: 'Immersive Explorer',
            description: 'Enter fullscreen mode',
            type: 'action',
            target: 1,
            xpReward: 50,
            icon: '🖥️'
        },

        // TIME-BASED CHALLENGES
        {
            id: 'active_15min',
            name: 'Dedicated Visitor',
            description: 'Stay active for 15 minutes',
            type: 'time',
            target: 900,  // 15 minutes in seconds
            xpReward: 150,
            icon: '⏰'
        },
        {
            id: 'active_30min',
            name: 'Town Regular',
            description: 'Stay active for 30 minutes',
            type: 'time',
            target: 1800,  // 30 minutes in seconds
            xpReward: 300,
            icon: '🌟'
        },
        {
            id: 'night_visit',
            name: 'Night Owl',
            description: 'Visit Chifftown at night (10pm-6am)',
            type: 'action',
            target: 1,
            xpReward: 75,
            icon: '🌙'
        },

        // INTERACTION CHALLENGES
        {
            id: 'weather_changes',
            name: 'Weather Wizard',
            description: 'Change the weather 3 times',
            type: 'action',
            target: 3,
            xpReward: 75,
            icon: '🌦️'
        },
        {
            id: 'time_changes',
            name: 'Time Traveler',
            description: 'Change time of day 3 times',
            type: 'action',
            target: 3,
            xpReward: 75,
            icon: '🕐'
        },
        {
            id: 'generate_invite',
            name: 'Friend Recruiter',
            description: 'Generate an invite link',
            type: 'action',
            target: 1,
            xpReward: 100,
            icon: '📨'
        },

        // ENGAGEMENT CHALLENGES
        {
            id: 'check_achievements',
            name: 'Achievement Hunter',
            description: 'View your achievements page',
            type: 'action',
            target: 1,
            xpReward: 50,
            icon: '🏅'
        },
        {
            id: 'level_up',
            name: 'Rising Star',
            description: 'Gain a level today',
            type: 'action',
            target: 1,
            xpReward: 150,
            icon: '⭐'
        },
        {
            id: 'earn_500xp',
            name: 'XP Grinder',
            description: 'Earn 500 XP today',
            type: 'xp',
            target: 500,
            xpReward: 100,
            icon: '💎'
        }
    ];

    // ========================================
    // STATE MANAGEMENT
    // ========================================

    let challengeState = {
        lastReset: null,
        dailyChallenges: [],
        progress: {},
        sessionStart: Date.now(),
        activeTime: 0,
        lastActivityUpdate: Date.now()
    };

    // ========================================
    // INITIALIZATION
    // ========================================

    function init() {
        loadChallengeData();
        checkDailyReset();
        setupEventListeners();
        startActivityTracking();
        updateChallengesUI();
        updateChallengesWidget();

        console.log('✅ Daily Challenges System initialized');
        console.log('📋 Active challenges:', challengeState.dailyChallenges.length);
    }

    // ========================================
    // DATA PERSISTENCE
    // ========================================

    function loadChallengeData() {
        try {
            const saved = localStorage.getItem(CHALLENGE_CONFIG.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                challengeState = { ...challengeState, ...data };
                
                // Restore session start if not set
                if (!challengeState.sessionStart) {
                    challengeState.sessionStart = Date.now();
                }
                challengeState.lastActivityUpdate = Date.now();
            }
        } catch (error) {
            console.error('Failed to load challenge data:', error);
        }
    }

    function saveChallengeData() {
        try {
            localStorage.setItem(CHALLENGE_CONFIG.storageKey, JSON.stringify(challengeState));
        } catch (error) {
            console.error('Failed to save challenge data:', error);
        }
    }

    // ========================================
    // DAILY RESET & CHALLENGE SELECTION
    // ========================================

    function checkDailyReset() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const lastReset = challengeState.lastReset ? new Date(challengeState.lastReset) : null;
        const lastResetDate = lastReset ? new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate()).getTime() : null;

        // Reset if it's a new day or first time
        if (!lastResetDate || today > lastResetDate) {
            resetDailyChallenges();
        }
    }

    function resetDailyChallenges() {
        console.log('🔄 Resetting daily challenges...');
        
        // Select random challenges
        const shuffled = [...CHALLENGE_POOL].sort(() => Math.random() - 0.5);
        challengeState.dailyChallenges = shuffled.slice(0, CHALLENGE_CONFIG.dailyCount);
        
        // Reset progress
        challengeState.progress = {};
        challengeState.dailyChallenges.forEach(challenge => {
            challengeState.progress[challenge.id] = {
                current: 0,
                completed: false
            };
        });

        challengeState.lastReset = Date.now();
        challengeState.sessionStart = Date.now();
        challengeState.activeTime = 0;

        saveChallengeData();
        updateChallengesUI();
        updateChallengesWidget();

        // Show notification
        showNotification('🎯 New Daily Challenges!', 'Check your challenges for today\'s goals', 'challenges');
    }

    // ========================================
    // PROGRESS TRACKING
    // ========================================

    function updateChallengeProgress(challengeId, increment = 1) {
        const challenge = challengeState.dailyChallenges.find(c => c.id === challengeId);
        if (!challenge) return;

        const progress = challengeState.progress[challengeId];
        if (!progress || progress.completed) return;

        progress.current = Math.min(progress.current + increment, challenge.target);

        // Check if completed
        if (progress.current >= challenge.target) {
            completeChallenge(challenge);
        }

        saveChallengeData();
        updateChallengesUI();
    }

    function completeChallenge(challenge) {
        const progress = challengeState.progress[challenge.id];
        if (progress.completed) return;

        progress.completed = true;
        
        // Award XP
        const totalXP = challenge.xpReward + CHALLENGE_CONFIG.completionXP;
        
        // Use XPEngine if available
        if (window.XPEngine && typeof window.XPEngine.awardXP === 'function') {
            window.XPEngine.awardXP(totalXP, `Completed challenge: ${challenge.name}`);
        }

        // Show notification
        showNotification(
            `${challenge.icon} Challenge Complete!`,
            `${challenge.name} - Earned ${totalXP} XP!`,
            'challenge-complete'
        );

        // Check if all challenges completed
        checkAllChallengesComplete();

        saveChallengeData();
        updateChallengesUI();
        updateChallengesWidget();
    }

    function checkAllChallengesComplete() {
        const allComplete = challengeState.dailyChallenges.every(challenge => 
            challengeState.progress[challenge.id]?.completed
        );

        if (allComplete && !challengeState.allCompleteAwarded) {
            challengeState.allCompleteAwarded = true;
            
            // Award mega bonus
            if (window.XPEngine && typeof window.XPEngine.awardXP === 'function') {
                window.XPEngine.awardXP(CHALLENGE_CONFIG.allCompleteBonusXP, 'Completed all daily challenges!');
            }

            showNotification(
                '🎉 All Challenges Complete!',
                `Bonus ${CHALLENGE_CONFIG.allCompleteBonusXP} XP awarded!`,
                'all-complete'
            );

            saveChallengeData();
        }
    }

    // ========================================
    // ACTIVITY TRACKING
    // ========================================

    function startActivityTracking() {
        // Update active time every second
        setInterval(() => {
            const now = Date.now();
            const timeSinceLastUpdate = now - challengeState.lastActivityUpdate;
            
            // Only count as active if page is visible and less than 5 seconds since last update
            if (document.visibilityState === 'visible' && timeSinceLastUpdate < 5000) {
                challengeState.activeTime += 1;
                challengeState.lastActivityUpdate = now;

                // Check time-based challenges
                checkTimeChallenges();
            }
        }, 1000);

        // Reset activity timer on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                challengeState.lastActivityUpdate = Date.now();
            }
        });
    }

    function checkTimeChallenges() {
        challengeState.dailyChallenges.forEach(challenge => {
            if (challenge.type === 'time') {
                const progress = challengeState.progress[challenge.id];
                if (progress && !progress.completed) {
                    progress.current = challengeState.activeTime;
                    
                    if (progress.current >= challenge.target) {
                        completeChallenge(challenge);
                    } else {
                        updateChallengesUI(); // Update progress bar
                        updateChallengesWidget(); // Update widget
                    }
                }
            }
        });
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    function setupEventListeners() {
        // Track XP gains
        if (window.XPEngine) {
            const originalAwardXP = window.XPEngine.awardXP;
            if (originalAwardXP) {
                window.XPEngine.awardXP = function(amount, reason) {
                    // Call original
                    const result = originalAwardXP.call(window.XPEngine, amount, reason);
                    
                    // Track XP challenges
                    trackXPEarned(amount);
                    
                    return result;
                };
            }
        }

        // Track venue visits
        document.addEventListener('click', (e) => {
            const venueLink = e.target.closest('.map-hotspot, .venue-item, a[href$=".html"]');
            if (venueLink) {
                trackVenueVisit();
            }

            // Track fullscreen
            const fullscreenBtn = e.target.closest('#fullscreen-toggle, .fullscreen-btn');
            if (fullscreenBtn) {
                trackAction('fullscreen_explorer');
            }

            // Track weather changes
            const weatherBtn = e.target.closest('.weather-btn, [data-weather]');
            if (weatherBtn) {
                trackAction('weather_changes');
            }

            // Track time changes
            const timeBtn = e.target.closest('.time-btn, [data-time]');
            if (timeBtn) {
                trackAction('time_changes');
            }

            // Track invite generation
            const inviteBtn = e.target.closest('#generate-invite, .invite-btn');
            if (inviteBtn) {
                trackAction('generate_invite');
            }

            // Track achievements page view
            const achievementsLink = e.target.closest('a[href*="achievements"]');
            if (achievementsLink) {
                trackAction('check_achievements');
            }
        });

        // Track night visits
        checkNightVisit();
    }

    function trackVenueVisit() {
        challengeState.dailyChallenges.forEach(challenge => {
            if (challenge.type === 'visit') {
                updateChallengeProgress(challenge.id, 1);
            }
        });
    }

    function trackAction(actionId) {
        updateChallengeProgress(actionId, 1);
    }

    function trackXPEarned(amount) {
        challengeState.dailyChallenges.forEach(challenge => {
            if (challenge.type === 'xp') {
                updateChallengeProgress(challenge.id, amount);
            }
        });
    }

    function checkNightVisit() {
        const hour = new Date().getHours();
        if (hour >= 22 || hour < 6) {
            trackAction('night_visit');
        }
    }

    // ========================================
    // UI UPDATES
    // ========================================

    function updateChallengesUI() {
        const container = document.getElementById('daily-challenges-list');
        if (!container) return;

        container.innerHTML = '';

        challengeState.dailyChallenges.forEach(challenge => {
            const progress = challengeState.progress[challenge.id];
            if (!progress) return;

            const percentage = Math.min((progress.current / challenge.target) * 100, 100);
            const isComplete = progress.completed;

            const challengeCard = document.createElement('div');
            challengeCard.className = `challenge-card ${isComplete ? 'completed' : ''}`;
            challengeCard.innerHTML = `
                <div class="challenge-icon">${challenge.icon}</div>
                <div class="challenge-info">
                    <div class="challenge-name">${challenge.name}</div>
                    <div class="challenge-description">${challenge.description}</div>
                    <div class="challenge-progress-bar">
                        <div class="challenge-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="challenge-stats">
                        <span class="challenge-counter">${progress.current}/${challenge.target}</span>
                        <span class="challenge-reward">${isComplete ? '✓ Complete' : `+${challenge.xpReward} XP`}</span>
                    </div>
                </div>
            `;

            container.appendChild(challengeCard);
        });

        // Update header stats
        const completedCount = challengeState.dailyChallenges.filter(c => 
            challengeState.progress[c.id]?.completed
        ).length;
        const totalCount = challengeState.dailyChallenges.length;

        const headerStats = document.getElementById('challenges-header-stats');
        if (headerStats) {
            headerStats.textContent = `${completedCount}/${totalCount} Complete`;
        }
    }

    // ========================================
    // WIDGET UI UPDATE
    // ========================================

    function updateChallengesWidget() {
        const widgetContainer = document.getElementById('challengesList');
        if (!widgetContainer) return;

        widgetContainer.innerHTML = '';

        // If no challenges, show loading
        if (challengeState.dailyChallenges.length === 0) {
            widgetContainer.innerHTML = `
                <div class="challenge-mini-loading">
                    <i class="fas fa-spinner fa-spin"></i> Loading challenges...
                </div>
            `;
            return;
        }

        // Render mini challenge cards
        challengeState.dailyChallenges.forEach(challenge => {
            const progress = challengeState.progress[challenge.id];
            if (!progress) return;

            const percentage = Math.min((progress.current / challenge.target) * 100, 100);
            const isComplete = progress.completed;

            const miniCard = document.createElement('div');
            miniCard.className = `challenge-mini ${isComplete ? 'completed' : ''}`;
            miniCard.innerHTML = `
                <div class="challenge-mini-icon">${challenge.icon}</div>
                <div class="challenge-mini-info">
                    <div class="challenge-mini-name">${challenge.name}</div>
                    <div class="challenge-mini-progress">
                        ${isComplete ? '✓ Complete!' : `${progress.current}/${challenge.target}`}
                    </div>
                    ${!isComplete ? `
                        <div class="challenge-mini-progress-bar">
                            <div class="challenge-mini-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    ` : ''}
                </div>
                ${isComplete ? '<div class="challenge-mini-checkmark"><i class="fas fa-check-circle"></i></div>' : ''}
            `;

            widgetContainer.appendChild(miniCard);
        });
    }

    // ========================================
    // NOTIFICATIONS
    // ========================================

    function showNotification(title, message, type = 'info') {
        // Use XPEngine notification system if available
        if (window.XPEngine && typeof window.XPEngine.showNotification === 'function') {
            window.XPEngine.showNotification(title, message);
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `challenge-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // ========================================
    // PUBLIC API
    // ========================================

    window.DailyChallenges = {
        init,
        getChallenges: () => challengeState.dailyChallenges,
        getProgress: () => challengeState.progress,
        updateProgress: updateChallengeProgress,
        reset: resetDailyChallenges,
        getState: () => challengeState
    };

    // ========================================
    // AUTO-INIT
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
