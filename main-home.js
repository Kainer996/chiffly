// Socket.IO connection
console.log('Town Square script loading...');
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
    setupScrollAnimations();
    createParticleEffect();
});

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to Chiffy Town Square');
    requestPlatformStats();
});

socket.on('disconnect', () => {
    console.log('Disconnected from Chiffy Town Square');
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

    // Navigation for building cards
    document.querySelectorAll('.building').forEach(building => {
        building.addEventListener('click', (e) => {
            const href = building.getAttribute('data-href');
            if (href) {
                console.log('Navigating to:', href);
                // Add a nice transition effect
                building.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    window.location.href = href;
                }, 150);
            }
        });
    });

    // Building hover effects with enhanced animations
    document.querySelectorAll('.building').forEach(building => {
        building.addEventListener('mouseenter', () => {
            building.style.transform = 'translateY(-10px) scale(1.02)';
            // Add glow effect
            const glow = building.querySelector('.building-glow');
            if (glow) {
                glow.style.opacity = '1';
            }
        });
        
        building.addEventListener('mouseleave', () => {
            building.style.transform = 'translateY(0) scale(1)';
            // Remove glow effect
            const glow = building.querySelector('.building-glow');
            if (glow) {
                glow.style.opacity = '0';
            }
        });
    });

    // Parallax effect for town square background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const townBackground = document.querySelector('.town-square-background');
        if (townBackground) {
            townBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        // Animate fountain based on scroll
        const fountain = document.querySelector('.fountain');
        if (fountain) {
            const rotation = scrolled * 0.1;
            fountain.style.transform = `rotate(${rotation}deg)`;
        }
    });

    // Add click effect to fountain
    const fountain = document.querySelector('.fountain');
    if (fountain) {
        fountain.addEventListener('click', () => {
            fountain.style.animation = 'none';
            fountain.offsetHeight; // Trigger reflow
            fountain.style.animation = 'fountainGlow 1s ease-in-out';
        });
    }
}

// Navigation functions
function navigateToSection(section) {
    console.log('Navigating to section:', section);
    switch(section) {
        case 'questing':
        case 'adventure':
            console.log('Redirecting to questing.html');
            window.location.href = 'questing.html';
            break;
        case 'pub':
        case 'tavern':
            console.log('Redirecting to pub.html');
            window.location.href = 'pub.html';
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
    
    // Update building-specific stats
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

    // Observe buildings
    document.querySelectorAll('.building').forEach(building => {
        building.style.opacity = '0';
        building.style.transform = 'translateY(50px)';
        building.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(building);
    });
}

// Enhanced particle effect for town atmosphere
function createParticleEffect() {
    const particleContainer = document.createElement('div');
    particleContainer.style.position = 'fixed';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.zIndex = '1';
    document.body.appendChild(particleContainer);

    function createParticle() {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(255, 215, 0, ${Math.random() * 0.3 + 0.1})`;
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '100%';
        particle.style.animation = `floatUp ${Math.random() * 10 + 15}s linear infinite`;
        
        particleContainer.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 25000);
    }

    // Create particles periodically
    setInterval(createParticle, 3000);
    
    // Add CSS animation for particles
    if (!document.getElementById('particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add some town square specific interactions
function addTownSquareInteractions() {
    // Make lamp posts glow on hover
    document.querySelectorAll('.lamp-post').forEach(lamp => {
        lamp.addEventListener('mouseenter', () => {
            lamp.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
        });
        
        lamp.addEventListener('mouseleave', () => {
            lamp.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
        });
    });

    // Add bench sitting animation
    document.querySelectorAll('.bench').forEach(bench => {
        bench.addEventListener('click', () => {
            bench.style.transform = 'scale(0.9)';
            setTimeout(() => {
                bench.style.transform = 'scale(1)';
            }, 200);
        });
    });
}

// Initialize town square interactions when DOM is loaded
document.addEventListener('DOMContentLoaded', addTownSquareInteractions);

function showLoadingAnimation() {
    // Create a simple loading overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(139, 69, 19, 0.9)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.color = '#FFD700';
    overlay.style.fontSize = '1.5rem';
    overlay.style.fontFamily = 'Cinzel, serif';
    overlay.innerHTML = '<div><i class="fas fa-castle fa-spin"></i><br>Loading Town Square...</div>';
    
    document.body.appendChild(overlay);
    
    // Remove after 2 seconds or when page loads
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                overlay.parentNode.removeChild(overlay);
            }, 500);
        }
    }, 2000);
} 