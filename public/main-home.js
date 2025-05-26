// Socket.IO connection
console.log('Main home script loading...');
const socket = io();

// DOM elements
const totalUsersSpan = document.getElementById('totalUsers');
const activeRoomsSpan = document.getElementById('activeRooms');
const liveStreamsSpan = document.getElementById('liveStreams');
const questingUsersSpan = document.getElementById('questingUsers');
const questingRoomsSpan = document.getElementById('questingRooms');
const pubUsersSpan = document.getElementById('pubUsers');
const pubRoomsSpan = document.getElementById('pubRooms');

// Data storage
let platformStats = {
    totalUsers: 0,
    activeRooms: 0,
    liveStreams: 0,
    questingUsers: 0,
    questingRooms: 0,
    pubUsers: 0,
    pubRooms: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    requestPlatformStats();
    startStatsUpdater();
});

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to Social Hub');
    requestPlatformStats();
});

socket.on('disconnect', () => {
    console.log('Disconnected from Social Hub');
});

socket.on('platform-stats', (stats) => {
    updatePlatformStats(stats);
});

socket.on('stats-update', (stats) => {
    updatePlatformStats(stats);
});

// Event listeners
function setupEventListeners() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navigation for section cards
    document.querySelectorAll('.section-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const href = card.getAttribute('data-href');
            if (href) {
                console.log('Navigating to:', href);
                window.location.href = href;
            }
        });
    });

    // Section card hover effects
    document.querySelectorAll('.section-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroBackground = document.querySelector('.hero-background');
        if (heroBackground) {
            heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// Navigation functions
function navigateToSection(section) {
    console.log('Navigating to section:', section);
    switch(section) {
        case 'questing':
            console.log('Redirecting to /chiffly/questing.html');
            window.location.href = '/chiffly/questing.html';
            break;
        case 'pub':
            console.log('Redirecting to /chiffly/pub.html');
            window.location.href = '/chiffly/pub.html';
            break;
        default:
            console.log('Unknown section:', section);
    }
}

// Stats management
function requestPlatformStats() {
    socket.emit('get-platform-stats');
}

function updatePlatformStats(stats) {
    platformStats = { ...platformStats, ...stats };
    
    // Update main stats with animation
    animateCounter(totalUsersSpan, platformStats.totalUsers);
    animateCounter(activeRoomsSpan, platformStats.activeRooms);
    animateCounter(liveStreamsSpan, platformStats.liveStreams);
    
    // Update section-specific stats
    animateCounter(questingUsersSpan, platformStats.questingUsers);
    animateCounter(questingRoomsSpan, platformStats.questingRooms);
    animateCounter(pubUsersSpan, platformStats.pubUsers);
    animateCounter(pubRoomsSpan, platformStats.pubRooms);
}

function animateCounter(element, targetValue) {
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    const duration = 1000; // 1 second
    const steps = Math.abs(targetValue - currentValue);
    const stepDuration = steps > 0 ? duration / steps : 0;
    
    if (steps === 0) return;
    
    let current = currentValue;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        if (current === targetValue) {
            clearInterval(timer);
        }
    }, stepDuration);
}

// Auto-refresh stats
function startStatsUpdater() {
    // Update stats every 30 seconds
    setInterval(() => {
        if (socket.connected) {
            requestPlatformStats();
        }
    }, 30000);
    
    // Update stats when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && socket.connected) {
            requestPlatformStats();
        }
    });
}

// Intersection Observer for animations
function setupScrollAnimations() {
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
    
    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Initialize scroll animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupScrollAnimations();
});

// Particle effect for hero section
function createParticleEffect() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            animation: float ${Math.random() * 3 + 2}s ease-in-out infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 2}s;
        `;
        hero.appendChild(particle);
    }
}

// Add particle effect
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(createParticleEffect, 1000);
});

// Global navigation function for onclick handlers
window.navigateToSection = navigateToSection;
console.log('Navigation function set globally:', typeof window.navigateToSection);

// Smooth scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top functionality to logo
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', scrollToTop);
        logo.style.cursor = 'pointer';
    }
});

// Loading animation
function showLoadingAnimation() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
    `;
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="font-family: 'Cinzel', serif; font-size: 1.2rem;">Loading Social Hub...</p>
        </div>
    `;
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(loadingOverlay);
    
    // Remove loading overlay after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }, 1000);
    });
}

// Show loading animation
document.addEventListener('DOMContentLoaded', showLoadingAnimation); 