/* weather-system.js — Dynamic Day/Night & Weather Engine */

class WeatherSystem {
    constructor() {
        this.currentTime = 'day'; // dawn, day, dusk, night
        this.currentWeather = 'clear'; // clear, rain, snow, fog
        this.autoCycle = false;
        this.cycleInterval = null;
        this.particleCount = {
            rain: 100,
            snow: 50,
            stars: 100
        };
        
        this.init();
    }

    init() {
        // Add atmospheric layers to map container
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;

        // Create overlay structure
        const atmosphericHTML = `
            <div class="atmospheric-overlay"></div>
            <div class="stars-container"></div>
            <div class="fog-container">
                <div class="fog-layer"></div>
                <div class="fog-layer"></div>
            </div>
            <div class="rain-container"></div>
            <div class="snow-container"></div>
        `;
        
        // Insert at the beginning of map container
        mapContainer.insertAdjacentHTML('afterbegin', atmosphericHTML);

        // Create weather controls
        this.createControls();

        // Generate initial particles
        this.generateStars();
        this.generateRain();
        this.generateSnow();

        // Set initial time based on real-world time
        this.setTimeFromRealWorld();

        console.log('🌤️ Weather System initialized');
    }

    createControls() {
        const mapContainer = document.getElementById('mapContainer');
        
        const controlsHTML = `
            <div class="weather-controls" id="weatherControls">
                <div class="weather-control-title">
                    <i class="fas fa-cloud-sun"></i>
                    Atmosphere
                </div>
                
                <div class="weather-option-group">
                    <div class="weather-option-label">Time of Day</div>
                    <div class="weather-btn-group">
                        <button class="weather-btn time-btn" data-time="dawn">
                            🌅 Dawn
                        </button>
                        <button class="weather-btn time-btn active" data-time="day">
                            ☀️ Day
                        </button>
                        <button class="weather-btn time-btn" data-time="dusk">
                            🌇 Dusk
                        </button>
                        <button class="weather-btn time-btn" data-time="night">
                            🌙 Night
                        </button>
                    </div>
                </div>

                <div class="weather-option-group">
                    <div class="weather-option-label">Weather</div>
                    <div class="weather-btn-group">
                        <button class="weather-btn weather-type-btn active" data-weather="clear">
                            ☀️ Clear
                        </button>
                        <button class="weather-btn weather-type-btn" data-weather="rain">
                            🌧️ Rain
                        </button>
                        <button class="weather-btn weather-type-btn" data-weather="snow">
                            ❄️ Snow
                        </button>
                        <button class="weather-btn weather-type-btn" data-weather="fog">
                            🌫️ Fog
                        </button>
                    </div>
                </div>

                <div class="auto-cycle-toggle" id="autoCycleToggle">
                    <span style="font-size: 0.75rem; color: rgba(255,255,255,0.7);">Auto Cycle</span>
                    <div class="toggle-switch" id="toggleSwitch">
                        <div class="toggle-slider"></div>
                    </div>
                </div>
            </div>

            <div class="ambient-status" id="ambientStatus">
                <span class="ambient-icon">🎵</span>
                <span id="ambientText">Ambient sounds active</span>
            </div>
        `;
        
        mapContainer.insertAdjacentHTML('beforeend', controlsHTML);

        // Bind events
        this.bindControlEvents();
    }

    bindControlEvents() {
        // Time buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const time = btn.dataset.time;
                this.setTime(time);
                this.updateActiveButton('.time-btn', btn);
            });
        });

        // Weather buttons
        document.querySelectorAll('.weather-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const weather = btn.dataset.weather;
                this.setWeather(weather);
                this.updateActiveButton('.weather-type-btn', btn);
            });
        });

        // Auto-cycle toggle
        const autoCycleToggle = document.getElementById('autoCycleToggle');
        const toggleSwitch = document.getElementById('toggleSwitch');
        
        autoCycleToggle.addEventListener('click', () => {
            this.autoCycle = !this.autoCycle;
            toggleSwitch.classList.toggle('active', this.autoCycle);
            
            if (this.autoCycle) {
                this.startAutoCycle();
            } else {
                this.stopAutoCycle();
            }
        });
    }

    updateActiveButton(selector, activeBtn) {
        document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    setTime(time) {
        const mapContainer = document.getElementById('mapContainer');
        
        // Remove all time classes
        mapContainer.classList.remove('time-dawn', 'time-day', 'time-dusk', 'time-night');
        
        // Add new time class
        mapContainer.classList.add(`time-${time}`);
        this.currentTime = time;
        
        console.log(`⏰ Time set to: ${time}`);
        this.updateAmbientStatus();
    }

    setWeather(weather) {
        const mapContainer = document.getElementById('mapContainer');
        
        // Remove all weather classes
        mapContainer.classList.remove('weather-clear', 'weather-rain', 'weather-snow', 'weather-fog');
        
        // Add new weather class
        if (weather !== 'clear') {
            mapContainer.classList.add(`weather-${weather}`);
        }
        this.currentWeather = weather;
        
        console.log(`🌤️ Weather set to: ${weather}`);
        this.updateAmbientStatus();
    }

    setTimeFromRealWorld() {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 8) {
            this.setTime('dawn');
        } else if (hour >= 8 && hour < 17) {
            this.setTime('day');
        } else if (hour >= 17 && hour < 20) {
            this.setTime('dusk');
        } else {
            this.setTime('night');
        }
        
        // Update button state
        const activeBtn = document.querySelector(`.time-btn[data-time="${this.currentTime}"]`);
        if (activeBtn) {
            this.updateActiveButton('.time-btn', activeBtn);
        }
    }

    startAutoCycle() {
        const times = ['dawn', 'day', 'dusk', 'night'];
        let currentIndex = times.indexOf(this.currentTime);
        
        this.cycleInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % times.length;
            this.setTime(times[currentIndex]);
            
            // Update button state
            const activeBtn = document.querySelector(`.time-btn[data-time="${times[currentIndex]}"]`);
            if (activeBtn) {
                this.updateActiveButton('.time-btn', activeBtn);
            }
            
            // Randomly change weather occasionally
            if (Math.random() < 0.3) {
                const weathers = ['clear', 'rain', 'snow', 'fog'];
                const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
                this.setWeather(randomWeather);
                
                const weatherBtn = document.querySelector(`.weather-type-btn[data-weather="${randomWeather}"]`);
                if (weatherBtn) {
                    this.updateActiveButton('.weather-type-btn', weatherBtn);
                }
            }
        }, 30000); // Change every 30 seconds
        
        console.log('🔄 Auto-cycle started');
    }

    stopAutoCycle() {
        if (this.cycleInterval) {
            clearInterval(this.cycleInterval);
            this.cycleInterval = null;
        }
        console.log('⏸️ Auto-cycle stopped');
    }

    generateStars() {
        const container = document.querySelector('.stars-container');
        if (!container) return;
        
        const starTypes = ['', 'bright', 'blue', 'gold'];
        
        for (let i = 0; i < this.particleCount.stars; i++) {
            const star = document.createElement('div');
            
            // Random star type (mostly normal, some special)
            const typeChance = Math.random();
            let starType = '';
            if (typeChance > 0.9) starType = 'bright';
            else if (typeChance > 0.8) starType = 'blue';
            else if (typeChance > 0.7) starType = 'gold';
            
            star.className = `star ${starType}`.trim();
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 55}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            star.style.animationDuration = `${2 + Math.random() * 3}s`;
            container.appendChild(star);
        }
    }

    generateRain() {
        const container = document.querySelector('.rain-container');
        if (!container) return;
        
        for (let i = 0; i < this.particleCount.rain; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(drop);
        }
    }

    generateSnow() {
        const container = document.querySelector('.snow-container');
        if (!container) return;
        
        for (let i = 0; i < this.particleCount.snow; i++) {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.width = `${4 + Math.random() * 6}px`;
            flake.style.height = flake.style.width;
            flake.style.animationDuration = `${3 + Math.random() * 4}s`;
            flake.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(flake);
        }
    }

    updateAmbientStatus() {
        const statusText = document.getElementById('ambientText');
        if (!statusText) return;
        
        const timeEmoji = {
            dawn: '🌅',
            day: '☀️',
            dusk: '🌇',
            night: '🌙'
        };
        
        const weatherEmoji = {
            clear: '☀️',
            rain: '🌧️',
            snow: '❄️',
            fog: '🌫️'
        };
        
        statusText.textContent = `${timeEmoji[this.currentTime]} ${this.currentTime.charAt(0).toUpperCase() + this.currentTime.slice(1)} · ${weatherEmoji[this.currentWeather]} ${this.currentWeather.charAt(0).toUpperCase() + this.currentWeather.slice(1)}`;
    }
}

// Initialize when DOM is ready
let weatherSystem;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        weatherSystem = new WeatherSystem();
    });
} else {
    weatherSystem = new WeatherSystem();
}
