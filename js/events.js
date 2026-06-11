// events.js — Town Events System for Chifftown
(function() {
    const eventsBanner = document.getElementById('eventsBanner');
    const eventText = document.getElementById('eventText');
    
    let activeEvents = [];
    
    // Load and display active events
    async function loadEvents() {
        try {
            const response = await fetch('/api/events');
            activeEvents = await response.json();
            displayEvents();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    function displayEvents() {
        if (activeEvents.length === 0) {
            eventsBanner.style.display = 'none';
            return;
        }
        
        // Show banner with first active event (rotate if multiple)
        let currentIndex = 0;
        
        function showEvent() {
            const event = activeEvents[currentIndex];
            let text = `🎉 ${event.name}`;
            
            if (event.venue) {
                text += ` — ${event.venue}`;
            }
            
            if (event.description) {
                text += ` • ${event.description}`;
            }
            
            if (event.xpMultiplier && event.xpMultiplier > 1) {
                text += ` • ${event.xpMultiplier}x XP!`;
            }
            
            eventText.textContent = text;
            eventsBanner.style.display = 'block';
            
            // Rotate to next event if multiple
            if (activeEvents.length > 1) {
                currentIndex = (currentIndex + 1) % activeEvents.length;
            }
        }
        
        showEvent();
        
        // Rotate events every 8 seconds if multiple
        if (activeEvents.length > 1) {
            setInterval(showEvent, 8000);
        }
    }
    
    // Listen for new events from server
    if (typeof io !== 'undefined') {
        const socket = io();
        socket.on('new-event', (event) => {
            // Check if event is currently active
            const now = Date.now();
            const start = new Date(event.startTime).getTime();
            const end = new Date(event.endTime).getTime();
            
            if (now >= start && now <= end) {
                activeEvents.push(event);
                displayEvents();
            }
        });
    }
    
    // Load events on page load
    loadEvents();
    
    // Refresh events every 5 minutes
    setInterval(loadEvents, 5 * 60 * 1000);
})();
