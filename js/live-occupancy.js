// live-occupancy.js — Show live venue occupancy counts on the town map

(function() {
    let occupancyData = {};
    let socket = null;

    // Connect to socket for real-time updates
    function initSocket() {
        if (typeof io !== 'undefined') {
            socket = io();
            
            socket.on('connect', () => {
                console.log('✅ Connected to Chifftown for occupancy updates');
                updateOccupancy();
            });

            socket.on('room-updated', () => {
                updateOccupancy();
            });

            socket.on('user-joined', () => {
                updateOccupancy();
            });

            socket.on('user-left', () => {
                updateOccupancy();
            });
        }
    }

    // Fetch occupancy from server
    async function updateOccupancy() {
        try {
            const res = await fetch('/api/occupancy');
            occupancyData = await res.json();
            displayOccupancy();
        } catch (error) {
            console.error('Failed to fetch occupancy:', error);
        }
    }

    // Display occupancy badges on map hotspots
    function displayOccupancy() {
        const venueMap = {
            'adventure-hotspot': 'questing',
            'tavern-hotspot': 'pub',
            'nightclub-hotspot': 'nightclub',
            'cinema-hotspot': 'cinema',
            'arcade-hotspot': 'arcade',
            'lounge-hotspot': 'lounge',
            'wellness-hotspot': 'wellness'
        };

        Object.entries(venueMap).forEach(([className, venue]) => {
            const hotspot = document.querySelector(`.${className}`);
            if (!hotspot) return;

            const count = occupancyData[venue] || 0;
            
            // Remove existing badge
            const existingBadge = hotspot.querySelector('.occupancy-badge');
            if (existingBadge) existingBadge.remove();

            // Add new badge if people are present
            if (count > 0) {
                const badge = document.createElement('div');
                badge.className = 'occupancy-badge';
                badge.innerHTML = `
                    <i class="fas fa-users"></i>
                    <span>${count}</span>
                `;
                hotspot.appendChild(badge);
            }
        });
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initSocket();
            updateOccupancy();
            // Poll every 10 seconds as backup
            setInterval(updateOccupancy, 10000);
        });
    } else {
        initSocket();
        updateOccupancy();
        setInterval(updateOccupancy, 10000);
    }
})();
