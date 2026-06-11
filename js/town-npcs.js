// ============================================
// CHIFFTOWN WALKING NPCs + LIVE USER CHARACTERS
// ============================================
// Animated townsfolk + real logged-in users walking the map
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

    // Player character emojis (for real users)
    const PLAYER_EMOJIS = ['🧑', '👦', '👧', '🧒', '👩', '👨', '🧔', '👱', '👱‍♀️', '🧑‍🦱', '🧑‍🦰', '🧑‍🦳'];

    // Waypoints as % of map dimensions (paths between buildings)
    const WAYPOINTS = [
        { x: 8,  y: 55 }, { x: 15, y: 58 }, { x: 22, y: 52 },
        { x: 30, y: 60 }, { x: 38, y: 55 }, { x: 46, y: 62 },
        { x: 54, y: 58 }, { x: 62, y: 55 }, { x: 70, y: 60 },
        { x: 78, y: 56 }, { x: 86, y: 58 }, { x: 92, y: 54 },
        { x: 12, y: 72 }, { x: 26, y: 68 }, { x: 42, y: 70 },
        { x: 58, y: 68 }, { x: 74, y: 72 }, { x: 88, y: 66 },
        { x: 20, y: 45 }, { x: 35, y: 42 }, { x: 50, y: 47 },
        { x: 65, y: 44 }, { x: 80, y: 46 }, { x: 50, y: 64 },
    ];

    const MAX_NPCS = 6;
    let npcs = [];
    let players = {}; // username -> { el, npc data }
    let container = null;
    let animFrameId = null;
    let socket = null;
    let myUsername = null;

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

        injectStyles();
        lastTime = performance.now();
        tick();

        // Spawn background NPCs staggered
        for (let i = 0; i < MAX_NPCS; i++) {
            setTimeout(() => spawnNPC(), i * 2000 + 1000);
        }

        // Connect real user presence
        initPresence();

        console.log('🚶 Town NPCs + User Presence initialized');
    }

    // ---- REAL USER PRESENCE ----

    function initPresence() {
        // Get socket.io instance (already loaded by main-home.js)
        try {
            socket = window._chifftownSocket || io();
            window._chifftownSocket = socket;
        } catch(e) {
            // No socket available - silent fail
            return;
        }

        // Get current user from localStorage
        try {
            const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
            myUsername = user.displayName || user.username || null;
        } catch(e) {}

        // Announce our presence on the map
        if (myUsername && myUsername !== 'Guest') {
            socket.emit('map-join', { username: myUsername });
        }

        // Receive the full current user list
        socket.on('map-users-update', (users) => {
            if (!Array.isArray(users)) return;
            // Remove players no longer in the list
            const currentNames = new Set(users.map(u => u.username));
            for (const name in players) {
                if (!currentNames.has(name)) removePlayer(name);
            }
            // Add new players
            users.forEach(u => {
                if (!players[u.username]) spawnPlayer(u.username);
            });
        });

        // Someone joined the map
        socket.on('map-user-joined', (data) => {
            if (data && data.username && !players[data.username]) {
                spawnPlayer(data.username);
            }
        });

        // Someone left the map
        socket.on('map-user-left', (data) => {
            if (data && data.username) removePlayer(data.username);
        });

        // Also fetch current online users via REST as a fallback
        fetch('/api/online-users')
            .then(r => r.json())
            .then(users => {
                if (Array.isArray(users)) {
                    users.forEach(u => {
                        if (u.username && !players[u.username]) spawnPlayer(u.username);
                    });
                }
            })
            .catch(() => {});

        // Announce when leaving
        window.addEventListener('beforeunload', () => {
            if (socket && myUsername) socket.emit('map-leave');
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && socket && myUsername) socket.emit('map-leave');
            else if (!document.hidden && socket && myUsername) socket.emit('map-join', { username: myUsername });
        });
    }

    function spawnPlayer(username) {
        if (players[username]) return; // already exists

        const emoji = PLAYER_EMOJIS[Math.abs(hashCode(username)) % PLAYER_EMOJIS.length];
        const start = randomWaypoint();
        const target = randomWaypoint();

        const el = document.createElement('div');
        el.className = 'town-npc town-player walking';
        el.dataset.username = username;

        const isMe = username === myUsername;
        const nameClass = isMe ? 'player-name player-name-me' : 'player-name';

        el.innerHTML = `
            <div class="player-name-bubble ${isMe ? 'player-name-bubble-me' : ''}">
                ${isMe ? '⭐ ' : ''}${username}
            </div>
            <span class="npc-emoji">${emoji}</span>
        `;

        el.style.left = start.x + '%';
        el.style.top = start.y + '%';
        el.style.opacity = '0';
        container.appendChild(el);

        requestAnimationFrame(() => { el.style.opacity = '1'; });

        const data = {
            el,
            username,
            x: start.x,
            y: start.y,
            targetX: target.x,
            targetY: target.y,
            speed: 0.7 + Math.random() * 0.4,
            pauseUntil: 0,
            isPlayer: true
        };

        players[username] = data;
    }

    function removePlayer(username) {
        const p = players[username];
        if (!p) return;
        p.el.style.opacity = '0';
        setTimeout(() => {
            if (p.el.parentNode) p.el.remove();
        }, 500);
        delete players[username];
    }

    function hashCode(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return h;
    }

    // ---- GENERIC NPC SYSTEM ----

    function injectStyles() {
        if (document.getElementById('town-npcs-css')) return;
        const s = document.createElement('style');
        s.id = 'town-npcs-css';
        s.textContent = `
            .town-npc {
                position: absolute;
                font-size: 20px;
                transition: opacity 0.5s ease;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                will-change: transform;
                z-index: 8;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .town-npc .npc-emoji {
                line-height: 1;
                display: block;
            }
            .town-npc .npc-label {
                position: absolute;
                bottom: 110%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 7px;
                color: rgba(255,255,255,0.55);
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
            .town-npc.facing-left { transform: scaleX(-1); }
            .town-npc.facing-left .player-name-bubble { transform: translateX(-50%) scaleX(-1); }

            /* ── Real User Characters ── */
            .town-player {
                font-size: 22px;
                z-index: 9;
                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
            }
            .player-name-bubble {
                position: absolute;
                bottom: 110%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(8, 20, 40, 0.88);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                color: #a8d8ea;
                font-family: 'Inter', 'Poppins', sans-serif;
                font-size: 9px;
                font-weight: 600;
                letter-spacing: 0.3px;
                padding: 3px 8px;
                border-radius: 20px;
                border: 1px solid rgba(42, 157, 143, 0.4);
                white-space: nowrap;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                opacity: 0.92;
                transition: opacity 0.3s;
                margin-bottom: 2px;
                /* name stays visible always */
                display: block;
            }
            .player-name-bubble-me {
                background: rgba(12, 25, 50, 0.92);
                color: #e9c46a;
                border-color: rgba(201, 168, 76, 0.5);
                box-shadow: 0 2px 12px rgba(201, 168, 76, 0.2);
                font-size: 9px;
            }
            /* Subtle ring under player emoji */
            .town-player::after {
                content: '';
                position: absolute;
                bottom: -3px;
                left: 50%;
                transform: translateX(-50%);
                width: 16px;
                height: 5px;
                border-radius: 50%;
                background: rgba(42, 157, 143, 0.35);
                filter: blur(2px);
            }
            .town-player.facing-left::after {
                left: auto;
                right: -50%;
            }
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

        requestAnimationFrame(() => { el.style.opacity = '1'; });

        const npc = {
            el,
            type,
            x: start.x,
            y: start.y,
            targetX: target.x,
            targetY: target.y,
            speed: type.speed * (0.8 + Math.random() * 0.4),
            pauseUntil: 0,
            lifetime: 30000 + Math.random() * 60000,
            born: performance.now(),
            isPlayer: false
        };

        npcs.push(npc);
        return npc;
    }

    let lastTime = 0;

    function moveEntity(entity, dt, now) {
        if (now < entity.pauseUntil) return;

        const dx = entity.targetX - entity.x;
        const dy = entity.targetY - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.5) {
            entity.pauseUntil = now + 2000 + Math.random() * 4000;
            entity.el.classList.remove('walking');
            const newTarget = randomWaypoint();
            entity.targetX = newTarget.x;
            entity.targetY = newTarget.y;
            setTimeout(() => {
                if (entity.el.isConnected) entity.el.classList.add('walking');
            }, entity.pauseUntil - now);
            return;
        }

        const moveSpeed = entity.speed * 3 * dt;
        const nx = dx / dist;
        const ny = dy / dist;
        entity.x += nx * moveSpeed;
        entity.y += ny * moveSpeed;

        entity.el.style.left = entity.x + '%';
        entity.el.style.top = entity.y + '%';

        if (nx < -0.1) {
            entity.el.classList.add('facing-left');
        } else if (nx > 0.1) {
            entity.el.classList.remove('facing-left');
        }
    }

    function tick() {
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // Animate generic NPCs
        for (let i = npcs.length - 1; i >= 0; i--) {
            const npc = npcs[i];

            if (now - npc.born > npc.lifetime) {
                npc.el.style.opacity = '0';
                setTimeout(() => {
                    if (npc.el.parentNode) npc.el.remove();
                    npcs.splice(npcs.indexOf(npc), 1);
                    setTimeout(() => spawnNPC(), 1000 + Math.random() * 3000);
                }, 500);
                continue;
            }

            moveEntity(npc, dt, now);
        }

        // Animate player characters
        for (const username in players) {
            moveEntity(players[username], dt, now);
        }

        animFrameId = requestAnimationFrame(tick);
    }

    // Init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
