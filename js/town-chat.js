// ============================================
// CHIFFTOWN TOWN CHAT
// ============================================
// Global chat on the main map page
// ============================================

(function() {
    'use strict';

    let socket = null;
    let username = '';
    let isOpen = false;
    let unread = 0;
    let panel, msgList, input, badge;

    function init() {
        // Get username
        try {
            const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
            username = user.username || user.displayName || '';
        } catch(e) {}

        createUI();
        connectSocket();
        console.log('💬 Town Chat initialized');
    }

    function connectSocket() {
        if (typeof io === 'undefined') { setTimeout(connectSocket, 500); return; }
        // Reuse existing socket or create new
        const existing = document.querySelector('script[src*="socket.io"]');
        socket = io({ transports: ['websocket', 'polling'] });

        socket.on('town-chat-msg', (msg) => {
            addMessage(msg);
            if (!isOpen) {
                unread++;
                badge.textContent = unread > 9 ? '9+' : unread;
                badge.style.display = 'flex';
            }
        });
    }

    function createUI() {
        // Toggle button
        const btn = document.createElement('button');
        btn.id = 'townChatToggle';
        btn.className = 'tc-toggle';
        btn.innerHTML = '💬';
        btn.onclick = toggle;
        document.body.appendChild(btn);

        // Unread badge
        badge = document.createElement('span');
        badge.className = 'tc-badge';
        badge.style.display = 'none';
        btn.appendChild(badge);

        // Panel
        panel = document.createElement('div');
        panel.id = 'townChatPanel';
        panel.className = 'tc-panel';
        panel.innerHTML = `
            <div class="tc-header">
                <span class="tc-title">💬 Town Square</span>
                <button class="tc-close" onclick="document.getElementById('townChatToggle').click()">✕</button>
            </div>
            <div class="tc-messages" id="tcMessages"></div>
            <div class="tc-input-area">
                <input type="text" id="tcNameInput" class="tc-name" placeholder="Name" maxlength="25" value="">
                <div class="tc-send-row">
                    <input type="text" id="tcMsgInput" class="tc-msg" placeholder="Say something..." maxlength="300">
                    <button class="tc-send" onclick="window._tcSend()">→</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        msgList = document.getElementById('tcMessages');
        input = document.getElementById('tcMsgInput');
        const nameInput = document.getElementById('tcNameInput');

        if (username) nameInput.value = username;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') window._tcSend();
        });

        // Add welcome message
        addMessage({
            username: '🏛️ Town Square',
            message: 'Welcome to ChiffTown! Chat with everyone on the map.',
            timestamp: Date.now(),
            system: true
        });

        injectStyles();
    }

    function toggle() {
        isOpen = !isOpen;
        panel.classList.toggle('tc-open', isOpen);
        if (isOpen) {
            unread = 0;
            badge.style.display = 'none';
            input.focus();
            msgList.scrollTop = msgList.scrollHeight;
        }
    }

    window._tcSend = function() {
        const nameInput = document.getElementById('tcNameInput');
        const name = nameInput.value.trim();
        const msg = input.value.trim();
        if (!name) { nameInput.focus(); nameInput.style.borderColor = '#ef4444'; return; }
        if (!msg) return;
        nameInput.style.borderColor = '';

        // Save name
        username = name;
        try {
            const user = JSON.parse(localStorage.getItem('chifftown_user') || '{}');
            user.username = name;
            localStorage.setItem('chifftown_user', JSON.stringify(user));
        } catch(e) {}

        if (socket) socket.emit('town-chat', { username: name, message: msg });
        input.value = '';
        input.focus();
    };

    function addMessage(msg) {
        const div = document.createElement('div');
        div.className = 'tc-message' + (msg.system ? ' tc-system' : '');

        const time = new Date(msg.timestamp);
        const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        div.innerHTML = msg.system
            ? `<span class="tc-sys-text">${esc(msg.message)}</span>`
            : `<span class="tc-user">${esc(msg.username)}</span><span class="tc-time">${timeStr}</span><div class="tc-text">${esc(msg.message)}</div>`;

        msgList.appendChild(div);

        // Keep max 100 messages
        while (msgList.children.length > 100) msgList.removeChild(msgList.firstChild);

        msgList.scrollTop = msgList.scrollHeight;
    }

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function injectStyles() {
        const s = document.createElement('style');
        s.textContent = `
            .tc-toggle {
                position: fixed; bottom: 20px; right: 20px; z-index: 9998;
                width: 52px; height: 52px; border-radius: 50%;
                background: linear-gradient(135deg, #0a1628, #0f2540);
                border: 2px solid rgba(0,188,212,0.3);
                color: #fff; font-size: 1.4rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                transition: all 0.2s;
            }
            .tc-toggle:hover { transform: scale(1.08); border-color: rgba(0,188,212,0.6); }
            .tc-badge {
                position: absolute; top: -4px; right: -4px;
                background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700;
                min-width: 18px; height: 18px; border-radius: 9px;
                display: flex; align-items: center; justify-content: center;
                padding: 0 4px;
            }

            .tc-panel {
                position: fixed; bottom: 80px; right: 20px; z-index: 9997;
                width: 320px; height: 420px;
                background: linear-gradient(180deg, rgba(10,22,40,0.97), rgba(5,10,20,0.98));
                border: 1px solid rgba(0,188,212,0.15);
                border-radius: 16px;
                display: flex; flex-direction: column;
                box-shadow: 0 8px 40px rgba(0,0,0,0.5);
                backdrop-filter: blur(16px);
                opacity: 0; transform: translateY(10px) scale(0.95);
                pointer-events: none;
                transition: opacity 0.2s, transform 0.2s;
                overflow: hidden;
            }
            .tc-panel.tc-open {
                opacity: 1; transform: translateY(0) scale(1);
                pointer-events: all;
            }

            .tc-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 12px 16px;
                border-bottom: 1px solid rgba(255,255,255,0.06);
                flex-shrink: 0;
            }
            .tc-title { font-weight: 700; font-size: 0.9rem; color: #c9a84c; }
            .tc-close {
                background: none; border: none; color: rgba(255,255,255,0.4);
                font-size: 1rem; cursor: pointer; padding: 0;
            }
            .tc-close:hover { color: #fff; }

            .tc-messages {
                flex: 1; overflow-y: auto; padding: 10px 14px;
                display: flex; flex-direction: column; gap: 6px;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.1) transparent;
            }

            .tc-message {
                font-size: 0.82rem; line-height: 1.4;
            }
            .tc-system { text-align: center; padding: 6px 0; }
            .tc-sys-text { color: rgba(255,255,255,0.35); font-size: 0.75rem; font-style: italic; }
            .tc-user { font-weight: 600; color: #00bcd4; margin-right: 6px; }
            .tc-time { font-size: 0.65rem; color: rgba(255,255,255,0.25); }
            .tc-text { color: rgba(255,255,255,0.8); margin-top: 1px; word-break: break-word; }

            .tc-input-area {
                padding: 10px 12px;
                border-top: 1px solid rgba(255,255,255,0.06);
                flex-shrink: 0;
            }
            .tc-name {
                width: 100%; margin-bottom: 6px;
                background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
                border-radius: 8px; padding: 6px 10px;
                color: #f0eef6; font-size: 0.8rem; outline: none;
                transition: border-color 0.2s;
            }
            .tc-name:focus { border-color: rgba(0,188,212,0.4); }
            .tc-send-row { display: flex; gap: 6px; }
            .tc-msg {
                flex: 1;
                background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
                border-radius: 8px; padding: 8px 10px;
                color: #f0eef6; font-size: 0.85rem; outline: none;
                transition: border-color 0.2s;
            }
            .tc-msg:focus { border-color: rgba(0,188,212,0.4); }
            .tc-send {
                background: linear-gradient(135deg, #00bcd4, #1e88e5);
                border: none; border-radius: 8px; width: 38px;
                color: #fff; font-size: 1rem; font-weight: 700;
                cursor: pointer; transition: opacity 0.2s;
            }
            .tc-send:hover { opacity: 0.85; }

            @media (max-width: 768px) {
                .tc-panel { width: calc(100vw - 20px); right: 10px; bottom: 75px; height: 350px; }
                .tc-toggle { bottom: 15px; right: 15px; width: 46px; height: 46px; font-size: 1.2rem; }
            }
        `;
        document.head.appendChild(s);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
    } else {
        setTimeout(init, 800);
    }
})();
