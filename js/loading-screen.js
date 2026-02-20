/**
 * ============================================
 * CHIFFTOWN LOADING SCREEN SYSTEM
 * ============================================
 * Beautiful animated transitions between rooms
 * Enhances UX with smooth loading states and fun tips
 * 
 * Features:
 * - Animated Chifftown logo
 * - Room-specific loading messages
 * - Loading tips that rotate
 * - Progress bar animation
 * - Smooth fade transitions
 * 
 * Version: 1.0.0
 * ============================================
 */

(function() {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const ROOM_THEMES = {
        'pub': {
            name: 'The Chiff Inn',
            icon: '🍺',
            tagline: 'Preparing your favorite stool...',
            color: '#d97706',
            tips: [
                'First drink is on the house! (virtually)',
                'The bartender remembers everyone\'s name',
                'Try the local Chiff Ale - it\'s legendary'
            ]
        },
        'nightclub': {
            name: 'Neon Pulse',
            icon: '🎵',
            tagline: 'Warming up the dance floor...',
            color: '#06b6d4',
            tips: [
                'The DJ never plays the same set twice',
                'VIP booths unlock at Level 15',
                'Glow sticks available at the entrance'
            ]
        },
        'cinema': {
            name: 'Starlight Cinema',
            icon: '🎬',
            tagline: 'Dimming the lights...',
            color: '#ef4444',
            tips: [
                'Popcorn refills are always free',
                'Watch with friends for bonus XP',
                'Classic movie nights every Friday'
            ]
        },
        'games': {
            name: 'Pixel Palace Arcade',
            icon: '🕹️',
            tagline: 'Inserting coins...',
            color: '#8b5cf6',
            tips: [
                'High scores earn special badges',
                'Challenge friends to beat your record',
                'Secret games unlock at Level 20'
            ]
        },
        'lounge': {
            name: 'Velvet Sky Lounge',
            icon: '🥂',
            tagline: 'Preparing your reservation...',
            color: '#f59e0b',
            tips: [
                'Best view in all of Chifftown',
                'The sunset cocktails are divine',
                'Live jazz on weekends'
            ]
        },
        'newspaper': {
            name: 'Good News 24',
            icon: '📰',
            tagline: 'Printing the latest stories...',
            color: '#10b981',
            tips: [
                'Only positive news allowed here',
                'Submit your own good news stories',
                'Most read stories earn XP bonuses'
            ]
        },
        'questing': {
            name: 'Adventure Guild',
            icon: '⚔️',
            tagline: 'Preparing your quest log...',
            color: '#6366f1',
            tips: [
                'Epic loot awaits the brave',
                'Party up for raid bonuses',
                'The dragon has never been defeated...'
            ]
        },
        'wellness': {
            name: 'The Wellness Centre',
            icon: '🧘',
            tagline: 'Finding your inner peace...',
            color: '#14b8a6',
            tips: [
                'Deep breaths... you\'re almost there',
                'Meditation sessions earn calm XP',
                'The zen garden is beautiful at sunset'
            ]
        },
        'casino': {
            name: 'The Golden Dice',
            icon: '🎲',
            tagline: 'Shuffling the deck...',
            color: '#eab308',
            tips: [
                'Fortune favors the bold!',
                'The house doesn\'t always win here',
                'Jackpot grows every hour'
            ]
        },
        'serotonin': {
            name: 'Serotonin Boost',
            icon: '✨',
            tagline: 'Charging positivity levels...',
            color: '#ec4899',
            tips: [
                'Happiness is contagious here',
                'Share good vibes, earn rewards',
                'The feel-good zone awaits'
            ]
        },
        'apartment': {
            name: 'Your Apartment',
            icon: '🏠',
            tagline: 'Unlocking your door...',
            color: '#64748b',
            tips: [
                'Customize your space your way',
                'Invite friends over for a party',
                'Rare decorations unlock with levels'
            ]
        },
        'observatory': {
            name: 'Starfire Observatory',
            icon: '🔭',
            tagline: 'Aligning the telescope...',
            color: '#1e40af',
            tips: [
                'Meteor showers happen randomly',
                'Discover new constellations',
                'The universe is vast and beautiful'
            ]
        },
        'chronos': {
            name: 'The Chronos Club',
            icon: '⏰',
            tagline: 'Bending time itself...',
            color: '#7c3aed',
            tips: [
                'Time moves differently here',
                'Dance through the ages',
                'Past and future collide on the floor'
            ]
        },
        'aetherium': {
            name: 'The Aetherium Lab',
            icon: '🔬',
            tagline: 'Initializing experiments...',
            color: '#0ea5e9',
            tips: [
                'Science is better with friends',
                'Your experiments shape the world',
                'Innovation earns major XP'
            ]
        },
        'profile': {
            name: 'Profile Settings',
            icon: '👤',
            tagline: 'Loading your identity...',
            color: '#64748b',
            tips: [
                'Customize your avatar',
                'Track your achievements',
                'Your journey, your story'
            ]
        },
        'achievements': {
            name: 'Achievement Hall',
            icon: '🏆',
            tagline: 'Polishing your trophies...',
            color: '#f59e0b',
            tips: [
                'Every achievement tells a story',
                'Rare badges are worth bragging about',
                'Keep exploring to unlock more'
            ]
        },
        'challenges': {
            name: 'Daily Challenges',
            icon: '📋',
            tagline: 'Loading today\'s missions...',
            color: '#22c55e',
            tips: [
                'New challenges every day',
                'Complete all three for bonus XP',
                'Streaks multiply your rewards'
            ]
        },
        'default': {
            name: 'Chifftown',
            icon: '🏘️',
            tagline: 'Loading your destination...',
            color: '#4fc3f7',
            tips: [
                'Explore every corner of town',
                'Friends make everything better',
                'Your adventure awaits!'
            ]
        }
    };

    const GENERAL_TIPS = [
        'Tip: Complete daily challenges for extra XP!',
        'Tip: Visit friends to earn social XP!',
        'Tip: Check Good News 24 for community updates!',
        'Tip: Higher levels unlock exclusive venues!',
        'Tip: The weather changes every few hours!',
        'Tip: Achievements unlock special badges!',
        'Tip: Your neighbors can see when you\'re online!',
        'Tip: Explore all rooms to discover secrets!',
        'Tip: The town comes alive at night!',
        'Tip: Premium venues await at Level 20+'
    ];

    // ==========================================
    // STATE
    // ==========================================

    let isLoading = false;
    let loadingElement = null;
    let progressInterval = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        console.log('🎬 Loading Screen System initializing...');
        
        // Create loading screen element
        createLoadingScreen();
        
        // Intercept navigation links
        interceptNavigation();
        
        // Handle browser back/forward
        window.addEventListener('pageshow', handlePageShow);
        
        console.log('✅ Loading Screen System ready!');
    }

    // ==========================================
    // LOADING SCREEN DOM
    // ==========================================

    function createLoadingScreen() {
        // Check if already exists
        if (document.getElementById('chifftown-loading-screen')) {
            loadingElement = document.getElementById('chifftown-loading-screen');
            return;
        }

        const loadingHTML = `
            <div id="chifftown-loading-screen" class="loading-screen">
                <div class="loading-content">
                    <!-- Animated logo -->
                    <div class="loading-logo">
                        <div class="logo-ring outer"></div>
                        <div class="logo-ring middle"></div>
                        <div class="logo-ring inner"></div>
                        <div class="logo-icon">
                            <span id="loading-room-icon">🏘️</span>
                        </div>
                    </div>
                    
                    <!-- Room info -->
                    <div class="loading-info">
                        <h2 id="loading-room-name" class="loading-room-name">Chifftown</h2>
                        <p id="loading-tagline" class="loading-tagline">Loading your destination...</p>
                    </div>
                    
                    <!-- Progress bar -->
                    <div class="loading-progress-container">
                        <div class="loading-progress-track">
                            <div id="loading-progress-bar" class="loading-progress-bar"></div>
                        </div>
                        <span id="loading-percentage" class="loading-percentage">0%</span>
                    </div>
                    
                    <!-- Tip -->
                    <div class="loading-tip">
                        <i class="fas fa-lightbulb"></i>
                        <span id="loading-tip-text">Explore every corner of Chifftown!</span>
                    </div>
                </div>
                
                <!-- Particle effects -->
                <div class="loading-particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        loadingElement = document.getElementById('chifftown-loading-screen');
    }

    // ==========================================
    // NAVIGATION INTERCEPTION
    // ==========================================

    function interceptNavigation() {
        // Intercept all internal links
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            // Skip external links, anchors, and special links
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                return;
            }
            
            // Skip links that open in new tab
            if (link.target === '_blank') return;
            
            // Skip if it's a download link
            if (link.hasAttribute('download')) return;
            
            // Skip if modifier keys are pressed
            if (e.ctrlKey || e.metaKey || e.shiftKey) return;
            
            // Skip if already loading
            if (isLoading) {
                e.preventDefault();
                return;
            }
            
            // Determine room from href
            const roomId = getRoomFromHref(href);
            
            // Show loading screen and navigate
            e.preventDefault();
            showLoading(roomId, href);
        });
    }

    function getRoomFromHref(href) {
        // Extract room name from URL
        const cleanHref = href.toLowerCase().replace(/\.html.*$/, '').replace(/^\/+/, '');
        
        // Match against known rooms
        for (const roomId of Object.keys(ROOM_THEMES)) {
            if (cleanHref.includes(roomId)) {
                return roomId;
            }
        }
        
        // Special cases
        if (cleanHref === '' || cleanHref === 'index' || cleanHref === '/') {
            return 'default';
        }
        
        return 'default';
    }

    // ==========================================
    // SHOW / HIDE LOADING
    // ==========================================

    function showLoading(roomId, targetUrl) {
        if (isLoading) return;
        isLoading = true;
        
        const theme = ROOM_THEMES[roomId] || ROOM_THEMES['default'];
        
        // Update loading screen content
        document.getElementById('loading-room-icon').textContent = theme.icon;
        document.getElementById('loading-room-name').textContent = theme.name;
        document.getElementById('loading-tagline').textContent = theme.tagline;
        
        // Set accent color
        loadingElement.style.setProperty('--loading-accent', theme.color);
        
        // Pick a tip (room-specific or general)
        const tips = [...(theme.tips || []), ...GENERAL_TIPS];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        document.getElementById('loading-tip-text').textContent = randomTip;
        
        // Reset progress
        const progressBar = document.getElementById('loading-progress-bar');
        const percentageText = document.getElementById('loading-percentage');
        progressBar.style.width = '0%';
        percentageText.textContent = '0%';
        
        // Show loading screen
        loadingElement.classList.add('active');
        
        // Animate progress
        let progress = 0;
        progressInterval = setInterval(() => {
            // Accelerate near the end
            const increment = progress < 70 ? Math.random() * 8 + 2 : Math.random() * 3 + 1;
            progress = Math.min(progress + increment, 95);
            
            progressBar.style.width = progress + '%';
            percentageText.textContent = Math.round(progress) + '%';
            
            if (progress >= 95) {
                clearInterval(progressInterval);
            }
        }, 100);
        
        // Navigate after minimum display time
        setTimeout(() => {
            // Complete the progress bar
            progressBar.style.width = '100%';
            percentageText.textContent = '100%';
            
            // Navigate after brief pause
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 200);
        }, 800); // Minimum loading screen display time
    }

    function hideLoading() {
        if (!loadingElement) return;
        
        clearInterval(progressInterval);
        
        loadingElement.classList.remove('active');
        loadingElement.classList.add('hiding');
        
        setTimeout(() => {
            loadingElement.classList.remove('hiding');
            isLoading = false;
        }, 500);
    }

    function handlePageShow(e) {
        // Hide loading screen when page is shown (including back/forward navigation)
        if (e.persisted) {
            hideLoading();
        }
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    window.LoadingScreen = {
        init,
        show: showLoading,
        hide: hideLoading,
        isLoading: () => isLoading
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
