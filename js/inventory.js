// ChiffTown Inventory System
// Manages furniture items and placement in apartments

const STORAGE_KEYS = {
    inventory: 'chifftown_inventory',
    placed: 'chifftown_placed',
    profile: 'chifftown_profile'
};

// Default starter furniture
const DEFAULT_INVENTORY = [
    {
        id: 'sofa-basic',
        name: 'Basic Sofa',
        description: 'A comfortable two-seater sofa',
        emoji: '🛋️',
        category: 'seating'
    },
    {
        id: 'bed-basic',
        name: 'Basic Bed',
        description: 'A simple but cozy bed',
        emoji: '🛏️',
        category: 'bedroom'
    },
    {
        id: 'table-basic',
        name: 'Coffee Table',
        description: 'A low wooden coffee table',
        emoji: '🪑',
        category: 'furniture'
    },
    {
        id: 'lamp-basic',
        name: 'Floor Lamp',
        description: 'Warm ambient lighting',
        emoji: '💡',
        category: 'lighting'
    },
    {
        id: 'bookshelf-basic',
        name: 'Bookshelf',
        description: 'Display your favorite books',
        emoji: '📚',
        category: 'storage'
    },
    {
        id: 'plant-basic',
        name: 'Potted Plant',
        description: 'Adds life to any room',
        emoji: '🪴',
        category: 'decor'
    },
    {
        id: 'tv-basic',
        name: 'Flat Screen TV',
        description: 'Entertainment center',
        emoji: '📺',
        category: 'electronics'
    },
    {
        id: 'rug-basic',
        name: 'Area Rug',
        description: 'Ties the room together',
        emoji: '🟫',
        category: 'decor'
    }
];

// Initialize inventory if not exists
function initInventory() {
    const existing = localStorage.getItem(STORAGE_KEYS.inventory);
    if (!existing) {
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(DEFAULT_INVENTORY));
    }
    
    const placed = localStorage.getItem(STORAGE_KEYS.placed);
    if (!placed) {
        localStorage.setItem(STORAGE_KEYS.placed, JSON.stringify({}));
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
