/**
 * seasonal-festival.js — ChiffTown Spring Festival
 * 
 * Time-limited seasonal event overlay:
 * - Map decorations (bunting, lanterns, cherry blossoms)
 * - Lucky Wheel spin mini-game (1 free spin/day, more for coins)
 * - 2x XP bonus indicator
 * - Festival badge for participating
 */

(function() {
    'use strict';

    // Festival config — change dates for different seasons
    const FESTIVAL = {
        name: 'Spring Festival',
        emoji: '🌸',
        active: true, // Toggle for instant enable/disable
        startDate: '2026-02-20',
        endDate: '2026-03-20',
        xpMultiplier: 2,
    };

    const WHEEL_PRIZES = [
        { label: '50 Coins', emoji: '🪙', type: 'coins', amount: 50, weight: 25 },
        { label: '100 Coins', emoji: '💰', type: 'coins', amount: 100, weight: 15 },
        { label: '250 Coins', emoji: '💎', type: 'coins', amount: 250, weight: 5 },
        { label: '25 XP', emoji: '⭐', type: 'xp', amount: 25, weight: 20 },
        { label: '75 XP', emoji: '🌟', type: 'xp', amount: 75, weight: 10 },
        { label: '200 XP', emoji: '✨', type: 'xp', amount: 200, weight: 3 },
        { label: 'Pet XP +50', emoji: '🐾', type: 'petxp', amount: 50, weight: 12 },
        { label: 'Nothing', emoji: '🍃', type: 'none', amount: 0, weight: 10 },
    ];

    const SPIN_COST = 25; // coins for extra spins

    function isActive() {
        if (!FESTIVAL.active) return false;
        const now = new Date();
        return now >= new Date(FESTIVAL.startDate) && now <= new Date(FESTIVAL.endDate + 'T23:59:59');
    }

    function init() {
        if (!isActive()) return;
        addMapDecorations();
        addFestivalBanner();
        addWheelButton();
        console.log(`🌸 ${FESTIVAL.name} is LIVE!`);
    }

    // === MAP DECORATIONS ===
    function addMapDecorations() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;

        // Inject festival CSS
        const style = document.createElement('style');
        style.id = 'festival-css';
        style.textContent = `
            .festival-petal {
                position: absolute; pointer-events: none; z-index: 50;
                font-size: 1rem; opacity: 0.7;
                animation: petalFall linear forwards;
            }
            @keyframes petalFall {
                0% { transform: translateY(-20px) rotate(0deg); opacity: 0.8; }
                100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
            }
            .festival-lantern {
                position: absolute; z-index: 45; font-size: 1.4rem;
                animation: lanternSway 3s ease-in-out infinite alternate;
                filter: drop-shadow(0 2px 4px rgba(244, 197, 66, 0.3));
            }
            @keyframes lanternSway {
                0% { transform: rotate(-5deg); }
                100% { transform: rotate(5deg); }
            }
            .festival-bunting {
                position: absolute; top: 0; left: 0; right: 0; z-index: 44;
                height: 30px; pointer-events: none;
                background: repeating-linear-gradient(
                    90deg,
                    transparent 0px, transparent 20px,
                    rgba(20, 184, 166, 0.15) 20px, rgba(20, 184, 166, 0.15) 22px
                );
            }

            /* Festival Banner */
            .festival-banner {
                position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
                background: linear-gradient(135deg, rgba(12, 45, 72, 0.95), rgba(20, 83, 116, 0.95));
                padding: 0.4rem 1rem;
                text-align: center; font-size: 0.8rem;
                color: #f4c542; font-weight: 600;
                border-bottom: 2px solid rgba(244, 197, 66, 0.3);
                display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                backdrop-filter: blur(8px);
                letter-spacing: 0.5px;
            }
            .festival-banner .xp-badge {
                background: rgba(244, 197, 66, 0.2); padding: 0.15rem 0.5rem;
                border-radius: 20px; font-size: 0.7rem; color: #f4c542;
            }
            .festival-banner .close-banner {
                position: absolute; right: 10px; background: none; border: none;
                color: rgba(244,197,66,0.5); cursor: pointer; font-size: 0.9rem;
            }

            /* Wheel Button */
            .festival-wheel-btn {
                position: fixed; bottom: 80px; right: 80px; z-index: 8400;
                width: 56px; height: 56px; border-radius: 50%;
                background: linear-gradient(135deg, #f4c542, #d4a017);
                border: 3px solid rgba(244, 197, 66, 0.5);
                color: #0a1628; font-size: 1.5rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 20px rgba(244, 197, 66, 0.3);
                transition: all 0.3s;
                animation: wheelPulse 2s ease-in-out infinite;
            }
            .festival-wheel-btn:hover { transform: scale(1.1); }
            @keyframes wheelPulse {
                0%, 100% { box-shadow: 0 4px 20px rgba(244, 197, 66, 0.3); }
                50% { box-shadow: 0 4px 30px rgba(244, 197, 66, 0.6); }
            }

            /* Wheel Modal */
            .wheel-modal-overlay {
                position: fixed; inset: 0; z-index: 10000;
                background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
                display: none; align-items: center; justify-content: center;
            }
            .wheel-modal-overlay.show { display: flex; }
            .wheel-modal {
                background: rgba(10, 22, 40, 0.98);
                border: 2px solid rgba(244, 197, 66, 0.3);
                border-radius: 20px; padding: 2rem;
                max-width: 400px; width: 90%; text-align: center;
                position: relative;
                animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes modalPop {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .wheel-modal h2 {
                font-size: 1.4rem; color: #f4c542; margin-bottom: 0.3rem;
            }
            .wheel-modal .subtitle {
                font-size: 0.8rem; color: rgba(226,232,240,0.5); margin-bottom: 1.5rem;
            }
            .wheel-close {
                position: absolute; top: 12px; right: 16px;
                background: none; border: none; color: rgba(226,232,240,0.4);
                font-size: 1.2rem; cursor: pointer;
            }

            /* Canvas Wheel */
            .wheel-canvas-wrap {
                position: relative; width: 280px; height: 280px;
                margin: 0 auto 1.2rem;
            }
            .wheel-canvas-wrap canvas {
                width: 100%; height: 100%;
                filter: drop-shadow(0 4px 15px rgba(244, 197, 66, 0.2));
            }
            .wheel-pointer {
                position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
                font-size: 1.8rem; z-index: 2;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            }

            .spin-btn {
                padding: 0.8rem 2rem; border-radius: 50px;
                background: linear-gradient(135deg, #14b8a6, #0d9488);
                color: #fff; font-weight: 700; font-size: 1rem;
                border: none; cursor: pointer; transition: all 0.3s;
                margin: 0.3rem;
            }
            .spin-btn:hover { transform: scale(1.05); }
            .spin-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
            .spin-btn.gold {
                background: linear-gradient(135deg, #f4c542, #d4a017);
                color: #0a1628;
            }
            .spin-info {
                font-size: 0.75rem; color: rgba(226,232,240,0.4); margin-top: 0.5rem;
            }

            /* Prize popup */
            .prize-display {
                font-size: 3rem; margin: 0.5rem 0;
                animation: prizeReveal 0.5s ease-out;
            }
            @keyframes prizeReveal {
                from { transform: scale(0) rotate(-180deg); }
                to { transform: scale(1) rotate(0deg); }
            }
            .prize-name {
                font-size: 1.1rem; font-weight: 700; color: #f4c542;
            }

            @media (max-width: 768px) {
                .festival-wheel-btn { bottom: 75px; right: 70px; width: 46px; height: 46px; font-size: 1.2rem; }
                .wheel-canvas-wrap { width: 240px; height: 240px; }
            }
        `;
        document.head.appendChild(style);

        // Cherry blossom petals falling
        function spawnPetal() {
            if (!document.getElementById('mapContainer')) return;
            const petal = document.createElement('div');
            petal.className = 'festival-petal';
            petal.textContent = ['🌸', '🏵️', '🍃'][Math.floor(Math.random() * 3)];
            petal.style.left = Math.random() * 100 + '%';
            petal.style.top = '-20px';
            petal.style.animationDuration = (4 + Math.random() * 4) + 's';
            petal.style.animationDelay = Math.random() * 2 + 's';
            petal.style.fontSize = (0.6 + Math.random() * 0.8) + 'rem';
            mapContainer.appendChild(petal);
            setTimeout(() => petal.remove(), 10000);
        }

        // Spawn petals periodically
        setInterval(spawnPetal, 800);
        for (let i = 0; i < 5; i++) setTimeout(spawnPetal, i * 200);

        // Lanterns at fixed positions
        const lanternPositions = [
            { left: '10%', top: '15%' }, { left: '30%', top: '8%' },
            { left: '55%', top: '12%' }, { left: '75%', top: '10%' },
            { left: '90%', top: '18%' },
        ];
        lanternPositions.forEach((pos, i) => {
            const lantern = document.createElement('div');
            lantern.className = 'festival-lantern';
            lantern.textContent = '🏮';
            lantern.style.left = pos.left;
            lantern.style.top = pos.top;
            lantern.style.animationDelay = (i * 0.5) + 's';
            mapContainer.appendChild(lantern);
        });
    }

    // === FESTIVAL BANNER ===
    function addFestivalBanner() {
        if (document.getElementById('festivalBanner')) return;
        if (sessionStorage.getItem('festival_banner_closed')) return;

        const banner = document.createElement('div');
        banner.className = 'festival-banner';
        banner.id = 'festivalBanner';
        banner.innerHTML = `
            ${FESTIVAL.emoji} <strong>${FESTIVAL.name}</strong> is LIVE!
            <span class="xp-badge">${FESTIVAL.xpMultiplier}x XP</span>
            Spin the Lucky Wheel for prizes! ${FESTIVAL.emoji}
            <button class="close-banner" onclick="this.parentElement.remove();sessionStorage.setItem('festival_banner_closed','1')">✕</button>
        `;
        document.body.prepend(banner);

        // Push body content down
        document.body.style.paddingTop = '32px';
    }

    // === LUCKY WHEEL ===
    function addWheelButton() {
        const btn = document.createElement('button');
        btn.className = 'festival-wheel-btn';
        btn.innerHTML = '🎡';
        btn.title = 'Lucky Wheel — Spin for prizes!';
        btn.addEventListener('click', openWheel);
        document.body.appendChild(btn);

        // Modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'wheel-modal-overlay';
        overlay.id = 'wheelOverlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeWheel();
        });
        document.body.appendChild(overlay);
    }

    let spinning = false;
    let wheelCanvas = null;
    let wheelCtx = null;
    let wheelRotation = 0;

    function openWheel() {
        const overlay = document.getElementById('wheelOverlay');
        const freeSpin = canFreeSpin();
        const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
        const coins = user.coins || 0;

        overlay.innerHTML = `
            <div class="wheel-modal">
                <button class="wheel-close" onclick="document.getElementById('wheelOverlay').classList.remove('show')">✕</button>
                <h2>🎡 Lucky Wheel</h2>
                <div class="subtitle">${FESTIVAL.name} — Spin for coins, XP & more!</div>
                <div class="wheel-canvas-wrap">
                    <div class="wheel-pointer">▼</div>
                    <canvas id="wheelCanvas" width="280" height="280"></canvas>
                </div>
                <div id="wheelResult"></div>
                <div id="wheelButtons">
                    <button class="spin-btn" id="freeSpinBtn" onclick="window._festivalSpin('free')" ${freeSpin ? '' : 'disabled'}>
                        ${freeSpin ? '🎰 Free Spin!' : '✓ Used Today'}
                    </button>
                    <button class="spin-btn gold" onclick="window._festivalSpin('paid')">
                        🪙 Spin (${SPIN_COST} coins)
                    </button>
                </div>
                <div class="spin-info">1 free spin per day • Extra spins cost ${SPIN_COST} coins</div>
            </div>
        `;
        overlay.classList.add('show');
        drawWheel();
    }

    function closeWheel() {
        document.getElementById('wheelOverlay')?.classList.remove('show');
    }

    function drawWheel() {
        wheelCanvas = document.getElementById('wheelCanvas');
        if (!wheelCanvas) return;
        wheelCtx = wheelCanvas.getContext('2d');
        const cx = 140, cy = 140, r = 130;
        const segments = WHEEL_PRIZES.length;
        const arc = (2 * Math.PI) / segments;

        const colors = ['#0c2d48', '#145374', '#0d9488', '#0c2d48', '#145374', '#0d9488', '#0c2d48', '#145374'];

        wheelCtx.clearRect(0, 0, 280, 280);
        wheelCtx.save();
        wheelCtx.translate(cx, cy);
        wheelCtx.rotate(wheelRotation);

        for (let i = 0; i < segments; i++) {
            const angle = i * arc;
            wheelCtx.beginPath();
            wheelCtx.moveTo(0, 0);
            wheelCtx.arc(0, 0, r, angle, angle + arc);
            wheelCtx.fillStyle = colors[i % colors.length];
            wheelCtx.fill();
            wheelCtx.strokeStyle = 'rgba(244, 197, 66, 0.3)';
            wheelCtx.lineWidth = 1;
            wheelCtx.stroke();

            // Label
            wheelCtx.save();
            wheelCtx.rotate(angle + arc / 2);
            wheelCtx.textAlign = 'right';
            wheelCtx.fillStyle = '#e2e8f0';
            wheelCtx.font = 'bold 11px Inter, sans-serif';
            wheelCtx.fillText(WHEEL_PRIZES[i].emoji + ' ' + WHEEL_PRIZES[i].label, r - 10, 4);
            wheelCtx.restore();
        }

        // Center circle
        wheelCtx.beginPath();
        wheelCtx.arc(0, 0, 20, 0, 2 * Math.PI);
        wheelCtx.fillStyle = '#f4c542';
        wheelCtx.fill();
        wheelCtx.fillStyle = '#0a1628';
        wheelCtx.font = 'bold 14px sans-serif';
        wheelCtx.textAlign = 'center';
        wheelCtx.fillText('🎡', 0, 5);

        wheelCtx.restore();
    }

    function canFreeSpin() {
        const last = localStorage.getItem('chifftown_wheel_date');
        return last !== new Date().toDateString();
    }

    function markFreeSpinUsed() {
        localStorage.setItem('chifftown_wheel_date', new Date().toDateString());
    }

    window._festivalSpin = async function(type) {
        if (spinning) return;

        const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
        const username = user.username || user.displayName;

        if (type === 'free' && !canFreeSpin()) return;
        if (type === 'paid') {
            // Deduct coins via API
            if (!username) { alert('Please log in first!'); return; }
            try {
                const res = await fetch('/api/wheel/spin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, type: 'paid' })
                });
                const data = await res.json();
                if (data.error) { alert(data.error); return; }
            } catch(e) { return; }
        }

        if (type === 'free') markFreeSpinUsed();

        spinning = true;
        document.querySelectorAll('.spin-btn').forEach(b => b.disabled = true);

        // Pick prize (weighted)
        const totalWeight = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
        let r = Math.random() * totalWeight;
        let prizeIndex = 0;
        for (let i = 0; i < WHEEL_PRIZES.length; i++) {
            r -= WHEEL_PRIZES[i].weight;
            if (r <= 0) { prizeIndex = i; break; }
        }

        const prize = WHEEL_PRIZES[prizeIndex];
        const segments = WHEEL_PRIZES.length;
        const arc = (2 * Math.PI) / segments;
        // Target: pointer at top (3π/2), land on segment center
        const targetAngle = (2 * Math.PI) - (prizeIndex * arc + arc / 2) - Math.PI / 2;
        const totalSpin = targetAngle + (Math.PI * 2 * (5 + Math.floor(Math.random() * 3)));

        // Animate spin
        const startRotation = wheelRotation;
        const duration = 3000;
        const startTime = Date.now();

        function animateSpin() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            wheelRotation = startRotation + totalSpin * eased;
            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                // Show result
                showPrize(prize, username, type);
                spinning = false;
            }
        }
        requestAnimationFrame(animateSpin);
    };

    async function showPrize(prize, username, type) {
        const resultEl = document.getElementById('wheelResult');
        resultEl.innerHTML = `
            <div class="prize-display">${prize.emoji}</div>
            <div class="prize-name">${prize.label}!</div>
        `;

        // Award prize server-side
        if (username && prize.type !== 'none') {
            try {
                await fetch('/api/wheel/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, prizeType: prize.type, amount: prize.amount })
                });
            } catch(e) {}

            if (prize.type === 'petxp' && window.ChiffPet) {
                window.ChiffPet.addXP(prize.amount);
            }
        }

        // Re-enable buttons after delay
        setTimeout(() => {
            const freeBtn = document.getElementById('freeSpinBtn');
            if (freeBtn) {
                if (canFreeSpin()) {
                    freeBtn.disabled = false;
                    freeBtn.textContent = '🎰 Free Spin!';
                } else {
                    freeBtn.disabled = true;
                    freeBtn.textContent = '✓ Used Today';
                }
            }
            document.querySelectorAll('.spin-btn.gold').forEach(b => b.disabled = false);
        }, 1500);
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
