/**
 * dm-system.js — ChiffTown Direct Messages
 * 
 * Global DM widget available on every page.
 * Uses socket.io for real-time message delivery.
 */

(function() {
    'use strict';

    let socket = null;
    let username = '';
    let isOpen = false;
    let activeChat = null; // username we're chatting with
    let conversations = {}; // { username: [{ from, to, message, timestamp }] }
    let unreadTotal = 0;
    let typingTimeout = null;

    function init() {
        try {
            const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
            username = user.username || user.displayName || '';
        } catch(e) {}
        if (!username) return;

        loadConversations();
        injectStyles();
        createUI();
        connectSocket();
        console.log('📨 DM System initialized');
    }

    function connectSocket() {
        if (typeof io === 'undefined') { setTimeout(connectSocket, 500); return; }
        socket = io({ transports: ['websocket', 'polling'] });
        socket.on('connect', () => {
            socket.emit('dm-register', { username });
        });
        socket.on('dm-receive', (msg) => receiveMessage(msg));
        socket.on('dm-sent', (msg) => {
            // Confirmation — message already added optimistically
        });
        socket.on('dm-typing', (data) => {
            if (data.from === activeChat) showTyping(data.from);
        });
        socket.on('dm-online-list', (list) => renderOnlineList(list));
    }

    function injectStyles() {
        if (document.getElementById('dm-system-css')) return;
        const style = document.createElement('style');
        style.id = 'dm-system-css';
        style.textContent = `
            #dm-toggle {
                position: fixed; bottom: 20px; right: 20px; z-index: 8500;
                width: 48px; height: 48px; border-radius: 50%;
                background: linear-gradient(135deg, #0c2d48, #145374);
                border: 2px solid rgba(20, 184, 166, 0.3);
                color: #14b8a6; font-size: 1.2rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                transition: all 0.3s;
            }
            #dm-toggle:hover { transform: scale(1.1); border-color: rgba(20, 184, 166, 0.6); }
            #dm-badge {
                position: absolute; top: -4px; right: -4px;
                background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700;
                min-width: 18px; height: 18px; border-radius: 9px;
                display: none; align-items: center; justify-content: center;
                padding: 0 4px;
            }
            #dm-badge.show { display: flex; }

            #dm-panel {
                position: fixed; bottom: 80px; right: 20px; z-index: 8501;
                width: 320px; max-height: 480px;
                background: rgba(6, 13, 26, 0.97);
                border: 1px solid rgba(20, 184, 166, 0.2);
                border-radius: 16px;
                display: none; flex-direction: column;
                overflow: hidden;
                box-shadow: 0 8px 40px rgba(0,0,0,0.6);
                backdrop-filter: blur(12px);
                font-family: 'Inter', sans-serif;
            }
            #dm-panel.open { display: flex; animation: dmSlideUp 0.25s ease-out; }
            @keyframes dmSlideUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .dm-header {
                padding: 0.8rem 1rem;
                background: rgba(20, 184, 166, 0.05);
                border-bottom: 1px solid rgba(20, 184, 166, 0.1);
                display: flex; align-items: center; justify-content: space-between;
                min-height: 44px;
            }
            .dm-header-title {
                font-size: 0.85rem; font-weight: 600; color: #f4c542;
                display: flex; align-items: center; gap: 0.4rem;
            }
            .dm-back {
                background: none; border: none; color: #14b8a6; cursor: pointer;
                font-size: 0.85rem; padding: 0.2rem 0.4rem; border-radius: 4px;
            }
            .dm-back:hover { background: rgba(20,184,166,0.1); }

            .dm-body {
                flex: 1; overflow-y: auto; padding: 0.5rem;
                max-height: 340px; min-height: 200px;
            }
            .dm-body::-webkit-scrollbar { width: 4px; }
            .dm-body::-webkit-scrollbar-thumb { background: rgba(20,184,166,0.2); border-radius: 2px; }

            /* Contact list */
            .dm-contact {
                display: flex; align-items: center; gap: 0.6rem;
                padding: 0.6rem 0.8rem; border-radius: 10px;
                cursor: pointer; transition: background 0.15s;
            }
            .dm-contact:hover { background: rgba(20,184,166,0.08); }
            .dm-contact-avatar {
                width: 32px; height: 32px; border-radius: 50%;
                background: linear-gradient(135deg, #145374, #0c2d48);
                display: flex; align-items: center; justify-content: center;
                font-size: 0.9rem; color: #14b8a6; font-weight: 600;
                flex-shrink: 0;
            }
            .dm-contact-info { flex: 1; min-width: 0; }
            .dm-contact-name { font-size: 0.8rem; font-weight: 600; color: #e2e8f0; }
            .dm-contact-preview {
                font-size: 0.7rem; color: rgba(226,232,240,0.4);
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .dm-contact-unread {
                background: #14b8a6; color: #060d1a; font-size: 0.6rem; font-weight: 700;
                width: 18px; height: 18px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
            }
            .dm-online-dot {
                width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
                position: absolute; bottom: 0; right: 0; border: 2px solid #060d1a;
            }
            .dm-contact-avatar-wrap { position: relative; }

            .dm-empty {
                text-align: center; padding: 2rem 1rem;
                color: rgba(226,232,240,0.3); font-size: 0.8rem;
            }
            .dm-empty i { font-size: 2rem; margin-bottom: 0.5rem; display: block; }

            /* Chat messages */
            .dm-msg {
                margin-bottom: 0.4rem; max-width: 80%;
                padding: 0.5rem 0.7rem; border-radius: 12px;
                font-size: 0.8rem; line-height: 1.4;
                word-wrap: break-word;
            }
            .dm-msg.sent {
                margin-left: auto; background: rgba(20, 184, 166, 0.15);
                color: #e2e8f0; border-bottom-right-radius: 4px;
            }
            .dm-msg.received {
                background: rgba(255,255,255,0.05);
                color: #e2e8f0; border-bottom-left-radius: 4px;
            }
            .dm-msg-time {
                font-size: 0.6rem; color: rgba(226,232,240,0.3);
                margin-top: 0.15rem;
            }
            .dm-typing {
                font-size: 0.7rem; color: rgba(20,184,166,0.6);
                padding: 0.2rem 0.5rem; font-style: italic;
                display: none;
            }
            .dm-typing.show { display: block; }

            /* Input */
            .dm-input-area {
                padding: 0.5rem; border-top: 1px solid rgba(20,184,166,0.1);
                display: flex; gap: 0.4rem; align-items: center;
            }
            .dm-input {
                flex: 1; background: rgba(255,255,255,0.04);
                border: 1px solid rgba(20,184,166,0.15);
                border-radius: 20px; padding: 0.5rem 0.8rem;
                color: #e2e8f0; font-size: 0.8rem; font-family: inherit;
                outline: none;
            }
            .dm-input:focus { border-color: rgba(20,184,166,0.4); }
            .dm-input::placeholder { color: rgba(226,232,240,0.3); }
            .dm-send-btn {
                width: 32px; height: 32px; border-radius: 50%;
                background: linear-gradient(135deg, #14b8a6, #0d9488);
                border: none; color: #fff; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                font-size: 0.8rem; transition: transform 0.15s;
                flex-shrink: 0;
            }
            .dm-send-btn:hover { transform: scale(1.1); }

            /* New DM input */
            .dm-new-input {
                width: 100%; background: rgba(255,255,255,0.04);
                border: 1px solid rgba(20,184,166,0.15);
                border-radius: 8px; padding: 0.5rem 0.7rem;
                color: #e2e8f0; font-size: 0.8rem; font-family: inherit;
                outline: none; margin-bottom: 0.5rem;
            }
            .dm-new-input:focus { border-color: rgba(20,184,166,0.4); }

            @media (max-width: 768px) {
                #dm-panel { right: 8px; left: 8px; width: auto; bottom: 75px; }
                #dm-toggle { bottom: 15px; right: 15px; width: 42px; height: 42px; }
            }
        `;
        document.head.appendChild(style);
    }

    function createUI() {
        // Toggle button
        const toggle = document.createElement('button');
        toggle.id = 'dm-toggle';
        toggle.innerHTML = `<i class="fas fa-comment-dots"></i><span id="dm-badge"></span>`;
        toggle.addEventListener('click', togglePanel);
        document.body.appendChild(toggle);

        // Panel
        const panel = document.createElement('div');
        panel.id = 'dm-panel';
        document.body.appendChild(panel);

        renderContactList();
    }

    function togglePanel() {
        isOpen = !isOpen;
        const panel = document.getElementById('dm-panel');
        if (isOpen) {
            panel.classList.add('open');
            if (!activeChat) {
                renderContactList();
                if (socket) socket.emit('dm-online');
            }
        } else {
            panel.classList.remove('open');
        }
    }

    function renderContactList() {
        activeChat = null;
        const panel = document.getElementById('dm-panel');
        const contactKeys = Object.keys(conversations).sort((a, b) => {
            const la = conversations[a].slice(-1)[0]?.timestamp || 0;
            const lb = conversations[b].slice(-1)[0]?.timestamp || 0;
            return lb - la;
        });

        let contactsHTML = '';
        if (contactKeys.length === 0) {
            contactsHTML = `<div class="dm-empty"><i class="fas fa-comment-slash"></i>No conversations yet.<br>Type a username below to start!</div>`;
        } else {
            contactsHTML = contactKeys.map(u => {
                const msgs = conversations[u];
                const last = msgs[msgs.length - 1];
                const unread = msgs.filter(m => m.from !== username && !m.read).length;
                const preview = last ? (last.from === username ? `You: ${last.message}` : last.message) : '';
                return `<div class="dm-contact" onclick="window._dmOpenChat('${escapeHtml(u)}')">
                    <div class="dm-contact-avatar-wrap">
                        <div class="dm-contact-avatar">${u.charAt(0).toUpperCase()}</div>
                    </div>
                    <div class="dm-contact-info">
                        <div class="dm-contact-name">${escapeHtml(u)}</div>
                        <div class="dm-contact-preview">${escapeHtml(preview.substring(0, 40))}</div>
                    </div>
                    ${unread > 0 ? `<div class="dm-contact-unread">${unread}</div>` : ''}
                </div>`;
            }).join('');
        }

        panel.innerHTML = `
            <div class="dm-header">
                <span class="dm-header-title"><i class="fas fa-comment-dots"></i> Messages</span>
            </div>
            <div class="dm-body">${contactsHTML}</div>
            <div class="dm-input-area">
                <input class="dm-new-input" id="dmNewUser" placeholder="Start chat with..." maxlength="25">
            </div>
        `;

        document.getElementById('dmNewUser').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                openChat(e.target.value.trim());
            }
        });
    }

    function openChat(user) {
        activeChat = user;
        if (!conversations[user]) conversations[user] = [];
        // Mark as read
        conversations[user].forEach(m => m.read = true);
        updateBadge();
        saveConversations();
        renderChat();
    }
    window._dmOpenChat = openChat;

    function renderChat() {
        const panel = document.getElementById('dm-panel');
        const msgs = conversations[activeChat] || [];

        const msgsHTML = msgs.map(m => {
            const isSent = m.from === username;
            const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `<div class="dm-msg ${isSent ? 'sent' : 'received'}">
                ${escapeHtml(m.message)}
                <div class="dm-msg-time">${time}</div>
            </div>`;
        }).join('');

        panel.innerHTML = `
            <div class="dm-header">
                <button class="dm-back" onclick="window._dmBack()">← Back</button>
                <span class="dm-header-title">${escapeHtml(activeChat)}</span>
                <span></span>
            </div>
            <div class="dm-body" id="dmChatBody">${msgsHTML}</div>
            <div class="dm-typing" id="dmTyping">${escapeHtml(activeChat)} is typing...</div>
            <div class="dm-input-area">
                <input class="dm-input" id="dmInput" placeholder="Type a message..." maxlength="500" autocomplete="off">
                <button class="dm-send-btn" onclick="window._dmSend()"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;

        const body = document.getElementById('dmChatBody');
        body.scrollTop = body.scrollHeight;

        const input = document.getElementById('dmInput');
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        input.addEventListener('input', () => {
            if (socket) socket.emit('dm-typing', { to: activeChat });
        });
    }

    window._dmBack = () => renderContactList();
    window._dmSend = () => sendMessage();

    function sendMessage() {
        const input = document.getElementById('dmInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text || !activeChat) return;

        const msg = { from: username, to: activeChat, message: text, timestamp: Date.now(), read: true };
        if (!conversations[activeChat]) conversations[activeChat] = [];
        conversations[activeChat].push(msg);
        saveConversations();

        if (socket) socket.emit('dm-send', { to: activeChat, message: text });

        input.value = '';
        renderChat();

        // Pet XP
        if (window.ChiffPet) window.ChiffPet.addXP(1);
    }

    function receiveMessage(msg) {
        const sender = msg.from;
        if (!conversations[sender]) conversations[sender] = [];
        const isRead = activeChat === sender && isOpen;
        conversations[sender].push({ ...msg, read: isRead });
        saveConversations();

        if (activeChat === sender && isOpen) {
            renderChat();
        }
        updateBadge();

        // Toast notification if panel isn't focused on this chat
        if (!(activeChat === sender && isOpen)) {
            showDMToast(msg);
        }
    }

    function showDMToast(msg) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 80px; right: 75px; z-index: 8600;
            background: rgba(6, 13, 26, 0.95); border: 1px solid rgba(20, 184, 166, 0.3);
            border-radius: 12px; padding: 0.6rem 1rem; max-width: 250px;
            font-family: 'Inter', sans-serif; cursor: pointer;
            animation: dmSlideUp 0.3s ease-out;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        toast.innerHTML = `
            <div style="font-size:0.75rem;font-weight:600;color:#f4c542;margin-bottom:0.2rem;">💬 ${escapeHtml(msg.from)}</div>
            <div style="font-size:0.75rem;color:#e2e8f0;">${escapeHtml(msg.message.substring(0, 60))}</div>
        `;
        toast.addEventListener('click', () => {
            toast.remove();
            if (!isOpen) togglePanel();
            openChat(msg.from);
        });
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
    }

    function showTyping(from) {
        const el = document.getElementById('dmTyping');
        if (el) {
            el.classList.add('show');
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => el.classList.remove('show'), 2000);
        }
    }

    function updateBadge() {
        unreadTotal = 0;
        Object.values(conversations).forEach(msgs => {
            unreadTotal += msgs.filter(m => m.from !== username && !m.read).length;
        });
        const badge = document.getElementById('dm-badge');
        if (badge) {
            badge.textContent = unreadTotal > 9 ? '9+' : unreadTotal;
            badge.classList.toggle('show', unreadTotal > 0);
        }
    }

    function loadConversations() {
        try {
            const saved = localStorage.getItem('chifftown_dms_' + username);
            if (saved) conversations = JSON.parse(saved);
        } catch(e) {}
    }

    function saveConversations() {
        // Keep only last 50 messages per conversation
        Object.keys(conversations).forEach(k => {
            if (conversations[k].length > 50) {
                conversations[k] = conversations[k].slice(-50);
            }
        });
        localStorage.setItem('chifftown_dms_' + username, JSON.stringify(conversations));
    }

    function renderOnlineList(list) {
        // Could enhance contact list with online indicators
        // For now just stored for reference
    }

    function escapeHtml(t) {
        const d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
