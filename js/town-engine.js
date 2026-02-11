/**
 * ChiffTown Interactive Map Engine
 * Simpsons Tapped Out-style city builder
 * 
 * Architecture:
 * - Canvas/div-based isometric grid
 * - Buildings are positioned sprites (HTML elements)
 * - Each user's layout saved to localStorage (later: server)
 * - Buildings can be dragged, placed, and rearranged
 * - Grid system for snapping
 */

const TownEngine = (() => {
    // === CONFIG ===
    const GRID_SIZE = 64; // px per grid cell
    const MAP_WIDTH = 2752;
    const MAP_HEIGHT = 1536;
    const STORAGE_KEY = 'chifftown_layout';

    // === BUILDING REGISTRY ===
    // All available buildings — unlock system can gate these later
    const BUILDINGS = {
        'chiff-inn': {
            name: 'The Chiff Inn',
            icon: '🍺',
            image: '/images/venue-bar.png',
            width: 2, height: 2, // grid cells
            link: '/pub.html',
            unlocked: true,
            category: 'venue'
        },
        'neon-pulse': {
            name: 'Neon Pulse',
            icon: '🎵',
            image: '/images/venue-nightclub.png',
            width: 2, height: 2,
            link: '/nightclub.html',
            unlocked: true,
            category: 'venue'
        },
        'starlight-cinema': {
            name: 'Starlight Cinema',
            icon: '🎬',
            image: '/images/venue-cinema.png',
            width: 2, height: 2,
            link: '/cinema.html',
            unlocked: true,
            category: 'venue'
        },
        'pixel-palace': {
            name: 'Pixel Palace',
            icon: '🎮',
            image: '/images/venue-arcade.png',
            width: 2, height: 2,
            link: '/games.html',
            unlocked: true,
            category: 'venue'
        },
        'velvet-sky': {
            name: 'Velvet Sky',
            icon: '🛋️',
            image: '/images/venue-lounge.png',
            width: 2, height: 2,
            link: '/lounge.html',
            unlocked: true,
            category: 'venue'
        },
        'adventure-guild': {
            name: 'Adventure Guild',
            icon: '⚔️',
            image: '/images/venue-adventure.png',
            width: 2, height: 2,
            link: '/questing.html',
            unlocked: true,
            category: 'venue'
        },
        'wellness-centre': {
            name: 'The Wellness Centre',
            icon: '🧘',
            image: '/images/wellness-centre-v2.png',
            width: 2, height: 2,
            link: '/wellness.html',
            unlocked: true,
            category: 'venue'
        },
        'apartment': {
            name: 'Your Apartment',
            icon: '🏠',
            image: '/images/apartment-building-v2.png',
            width: 2, height: 2,
            link: '/apartment.html',
            unlocked: true,
            category: 'residential'
        }
    };

    // === DEFAULT LAYOUT ===
    // Starting positions for new users (grid coords)
    const DEFAULT_LAYOUT = [
        { id: 'chiff-inn', gridX: 8, gridY: 12 },
        { id: 'neon-pulse', gridX: 3, gridY: 14 },
        { id: 'starlight-cinema', gridX: 14, gridY: 14 },
        { id: 'pixel-palace', gridX: 18, gridY: 12 },
        { id: 'velvet-sky', gridX: 30, gridY: 14 },
        { id: 'adventure-guild', gridX: 32, gridY: 6 },
        { id: 'wellness-centre', gridX: 1, gridY: 12 },
        { id: 'apartment', gridX: 34, gridY: 14 }
    ];

    // === STATE ===
    let mapContainer = null;
    let buildingElements = {};
    let currentLayout = [];
    let editMode = false;
    let dragState = null;

    // === INIT ===
    function init(containerId) {
        mapContainer = document.getElementById(containerId);
        if (!mapContainer) return;

        currentLayout = loadLayout();
        renderBuildings();
        setupEventListeners();
    }

    // === LAYOUT PERSISTENCE ===
    function loadLayout() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [...DEFAULT_LAYOUT];
    }

    function saveLayout() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLayout));
    }

    // === RENDERING ===
    function renderBuildings() {
        // Remove existing building elements
        Object.values(buildingElements).forEach(el => el.remove());
        buildingElements = {};

        currentLayout.forEach(placement => {
            const building = BUILDINGS[placement.id];
            if (!building) return;

            const el = document.createElement('a');
            el.href = editMode ? 'javascript:void(0)' : building.link;
            el.className = 'town-building';
            el.dataset.buildingId = placement.id;
            el.style.left = (placement.gridX / 43 * 100) + '%';
            el.style.top = (placement.gridY / 24 * 100) + '%';
            el.style.width = (building.width / 43 * 100) + '%';

            // Building image
            const img = document.createElement('img');
            img.src = building.image;
            img.alt = building.name;
            img.className = 'building-sprite';
            img.draggable = false;
            el.appendChild(img);

            // Label
            const label = document.createElement('div');
            label.className = 'building-label';
            label.textContent = building.name;
            el.appendChild(label);

            // Edit mode: drag handle
            if (editMode) {
                el.classList.add('editable');
                setupDrag(el, placement);
            }

            mapContainer.appendChild(el);
            buildingElements[placement.id] = el;
        });
    }

    // === DRAG & DROP ===
    function setupDrag(el, placement) {
        const onStart = (e) => {
            if (!editMode) return;
            e.preventDefault();
            const rect = mapContainer.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            dragState = {
                el,
                placement,
                startX: touch.clientX,
                startY: touch.clientY,
                origLeft: parseFloat(el.style.left),
                origTop: parseFloat(el.style.top),
                mapRect: rect
            };
            el.classList.add('dragging');
        };

        const onMove = (e) => {
            if (!dragState || dragState.el !== el) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const dx = (touch.clientX - dragState.startX) / dragState.mapRect.width * 100;
            const dy = (touch.clientY - dragState.startY) / dragState.mapRect.height * 100;
            el.style.left = Math.max(0, Math.min(95, dragState.origLeft + dx)) + '%';
            el.style.top = Math.max(0, Math.min(90, dragState.origTop + dy)) + '%';
        };

        const onEnd = () => {
            if (!dragState || dragState.el !== el) return;
            el.classList.remove('dragging');
            // Update placement in layout
            placement.gridX = Math.round(parseFloat(el.style.left) / 100 * 43);
            placement.gridY = Math.round(parseFloat(el.style.top) / 100 * 24);
            saveLayout();
            dragState = null;
        };

        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    function setupEventListeners() {
        // Listen for edit mode toggle
        document.addEventListener('town:editmode', (e) => {
            editMode = e.detail.enabled;
            renderBuildings();
        });
    }

    // === EDIT MODE ===
    function toggleEditMode() {
        editMode = !editMode;
        document.dispatchEvent(new CustomEvent('town:editmode', { detail: { enabled: editMode } }));
        return editMode;
    }

    function resetLayout() {
        currentLayout = [...DEFAULT_LAYOUT];
        saveLayout();
        renderBuildings();
    }

    // === PUBLIC API ===
    return {
        init,
        toggleEditMode,
        resetLayout,
        getBuildings: () => BUILDINGS,
        getLayout: () => currentLayout,
        addBuilding: (id, gridX, gridY) => {
            if (!BUILDINGS[id]) return false;
            currentLayout.push({ id, gridX, gridY });
            saveLayout();
            renderBuildings();
            return true;
        },
        removeBuilding: (id) => {
            currentLayout = currentLayout.filter(p => p.id !== id);
            saveLayout();
            renderBuildings();
        },
        isEditMode: () => editMode
    };
})();
