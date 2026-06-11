// live-occupancy.js — Show live venue occupancy counts + activity pulses on the town map

(function() {
    let occupancyData = {};
    let prevOccupancy = {};
    let socket = null;

    const VENUE_MAP = {
        'adventure-hotspot': 'questing',
        'tavern-hotspot': 'pub',
        'nightclub-hotspot': 'nightclub',
        'cinema-hotspot': 'cinema',
        'arcade-hotspot': 'arcade',
        'lounge-hotspot': 'lounge',
        'wellness-hotspot': 'wellness',
        'casino-hotspot': 'casino'
    };

    const VENUE_NAMES = {
        questing: 'Adventure Guild', pub: 'The Chiff Inn', nightclub: 'Neon Pulse',
        cinema: 'Starlight Cinema', arcade: 'Pixel Palace', lounge: 'Velvet Sky',
        wellness: 'Wellness Centre', casino: 'The Golden Dice'
    };

    function initSocket() {
        if (typeof io !== 'undefined') {
            socket = io();
            socket.on('connect', () => {
                console.log('✅ Connected to Chifftown for occupancy updates');
                updateOccupancy();
            });
            socket.on('room-updated', () => updateOccupancy());
            socket.on('user-joined', () => updateOccupancy());
            socket.on('user-left', () => updateOccupancy());
        }
    }

    async function updateOccupancy() {
        try {
            const res = await fetch('/api/occupancy');
            const newData = await res.json();

            // Detect changes — pulse buildings where count increased
            Object.entries(VENUE_MAP).forEach(([className, venue]) => {
                const oldCount = prevOccupancy[venue] || 0;
                const newCount = newData[venue] || 0;
                if (newCount > oldCount) {
                    pulseBuilding(className, venue, newCount - oldCount);
                }
            });

            prevOccupancy = { ...occupancyData };
            occupancyData = newData;
            displayOccupancy();
        } catch (error) {
            console.error('Failed to fetch occupancy:', error);
        }
    }

    function displayOccupancy() {
        Object.entries(VENUE_MAP).forEach(([className, venue]) => {
            const hotspot = document.querySelector(`.${className}`);
            if (!hotspot) return;

            const count = occupancyData[venue] || 0;
            const existingBadge = hotspot.querySelector('.occupancy-badge');
            if (existingBadge) existingBadge.remove();

            if (count > 0) {
                const badge = document.createElement('div');
                badge.className = 'occupancy-badge';
                badge.innerHTML = `<i class="fas fa-users"></i><span>${count}</span>`;
                hotspot.appendChild(badge);
            }
        });
    }

    // Pulse effect on building when someone enters
    function pulseBuilding(className, venue, delta) {
        const hotspot = document.querySelector(`.${className}`);
        if (!hotspot) return;

        // Add pulse ring
        const ring = document.createElement('div');
        ring.className = 'occ-pulse-ring';
        hotspot.appendChild(ring);
        setTimeout(() => ring.remove(), 1500);

        // Show toast
        showActivityToast(venue, delta);
    }

    // Small toast notification at bottom of map
    let toastTimeout = null;
    function showActivityToast(venue, delta) {
        const name = VENUE_NAMES[venue] || venue;
        let toast = document.getElementById('occToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'occToast';
            toast.className = 'occ-toast';
            const mapContainer = document.getElementById('mapContainer');
            (mapContainer || document.body).appendChild(toast);
        }

        toast.textContent = `👋 ${delta > 1 ? delta + ' people joined' : 'Someone joined'} ${name}`;
        toast.classList.remove('occ-toast-show');
        void toast.offsetWidth; // reflow
        toast.classList.add('occ-toast-show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('occ-toast-show'), 3000);
    }

    // Inject styles
    function injectStyles() {
        const s = document.createElement('style');
        s.textContent = `
            .occ-pulse-ring {
                position: absolute;
                top: 50%; left: 50%;
                width: 100%; height: 100%;
                transform: translate(-50%, -50%);
                border: 2px solid rgba(0,188,212,0.6);
                border-radius: 50%;
                animation: occ-pulse-expand 1.2s ease-out forwards;
                pointer-events: none;
                z-index: 5;
            }
            @keyframes occ-pulse-expand {
                0% { width: 100%; height: 100%; opacity: 1; }
                100% { width: 250%; height: 250%; opacity: 0; }
            }
            .occ-toast {
                position: absolute;
                bottom: 15px; left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(10,22,40,0.92);
                border: 1px solid rgba(0,188,212,0.2);
                backdrop-filter: blur(10px);
                color: rgba(255,255,255,0.85);
                font-size: 0.78rem;
                font-weight: 500;
                padding: 8px 18px;
                border-radius: 20px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                z-index: 100;
                transition: opacity 0.3s, transform 0.3s;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }
            .occ-toast-show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        `;
        document.head.appendChild(s);
    }

    // Initialize
    function start() {
        injectStyles();
        initSocket();
        updateOccupancy();
        setInterval(updateOccupancy, 10000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
