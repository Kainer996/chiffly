// ============================================
// CHIFFTOWN WALKING NPCs
// ============================================
// Animated townsfolk that walk between buildings on the map
// ============================================
(function() {
    'use strict';

    const NPC_TYPES = [
        { emoji: '🚶', name: 'Walker', speed: 0.8 },
        { emoji: '🚶‍♀️', name: 'Walker', speed: 0.9 },
        { emoji: '🧑‍💼', name: 'Business', speed: 1.0 },
        { emoji: '🧑‍🎤', name: 'Musician', speed: 0.7 },
        { emoji: '🧑‍🔬', name: 'Scientist', speed: 0.85 },
        { emoji: '🧙', name: 'Wizard', speed: 0.6 },
        { emoji: '🏃', name: 'Jogger', speed: 1.5 },
        { emoji: '🛹', name: 'Skater', speed: 1.3 },
        { emoji: '🧑‍🚀', name: 'Spacer', speed: 0.75 },
        { emoji: '🕵️', name: 'Detective', speed: 0.65 },
    ];

    // Waypoints as % of map dimensions (paths between buildings)
    const WAYPOINTS = [
        { x: 10, y: 45 }, { x: 20, y: 50 }, { x: 30, y: 42 },
        { x: 40, y: 55 }, { x: 50, y: 48 }, { x: 60, y: 52 },
        { x: 70, y: 45 }, { x: 80, y: 50 }, { x: 90, y: 47 },
        { x: 15, y: 65 }, { x: 35, y: 70 }, { x: 55, y: 68 },
        { x: 75, y: 72 }, { x: 25, y: 35 }, { x: 45, y: 30 },
        { x: 65, y: 33 }, { x: 85, y: 38 }, { x: 50, y: 60 },
    ];

    const MAX_NPCS = 6;
    let npcs = [];
    let container = null;
    let animFrameId = null;

    function init() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            setTimeout(init, 1000);
            return;
        }

        container = document.createElement('div');
        container.className = 'town-npcs-layer';
        container.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:8;overflow:hidden;';
        mapContainer.appendChild(container);

        // Spawn initial NPCs staggered
        for (let i = 0; i < MAX_NPCS; i++) {
            setTimeout(() => spawnNPC(), i * 2000);
        }

        // Inject styles
        injectStyles();
        // Start animation loop
        lastTime = performance.now();
        tick();

        console.log('🚶 Town NPCs initialized');
    }

    function injectStyles() {
        if (document.getElementById('town-npcs-css')) return;
        const s = document.createElement('style');
        s.id = 'town-npcs-css';
        s.textContent = `
            .town-npc {
                position: absolute;
                font-size: 18px;
                transition: opacity 0.5s ease;
                filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
                will-change: transform;
                z-index: 8;
            }
            .town-npc .npc-label {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 7px;
                color: rgba(255,255,255,0.6);
                background: rgba(0,0,0,0.5);
                padding: 1px 4px;
                border-radius: 3px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            }
            .town-npc:hover .npc-label { opacity: 1; }
            .town-npc.walking { animation: npcBob 0.5s ease-in-out infinite; }
            @keyframes npcBob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            /* Flip NPC when walking left */
            .town-npc.facing-left { transform: scaleX(-1); }
            .town-npc.facing-left .npc-label { transform: scaleX(-1) translateX(50%); }
        `;
        document.head.appendChild(s);
    }

    function randomWaypoint() {
        return WAYPOINTS[Math.floor(Math.random() * WAYPOINTS.length)];
    }

    function spawnNPC() {
        const type = NPC_TYPES[Math.floor(Math.random() * NPC_TYPES.length)];
        const start = randomWaypoint();
        const target = randomWaypoint();

        const el = document.createElement('div');
        el.className = 'town-npc walking';
        el.innerHTML = `<span class="npc-emoji">${type.emoji}</span><span class="npc-label">${type.name}</span>`;
        el.style.left = start.x + '%';
        el.style.top = start.y + '%';
        el.style.opacity = '0';
        container.appendChild(el);

        // Fade in
        requestAnimationFrame(() => { el.style.opacity = '1'; });

        const npc = {
            el,
            type,
            x: start.x,
            y: start.y,
            targetX: target.x,
            targetY: target.y,
            speed: type.speed * (0.8 + Math.random() * 0.4), // slight variance
            pauseUntil: 0,
            lifetime: 30000 + Math.random() * 60000, // 30-90 seconds
            born: performance.now()
        };

        npcs.push(npc);
        return npc;
    }

    let lastTime = 0;

    function tick() {
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1); // cap delta
        lastTime = now;

        npcs.forEach((npc, i) => {
            // Lifetime check
            if (now - npc.born > npc.lifetime) {
                npc.el.style.opacity = '0';
                setTimeout(() => {
                    npc.el.remove();
                    npcs.splice(npcs.indexOf(npc), 1);
                    // Respawn
                    setTimeout(() => spawnNPC(), 1000 + Math.random() * 3000);
                }, 500);
                return;
            }

            // Paused?
            if (now < npc.pauseUntil) return;

            // Move toward target
            const dx = npc.targetX - npc.x;
            const dy = npc.targetY - npc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.5) {
                // Reached target — pause, then pick new target
                npc.pauseUntil = now + 2000 + Math.random() * 4000;
                npc.el.classList.remove('walking');
                const newTarget = randomWaypoint();
                npc.targetX = newTarget.x;
                npc.targetY = newTarget.y;
                setTimeout(() => npc.el.classList.add('walking'), npc.pauseUntil - now);
                return;
            }

            // Normalize and move
            const moveSpeed = npc.speed * 3 * dt; // % per second
            const nx = dx / dist;
            const ny = dy / dist;
            npc.x += nx * moveSpeed;
            npc.y += ny * moveSpeed;

            npc.el.style.left = npc.x + '%';
            npc.el.style.top = npc.y + '%';

            // Flip direction
            if (nx < -0.1) {
                npc.el.classList.add('facing-left');
            } else if (nx > 0.1) {
                npc.el.classList.remove('facing-left');
            }
        });

        animFrameId = requestAnimationFrame(tick);
    }

    // Init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
