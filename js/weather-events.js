// ============================================
// CHIFFTOWN SPECIAL WEATHER EVENTS
// ============================================
// Rare, exciting weather events that appear on the map
// with dramatic visual effects and reward online players
// ============================================

(function() {
    'use strict';

    const CONFIG = {
        checkInterval: 60000,        // Check for new event every 60s
        minTimeBetween: 300000,      // Min 5 min between events
        eventChance: 0.12,           // 12% chance per check (~1 event per 8 min)
        storageKey: 'chifftown_weather_events'
    };

    const EVENTS = [
        {
            id: 'thunderstorm',
            name: '⛈️ Thunderstorm',
            description: 'Lightning strikes across ChiffTown!',
            duration: 45000,
            xpReward: 50,
            coinReward: 10,
            rarity: 'common',
            color: '#4fc3f7'
        },
        {
            id: 'meteor_shower',
            name: '☄️ Meteor Shower',
            description: 'Shooting stars rain across the sky!',
            duration: 60000,
            xpReward: 100,
            coinReward: 25,
            rarity: 'rare',
            color: '#ff9800'
        },
        {
            id: 'aurora',
            name: '🌌 Aurora Borealis',
            description: 'The northern lights dance above the town!',
            duration: 90000,
            xpReward: 150,
            coinReward: 50,
            rarity: 'epic',
            color: '#00e676'
        },
        {
            id: 'blood_moon',
            name: '🌑 Blood Moon',
            description: 'A crimson moon rises over ChiffTown...',
            duration: 60000,
            xpReward: 200,
            coinReward: 75,
            rarity: 'legendary',
            color: '#f44336'
        },
        {
            id: 'golden_hour',
            name: '✨ Golden Hour',
            description: 'Everything glows with warm golden light!',
            duration: 50000,
            xpReward: 75,
            coinReward: 15,
            rarity: 'common',
            color: '#ffd54f'
        },
        {
            id: 'crystal_rain',
            name: '💎 Crystal Rain',
            description: 'Magical crystalline rain falls from the sky!',
            duration: 40000,
            xpReward: 125,
            coinReward: 35,
            rarity: 'rare',
            color: '#80deea'
        }
    ];

    // Weighted rarity for event selection
    const RARITY_WEIGHTS = { common: 40, rare: 25, epic: 15, legendary: 5 };

    let state = {
        activeEvent: null,
        lastEventTime: 0,
        eventsWitnessed: 0,
        container: null,
        bannerEl: null,
        checkTimer: null
    };

    // ========================================
    // INITIALIZATION
    // ========================================

    function init() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;

        // Load persisted state
        try {
            const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
            state.eventsWitnessed = saved.eventsWitnessed || 0;
            state.lastEventTime = saved.lastEventTime || 0;
        } catch(e) {}

        // Create event overlay container
        state.container = document.createElement('div');
        state.container.id = 'weatherEventOverlay';
        state.container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:hidden;';
        mapContainer.appendChild(state.container);

        // Inject styles
        injectStyles();

        // Start checking for events
        state.checkTimer = setInterval(checkForEvent, CONFIG.checkInterval);

        // First check after 30s
        setTimeout(checkForEvent, 30000);

        console.log('🌩️ Weather Events system initialized');
    }

    // ========================================
    // EVENT LOGIC
    // ========================================

    function checkForEvent() {
        if (state.activeEvent) return;
        if (Date.now() - state.lastEventTime < CONFIG.minTimeBetween) return;
        if (Math.random() > CONFIG.eventChance) return;

        // Pick a weighted random event
        const event = pickWeightedEvent();
        if (event) triggerEvent(event);
    }

    function pickWeightedEvent() {
        const weighted = [];
        EVENTS.forEach(e => {
            const w = RARITY_WEIGHTS[e.rarity] || 10;
            for (let i = 0; i < w; i++) weighted.push(e);
        });
        return weighted[Math.floor(Math.random() * weighted.length)];
    }

    function triggerEvent(event) {
        state.activeEvent = { ...event, startTime: Date.now() };
        state.lastEventTime = Date.now();
        state.eventsWitnessed++;
        saveState();

        // Show announcement banner
        showBanner(event);

        // Start visual effect
        startEffect(event);

        // Schedule end
        setTimeout(() => endEvent(event), event.duration);
    }

    function endEvent(event) {
        // Award rewards
        if (window.XPEngine && window.XPEngine.awardXP) {
            window.XPEngine.awardXP(event.xpReward, `${event.name} witnessed!`, true);
        }

        // Award coins via API
        awardCoins(event.coinReward);

        // Show completion banner
        showCompletionBanner(event);

        // Clean up effects
        state.container.innerHTML = '';
        state.activeEvent = null;
    }

    async function awardCoins(amount) {
        try {
            const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
            if (!user.username) return;
            await fetch('/api/coins/award', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, amount, reason: 'weather_event' })
            });
        } catch(e) {}
    }

    function saveState() {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify({
            eventsWitnessed: state.eventsWitnessed,
            lastEventTime: state.lastEventTime
        }));
    }

    // ========================================
    // VISUAL EFFECTS
    // ========================================

    function startEffect(event) {
        state.container.innerHTML = '';
        switch(event.id) {
            case 'thunderstorm': effectThunderstorm(); break;
            case 'meteor_shower': effectMeteorShower(); break;
            case 'aurora': effectAurora(); break;
            case 'blood_moon': effectBloodMoon(); break;
            case 'golden_hour': effectGoldenHour(); break;
            case 'crystal_rain': effectCrystalRain(); break;
        }
    }

    function effectThunderstorm() {
        // Dark overlay + lightning flashes
        const overlay = el('div', {
            style: 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(10,15,30,0.3);transition:background 0.1s;'
        });
        state.container.appendChild(overlay);

        // Rain intensifier
        const rain = el('div', { className: 'we-rain-heavy' });
        for (let i = 0; i < 80; i++) {
            const drop = el('div', { className: 'we-raindrop' });
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDelay = Math.random() * 2 + 's';
            drop.style.animationDuration = (0.4 + Math.random() * 0.3) + 's';
            rain.appendChild(drop);
        }
        state.container.appendChild(rain);

        // Lightning flashes
        let flashes = 0;
        const flashInterval = setInterval(() => {
            if (!state.activeEvent || state.activeEvent.id !== 'thunderstorm') {
                clearInterval(flashInterval);
                return;
            }
            overlay.style.background = 'rgba(200,220,255,0.4)';
            setTimeout(() => { overlay.style.background = 'rgba(10,15,30,0.3)'; }, 80);
            setTimeout(() => {
                overlay.style.background = 'rgba(180,200,255,0.25)';
                setTimeout(() => { overlay.style.background = 'rgba(10,15,30,0.3)'; }, 50);
            }, 150);
            flashes++;
        }, 2000 + Math.random() * 3000);
    }

    function effectMeteorShower() {
        const spawnMeteor = () => {
            if (!state.activeEvent || state.activeEvent.id !== 'meteor_shower') return;
            const meteor = el('div', { className: 'we-meteor' });
            meteor.style.left = (10 + Math.random() * 80) + '%';
            meteor.style.top = '-5%';
            meteor.style.animationDuration = (0.8 + Math.random() * 0.5) + 's';
            state.container.appendChild(meteor);
            setTimeout(() => meteor.remove(), 1500);
            setTimeout(spawnMeteor, 200 + Math.random() * 600);
        };
        spawnMeteor();
    }

    function effectAurora() {
        const aurora = el('div', { className: 'we-aurora' });
        for (let i = 0; i < 5; i++) {
            const band = el('div', { className: 'we-aurora-band' });
            band.style.animationDelay = (i * 0.8) + 's';
            band.style.top = (5 + i * 8) + '%';
            band.style.opacity = 0.3 + Math.random() * 0.3;
            aurora.appendChild(band);
        }
        state.container.appendChild(aurora);
    }

    function effectBloodMoon() {
        // Red overlay
        const overlay = el('div', {
            style: 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(180,20,20,0.12);animation:we-pulse-red 3s ease-in-out infinite;'
        });
        state.container.appendChild(overlay);

        // Moon
        const moon = el('div', { className: 'we-blood-moon' });
        state.container.appendChild(moon);
    }

    function effectGoldenHour() {
        const overlay = el('div', {
            style: 'position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(255,193,7,0.08) 0%,rgba(255,152,0,0.15) 100%);animation:we-golden-pulse 4s ease-in-out infinite;'
        });
        state.container.appendChild(overlay);

        // Floating golden particles
        for (let i = 0; i < 30; i++) {
            const p = el('div', { className: 'we-golden-particle' });
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 4 + 's';
            state.container.appendChild(p);
        }
    }

    function effectCrystalRain() {
        const spawnCrystal = () => {
            if (!state.activeEvent || state.activeEvent.id !== 'crystal_rain') return;
            const crystal = el('div', { className: 'we-crystal' });
            crystal.textContent = ['💎', '🔷', '🔹', '✦'][Math.floor(Math.random() * 4)];
            crystal.style.left = Math.random() * 100 + '%';
            crystal.style.animationDuration = (2 + Math.random() * 2) + 's';
            state.container.appendChild(crystal);
            setTimeout(() => crystal.remove(), 4500);
            setTimeout(spawnCrystal, 150 + Math.random() * 400);
        };
        spawnCrystal();
    }

    // ========================================
    // UI ELEMENTS
    // ========================================

    function showBanner(event) {
        removeBanner();
        const rarityLabel = { common: '', rare: '⭐ RARE', epic: '🌟 EPIC', legendary: '👑 LEGENDARY' };
        const banner = el('div', { className: 'we-banner we-banner-enter', id: 'weatherEventBanner' });
        banner.innerHTML = `
            <div class="we-banner-rarity" style="color:${event.color}">${rarityLabel[event.rarity] || ''}</div>
            <div class="we-banner-name">${event.name}</div>
            <div class="we-banner-desc">${event.description}</div>
            <div class="we-banner-reward">🎁 +${event.xpReward} XP &nbsp;|&nbsp; 🪙 +${event.coinReward} coins when it ends</div>
            <div class="we-banner-timer" id="weBannerTimer"></div>
        `;
        document.body.appendChild(banner);
        state.bannerEl = banner;

        // Animate in
        requestAnimationFrame(() => banner.classList.remove('we-banner-enter'));

        // Update timer
        updateTimer(event);

        // Auto-hide banner after 8s (event continues)
        setTimeout(() => {
            if (banner.parentNode) {
                banner.classList.add('we-banner-exit');
                setTimeout(() => banner.remove(), 500);
            }
        }, 8000);
    }

    function showCompletionBanner(event) {
        removeBanner();
        const banner = el('div', { className: 'we-banner we-complete-banner', id: 'weatherEventBanner' });
        banner.innerHTML = `
            <div class="we-banner-name">🎉 ${event.name} Complete!</div>
            <div class="we-banner-reward we-reward-glow">+${event.xpReward} XP &nbsp;🪙 +${event.coinReward} coins earned!</div>
        `;
        document.body.appendChild(banner);

        setTimeout(() => {
            banner.classList.add('we-banner-exit');
            setTimeout(() => banner.remove(), 500);
        }, 5000);
    }

    function removeBanner() {
        const existing = document.getElementById('weatherEventBanner');
        if (existing) existing.remove();
    }

    function updateTimer(event) {
        const timerEl = document.getElementById('weBannerTimer');
        if (!timerEl || !state.activeEvent) return;
        const remaining = Math.max(0, event.duration - (Date.now() - state.activeEvent.startTime));
        timerEl.textContent = Math.ceil(remaining / 1000) + 's remaining';
        if (remaining > 0) setTimeout(() => updateTimer(event), 1000);
    }

    // ========================================
    // HELPERS
    // ========================================

    function el(tag, props) {
        const e = document.createElement(tag);
        if (props) Object.assign(e, props);
        return e;
    }

    // ========================================
    // STYLES
    // ========================================

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Weather Event Banner */
            .we-banner {
                position: fixed;
                top: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, rgba(15,26,46,0.95), rgba(10,15,30,0.98));
                border: 1px solid rgba(201,168,76,0.4);
                border-radius: 16px;
                padding: 20px 40px;
                text-align: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 40px rgba(0,0,0,0.5), 0 0 80px rgba(201,168,76,0.1);
                transition: opacity 0.5s, transform 0.5s;
                min-width: 300px;
            }
            .we-banner-enter { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            .we-banner-exit { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            .we-banner-rarity {
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-bottom: 4px;
            }
            .we-banner-name {
                font-family: 'Playfair Display', serif;
                font-size: 1.6rem;
                font-weight: 700;
                color: #f0eef6;
                margin-bottom: 4px;
            }
            .we-banner-desc {
                color: rgba(255,255,255,0.6);
                font-size: 0.9rem;
                margin-bottom: 8px;
            }
            .we-banner-reward {
                color: #c9a84c;
                font-size: 0.85rem;
                font-weight: 600;
            }
            .we-reward-glow {
                animation: we-reward-glow-anim 1s ease-in-out infinite alternate;
            }
            .we-banner-timer {
                color: rgba(255,255,255,0.4);
                font-size: 0.75rem;
                margin-top: 6px;
            }
            .we-complete-banner {
                border-color: rgba(201,168,76,0.6);
                box-shadow: 0 0 40px rgba(0,0,0,0.5), 0 0 60px rgba(201,168,76,0.2);
            }

            /* Rain */
            .we-rain-heavy {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
            }
            .we-raindrop {
                position: absolute;
                top: -10px;
                width: 2px;
                height: 18px;
                background: linear-gradient(to bottom, transparent, rgba(130,180,255,0.6));
                border-radius: 0 0 2px 2px;
                animation: we-rain-fall linear infinite;
            }
            @keyframes we-rain-fall {
                to { transform: translateY(800px); opacity: 0; }
            }

            /* Meteor */
            .we-meteor {
                position: absolute;
                width: 4px;
                height: 4px;
                background: #fff;
                border-radius: 50%;
                box-shadow: 0 0 6px 2px rgba(255,165,0,0.8), -20px 0 30px 3px rgba(255,120,0,0.4);
                animation: we-meteor-fall linear forwards;
            }
            @keyframes we-meteor-fall {
                0% { transform: translate(0, 0) rotate(35deg); opacity: 1; }
                100% { transform: translate(200px, 400px) rotate(35deg); opacity: 0; }
            }

            /* Aurora */
            .we-aurora {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 50%;
            }
            .we-aurora-band {
                position: absolute;
                width: 120%;
                left: -10%;
                height: 40px;
                background: linear-gradient(90deg,
                    transparent 0%,
                    rgba(0,230,118,0.15) 20%,
                    rgba(79,195,247,0.2) 40%,
                    rgba(0,230,118,0.25) 60%,
                    rgba(79,195,247,0.15) 80%,
                    transparent 100%
                );
                filter: blur(15px);
                animation: we-aurora-wave 6s ease-in-out infinite alternate;
                border-radius: 50%;
            }
            @keyframes we-aurora-wave {
                0% { transform: translateX(-5%) scaleY(1); }
                50% { transform: translateX(5%) scaleY(1.5); }
                100% { transform: translateX(-3%) scaleY(0.8); }
            }

            /* Blood Moon */
            .we-blood-moon {
                position: absolute;
                top: 8%;
                right: 15%;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: radial-gradient(circle, #e53935 0%, #b71c1c 60%, #4a0000 100%);
                box-shadow: 0 0 40px 15px rgba(229,57,53,0.3), 0 0 80px 30px rgba(229,57,53,0.1);
                animation: we-moon-pulse 4s ease-in-out infinite;
            }
            @keyframes we-moon-pulse {
                0%, 100% { box-shadow: 0 0 40px 15px rgba(229,57,53,0.3), 0 0 80px 30px rgba(229,57,53,0.1); }
                50% { box-shadow: 0 0 60px 25px rgba(229,57,53,0.4), 0 0 100px 40px rgba(229,57,53,0.15); }
            }
            @keyframes we-pulse-red {
                0%, 100% { background: rgba(180,20,20,0.08); }
                50% { background: rgba(180,20,20,0.15); }
            }

            /* Golden particles */
            .we-golden-particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: #ffd54f;
                border-radius: 50%;
                box-shadow: 0 0 8px 2px rgba(255,213,79,0.4);
                animation: we-golden-float 5s ease-in-out infinite;
            }
            @keyframes we-golden-float {
                0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                50% { transform: translateY(-30px) scale(1.3); opacity: 0.8; }
            }
            @keyframes we-golden-pulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }

            /* Crystal rain */
            .we-crystal {
                position: absolute;
                top: -30px;
                font-size: 16px;
                animation: we-crystal-fall linear forwards;
                filter: drop-shadow(0 0 6px rgba(128,222,234,0.5));
            }
            @keyframes we-crystal-fall {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                80% { opacity: 0.8; }
                100% { transform: translateY(600px) rotate(180deg); opacity: 0; }
            }

            @keyframes we-reward-glow-anim {
                from { text-shadow: 0 0 5px rgba(201,168,76,0.3); }
                to { text-shadow: 0 0 15px rgba(201,168,76,0.6); }
            }

            /* Mobile adjustments */
            @media (max-width: 768px) {
                .we-banner {
                    min-width: auto;
                    width: 90%;
                    padding: 15px 20px;
                    top: 80px;
                }
                .we-banner-name { font-size: 1.2rem; }
                .we-blood-moon { width: 40px; height: 40px; }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // START
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }

    // Expose for debugging
    window.WeatherEvents = {
        trigger: (id) => {
            const event = EVENTS.find(e => e.id === id);
            if (event) triggerEvent(event);
        },
        getState: () => state,
        events: EVENTS
    };

})();
