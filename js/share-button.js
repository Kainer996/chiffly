/**
 * ChiffTown Share Button
 * Adds a floating action button (FAB) to venue pages for easy sharing
 * Supports Web Share API with clipboard fallback
 */

(function() {
    'use strict';

    // Configuration - can be overridden via data attributes
    const defaultConfig = {
        message: 'Check out ChiffTown!',
        buttonText: 'Share',
        position: 'bottom-right',
        initialPulse: true
    };

    // Get configuration from data attribute or use defaults
    function getConfig() {
        const scriptTag = document.querySelector('script[data-share-message]');
        if (scriptTag) {
            return {
                message: scriptTag.getAttribute('data-share-message') || defaultConfig.message,
                buttonText: scriptTag.getAttribute('data-share-text') || defaultConfig.buttonText,
                position: scriptTag.getAttribute('data-share-position') || defaultConfig.position,
                initialPulse: scriptTag.getAttribute('data-share-pulse') !== 'false'
            };
        }
        return defaultConfig;
    }

    // Create and inject the CSS
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chifftown-share-fab {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #c9a84c 0%, #d4a574 100%);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(201, 168, 76, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 9999;
                color: #0d1b2a;
                font-size: 20px;
                outline: none;
                -webkit-tap-highlight-color: transparent;
            }

            .chifftown-share-fab:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 16px rgba(201, 168, 76, 0.5), 0 3px 8px rgba(0, 0, 0, 0.4);
            }

            .chifftown-share-fab:active {
                transform: translateY(-1px) scale(0.95);
            }

            .chifftown-share-fab.pulse {
                animation: sharePulse 2s ease-in-out 3;
            }

            .chifftown-share-fab.bounce {
                animation: shareBounce 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes sharePulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 4px 12px rgba(201, 168, 76, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3);
                }
                50% {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(201, 168, 76, 0.6), 0 3px 10px rgba(0, 0, 0, 0.4);
                }
            }

            @keyframes shareBounce {
                0%, 100% { transform: translateY(0); }
                25% { transform: translateY(-10px); }
                50% { transform: translateY(-5px); }
                75% { transform: translateY(-7px); }
            }

            /* Toast notification */
            .chifftown-share-toast {
                position: fixed;
                bottom: 90px;
                right: 20px;
                background: rgba(201, 168, 76, 0.95);
                color: #0d1b2a;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
            }

            .chifftown-share-toast.show {
                opacity: 1;
                transform: translateY(0);
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .chifftown-share-fab {
                    bottom: 15px;
                    right: 15px;
                    width: 50px;
                    height: 50px;
                    font-size: 18px;
                }

                .chifftown-share-toast {
                    bottom: 80px;
                    right: 15px;
                    font-size: 13px;
                    padding: 10px 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Create the FAB button
    function createButton(config) {
        const button = document.createElement('button');
        button.className = 'chifftown-share-fab';
        button.innerHTML = '<i class="fas fa-share-nodes"></i>';
        button.setAttribute('aria-label', 'Share this venue');
        button.setAttribute('title', 'Share with friends');

        if (config.initialPulse) {
            button.classList.add('pulse');
            setTimeout(() => button.classList.remove('pulse'), 6000);
        }

        return button;
    }

    // Create toast notification
    function createToast() {
        const toast = document.createElement('div');
        toast.className = 'chifftown-share-toast';
        toast.textContent = '✨ Link copied!';
        return toast;
    }

    // Show toast notification
    function showToast(toast, message = '✨ Link copied!') {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Copy to clipboard
    async function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Clipboard API failed:', err);
            }
        }
        
        // Fallback method
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            return false;
        }
    }

    // Handle share action
    async function handleShare(config, button, toast) {
        const shareUrl = window.location.href;
        const shareData = {
            title: document.title,
            text: config.message,
            url: shareUrl
        };

        // Add bounce animation
        button.classList.add('bounce');
        setTimeout(() => button.classList.remove('bounce'), 400);

        // Try Web Share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return; // Success, no need for toast
            } catch (err) {
                // User cancelled or error - fall through to clipboard
                if (err.name !== 'AbortError') {
                    console.log('Share failed, using clipboard fallback:', err);
                }
            }
        }

        // Fallback: Copy to clipboard
        const copied = await copyToClipboard(shareUrl);
        if (copied) {
            showToast(toast, '✨ Link copied!');
        } else {
            showToast(toast, '❌ Copy failed');
        }
    }

    // Initialize the share button
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Check if Font Awesome is loaded, if not, load it
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(faLink);
        }

        const config = getConfig();
        
        injectStyles();
        const button = createButton(config);
        const toast = createToast();

        document.body.appendChild(button);
        document.body.appendChild(toast);

        button.addEventListener('click', () => handleShare(config, button, toast));
    }

    // Auto-initialize
    init();
})();
