// ============================================
// CHIFFTOWN BUILDING PREVIEW TOOLTIPS
// ============================================
// Rich hover previews for map buildings showing
// venue info, occupancy, features, and status
// ============================================

(function() {
    'use strict';

    const VENUES = {
        'Adventure Guild': {
            icon: '⚔️',
            desc: 'Embark on quests, earn rewards, and forge your legend.',
            features: ['Quests', 'Parties', 'Loot'],
            theme: '#4caf50'
        },
        'The Chiff Inn': {
            icon: '🍺',
            desc: 'The cozy tavern where everyone knows your name. Video chat & chill.',
            features: ['Video Chat', 'Tipping', 'Emotes'],
            theme: '#c9a84c'
        },
        'Neon Pulse': {
            icon: '🎧',
            desc: 'Neon-drenched nightclub with music, vibes, and energy.',
            features: ['Music', 'DJ Booth', 'Dance Floor'],
            theme: '#00bcd4'
        },
        'Starlight Cinema': {
            icon: '🎬',
            desc: 'Watch movies together with live commentary and reactions.',
            features: ['Watch Parties', 'Screenings', 'Reactions'],
            theme: '#ef4444'
        },
        'Pixel Palace': {
            icon: '🕹️',
            desc: '10 arcade games — snake, pong, trivia, and more.',
            features: ['10 Games', 'Leaderboards', 'Multiplayer'],
            theme: '#7c3aed'
        },
        'Velvet Sky': {
            icon: '🛋️',
            desc: 'A chill lounge for relaxed conversations and good company.',
            features: ['Video Chat', 'Ambient', 'Relax'],
            theme: '#0891b2'
        },
        'Good News 24': {
            icon: '📰',
            desc: 'The town billboard — positive news from around the world.',
            features: ['News', 'Updates', 'Good Vibes'],
            theme: '#1e88e5'
        },
        'The Wellness Centre': {
            icon: '🧘',
            desc: 'Meditation, breathing exercises, and mindfulness tools.',
            features: ['Meditation', 'Breathing', 'Calm'],
            theme: '#26a69a'
        },
        'Your Apartment': {
            icon: '🏠',
            desc: 'Your personal space to customize and call home.',
            features: ['Customize', 'Storage', 'Chill'],
            theme: '#ff7043'
        },
        'The Golden Dice': {
            icon: '🎰',
            desc: 'Test your luck at the casino — slots, blackjack, and roulette.',
            features: ['Slots', 'Blackjack', 'Roulette'],
            theme: '#ffc107'
        },
        'Starfire Observatory': {
            icon: '🔭',
            desc: 'Gaze at the stars and explore the cosmos.',
            features: ['Stargazing', 'Telescope', 'Space'],
            theme: '#5c6bc0'
        },
        'The Chronos Club': {
            icon: '⌛',
            desc: 'World clocks, time capsules, countdowns, and stopwatch.',
            features: ['Clocks', 'Time Capsules', 'Facts'],
            theme: '#00bcd4'
        },
        'The Aetherium Lab': {
            icon: '🔬',
            desc: 'Particle physics, chemistry mixer, and space exploration.',
            features: ['Physics Sim', 'Chemistry', 'Space'],
            theme: '#00e5ff'
        }
    };

    let tooltip = null;
    let hideTimeout = null;

    function init() {
        // Create tooltip element
        tooltip = document.createElement('div');
        tooltip.id = 'buildingPreview';
        tooltip.className = 'bp-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        // Attach to all hotspots
        document.querySelectorAll('.map-hotspot').forEach(hotspot => {
            hotspot.addEventListener('mouseenter', onHover);
            hotspot.addEventListener('mouseleave', onLeave);
            hotspot.addEventListener('mousemove', onMove);
        });

        injectStyles();
        console.log('🏠 Building Preview system initialized');
    }

    function onHover(e) {
        clearTimeout(hideTimeout);
        const hotspot = e.currentTarget;
        const venueName = hotspot.dataset.venue || hotspot.dataset.tooltip || '';
        const venue = VENUES[venueName];
        if (!venue) return;

        // Get occupancy
        const badge = hotspot.querySelector('.occupancy-badge');
        const count = badge ? parseInt(badge.textContent) || 0 : 0;

        const featureTags = venue.features.map(f => 
            `<span class="bp-tag">${f}</span>`
        ).join('');

        const statusDot = count > 0 
            ? '<span class="bp-status bp-live"></span> Active' 
            : '<span class="bp-status bp-empty"></span> Empty';

        tooltip.innerHTML = `
            <div class="bp-header" style="border-color: ${venue.theme}">
                <span class="bp-icon">${venue.icon}</span>
                <div>
                    <div class="bp-name">${venueName}</div>
                    <div class="bp-occupancy">${statusDot} · ${count} ${count === 1 ? 'person' : 'people'}</div>
                </div>
            </div>
            <div class="bp-desc">${venue.desc}</div>
            <div class="bp-tags">${featureTags}</div>
            <div class="bp-hint">Click to enter →</div>
        `;

        tooltip.style.display = 'block';
        positionTooltip(e);

        // Animate in
        requestAnimationFrame(() => tooltip.classList.add('bp-visible'));
    }

    function onLeave() {
        tooltip.classList.remove('bp-visible');
        hideTimeout = setTimeout(() => {
            tooltip.style.display = 'none';
        }, 200);
    }

    function onMove(e) {
        positionTooltip(e);
    }

    function positionTooltip(e) {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;

        const mapRect = mapContainer.getBoundingClientRect();
        const ttWidth = 260;
        const ttHeight = 180;
        
        let x = e.clientX + 15;
        let y = e.clientY - 10;

        // Keep within viewport
        if (x + ttWidth > window.innerWidth - 10) x = e.clientX - ttWidth - 15;
        if (y + ttHeight > window.innerHeight - 10) y = window.innerHeight - ttHeight - 10;
        if (y < 10) y = 10;

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .bp-tooltip {
                position: fixed;
                z-index: 9999;
                width: 260px;
                background: linear-gradient(135deg, rgba(10,22,40,0.97), rgba(5,10,20,0.98));
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 14px;
                padding: 0;
                pointer-events: none;
                backdrop-filter: blur(16px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
                opacity: 0;
                transform: translateY(5px) scale(0.97);
                transition: opacity 0.18s ease, transform 0.18s ease;
                overflow: hidden;
            }
            .bp-tooltip.bp-visible {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            .bp-header {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px 10px;
                border-bottom: 2px solid rgba(0,188,212,0.2);
            }
            .bp-icon {
                font-size: 1.8rem;
                flex-shrink: 0;
            }
            .bp-name {
                font-family: 'Playfair Display', serif;
                font-size: 1rem;
                font-weight: 700;
                color: #f0eef6;
                line-height: 1.2;
            }
            .bp-occupancy {
                font-size: 0.72rem;
                color: rgba(255,255,255,0.5);
                margin-top: 2px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .bp-status {
                display: inline-block;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                margin-right: 2px;
            }
            .bp-live {
                background: #4ade80;
                box-shadow: 0 0 6px rgba(74,222,128,0.5);
            }
            .bp-empty {
                background: rgba(255,255,255,0.2);
            }
            .bp-desc {
                padding: 10px 14px;
                font-size: 0.8rem;
                color: rgba(255,255,255,0.65);
                line-height: 1.45;
            }
            .bp-tags {
                padding: 0 14px 10px;
                display: flex;
                gap: 5px;
                flex-wrap: wrap;
            }
            .bp-tag {
                background: rgba(0,188,212,0.08);
                border: 1px solid rgba(0,188,212,0.15);
                border-radius: 6px;
                padding: 2px 8px;
                font-size: 0.65rem;
                color: rgba(0,188,212,0.8);
                letter-spacing: 0.3px;
            }
            .bp-hint {
                padding: 6px 14px 10px;
                font-size: 0.65rem;
                color: rgba(201,168,76,0.5);
                text-align: right;
            }

            /* Hide on mobile/touch */
            @media (hover: none), (max-width: 768px) {
                .bp-tooltip { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
    } else {
        setTimeout(init, 500);
    }
})();
