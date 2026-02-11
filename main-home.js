// ============================================
// ChiffTown — Main Homepage JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    initializeNavbar();
    initializeVenueCards();
    initializeAnimations();
    initializeAuth();
    restoreUserSession();
    initializeSocket();
});

// === Ambient Particle System (Stars/Fireflies) ===
function initializeParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height * 0.7; // top 70% only (sky)
            this.size = Math.random() * 1.8 + 0.3;
            this.speedX = (Math.random() - 0.5) * 0.15;
            this.speedY = (Math.random() - 0.5) * 0.1;
            this.opacity = Math.random() * 0.6 + 0.1;
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.life = 0;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life += this.pulseSpeed;
            
            const pulse = Math.sin(this.life + this.pulseOffset) * 0.3 + 0.7;
            this.currentOpacity = this.opacity * pulse;
            
            if (this.x < -10 || this.x > canvas.width + 10 || 
                this.y < -10 || this.y > canvas.height + 10) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 240, 200, ${this.currentOpacity})`;
            ctx.fill();
            
            // Glow
            if (this.size > 1) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 220, 150, ${this.currentOpacity * 0.1})`;
                ctx.fill();
            }
        }
    }

    const count = Math.min(80, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        animId = requestAnimationFrame(animate);
    }
    animate();

    // Pause when off-screen
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animId);
        } else {
            animate();
        }
    });
}

// === Navbar scroll effect ===
function initializeNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial check

    // Smooth scroll for anchor links
    document.querySelectorAll('.nav-link[href^="#"], a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// === Interactive Map Hotspots ===
function initializeVenueCards() {
    const hotspots = document.querySelectorAll('.map-hotspot');
    
    updateVenueAccessIndicators();
    
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const isExternal = this.getAttribute('target') === '_blank';
            
            // Allow external links without auth check
            if (isExternal) return;
            
            e.preventDefault();
            
            const isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
            if (!isSignedIn) {
                showNotification('Enter ChiffTown first to access venues!', 'warning');
                const btn = document.getElementById('signInBtn');
                if (btn) {
                    btn.style.animation = 'pulse 0.6s ease 3';
                    setTimeout(() => btn.style.animation = '', 2000);
                }
                return;
            }

            // Click animation
            this.style.opacity = '0.7';
            
            setTimeout(() => {
                window.location.href = href;
            }, 200);
        });
    });
}

function updateVenueAccessIndicators() {
    const isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
    const hotspots = document.querySelectorAll('.map-hotspot');
    
    hotspots.forEach(hotspot => {
        const isExternal = hotspot.getAttribute('target') === '_blank';
        
        // Skip external links
        if (isExternal) return;
        
        if (!isSignedIn) {
            hotspot.classList.add('locked');
            hotspot.style.opacity = '0.5';
            hotspot.style.filter = 'grayscale(0.6)';
            hotspot.style.pointerEvents = 'auto';
        } else {
            hotspot.classList.remove('locked');
            hotspot.style.opacity = '';
            hotspot.style.filter = '';
            hotspot.style.pointerEvents = '';
        }
    });
    
    updateAccessMessage(isSignedIn);
}

// Keep old function name for compatibility
function updateRoomAccessIndicators() {
    updateVenueAccessIndicators();
}

function updateAccessMessage(isSignedIn) {
    const container = document.querySelector('.interactive-map-container');
    if (!container) return;
    const parent = container.parentElement;
    let msg = parent.querySelector('.access-message');
    
    if (!isSignedIn) {
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'access-message';
            msg.innerHTML = `
                <div class="access-message-content">
                    <i class="fas fa-door-open"></i>
                    <h3>Enter ChiffTown to Visit Venues</h3>
                    <p>Sign in or walk in as a guest to explore the town</p>
                </div>
            `;
            parent.insertBefore(msg, container);
        }
    } else {
        if (msg) msg.remove();
    }
}

// === GSAP Scroll Animations ===
function initializeAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        // Fallback: CSS-only animations via IntersectionObserver
        fallbackAnimations();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Venue cards stagger in
    gsap.utils.toArray('.venue-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 40,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.08,
            ease: 'power2.out'
        });
    });

    // Feature cards
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 30,
            opacity: 0,
            duration: 0.5,
            delay: i * 0.1,
            ease: 'power2.out'
        });
    });

    // Section headers
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 25,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out'
        });
    });

    // About section
    gsap.from('.about-text', {
        scrollTrigger: {
            trigger: '.about-content',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        x: -30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
    });

    gsap.utils.toArray('.about-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: '.about-visual',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 25,
            opacity: 0,
            duration: 0.5,
            delay: i * 0.1,
            ease: 'power2.out'
        });
    });
}

function fallbackAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const elements = document.querySelectorAll('.venue-card, .feature-card, .about-card, .section-header');
    elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
        observer.observe(el);
    });
}

// === Socket.io Stats ===
function initializeSocket() {
    try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const socketUrl = isLocalhost ? 'http://localhost:3000' : window.location.origin;
        
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            timeout: 5000,
            forceNew: true
        });

        socket.on('connect', () => {
            console.log('✅ Connected to ChiffTown server');
            socket.emit('get-platform-stats');
        });

        socket.on('platform-stats', (stats) => {
            animateNumber('totalUsers', stats.totalUsers || 0);
            animateNumber('activeRooms', stats.activeRooms || 0);
            animateNumber('liveStreams', stats.liveStreams || 0);
        });

        // Refresh stats periodically
        setInterval(() => {
            if (socket.connected) socket.emit('get-platform-stats');
        }, 15000);
    } catch (e) {
        console.warn('Socket connection failed:', e);
    }
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;
    
    const diff = target - current;
    const steps = 20;
    const stepSize = diff / steps;
    let step = 0;
    
    const interval = setInterval(() => {
        step++;
        el.textContent = Math.round(current + stepSize * step);
        if (step >= steps) {
            el.textContent = target;
            clearInterval(interval);
        }
    }, 30);
}

// === Authentication ===
function restoreUserSession() {
    const isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
    const username = localStorage.getItem('chiffly_username');
    const userType = localStorage.getItem('chiffly_user_type');
    const sessionExpiry = localStorage.getItem('chiffly_session_expiry');
    
    if (sessionExpiry && new Date().getTime() > parseInt(sessionExpiry)) {
        localStorage.removeItem('chiffly_signed_in');
        localStorage.removeItem('chiffly_username');
        localStorage.removeItem('chiffly_user_type');
        localStorage.removeItem('chiffly_session_expiry');
        showNotification('Your session has expired. Please sign in again.', 'warning');
        return;
    }
    
    if (isSignedIn && username) {
        updateAuthUIForRestoredSession(username, userType);
        updateVenueAccessIndicators();
        showNotification(`Welcome back, ${username}!`, 'success');
    }
}

function createUserSession(username, userType = 'registered', rememberDuration = 24) {
    localStorage.setItem('chiffly_signed_in', 'true');
    localStorage.setItem('chiffly_username', username);
    localStorage.setItem('chiffly_user_type', userType);
    const expiryTime = new Date().getTime() + (rememberDuration * 60 * 60 * 1000);
    localStorage.setItem('chiffly_session_expiry', expiryTime.toString());
    localStorage.setItem('chiffly_current_session', JSON.stringify({
        username, userType,
        loginTime: new Date().toISOString(),
        expiryTime: new Date(expiryTime).toISOString()
    }));
}

function updateAuthUIForRestoredSession(username, userType) {
    const signInBtn = document.getElementById('signInBtn');
    const userName = document.getElementById('userName');
    const isGuest = userType === 'guest';
    
    if (signInBtn) {
        signInBtn.innerHTML = `
            <div class="user-avatar-small">
                <i class="fas fa-${isGuest ? 'walking' : 'user-circle'}"></i>
            </div>
            <span>${username}</span>
            <i class="fas fa-chevron-down"></i>
        `;
        signInBtn.classList.add('signed-in');
    }
    
    if (userName) userName.textContent = username;
    
    const userStatus = document.querySelector('.user-status');
    if (userStatus) {
        userStatus.textContent = isGuest ? 'Guest Visitor' : 'Registered User';
        userStatus.style.color = isGuest ? '#fbbf24' : '#4ade80';
    }
}

function initializeAuth() {
    const signInBtn = document.getElementById('signInBtn');
    const userMenu = document.getElementById('userMenu');
    const signOutBtn = document.getElementById('signOutBtn');
    const userName = document.getElementById('userName');
    
    let isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
    let currentUser = localStorage.getItem('chiffly_username') || 'Guest User';
    
    if (!localStorage.getItem('chiffly_registered_users')) {
        localStorage.setItem('chiffly_registered_users', JSON.stringify({}));
    }
    
    updateAuthUI(isSignedIn, currentUser);
    
    if (signInBtn) {
        signInBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!isSignedIn) {
                showSignInModal();
            } else {
                toggleUserMenu();
            }
        });
    }
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signOut();
        });
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.auth-section') && userMenu) {
            userMenu.style.display = 'none';
        }
    });
    
    function updateAuthUI(signedIn, username) {
        if (!signInBtn) return;
        if (signedIn) {
            const userType = localStorage.getItem('chiffly_user_type');
            const isGuest = userType === 'guest';
            signInBtn.innerHTML = `
                <div class="user-avatar-small">
                    <i class="fas fa-${isGuest ? 'walking' : 'user-circle'}"></i>
                </div>
                <span>${username}</span>
                <i class="fas fa-chevron-down"></i>
            `;
            signInBtn.classList.add('signed-in');
            if (userName) userName.textContent = username;
            
            const userStatus = document.querySelector('.user-status');
            if (userStatus) {
                userStatus.textContent = isGuest ? 'Guest Visitor' : 'Registered User';
                userStatus.style.color = isGuest ? '#fbbf24' : '#4ade80';
            }
        } else {
            signInBtn.innerHTML = `
                <span class="enter-btn-glow"></span>
                <i class="fas fa-door-open"></i>
                <span>Enter Town</span>
            `;
            signInBtn.classList.remove('signed-in');
            if (userMenu) userMenu.style.display = 'none';
        }
    }
    
    function toggleUserMenu() {
        if (!userMenu) return;
        userMenu.style.display = (userMenu.style.display === 'none' || !userMenu.style.display) ? 'block' : 'none';
    }
    
    function getRegisteredUsers() {
        return JSON.parse(localStorage.getItem('chiffly_registered_users') || '{}');
    }
    
    function registerUser(username, email, password) {
        const users = getRegisteredUsers();
        if (users[username]) return { success: false, message: 'Username already taken!' };
        if (Object.values(users).find(u => u.email === email)) return { success: false, message: 'Email already registered!' };
        
        users[username] = {
            email, password,
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            loginCount: 0,
            xp: 0, achievements: [], inventory: [],
            preferences: { rememberMe: true, theme: 'default', notifications: true }
        };
        localStorage.setItem('chiffly_registered_users', JSON.stringify(users));
        return { success: true, message: 'Account created successfully!' };
    }
    
    function validateSignIn(username, password) {
        const users = getRegisteredUsers();
        if (users[username] && users[username].password === password) {
            users[username].lastLogin = new Date().toISOString();
            users[username].loginCount = (users[username].loginCount || 0) + 1;
            localStorage.setItem('chiffly_registered_users', JSON.stringify(users));
            return { success: true };
        } else if (users[username]) {
            return { success: false, message: 'Incorrect password!' };
        }
        return { success: false, message: 'Account not found. Please register first!' };
    }
    
    function showSignInModal() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2><i class="fas fa-door-open"></i> <span id="modalTitle">Enter ChiffTown</span></h2>
                    <button class="close-modal" onclick="this.closest('.auth-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <div class="auth-toggle">
                        <button class="auth-toggle-btn active" id="signInToggle">
                            <i class="fas fa-door-open"></i> Enter
                        </button>
                        <button class="auth-toggle-btn" id="signUpToggle">
                            <i class="fas fa-key"></i> Register
                        </button>
                    </div>
                    <form id="signInForm" class="auth-form active">
                        <div class="form-group">
                            <label for="signInUsername">Username</label>
                            <input type="text" id="signInUsername" placeholder="Your username" required>
                        </div>
                        <div class="form-group">
                            <label for="signInPassword">Password</label>
                            <input type="password" id="signInPassword" placeholder="Your password" required>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="rememberMe" checked>
                                <span class="checkmark"></span>
                                Remember me for 7 days
                            </label>
                        </div>
                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-door-open"></i> Step Inside
                        </button>
                    </form>
                    <form id="signUpForm" class="auth-form">
                        <div class="form-group">
                            <label for="signUpUsername">Choose Username</label>
                            <input type="text" id="signUpUsername" placeholder="Pick a name" required>
                        </div>
                        <div class="form-group">
                            <label for="signUpEmail">Email Address</label>
                            <input type="email" id="signUpEmail" placeholder="Your email" required>
                        </div>
                        <div class="form-group">
                            <label for="signUpPassword">Password</label>
                            <input type="password" id="signUpPassword" placeholder="Create password" required>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" placeholder="Confirm password" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-key"></i> Create Account & Enter
                        </button>
                    </form>
                    <div class="auth-divider"><span>or</span></div>
                    <button class="guest-signin-btn" onclick="signInAsGuest()">
                        <i class="fas fa-walking"></i> Walk In as Guest
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');
        const signInToggle = document.getElementById('signInToggle');
        const signUpToggle = document.getElementById('signUpToggle');
        const modalTitle = document.getElementById('modalTitle');
        
        signInToggle.addEventListener('click', () => {
            signInToggle.classList.add('active');
            signUpToggle.classList.remove('active');
            signInForm.classList.add('active');
            signUpForm.classList.remove('active');
            modalTitle.textContent = 'Enter ChiffTown';
        });
        
        signUpToggle.addEventListener('click', () => {
            signUpToggle.classList.add('active');
            signInToggle.classList.remove('active');
            signUpForm.classList.add('active');
            signInForm.classList.remove('active');
            modalTitle.textContent = 'Join ChiffTown';
        });
        
        signInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('signInUsername').value;
            const password = document.getElementById('signInPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const result = validateSignIn(username, password);
            if (result.success) {
                signInWithRemember(username, false, rememberMe);
                modal.remove();
            } else {
                showNotification(result.message, 'error');
            }
        });
        
        signUpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('signUpUsername').value;
            const email = document.getElementById('signUpEmail').value;
            const password = document.getElementById('signUpPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            
            if (password !== confirm) { showNotification('Passwords do not match!', 'error'); return; }
            if (password.length < 6) { showNotification('Password must be at least 6 characters!', 'error'); return; }
            
            const result = registerUser(username, email, password);
            if (result.success) {
                showNotification(result.message, 'success');
                setTimeout(() => { signIn(username); modal.remove(); }, 800);
            } else {
                showNotification(result.message, 'error');
            }
        });
        
        setTimeout(() => document.getElementById('signInUsername')?.focus(), 100);
    }
    
    function signIn(username, isGuest = false) {
        signInWithRemember(username, isGuest, true);
    }
    
    function signInWithRemember(username, isGuest = false, rememberMe = true) {
        isSignedIn = true;
        currentUser = username;
        const duration = rememberMe ? (isGuest ? 24 : 168) : 24;
        createUserSession(username, isGuest ? 'guest' : 'registered', duration);
        updateAuthUI(true, username);
        updateVenueAccessIndicators();
        
        if (isGuest) {
            showNotification(`Welcome, ${username}! You're visiting as a guest.`, 'info');
        } else {
            showNotification(`Welcome to ChiffTown, ${username}!`, 'success');
        }
    }
    
    function signOut() {
        isSignedIn = false;
        currentUser = 'Guest User';
        localStorage.removeItem('chiffly_signed_in');
        localStorage.removeItem('chiffly_username');
        localStorage.removeItem('chiffly_user_type');
        localStorage.removeItem('chiffly_session_expiry');
        localStorage.removeItem('chiffly_current_session');
        updateAuthUI(false, '');
        updateVenueAccessIndicators();
        if (userMenu) userMenu.style.display = 'none';
        showNotification('You have left ChiffTown', 'info');
    }
    
    window.signInAsGuest = function() {
        const guestName = `Guest${Math.floor(Math.random() * 1000)}`;
        signIn(guestName, true);
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
    };
    
    // Debug
    window.showRegisteredUsers = function() {
        console.log('Registered Users:', getRegisteredUsers());
    };
    window.clearAllUserData = function() {
        ['chiffly_registered_users', 'chiffly_signed_in', 'chiffly_username', 'chiffly_user_type', 'chiffly_session_expiry', 'chiffly_current_session'].forEach(k => localStorage.removeItem(k));
        showNotification('All user data cleared!', 'warning');
        location.reload();
    };
    window.showUserInfo = function(username) {
        const users = getRegisteredUsers();
        const session = JSON.parse(localStorage.getItem('chiffly_current_session') || '{}');
        if (!username && session.username) username = session.username;
        if (username && users[username]) {
            const u = users[username];
            const level = typeof xpSystem !== 'undefined' ? xpSystem.getLevel(u.xp || 0) : Math.floor((u.xp || 0) / 100) + 1;
            console.log(`📊 ${username}:`, { ...u, level });
            showNotification(`${username} | Lvl ${level} | XP: ${u.xp || 0}`, 'info');
        }
    };
    window.extendSession = function(hours = 24) {
        const exp = localStorage.getItem('chiffly_session_expiry');
        if (exp) {
            localStorage.setItem('chiffly_session_expiry', (new Date().getTime() + hours * 3600000).toString());
            showNotification(`Session extended by ${hours}h`, 'success');
        }
    };
}

// === Notification ===
function showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    n.innerHTML = `<i class="fas fa-${icons[type] || icons.info}"></i><span>${message}</span>`;
    document.body.appendChild(n);
    
    setTimeout(() => n.classList.add('show'), 50);
    setTimeout(() => {
        n.classList.remove('show');
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// === Performance ===
function debounce(fn, wait) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

console.log('🏘️ ChiffTown loaded successfully!');
