/* ========================================
   NOTIFICATION CENTER — ChiffTown
   Real-time notification system
   ======================================== */

(function() {
    'use strict';

    const STORAGE_KEY = 'chifftown_notifications';
    const MAX_NOTIFICATIONS = 100;

    const NOTIF_TYPES = {
        tip_received:  { icon: 'fas fa-coins',       cat: 'coins',       label: 'Tip' },
        tip_sent:      { icon: 'fas fa-hand-holding-usd', cat: 'coins',  label: 'Tip' },
        coin_bonus:    { icon: 'fas fa-coins',       cat: 'coins',       label: 'Coins' },
        xp_gained:     { icon: 'fas fa-star',        cat: 'xp',          label: 'XP' },
        level_up:      { icon: 'fas fa-arrow-up',    cat: 'level',       label: 'Level Up' },
        achievement:   { icon: 'fas fa-trophy',      cat: 'achievement', label: 'Achievement' },
        dm_received:   { icon: 'fas fa-envelope',    cat: 'dm',          label: 'Message' },
        friend_online: { icon: 'fas fa-circle',      cat: 'social',      label: 'Friend' },
        shop_purchase: { icon: 'fas fa-shopping-bag', cat: 'coins',      label: 'Shop' },
        system:        { icon: 'fas fa-info-circle',  cat: 'system',     label: 'System' },
        challenge:     { icon: 'fas fa-tasks',        cat: 'xp',         label: 'Challenge' },
        fishing:       { icon: 'fas fa-fish',         cat: 'coins',      label: 'Fishing' },
    };

    const state = {
        notifications: [],
        unreadCount: 0,
        panelOpen: false,
        filter: 'all',
        initialized: false,
        toastQueue: [],
        toastActive: false,
    };

    // ── Load / Save ──
    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                state.notifications = JSON.parse(raw);
                state.unreadCount = state.notifications.filter(n => !n.read).length;
            }
        } catch(e) { state.notifications = []; }
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notifications.slice(0, MAX_NOTIFICATIONS)));
        } catch(e) {}
    }

    // ── Add notification ──
    function addNotification(type, text, data) {
        const notif = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type,
            text,
            data: data || {},
            time: Date.now(),
            read: false,
        };
        state.notifications.unshift(notif);
        if (state.notifications.length > MAX_NOTIFICATIONS) state.notifications.pop();
        state.unreadCount = state.notifications.filter(n => !n.read).length;
        save();
        updateBadge();
        showToast(notif);
        if (state.panelOpen) renderList();
        return notif;
    }

    // ── Badge ──
    function updateBadge() {
        const bell = document.getElementById('notifBell');
        if (!bell) return;
        const badge = bell.querySelector('.notif-badge');
        if (state.unreadCount > 0) {
            bell.classList.add('has-unread');
            badge.textContent = state.unreadCount > 99 ? '99+' : state.unreadCount;
        } else {
            bell.classList.remove('has-unread');
        }
    }

    // ── Toast ──
    function showToast(notif) {
        if (state.panelOpen) return; // Don't show if panel is open
        state.toastQueue.push(notif);
        processToastQueue();
    }

    function processToastQueue() {
        if (state.toastActive || state.toastQueue.length === 0) return;
        state.toastActive = true;
        const notif = state.toastQueue.shift();
        const meta = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system;

        let toast = document.getElementById('notifToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'notifToast';
            toast.className = 'notif-toast';
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div class="notif-icon ${meta.cat}"><i class="${meta.icon}"></i></div>
            <div class="toast-text">${notif.text}</div>
        `;
        toast.onclick = () => { togglePanel(true); dismissToast(toast); };

        requestAnimationFrame(() => {
            toast.classList.add('show');
            // Also shake the bell
            const bell = document.getElementById('notifBell');
            if (bell) { bell.classList.add('shake'); setTimeout(() => bell.classList.remove('shake'), 700); }
        });

        setTimeout(() => dismissToast(toast), 4500);
    }

    function dismissToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => { state.toastActive = false; processToastQueue(); }, 400);
    }

    // ── Panel ──
    function createPanel() {
        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'notif-backdrop';
        backdrop.id = 'notifBackdrop';
        backdrop.onclick = () => togglePanel(false);
        document.body.appendChild(backdrop);

        // Panel
        const panel = document.createElement('div');
        panel.className = 'notif-panel';
        panel.id = 'notifPanel';
        panel.innerHTML = `
            <div class="notif-header">
                <h3><i class="fas fa-bell" style="margin-right:0.5rem;"></i>Notifications</h3>
                <div class="notif-header-actions">
                    <button class="notif-header-btn" id="notifMarkAll" title="Mark all as read">
                        <i class="fas fa-check-double"></i> Read all
                    </button>
                    <button class="notif-header-btn" id="notifClear" title="Clear all">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="notif-header-btn" id="notifClose" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="notif-filters" id="notifFilters">
                <button class="notif-filter active" data-filter="all">All</button>
                <button class="notif-filter" data-filter="coins">💰 Coins</button>
                <button class="notif-filter" data-filter="xp">⭐ XP</button>
                <button class="notif-filter" data-filter="social">👥 Social</button>
                <button class="notif-filter" data-filter="dm">💬 Messages</button>
                <button class="notif-filter" data-filter="achievement">🏆 Achievements</button>
            </div>
            <div class="notif-list" id="notifList"></div>
        `;
        document.body.appendChild(panel);

        // Events
        document.getElementById('notifClose').onclick = () => togglePanel(false);
        document.getElementById('notifMarkAll').onclick = markAllRead;
        document.getElementById('notifClear').onclick = clearAll;
        document.getElementById('notifFilters').addEventListener('click', e => {
            const btn = e.target.closest('.notif-filter');
            if (!btn) return;
            document.querySelectorAll('.notif-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filter = btn.dataset.filter;
            renderList();
        });
    }

    function togglePanel(open) {
        state.panelOpen = typeof open === 'boolean' ? open : !state.panelOpen;
        const panel = document.getElementById('notifPanel');
        const backdrop = document.getElementById('notifBackdrop');
        if (!panel) return;

        if (state.panelOpen) {
            panel.classList.add('open');
            backdrop.classList.add('visible');
            renderList();
        } else {
            panel.classList.remove('open');
            backdrop.classList.remove('visible');
        }
    }

    function renderList() {
        const list = document.getElementById('notifList');
        if (!list) return;

        let items = state.notifications;
        if (state.filter !== 'all') {
            items = items.filter(n => {
                const meta = NOTIF_TYPES[n.type] || NOTIF_TYPES.system;
                return meta.cat === state.filter;
            });
        }

        if (items.length === 0) {
            list.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash"></i><span>No notifications yet</span></div>`;
            return;
        }

        let html = '';
        let lastDate = '';
        items.forEach(n => {
            const date = new Date(n.time);
            const dateStr = formatDate(date);
            if (dateStr !== lastDate) {
                html += `<div class="notif-date-divider">${dateStr}</div>`;
                lastDate = dateStr;
            }
            const meta = NOTIF_TYPES[n.type] || NOTIF_TYPES.system;
            html += `
                <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                    <div class="notif-icon ${meta.cat}"><i class="${meta.icon}"></i></div>
                    <div class="notif-body">
                        <div class="notif-text">${n.text}</div>
                        <div class="notif-time">${timeAgo(n.time)}</div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;

        // Click to mark read
        list.querySelectorAll('.notif-item.unread').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.id;
                const notif = state.notifications.find(n => n.id === id);
                if (notif) { notif.read = true; el.classList.remove('unread'); }
                state.unreadCount = state.notifications.filter(n => !n.read).length;
                save();
                updateBadge();
            });
        });
    }

    function markAllRead() {
        state.notifications.forEach(n => n.read = true);
        state.unreadCount = 0;
        save();
        updateBadge();
        renderList();
    }

    function clearAll() {
        state.notifications = [];
        state.unreadCount = 0;
        save();
        updateBadge();
        renderList();
    }

    // ── Helpers ──
    function formatDate(d) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const then = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diff = (today - then) / 86400000;
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function timeAgo(ts) {
        const s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return Math.floor(s/60) + 'm ago';
        if (s < 86400) return Math.floor(s/3600) + 'h ago';
        return Math.floor(s/86400) + 'd ago';
    }

    // ── Socket integration ──
    function hookSocket() {
        const waitForSocket = setInterval(() => {
            const sock = window.socket;
            if (!sock) return;
            clearInterval(waitForSocket);

            // XP gained
            sock.on('xp-gained', data => {
                addNotification('xp_gained', `You earned <strong>+${data.amount} XP</strong> — ${data.reason || 'Activity'}`);
            });

            // Level up
            sock.on('level-up', data => {
                addNotification('level_up', `🎉 <strong>Level Up!</strong> You reached <strong>Level ${data.level}</strong>!`);
            });

            // Tip received
            sock.on('tip-received', data => {
                addNotification('tip_received', `<strong>${data.from}</strong> tipped you <strong>${data.amount} coins</strong>! 💰`);
            });

            // Achievement unlocked
            sock.on('achievement-unlocked', data => {
                addNotification('achievement', `🏆 Achievement unlocked: <strong>${data.name}</strong>`);
            });

            // DM received
            sock.on('dm-receive', data => {
                addNotification('dm_received', `💬 New message from <strong>${data.from}</strong>`);
            });

            // Challenge complete
            sock.on('challenge-complete', data => {
                addNotification('challenge', `✅ Challenge complete: <strong>${data.name}</strong> (+${data.xp} XP)`);
            });

            console.log('✅ Notification Center hooked into socket');
        }, 500);

        // Timeout after 10s
        setTimeout(() => clearInterval(waitForSocket), 10000);
    }

    // ── Init ──
    function init() {
        if (state.initialized) return;
        state.initialized = true;

        load();
        createPanel();
        updateBadge();
        hookSocket();

        // Wire bell button
        const bell = document.getElementById('notifBell');
        if (bell) {
            bell.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            });
        }

        // Wire menu item
        const menuBell = document.querySelector('.menu-item .fa-bell');
        if (menuBell) {
            const menuItem = menuBell.closest('.menu-item');
            if (menuItem) {
                menuItem.addEventListener('click', e => {
                    e.preventDefault();
                    togglePanel(true);
                });
            }
        }

        // Keyboard: Escape to close
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && state.panelOpen) togglePanel(false);
        });

        console.log('✅ Notification Center initialized');
    }

    // ── Public API ──
    window.NotificationCenter = {
        init,
        add: addNotification,
        open: () => togglePanel(true),
        close: () => togglePanel(false),
        getUnreadCount: () => state.unreadCount,
    };

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
