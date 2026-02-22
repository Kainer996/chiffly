// ============================================
// CHIFFTOWN ACHIEVEMENTS / TROPHY CASE
// ============================================
(function() {
    'use strict';

    const CATEGORIES = [
        { id: 'all', label: 'All', icon: '🏆' },
        { id: 'exploration', label: 'Exploration', icon: '🗺️' },
        { id: 'social', label: 'Social', icon: '💬' },
        { id: 'streaming', label: 'Streaming', icon: '📡' },
        { id: 'arcade', label: 'Arcade', icon: '🎮' },
        { id: 'progression', label: 'Progression', icon: '⭐' }
    ];

    const TIER_COLORS = {
        bronze: { bg: 'rgba(205,127,50,0.15)', border: '#cd7f32', glow: 'rgba(205,127,50,0.4)' },
        silver: { bg: 'rgba(192,192,192,0.15)', border: '#c0c0c0', glow: 'rgba(192,192,192,0.4)' },
        gold:   { bg: 'rgba(201,168,76,0.15)',  border: '#c9a84c', glow: 'rgba(201,168,76,0.4)' }
    };

    let modal = null;
    let activeCategory = 'all';

    function getUsername() {
        try { return localStorage.getItem('chifftown_username') || null; }
        catch(e) { return null; }
    }

    function createModal() {
        if (document.getElementById('achievementsModal')) return;
        const el = document.createElement('div');
        el.id = 'achievementsModal';
        el.className = 'ach-overlay';
        el.style.display = 'none';
        el.innerHTML = `
            <div class="ach-modal">
                <div class="ach-header">
                    <div class="ach-title"><span class="ach-title-icon">🏆</span> Trophy Case</div>
                    <div class="ach-summary" id="achSummary"></div>
                    <button class="ach-close" id="achClose">&times;</button>
                </div>
                <div class="ach-tabs" id="achTabs"></div>
                <div class="ach-grid" id="achGrid"></div>
            </div>
        `;
        document.body.appendChild(el);
        modal = el;

        // Build tabs
        const tabsEl = document.getElementById('achTabs');
        CATEGORIES.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'ach-tab' + (cat.id === 'all' ? ' active' : '');
            btn.dataset.cat = cat.id;
            btn.textContent = `${cat.icon} ${cat.label}`;
            btn.addEventListener('click', () => {
                activeCategory = cat.id;
                document.querySelectorAll('.ach-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderGrid();
            });
            tabsEl.appendChild(btn);
        });

        document.getElementById('achClose').addEventListener('click', close);
        el.addEventListener('click', (e) => { if (e.target === el) close(); });
    }

    let cachedData = null;

    async function fetchAchievements() {
        const username = getUsername();
        if (!username) return [];
        try {
            const res = await fetch(`/api/achievements/${encodeURIComponent(username)}`);
            if (!res.ok) return [];
            cachedData = await res.json();
            return cachedData;
        } catch(e) { return []; }
    }

    function renderGrid() {
        const grid = document.getElementById('achGrid');
        if (!grid || !cachedData) return;

        const filtered = activeCategory === 'all'
            ? cachedData
            : cachedData.filter(a => a.category === activeCategory);

        // Sort: unlocked first, then by percent desc
        filtered.sort((a, b) => {
            if (a.unlocked !== b.unlocked) return b.unlocked - a.unlocked;
            return b.percent - a.percent;
        });

        grid.innerHTML = filtered.map(a => {
            const tc = TIER_COLORS[a.tier] || TIER_COLORS.bronze;
            const unlocked = a.unlocked;
            const rewardText = [];
            if (a.xpReward) rewardText.push(`+${a.xpReward} XP`);
            if (a.coinReward) rewardText.push(`+${a.coinReward} 🪙`);

            return `
                <div class="ach-card ${unlocked ? 'unlocked' : 'locked'} tier-${a.tier}">
                    <div class="ach-icon-wrap" style="border-color:${unlocked ? tc.border : 'rgba(255,255,255,0.1)'}; box-shadow:${unlocked ? '0 0 12px ' + tc.glow : 'none'}">
                        <span class="ach-icon">${unlocked ? a.icon : '🔒'}</span>
                    </div>
                    <div class="ach-info">
                        <div class="ach-name">${a.name}</div>
                        <div class="ach-desc">${a.desc}</div>
                        <div class="ach-progress-bar">
                            <div class="ach-progress-fill" style="width:${a.percent}%; background:${tc.border}"></div>
                        </div>
                        <div class="ach-progress-text">${a.current}/${a.target} ${unlocked ? '✅' : `(${a.percent}%)`}</div>
                        ${rewardText.length ? `<div class="ach-reward">${rewardText.join(' · ')}</div>` : ''}
                    </div>
                    <div class="ach-tier-badge" style="color:${tc.border}">${a.tier.toUpperCase()}</div>
                </div>
            `;
        }).join('');
    }

    function updateSummary() {
        const el = document.getElementById('achSummary');
        if (!el || !cachedData) return;
        const unlocked = cachedData.filter(a => a.unlocked).length;
        const total = cachedData.length;
        el.textContent = `${unlocked}/${total} Unlocked`;
    }

    async function open() {
        if (!modal) createModal();
        modal.style.display = 'flex';
        await fetchAchievements();
        updateSummary();
        renderGrid();
        setTimeout(() => modal.classList.add('visible'), 10);
    }

    function close() {
        if (!modal) return;
        modal.classList.remove('visible');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    }

    // Init
    createModal();

    // Expose globally
    window.AchievementsSystem = { open, close };

    console.log('🏆 Achievements System initialized');
})();
