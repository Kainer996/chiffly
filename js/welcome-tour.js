// ============================================
// CHIFFTOWN WELCOME TOUR
// ============================================
// First-time onboarding flow for new visitors
// ============================================
(function() {
    'use strict';

    const STORAGE_KEY = 'chifftown_tour_done';
    const USERNAME_KEY = 'chifftown_username';

    const STEPS = [
        {
            title: 'Welcome to ChiffTown! 🏙️',
            body: 'A virtual town where you can hang out, play games, stream, and vibe with friends.',
            icon: '🌆',
            action: null
        },
        {
            title: 'Choose Your Name',
            body: 'Pick a name that other townspeople will see.',
            icon: '👤',
            action: 'username'
        },
        {
            title: 'Explore the Map 🗺️',
            body: 'Click any building to enter — taverns, arcades, cinemas, a casino, and more. Each venue is a different experience.',
            icon: '🏘️',
            action: null
        },
        {
            title: 'Earn XP & Coins 💰',
            body: 'Chat, play arcade games, join rooms, and tip streamers to earn XP and coins. Level up and unlock achievements in the Trophy Case!',
            icon: '⭐',
            action: null
        },
        {
            title: 'You\'re Ready!',
            body: 'Go explore ChiffTown. Start by clicking a building on the map — The Chiff Inn is a great first stop!',
            icon: '🎉',
            action: null
        }
    ];

    let overlay = null;
    let currentStep = 0;

    function shouldShow() {
        return !localStorage.getItem(STORAGE_KEY);
    }

    function create() {
        overlay = document.createElement('div');
        overlay.id = 'welcomeTour';
        overlay.innerHTML = `
            <div class="wt-backdrop"></div>
            <div class="wt-card">
                <div class="wt-icon" id="wtIcon"></div>
                <h2 class="wt-title" id="wtTitle"></h2>
                <p class="wt-body" id="wtBody"></p>
                <div class="wt-input-area" id="wtInputArea" style="display:none">
                    <input type="text" id="wtNameInput" class="wt-input" placeholder="Enter your name..." maxlength="20" autocomplete="off">
                </div>
                <div class="wt-dots" id="wtDots"></div>
                <div class="wt-actions">
                    <button class="wt-btn wt-skip" id="wtSkip">Skip Tour</button>
                    <button class="wt-btn wt-next" id="wtNext">Next →</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Build dots
        const dots = document.getElementById('wtDots');
        STEPS.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'wt-dot' + (i === 0 ? ' active' : '');
            dots.appendChild(dot);
        });

        document.getElementById('wtSkip').addEventListener('click', finish);
        document.getElementById('wtNext').addEventListener('click', next);
        document.getElementById('wtNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') next();
        });

        injectStyles();
        renderStep();

        // Animate in
        requestAnimationFrame(() => overlay.classList.add('visible'));
    }

    function renderStep() {
        const step = STEPS[currentStep];
        document.getElementById('wtIcon').textContent = step.icon;
        document.getElementById('wtTitle').textContent = step.title;
        document.getElementById('wtBody').textContent = step.body;

        const inputArea = document.getElementById('wtInputArea');
        inputArea.style.display = step.action === 'username' ? 'block' : 'none';
        if (step.action === 'username') {
            const inp = document.getElementById('wtNameInput');
            inp.value = localStorage.getItem(USERNAME_KEY) || '';
            setTimeout(() => inp.focus(), 100);
        }

        const nextBtn = document.getElementById('wtNext');
        nextBtn.textContent = currentStep === STEPS.length - 1 ? 'Enter Town 🏙️' : 'Next →';

        // Update dots
        document.querySelectorAll('.wt-dot').forEach((d, i) => {
            d.classList.toggle('active', i === currentStep);
        });
    }

    function next() {
        // Handle username step
        if (STEPS[currentStep].action === 'username') {
            const name = document.getElementById('wtNameInput').value.trim();
            if (!name) {
                document.getElementById('wtNameInput').style.borderColor = '#e74c3c';
                document.getElementById('wtNameInput').placeholder = 'Please enter a name!';
                return;
            }
            localStorage.setItem(USERNAME_KEY, name);
        }

        if (currentStep >= STEPS.length - 1) {
            finish();
            return;
        }
        currentStep++;
        renderStep();
    }

    function finish() {
        localStorage.setItem(STORAGE_KEY, '1');
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
    }

    function injectStyles() {
        if (document.getElementById('welcome-tour-css')) return;
        const s = document.createElement('style');
        s.id = 'welcome-tour-css';
        s.textContent = `
            #welcomeTour {
                position: fixed; inset: 0; z-index: 99999;
                display: flex; align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.3s ease;
            }
            #welcomeTour.visible { opacity: 1; }
            .wt-backdrop {
                position: absolute; inset: 0;
                background: rgba(5,5,16,0.85); backdrop-filter: blur(8px);
            }
            .wt-card {
                position: relative; z-index: 1;
                background: linear-gradient(170deg, #0f1a2e 0%, #0a0f1e 100%);
                border: 1px solid rgba(201,168,76,0.25);
                border-radius: 20px; padding: 2.5rem 2rem;
                max-width: 440px; width: 90vw; text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.06);
                transform: scale(0.9); transition: transform 0.3s ease;
            }
            #welcomeTour.visible .wt-card { transform: scale(1); }
            .wt-icon { font-size: 3.5rem; margin-bottom: 1rem; }
            .wt-title {
                font-size: 1.4rem; font-weight: 700; color: #c9a84c; margin-bottom: 0.6rem;
            }
            .wt-body {
                color: rgba(255,255,255,0.65); font-size: 0.95rem; line-height: 1.6;
                margin-bottom: 1.5rem;
            }
            .wt-input-area { margin-bottom: 1.5rem; }
            .wt-input {
                width: 100%; padding: 0.8rem 1rem; border-radius: 10px;
                border: 2px solid rgba(201,168,76,0.3); background: rgba(0,0,0,0.3);
                color: #e8e8f0; font-size: 1rem; text-align: center;
                outline: none; transition: border-color 0.2s;
            }
            .wt-input:focus { border-color: #c9a84c; }
            .wt-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 1.5rem; }
            .wt-dot {
                width: 8px; height: 8px; border-radius: 50%;
                background: rgba(255,255,255,0.15); transition: all 0.3s;
            }
            .wt-dot.active { background: #c9a84c; transform: scale(1.3); }
            .wt-actions { display: flex; justify-content: space-between; gap: 1rem; }
            .wt-btn {
                padding: 0.7rem 1.5rem; border-radius: 10px; border: none;
                font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
            }
            .wt-skip {
                background: transparent; color: rgba(255,255,255,0.35);
            }
            .wt-skip:hover { color: rgba(255,255,255,0.6); }
            .wt-next {
                background: linear-gradient(135deg, #c9a84c, #e8c84a);
                color: #0a0e1a; flex: 1;
            }
            .wt-next:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(201,168,76,0.3); }
            @media (max-width: 500px) {
                .wt-card { padding: 2rem 1.2rem; }
                .wt-title { font-size: 1.2rem; }
            }
        `;
        document.head.appendChild(s);
    }

    // Init — wait for page load
    function init() {
        if (!shouldShow()) return;
        // Delay slightly so loading screen can finish
        setTimeout(create, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for manual trigger
    window.WelcomeTour = { start: create, reset: () => { localStorage.removeItem(STORAGE_KEY); create(); } };

    console.log('🎓 Welcome Tour ready');
})();
