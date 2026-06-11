// ============================================
// CHIFFTOWN GENERATION SYSTEM
// ============================================
// Manages building generations, unlock progression, and filtering
// Integrates with XP Engine for level-based unlocks
// ============================================

(function() {
    'use strict';

    // ========================================
    // GENERATION CONFIGURATION
    // ========================================
    
    const GENERATIONS = {
        1: {
            name: 'Genesis',
            theme: 'Classic Town Core',
            unlockLevel: 1,
            description: 'The original heart of Chifftown',
            color: '#4fc3f7',
            icon: '🏘️',
            buildings: ['pub', 'nightclub', 'cinema', 'apartment']
        },
        2: {
            name: 'Expansion',
            theme: 'Entertainment District',
            unlockLevel: 5,
            description: 'New venues for growing communities',
            color: '#29b6f6',
            icon: '🎮',
            buildings: ['arcade', 'lounge', 'billboard']
        },
        3: {
            name: 'Prosperity',
            theme: 'Luxury & Adventure',
            unlockLevel: 10,
            description: 'Premium experiences unlock',
            color: '#0288d1',
            icon: '⚔️',
            buildings: ['adventure', 'wellness', 'casino']
        },
        4: {
            name: 'Ascension',
            theme: 'The Future, Unlocked',
            unlockLevel: 20,
            description: 'Cutting-edge venues for elite citizens.',
            color: '#01579b',
            icon: '🚀',
            buildings: ['observatory', 'chronos', 'aetherium']
        }
    };

    // ========================================
    // BUILDING METADATA
    // ========================================
    // Maps venue IDs to generation and unlock requirements
    
    const BUILDING_META = {
        // Generation 1 - Always Available
        'pub': { generation: 1, requiredLevel: 1, rarity: 'common' },
        'nightclub': { generation: 1, requiredLevel: 1, rarity: 'common' },
        'cinema': { generation: 1, requiredLevel: 1, rarity: 'common' },
        'apartment': { generation: 1, requiredLevel: 1, rarity: 'common' },
        
        // Generation 2 - Unlock at Level 5
        'arcade': { generation: 2, requiredLevel: 5, rarity: 'uncommon' },
        'lounge': { generation: 2, requiredLevel: 5, rarity: 'uncommon' },
        'billboard': { generation: 2, requiredLevel: 5, rarity: 'uncommon' },
        
        // Generation 3 - Unlock at Level 10
        'adventure': { generation: 3, requiredLevel: 10, rarity: 'rare' },
        'wellness': { generation: 3, requiredLevel: 10, rarity: 'rare' },
        'casino': { generation: 3, requiredLevel: 10, rarity: 'rare' },

        // Generation 4 - Unlock at Level 20
        'observatory': { generation: 4, requiredLevel: 20, rarity: 'epic' },
        'chronos': { generation: 4, requiredLevel: 20, rarity: 'epic' },
        'aetherium': { generation: 4, requiredLevel: 20, rarity: 'epic' }
    };

    // ========================================
    // STATE
    // ========================================
    
    let currentGenFilter = 'all'; // 'all' or generation number
    let playerLevel = 1;
    let unlockedGenerations = [1];

    // ========================================
    // INITIALIZATION
    // ========================================
    
    function init() {
        console.log('🔮 Generation System initializing...');
        
        // Get player level from XP engine
        updatePlayerLevel();
        
        // Add generation data to hotspots
        enrichHotspots();
        
        // Apply initial unlock states
        updateBuildingLocks();
        
        // Initialize generation slider UI
        createGenerationUI();
        
        // Listen for XP updates
        document.addEventListener('xp-updated', handleXPUpdate);
        document.addEventListener('level-up', handleLevelUp);
        
        console.log('✅ Generation System ready!', {
            playerLevel,
            unlockedGenerations,
            totalBuildings: Object.keys(BUILDING_META).length
        });
    }

    // ========================================
    // PLAYER LEVEL SYNC
    // ========================================
    
    function updatePlayerLevel() {
        // Sync with XP Engine if available
        if (window.XPEngine && window.XPEngine.getPlayerStats) {
            const stats = window.XPEngine.getPlayerStats();
            playerLevel = stats.level || 1;
        } else {
            // Fallback: read from localStorage
            const xp = parseInt(localStorage.getItem('chiffly_user_xp') || '0');
            playerLevel = calculateLevel(xp);
        }
        
        // Update unlocked generations
        unlockedGenerations = Object.keys(GENERATIONS)
            .map(Number)
            .filter(gen => GENERATIONS[gen].unlockLevel <= playerLevel);
        
        return playerLevel;
    }
    
    function calculateLevel(xp) {
        // Simple level calculation (matches XP engine)
        let level = 1;
        let xpNeeded = 200;
        let totalXP = 0;
        
        while (totalXP + xpNeeded <= xp && level < 100) {
            totalXP += xpNeeded;
            level++;
            xpNeeded = Math.floor(200 * Math.pow(1.15, level - 1));
        }
        
        return level;
    }
    
    function handleXPUpdate(event) {
        const oldLevel = playerLevel;
        updatePlayerLevel();
        
        if (playerLevel !== oldLevel) {
            handleLevelUp();
        }
    }
    
    function handleLevelUp(event) {
        updatePlayerLevel();
        updateBuildingLocks();
        updateGenerationUI();
        
        // Check for newly unlocked generations
        const newGeneration = Object.values(GENERATIONS).find(
            gen => gen.unlockLevel === playerLevel && gen.unlockLevel > 1
        );
        
        if (newGeneration) {
            showGenerationUnlockNotification(newGeneration);
        }
    }

    // ========================================
    // HOTSPOT ENRICHMENT
    // ========================================
    
    function enrichHotspots() {
        const hotspots = document.querySelectorAll('.map-hotspot');
        
        hotspots.forEach(hotspot => {
            const venueId = getVenueId(hotspot);
            const meta = BUILDING_META[venueId];
            
            if (meta) {
                hotspot.setAttribute('data-generation', meta.generation);
                hotspot.setAttribute('data-unlock-level', meta.requiredLevel);
                hotspot.setAttribute('data-rarity', meta.rarity);
                
                // Add generation badge to tooltip
                addGenerationBadge(hotspot, meta);
            }
        });
    }
    
    function getVenueId(hotspot) {
        // Extract venue ID from class names
        const classList = Array.from(hotspot.classList);
        const venueClass = classList.find(c => c.endsWith('-hotspot'));
        
        if (venueClass) {
            return venueClass.replace('-hotspot', '');
        }
        
        // Fallback: check data-venue attribute
        const venueName = hotspot.getAttribute('data-venue');
        const venueMap = {
            'The Chiff Inn': 'pub',
            'Neon Pulse': 'nightclub',
            'Starlight Cinema': 'cinema',
            'Pixel Palace': 'arcade',
            'Velvet Sky': 'lounge',
            'Adventure Guild': 'adventure',
            'Good News 24': 'billboard',
            'The Wellness Centre': 'wellness',
            'Your Apartment': 'apartment',
            'The Golden Dice': 'casino'
        };
        
        return venueMap[venueName] || null;
    }
    
    function addGenerationBadge(hotspot, meta) {
        const tooltip = hotspot.querySelector('.venue-tooltip');
        if (!tooltip) return;
        
        const generation = GENERATIONS[meta.generation];
        const badge = document.createElement('div');
        badge.className = 'generation-badge';
        badge.innerHTML = `
            <span class="gen-icon">${generation.icon}</span>
            <span class="gen-text">Gen ${meta.generation}</span>
        `;
        badge.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: linear-gradient(135deg, ${generation.color}, ${adjustColor(generation.color, -20)});
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        tooltip.style.position = 'relative';
        tooltip.appendChild(badge);
    }

    // ========================================
    // BUILDING LOCKS & UNLOCKS
    // ========================================
    
    function updateBuildingLocks() {
        const hotspots = document.querySelectorAll('.map-hotspot[data-unlock-level]');
        
        hotspots.forEach(hotspot => {
            const requiredLevel = parseInt(hotspot.getAttribute('data-unlock-level')) || 1;
            const isLocked = playerLevel < requiredLevel;
            
            if (isLocked) {
                lockBuilding(hotspot, requiredLevel);
            } else {
                unlockBuilding(hotspot);
            }
        });
    }
    
    function lockBuilding(hotspot, requiredLevel) {
        hotspot.classList.add('locked-building');
        
        // Remove existing lock overlay if any
        const existingOverlay = hotspot.querySelector('.lock-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        // Create lock overlay
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'lock-overlay';
        lockOverlay.innerHTML = `
            <div class="lock-icon"><i class="fas fa-lock"></i></div>
            <div class="lock-level">Level ${requiredLevel}</div>
            <div class="lock-progress">
                <div class="lock-progress-bar" style="width: ${Math.min((playerLevel / requiredLevel) * 100, 99)}%"></div>
            </div>
        `;
        hotspot.appendChild(lockOverlay);
        
        // Prevent navigation
        hotspot.addEventListener('click', handleLockedClick);
    }
    
    function unlockBuilding(hotspot) {
        hotspot.classList.remove('locked-building');
        
        const lockOverlay = hotspot.querySelector('.lock-overlay');
        if (lockOverlay) {
            // Animate unlock
            lockOverlay.style.animation = 'unlockFade 0.5s ease forwards';
            setTimeout(() => lockOverlay.remove(), 500);
        }
        
        hotspot.removeEventListener('click', handleLockedClick);
    }
    
    function handleLockedClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const requiredLevel = parseInt(this.getAttribute('data-unlock-level')) || 1;
        const xpNeeded = getXPForLevel(requiredLevel) - getCurrentXP();
        
        showNotification(
            `🔒 Unlock at Level ${requiredLevel}! (${xpNeeded} XP needed)`,
            'warning'
        );
    }
    
    function getXPForLevel(targetLevel) {
        let totalXP = 0;
        for (let i = 1; i < targetLevel; i++) {
            totalXP += Math.floor(200 * Math.pow(1.15, i - 1));
        }
        return totalXP;
    }
    
    function getCurrentXP() {
        return parseInt(localStorage.getItem('chiffly_user_xp') || '0');
    }

    // ========================================
    // GENERATION UI (SLIDER/FILTER)
    // ========================================
    
    function createGenerationUI() {
        const mapContainer = document.querySelector('.interactive-map-container');
        if (!mapContainer) return;
        
        const genUI = document.createElement('div');
        genUI.id = 'generationUI';
        genUI.className = 'generation-ui';
        genUI.innerHTML = `
            <div class="gen-ui-header">
                <span class="gen-ui-title"><i class="fas fa-layer-group"></i> Generations</span>
                <button class="gen-ui-toggle" id="genUIToggle">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="gen-ui-content" id="genUIContent">
                <div class="gen-filter-buttons" id="genFilterButtons">
                    <button class="gen-filter-btn active" data-gen="all">
                        All Buildings
                    </button>
                </div>
                <div class="gen-info" id="genInfo"></div>
            </div>
        `;
        
        mapContainer.appendChild(genUI);
        
        // Add generation filter buttons
        const filterContainer = document.getElementById('genFilterButtons');
        Object.entries(GENERATIONS).forEach(([genNum, gen]) => {
            const isUnlocked = unlockedGenerations.includes(Number(genNum));
            const btn = document.createElement('button');
            btn.className = `gen-filter-btn ${!isUnlocked ? 'locked' : ''}`;
            btn.setAttribute('data-gen', genNum);
            btn.innerHTML = `
                <span class="gen-btn-icon">${gen.icon}</span>
                <span class="gen-btn-text">Gen ${genNum}</span>
                ${!isUnlocked ? `<i class="fas fa-lock gen-btn-lock"></i>` : ''}
            `;
            
            if (isUnlocked) {
                btn.addEventListener('click', () => filterByGeneration(genNum));
            } else {
                btn.addEventListener('click', () => {
                    showNotification(`🔒 Generation ${genNum} unlocks at Level ${gen.unlockLevel}!`, 'info');
                });
            }
            
            filterContainer.appendChild(btn);
        });
        
        // Toggle collapse
        document.getElementById('genUIToggle').addEventListener('click', toggleGenerationUI);
        
        // Show initial info
        updateGenerationInfo();
    }
    
    function updateGenerationUI() {
        const filterButtons = document.querySelectorAll('.gen-filter-btn[data-gen]');
        
        filterButtons.forEach(btn => {
            const genNum = parseInt(btn.getAttribute('data-gen'));
            if (genNum === 'all') return;
            
            const isUnlocked = unlockedGenerations.includes(genNum);
            btn.classList.toggle('locked', !isUnlocked);
            
            const lockIcon = btn.querySelector('.gen-btn-lock');
            if (lockIcon) {
                lockIcon.style.display = isUnlocked ? 'none' : 'inline';
            }
        });
        
        updateGenerationInfo();
    }
    
    function toggleGenerationUI() {
        const content = document.getElementById('genUIContent');
        const toggle = document.getElementById('genUIToggle');
        const ui = document.getElementById('generationUI');
        
        ui.classList.toggle('collapsed');
        const isCollapsed = ui.classList.contains('collapsed');
        
        toggle.querySelector('i').className = isCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
    
    function filterByGeneration(gen) {
        currentGenFilter = gen;
        
        // Update button states
        document.querySelectorAll('.gen-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-gen') == gen);
        });
        
        // Filter hotspots
        const hotspots = document.querySelectorAll('.map-hotspot[data-generation]');
        hotspots.forEach(hotspot => {
            const hotspotGen = hotspot.getAttribute('data-generation');
            if (gen === 'all' || hotspotGen == gen) {
                hotspot.style.display = '';
            } else {
                hotspot.style.display = 'none';
            }
        });
        
        updateGenerationInfo();
    }
    
    function updateGenerationInfo() {
        const infoDiv = document.getElementById('genInfo');
        if (!infoDiv) return;
        
        if (currentGenFilter === 'all') {
            const totalUnlocked = Object.values(BUILDING_META).filter(
                meta => meta.requiredLevel <= playerLevel
            ).length;
            const totalBuildings = Object.keys(BUILDING_META).length;
            
            infoDiv.innerHTML = `
                <div class="gen-info-stats">
                    <div class="stat-item">
                        <span class="stat-label">Unlocked</span>
                        <span class="stat-value">${totalUnlocked}/${totalBuildings}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Your Level</span>
                        <span class="stat-value">${playerLevel}</span>
                    </div>
                </div>
            `;
        } else {
            const gen = GENERATIONS[currentGenFilter];
            const buildingsInGen = gen.buildings.length;
            const unlockedInGen = gen.buildings.filter(
                bid => BUILDING_META[bid]?.requiredLevel <= playerLevel
            ).length;
            
            infoDiv.innerHTML = `
                <div class="gen-info-detail">
                    <div class="gen-detail-name">${gen.icon} ${gen.name}</div>
                    <div class="gen-detail-theme">${gen.theme}</div>
                    <div class="gen-detail-desc">${gen.description}</div>
                    <div class="gen-detail-stats">
                        <span>${unlockedInGen}/${buildingsInGen} buildings unlocked</span>
                    </div>
                </div>
            `;
        }
    }

    // ========================================
    // NOTIFICATIONS
    // ========================================
    
    function showGenerationUnlockNotification(generation) {
        showNotification(
            `🎉 Generation ${generation.name} Unlocked! New venues are now available!`,
            'success',
            5000
        );
        
        // Trigger celebration effect
        if (window.createConfetti) {
            window.createConfetti();
        }
    }
    
    function showNotification(message, type = 'info', duration = 3000) {
        // Use existing notification system or create basic one
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            alert(message);
        }
    }

    // ========================================
    // UTILITIES
    // ========================================
    
    function adjustColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    // ========================================
    // PUBLIC API
    // ========================================
    
    window.GenerationSystem = {
        init,
        filterByGeneration,
        getPlayerLevel: () => playerLevel,
        getUnlockedGenerations: () => unlockedGenerations,
        getBuildingMeta: (venueId) => BUILDING_META[venueId],
        getGeneration: (genNum) => GENERATIONS[genNum],
        updatePlayerLevel,
        updateBuildingLocks
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
