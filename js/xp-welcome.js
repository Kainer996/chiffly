// ============================================
// XP WELCOME TUTORIAL
// Shows first-time visitors how the XP system works
// ============================================

(function() {
    'use strict';

    const WELCOME_KEY = 'chifftown_xp_welcome_shown';

    function init() {
        // Only show once
        if (localStorage.getItem(WELCOME_KEY)) return;
        
        // Wait for page to settle
        setTimeout(showWelcome, 2500);
    }

    function showWelcome() {
        localStorage.setItem(WELCOME_KEY, 'true');

        const overlay = document.createElement('div');
        overlay.id = 'xpWelcomeOverlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(8px); animation: fadeIn 0.3s ease;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, #0f1423 0%, #1a1f35 100%);
            border: 1px solid rgba(201,168,76,0.3);
            border-radius: 20px; padding: 36px 32px; max-width: 420px; width: 90%;
            text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            animation: slideUp 0.4s ease;
        `;

        modal.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 12px;">🏘️</div>
            <h2 style="color: #c9a84c; font-family: 'Playfair Display', serif; margin: 0 0 8px 0; font-size: 1.6rem;">
                Welcome to Chifftown!
            </h2>
            <p style="color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif; font-size: 0.9rem; margin: 0 0 20px 0; line-height: 1.5;">
                Explore venues, chat with others, and earn XP to unlock new buildings!
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); padding: 12px 16px; border-radius: 12px;">
                    <span style="font-size: 1.4rem;">✨</span>
                    <div>
                        <div style="color: #40E0D0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.85rem;">Earn XP</div>
                        <div style="color: rgba(255,255,255,0.5); font-family: 'Inter', sans-serif; font-size: 0.75rem;">Visit venues, chat, play games</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); padding: 12px 16px; border-radius: 12px;">
                    <span style="font-size: 1.4rem;">🔓</span>
                    <div>
                        <div style="color: #c9a84c; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.85rem;">Unlock Buildings</div>
                        <div style="color: rgba(255,255,255,0.5); font-family: 'Inter', sans-serif; font-size: 0.75rem;">Level up to access new venues</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.04); padding: 12px 16px; border-radius: 12px;">
                    <span style="font-size: 1.4rem;">🏆</span>
                    <div>
                        <div style="color: #ff6b35; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 0.85rem;">Collect Achievements</div>
                        <div style="color: rgba(255,255,255,0.5); font-family: 'Inter', sans-serif; font-size: 0.75rem;">Complete challenges for rewards</div>
                    </div>
                </div>
            </div>
            
            <button id="xpWelcomeClose" style="
                width: 100%; padding: 14px; border: none; border-radius: 12px; cursor: pointer;
                background: linear-gradient(135deg, #c9a84c, #e8c84a); color: #0a0e1a;
                font-family: 'Inter', sans-serif; font-weight: 700; font-size: 1rem;
                letter-spacing: 0.5px; transition: all 0.2s;
                box-shadow: 0 4px 20px rgba(201,168,76,0.4);
            ">
                Start Exploring! 🚀
            </button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);

        document.getElementById('xpWelcomeClose').addEventListener('click', function() {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.style.transition = 'opacity 0.3s';
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
