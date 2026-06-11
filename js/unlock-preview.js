// ============================================
// CHIFFTOWN UNLOCK PREVIEW SYSTEM
// ============================================
// Shows preview modals for locked buildings
// Creates curiosity and drives XP grinding
// ============================================

(function() {
    'use strict';

    // ========================================
    // BUILDING PREVIEW DATA
    // ========================================
    
    const BUILDING_PREVIEWS = {
        'arcade': {
            name: 'Pixel Palace Arcade',
            tagline: 'Retro gaming paradise',
            description: 'Step into a neon-lit wonderland of classic arcade games. Challenge friends to high scores, win prizes, and relive the golden age of gaming.',
            features: [
                '🕹️ Classic arcade games (Pac-Man, Space Invaders, Street Fighter)',
                '🏆 Global leaderboards & daily tournaments',
                '🎁 Win tickets for exclusive prizes',
                '👥 Multiplayer battles with friends',
                '🎮 VR arcade section (coming soon)'
            ],
            preview_image: '/images/arcade-preview.jpg',
            unlock_level: 5,
            generation: 2,
            rarity: 'uncommon',
            xp_reward: 50,
            fun_fact: 'The Pixel Palace holds the world record for most arcade cabinets in a virtual space!'
        },
        'lounge': {
            name: 'Velvet Sky Lounge',
            tagline: 'Sophisticated relaxation',
            description: 'A rooftop oasis with panoramic views of Chifftown. Enjoy craft cocktails, live jazz music, and intimate conversations under the stars.',
            features: [
                '🍸 Premium cocktail menu with virtual mixology',
                '🎵 Live jazz performances every evening',
                '🌆 Stunning rooftop views of Chifftown skyline',
                '🛋️ Private VIP booths for group chats',
                '🔥 Rooftop fire pit lounge area'
            ],
            preview_image: '/images/lounge-preview.jpg',
            unlock_level: 5,
            generation: 2,
            rarity: 'uncommon',
            xp_reward: 50,
            fun_fact: 'The Velvet Sky is Chifftown\'s highest venue - perfect for sunset watching!'
        },
        'billboard': {
            name: 'Good News 24',
            tagline: 'Your daily dose of positivity',
            description: 'An interactive news billboard featuring uplifting stories, community achievements, and Chifftown updates. Stay connected with what\'s happening!',
            features: [
                '📰 Daily curated positive news from around the world',
                '🎉 Chifftown community achievements showcase',
                '📊 Live statistics and player milestones',
                '📺 Interactive news ticker with personalized updates',
                '🗳️ Community voting on featured stories'
            ],
            preview_image: '/images/billboard-preview.jpg',
            unlock_level: 5,
            generation: 2,
            rarity: 'uncommon',
            xp_reward: 30,
            fun_fact: 'Good News 24 has featured over 10,000 positive stories since launch!'
        },
        'adventure': {
            name: 'Adventure Guild',
            tagline: 'Epic quests await',
            description: 'Join a legendary guild of adventurers. Embark on quests, form parties, battle monsters, and earn epic loot in Chifftown\'s premier RPG hub.',
            features: [
                '⚔️ 50+ unique quests with branching storylines',
                '🐉 Co-op boss battles with up to 8 players',
                '🎒 Collect rare loot, weapons, and armor',
                '🗺️ Procedurally generated dungeons',
                '👑 Guild rankings and legendary titles'
            ],
            preview_image: '/images/adventure-preview.jpg',
            unlock_level: 10,
            generation: 3,
            rarity: 'rare',
            xp_reward: 100,
            fun_fact: 'Only 15% of Chifftown players have defeated the Dragon of Mount Chiff!'
        },
        'wellness': {
            name: 'The Wellness Centre',
            tagline: 'Mind, body, spirit',
            description: 'A serene sanctuary dedicated to mental and physical wellbeing. Meditate, practice yoga, attend wellness workshops, and find your zen.',
            features: [
                '🧘 Guided meditation and mindfulness sessions',
                '🏋️ Virtual fitness classes (yoga, pilates, HIIT)',
                '🎨 Art therapy and creative wellness workshops',
                '🌿 Tranquil zen garden for quiet reflection',
                '📚 Wellness library with mental health resources'
            ],
            preview_image: '/images/wellness-preview.jpg',
            unlock_level: 10,
            generation: 3,
            rarity: 'rare',
            xp_reward: 80,
            fun_fact: 'Studies show visitors to the Wellness Centre report 60% higher happiness levels!'
        },
        'casino': {
            name: 'The Golden Dice',
            tagline: 'Fortune favors the bold',
            description: 'A luxurious casino where risk meets reward. Play poker, blackjack, slots, and roulette. Will you hit the jackpot?',
            features: [
                '🎰 20+ casino games (poker, blackjack, roulette, slots)',
                '💰 Daily login bonuses and VIP rewards',
                '🃏 High-stakes poker tournaments',
                '🏆 Progressive jackpots that grow daily',
                '🥂 Exclusive VIP lounge for high rollers'
            ],
            preview_image: '/images/casino-preview.jpg',
            unlock_level: 10,
            generation: 3,
            rarity: 'rare',
            xp_reward: 100,
            fun_fact: 'The Golden Dice jackpot has paid out over 1 million virtual coins to lucky winners!'
        },

        // --- GENERATION 4 ---
        'observatory': {
            name: 'Starfire Observatory',
            tagline: 'Gaze into the cosmos',
            description: 'A state-of-the-art celestial observatory perched at the highest point in Chifftown. Discover distant galaxies, track meteor showers, and unlock the secrets of the universe.',
            features: [
                '🔭 Use the Grand Celestial Telescope to explore real-time star maps',
                '💫 Witness breathtaking cosmic events like supernovas and eclipses',
                '🌠 Collect fragments from meteor showers to craft unique items',
                '🌌 Attend lectures from renowned virtual astronomers',
                '👽 Join the search for extraterrestrial intelligence (SETI)'
            ],
            preview_image: '/images/observatory-preview.jpg',
            unlock_level: 20,
            generation: 4,
            rarity: 'epic',
            xp_reward: 250,
            fun_fact: 'The Observatory\'s main lens is polished with diamond dust, making it one of the most expensive structures in town!'
        },
        'chronos': {
            name: 'The Chronos Club',
            tagline: 'Dance outside of time',
            description: 'A mind-bending nightclub where time itself is distorted. The music, visuals, and even the flow of time change dynamically, offering a unique party experience every visit.',
            features: [
                '⌛ Experience time-distorting effects on the dance floor (slow-motion, fast-forward)',
                '🎶 A generative music system that never plays the same song twice',
                '🍸 "Temporal Cocktails" that alter your perception of time',
                '✨ Witness moments from Chifftown\'s past and future replay as visual echoes',
                '🕺 Compete in "time-synced" dance-offs for exclusive rewards'
            ],
            preview_image: '/images/chronos-preview.jpg',
            unlock_level: 20,
            generation: 4,
            rarity: 'epic',
            xp_reward: 250,
            fun_fact: 'Rumor has it that the club\'s DJ is a time traveler who collects beats from different eras.'
        },
        'aetherium': {
            name: 'The Aetherium Lab',
            tagline: 'Innovate the future',
            description: 'A high-tech research and development lab where Chifftown\'s brightest minds collaborate. Participate in groundbreaking experiments, design new virtual items, and shape the city of tomorrow.',
            features: [
                '🔬 Participate in community-wide scientific experiments with real impact',
                '🤖 Design and build your own custom drone companion',
                '💡 Submit ideas for new Chifftown features in the "Innovation Hub"',
                '🧬 Solve complex genetic sequencing puzzles for rewards',
                '🤝 Collaborate with other players on large-scale engineering projects'
            ],
            preview_image: '/images/aetherium-preview.jpg',
            unlock_level: 20,
            generation: 4,
            rarity: 'epic',
            xp_reward: 250,
            fun_fact: 'The Aetherium Lab is powered by a miniature fusion reactor, providing clean energy to the entire district.'
        }
    };

    // ========================================
    // STATE
    // ========================================
    
    let previewModal = null;
    let currentPreview = null;

    // ========================================
    // INITIALIZATION
    // ========================================
    
    function init() {
        console.log('🔍 Unlock Preview System initializing...');
        createPreviewModal();
        attachEventListeners();
        console.log('✅ Unlock Preview System ready!');
    }

    // ========================================
    // MODAL CREATION
    // ========================================
    
    function createPreviewModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'unlock-preview-modal';
        modal.innerHTML = `
            <div class="preview-overlay"></div>
            <div class="preview-container">
                <button class="preview-close" aria-label="Close preview">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <div class="preview-content">
                    <!-- Header with building name and status -->
                    <div class="preview-header">
                        <div class="preview-icon-large">🔒</div>
                        <div class="preview-title-section">
                            <h2 class="preview-building-name">Building Name</h2>
                            <p class="preview-tagline">Tagline goes here</p>
                        </div>
                        <div class="preview-badges">
                            <span class="preview-gen-badge">Gen 2</span>
                            <span class="preview-rarity-badge">Uncommon</span>
                        </div>
                    </div>

                    <!-- Preview image placeholder -->
                    <div class="preview-image-section">
                        <div class="preview-image-placeholder">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <p>Preview Image Coming Soon</p>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="preview-description">
                        <p class="preview-desc-text">Building description goes here...</p>
                    </div>

                    <!-- Features list -->
                    <div class="preview-features">
                        <h3 class="preview-section-title">🎯 Features & Activities</h3>
                        <ul class="preview-feature-list">
                            <!-- Features populated dynamically -->
                        </ul>
                    </div>

                    <!-- Fun fact -->
                    <div class="preview-fun-fact">
                        <span class="fun-fact-icon">💡</span>
                        <p class="fun-fact-text">Fun fact goes here!</p>
                    </div>

                    <!-- Unlock progress section -->
                    <div class="preview-unlock-section">
                        <div class="preview-unlock-header">
                            <span class="unlock-label">🔓 Unlock Requirements</span>
                            <span class="unlock-reward">+<span class="unlock-reward-amount">50</span> XP Reward</span>
                        </div>
                        
                        <div class="preview-progress-container">
                            <div class="preview-progress-info">
                                <span class="preview-current-level">Your Level: 3</span>
                                <span class="preview-required-level">Required: Level 5</span>
                            </div>
                            <div class="preview-progress-bar-container">
                                <div class="preview-progress-bar" style="width: 60%"></div>
                                <span class="preview-progress-text">60%</span>
                            </div>
                            <p class="preview-xp-needed">
                                <span class="xp-needed-amount">450</span> XP needed to unlock
                            </p>
                        </div>

                        <button class="preview-cta-button">
                            <span class="cta-icon">⚡</span>
                            <span class="cta-text">Earn XP to Unlock</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        previewModal = modal;

        // Close button handler
        modal.querySelector('.preview-close').addEventListener('click', closePreview);
        modal.querySelector('.preview-overlay').addEventListener('click', closePreview);
        
        // CTA button handler
        modal.querySelector('.preview-cta-button').addEventListener('click', handleCTA);
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    function attachEventListeners() {
        // Listen for clicks on locked buildings
        document.addEventListener('click', (e) => {
            const lockedBuilding = e.target.closest('.locked-building');
            if (lockedBuilding) {
                e.preventDefault();
                e.stopPropagation();
                const venueId = getVenueId(lockedBuilding);
                if (venueId && BUILDING_PREVIEWS[venueId]) {
                    showPreview(venueId);
                }
            }
        });

        // Keyboard support (ESC to close)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && previewModal.classList.contains('active')) {
                closePreview();
            }
        });
    }

    // ========================================
    // SHOW PREVIEW
    // ========================================
    
    function showPreview(venueId) {
        const data = BUILDING_PREVIEWS[venueId];
        if (!data) return;

        currentPreview = venueId;

        // Get player stats
        const playerLevel = window.GenerationSystem ? window.GenerationSystem.getPlayerLevel() : 1;
        const playerXP = window.XPEngine ? window.XPEngine.getPlayerStats().totalXP : 0;
        const requiredLevel = data.unlock_level;
        const requiredXP = calculateXPForLevel(requiredLevel);
        const xpNeeded = Math.max(0, requiredXP - playerXP);
        const progress = Math.min(100, (playerXP / requiredXP) * 100);

        // Populate modal
        const modal = previewModal;
        
        // Header
        modal.querySelector('.preview-building-name').textContent = data.name;
        modal.querySelector('.preview-tagline').textContent = data.tagline;
        modal.querySelector('.preview-gen-badge').textContent = `Gen ${data.generation}`;
        modal.querySelector('.preview-gen-badge').style.background = getGenerationColor(data.generation);
        modal.querySelector('.preview-rarity-badge').textContent = capitalizeFirst(data.rarity);
        modal.querySelector('.preview-rarity-badge').className = `preview-rarity-badge rarity-${data.rarity}`;

        // Description
        modal.querySelector('.preview-desc-text').textContent = data.description;

        // Features
        const featuresList = modal.querySelector('.preview-feature-list');
        featuresList.innerHTML = '';
        data.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });

        // Fun fact
        modal.querySelector('.fun-fact-text').textContent = data.fun_fact;

        // Unlock section
        modal.querySelector('.unlock-reward-amount').textContent = data.xp_reward;
        modal.querySelector('.preview-current-level').textContent = `Your Level: ${playerLevel}`;
        modal.querySelector('.preview-required-level').textContent = `Required: Level ${requiredLevel}`;
        modal.querySelector('.preview-progress-bar').style.width = `${progress}%`;
        modal.querySelector('.preview-progress-text').textContent = `${Math.round(progress)}%`;
        modal.querySelector('.xp-needed-amount').textContent = xpNeeded;

        // Show modal with animation
        modal.classList.add('active');
        
        // Track analytics
        trackPreviewView(venueId);
    }

    // ========================================
    // CLOSE PREVIEW
    // ========================================
    
    function closePreview() {
        if (previewModal) {
            previewModal.classList.remove('active');
            currentPreview = null;
        }
    }

    // ========================================
    // CTA HANDLER
    // ========================================
    
    function handleCTA() {
        closePreview();
        
        // Show XP earning tips notification
        if (window.showNotification) {
            window.showNotification(
                '⚡ Earn XP by visiting venues, completing challenges, and playing games!',
                'info',
                5000
            );
        }

        // Open challenges panel if available
        if (typeof showChallenges === 'function') {
            setTimeout(() => showChallenges(), 300);
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    function getVenueId(element) {
        // Extract venue ID from element classes or data attributes
        const classes = element.className.split(' ');
        for (const cls of classes) {
            if (cls.startsWith('hotspot-')) {
                return cls.replace('hotspot-', '');
            }
        }
        return element.dataset.venue || element.dataset.building || null;
    }

    function calculateXPForLevel(level) {
        // Same formula as XP Engine
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    function getGenerationColor(gen) {
        const colors = {
            1: 'linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%)',
            2: 'linear-gradient(135deg, #29b6f6 0%, #01579b 100%)',
            3: 'linear-gradient(135deg, #0288d1 0%, #004c8c 100%)',
            4: 'linear-gradient(135deg, #01579b 0%, #002f6c 100%)'
        };
        return colors[gen] || colors[1];
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function trackPreviewView(venueId) {
        // Track preview views for analytics
        const views = JSON.parse(localStorage.getItem('preview_views') || '{}');
        views[venueId] = (views[venueId] || 0) + 1;
        localStorage.setItem('preview_views', JSON.stringify(views));
        
        console.log(`📊 Preview view: ${venueId} (${views[venueId]} total views)`);
    }

    // ========================================
    // PUBLIC API
    // ========================================
    
    window.UnlockPreview = {
        init,
        showPreview,
        closePreview
    };

    // ========================================
    // AUTO-INITIALIZE
    // ========================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
