/**
 * pet-system.js — ChiffTown Pet Companions
 * 
 * Players adopt a pet that appears as a floating companion on every page.
 * Pets have names, moods, and level up as the owner plays.
 * Loaded globally via index.html / room pages.
 */

(function() {
    'use strict';

    const PETS = {
        cat:    { emoji: '🐱', name: 'Cat',    idle: ['purring...', 'napping...', 'watching birds...'] },
        dog:    { emoji: '🐶', name: 'Dog',    idle: ['wagging tail!', 'sniffing around...', 'panting happily!'] },
        fox:    { emoji: '🦊', name: 'Fox',    idle: ['being sneaky...', 'curled up...', 'exploring...'] },
        owl:    { emoji: '🦉', name: 'Owl',    idle: ['watching wisely...', 'hooting softly...', 'rotating head...'] },
        dragon: { emoji: '🐉', name: 'Dragon', idle: ['breathing smoke...', 'guarding treasure...', 'napping on gold...'] },
        penguin:{ emoji: '🐧', name: 'Penguin',idle: ['waddling around...', 'sliding on ice...', 'huddling...'] },
        bunny:  { emoji: '🐰', name: 'Bunny',  idle: ['hopping around...', 'munching carrots...', 'twitching nose...'] },
        wolf:   { emoji: '🐺', name: 'Wolf',   idle: ['howling softly...', 'prowling...', 'resting by the fire...'] },
    };

    const PET_LEVELS = [
        { level: 1, title: 'Baby',      xpNeeded: 0 },
        { level: 2, title: 'Young',     xpNeeded: 100 },
        { level: 3, title: 'Grown',     xpNeeded: 300 },
        { level: 4, title: 'Loyal',     xpNeeded: 600 },
        { level: 5, title: 'Veteran',   xpNeeded: 1000 },
        { level: 6, title: 'Elite',     xpNeeded: 2000 },
        { level: 7, title: 'Legendary', xpNeeded: 4000 },
    ];

    let petData = null; // { type, name, xp, adoptedAt }
    let petWidget = null;
    let tooltipEl = null;

    function init() {
        loadPet();
        if (!petData) return; // No pet adopted yet
        createWidget();
        startIdleLoop();
        console.log(`🐾 Pet System: ${petData.name} the ${PETS[petData.type]?.name || 'Pet'} is here!`);
    }

    function loadPet() {
        try {
            const saved = localStorage.getItem('chifftown_pet');
            if (saved) petData = JSON.parse(saved);
        } catch(e) {}
    }

    function savePet() {
        if (petData) localStorage.setItem('chifftown_pet', JSON.stringify(petData));
    }

    function getPetLevel() {
        if (!petData) return PET_LEVELS[0];
        for (let i = PET_LEVELS.length - 1; i >= 0; i--) {
            if (petData.xp >= PET_LEVELS[i].xpNeeded) return PET_LEVELS[i];
        }
        return PET_LEVELS[0];
    }

    function getNextLevel() {
        const current = getPetLevel();
        const idx = PET_LEVELS.findIndex(l => l.level === current.level);
        return PET_LEVELS[idx + 1] || null;
    }

    function createWidget() {
        if (!petData || document.getElementById('pet-companion')) return;
        const petInfo = PETS[petData.type] || PETS.cat;
        const level = getPetLevel();

        // Inject styles
        if (!document.getElementById('pet-system-css')) {
            const style = document.createElement('style');
            style.id = 'pet-system-css';
            style.textContent = `
                #pet-companion {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    z-index: 9000;
                    cursor: pointer;
                    user-select: none;
                    transition: transform 0.3s;
                }
                #pet-companion:hover { transform: scale(1.15); }
                #pet-companion .pet-sprite {
                    font-size: 2.2rem;
                    animation: petBounce 2s ease-in-out infinite;
                    filter: drop-shadow(0 2px 6px rgba(20, 184, 166, 0.3));
                    display: block;
                    text-align: center;
                }
                @keyframes petBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                #pet-companion .pet-name {
                    font-size: 0.65rem;
                    text-align: center;
                    color: #f4c542;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                    margin-top: -2px;
                }
                #pet-tooltip {
                    position: fixed;
                    bottom: 80px;
                    left: 20px;
                    z-index: 9001;
                    background: rgba(6, 13, 26, 0.95);
                    border: 1px solid rgba(20, 184, 166, 0.3);
                    border-radius: 12px;
                    padding: 0.8rem 1rem;
                    min-width: 180px;
                    font-family: 'Inter', sans-serif;
                    color: #e2e8f0;
                    font-size: 0.8rem;
                    display: none;
                    backdrop-filter: blur(8px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }
                #pet-tooltip.show { display: block; animation: fadeUp 0.2s ease-out; }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                #pet-tooltip .pt-header {
                    display: flex; align-items: center; gap: 0.5rem;
                    margin-bottom: 0.5rem; padding-bottom: 0.4rem;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }
                #pet-tooltip .pt-emoji { font-size: 1.5rem; }
                #pet-tooltip .pt-name { font-weight: 700; color: #f4c542; font-size: 0.9rem; }
                #pet-tooltip .pt-level { color: #14b8a6; font-size: 0.7rem; }
                #pet-tooltip .pt-xp-bar {
                    width: 100%; height: 5px; background: rgba(255,255,255,0.1);
                    border-radius: 3px; overflow: hidden; margin: 0.4rem 0;
                }
                #pet-tooltip .pt-xp-fill {
                    height: 100%; background: linear-gradient(90deg, #14b8a6, #f4c542);
                    border-radius: 3px; transition: width 0.5s;
                }
                #pet-tooltip .pt-mood {
                    color: rgba(226, 232, 240, 0.6); font-style: italic; font-size: 0.75rem;
                }
                #pet-tooltip .pt-actions {
                    margin-top: 0.5rem; display: flex; gap: 0.4rem;
                }
                #pet-tooltip .pt-actions button {
                    flex: 1; padding: 0.3rem; border-radius: 6px;
                    border: 1px solid rgba(20, 184, 166, 0.3);
                    background: rgba(20, 184, 166, 0.1);
                    color: #14b8a6; font-size: 0.7rem; cursor: pointer;
                    transition: background 0.2s;
                }
                #pet-tooltip .pt-actions button:hover {
                    background: rgba(20, 184, 166, 0.25);
                }
                .pet-reaction {
                    position: fixed; bottom: 55px; left: 35px;
                    font-size: 1.2rem; z-index: 9002;
                    animation: petReact 1s ease-out forwards;
                    pointer-events: none;
                }
                @keyframes petReact {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-30px) scale(1.3); }
                }
                @media (max-width: 768px) {
                    #pet-companion { bottom: 70px; left: 10px; }
                    #pet-companion .pet-sprite { font-size: 1.8rem; }
                    #pet-tooltip { bottom: 130px; left: 10px; }
                }
            `;
            document.head.appendChild(style);
        }

        // Create pet widget
        petWidget = document.createElement('div');
        petWidget.id = 'pet-companion';
        petWidget.innerHTML = `
            <span class="pet-sprite">${petInfo.emoji}</span>
            <span class="pet-name">${petData.name}</span>
        `;
        petWidget.addEventListener('click', toggleTooltip);
        document.body.appendChild(petWidget);

        // Create tooltip
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'pet-tooltip';
        updateTooltip();
        document.body.appendChild(tooltipEl);

        // Close tooltip on outside click
        document.addEventListener('click', (e) => {
            if (!petWidget.contains(e.target) && !tooltipEl.contains(e.target)) {
                tooltipEl.classList.remove('show');
            }
        });
    }

    function updateTooltip() {
        if (!tooltipEl || !petData) return;
        const petInfo = PETS[petData.type] || PETS.cat;
        const level = getPetLevel();
        const next = getNextLevel();
        const xpProgress = next ? ((petData.xp - level.xpNeeded) / (next.xpNeeded - level.xpNeeded) * 100) : 100;
        const mood = petInfo.idle[Math.floor(Math.random() * petInfo.idle.length)];

        tooltipEl.innerHTML = `
            <div class="pt-header">
                <span class="pt-emoji">${petInfo.emoji}</span>
                <div>
                    <div class="pt-name">${petData.name}</div>
                    <div class="pt-level">Lv.${level.level} ${level.title} ${petInfo.name}</div>
                </div>
            </div>
            <div class="pt-xp-bar"><div class="pt-xp-fill" style="width:${xpProgress}%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:rgba(226,232,240,0.5);">
                <span>XP: ${petData.xp}</span>
                <span>${next ? 'Next: ' + next.xpNeeded : 'MAX'}</span>
            </div>
            <div class="pt-mood">${mood}</div>
            <div class="pt-actions">
                <button onclick="window.ChiffPet.pet()">❤️ Pet</button>
                <button onclick="window.ChiffPet.feed()">🍖 Feed</button>
                <button onclick="window.ChiffPet.rename()">✏️ Rename</button>
            </div>
        `;
    }

    function toggleTooltip() {
        updateTooltip();
        tooltipEl.classList.toggle('show');
    }

    function showReaction(emoji) {
        const el = document.createElement('div');
        el.className = 'pet-reaction';
        el.textContent = emoji;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    function petAction() {
        showReaction('❤️');
        addPetXP(2);
    }

    function feedAction() {
        showReaction('😋');
        addPetXP(5);
    }

    function renameAction() {
        const newName = prompt('Rename your pet:', petData.name);
        if (newName && newName.trim()) {
            petData.name = newName.trim().slice(0, 16);
            savePet();
            if (petWidget) petWidget.querySelector('.pet-name').textContent = petData.name;
            updateTooltip();
            showReaction('✨');
        }
    }

    function addPetXP(amount) {
        if (!petData) return;
        const oldLevel = getPetLevel().level;
        petData.xp += amount;
        savePet();
        const newLevel = getPetLevel().level;
        if (newLevel > oldLevel) {
            showReaction('⬆️');
            setTimeout(() => showReaction('🎉'), 300);
        }
        updateTooltip();
        syncPetToServer();
    }

    function startIdleLoop() {
        // Random idle reactions
        setInterval(() => {
            if (Math.random() < 0.1 && petWidget) {
                const reactions = ['💤', '💭', '✨', '🎵', '💫'];
                showReaction(reactions[Math.floor(Math.random() * reactions.length)]);
            }
        }, 30000);
    }

    // Adopt a pet (called from shelter page)
    function adoptPet(type, name) {
        if (petData) return false; // Already have one
        if (!PETS[type]) return false;
        petData = {
            type,
            name: name.trim().slice(0, 16) || PETS[type].name,
            xp: 0,
            adoptedAt: Date.now()
        };
        savePet();
        createWidget();
        startIdleLoop();
        syncPetToServer();
        return true;
    }

    async function syncPetToServer() {
        try {
            const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
            const username = user.username || user.displayName;
            if (!username || !petData) return;
            await fetch('/api/pet/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pet: petData })
            });
        } catch(e) {}
    }

    // Public API
    window.ChiffPet = {
        adopt: adoptPet,
        addXP: addPetXP,
        getPet: () => petData,
        pet: petAction,
        feed: feedAction,
        rename: renameAction,
        PETS
    };

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
