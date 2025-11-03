class CircusLetterZapper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.gamePaused = false;

        // Gamepad support
        this.gamepad = null;
        this.gamepadConnected = false;
        this.lastGamepadButtonState = {};
        this.analogDeadzone = 0.1; // Ignore small analog stick movements
    this.setupGamepadSupport();
    // Start lightweight polling so controller input (menu navigation
    // and analog aiming) works even before the main game loop starts.
    this.startInputPolling();

        // UI button navigation (controller focus)

        this.uiButtons = [
            document.getElementById('startButton'),
            document.getElementById('pauseButton'),
            document.getElementById('resetButton'),
            document.getElementById('optionsButton')
        ];

        this.currentButtonIndex = 0;
        // Call updateButtonFocus after DOM is ready
        setTimeout(() => this.updateButtonFocus(), 0);
    // END OF CONSTRUCTOR
    


        // Language settings
        this.currentLanguage = 'en';
        this.translations = translations;
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Enhanced scoring system
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsCompleted = 0;
    this.wordsCompletedThisLevel = 0;
    // Track words completed within the current level so we only level-up
    // after completing a few words (configurable via wordsPerLevel)
    this.wordsCompletedThisLevel = 0;
    this.wordsPerLevel = 3; // number of words required to advance a level
        this.totalLettersHit = 0;
        this.accuracy = 100;
        this.totalShots = 0;
        this.successfulShots = 0;
        this.scoreMultiplier = 1;
        this.timeBonus = 0;
        this.wordStartTime = Date.now();
        
        // Audio system initialization
        this.audioContext = null;
        this.sounds = {};
        this.masterVolume = 0.3; // Default volume
        this.musicVolume = 0.15; // Separate volume for background music
        this.speechVolume = 0.8; // Volume for text-to-speech
        this.backgroundMusic = null;
        this.musicPlaying = false;
        this.speechEnabled = true; // Enable/disable word pronunciation
        this.initAudio();
        this.initSpeech();
        
        // Word lists for different levels and languages
        this.wordLists = wordLists;
        
        this.currentWordIndex = 0;
        this.currentTargetWord = '';
        this.spelledWord = '';
        this.nextLetterIndex = 0;
        
        // Create copies of word lists to track used words for the current language
        this.availableWordLists = this.wordLists[this.currentLanguage].map(wordList => [...wordList]);
        
        // Game objects
        this.clown = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 120,
            radius: 30,
            angle: -Math.PI / 2
        };
        
        this.letters = [];
        this.balls = [];
        this.particles = [];
        this.floatingTexts = []; // For score popups
        
        // Game settings
        this.letterSpeed = 1;
        this.ballSpeed = 8;
        this.letterSpawnRate = 0.02;
        
        // UI buttons for controller navigation
        this.uiButtons = [
            document.getElementById('startButton'),
            document.getElementById('pauseButton'),
            document.getElementById('resetButton'),
            document.getElementById('optionsButton')
        ];
        this.currentButtonIndex = 0; // Track focused button
        this.updateButtonFocus();
        
        this.setupEventListeners();
        this.initGame();
    
    
        
    }

    spawnLetter() {
        // Occasionally spawn a letter based on letterSpawnRate
        if (!this.canvas) return;
        if (Math.random() > (this.letterSpawnRate || 0)) return;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let char;
        if (this.currentTargetWord && this.currentTargetWord.length) {
            // Prefer letters from the current target word to keep gameplay focused
            char = this.currentTargetWord[Math.floor(Math.random() * this.currentTargetWord.length)];
        } else {
            char = chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const radius = 20;
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const y = -radius - Math.random() * 50;
        const speed = (this.letterSpeed || 1) + Math.random() * 1.5;
        const rotation = Math.random() * Math.PI * 2;
        const rotationSpeed = (Math.random() - 0.5) * 0.1;
        const color = '#e74c3c';

        this.letters.push({
            x,
            y,
            letter: char,
            radius,
            speed,
            rotation,
            rotationSpeed,
            color
        });
    }

    updateButtonFocus() {
        this.uiButtons.forEach((button, index) => {
            if (index === this.currentButtonIndex) {
                button.classList.add('focused');
            } else {
                button.classList.remove('focused');
            }
        });
    }

    handleGamepadNavigation() {
        if (!this.gamepadConnected || !this.gamepad) return;

        // Allow aiming with left analog stick (axes[0], axes[1]).
        // Axes: x -> axes[0], y -> axes[1] (y is typically -1 up, +1 down)
        const axes = this.gamepad.axes || [];
        const lx = typeof axes[0] === 'number' ? axes[0] : 0;
        const ly = typeof axes[1] === 'number' ? axes[1] : 0;
        if (Math.abs(lx) > this.analogDeadzone || Math.abs(ly) > this.analogDeadzone) {
            // Update clown aim based on stick direction
            this.clown.angle = Math.atan2(ly, lx);
        }

        const dpadUp = this.gamepad.buttons[12]?.pressed;
        const dpadDown = this.gamepad.buttons[13]?.pressed;
        const dpadLeft = this.gamepad.buttons[14]?.pressed;
        const dpadRight = this.gamepad.buttons[15]?.pressed;
        const select = this.gamepad.buttons[0]?.pressed; // A button
        const back = this.gamepad.buttons[1]?.pressed; // B button
        const start = this.gamepad.buttons[9]?.pressed; // Start button

        // Edge-detection for button presses
        const pressedA = select && !this.lastGamepadButtonState[0];
        const pressedB = back && !this.lastGamepadButtonState[1];
        const pressedStart = start && !this.lastGamepadButtonState[9];
        const pressedDpadUp = dpadUp && !this.lastGamepadButtonState[12];
        const pressedDpadDown = dpadDown && !this.lastGamepadButtonState[13];
        const pressedDpadLeft = dpadLeft && !this.lastGamepadButtonState[14];
        const pressedDpadRight = dpadRight && !this.lastGamepadButtonState[15];

        // Menu navigation with D-pad
        if (pressedDpadUp) {
            this.currentButtonIndex = (this.currentButtonIndex - 1 + this.uiButtons.length) % this.uiButtons.length;
            this.updateButtonFocus();
        }

        if (pressedDpadDown) {
            this.currentButtonIndex = (this.currentButtonIndex + 1) % this.uiButtons.length;
            this.updateButtonFocus();
        }

        if (pressedA) {
            // If a modal or menu is open, we'll handle it below; otherwise activate focused button
            const optionsModal = document.getElementById('optionsModal');
            if (!optionsModal || optionsModal.classList.contains('hidden')) {
                // Activate focused UI button
                const btn = this.uiButtons[this.currentButtonIndex];
                if (btn) btn.click();
            }
        }

        // Modal/dialog navigation
        const optionsModal = document.getElementById('optionsModal');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const continueDialog = document.getElementById('continueDialog');
        if (optionsModal && !optionsModal.classList.contains('hidden')) {
            // Build or refresh list of focusable controls inside the modal
            if (!this.modalFocusableElements || this._optionsModalOpen !== true) {
                const selector = 'button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
                const els = Array.from(optionsModal.querySelectorAll(selector)).filter(el => {
                    // Only include visible elements
                    return el.offsetParent !== null;
                });
                this.modalFocusableElements = els;
                this.modalFocusIndex = 0;
                this._optionsModalOpen = true;
                // Focus first element
                if (this.modalFocusableElements[0]) {
                    try { this.modalFocusableElements[0].focus(); } catch (e) {}
                }
            }

            // Navigate modal controls with d-pad
            if (pressedDpadUp) {
                this.modalFocusIndex = Math.max(0, (this.modalFocusIndex || 0) - 1);
                const el = this.modalFocusableElements[this.modalFocusIndex];
                if (el) try { el.focus(); } catch (e) {}
            }
            if (pressedDpadDown) {
                this.modalFocusIndex = Math.min(this.modalFocusableElements.length - 1, (this.modalFocusIndex || 0) + 1);
                const el = this.modalFocusableElements[this.modalFocusIndex];
                if (el) try { el.focus(); } catch (e) {}
            }

            // Interact with focused control using A, left/right
            const focused = this.modalFocusableElements && this.modalFocusableElements[this.modalFocusIndex];
            if (pressedA && focused) {
                if (focused.tagName === 'SELECT') {
                    // Toggle language select options (quick toggle between two languages)
                    if (focused.id === 'languageSelect') {
                        const newVal = focused.value === 'en' ? 'fr' : 'en';
                        focused.value = newVal;
                        focused.dispatchEvent(new Event('change'));
                        if (typeof this.setLanguage === 'function') this.setLanguage(newVal);
                    } else {
                        // For other selects just focus/click
                        try { focused.click(); } catch (e) {}
                    }
                } else if (focused.type === 'range') {
                    // Toggle a step increment
                    const step = Number(focused.step) || 1;
                    focused.value = Math.min(Number(focused.max || 100), Number(focused.value) + step);
                    focused.dispatchEvent(new Event('input'));
                } else {
                    try { focused.click(); } catch (e) {}
                }
            }

            if ((pressedDpadLeft || pressedDpadRight) && focused) {
                if (focused.type === 'range') {
                    const step = Number(focused.step) || 1;
                    const delta = pressedDpadLeft ? -step : step;
                    focused.value = Math.max(Number(focused.min || 0), Math.min(Number(focused.max || 100), Number(focused.value) + delta));
                    focused.dispatchEvent(new Event('input'));
                } else if (focused.tagName === 'SELECT') {
                    // Change select option with left/right
                    const options = Array.from(focused.options || []);
                    if (options.length > 1) {
                        let idx = options.findIndex(o => o.value === focused.value);
                        idx = pressedDpadLeft ? Math.max(0, idx - 1) : Math.min(options.length - 1, idx + 1);
                        focused.value = options[idx].value;
                        focused.dispatchEvent(new Event('change'));
                        if (focused.id === 'languageSelect' && typeof this.setLanguage === 'function') {
                            this.setLanguage(focused.value);
                        }
                    }
                }
            }

            // Close modal with B or Start
            if (pressedB || pressedStart) {
                optionsModal.classList.add('hidden');
                this._optionsModalOpen = false;
                this.modalFocusableElements = null;
                // If the game was paused when options opened, resume
                if (this.gameRunning && this.gamePaused && typeof this.pauseGame === 'function') {
                    this.pauseGame();
                }
            }

        } else if (continueDialog) {
            if (pressedA) this.handleContinueChoice(true);
            else if (pressedB) this.handleContinueChoice(false);
        } else if (gameOverScreen && !gameOverScreen.classList.contains('hidden')) {
            if (pressedA) {
                this.resetGame();
                this.startGame();
            }
        } else {
            // In-game controls
            if (this.gameRunning && !this.gamePaused) {
                // Digital D-pad aiming fallback (small increments)
                if (pressedDpadLeft) this.clown.angle -= 0.12;
                if (pressedDpadRight) this.clown.angle += 0.12;
                if (pressedDpadUp) this.clown.angle -= 0.06;
                if (pressedDpadDown) this.clown.angle += 0.06;

                // Shoot with A button or triggers (edge-detect triggers 6 & 7)
                const leftTriggerPressed = this.gamepad.buttons[6]?.pressed;
                const rightTriggerPressed = this.gamepad.buttons[7]?.pressed;
                const pressedLeftTrigger = leftTriggerPressed && !this.lastGamepadButtonState[6];
                const pressedRightTrigger = rightTriggerPressed && !this.lastGamepadButtonState[7];

                if (pressedA || pressedLeftTrigger || pressedRightTrigger) {
                    this.shootBall();
                }
            }

            // Handle Start/B buttons for gameplay and menus
            if (pressedStart) {
                if (!this.gameRunning) {
                    this.startGame();
                } else {
                    this.pauseGame();
                }
            } else if (pressedB && this.gameRunning) {
                this.resetGame();
            } else if (pressedDpadDown && !this.gameRunning) {
                // Open options when game is not running
                const optionsButton = document.getElementById('optionsButton');
                if (optionsButton) optionsButton.click();
            }
        }

        // Update last button states (include triggers and D-pad so we can detect presses next frame)
        this.lastGamepadButtonState[12] = !!dpadUp;
        this.lastGamepadButtonState[13] = !!dpadDown;
        this.lastGamepadButtonState[14] = !!dpadLeft;
        this.lastGamepadButtonState[15] = !!dpadRight;
        this.lastGamepadButtonState[0] = !!select;
        this.lastGamepadButtonState[1] = !!back;
        this.lastGamepadButtonState[9] = !!start;
        this.lastGamepadButtonState[6] = !!this.gamepad.buttons[6]?.pressed;
        this.lastGamepadButtonState[7] = !!this.gamepad.buttons[7]?.pressed;
    }

    startInputPolling() {
        // Poll at animation-frame rate to update gamepad state and allow
        // menu navigation / aiming even when the main game loop isn't running.
        const poll = () => {
            try {
                this.updateGamepadState();
                // Always allow menu navigation when not running or paused
                if (!this.gameRunning || this.gamePaused) {
                    this.handleGamepadNavigation();
                    // Keep button focus visuals in sync
                    this.updateButtonFocus && this.updateButtonFocus();
                } else {
                    // In-game: update navigation (for triggers/start) and keep
                    // analog aiming responsive.
                    this.handleGamepadNavigation();
                }
            } catch (err) {
                // Defensive: don't break polling if something unexpected occurs
                console.warn('Error during gamepad polling:', err);
            }
            requestAnimationFrame(poll);
        };
        // Start polling loop
        requestAnimationFrame(poll);
    }

    setupGamepadSupport() {
        // Listen for gamepad connection/disconnection
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
            this.gamepadConnected = true;
            console.log('Gamepad connected:', e.gamepad.id);
            // Initialize last button states
            this.lastGamepadButtonState = {};
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepad && e.gamepad.index === this.gamepad.index) {
                this.gamepad = null;
                this.gamepadConnected = false;
                this.lastGamepadButtonState = {};
                console.log('Gamepad disconnected:', e.gamepad.id);
            }
        });

        // If a gamepad is already connected before script runs, pick it up
        if (navigator.getGamepads) {
            const gps = navigator.getGamepads();
            for (let i = 0; i < gps.length; i++) {
                if (gps[i]) {
                    this.gamepad = gps[i];
                    this.gamepadConnected = true;
                    break;
                }
            }
        }
    }

    updateGamepadState() {
        if (!navigator.getGamepads) return;
        const gps = navigator.getGamepads();
        if (!gps) return;

        // Update the stored gamepad reference (by index if available)
        if (this.gamepad && typeof this.gamepad.index === 'number') {
            this.gamepad = gps[this.gamepad.index] || gps[0] || null;
        } else {
            this.gamepad = gps[0] || null;
        }

        this.gamepadConnected = !!this.gamepad;
    }

    setupEventListeners() {
        // Buttons
        const startBtn = document.getElementById('startButton');
        if (startBtn) startBtn.addEventListener('click', () => {
            if (typeof this.startGame === 'function') this.startGame();
            else console.warn('startGame not implemented');
        });

        const pauseBtn = document.getElementById('pauseButton');
        if (pauseBtn) pauseBtn.addEventListener('click', () => {
            if (typeof this.pauseGame === 'function') this.pauseGame();
            else {
                // Basic toggle if pauseGame isn't implemented yet
                this.gamePaused = !this.gamePaused;
                pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
            }
        });

        const resetBtn = document.getElementById('resetButton');
        if (resetBtn) resetBtn.addEventListener('click', () => {
            if (typeof this.resetGame === 'function') this.resetGame();
            else console.warn('resetGame not implemented');
        });

        const optionsBtn = document.getElementById('optionsButton');
        if (optionsBtn) optionsBtn.addEventListener('click', () => {
            const modal = document.getElementById('optionsModal');
            if (modal) modal.classList.toggle('hidden');
        });

        // Language selector
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) langSelect.addEventListener('change', (e) => {
            if (typeof this.setLanguage === 'function') this.setLanguage(e.target.value);
        });

        // Modal close (X) button inside options modal
        const optionsModal = document.getElementById('optionsModal');
        if (optionsModal) {
            const closeBtn = optionsModal.querySelector('.close-button');
            if (closeBtn) closeBtn.addEventListener('click', () => {
                optionsModal.classList.add('hidden');
                // If the game was paused while the options were open, resume it
                if (this.gameRunning && this.gamePaused && typeof this.pauseGame === 'function') {
                    this.pauseGame();
                }
            });
        }

        // Music toggle
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) musicToggle.addEventListener('click', () => {
            if (typeof this.toggleBackgroundMusic === 'function') this.toggleBackgroundMusic();
        });

        // Canvas pointer controls: aim and shoot
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.clown.angle = Math.atan2(y - this.clown.y, x - this.clown.x);
            });

            this.canvas.addEventListener('mousedown', (e) => {
                if (typeof this.shootBall === 'function') this.shootBall();
            });

            // Touch support: tap to shoot, move to aim
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (typeof this.shootBall === 'function') this.shootBall();
            }, {passive: false});
            this.canvas.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                if (!touch) return;
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.clown.angle = Math.atan2(y - this.clown.y, x - this.clown.x);
            }, {passive: true});
        }

        // Keyboard controls (defensive)
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            // Allow Escape to dismiss options modal
            if (key === 'escape') {
                const modal = document.getElementById('optionsModal');
                if (modal && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                    return;
                }
            }
            if (key === ' ' || key === 'spacebar') {
                // Space to shoot
                e.preventDefault();
                if (typeof this.shootBall === 'function') this.shootBall();
            } else if (key === 'p') {
                if (typeof this.pauseGame === 'function') this.pauseGame();
                else this.gamePaused = !this.gamePaused;
            } else if (key === 'r') {
                if (typeof this.resetGame === 'function') this.resetGame();
            } else if (key === 'm') {
                if (typeof this.toggleBackgroundMusic === 'function') this.toggleBackgroundMusic();
            } else if (key === 's') {
                // Toggle speech on/off
                this.speechEnabled = !this.speechEnabled;
            }
        });
    }

    initGame() {
        // Basic initialization: size canvas, pick a word, update UI
        if (this.canvas) {
            // Set a sensible default size if not already set via HTML/CSS
            if (!this.canvas.width) this.canvas.width = Math.max(800, window.innerWidth - 40);
            if (!this.canvas.height) this.canvas.height = Math.max(600, window.innerHeight - 120);
        }

        // Ensure some defaults
        this.score = this.score || 0;
        this.level = this.level || 1;
        this.lives = this.lives || 3;

        // Select initial word if function is available
        if (typeof this.selectNewWord === 'function') {
            this.selectNewWord();
        } else {
            this.currentTargetWord = this.currentTargetWord || '';
        }

        // Update UI elements
        if (typeof this.updateUI === 'function') this.updateUI();
    }

    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.wordStartTime = Date.now();

        // Enable/disable UI buttons if present
        const startBtn = document.getElementById('startButton');
        const pauseBtn = document.getElementById('pauseButton');
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;

        // Start the main loop only once
        if (!this._loopStarted) {
            this._loopStarted = true;
            this.gameLoop();
        }

        // Ensure background music is turned on when the game starts
        try {
            this.startBackgroundMusic();
            const musicToggle = document.getElementById('musicToggle');
            if (musicToggle) {
                musicToggle.textContent = '\u23f8\ufe0f'; // show pause/playing icon
                musicToggle.classList.add('playing');
            }
        } catch (err) {
            // Defensive: don't break the game if music setup fails
            console.warn('Could not enable background music on game start:', err);
        }
        // Lock language selection once the game starts
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) langSelect.disabled = true;
    }

    pauseGame() {
        // Toggle pause state
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseButton');
        if (pauseBtn) pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
    }

    resetGame() {
        // Reset game state to initial values
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsCompleted = 0;
        this.totalLettersHit = 0;
        this.totalShots = 0;
        this.successfulShots = 0;
        this.spelledWord = '';
        this.nextLetterIndex = 0;
        this.letters = [];
        this.balls = [];
        this.particles = [];
        this.floatingTexts = [];

        if (typeof this.selectNewWord === 'function') this.selectNewWord();
        if (typeof this.updateUI === 'function') this.updateUI();

        // Hide any end-of-game or dialog overlays so UI returns to main screen
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');

        const continueDialog = document.getElementById('continueDialog');
        if (continueDialog) continueDialog.remove();

        const optionsModal = document.getElementById('optionsModal');
        if (optionsModal) optionsModal.classList.add('hidden');

        // Reset buttons state
        const startBtn = document.getElementById('startButton');
        const pauseBtn = document.getElementById('pauseButton');
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.textContent = 'Pause';
        }
        // Re-enable language selection when resetting back to menu
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) langSelect.disabled = false;
    }

    shootBall() {
        if (!this.gameRunning || this.gamePaused) return;

        const angle = this.clown.angle || -Math.PI / 2;
        const speed = this.ballSpeed || 8;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const ball = {
            x: this.clown.x + Math.cos(angle) * (this.clown.radius + 20),
            y: this.clown.y + Math.sin(angle) * (this.clown.radius + 20),
            vx: vx,
            vy: vy,
            radius: 8,
            // Choose a random color for each shot for visual variety
            color: (['#ff6b6b', '#4ecdc4', '#f7b801', '#9b59b6', '#f39c12', '#2ecc71', '#e74c3c', '#3498db'])[Math.floor(Math.random() * 8)]
        };

        this.balls.push(ball);
        this.totalShots = (this.totalShots || 0) + 1;
        if (typeof this.playSound === 'function') this.playSound('shoot');
    }
    update() {
        if (!this.gameRunning || this.gamePaused) {
            // Allow UI navigation with controller when game is not running or paused
            this.handleGamepadNavigation();
            return;
        }

        // Update gamepad state
        this.updateGamepadState();
        this.handleGamepadNavigation();

        // Spawn letters
        this.spawnLetter();
        
        // Update letter colors based on current target letter
        this.updateLetterColors();
        
        // Update letters
        this.letters.forEach((letter, index) => {
            letter.y += letter.speed;
            letter.rotation += letter.rotationSpeed;
            
            // Remove letters that are off screen
            if (letter.y > this.canvas.height + 50) {
                this.letters.splice(index, 1);
            }
        });
        
        // Update balls
        this.balls.forEach((ball, ballIndex) => {
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Remove balls that are off screen
            if (ball.x < 0 || ball.x > this.canvas.width || 
                ball.y < 0 || ball.y > this.canvas.height) {
                this.balls.splice(ballIndex, 1);
                return;
            }
            
            // Check collision with letters
            this.letters.forEach((letter, letterIndex) => {
                const dx = ball.x - letter.x;
                const dy = ball.y - letter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball.radius + letter.radius) {
                    // Collision detected
                    this.handleLetterHit(letter, letterIndex);
                    this.balls.splice(ballIndex, 1);
                    this.createParticles(letter.x, letter.y, letter.color);
                }
            });
        });
        
        // Update particles
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        
        // Update floating score texts
        this.floatingTexts.forEach((text, index) => {
            text.y -= text.speed;
            text.life--;
            text.alpha = text.life / text.maxLife;
            
            if (text.life <= 0) {
                this.floatingTexts.splice(index, 1);
            }
        });
        
        // Update letter colors based on current game state
        this.updateLetterColors();
    }
    
    handleLetterHit(letter, letterIndex) {
        const correctLetter = this.currentTargetWord[this.nextLetterIndex];
        this.successfulShots++; // Track successful hits
        
        if (letter.letter === correctLetter) {
            // Correct letter hit - calculate enhanced scoring
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.totalLettersHit++;
            
            // Base score with level multiplier
            let letterPoints = 10 * this.level;
            
            // Combo bonus (increases with consecutive hits)
            if (this.combo > 1) {
                letterPoints += (this.combo - 1) * 5;
                this.createFloatingText(letter.x, letter.y - 25, `COMBO x${this.combo}!`, '#ffd700', 1);
                // Play combo sound for chains of 3 or more
                if (this.combo >= 3) {
                    this.playSound('combo', 440, 0.15, 0.2);
                }
            }
            
            // Speed bonus (faster completion = more points)
            const timeTaken = (Date.now() - this.wordStartTime) / 1000;
            const speedBonus = Math.max(0, Math.floor((10 - timeTaken) * 2));
            letterPoints += speedBonus;
            
            this.score += letterPoints;
            this.spelledWord += letter.letter;
            this.nextLetterIndex++;
            
            // Update remaining letter colors immediately
            this.updateLetterColors();
            
            // Show score popup with slight offset from combo message
            this.createFloatingText(letter.x + 15, letter.y + 10, `+${letterPoints}`, '#27ae60', 0);
            
            // Play correct letter sound
            this.playSound('correctLetter');
            
            // Check if word is complete
            if (this.spelledWord === this.currentTargetWord) {
                this.wordsCompleted++;
                
                // Word completion bonus
                let wordBonus = 50 * this.level;
                
                // Perfect word bonus (no mistakes)
                if (this.combo >= this.currentTargetWord.length) {
                    wordBonus += 25 * this.level;
                    this.createFloatingText(this.canvas.width / 2, 200, 'PERFECT WORD!', '#e74c3c', 2);
                }
                
                // Time bonus for quick completion
                const wordTime = (Date.now() - this.wordStartTime) / 1000;
                const timeBonus = Math.max(0, Math.floor((15 - wordTime) * 5));
                wordBonus += timeBonus;
                
                this.score += wordBonus;
                this.createFloatingText(this.canvas.width / 2, 150, `WORD COMPLETE! +${wordBonus}`, '#9b59b6', 2);
                
                // Play word complete sound
                this.playSound('wordComplete');
                
                // Speak the completed word
                this.speakWord(this.currentTargetWord);
                
                // Pick the next word immediately (keeps gameplay flow). We'll
                // only advance the player's difficulty after a few completed
                // words for the current level.
                this.selectNewWord();

                // Increment per-level completion counter and level up only when threshold reached
                this.wordsCompletedThisLevel = (this.wordsCompletedThisLevel || 0) + 1;
                if (this.wordsCompletedThisLevel >= (this.wordsPerLevel || 3)) {
                    // Reset the per-level counter and increase difficulty
                    this.wordsCompletedThisLevel = 0;
                    this.level = (this.level || 1) + 1;
                    this.letterSpeed += 0.5;
                    this.letterSpawnRate += 0.005;

                    // Check if we've exceeded available levels
                    if (this.level > this.wordLists[this.currentLanguage].length) {
                        // Victory: completed all defined levels
                        this.createFloatingText(this.canvas.width / 2, 100, 'CONGRATULATIONS!', '#ffd700', 2);
                        this.createFloatingText(this.canvas.width / 2, 140, 'ALL LEVELS COMPLETE!', '#e74c3c', 2);
                        this.showContinuePrompt();

                        // Clamp level to max defined
                        this.level = this.wordLists[this.currentLanguage].length;
                    } else {
                        // Normal level up
                        this.createFloatingText(this.canvas.width / 2, 100, `LEVEL UP! ${this.level}`, '#3498db', 2);
                    }

                    this.playSound('levelUp');
                }
            }
        } else {
            // Wrong letter hit - reset combo and apply penalty
            this.combo = 0;
            const penalty = 5 + (this.level * 2);
            this.score = Math.max(0, this.score - penalty);
            this.lives--;
            
            this.createFloatingText(letter.x + 10, letter.y + 5, `-${penalty}`, '#e74c3c', 0);
            this.createFloatingText(letter.x - 10, letter.y - 25, 'WRONG!', '#c0392b', 1);
            
            // Play wrong letter sound
            this.playSound('wrongLetter');
            
            if (this.lives <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // Update accuracy
        this.accuracy = Math.round((this.totalLettersHit / this.totalShots) * 100) || 100;
        
        this.letters.splice(letterIndex, 1);
        this.updateUI();
    }
    
    updateLetterColors() {
        // Update colors for all letters based on current game state
        const nextLetter = this.nextLetterIndex < this.currentTargetWord.length ? 
                          this.currentTargetWord[this.nextLetterIndex] : null;
        
        this.letters.forEach(letter => {
            if (letter.letter === nextLetter) {
                // This is the letter we need - make it green
                letter.color = '#27ae60';
            } else {
                // This is not the letter we need - make it red
                letter.color = '#e74c3c';
            }
        });
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                life: 30,
                color: color
            });
        }
    }
    
    createFloatingText(x, y, text, color, priority = 0) {
        // Adjust positioning based on existing nearby texts to avoid overlap
        let adjustedX = x;
        let adjustedY = y;
        
        // Check for nearby floating texts and adjust position
        const nearbyTexts = this.floatingTexts.filter(existing => {
            const distance = Math.sqrt(
                Math.pow(existing.x - x, 2) + Math.pow(existing.y - y, 2)
            );
            return distance < 80; // Consider texts within 80 pixels as "nearby"
        });
        
        // If there are nearby texts, offset this one
        if (nearbyTexts.length > 0) {
            // Offset by 30 pixels vertically for each nearby text
            adjustedY = y - (nearbyTexts.length * 30);
            
            // Add slight horizontal offset for visual variety
            adjustedX = x + (nearbyTexts.length % 2 === 0 ? 15 : -15);
        }
        
        // Special positioning for different text types
        if (text.includes('COMBO')) {
            adjustedY -= 20; // Combo messages appear higher
            adjustedX += Math.random() * 40 - 20; // Random horizontal offset
        } else if (text.includes('WORD COMPLETE') || text.includes('PERFECT') || text.includes('LEVEL UP')) {
            // Center these important messages and give them priority positioning
            adjustedX = this.canvas.width / 2;
            adjustedY = 150 + (this.floatingTexts.filter(t => 
                t.text.includes('WORD COMPLETE') || 
                t.text.includes('PERFECT') || 
                t.text.includes('LEVEL UP')
            ).length * 40);
        } else if (text.startsWith('+') || text.startsWith('-')) {
            // Score messages get slight random offset
            adjustedX += Math.random() * 30 - 15;
            adjustedY += Math.random() * 20 - 10;
        }
        
        // Ensure the text stays within canvas bounds
        adjustedX = Math.max(50, Math.min(this.canvas.width - 50, adjustedX));
        adjustedY = Math.max(30, Math.min(this.canvas.height - 30, adjustedY));
        
        this.floatingTexts.push({
            x: adjustedX,
            y: adjustedY,
            text: text,
            color: color,
            speed: 2 + Math.random() * 1, // Slightly variable speed
            life: 60,
            maxLife: 60,
            alpha: 1,
            fontSize: text.includes('COMBO') || text.includes('PERFECT') || text.includes('LEVEL') ? 20 : 16,
            priority: priority
        });
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Unlock language selector
        document.getElementById('languageSelect').disabled = false;
        
        // Play game over sound
        this.playSound('gameOver', 330, 1.5, 0.4);
        
        // Update final stats
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        document.getElementById('finalWordsCompleted').textContent = this.wordsCompleted;
        document.getElementById('finalAccuracy').textContent = this.accuracy;
        document.getElementById('finalLevel').textContent = this.level;
        
        // Show game over screen
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Update button states
        document.getElementById('startButton').disabled = false;
        document.getElementById('pauseButton').disabled = true;
        
        // Set up Play Again button
        const playAgainButton = document.getElementById('playAgainButton');
        const newPlayAgainButton = playAgainButton.cloneNode(true);
        
        // Add click handler to new button
        newPlayAgainButton.addEventListener('click', () => {
            // First reset the game
            this.resetGame();
            // Then start it immediately
            this.startGame();
        });
        
        // Replace old button with new one
        playAgainButton.parentNode.replaceChild(newPlayAgainButton, playAgainButton);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('spelledWord').textContent = this.spelledWord;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('accuracy').textContent = this.accuracy;
        document.getElementById('wordsCompleted').textContent = this.wordsCompleted;
        // Update the visible target word banner if present
        const targetEl = document.getElementById('targetWord');
        if (targetEl) {
            // Show the current target word (or blank if not set)
            targetEl.textContent = this.currentTargetWord || '';
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background elements
        this.drawBackground();
        
        // Draw clown
        this.drawClown();
        
        // Draw letters
        this.letters.forEach(letter => this.drawLetter(letter));
        
        // Draw balls
        this.balls.forEach(ball => this.drawBall(ball));
        
        // Draw particles
        this.particles.forEach(particle => this.drawParticle(particle));
        
        // Draw floating score texts (sorted by priority - higher priority drawn last/on top)
    const sortedTexts = [...this.floatingTexts].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    sortedTexts.forEach(text => this.drawFloatingText(text));

    // Draw aiming line
        if (this.gameRunning && !this.gamePaused) {
            this.drawAimingLine();
        }
        
        // Draw pause overlay
        if (this.gamePaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawBackground() {
        // Define color schemes for different levels
        const levelColors = [
            // Level 1: Classic red and yellow circus
            { stripes: 'rgba(255, 255, 0, 0.15)', ground: '#8b4513', base: '#ff6b6b' },
            // Level 2: Blue and white circus
            { stripes: 'rgba(255, 255, 255, 0.2)', ground: '#654321', base: '#4ecdc4' },
            // Level 3: Purple and gold circus
            { stripes: 'rgba(255, 215, 0, 0.18)', ground: '#5d4037', base: '#9b59b6' },
            // Level 4+: Green and silver circus (for advanced levels)
            { stripes: 'rgba(192, 192, 192, 0.15)', ground: '#424242', base: '#27ae60' }
        ];
        
        // Get colors for current level (default to last scheme for levels beyond 4)
        const colorIndex = Math.min(this.level - 1, levelColors.length - 1);
        const colors = levelColors[colorIndex];
        
        // Draw subtle background gradient based on level
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, colors.base + '20'); // Very light version of base color
        gradient.addColorStop(1, colors.base + '05'); // Even lighter at bottom
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw circus tent stripes with level-specific colors
        const stripeWidth = 40;
        for (let i = 0; i < this.canvas.width; i += stripeWidth * 2) {
            this.ctx.fillStyle = colors.stripes;
            this.ctx.fillRect(i, 0, stripeWidth, this.canvas.height);
        }
        
        // Draw ground with level-specific color
        this.ctx.fillStyle = colors.ground;
        this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
        
        // Add subtle ground texture
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < this.canvas.width; i += 20) {
            this.ctx.fillRect(i, this.canvas.height - 35, 10, 5);
        }
    }
    
    
    drawClown() {
        this.ctx.save();
        this.ctx.translate(this.clown.x, this.clown.y);
        
        // Clown body (circle)
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.clown.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Clown face
        this.ctx.fillStyle = '#ffdbac';
        this.ctx.beginPath();
        this.ctx.arc(0, -5, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Clown nose
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(0, -5, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Clown eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-7, -10, 2, 0, Math.PI * 2);
        this.ctx.arc(7, -10, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Clown hat
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.beginPath();
        this.ctx.arc(0, -25, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cannon
        this.ctx.rotate(this.clown.angle);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(25, -8, 40, 16);
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(60, -12, 20, 24);
        
        this.ctx.restore();
    }
    
    drawLetter(letter) {
        this.ctx.save();
        this.ctx.translate(letter.x, letter.y);
        this.ctx.rotate(letter.rotation);
        
        // Letter background circle
        this.ctx.fillStyle = letter.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, letter.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Letter border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Letter text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(letter.letter, 0, 0);
        
        this.ctx.restore();
    }
    
    drawBall(ball) {
        // Ball gradient
        const gradient = this.ctx.createRadialGradient(
            ball.x - 3, ball.y - 3, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, ball.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x - 3, ball.y - 3, ball.radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawParticle(particle) {
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.life / 30;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }
    
    drawAimingLine() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.clown.x, this.clown.y);
        this.ctx.lineTo(
            this.clown.x + Math.cos(this.clown.angle) * 100,
            this.clown.y + Math.sin(this.clown.angle) * 100
        );
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);

        // Show controller status and controls if connected
        if (this.gamepadConnected) {
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('🎮 Controller Connected', this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('In-Game Controls:', this.canvas.width / 2, this.canvas.height / 2 + 90);
            this.ctx.fillText('Left Stick: Aim | A/Triggers: Shoot | Start: Pause', this.canvas.width / 2, this.canvas.height / 2 + 120);
            this.ctx.fillText('Menu Controls:', this.canvas.width / 2, this.canvas.height / 2 + 160);
            this.ctx.fillText('A: Select/Confirm | B: Back/Reset | D-Pad Down: Options', this.canvas.width / 2, this.canvas.height / 2 + 190);
        }
    }
    
    drawFloatingText(text) {
        this.ctx.save();
        this.ctx.globalAlpha = text.alpha;
        this.ctx.fillStyle = text.color;
        this.ctx.font = `bold ${text.fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add shadow for better readability
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Thick black outline for contrast
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(text.text, text.x, text.y);
        
        // Reset shadow for fill
        this.ctx.shadowColor = 'transparent';
        this.ctx.fillText(text.text, text.x, text.y);
        this.ctx.restore();
    }
    
    initAudio() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioContext = null;
        }
    }
    
    // Programmatically generate sound effects using Web Audio API
    playSound(type, frequency = 440, duration = 0.2, volume = 0.3) {
        if (!this.audioContext) return;
        
        // Apply master volume
        const adjustedVolume = volume * this.masterVolume;
        if (adjustedVolume <= 0) return; // Don't play if volume is 0
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Configure the sound based on type
        switch (type) {
            case 'shoot':
                this.createShootSound(oscillator, gainNode, duration, adjustedVolume);
                break;
            case 'correctLetter':
                this.createCorrectLetterSound(oscillator, gainNode, duration, adjustedVolume);
                break;
            case 'wrongLetter':
                this.createWrongLetterSound(oscillator, gainNode, duration, adjustedVolume);
                break;
            case 'wordComplete':
                this.createWordCompleteSound(oscillator, gainNode, duration, adjustedVolume);
                break;
            case 'levelUp':
                this.createLevelUpSound(oscillator, gainNode, duration, adjustedVolume);
                break;
            case 'gameOver':
                this.createGameOverSound(oscillator, gainNode, duration, adjustedVolume);
                break;
            case 'combo':
                this.createComboSound(oscillator, gainNode, duration, adjustedVolume);
                break;
            default:
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.type = 'sine';
        }
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createShootSound(oscillator, gainNode, duration, volume) {
        // Circus cannon/pop sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    }
    
    createCorrectLetterSound(oscillator, gainNode, duration, volume) {
        // Happy circus bell sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    }
    
    createWrongLetterSound(oscillator, gainNode, duration, volume) {
        // Circus horn "wrong" sound
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    }
    
    createWordCompleteSound(oscillator, gainNode, duration, volume) {
        // Triumphant circus fanfare
        oscillator.type = 'triangle';
        const notes = [523, 659, 784, 1047]; // C-E-G-C major chord
        let noteTime = 0;
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, this.audioContext.currentTime);
                gain.gain.setValueAtTime(volume * 0.7, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            }, index * 50);
        });
    }
    
    createLevelUpSound(oscillator, gainNode, duration, volume) {
        // Ascending circus scale
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(262, this.audioContext.currentTime); // C4
        oscillator.frequency.exponentialRampToValueAtTime(523, this.audioContext.currentTime + duration); // C5
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime + duration * 0.8);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    }
    
    createGameOverSound(oscillator, gainNode, duration, volume) {
        // Sad descending circus trombone
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime); // E4
        oscillator.frequency.exponentialRampToValueAtTime(165, this.audioContext.currentTime + duration); // E3
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    }
    
    createComboSound(oscillator, gainNode, duration, volume) {
        // Exciting combo sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(1320, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    }
    
    // Ensure audio context is resumed (required by some browsers)
    resumeAudio() {
        if (!this.audioContext) return Promise.resolve();
        if (this.audioContext.state === 'suspended') {
            // return the resume promise so callers can wait for it
            return this.audioContext.resume().catch(err => {
                console.warn('Failed to resume audio context:', err);
            });
        }
        return Promise.resolve();
    }
    
    // Background Music System
    toggleBackgroundMusic() {
        const musicToggle = document.getElementById('musicToggle');
        
        if (this.musicPlaying) {
            this.stopBackgroundMusic();
            musicToggle.textContent = '\u25b6\ufe0f';
            musicToggle.classList.remove('playing');
        } else {
            this.startBackgroundMusic();
            musicToggle.textContent = '\u23f8\ufe0f';
            musicToggle.classList.add('playing');
        }
    }
    
    startBackgroundMusic() {
        if (!this.audioContext || this.musicPlaying) return;

        this.musicPlaying = true;
        // Ensure the audio context is resumed before scheduling music.
        this.resumeAudio().then(() => {
            if (!this.musicPlaying) return; // aborted while resuming
            this.playCircusMusic();
        }).catch(err => {
            console.warn('Could not start background music:', err);
        });
    }
    
    stopBackgroundMusic() {
        this.musicPlaying = false;
        if (this.backgroundMusic) {
            this.backgroundMusic.forEach(node => {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            });
            this.backgroundMusic = null;
        }
    }
    
    updateMusicVolume() {
        if (this.backgroundMusic && this.backgroundMusic.gainNode) {
            this.backgroundMusic.gainNode.gain.setValueAtTime(
                this.musicVolume, 
                this.audioContext.currentTime
            );
        }
    }
    
    playCircusMusic() {
        if (!this.audioContext || !this.musicPlaying) return;
        
        // Create a classic circus melody using multiple oscillators
        this.backgroundMusic = [];
        
        // Main melody notes (simplified "Entry of the Gladiators" style)
        const melodyNotes = [
            // Measures in C major with circus-style rhythm
            {note: 261.63, duration: 0.25}, // C4
            {note: 293.66, duration: 0.25}, // D4
            {note: 329.63, duration: 0.25}, // E4
            {note: 349.23, duration: 0.25}, // F4
            {note: 392.00, duration: 0.5},  // G4
            {note: 349.23, duration: 0.25}, // F4
            {note: 329.63, duration: 0.25}, // E4
            {note: 293.66, duration: 0.5},  // D4
            
            {note: 261.63, duration: 0.25}, // C4
            {note: 293.66, duration: 0.25}, // D4
            {note: 329.63, duration: 0.25}, // E4
            {note: 349.23, duration: 0.25}, // F4
            {note: 392.00, duration: 1.0},  // G4
            
            {note: 392.00, duration: 0.25}, // G4
            {note: 440.00, duration: 0.25}, // A4
            {note: 493.88, duration: 0.25}, // B4
            {note: 523.25, duration: 0.25}, // C5
            {note: 493.88, duration: 0.25}, // B4
            {note: 440.00, duration: 0.25}, // A4
            {note: 392.00, duration: 0.5},  // G4
            {note: 261.63, duration: 0.5},  // C4
        ];
        
        // Bass line (simple oom-pah pattern)
        const bassNotes = [
            {note: 130.81, duration: 0.5}, // C3
            {note: 196.00, duration: 0.5}, // G3
            {note: 130.81, duration: 0.5}, // C3
            {note: 196.00, duration: 0.5}, // G3
            {note: 130.81, duration: 0.5}, // C3
            {note: 196.00, duration: 0.5}, // G3
            {note: 130.81, duration: 1.0}, // C3
            
            {note: 146.83, duration: 0.5}, // D3
            {note: 220.00, duration: 0.5}, // A3
            {note: 146.83, duration: 0.5}, // D3
            {note: 220.00, duration: 0.5}, // A3
            {note: 196.00, duration: 0.5}, // G3
            {note: 174.61, duration: 0.5}, // F3
            {note: 164.81, duration: 0.5}, // E3
            {note: 130.81, duration: 0.5}, // C3
        ];
        
        this.playMelodyLoop(melodyNotes, bassNotes);
    }
    
    playMelodyLoop(melodyNotes, bassNotes) {
        if (!this.musicPlaying || !this.audioContext) return;
        
        // Create master gain node for music
        const masterGain = this.audioContext.createGain();
        masterGain.connect(this.audioContext.destination);
        masterGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
        
        this.backgroundMusic.gainNode = masterGain;
        
        let currentTime = this.audioContext.currentTime;
        let melodyIndex = 0;
        let bassIndex = 0;
        
        const playNextNotes = () => {
            if (!this.musicPlaying) return;
            
            // Play melody note
            if (melodyIndex < melodyNotes.length) {
                const melodyNote = melodyNotes[melodyIndex];
                this.playMusicNote(melodyNote.note, melodyNote.duration, masterGain, 'triangle', 0.3);
                melodyIndex++;
            } else {
                melodyIndex = 0; // Loop the melody
            }
            
            // Play bass note (at different rhythm)
            if (bassIndex < bassNotes.length) {
                const bassNote = bassNotes[bassIndex];
                this.playMusicNote(bassNote.note, bassNote.duration, masterGain, 'sawtooth', 0.2);
                bassIndex++;
            } else {
                bassIndex = 0; // Loop the bass
            }
            
            // Schedule next notes
            currentTime += 0.5; // Half second intervals
            const nextTimeout = (currentTime - this.audioContext.currentTime) * 1000;
            
            if (this.musicPlaying) {
                setTimeout(playNextNotes, Math.max(0, nextTimeout));
            }
        };
        
        playNextNotes();
    }
    
    playMusicNote(frequency, duration, gainNode, waveType = 'triangle', volume = 0.3) {
        if (!this.audioContext || !this.musicPlaying) return;
        
        const oscillator = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();
        
        oscillator.connect(noteGain);
        noteGain.connect(gainNode);
        
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Envelope for musical note
        noteGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        noteGain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(volume * 0.7, this.audioContext.currentTime + duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        
        // Clean up
        oscillator.onended = () => {
            noteGain.disconnect();
            oscillator.disconnect();
        };
    }
    
    initSpeech() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            this.voices = [];
            this.voicesInitialized = false;
            
            // Function to initialize voices with retry
            const initVoices = (attempt = 1) => {
                const voices = this.speechSynthesis.getVoices();
                if ((!voices || !voices.length) && attempt <= 10) {
                    // Increase wait time between attempts
                    setTimeout(() => initVoices(attempt + 1), 500 * attempt);
                    return;
                }
                if (voices && voices.length) {
                    this.voices = voices;
                    this.voicesInitialized = true;
                    this.updateVoiceForCurrentLanguage();
                    console.log('Speech synthesis voices initialized:', voices.length, 'voices available');
                } else {
                    // Voices couldn't be loaded — disable speech but avoid noisy warnings
                    console.info('Speech synthesis voices not available; disabling speech');
                    this.speechEnabled = false;
                }
            };
            
            // Initialize voices when they become available
            this.speechSynthesis.onvoiceschanged = () => {
                const voices = this.speechSynthesis.getVoices();
                if (voices && voices.length) {
                    this.voices = voices;
                    this.voicesInitialized = true;
                    this.updateVoiceForCurrentLanguage();
                    console.log('Speech synthesis voices updated:', voices.length, 'voices available');
                }
            };
            
            // Initial attempt to get voices
            if (this.speechSynthesis.getVoices().length) {
                initVoices();
            } else {
                // Set a timeout to ensure onvoiceschanged has a chance to fire
                setTimeout(() => {
                    if (!this.voicesInitialized) {
                        initVoices();
                    }
                }, 500);
            }
        } else {
            console.warn('Text-to-speech not supported in this browser');
            this.speechEnabled = false;
        }
    }
    
    updateVoiceForCurrentLanguage() {
        // Only log warning if voices should be available but aren't
        if (this.voicesInitialized && (!this.voices || !this.voices.length)) {
            console.warn('No voices available despite initialization');
            return;
        }
        // Silently return if voices aren't initialized yet
        if (!this.voicesInitialized) {
            return;
        }

        const langCode = this.currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        const langBase = this.currentLanguage === 'fr' ? 'fr' : 'en';
        
        // Try to find a voice in this priority:
        // 1. Exact match for language code (non-local)
        // 2. Exact match for language code (including local)
        // 3. Base language match (en or fr)
        // 4. Any voice for the base language
        // 5. First available voice
        this.speechVoice = this.voices.find(voice => voice.lang === langCode && !voice.localService) || 
                          this.voices.find(voice => voice.lang === langCode) ||
                          this.voices.find(voice => voice.lang.startsWith(langBase) && !voice.localService) ||
                          this.voices.find(voice => voice.lang.startsWith(langBase)) ||
                          this.voices[0];

        if (this.speechVoice) {
            console.log(`Selected voice: ${this.speechVoice.name} (${this.speechVoice.lang}) for language: ${langCode}`);
        } else {
            console.warn('No suitable voice found, speech may not work');
        }
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
        
        // Update UI text
        document.querySelector('.target-word-label').textContent = this.translations[lang].spellThisWord;
        document.querySelector('.info-item:nth-child(1)').innerHTML = 
            `${this.translations[lang].score}: <span id="score">${this.score}</span>`;
        document.querySelector('.info-item:nth-child(2)').innerHTML = 
            `${this.translations[lang].level}: <span id="level">${this.level}</span>`;
        document.querySelector('.info-item:nth-child(3)').innerHTML = 
            `${this.translations[lang].lives}: <span id="lives">${this.lives}</span>`;
        
        // Update game stats
        const comboStat = document.querySelector('.stat:nth-child(1)');
        const accuracyStat = document.querySelector('.stat:nth-child(2)');
        const wordsStat = document.querySelector('.stat:nth-child(3)');
        
        comboStat.innerHTML = `${this.translations[lang].combo}: <span id="combo">${this.combo}</span>`;
        accuracyStat.innerHTML = `${this.translations[lang].accuracy}: <span id="accuracy">${this.accuracy}</span>%`;
        wordsStat.innerHTML = `${this.translations[lang].words}: <span id="wordsCompleted">${this.wordsCompleted}</span>`;
        
        // Reset available word lists with the new language
        this.availableWordLists = this.wordLists[lang].map(wordList => [...wordList]);
        
        // Update the voice for the new language
        this.updateVoiceForCurrentLanguage();
        
        // Select a new word in the current language
        this.selectNewWord();
        
        // Update UI
        this.updateUI();
    }
    
    speakWord(word) {
        if (!this.speechEnabled || this.speechVolume <= 0) return;

        const synth = window.speechSynthesis;
        if (!synth) {
            console.warn('Speech synthesis not available');
            return;
        }

        // Ensure speech synthesis is in a good state
        synth.cancel();
        
        // Create and configure utterance
        const utterance = new SpeechSynthesisUtterance(word.toLowerCase());
        utterance.volume = Math.min(1, Math.max(0, this.speechVolume));
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Set language and voice
        const langCode = this.currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        utterance.lang = langCode;
        
        if (this.speechVoice) {
            utterance.voice = this.speechVoice;
            console.log(`Speaking '${word}' with voice: ${this.speechVoice.name} (${this.speechVoice.lang})`);
        } else {
            console.log(`Speaking '${word}' with default voice for ${langCode}`);
        }

        // Error handling and logging
        utterance.onerror = (event) => {
            const errorDetails = event.error || 'Unknown error';
            console.warn(`Speech synthesis failed: ${errorDetails}`);
            
            // If voice selection might be the issue, try without a specific voice
            if (this.speechVoice && event.error === 'synthesis-failed') {
                console.log('Retrying with default voice...');
                const retryUtterance = new SpeechSynthesisUtterance(word.toLowerCase());
                retryUtterance.lang = langCode;
                retryUtterance.volume = utterance.volume;
                retryUtterance.rate = utterance.rate;
                retryUtterance.pitch = utterance.pitch;
                synth.speak(retryUtterance);
            }
        };

        // Attempt to speak
        try {
            synth.speak(utterance);
        } catch (error) {
            console.error('Failed to initiate speech:', error);
        }
    }
    
    showContinuePrompt() {
        // Pause the game
        this.gamePaused = true;
        
        // Create a custom dialog overlay
        const continueDialog = document.createElement('div');
        continueDialog.id = 'continueDialog';
        continueDialog.className = 'dialog-overlay';
        continueDialog.innerHTML = `
            <div class="dialog-content">
                <h2>\ud83c\udfaa Congratulations! \ud83c\udfaa</h2>
                <p>You've completed all 4 levels!</p>
                <p>Would you like to continue playing at maximum difficulty?</p>
                <div class="dialog-buttons">
                    <button id="continueYes" class="dialog-btn continue-btn">Continue Playing</button>
                    <button id="continueNo" class="dialog-btn stop-btn">End Game</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(continueDialog);
        
        // Add event listeners for the buttons
        document.getElementById('continueYes').addEventListener('click', () => {
            this.handleContinueChoice(true);
        });
        
        document.getElementById('continueNo').addEventListener('click', () => {
            this.handleContinueChoice(false);
        });
        
        // Update pause button text
        document.getElementById('pauseButton').textContent = 'Resume';
    }
    
    handleContinueChoice(shouldContinue) {
        // Remove the dialog
        const dialog = document.getElementById('continueDialog');
        if (dialog) {
            dialog.remove();
        }
        
        if (shouldContinue) {
            // Continue playing at max difficulty
            this.gamePaused = false;
            document.getElementById('pauseButton').textContent = 'Pause';
            
            // Display a dramatic endless mode announcement
            this.createFloatingText(this.canvas.width / 2, 140, 'ENDLESS MODE', '#ffd700', 2);
            setTimeout(() => {
                this.createFloatingText(this.canvas.width / 2, 180, 'ACTIVATED!', '#ff6b6b', 2);
            }, 500);
        } else {
            // End the game
            this.gameOver();
        }
    }

    selectNewWord() {
        // Choose a new target word for the current level and language
        const lang = this.currentLanguage || 'en';
        const levelIndex = Math.max(0, Math.min((this.level || 1) - 1, this.availableWordLists.length - 1));

        // Ensure availableWordLists exists and has a fallback
        if (!this.availableWordLists || !this.availableWordLists[levelIndex] || !this.availableWordLists[levelIndex].length) {
            // Rebuild from original wordLists if we've exhausted words
            if (this.wordLists && this.wordLists[lang]) {
                this.availableWordLists = this.wordLists[lang].map(list => [...list]);
            } else {
                // Last resort: pick a dummy word
                this.currentTargetWord = 'WORD';
                this.spelledWord = '';
                this.nextLetterIndex = 0;
                this.wordStartTime = Date.now();
                this.updateLetterColors();
                this.updateUI && this.updateUI();
                return;
            }
        }

        const list = this.availableWordLists[levelIndex];
        // If list is empty after rebuild, fallback to next non-empty
        let chosenList = list;
        if (!chosenList || !chosenList.length) {
            chosenList = this.availableWordLists.find(l => l && l.length) || [];
        }

        if (!chosenList.length) {
            this.currentTargetWord = 'WORD';
        } else {
            const idx = Math.floor(Math.random() * chosenList.length);
            this.currentTargetWord = chosenList.splice(idx, 1)[0];
        }

        // Reset spelled progress
        this.spelledWord = '';
        this.nextLetterIndex = 0;
        this.wordStartTime = Date.now();

        // Clear letters on screen to start fresh for the new word
        this.letters = [];

        // Update UI and letter colors
        this.updateLetterColors();
        if (typeof this.updateUI === 'function') this.updateUI();

        // Speak the new word if available
        if (this.speechEnabled && typeof this.speakWord === 'function') {
            this.speakWord(this.currentTargetWord);
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

}
