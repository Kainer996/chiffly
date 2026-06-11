/**
 * chat-enhancements.js
 * Enhanced chat features: @mentions, emoji reactions, link detection, formatting
 */

(function() {
    console.log('💬 Chat Enhancements loading...');

    // Quick reaction emojis
    const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '👏', '😮'];

    // Store for message reactions (would be synced via socket in production)
    const messageReactions = new Map();

    const ChatEnhancements = {
        // List of usernames in the room (for mention autocomplete)
        usersInRoom: [],

        init() {
            this.enhanceExistingMessages();
            this.setupMentionAutocomplete();
            this.injectStyles();
            console.log('✅ Chat Enhancements ready!');
        },

        // Inject additional CSS for enhanced features
        injectStyles() {
            if (document.getElementById('chat-enhancements-css')) return;

            const style = document.createElement('style');
            style.id = 'chat-enhancements-css';
            style.textContent = `
                /* Enhanced Chat Message */
                .chat-message {
                    position: relative;
                    transition: background 0.2s ease;
                }

                .chat-message:hover {
                    background: rgba(255, 255, 255, 0.08);
                }

                .chat-message:hover .reaction-trigger {
                    opacity: 1;
                }

                /* @Mentions */
                .mention {
                    background: rgba(79, 195, 247, 0.2);
                    color: #4fc3f7;
                    padding: 0 4px;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .mention:hover {
                    background: rgba(79, 195, 247, 0.3);
                }

                .mention.self {
                    background: rgba(244, 197, 66, 0.25);
                    color: #f4c542;
                }

                /* Links */
                .chat-link {
                    color: #4fc3f7;
                    text-decoration: none;
                    border-bottom: 1px dotted rgba(79, 195, 247, 0.5);
                    transition: all 0.2s;
                }

                .chat-link:hover {
                    color: #81d4fa;
                    border-bottom-style: solid;
                }

                /* Reaction Trigger Button */
                .reaction-trigger {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(0, 0, 0, 0.5);
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    opacity: 0;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                }

                .reaction-trigger:hover {
                    background: rgba(0, 0, 0, 0.7);
                    color: #fff;
                }

                /* Reaction Picker */
                .reaction-picker {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    background: rgba(20, 20, 40, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 6px 10px;
                    display: none;
                    gap: 4px;
                    z-index: 100;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                }

                .reaction-picker.visible {
                    display: flex;
                }

                .reaction-picker button {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 4px 6px;
                    border-radius: 8px;
                    transition: all 0.15s;
                }

                .reaction-picker button:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: scale(1.2);
                }

                /* Message Reactions Display */
                .message-reactions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    margin-top: 6px;
                }

                .reaction-badge {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 2px 8px;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .reaction-badge:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .reaction-badge.active {
                    background: rgba(79, 195, 247, 0.2);
                    border-color: rgba(79, 195, 247, 0.4);
                }

                .reaction-badge .count {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.75rem;
                }

                /* Mention Autocomplete */
                .mention-autocomplete {
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    right: 0;
                    background: rgba(20, 20, 40, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    margin-bottom: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                    display: none;
                    z-index: 100;
                }

                .mention-autocomplete.visible {
                    display: block;
                }

                .mention-item {
                    padding: 10px 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: background 0.15s;
                }

                .mention-item:hover,
                .mention-item.selected {
                    background: rgba(79, 195, 247, 0.15);
                }

                .mention-item .avatar {
                    width: 28px;
                    height: 28px;
                    background: linear-gradient(135deg, #4fc3f7, #29b6f6);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                }

                .mention-item .name {
                    font-weight: 600;
                }

                /* System message styles */
                .chat-message.system {
                    background: rgba(66, 153, 225, 0.1);
                    border-left-color: #4299e1;
                }

                .chat-message.tip {
                    background: rgba(244, 197, 66, 0.1);
                    border-left-color: #f4c542;
                }

                .chat-message.highlight {
                    background: rgba(79, 195, 247, 0.15);
                    border-left-color: #4fc3f7;
                    animation: highlightPulse 2s ease-out;
                }

                @keyframes highlightPulse {
                    0% { background: rgba(79, 195, 247, 0.3); }
                    100% { background: rgba(79, 195, 247, 0.15); }
                }

                /* Bold and italic text */
                .chat-bold {
                    font-weight: 700;
                }

                .chat-italic {
                    font-style: italic;
                }

                /* Emoji enlargement for emoji-only messages */
                .message-text.emoji-only {
                    font-size: 2rem;
                    line-height: 1.2;
                }
            `;
            document.head.appendChild(style);
        },

        // Format message text with mentions, links, and basic markdown
        formatMessage(text, currentUsername = null) {
            // Escape HTML first
            let formatted = this.escapeHtml(text);

            // Detect and format @mentions
            formatted = formatted.replace(/@(\w+)/g, (match, username) => {
                const isSelf = currentUsername && username.toLowerCase() === currentUsername.toLowerCase();
                return `<span class="mention${isSelf ? ' self' : ''}" data-user="${username}">@${username}</span>`;
            });

            // Detect and format URLs
            const urlRegex = /(https?:\/\/[^\s<]+)/g;
            formatted = formatted.replace(urlRegex, (url) => {
                const displayUrl = url.length > 40 ? url.substring(0, 37) + '...' : url;
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${displayUrl}</a>`;
            });

            // Basic markdown: **bold** and *italic*
            formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<span class="chat-bold">$1</span>');
            formatted = formatted.replace(/\*([^*]+)\*/g, '<span class="chat-italic">$1</span>');

            return formatted;
        },

        // Check if message is emoji-only
        isEmojiOnly(text) {
            // Remove all emojis and whitespace, check if anything remains
            const withoutEmoji = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
            return withoutEmoji.length === 0 && text.trim().length <= 8;
        },

        // Create enhanced message element
        createEnhancedMessage(data, currentUsername = null) {
            const { id, username, text, timestamp, isSystem, isTip, isStreamer } = data;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message';
            messageDiv.dataset.messageId = id || Date.now();

            if (isSystem) messageDiv.classList.add('system');
            if (isTip) messageDiv.classList.add('tip');

            // Check if mentioned
            if (currentUsername && text.toLowerCase().includes(`@${currentUsername.toLowerCase()}`)) {
                messageDiv.classList.add('highlight');
            }

            const formattedText = this.formatMessage(text, currentUsername);
            const time = new Date(timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const emojiOnlyClass = this.isEmojiOnly(text) ? ' emoji-only' : '';

            let authorStyle = '';
            if (isSystem) authorStyle = 'color: #4299e1;';
            else if (isTip) authorStyle = 'color: #f4c542;';
            else if (isStreamer) authorStyle = 'color: #f39c12;';

            messageDiv.innerHTML = `
                <div class="message-author" style="${authorStyle}">${this.escapeHtml(username)}</div>
                <div class="message-text${emojiOnlyClass}">${formattedText}</div>
                <div class="message-time">${time}</div>
                <div class="message-reactions" id="reactions-${messageDiv.dataset.messageId}"></div>
                <button class="reaction-trigger" onclick="ChatEnhancements.showReactionPicker(event, '${messageDiv.dataset.messageId}')">😀</button>
                <div class="reaction-picker" id="picker-${messageDiv.dataset.messageId}">
                    ${QUICK_REACTIONS.map(emoji => 
                        `<button onclick="ChatEnhancements.addReaction('${messageDiv.dataset.messageId}', '${emoji}')">${emoji}</button>`
                    ).join('')}
                </div>
            `;

            return messageDiv;
        },

        // Show reaction picker
        showReactionPicker(event, messageId) {
            event.stopPropagation();
            
            // Hide all other pickers
            document.querySelectorAll('.reaction-picker.visible').forEach(p => p.classList.remove('visible'));
            
            const picker = document.getElementById(`picker-${messageId}`);
            if (picker) {
                picker.classList.toggle('visible');
            }

            // Close on click outside
            setTimeout(() => {
                document.addEventListener('click', function closeHandler() {
                    picker?.classList.remove('visible');
                    document.removeEventListener('click', closeHandler);
                });
            }, 10);
        },

        // Add reaction to message
        addReaction(messageId, emoji) {
            const reactions = messageReactions.get(messageId) || {};
            const currentUsername = window.currentUsername || 'User';

            if (!reactions[emoji]) {
                reactions[emoji] = [];
            }

            const userIndex = reactions[emoji].indexOf(currentUsername);
            if (userIndex > -1) {
                // Remove reaction if already added
                reactions[emoji].splice(userIndex, 1);
                if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
                // Add reaction
                reactions[emoji].push(currentUsername);
            }

            messageReactions.set(messageId, reactions);
            this.renderReactions(messageId);

            // Hide picker
            const picker = document.getElementById(`picker-${messageId}`);
            if (picker) picker.classList.remove('visible');

            // Emit reaction to server (if socket available)
            if (window.socket) {
                window.socket.emit('chat-reaction', { messageId, emoji, action: userIndex > -1 ? 'remove' : 'add' });
            }
        },

        // Render reactions for a message
        renderReactions(messageId) {
            const container = document.getElementById(`reactions-${messageId}`);
            if (!container) return;

            const reactions = messageReactions.get(messageId) || {};
            const currentUsername = window.currentUsername || 'User';

            container.innerHTML = Object.entries(reactions).map(([emoji, users]) => {
                const isActive = users.includes(currentUsername);
                return `<span class="reaction-badge${isActive ? ' active' : ''}" 
                              onclick="ChatEnhancements.addReaction('${messageId}', '${emoji}')"
                              title="${users.join(', ')}">
                    ${emoji} <span class="count">${users.length}</span>
                </span>`;
            }).join('');
        },

        // Setup mention autocomplete
        setupMentionAutocomplete() {
            const chatInput = document.querySelector('.chat-input');
            if (!chatInput) return;

            // Create autocomplete container
            const inputArea = chatInput.closest('.chat-input-area') || chatInput.parentElement;
            if (!inputArea.querySelector('.mention-autocomplete')) {
                inputArea.style.position = 'relative';
                const autocomplete = document.createElement('div');
                autocomplete.className = 'mention-autocomplete';
                autocomplete.id = 'mentionAutocomplete';
                inputArea.insertBefore(autocomplete, chatInput.parentElement);
            }

            chatInput.addEventListener('input', (e) => this.handleMentionInput(e));
            chatInput.addEventListener('keydown', (e) => this.handleMentionKeydown(e));
        },

        // Handle mention input
        handleMentionInput(e) {
            const input = e.target;
            const value = input.value;
            const cursorPos = input.selectionStart;
            
            // Find @ before cursor
            const beforeCursor = value.substring(0, cursorPos);
            const atMatch = beforeCursor.match(/@(\w*)$/);

            const autocomplete = document.getElementById('mentionAutocomplete');
            if (!autocomplete) return;

            if (atMatch) {
                const query = atMatch[1].toLowerCase();
                const filtered = this.usersInRoom.filter(u => 
                    u.toLowerCase().includes(query)
                ).slice(0, 5);

                if (filtered.length > 0) {
                    autocomplete.innerHTML = filtered.map((user, i) => `
                        <div class="mention-item${i === 0 ? ' selected' : ''}" data-user="${user}">
                            <div class="avatar">${user.charAt(0).toUpperCase()}</div>
                            <span class="name">${user}</span>
                        </div>
                    `).join('');
                    autocomplete.classList.add('visible');

                    // Add click handlers
                    autocomplete.querySelectorAll('.mention-item').forEach(item => {
                        item.addEventListener('click', () => {
                            this.insertMention(input, atMatch[0], item.dataset.user);
                            autocomplete.classList.remove('visible');
                        });
                    });
                } else {
                    autocomplete.classList.remove('visible');
                }
            } else {
                autocomplete.classList.remove('visible');
            }
        },

        // Handle keyboard navigation in mention autocomplete
        handleMentionKeydown(e) {
            const autocomplete = document.getElementById('mentionAutocomplete');
            if (!autocomplete || !autocomplete.classList.contains('visible')) return;

            const items = autocomplete.querySelectorAll('.mention-item');
            const selected = autocomplete.querySelector('.mention-item.selected');
            let selectedIndex = Array.from(items).indexOf(selected);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                if (selected) {
                    e.preventDefault();
                    const value = e.target.value;
                    const cursorPos = e.target.selectionStart;
                    const beforeCursor = value.substring(0, cursorPos);
                    const atMatch = beforeCursor.match(/@(\w*)$/);
                    if (atMatch) {
                        this.insertMention(e.target, atMatch[0], selected.dataset.user);
                    }
                    autocomplete.classList.remove('visible');
                }
            } else if (e.key === 'Escape') {
                autocomplete.classList.remove('visible');
            }
        },

        // Insert mention into input
        insertMention(input, partial, username) {
            const value = input.value;
            const cursorPos = input.selectionStart;
            const beforeCursor = value.substring(0, cursorPos - partial.length);
            const afterCursor = value.substring(cursorPos);
            
            input.value = beforeCursor + '@' + username + ' ' + afterCursor;
            input.focus();
            input.selectionStart = input.selectionEnd = beforeCursor.length + username.length + 2;
        },

        // Update users in room list
        updateUsersInRoom(users) {
            this.usersInRoom = users;
        },

        // Enhance existing messages on page
        enhanceExistingMessages() {
            // This would process existing messages if needed
        },

        // Utility: Escape HTML
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Expose globally
    window.ChatEnhancements = ChatEnhancements;

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ChatEnhancements.init());
    } else {
        ChatEnhancements.init();
    }

})();
