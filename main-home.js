// Modern Home Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page
    initializeRoomCards();
    initializeAnimations();
    initializeNavigation();
    initializeAuth();
});

// Room Cards Functionality
function initializeRoomCards() {
    const roomCards = document.querySelectorAll('.room-card');
    
    // Check initial authentication status
    updateRoomAccessIndicators();
    
    roomCards.forEach(card => {
        // Add click handler for navigation
        card.addEventListener('click', function() {
            const href = this.getAttribute('data-href');
            if (href) {
                // Check if user is signed in
                const isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
                
                if (!isSignedIn) {
                    // Show authentication required message
                    showNotification('Please enter Chiffly first to access rooms!', 'warning');
                    
                    // Highlight the Enter button
                    const signInBtn = document.getElementById('signInBtn');
                    signInBtn.style.animation = 'pulse 1s ease-in-out 3';
                    
                    setTimeout(() => {
                        signInBtn.style.animation = '';
                    }, 3000);
                    
                    return;
                }
                
                // Add loading animation
                this.style.transform = 'scale(0.95)';
                this.style.opacity = '0.8';
                
                setTimeout(() => {
                    window.location.href = href;
                }, 200);
            }
        });

        // Enhanced hover effects
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.room-icon');
            const overlay = this.querySelector('.room-overlay');
            
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
            
            if (overlay) {
                overlay.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.room-icon');
            const overlay = this.querySelector('.room-overlay');
            
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
            
            if (overlay) {
                overlay.style.opacity = '0';
            }
        });
    });
}

function updateRoomAccessIndicators() {
    const isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
    const roomCards = document.querySelectorAll('.room-card');
    
    roomCards.forEach(card => {
        const existingLock = card.querySelector('.access-lock');
        
        if (!isSignedIn) {
            // Add lock indicator if not signed in
            if (!existingLock) {
                const lockIndicator = document.createElement('div');
                lockIndicator.className = 'access-lock';
                lockIndicator.innerHTML = '<i class="fas fa-lock"></i>';
                card.appendChild(lockIndicator);
            }
            card.classList.add('locked');
        } else {
            // Remove lock indicator if signed in
            if (existingLock) {
                existingLock.remove();
            }
            card.classList.remove('locked');
        }
    });
    
    // Show/hide access message
    updateAccessMessage(isSignedIn);
}

function updateAccessMessage(isSignedIn) {
    const container = document.querySelector('.container');
    const roomsGrid = document.querySelector('.rooms-grid');
    let accessMessage = document.querySelector('.access-message');
    
    if (!isSignedIn) {
        if (!accessMessage) {
            accessMessage = document.createElement('div');
            accessMessage.className = 'access-message';
            accessMessage.innerHTML = `
                <div class="access-message-content">
                    <i class="fas fa-door-open"></i>
                    <h3>Enter Chiffly to Access Rooms</h3>
                    <p>Please sign in or walk in as a guest to explore our social spaces</p>
                </div>
            `;
            container.insertBefore(accessMessage, roomsGrid);
        }
    } else {
        if (accessMessage) {
            accessMessage.remove();
        }
    }
}

// Page Animations
function initializeAnimations() {
    // Animate room cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe room cards
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1 + 0.3}s, transform 0.6s ease ${index * 0.1 + 0.3}s`;
        observer.observe(card);
    });
}

// Navigation
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
        }

        lastScrollY = currentScrollY;
    });

    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Authentication functionality
function initializeAuth() {
    const signInBtn = document.getElementById('signInBtn');
    const userMenu = document.getElementById('userMenu');
    const signOutBtn = document.getElementById('signOutBtn');
    const userName = document.getElementById('userName');
    
    let isSignedIn = localStorage.getItem('chiffly_signed_in') === 'true';
    let currentUser = localStorage.getItem('chiffly_username') || 'Guest User';
    
    // Initialize registered users database (in a real app, this would be server-side)
    if (!localStorage.getItem('chiffly_registered_users')) {
        localStorage.setItem('chiffly_registered_users', JSON.stringify({}));
    }
    
    // Update UI based on sign-in state
    updateAuthUI(isSignedIn, currentUser);
    
    // Sign in button click handler
    signInBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (!isSignedIn) {
            // Show sign-in modal or redirect to sign-in page
            showSignInModal();
        } else {
            // Toggle user menu
            toggleUserMenu();
        }
    });
    
    // Sign out button click handler
    signOutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signOut();
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.auth-section')) {
            userMenu.style.display = 'none';
        }
    });
    
    function updateAuthUI(signedIn, username) {
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
            userName.textContent = username;
            
            // Update user status in the menu
            const userStatus = document.querySelector('.user-status');
            if (userStatus) {
                userStatus.textContent = isGuest ? 'Guest Visitor' : 'Registered User';
                userStatus.style.color = isGuest ? '#ed8936' : '#68d391';
            }
        } else {
            signInBtn.innerHTML = `
                <i class="fas fa-door-open"></i>
                Enter
            `;
            signInBtn.classList.remove('signed-in');
            userMenu.style.display = 'none';
        }
    }
    
    function toggleUserMenu() {
        if (userMenu.style.display === 'none' || !userMenu.style.display) {
            userMenu.style.display = 'block';
        } else {
            userMenu.style.display = 'none';
        }
    }
    
    function getRegisteredUsers() {
        return JSON.parse(localStorage.getItem('chiffly_registered_users') || '{}');
    }
    
    function registerUser(username, email, password) {
        const registeredUsers = getRegisteredUsers();
        
        // Check if username already exists
        if (registeredUsers[username]) {
            return { success: false, message: 'Username already taken!' };
        }
        
        // Check if email already exists
        const existingEmail = Object.values(registeredUsers).find(user => user.email === email);
        if (existingEmail) {
            return { success: false, message: 'Email already registered!' };
        }
        
        // Register the user
        registeredUsers[username] = {
            email: email,
            password: password, // In a real app, this would be hashed
            registeredAt: new Date().toISOString()
        };
        
        localStorage.setItem('chiffly_registered_users', JSON.stringify(registeredUsers));
        return { success: true, message: 'Account created successfully!' };
    }
    
    function validateSignIn(username, password) {
        const registeredUsers = getRegisteredUsers();
        
        // Check if user exists and password matches
        if (registeredUsers[username] && registeredUsers[username].password === password) {
            return { success: true, message: 'Welcome back!' };
        } else if (registeredUsers[username]) {
            return { success: false, message: 'Incorrect password!' };
        } else {
            return { success: false, message: 'Account not found. Please register first!' };
        }
    }
    
    function showSignInModal() {
        // Create a simple sign-in modal
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2><i class="fas fa-door-open"></i> <span id="modalTitle">Enter Chiffly</span></h2>
                    <button class="close-modal" onclick="this.closest('.auth-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <!-- Auth Toggle Buttons -->
                    <div class="auth-toggle">
                        <button class="auth-toggle-btn active" id="signInToggle">
                            <i class="fas fa-door-open"></i>
                            Enter
                        </button>
                        <button class="auth-toggle-btn" id="signUpToggle">
                            <i class="fas fa-key"></i>
                            Register
                        </button>
                    </div>
                    
                    <!-- Sign In Form -->
                    <form id="signInForm" class="auth-form active">
                        <div class="form-group">
                            <label for="signInUsername">Username</label>
                            <input type="text" id="signInUsername" name="username" placeholder="Enter your username" required>
                        </div>
                        <div class="form-group">
                            <label for="signInPassword">Password</label>
                            <input type="password" id="signInPassword" name="password" placeholder="Enter your password" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-door-open"></i>
                            Step Inside
                        </button>
                    </form>
                    
                    <!-- Sign Up Form -->
                    <form id="signUpForm" class="auth-form">
                        <div class="form-group">
                            <label for="signUpUsername">Choose Username</label>
                            <input type="text" id="signUpUsername" name="username" placeholder="Choose a unique username" required>
                        </div>
                        <div class="form-group">
                            <label for="signUpEmail">Email Address</label>
                            <input type="email" id="signUpEmail" name="email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="signUpPassword">Create Password</label>
                            <input type="password" id="signUpPassword" name="password" placeholder="Create a secure password" required>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-key"></i>
                            Create Account & Enter
                        </button>
                    </form>
                    
                    <div class="auth-divider">
                        <span>or</span>
                    </div>
                    <button class="guest-signin-btn" onclick="signInAsGuest()">
                        <i class="fas fa-walking"></i>
                        Walk In as Guest
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Get form elements
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');
        const signInToggle = document.getElementById('signInToggle');
        const signUpToggle = document.getElementById('signUpToggle');
        const modalTitle = document.getElementById('modalTitle');
        
        // Toggle between sign in and sign up
        signInToggle.addEventListener('click', function() {
            signInToggle.classList.add('active');
            signUpToggle.classList.remove('active');
            signInForm.classList.add('active');
            signUpForm.classList.remove('active');
            modalTitle.innerHTML = 'Enter Chiffly';
        });
        
        signUpToggle.addEventListener('click', function() {
            signUpToggle.classList.add('active');
            signInToggle.classList.remove('active');
            signUpForm.classList.add('active');
            signInForm.classList.remove('active');
            modalTitle.innerHTML = 'Join Chiffly';
        });
        
        // Handle sign in form submission
        signInForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('signInUsername').value;
            const password = document.getElementById('signInPassword').value;
            
            // Validate against registered users
            const validation = validateSignIn(username, password);
            
            if (validation.success) {
                signIn(username);
                modal.remove();
            } else {
                showNotification(validation.message, 'error');
            }
        });
        
        // Handle sign up form submission
        signUpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('signUpUsername').value;
            const email = document.getElementById('signUpEmail').value;
            const password = document.getElementById('signUpPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate passwords match
            if (password !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            // Validate password strength
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters long!', 'error');
                return;
            }
            
            // Attempt to register the user
            const registration = registerUser(username, email, password);
            
            if (registration.success) {
                showNotification(registration.message, 'success');
                setTimeout(() => {
                    signIn(username);
                    modal.remove();
                }, 1000);
            } else {
                showNotification(registration.message, 'error');
            }
        });
        
        // Focus on username input
        setTimeout(() => {
            document.getElementById('signInUsername').focus();
        }, 100);
    }
    
    function signIn(username, isGuest = false) {
        isSignedIn = true;
        currentUser = username;
        localStorage.setItem('chiffly_signed_in', 'true');
        localStorage.setItem('chiffly_username', username);
        localStorage.setItem('chiffly_user_type', isGuest ? 'guest' : 'registered');
        updateAuthUI(true, username);
        updateRoomAccessIndicators();
        
        // Show welcome message
        if (isGuest) {
            showNotification(`Welcome, ${username}! You're visiting as a guest.`, 'info');
        } else {
            showNotification(`Welcome inside, ${username}!`, 'success');
        }
    }
    
    function signOut() {
        const userType = localStorage.getItem('chiffly_user_type');
        isSignedIn = false;
        currentUser = 'Guest User';
        localStorage.removeItem('chiffly_signed_in');
        localStorage.removeItem('chiffly_username');
        localStorage.removeItem('chiffly_user_type');
        updateAuthUI(false, '');
        updateRoomAccessIndicators();
        userMenu.style.display = 'none';
        
        if (userType === 'guest') {
            showNotification('Thanks for visiting as a guest!', 'info');
        } else {
            showNotification('You have exited Chiffly', 'info');
        }
    }
    
    // Global function for guest sign-in
    window.signInAsGuest = function() {
        const guestName = `Guest${Math.floor(Math.random() * 1000)}`;
        signIn(guestName, true);
        document.querySelector('.auth-modal').remove();
    };
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Debug functions (for testing purposes)
    window.showRegisteredUsers = function() {
        const users = getRegisteredUsers();
        console.log('Registered Users:', users);
        const userList = Object.keys(users).join(', ');
        showNotification(`Registered users: ${userList || 'None'}`, 'info');
    };
    
    window.clearAllUserData = function() {
        localStorage.removeItem('chiffly_registered_users');
        localStorage.removeItem('chiffly_signed_in');
        localStorage.removeItem('chiffly_username');
        localStorage.removeItem('chiffly_user_type');
        showNotification('All user data cleared!', 'warning');
        location.reload();
    };
    
    // Console helper message
    console.log('🚪 Chiffly Authentication System');
    console.log('📝 To see registered users: showRegisteredUsers()');
    console.log('🗑️ To clear all data: clearAllUserData()');
}

// Utility Functions
function addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple effect to room cards
document.addEventListener('DOMContentLoaded', function() {
    const roomCards = document.querySelectorAll('.room-card');
    
    roomCards.forEach(card => {
        card.addEventListener('click', function(e) {
            addRippleEffect(this, e);
        });
    });
});

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized scroll handler
const optimizedScrollHandler = debounce(() => {
    // Handle scroll-based animations here if needed
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);

console.log('Chiffly Modern Homepage loaded successfully!'); 