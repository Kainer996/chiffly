// ============================================
// CHIFFTOWN ATMOSPHERE — Streetlamps + Town Clock
// ============================================
(function() {
    'use strict';

    // Streetlamp positions (% of map)
    const LAMPS = [
        { x: 12, y: 52 }, { x: 28, y: 48 }, { x: 42, y: 56 },
        { x: 58, y: 44 }, { x: 72, y: 50 }, { x: 86, y: 46 },
        { x: 20, y: 68 }, { x: 50, y: 65 }, { x: 78, y: 70 },
        { x: 35, y: 38 }, { x: 65, y: 36 },
    ];

    function init() {
        const map = document.getElementById('mapContainer');
        if (!map) { setTimeout(init, 500); return; }

        addLamps(map);
        addClock(map);
        updateTimeState();
        setInterval(updateTimeState, 60000);

        console.log('🏮 Town Atmosphere ready');
    }

    function addLamps(map) {
        const layer = document.createElement('div');
        layer.className = 'streetlamp-layer';
        layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:6;overflow:hidden;';

        LAMPS.forEach((pos, i) => {
            const lamp = document.createElement('div');
            lamp.className = 'streetlamp';
            lamp.style.left = pos.x + '%';
            lamp.style.top = pos.y + '%';
            lamp.innerHTML = `
                <div class="lamp-post">🏮</div>
                <div class="lamp-glow"></div>
            `;
            lamp.style.animationDelay = (i * 0.2) + 's';
            layer.appendChild(lamp);
        });
        map.appendChild(layer);
    }

    function addClock(map) {
        const clock = document.createElement('div');
        clock.id = 'townClock';
        clock.className = 'town-clock';
        clock.innerHTML = `
            <div class="tc-icon">🕐</div>
            <div class="tc-time" id="tcTime">--:--</div>
            <div class="tc-period" id="tcPeriod">...</div>
        `;
        map.appendChild(clock);
        updateClock();
        setInterval(updateClock, 1000);
    }

    function updateClock() {
        const now = new Date();
        const h = now.getUTCHours();
        const m = now.getUTCMinutes();
        const timeStr = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        const el = document.getElementById('tcTime');
        if (el) el.textContent = timeStr;

        const period = document.getElementById('tcPeriod');
        if (period) {
            if (h >= 5 && h < 8) period.textContent = '🌅 Dawn';
            else if (h >= 8 && h < 17) period.textContent = '☀️ Day';
            else if (h >= 17 && h < 20) period.textContent = '🌇 Dusk';
            else period.textContent = '🌙 Night';
        }

        // Update clock emoji
        const icon = document.querySelector('.tc-icon');
        if (icon) {
            const clockEmojis = ['🕛','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚'];
            icon.textContent = clockEmojis[h % 12];
        }
    }

    function updateTimeState() {
        // Toggle lamp visibility based on time
        const h = new Date().getUTCHours();
        const isNight = h >= 18 || h < 6;
        const isDusk = h >= 17 && h < 18;
        const isDawn = h >= 5 && h < 7;
        const lampsOn = isNight || isDusk || isDawn;

        document.querySelectorAll('.streetlamp').forEach(l => {
            l.classList.toggle('lit', lampsOn);
        });
    }

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        .streetlamp {
            position: absolute; transform: translate(-50%, -50%);
            display: flex; flex-direction: column; align-items: center;
        }
        .lamp-post { font-size: 16px; z-index: 1; opacity: 0.6; }
        .lamp-glow {
            position: absolute; top: -8px;
            width: 40px; height: 40px; border-radius: 50%;
            background: radial-gradient(circle, rgba(255,200,80,0.5) 0%, rgba(255,200,80,0) 70%);
            opacity: 0; transition: opacity 1s ease;
            pointer-events: none;
        }
        .streetlamp.lit .lamp-glow { opacity: 1; }
        .streetlamp.lit .lamp-post { opacity: 1; filter: drop-shadow(0 0 6px rgba(255,200,80,0.6)); }

        /* Town Clock */
        .town-clock {
            position: absolute; bottom: 12px; left: 12px;
            background: rgba(10,15,30,0.8); backdrop-filter: blur(8px);
            border: 1px solid rgba(201,168,76,0.2); border-radius: 12px;
            padding: 6px 12px; display: flex; align-items: center; gap: 6px;
            z-index: 20; font-size: 0.75rem; color: rgba(255,255,255,0.7);
            pointer-events: none;
        }
        .tc-icon { font-size: 1rem; }
        .tc-time { font-weight: 700; font-size: 0.85rem; color: #c9a84c; font-variant-numeric: tabular-nums; }
        .tc-period { font-size: 0.7rem; color: rgba(255,255,255,0.45); }
    `;
    document.head.appendChild(style);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
