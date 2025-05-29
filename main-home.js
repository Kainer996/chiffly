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
    
    roomCards.forEach(card => {
        // Add click handler for navigation
        card.addEventListener('click', function() {
            const href = this.getAttribute('data-href');
            if (href) {
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
            signInBtn.innerHTML = `
                <div class="user-avatar-small">
                    <i class="fas fa-user-circle"></i>
                </div>
                <span>${username}</span>
                <i class="fas fa-chevron-down"></i>
            `;
            signInBtn.classList.add('signed-in');
            userName.textContent = username;
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
    
    function showSignInModal() {
        // Create a simple sign-in modal
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2><i class="fas fa-door-open"></i> Enter Chiffly</h2>
                    <button class="close-modal" onclick="this.closest('.auth-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="auth-modal-body">
                    <form id="signInForm">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" placeholder="Enter your username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" placeholder="Enter your password" required>
                        </div>
                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-door-open"></i>
                            Step Inside
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
        
        // Handle form submission
        document.getElementById('signInForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Simple authentication (in a real app, this would be server-side)
            if (username && password) {
                signIn(username);
                modal.remove();
            }
        });
        
        // Focus on username input
        setTimeout(() => {
            document.getElementById('username').focus();
        }, 100);
    }
    
    function signIn(username) {
        isSignedIn = true;
        currentUser = username;
        localStorage.setItem('chiffly_signed_in', 'true');
        localStorage.setItem('chiffly_username', username);
        updateAuthUI(true, username);
        
        // Show welcome message
        showNotification(`Welcome inside, ${username}!`, 'success');
    }
    
    function signOut() {
        isSignedIn = false;
        currentUser = 'Guest User';
        localStorage.removeItem('chiffly_signed_in');
        localStorage.removeItem('chiffly_username');
        updateAuthUI(false, '');
        userMenu.style.display = 'none';
        
        showNotification('You have exited Chiffly', 'info');
    }
    
    // Global function for guest sign-in
    window.signInAsGuest = function() {
        const guestName = `Guest${Math.floor(Math.random() * 1000)}`;
        signIn(guestName);
        document.querySelector('.auth-modal').remove();
    };
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
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