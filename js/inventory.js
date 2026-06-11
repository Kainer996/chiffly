// ChiffTown Inventory System
// Manages furniture items and placement in apartments

const STORAGE_KEYS = {
    inventory: 'chifftown_inventory',
    placed: 'chifftown_placed',
    profile: 'chifftown_profile'
};

// All available furniture with level requirements
const ALL_FURNITURE = [
    // Level 1 - Starter furniture
    {
        id: 'sofa-basic',
        name: 'Basic Sofa',
        description: 'A comfortable two-seater sofa',
        emoji: '🛋️',
        category: 'seating',
        levelRequired: 1
    },
    {
        id: 'bed-basic',
        name: 'Basic Bed',
        description: 'A simple but cozy bed',
        emoji: '🛏️',
        category: 'bedroom',
        levelRequired: 1
    },
    {
        id: 'table-basic',
        name: 'Coffee Table',
        description: 'A low wooden coffee table',
        emoji: '🪑',
        category: 'furniture',
        levelRequired: 1
    },
    {
        id: 'lamp-basic',
        name: 'Floor Lamp',
        description: 'Warm ambient lighting',
        emoji: '💡',
        category: 'lighting',
        levelRequired: 1
    },
    {
        id: 'plant-basic',
        name: 'Potted Plant',
        description: 'Adds life to any room',
        emoji: '🪴',
        category: 'decor',
        levelRequired: 1
    },
    
    // Level 2
    {
        id: 'bookshelf-basic',
        name: 'Bookshelf',
        description: 'Display your favorite books',
        emoji: '📚',
        category: 'storage',
        levelRequired: 2
    },
    {
        id: 'tv-basic',
        name: 'Flat Screen TV',
        description: 'Entertainment center',
        emoji: '📺',
        category: 'electronics',
        levelRequired: 2
    },
    {
        id: 'rug-basic',
        name: 'Area Rug',
        description: 'Ties the room together',
        emoji: '🟫',
        category: 'decor',
        levelRequired: 2
    },
    
    // Level 3
    {
        id: 'jukebox',
        name: 'Jukebox',
        description: 'Play your favorite tunes',
        emoji: '🎵',
        category: 'electronics',
        levelRequired: 3
    },
    {
        id: 'game-console',
        name: 'Game Console',
        description: 'Gaming setup',
        emoji: '🎮',
        category: 'electronics',
        levelRequired: 3
    },
    {
        id: 'aquarium',
        name: 'Aquarium',
        description: 'Peaceful underwater scene',
        emoji: '🐟',
        category: 'decor',
        levelRequired: 3
    },
    
    // Level 4
    {
        id: 'fireplace',
        name: 'Fireplace',
        description: 'Warm and cozy atmosphere',
        emoji: '🔥',
        category: 'decor',
        levelRequired: 4
    },
    {
        id: 'piano',
        name: 'Grand Piano',
        description: 'Elegant musical instrument',
        emoji: '🎹',
        category: 'furniture',
        levelRequired: 4
    },
    {
        id: 'bar-cart',
        name: 'Bar Cart',
        description: 'Sophisticated drink station',
        emoji: '🍷',
        category: 'furniture',
        levelRequired: 4
    },
    
    // Level 5
    {
        id: 'disco-ball',
        name: 'Disco Ball',
        description: 'Party time!',
        emoji: '🪩',
        category: 'lighting',
        levelRequired: 5
    },
    {
        id: 'neon-sign',
        name: 'Neon Sign',
        description: 'Custom neon lighting',
        emoji: '💫',
        category: 'lighting',
        levelRequired: 5
    },
    {
        id: 'trophy-case',
        name: 'Trophy Case',
        description: 'Display your achievements',
        emoji: '🏆',
        category: 'storage',
        levelRequired: 5
    }
];

// Get default inventory based on level
function getDefaultInventory(level = 1) {
    return ALL_FURNITURE.filter(item => item.levelRequired <= level);
}

// Initialize inventory based on user level
async function initInventory() {
    const placed = localStorage.getItem(STORAGE_KEYS.placed);
    if (!placed) {
        localStorage.setItem(STORAGE_KEYS.placed, JSON.stringify({}));
    }
    
    // Get user level from server
    const username = localStorage.getItem('chifftown_username');
    if (username) {
        try {
            const response = await fetch(`/api/user/${username}`);
            const userData = await response.json();
            const userLevel = userData.level || 1;
            
            // Unlock furniture based on level
            const unlockedItems = getDefaultInventory(userLevel);
            localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(unlockedItems));
            
            return { level: userLevel, itemsUnlocked: unlockedItems.length };
        } catch (error) {
            console.error('Error fetching user level:', error);
            // Fallback to level 1
            localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(getDefaultInventory(1)));
        }
    } else {
        // Guest user - level 1 only
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(getDefaultInventory(1)));
    }
}

// Get all inventory items
function getInventory() {
    initInventory();
    const data = localStorage.getItem(STORAGE_KEYS.inventory);
    return JSON.parse(data);
}

// Add item to inventory
function addItem(item) {
    const inventory = getInventory();
    // Check if item already exists
    const exists = inventory.find(i => i.id === item.id);
    if (!exists) {
        inventory.push(item);
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory));
        return true;
    }
    return false;
}

// Remove item from inventory
function removeItem(itemId) {
    const inventory = getInventory();
    const filtered = inventory.filter(i => i.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(filtered));
}

// Get all placed furniture
function getPlacedFurniture() {
    initInventory();
    const data = localStorage.getItem(STORAGE_KEYS.placed);
    return JSON.parse(data);
}

// Place furniture in a room at a specific spot
function placeFurniture(room, spot, itemId) {
    const placed = getPlacedFurniture();
    
    // Initialize room if doesn't exist
    if (!placed[room]) {
        placed[room] = {};
    }
    
    // Check if item exists in inventory
    const inventory = getInventory();
    const item = inventory.find(i => i.id === itemId);
    
    if (!item) {
        return { success: false, message: 'Item not found in inventory' };
    }
    
    // Place the item
    placed[room][spot] = itemId;
    localStorage.setItem(STORAGE_KEYS.placed, JSON.stringify(placed));
    
    return { success: true, item };
}

// Remove furniture from a spot
function removeFurniture(room, spot) {
    const placed = getPlacedFurniture();
    
    if (placed[room] && placed[room][spot]) {
        delete placed[room][spot];
        localStorage.setItem(STORAGE_KEYS.placed, JSON.stringify(placed));
        return true;
    }
    
    return false;
}

// Get available (unplaced) items
function getAvailableItems() {
    const inventory = getInventory();
    const placed = getPlacedFurniture();
    
    // Get all placed item IDs
    const placedIds = new Set();
    Object.values(placed).forEach(room => {
        Object.values(room).forEach(itemId => {
            placedIds.add(itemId);
        });
    });
    
    // Filter out placed items
    return inventory.filter(item => !placedIds.has(item.id));
}

// Get item by ID
function getItemById(itemId) {
    const inventory = getInventory();
    return inventory.find(i => i.id === itemId);
}

// Get all furniture (including locked items) for display
function getAllFurniture() {
    return ALL_FURNITURE;
}

// Check if item is unlocked
function isItemUnlocked(itemId) {
    const inventory = getInventory();
    return inventory.some(i => i.id === itemId);
}

// Export functions for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initInventory,
        getInventory,
        addItem,
        removeItem,
        getPlacedFurniture,
        placeFurniture,
        removeFurniture,
        getAvailableItems,
        getItemById
    };
}
