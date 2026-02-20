/**
 * ChiffTown Mobile Map Interaction
 * Enables pan, pinch-to-zoom, and tap interactions on mobile
 */

(function() {
    // Only run on mobile/tablet
    if (window.innerWidth > 768) return;
    
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    
    // === STATE ===
    let scale = 1;
    let minScale = 1;
    let maxScale = 3;
    let translateX = 0;
    let translateY = 0;
    let lastTouchDistance = 0;
    let lastTouchCenter = { x: 0, y: 0 };
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let activeTapHotspot = null;
    let hintTimeout = null;
    
    // === SETUP ===
    function init() {
        // Wrap the map content
        wrapMapContent();
        
        // Add mobile controls
        addMobileControls();
        
        // Add hint
        showHint();
        
        // Setup touch events
        setupTouchEvents();
        
        // Setup hotspot taps
        setupHotspotTaps();
        
        // Initial sizing
        fitMapToContainer();
    }
    
    // === WRAP MAP CONTENT ===
    function wrapMapContent() {
        const mapImage = mapContainer.querySelector('.city-map-image');
        const hotspots = Array.from(mapContainer.querySelectorAll('.map-hotspot'));
        
        const wrapper = document.createElement('div');
        wrapper.className = 'map-wrapper';
        wrapper.id = 'mapWrapper';
        
        // Move image and hotspots into wrapper
        wrapper.appendChild(mapImage);
        hotspots.forEach(hotspot => wrapper.appendChild(hotspot));
        
        mapContainer.appendChild(wrapper);
    }
    
    // === MOBILE CONTROLS ===
    function addMobileControls() {
        const controls = document.createElement('div');
        controls.className = 'mobile-map-controls';
        controls.innerHTML = `
            <button class="mobile-zoom-btn" id="zoomIn" aria-label="Zoom in">
                <i class="fas fa-plus"></i>
            </button>
            <button class="mobile-zoom-btn" id="zoomOut" aria-label="Zoom out">
                <i class="fas fa-minus"></i>
            </button>
            <button class="mobile-reset-btn" id="resetView" aria-label="Reset view">
                <i class="fas fa-undo"></i>
            </button>
        `;
        mapContainer.appendChild(controls);
        
        // Event listeners
        document.getElementById('zoomIn').addEventListener('click', () => zoomBy(0.3));
        document.getElementById('zoomOut').addEventListener('click', () => zoomBy(-0.3));
        document.getElementById('resetView').addEventListener('click', resetView);
    }
    
    // === HINT ===
    function showHint() {
        const hint = document.createElement('div');
        hint.className = 'map-hint';
        hint.innerHTML = '<i class="fas fa-hand-pointer"></i> Pinch to zoom • Drag to pan • Tap buildings';
        mapContainer.appendChild(hint);
        
        // Hide after 5 seconds
        hintTimeout = setTimeout(() => {
            hint.classList.add('hidden');
            setTimeout(() => hint.remove(), 300);
        }, 5000);
    }
    
    // === TOUCH EVENTS ===
    function setupTouchEvents() {
        const wrapper = document.getElementById('mapWrapper');
        
        mapContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        mapContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        mapContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    function handleTouchStart(e) {
        const touches = e.touches;
        
        if (touches.length === 1) {
            // Single touch - start panning
            isPanning = true;
            panStart = {
                x: touches[0].clientX - translateX,
                y: touches[0].clientY - translateY
            };
            mapContainer.classList.add('panning');
        } else if (touches.length === 2) {
            // Two touches - prepare for pinch zoom
            e.preventDefault();
            isPanning = false;
            
            const distance = getTouchDistance(touches);
            lastTouchDistance = distance;
            lastTouchCenter = getTouchCenter(touches);
        }
    }
    
    function handleTouchMove(e) {
        const touches = e.touches;
        
        if (touches.length === 1 && isPanning) {
            // Pan
            e.preventDefault();
            translateX = touches[0].clientX - panStart.x;
            translateY = touches[0].clientY - panStart.y;
            
            // Constrain panning
            constrainPan();
            updateTransform(false);
        } else if (touches.length === 2) {
            // Pinch zoom
            e.preventDefault();
            
            const distance = getTouchDistance(touches);
            const center = getTouchCenter(touches);
            
            if (lastTouchDistance > 0) {
                const scaleChange = distance / lastTouchDistance;
                const newScale = scale * scaleChange;
                
                // Zoom toward pinch center
                zoomToPoint(newScale, center);
            }
            
            lastTouchDistance = distance;
            lastTouchCenter = center;
        }
    }
    
    function handleTouchEnd(e) {
        if (e.touches.length < 2) {
            lastTouchDistance = 0;
        }
        
        if (e.touches.length === 0) {
            isPanning = false;
            mapContainer.classList.remove('panning');
        }
    }
    
    // === HOTSPOT TAPS ===
    function setupHotspotTaps() {
        const hotspots = mapContainer.querySelectorAll('.map-hotspot');
        
        hotspots.forEach(hotspot => {
            let tapTimer = null;
            let tapCount = 0;
            
            hotspot.addEventListener('click', function(e) {
                // First tap: show tooltip
                tapCount++;
                
                if (tapCount === 1) {
                    e.preventDefault();
                    
                    // Hide previous active hotspot
                    if (activeTapHotspot && activeTapHotspot !== this) {
                        activeTapHotspot.classList.remove('active-tap');
                    }
                    
                    // Show this tooltip
                    this.classList.add('active-tap');
                    activeTapHotspot = this;
                    
                    // Reset tap count after delay
                    tapTimer = setTimeout(() => {
                        tapCount = 0;
                    }, 400);
                } else if (tapCount === 2) {
                    // Second tap: navigate
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    // Let the link click through
                }
            });
        });
        
        // Hide tooltips when tapping outside
        mapContainer.addEventListener('click', function(e) {
            if (!e.target.closest('.map-hotspot') && activeTapHotspot) {
                activeTapHotspot.classList.remove('active-tap');
                activeTapHotspot = null;
            }
        });
    }
    
    // === ZOOM FUNCTIONS ===
    function zoomBy(delta) {
        const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
        const containerRect = mapContainer.getBoundingClientRect();
        const center = {
            x: containerRect.width / 2,
            y: containerRect.height / 2
        };
        zoomToPoint(newScale, center, true);
    }
    
    function zoomToPoint(newScale, point, smooth = false) {
        newScale = Math.max(minScale, Math.min(maxScale, newScale));
        
        // Calculate new translation to zoom toward point
        const scaleRatio = newScale / scale;
        const containerRect = mapContainer.getBoundingClientRect();
        
        const pointX = point.x - containerRect.left;
        const pointY = point.y - containerRect.top;
        
        translateX = pointX - (pointX - translateX) * scaleRatio;
        translateY = pointY - (pointY - translateY) * scaleRatio;
        
        scale = newScale;
        
        constrainPan();
        updateTransform(smooth);
    }
    
    function resetView() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform(true);
    }
    
    function fitMapToContainer() {
        const containerRect = mapContainer.getBoundingClientRect();
        const wrapper = document.getElementById('mapWrapper');
        const img = wrapper.querySelector('.city-map-image');
        
        // Wait for image to load
        if (img.naturalWidth === 0) {
            img.addEventListener('load', fitMapToContainer, { once: true });
            return;
        }
        
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = containerRect.width / containerRect.height;
        
        if (imageAspect > containerAspect) {
            // Image is wider - fit width
            img.style.width = '100%';
            img.style.height = 'auto';
        } else {
            // Image is taller - fit height
            img.style.width = 'auto';
            img.style.height = '100%';
        }
    }
    
    // === HELPERS ===
    function getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }
    
    function constrainPan() {
        const wrapper = document.getElementById('mapWrapper');
        const containerRect = mapContainer.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        const scaledWidth = wrapperRect.width;
        const scaledHeight = wrapperRect.height;
        
        const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
        
        translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
        translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
    }
    
    function updateTransform(smooth = false) {
        const wrapper = document.getElementById('mapWrapper');
        
        if (smooth) {
            wrapper.classList.add('smooth-transition');
            setTimeout(() => wrapper.classList.remove('smooth-transition'), 300);
        }
        
        wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    
    // === INIT ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            fitMapToContainer();
            resetView();
        }, 100);
    });
    
    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            fitMapToContainer();
        }, 200);
    });
})();
