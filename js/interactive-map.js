// interactive-map.js — Enhanced town map with live occupancy and tooltips
(function() {
    const socket = io();
    const venueOccupancy = {};

    // Venue mapping
    const venueTypes = {
        'The Chiff Inn': 'pub',
        'Neon Pulse': 'nightclub',
        'Starlight Cinema': 'cinema',
        'Pixel Palace': 'arcade',
        'Velvet Sky': 'lounge',
        'Adventure Guild': 'questing',
        'The Wellness Centre': 'wellness',
        'Your Apartment': 'apartment',
        'The Golden Dice': 'casino'
    };

    // Request occupancy data
    function updateOccupancy() {
        fetch('/api/occupancy')
            .then(res => res.json())
            .then(data => {
                Object.assign(venueOccupancy, data);
                updateHotspots();
            })
            .catch(err => console.error('Failed to fetch occupancy:', err));
    }

    // Update hotspot tooltips and active states
    function updateHotspots() {
        document.querySelectorAll('.map-hotspot').forEach(hotspot => {
            const venueName = hotspot.dataset.venue;
            const venueType = venueTypes[venueName];
            const count = venueOccupancy[venueType] || 0;

            // Update tooltip
            const label = hotspot.querySelector('.hotspot-label');
            if (label) {
                const icon = label.textContent.split(' ')[0]; // Keep emoji
                label.innerHTML = count > 0 
                    ? `${icon} ${venueName} <span class="occupancy-badge">${count}</span>`
                    : `${icon} ${venueName}`;
            }

            // Add active pulse if occupied
            if (count > 0) {
                hotspot.classList.add('active');
            } else {
                hotspot.classList.remove('active');
            }

            // Update glow intensity based on occupancy
            const glow = hotspot.querySelector('.hotspot-glow');
            if (glow && count > 0) {
                glow.style.opacity = Math.min(0.3 + (count * 0.1), 0.8);
            }
        });
    }

    // Enhanced hover effects
    function enhanceHotspots() {
        document.querySelectorAll('.map-hotspot').forEach(hotspot => {
            hotspot.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.08) translateY(-4px)';
            });

            hotspot.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });

            // Touch support for mobile
            hotspot.addEventListener('touchstart', function(e) {
                // Show tooltip on first tap
                const label = this.querySelector('.hotspot-label');
                if (label && label.style.opacity === '0') {
                    e.preventDefault();
                    label.style.opacity = '1';
                    label.style.transform = 'translateX(-50%) translateY(0)';
                    
                    // Hide tooltip after 3 seconds
                    setTimeout(() => {
                        label.style.opacity = '0';
                        label.style.transform = 'translateX(-50%) translateY(10px)';
                    }, 3000);
                }
            });
        });
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        enhanceHotspots();
        updateOccupancy();
        
        // Update occupancy every 10 seconds
        setInterval(updateOccupancy, 10000);
    }

    // Listen for real-time occupancy updates
    socket.on('occupancy-update', (data) => {
        Object.assign(venueOccupancy, data);
        updateHotspots();
    });
})();
