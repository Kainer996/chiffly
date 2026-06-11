/**
 * ============================================
 * CHIFFTOWN QUICK EMOTES SYSTEM
 * ============================================
 * Floating emoji reactions for social interaction
 * Users can send quick reactions that float across the screen
 * 
 * Features:
 * - Emote picker button (bottom of screen)
 * - Popular emoji quick-access
 * - Floating animation across screen
 * - Socket.io broadcast to other users
 * - Rate limiting to prevent spam
 * - XP rewards for social interaction
 * 
 * Version: 1.0.0
 * ============================================
 */

(function() {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const EMOTES = {
        reactions: {
            title: 'Reactions',
            emotes: ['👍', '👏', '❤️', '🔥', '😂', '🎉', '💯', '⭐']
        },
        moods: {
            title: 'Moods',
            emotes: ['😊', '😎', '🤩', '🥳', '😴', '🤔', '😮', '🙌']
        },
        activities: {
            title: 'Activities',
            emotes: ['🎮', '🎬', '🎵', '🍻', '💃', '🎲', '📺', '🎤']
        },
        vibes: {
            title: 'Vibes',
            emotes: ['✨', '💫', '🌟', '🚀', '💎', '🌈', '⚡', '🎊']
        }
    };

    const CONFIG = {
        maxEmotesOnScreen: 15,        // Max floating emotes at once
        emoteDuration: 4000,          // How long emote floats (ms)
        cooldownMs: 500,              // Cooldown between sends
        xpPerEmote: 2,                // XP earned per emote sent
        maxEmotesPerMinute: 20        // Rate limit
    };

    // ==========================================
    // STATE
    // ==========================================

    let isPickerOpen = false;
    let lastEmoteTime = 0;
    let emotesThisMinute = 0;
    let minuteResetTimer = null;
    let activeEmotes = 0;
    let socket = null;
    let currentUser = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        console.log('😊 Quick Emotes System initializing...');
        
        // Get current user
        currentUser = getCurrentUser();
        
        // Create UI elements
        createEmoteButton();
        createEmotePicker();
        createEmoteContainer();
        
        // Setup socket listener for receiving emotes
        setupSocketListener();
        
        // Reset rate limit every minute
        minuteResetTimer = setInterval(() => {
            emotesThisMinute = 0;
        }, 60000);
        
        console.log('✅ Quick Emotes System ready!');
    }

    function getCurrentUser() {
        try {
            const userData = localStorage.getItem('chifftown_user');
            if (userData) {
                return JSON.parse(userData);
            }
        } catch (e) {}
        return { username: 'Guest', avatar: null };
    }

    // ==========================================
    // UI CREATION
    // ==========================================

    function createEmoteButton() {
        // Check if already exists
        if (document.getElementById('emote-trigger-btn')) return;

        const button = document.createElement('button');
        button.id = 'emote-trigger-btn';
        button.className = 'emote-trigger-btn';
        button.innerHTML = `
            <span class="emote-btn-icon">😊</span>
            <span class="emote-btn-label">React</span>
        `;
        button.title = 'Send a reaction';
        button.addEventListener('click', togglePicker);
        
        document.body.appendChild(button);
    }

    function createEmotePicker() {
        // Check if already exists
        if (document.getElementById('emote-picker')) return;

        let pickerHTML = `
            <div id="emote-picker" class="emote-picker">
                <div class="emote-picker-header">
                    <span class="emote-picker-title">Quick React</span>
                    <button class="emote-picker-close" id="emote-picker-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="emote-picker-content">
        `;
        
        // Add emote categories
        for (const [categoryId, category] of Object.entries(EMOTES)) {
            pickerHTML += `
                <div class="emote-category">
                    <div class="emote-category-title">${category.title}</div>
                    <div class="emote-category-grid">
            `;
            
            for (const emote of category.emotes) {
                pickerHTML += `
                    <button class="emote-btn" data-emote="${emote}" title="${emote}">
                        ${emote}
                    </button>
                `;
            }
            
            pickerHTML += `
                    </div>
                </div>
            `;
        }
        
        pickerHTML += `
                </div>
                <div class="emote-picker-footer">
                    <span class="emote-hint">Click an emoji to react!</span>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', pickerHTML);
        
        // Add event listeners
        document.getElementById('emote-picker-close').addEventListener('click', closePicker);
        
        // Emote button clicks
        document.querySelectorAll('.emote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emote = e.currentTarget.dataset.emote;
                sendEmote(emote);
            });
        });
        
        // Close picker when clicking outside
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('emote-picker');
            const trigger = document.getElementById('emote-trigger-btn');
            
            if (isPickerOpen && 
                !picker.contains(e.target) && 
                !trigger.contains(e.target)) {
                closePicker();
            }
        });
    }

    function createEmoteContainer() {
        // Container for floating emotes
        if (document.getElementById('emote-float-container')) return;
        
        const container = document.createElement('div');
        container.id = 'emote-float-container';
        container.className = 'emote-float-container';
        document.body.appendChild(container);
    }

    // ==========================================
    // PICKER CONTROLS
    // ==========================================

    function togglePicker() {
        if (isPickerOpen) {
            closePicker();
        } else {
            openPicker();
        }
    }

    function openPicker() {
        const picker = document.getElementById('emote-picker');
        const trigger = document.getElementById('emote-trigger-btn');
        
        picker.classList.add('active');
        trigger.classList.add('active');
        isPickerOpen = true;
    }

    function closePicker() {
        const picker = document.getElementById('emote-picker');
        const trigger = document.getElementById('emote-trigger-btn');
        
        picker.classList.remove('active');
        trigger.classList.remove('active');
        isPickerOpen = false;
    }

    // ==========================================
    // SEND EMOTE
    // ==========================================

    function sendEmote(emote) {
        const now = Date.now();
        
        // Check cooldown
        if (now - lastEmoteTime < CONFIG.cooldownMs) {
            showCooldownNotification();
            return;
        }
        
        // Check rate limit
        if (emotesThisMinute >= CONFIG.maxEmotesPerMinute) {
            showRateLimitNotification();
            return;
        }
        
        // Update state
        lastEmoteTime = now;
        emotesThisMinute++;
        
        // Display locally
        displayFloatingEmote(emote, currentUser.username, true);
        
        // Broadcast via socket
        broadcastEmote(emote);
        
        // Award XP
        awardXP();
        
        // Visual feedback on button
        const btn = document.querySelector(`.emote-btn[data-emote="${emote}"]`);
        if (btn) {
            btn.classList.add('sent');
            setTimeout(() => btn.classList.remove('sent'), 300);
        }
        
        // Close picker after sending
        setTimeout(closePicker, 150);
    }

    function broadcastEmote(emote) {
        // Try to use existing socket connection
        if (window.socket && window.socket.connected) {
            window.socket.emit('emote', {
                emote: emote,
                username: currentUser.username,
                timestamp: Date.now()
            });
        }
    }

    // ==========================================
    // DISPLAY FLOATING EMOTE
    // ==========================================

    function displayFloatingEmote(emote, username = '', isLocal = false) {
        // Check max emotes
        if (activeEmotes >= CONFIG.maxEmotesOnScreen) return;
        
        const container = document.getElementById('emote-float-container');
        if (!container) return;
        
        activeEmotes++;
        
        // Create emote element
        const emoteEl = document.createElement('div');
        emoteEl.className = `floating-emote ${isLocal ? 'local' : 'remote'}`;
        
        // Random horizontal position
        const startX = Math.random() * 80 + 10; // 10-90%
        
        // Random animation variation
        const animDuration = CONFIG.emoteDuration + (Math.random() * 1000 - 500);
        const drift = Math.random() * 100 - 50; // -50 to 50px drift
        
        emoteEl.innerHTML = `
            <span class="floating-emote-icon">${emote}</span>
            ${username ? `<span class="floating-emote-user">${username}</span>` : ''}
        `;
        
        emoteEl.style.cssText = `
            left: ${startX}%;
            --drift: ${drift}px;
            animation-duration: ${animDuration}ms;
        `;
        
        container.appendChild(emoteEl);
        
        // Remove after animation
        setTimeout(() => {
            emoteEl.classList.add('fading');
            setTimeout(() => {
                emoteEl.remove();
                activeEmotes--;
            }, 500);
        }, animDuration - 500);
    }

    // ==========================================
    // SOCKET LISTENER
    // ==========================================

    function setupSocketListener() {
        // Wait for socket to be available
        const checkSocket = setInterval(() => {
            if (window.socket && window.socket.connected) {
                clearInterval(checkSocket);
                
                window.socket.on('emote', (data) => {
                    // Don't display our own emotes twice
                    if (data.username === currentUser.username) return;
                    
                    displayFloatingEmote(data.emote, data.username, false);
                });
                
                console.log('🔌 Emote socket listener attached');
            }
        }, 1000);
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkSocket), 30000);
    }

    // ==========================================
    // XP REWARDS
    // ==========================================

    function awardXP() {
        if (window.XPEngine && typeof window.XPEngine.awardXP === 'function') {
            window.XPEngine.awardXP(CONFIG.xpPerEmote, 'emote_sent');
        }
    }

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    function showCooldownNotification() {
        showNotification('⏳ Slow down! Wait a moment...', 'info');
    }

    function showRateLimitNotification() {
        showNotification('😅 Too many emotes! Take a breather.', 'warning');
    }

    function showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback: console log
        console.log(`[Emotes] ${message}`);
    }

    // ==========================================
    // CLEANUP
    // ==========================================

    function cleanup() {
        clearInterval(minuteResetTimer);
        
        const picker = document.getElementById('emote-picker');
        const trigger = document.getElementById('emote-trigger-btn');
        const container = document.getElementById('emote-float-container');
        
        if (picker) picker.remove();
        if (trigger) trigger.remove();
        if (container) container.remove();
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    window.QuickEmotes = {
        init,
        sendEmote,
        displayFloatingEmote,
        openPicker,
        closePicker,
        cleanup
    };

    // ==========================================
    // AUTO-INITIALIZE
    // ==========================================

    // Only initialize in room pages (not homepage)
    function shouldInitialize() {
        const path = window.location.pathname.toLowerCase();
        
        // Don't initialize on homepage
        if (path === '/' || path === '/index.html' || path === '') {
            return false;
        }
        
        // Initialize on all other pages (rooms)
        return true;
    }

    if (shouldInitialize()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

})();
