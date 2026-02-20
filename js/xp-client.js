// xp-client.js — Client-side XP system integration
// Listens for server-side XP events and displays notifications

(function() {
    // Expose XP system globally
    window.XPSystem = {
        init: function(existingSocket) {
            if (this.initialized) return;
            
            let socket;
            if (existingSocket) {
                socket = existingSocket;
            } else if (typeof window.socket !== 'undefined' && window.socket.connected) {
                socket = window.socket;
            } else if (typeof io !== 'undefined') {
                socket = io();
            } else {
                console.warn('Socket.IO not loaded, XP system disabled');
                return;
            }

            this.socket = socket;
            this.setupListeners();
            this.initialized = true;
            console.log('✅ XP client system initialized');
        },

        setupListeners: function() {
            const socket = this.socket;
            
            // Listen for XP gained
            socket.on('xp-gained', (data) => {
                this.showXPNotification(data);
                this.updateLocalXP(data);
            });

            // Listen for level up
            socket.on('level-up', (data) => {
                this.showLevelUpNotification(data);
            });

            // Listen for achievement unlocked
            socket.on('achievement-unlocked', (achievement) => {
                this.showAchievementNotification(achievement);
            });
        },

        notificationQueue: [],
        isShowingNotification: false,

        // Show XP gain notification
        showXPNotification: function(data) {
            const notification = this.createNotification('xp-gain', {
                icon: '✨',
                title: `+${data.amount} XP`,
                message: data.reason,
                color: '#40E0D0'
            });
            
            this.queueNotification(notification);
        },

        // Show level up notification
        showLevelUpNotification: function(data) {
            const notification = this.createNotification('level-up', {
                icon: '🎉',
                title: `Level ${data.level}!`,
                message: `You've reached level ${data.level}!`,
                color: '#f4c542',
                duration: 4000
            });
            
            this.queueNotification(notification);
            
            // Confetti effect
            if (typeof confetti !== 'undefined') {
                confetti();
            }
        },

        // Show achievement unlocked notification
        showAchievementNotification: function(achievement) {
            const notification = this.createNotification('achievement', {
                icon: achievement.icon || '🏆',
                title: 'Achievement Unlocked!',
                message: achievement.name,
                color: '#f4c542',
                duration: 5000
            });
            
            this.queueNotification(notification);
        },

        // Create notification element
        createNotification: function(type, options) {
            const notification = document.createElement('div');
            notification.className = `xp-notification xp-notification-${type}`;
            notification.innerHTML = `
                <div class="xp-notification-icon">${options.icon}</div>
                <div class="xp-notification-content">
                    <div class="xp-notification-title">${options.title}</div>
                    <div class="xp-notification-message">${options.message}</div>
                </div>
            `;
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: -400px;
                background: rgba(10, 10, 26, 0.95);
                backdrop-filter: blur(20px);
                border: 2px solid ${options.color};
                border-radius: 15px;
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px ${options.color}40;
                z-index: 10000;
                min-width: 300px;
                max-width: 400px;
                transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                font-family: 'Inter', sans-serif;
            `;
            
            const iconStyle = `
                font-size: 2rem;
                flex-shrink: 0;
            `;
            
            const titleStyle = `
                font-weight: 700;
                font-size: 1.1rem;
                color: ${options.color};
                margin-bottom: 0.2rem;
                font-family: 'Playfair Display', serif;
            `;
            
            const messageStyle = `
                font-size: 0.9rem;
                color: rgba(240, 238, 246, 0.8);
            `;
            
            notification.querySelector('.xp-notification-icon').style.cssText = iconStyle;
            notification.querySelector('.xp-notification-title').style.cssText = titleStyle;
            notification.querySelector('.xp-notification-message').style.cssText = messageStyle;
            
            return {
                element: notification,
                duration: options.duration || 3000
            };
        },

        // Queue notification
        queueNotification: function(notification) {
            this.notificationQueue.push(notification);
            if (!this.isShowingNotification) {
                this.showNextNotification();
            }
        },

        // Show next notification in queue
        showNextNotification: function() {
            if (this.notificationQueue.length === 0) {
                this.isShowingNotification = false;
                return;
            }

            this.isShowingNotification = true;
            const notification = this.notificationQueue.shift();
            
            document.body.appendChild(notification.element);
            
            // Slide in
            setTimeout(() => {
                notification.element.style.right = '20px';
            }, 10);
            
            // Slide out
            setTimeout(() => {
                notification.element.style.right = '-400px';
                notification.element.style.opacity = '0';
                
                // Remove and show next
                setTimeout(() => {
                    notification.element.remove();
                    this.showNextNotification();
                }, 500);
            }, notification.duration);
        },

        // Update local storage with new XP (for offline persistence)
        updateLocalXP: function(data) {
            try {
                const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
                if (user.username && data.newXp) {
                    const stats = JSON.parse(localStorage.getItem('chifftown_stats') || '{}');
                    stats.xp = data.newXp;
                    stats.level = data.levelData ? data.levelData.level : Math.floor(data.newXp / 100) + 1;
                    localStorage.setItem('chifftown_stats', JSON.stringify(stats));
                }
            } catch (e) {
                console.error('Error updating local XP:', e);
            }
        }
    };

    // Auto-init if socket is globally available
    if (typeof io !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait slightly for socket to be established
            setTimeout(() => {
                if (!window.XPSystem.initialized) {
                    window.XPSystem.init();
                }
            }, 1000);
        });
    }

})();
