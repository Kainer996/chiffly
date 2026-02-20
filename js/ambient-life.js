/**
 * ambient-life.js
 * Adds living atmosphere to the Chifftown map: fireflies, birds, clouds, dust motes
 */

(function() {
    console.log('🌿 Ambient Life System loading...');

    const AmbientLife = {
        container: null,
        currentTime: 'day',
        animationFrameId: null,
        entities: [],
        
        config: {
            fireflies: {
                count: 25,
                activeAt: ['night', 'dusk']
            },
            birds: {
                count: 5,
                activeAt: ['day', 'dawn']
            },
            clouds: {
                count: 4,
                activeAt: ['day', 'dawn', 'dusk']
            },
            dustMotes: {
                count: 30,
                activeAt: ['day', 'dawn', 'dusk']
            },
            butterflies: {
                count: 6,
                activeAt: ['day']
            }
        },

        init() {
            const mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) {
                console.log('⏳ Waiting for mapContainer...');
                setTimeout(() => this.init(), 1000);
                return;
            }

            // Create ambient container
            this.container = document.createElement('div');
            this.container.id = 'ambientLifeContainer';
            this.container.className = 'ambient-life-container';
            mapContainer.appendChild(this.container);

            // Detect current time from weather system
            this.detectCurrentTime();

            // Start spawning
            this.spawnAll();

            // Watch for time changes
            this.observeTimeChanges();

            // Inject styles
            this.injectStyles();

            console.log('✅ Ambient Life System ready!');
        },

        injectStyles() {
            if (document.getElementById('ambient-life-css')) return;

            const style = document.createElement('style');
            style.id = 'ambient-life-css';
            style.textContent = `
                .ambient-life-container {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 7;
                    overflow: hidden;
                }

                /* Fireflies */
                .firefly {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: #ffffaa;
                    box-shadow: 0 0 8px 4px rgba(255, 255, 170, 0.6),
                                0 0 20px 8px rgba(255, 255, 170, 0.3);
                    opacity: 0;
                    animation: fireflyGlow 3s ease-in-out infinite;
                }

                @keyframes fireflyGlow {
                    0%, 100% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1); }
                }

                /* Birds */
                .bird {
                    position: absolute;
                    font-size: 14px;
                    opacity: 0.7;
                    filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
                }

                .bird.small { font-size: 10px; }
                .bird.large { font-size: 18px; }

                /* Cloud shadows */
                .cloud-shadow {
                    position: absolute;
                    background: radial-gradient(ellipse at center,
                        rgba(0, 0, 20, 0.08) 0%,
                        rgba(0, 0, 20, 0.03) 40%,
                        transparent 70%
                    );
                    border-radius: 50%;
                    opacity: 0.5;
                }

                /* Dust motes */
                .dust-mote {
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 50%;
                    opacity: 0;
                }

                /* Butterflies */
                .butterfly {
                    position: absolute;
                    font-size: 12px;
                    opacity: 0.8;
                    animation: butterflyFloat 4s ease-in-out infinite;
                }

                @keyframes butterflyFloat {
                    0%, 100% { transform: translateY(0) rotate(-5deg); }
                    25% { transform: translateY(-8px) rotate(5deg); }
                    50% { transform: translateY(-4px) rotate(-3deg); }
                    75% { transform: translateY(-10px) rotate(3deg); }
                }

                /* Shooting star (rare night event) */
                .shooting-star {
                    position: absolute;
                    width: 100px;
                    height: 2px;
                    background: linear-gradient(to right, white, transparent);
                    opacity: 0;
                    transform: rotate(-45deg);
                }

                @keyframes shootingStar {
                    0% { opacity: 0; transform: translateX(0) rotate(-45deg); }
                    10% { opacity: 1; }
                    100% { opacity: 0; transform: translateX(300px) rotate(-45deg); }
                }

                /* Leaf particles */
                .falling-leaf {
                    position: absolute;
                    font-size: 14px;
                    opacity: 0.7;
                }

                /* Time-based visibility */
                .ambient-life-container[data-time="day"] .night-only,
                .ambient-life-container[data-time="dawn"] .night-only,
                .ambient-life-container[data-time="dusk"] .night-only:not(.dusk-visible) {
                    display: none !important;
                }

                .ambient-life-container[data-time="night"] .day-only {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        },

        detectCurrentTime() {
            const mapContainer = document.getElementById('mapContainer');
            if (mapContainer) {
                if (mapContainer.classList.contains('time-night')) this.currentTime = 'night';
                else if (mapContainer.classList.contains('time-dawn')) this.currentTime = 'dawn';
                else if (mapContainer.classList.contains('time-dusk')) this.currentTime = 'dusk';
                else this.currentTime = 'day';
            }
            
            if (this.container) {
                this.container.dataset.time = this.currentTime;
            }
        },

        observeTimeChanges() {
            const mapContainer = document.getElementById('mapContainer');
            if (!mapContainer) return;

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const oldTime = this.currentTime;
                        this.detectCurrentTime();
                        if (oldTime !== this.currentTime) {
                            console.log(`🌅 Time changed: ${oldTime} → ${this.currentTime}`);
                            this.updateEntitiesForTime();
                        }
                    }
                });
            });

            observer.observe(mapContainer, { attributes: true });
        },

        spawnAll() {
            this.spawnFireflies();
            this.spawnBirds();
            this.spawnCloudShadows();
            this.spawnDustMotes();
            this.spawnButterflies();
            
            // Occasional shooting stars at night
            this.scheduleShootingStar();
        },

        spawnFireflies() {
            const { count } = this.config.fireflies;
            
            for (let i = 0; i < count; i++) {
                const firefly = document.createElement('div');
                firefly.className = 'firefly night-only dusk-visible';
                
                // Random position
                firefly.style.left = `${Math.random() * 100}%`;
                firefly.style.top = `${30 + Math.random() * 60}%`;
                
                // Random animation timing
                firefly.style.animationDelay = `${Math.random() * 3}s`;
                firefly.style.animationDuration = `${2 + Math.random() * 2}s`;
                
                this.container.appendChild(firefly);
                
                // Animate movement
                this.animateFirefly(firefly);
            }
        },

        animateFirefly(firefly) {
            const animate = () => {
                if (!firefly.isConnected) return;
                
                const currentLeft = parseFloat(firefly.style.left);
                const currentTop = parseFloat(firefly.style.top);
                
                // Gentle random movement
                const newLeft = Math.max(5, Math.min(95, currentLeft + (Math.random() - 0.5) * 3));
                const newTop = Math.max(30, Math.min(90, currentTop + (Math.random() - 0.5) * 3));
                
                firefly.style.transition = 'left 2s ease, top 2s ease';
                firefly.style.left = `${newLeft}%`;
                firefly.style.top = `${newTop}%`;
                
                setTimeout(animate, 2000 + Math.random() * 1000);
            };
            
            setTimeout(animate, Math.random() * 2000);
        },

        spawnBirds() {
            const { count } = this.config.birds;
            const birdEmojis = ['🐦', '🕊️', '🦅'];
            const sizes = ['small', '', 'large'];
            
            for (let i = 0; i < count; i++) {
                const bird = document.createElement('div');
                bird.className = `bird day-only ${sizes[Math.floor(Math.random() * sizes.length)]}`;
                bird.textContent = birdEmojis[Math.floor(Math.random() * birdEmojis.length)];
                
                // Start off-screen
                bird.style.left = '-50px';
                bird.style.top = `${5 + Math.random() * 30}%`;
                
                this.container.appendChild(bird);
                
                // Animate flight
                this.animateBird(bird);
            }
        },

        animateBird(bird) {
            const flyAcross = () => {
                if (!bird.isConnected) return;
                
                const startY = 5 + Math.random() * 30;
                const endY = startY + (Math.random() - 0.5) * 15;
                const duration = 15000 + Math.random() * 10000;
                const direction = Math.random() > 0.5 ? 1 : -1;
                
                bird.style.transition = 'none';
                bird.style.left = direction > 0 ? '-50px' : '110%';
                bird.style.top = `${startY}%`;
                bird.style.transform = direction > 0 ? 'scaleX(1)' : 'scaleX(-1)';
                
                // Force reflow
                void bird.offsetWidth;
                
                bird.style.transition = `left ${duration}ms linear, top ${duration}ms ease-in-out`;
                bird.style.left = direction > 0 ? '110%' : '-50px';
                bird.style.top = `${endY}%`;
                
                // Queue next flight
                setTimeout(flyAcross, duration + Math.random() * 5000);
            };
            
            // Start with delay
            setTimeout(flyAcross, Math.random() * 10000);
        },

        spawnCloudShadows() {
            const { count } = this.config.clouds;
            
            for (let i = 0; i < count; i++) {
                const cloud = document.createElement('div');
                cloud.className = 'cloud-shadow day-only';
                
                // Large elliptical shadows
                const width = 150 + Math.random() * 200;
                const height = width * 0.6;
                
                cloud.style.width = `${width}px`;
                cloud.style.height = `${height}px`;
                cloud.style.left = '-200px';
                cloud.style.top = `${Math.random() * 100}%`;
                
                this.container.appendChild(cloud);
                
                this.animateCloud(cloud);
            }
        },

        animateCloud(cloud) {
            const drift = () => {
                if (!cloud.isConnected) return;
                
                const startY = Math.random() * 80;
                const duration = 60000 + Math.random() * 40000;
                
                cloud.style.transition = 'none';
                cloud.style.left = '-250px';
                cloud.style.top = `${startY}%`;
                
                void cloud.offsetWidth;
                
                cloud.style.transition = `left ${duration}ms linear`;
                cloud.style.left = '110%';
                
                setTimeout(drift, duration);
            };
            
            setTimeout(drift, Math.random() * 30000);
        },

        spawnDustMotes() {
            const { count } = this.config.dustMotes;
            
            for (let i = 0; i < count; i++) {
                const mote = document.createElement('div');
                mote.className = 'dust-mote day-only';
                
                mote.style.left = `${Math.random() * 100}%`;
                mote.style.top = `${Math.random() * 100}%`;
                
                this.container.appendChild(mote);
                this.animateDustMote(mote);
            }
        },

        animateDustMote(mote) {
            const float = () => {
                if (!mote.isConnected) return;
                
                const duration = 5000 + Math.random() * 5000;
                const startOpacity = 0.2 + Math.random() * 0.4;
                
                mote.style.transition = `all ${duration}ms ease-in-out`;
                mote.style.opacity = startOpacity;
                mote.style.transform = `translateY(${(Math.random() - 0.5) * 30}px) translateX(${(Math.random() - 0.5) * 20}px)`;
                
                setTimeout(() => {
                    if (!mote.isConnected) return;
                    mote.style.opacity = 0;
                    
                    setTimeout(() => {
                        if (!mote.isConnected) return;
                        // Reposition
                        mote.style.transition = 'none';
                        mote.style.left = `${Math.random() * 100}%`;
                        mote.style.top = `${Math.random() * 100}%`;
                        mote.style.transform = 'none';
                        
                        setTimeout(float, 100);
                    }, 500);
                }, duration);
            };
            
            setTimeout(float, Math.random() * 3000);
        },

        spawnButterflies() {
            const { count } = this.config.butterflies;
            const butterflyEmojis = ['🦋', '🦋', '🦋'];
            
            for (let i = 0; i < count; i++) {
                const butterfly = document.createElement('div');
                butterfly.className = 'butterfly day-only';
                butterfly.textContent = butterflyEmojis[Math.floor(Math.random() * butterflyEmojis.length)];
                
                butterfly.style.left = `${10 + Math.random() * 80}%`;
                butterfly.style.top = `${40 + Math.random() * 40}%`;
                butterfly.style.animationDelay = `${Math.random() * 4}s`;
                
                this.container.appendChild(butterfly);
                this.animateButterfly(butterfly);
            }
        },

        animateButterfly(butterfly) {
            const flutter = () => {
                if (!butterfly.isConnected) return;
                
                const duration = 8000 + Math.random() * 7000;
                const newLeft = 10 + Math.random() * 80;
                const newTop = 40 + Math.random() * 40;
                
                butterfly.style.transition = `left ${duration}ms ease-in-out, top ${duration}ms ease-in-out`;
                butterfly.style.left = `${newLeft}%`;
                butterfly.style.top = `${newTop}%`;
                
                setTimeout(flutter, duration);
            };
            
            setTimeout(flutter, Math.random() * 5000);
        },

        scheduleShootingStar() {
            const scheduleNext = () => {
                // Only at night, random timing (30s - 2min)
                const delay = 30000 + Math.random() * 90000;
                
                setTimeout(() => {
                    if (this.currentTime === 'night') {
                        this.createShootingStar();
                    }
                    scheduleNext();
                }, delay);
            };
            
            scheduleNext();
        },

        createShootingStar() {
            const star = document.createElement('div');
            star.className = 'shooting-star';
            star.style.left = `${Math.random() * 60}%`;
            star.style.top = `${5 + Math.random() * 20}%`;
            star.style.animation = 'shootingStar 1s linear forwards';
            
            this.container.appendChild(star);
            
            setTimeout(() => star.remove(), 1500);
        },

        updateEntitiesForTime() {
            // The CSS handles visibility via data-time attribute
            // Just update the container attribute
            if (this.container) {
                this.container.dataset.time = this.currentTime;
            }
        }
    };

    // Expose globally
    window.AmbientLife = AmbientLife;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AmbientLife.init());
    } else {
        AmbientLife.init();
    }

})();
