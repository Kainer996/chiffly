// Socket.IO connection
console.log('Town Square script loading...');
const socket = io();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupScrollAnimations();
    createParticleEffect();
    addTownSquareInteractions();
});

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to Chiffy Town Square');
});

socket.on('disconnect', () => {
    console.log('Disconnected from Chiffy Town Square');
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

    // Navigation for destination cards
    document.querySelectorAll('.destination').forEach(destination => {
        destination.addEventListener('click', (e) => {
            const href = destination.getAttribute('data-href');
            if (href) {
                console.log('Navigating to:', href);
                // Add a nice transition effect
                destination.style.transform = destination.style.transform.includes('scale') 
                    ? destination.style.transform.replace(/scale\([^)]*\)/, 'scale(0.9)')
                    : 'scale(0.9)';
                setTimeout(() => {
                    window.location.href = href;
                }, 150);
            }
        });
    });

    // Destination hover effects with enhanced animations
    document.querySelectorAll('.destination').forEach(destination => {
        destination.addEventListener('mouseenter', () => {
            destination.style.transform = 'scale(1.1)';
            destination.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)';
        });
        
        destination.addEventListener('mouseleave', () => {
            // Reset based on position class
            if (destination.classList.contains('north-dest') || destination.classList.contains('south-dest')) {
                destination.style.transform = destination.classList.contains('north-dest') 
                    ? 'translateX(-50%) scale(1)' 
                    : 'translateX(-50%) scale(1)';
            } else {
                destination.style.transform = 'translateY(-50%) scale(1)';
            }
            destination.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        });
    });

    // Parallax effect for town square background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const townBackground = document.querySelector('.town-square-background');
        if (townBackground) {
            townBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        // Animate compass based on scroll
        const compass = document.querySelector('.compass-face');
        if (compass) {
            const rotation = scrolled * 0.2;
            compass.style.transform = `rotate(${rotation}deg)`;
        }
    });

    // Add click effect to compass
    const compass = document.querySelector('.compass');
    if (compass) {
        compass.addEventListener('click', () => {
            compass.style.animation = 'none';
            compass.offsetHeight; // Trigger reflow
            compass.style.animation = 'compassGlow 1s ease-in-out';
            
            // Spin the compass face faster temporarily
            const compassFace = compass.querySelector('.compass-face i');
            if (compassFace) {
                compassFace.style.animation = 'compassSpin 2s linear';
                setTimeout(() => {
                    compassFace.style.animation = 'compassSpin 20s linear infinite';
                }, 2000);
            }
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
        case 'nightclub':
        case 'club':
            console.log('Redirecting to nightclub.html');
            window.location.href = 'nightclub.html';
            break;
        case 'games':
        case 'gaming':
            console.log('Redirecting to games.html');
            window.location.href = 'games.html';
            break;
        default:
            console.log('Unknown section:', section);
    }
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

    // Observe destinations
    document.querySelectorAll('.destination').forEach(destination => {
        destination.style.opacity = '0';
        destination.style.transform = 'translateY(50px)';
        destination.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(destination);
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
    // Make compass directions glow on hover
    document.querySelectorAll('.direction').forEach(direction => {
        direction.addEventListener('mouseenter', () => {
            direction.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            direction.style.transform = direction.style.transform + ' scale(1.2)';
        });
        
        direction.addEventListener('mouseleave', () => {
            direction.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.3)';
            direction.style.transform = direction.style.transform.replace(' scale(1.2)', '');
        });
    });

    // Add compass needle interaction
    const needle = document.querySelector('.compass-needle');
    if (needle) {
        needle.addEventListener('click', () => {
            needle.style.animation = 'none';
            needle.offsetHeight; // Trigger reflow
            needle.style.animation = 'needlePoint 1s ease-in-out';
            setTimeout(() => {
                needle.style.animation = 'needlePoint 4s ease-in-out infinite';
            }, 1000);
        });
    }

    // Add destination icon rotation on click
    document.querySelectorAll('.destination-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent destination click
            icon.style.transform = 'scale(1.2) rotate(360deg)';
            setTimeout(() => {
                icon.style.transform = 'scale(1.2) rotate(10deg)';
            }, 300);
        });
    });
}

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
    overlay.innerHTML = '<div><i class="fas fa-compass fa-spin"></i><br>Loading Town Square...</div>';
    
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