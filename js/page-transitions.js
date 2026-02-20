/**
 * page-transitions.js
 * Smooth page entry/exit transitions for seamless navigation feel.
 * Works alongside loading-screen.js for a polished experience.
 */

(function() {
    'use strict';

    console.log('✨ Page Transitions initializing...');

    const PageTransitions = {
        initialized: false,

        init() {
            if (this.initialized) return;

            // Inject styles
            this.injectStyles();

            // Play entry animation on page load
            this.playEntryAnimation();

            // Setup exit transitions on links
            this.setupExitTransitions();

            this.initialized = true;
            console.log('✅ Page Transitions ready!');
        },

        injectStyles() {
            if (document.getElementById('page-transitions-css')) return;

            const style = document.createElement('style');
            style.id = 'page-transitions-css';
            style.textContent = `
                /* Page Entry Animation */
                @keyframes pageSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pageFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                /* Apply entry animation to body */
                body.page-entering {
                    animation: pageFadeIn 0.4s ease-out forwards;
                }

                body.page-entering main,
                body.page-entering .interactive-map-container,
                body.page-entering .room-container,
                body.page-entering .main-content,
                body.page-entering section:first-of-type {
                    animation: pageSlideIn 0.5s ease-out 0.1s both;
                }

                /* Exit transition overlay */
                .page-exit-overlay {
                    position: fixed;
                    inset: 0;
                    background: #0a0a1a;
                    z-index: 99998;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }

                .page-exit-overlay.active {
                    opacity: 1;
                    pointer-events: all;
                }

                /* Stagger children animations */
                body.page-entering .navbar {
                    animation: pageFadeIn 0.3s ease-out both;
                }

                body.page-entering .fs-hud {
                    animation: pageSlideIn 0.4s ease-out 0.15s both;
                }

                body.page-entering .chat-area {
                    animation: pageSlideIn 0.5s ease-out 0.2s both;
                }

                body.page-entering .participants-area {
                    animation: pageSlideIn 0.5s ease-out 0.25s both;
                }

                /* Footer stagger */
                body.page-entering footer,
                body.page-entering .page-footer {
                    animation: pageFadeIn 0.5s ease-out 0.3s both;
                }
            `;
            document.head.appendChild(style);
        },

        playEntryAnimation() {
            // Add entry class to body
            document.body.classList.add('page-entering');

            // Remove class after animation completes
            setTimeout(() => {
                document.body.classList.remove('page-entering');
            }, 800);
        },

        setupExitTransitions() {
            // Create exit overlay
            const overlay = document.createElement('div');
            overlay.className = 'page-exit-overlay';
            overlay.id = 'pageExitOverlay';
            document.body.appendChild(overlay);

            // Note: We don't intercept links here since loading-screen.js already does.
            // This just provides the entry animation and visual polish.
            // If loading-screen.js is not present, we add exit handling as well.

            if (!window.LoadingScreen) {
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (!link) return;

                    const href = link.getAttribute('href');
                    if (!href || href.startsWith('#') || href.startsWith('http') ||
                        href.startsWith('mailto:') || href.startsWith('tel:') ||
                        link.target === '_blank' || e.ctrlKey || e.metaKey) {
                        return;
                    }

                    e.preventDefault();
                    this.navigateWithTransition(href);
                });
            }
        },

        navigateWithTransition(url) {
            const overlay = document.getElementById('pageExitOverlay');
            if (overlay) {
                overlay.classList.add('active');
                setTimeout(() => {
                    window.location.href = url;
                }, 300);
            } else {
                window.location.href = url;
            }
        }
    };

    // Expose globally
    window.PageTransitions = PageTransitions;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PageTransitions.init());
    } else {
        PageTransitions.init();
    }

})();
