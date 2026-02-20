// shop-system.js — Client-side shop interface
// Handles purchasing chat colors, titles, and other cosmetics

(function() {
    console.log('🛍️ Shop System initializing...');

    // Configuration
    const SHOP_ITEMS = [
        { id: 'color_gold', type: 'chat_color', name: 'Golden Name', price: 500, value: '#ffd700', icon: '🎨' },
        { id: 'color_teal', type: 'chat_color', name: 'Teal Name', price: 300, value: '#40E0D0', icon: '🎨' },
        { id: 'color_pink', type: 'chat_color', name: 'Neon Pink Name', price: 300, value: '#ff69b4', icon: '🎨' },
        { id: 'color_lime', type: 'chat_color', name: 'Cyber Lime Name', price: 300, value: '#39ff14', icon: '🎨' },
        
        { id: 'title_rich', type: 'title', name: 'Title: The Wealthy', price: 1000, value: 'The Wealthy', icon: '👑' },
        { id: 'title_night', type: 'title', name: 'Title: Night Owl', price: 200, value: 'Night Owl', icon: '🦉' },
        { id: 'title_party', type: 'title', name: 'Title: Party Animal', price: 200, value: 'Party Animal', icon: '🎉' },
        { id: 'title_gamer', type: 'title', name: 'Title: Pro Gamer', price: 500, value: 'Pro Gamer', icon: '🎮' },
        
        { id: 'badge_star', type: 'badge', name: 'Star Badge', price: 1500, value: '⭐', icon: '⭐' }
    ];

    let shopModal = null;
    let userCoins = 0;
    let currentUser = null;

    // Core System
    const ShopSystem = {
        init: function() {
            this.createModal();
            this.attachEventListeners();
            console.log('✅ Shop System ready!');
        },

        createModal: function() {
            if (document.getElementById('shopModal')) return;

            const modal = document.createElement('div');
            modal.id = 'shopModal';
            modal.className = 'shop-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="shop-modal-content">
                    <div class="shop-header">
                        <h2><i class="fas fa-store"></i> The Marketplace</h2>
                        <button class="shop-close-btn" onclick="ShopSystem.closeShop()"><i class="fas fa-times"></i></button>
                    </div>
                    
                    <div class="shop-balance-bar">
                        <span>Your Balance:</span>
                        <div class="coin-display"><i class="fas fa-coins"></i> <span id="shopUserCoins">0</span></div>
                    </div>

                    <div class="shop-tabs">
                        <button class="shop-tab active" onclick="ShopSystem.switchTab('all')">All Items</button>
                        <button class="shop-tab" onclick="ShopSystem.switchTab('chat_color')">Colors</button>
                        <button class="shop-tab" onclick="ShopSystem.switchTab('title')">Titles</button>
                    </div>

                    <div class="shop-grid" id="shopGrid">
                        <!-- Items injected here -->
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            shopModal = modal;

            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeShop();
            });
        },

        attachEventListeners: function() {
            // Hook into HUD if available
            // Currently no dedicated button, maybe add one or expose API
        },

        openShop: async function(username) {
            if (!username) {
                // Try to find username from localStorage
                try {
                    const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
                    username = user.username || user.displayName;
                } catch(e) {}
            }

            if (!username) {
                alert('Please sign in to access the shop.');
                return;
            }

            currentUser = username;
            
            // Show modal
            if (shopModal) {
                shopModal.style.display = 'flex';
                shopModal.classList.add('active');
            } else {
                this.createModal();
                shopModal = document.getElementById('shopModal');
                shopModal.style.display = 'flex';
                shopModal.classList.add('active');
            }

            // Fetch user data (coins + inventory)
            await this.refreshUserData();
            this.renderItems('all');
        },

        closeShop: function() {
            if (shopModal) {
                shopModal.classList.remove('active');
                setTimeout(() => {
                    shopModal.style.display = 'none';
                }, 300);
            }
        },

        refreshUserData: async function() {
            try {
                const res = await fetch(`/api/user/${currentUser}`);
                if (!res.ok) throw new Error('Failed to fetch user');
                const data = await res.json();
                userCoins = data.coins || 0;
                this.userInventory = data.inventory || [];
                
                document.getElementById('shopUserCoins').textContent = userCoins.toLocaleString();
            } catch (e) {
                console.error('Shop fetch error:', e);
            }
        },

        switchTab: function(type) {
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            const activeTab = Array.from(document.querySelectorAll('.shop-tab')).find(t => t.textContent.toLowerCase().includes(type === 'chat_color' ? 'colors' : type));
            if (activeTab) activeTab.classList.add('active');
            else document.querySelector('.shop-tab').classList.add('active'); // Default to All

            this.renderItems(type);
        },

        renderItems: function(filterType) {
            const grid = document.getElementById('shopGrid');
            grid.innerHTML = '';

            const items = filterType === 'all' 
                ? SHOP_ITEMS 
                : SHOP_ITEMS.filter(i => i.type === filterType);

            if (items.length === 0) {
                grid.innerHTML = '<div class="shop-empty">No items in this category.</div>';
                return;
            }

            items.forEach(item => {
                const owned = this.userInventory.includes(item.id) || this.userInventory.includes(item.name); // Check ID or Name support
                const canAfford = userCoins >= item.price;

                const card = document.createElement('div');
                card.className = `shop-item ${owned ? 'owned' : ''}`;
                card.innerHTML = `
                    <div class="shop-item-icon" style="${item.type === 'chat_color' ? 'color:' + item.value : ''}">${item.icon}</div>
                    <div class="shop-item-info">
                        <h3>${item.name}</h3>
                        <p class="shop-item-type">${this.formatType(item.type)}</p>
                    </div>
                    <div class="shop-item-action">
                        ${owned 
                            ? `<button class="shop-btn disabled">Owned</button>` 
                            : `<button class="shop-btn ${canAfford ? 'buy' : 'disabled'}" onclick="ShopSystem.buyItem('${item.id}')">
                                <i class="fas fa-coins"></i> ${item.price}
                               </button>`
                        }
                    </div>
                `;
                grid.appendChild(card);
            });
        },

        formatType: function(type) {
            return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        },

        buyItem: async function(itemId) {
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (!item) return;

            if (userCoins < item.price) {
                alert("You don't have enough coins!");
                return;
            }

            if (!confirm(`Buy ${item.name} for ${item.price} coins?`)) return;

            try {
                const res = await fetch('/api/shop/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser, itemId: item.id })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    // Update local state
                    userCoins = data.newBalance;
                    this.userInventory.push(item.name); // Using name for compatibility with existing inventory logic
                    this.userInventory.push(item.id);
                    
                    document.getElementById('shopUserCoins').textContent = userCoins.toLocaleString();
                    this.renderItems('all'); // Re-render to show "Owned"
                    
                    alert(`Successfully purchased ${item.name}!`);
                    
                    // Trigger inventory refresh if profile is open
                    if (window.ProfileSystem && window.ProfileSystem.openProfile) {
                        // Optional: Refresh profile if needed
                    }
                } else {
                    alert(data.error || 'Purchase failed.');
                }
            } catch (e) {
                console.error('Purchase error:', e);
                alert('Connection error during purchase.');
            }
        }
    };

    window.ShopSystem = ShopSystem;
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ShopSystem.init());
    } else {
        ShopSystem.init();
    }

})();
