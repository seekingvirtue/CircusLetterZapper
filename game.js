// Circus Letter Zapper Game - JavaScript

class CircusLetterZapper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.gamePaused = false;
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Enhanced scoring system
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsCompleted = 0;
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
        
        // Word lists for different levels - 25 words each
        this.wordLists = [
            // Level 1: 3-letter words
            ['CAT', 'DOG', 'SUN', 'CAR', 'BAT', 'HAT', 'FUN', 'RUN', 'BOX', 'FOX', 
             'BED', 'RED', 'PEN', 'TEN', 'CUP', 'POP', 'TOP', 'HOP', 'BUG', 'HUG', 
             'LOG', 'HOG', 'BAG', 'TAG', 'WIN'],
            
            // Level 2: 4-letter words
            ['BIRD', 'FISH', 'CAKE', 'BOOK', 'TREE', 'MOON', 'STAR', 'PLAY', 'JUMP', 'FROG',
             'DUCK', 'BEAR', 'LION', 'BALL', 'DOOR', 'FIRE', 'RAIN', 'SNOW', 'BLUE', 'PINK',
             'GOLD', 'LAMP', 'SHIP', 'KITE', 'CORN'],
            
            // Level 3: 5-letter words
            ['APPLE', 'HOUSE', 'WATER', 'HAPPY', 'MAGIC', 'DREAM', 'QUEEN', 'TRAIN', 'SNAKE', 'HORSE',
             'PLANE', 'ROBOT', 'BEACH', 'BREAD', 'CHAIR', 'CLOCK', 'CLOUD', 'CROWN', 'DANCE', 'FAIRY',
             'LIGHT', 'MUSIC', 'OCEAN', 'PLANT', 'SMILE'],
            
            // Level 4: 6+ letter circus-themed and advanced words
            ['ELEPHANT', 'RAINBOW', 'BALLOON', 'JUGGLER', 'ACROBAT', 'CIRCUS', 'CLOWN', 'TRAPEZE', 'POPCORN', 'TICKET',
             'ANIMAL', 'CAMERA', 'CASTLE', 'DRAGON', 'FLOWER', 'GARDEN', 'HAMMER', 'INSECT', 'JUNGLE', 'KITTEN',
             'LADDER', 'MONKEY', 'NUGGET', 'OCTOPUS', 'PUZZLE']
        ];
        
        this.currentWordIndex = 0;
        this.currentTargetWord = '';
        this.spelledWord = '';
        this.nextLetterIndex = 0;
        
        // Create copies of word lists to track used words
        this.availableWordLists = this.wordLists.map(wordList => [...wordList]);
        
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
        
        this.setupEventListeners();
        this.initGame();
    }
    
    setupEventListeners() {
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Button controls
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetButton').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainButton').addEventListener('click', () => this.resetGame());
        
        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeDisplay = document.getElementById('volumeDisplay');
        volumeSlider.addEventListener('input', (e) => {
            this.masterVolume = e.target.value / 100;
            volumeDisplay.textContent = e.target.value + '%';
        });
        
        // Music control
        const musicSlider = document.getElementById('musicSlider');
        const musicDisplay = document.getElementById('musicDisplay');
        const musicToggle = document.getElementById('musicToggle');
        
        musicSlider.addEventListener('input', (e) => {
            this.musicVolume = e.target.value / 100;
            musicDisplay.textContent = e.target.value + '%';
            if (this.backgroundMusic) {
                this.updateMusicVolume();
            }
        });
        
        musicToggle.addEventListener('click', () => {
            this.toggleBackgroundMusic();
        });
        
        // Speech control
        const speechSlider = document.getElementById('speechSlider');
        const speechDisplay = document.getElementById('speechDisplay');
        const speechToggle = document.getElementById('speechToggle');
        
        speechSlider.addEventListener('input', (e) => {
            this.speechVolume = e.target.value / 100;
            speechDisplay.textContent = e.target.value + '%';
        });
        
        speechToggle.addEventListener('click', () => {
            this.speechEnabled = !this.speechEnabled;
            if (this.speechEnabled) {
                speechToggle.textContent = '🔊';
                speechToggle.classList.remove('disabled');
            } else {
                speechToggle.textContent = '🔇';
                speechToggle.classList.add('disabled');
                // Cancel any ongoing speech
                if (this.speechSynthesis) {
                    this.speechSynthesis.cancel();
                }
            }
        });
        
        // Keyboard controls (optional)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameRunning && !this.gamePaused) {
                this.shootBall();
                e.preventDefault();
            }
        });
    }
    
    initGame() {
        this.selectNewWord();
        this.updateUI();
        this.gameLoop();
    }
    
    selectNewWord() {
        const levelIndex = Math.min(this.level - 1, this.availableWordLists.length - 1);
        let currentWordList = this.availableWordLists[levelIndex];
        
        // If no words left in current level, refill from original list
        if (currentWordList.length === 0) {
            currentWordList = [...this.wordLists[levelIndex]];
            this.availableWordLists[levelIndex] = currentWordList;
            console.log(`Refilled word list for level ${this.level}`);
        }
        
        // Randomly select a word from the available words
        const randomIndex = Math.floor(Math.random() * currentWordList.length);
        this.currentTargetWord = currentWordList[randomIndex];
        
        // Remove the selected word from available words
        currentWordList.splice(randomIndex, 1);
        
        this.spelledWord = '';
        this.nextLetterIndex = 0;
        this.wordStartTime = Date.now(); // Reset timer for word completion bonus
        
        document.getElementById('targetWord').textContent = this.currentTargetWord;
        document.getElementById('spelledWord').textContent = this.spelledWord;
        
        // Update letter colors for the new word
        this.updateLetterColors();
        
        this.currentWordIndex++;
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        
        // Resume audio context if needed
        this.resumeAudio();
        
        // Start background music automatically when game starts
        if (!this.musicPlaying) {
            this.startBackgroundMusic();
            // Update the music toggle button to reflect playing state
            const musicToggle = document.getElementById('musicToggle');
            musicToggle.textContent = '⏸️';
            musicToggle.classList.add('playing');
        }
        
        document.getElementById('startButton').disabled = true;
        document.getElementById('pauseButton').disabled = false;
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    pauseGame() {
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseButton').textContent = this.gamePaused ? 'Resume' : 'Pause';
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.currentWordIndex = 0;
        
        // Reset scoring variables
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsCompleted = 0;
        this.totalLettersHit = 0;
        this.accuracy = 100;
        this.totalShots = 0;
        this.successfulShots = 0;
        this.scoreMultiplier = 1;
        this.timeBonus = 0;
        this.wordStartTime = Date.now();
        
        this.letters = [];
        this.balls = [];
        this.particles = [];
        this.floatingTexts = [];
        
        // Reset available word lists
        this.availableWordLists = this.wordLists.map(wordList => [...wordList]);
        
        this.selectNewWord();
        this.updateUI();
        
        document.getElementById('startButton').disabled = false;
        document.getElementById('pauseButton').disabled = true;
        document.getElementById('pauseButton').textContent = 'Pause';
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    handleMouseMove(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate angle from clown to mouse
        const dx = mouseX - this.clown.x;
        const dy = mouseY - this.clown.y;
        this.clown.angle = Math.atan2(dy, dx);
    }
    
    handleClick(e) {
        if (!this.gameRunning || this.gamePaused) return;
        this.shootBall();
    }
    
    shootBall() {
        this.totalShots++; // Track total shots for accuracy calculation
        
        const ball = {
            x: this.clown.x,
            y: this.clown.y,
            vx: Math.cos(this.clown.angle) * this.ballSpeed,
            vy: Math.sin(this.clown.angle) * this.ballSpeed,
            radius: 8,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
        };
        this.balls.push(ball);
        
        // Play shoot sound
        this.playSound('shoot');
    }
    
    spawnLetter() {
        if (Math.random() < this.letterSpawnRate) {
            // Generate random letter, but favor correct letters
            let letter;
            if (Math.random() < 0.4 && this.nextLetterIndex < this.currentTargetWord.length) {
                // 40% chance to spawn the correct letter
                letter = this.currentTargetWord[this.nextLetterIndex];
            } else {
                // Random letter
                letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
            
            const letterObj = {
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: -30,
                letter: letter,
                speed: this.letterSpeed + Math.random() * 2,
                radius: 25,
                color: '#e74c3c', // Default color, will be updated dynamically
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            };
            this.letters.push(letterObj);
        }
    }
    
    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
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
                
                this.selectNewWord();
                
                // Level up every 3 words
                if (this.currentWordIndex % 3 === 0) {
                    this.level++;
                    this.letterSpeed += 0.5;
                    this.letterSpawnRate += 0.005;
                    
                    // Check if we've completed all levels
                    if (this.level > this.wordLists.length) {
                        // Game completed! Show victory message and prompt to continue
                        this.createFloatingText(this.canvas.width / 2, 100, 'CONGRATULATIONS!', '#ffd700', 2);
                        this.createFloatingText(this.canvas.width / 2, 140, 'ALL LEVELS COMPLETE!', '#e74c3c', 2);
                        
                        // Pause the game and show continue prompt
                        this.showContinuePrompt();
                        
                        // Set level back to max difficulty
                        this.level = this.wordLists.length;
                    } else {
                        // Normal level up
                        this.createFloatingText(this.canvas.width / 2, 100, `LEVEL UP! ${this.level}`, '#3498db', 2);
                    }
                    
                    // Play level up sound
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
        
        // Play game over sound
        this.playSound('gameOver', 330, 1.5, 0.4);
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        document.getElementById('finalWordsCompleted').textContent = this.wordsCompleted;
        document.getElementById('finalAccuracy').textContent = this.accuracy;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('startButton').disabled = false;
        document.getElementById('pauseButton').disabled = true;
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('spelledWord').textContent = this.spelledWord;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('accuracy').textContent = this.accuracy;
        document.getElementById('wordsCompleted').textContent = this.wordsCompleted;
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
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Background Music System
    toggleBackgroundMusic() {
        const musicToggle = document.getElementById('musicToggle');
        
        if (this.musicPlaying) {
            this.stopBackgroundMusic();
            musicToggle.textContent = '▶️';
            musicToggle.classList.remove('playing');
        } else {
            this.startBackgroundMusic();
            musicToggle.textContent = '⏸️';
            musicToggle.classList.add('playing');
        }
    }
    
    startBackgroundMusic() {
        if (!this.audioContext || this.musicPlaying) return;
        
        this.musicPlaying = true;
        this.resumeAudio();
        this.playCircusMusic();
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
        // Initialize Text-to-Speech
        this.speechSynthesis = window.speechSynthesis;
        this.speechVoice = null;
        
        // Wait for voices to load and select a suitable voice
        if (this.speechSynthesis) {
            const setVoice = () => {
                const voices = this.speechSynthesis.getVoices();
                // Try to find a child-friendly or clear English voice
                this.speechVoice = voices.find(voice => 
                    voice.lang.startsWith('en') && 
                    (voice.name.includes('Female') || voice.name.includes('Child') || voice.name.includes('Google'))
                ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
            };
            
            // Voices might not be loaded immediately
            if (this.speechSynthesis.getVoices().length > 0) {
                setVoice();
            } else {
                this.speechSynthesis.addEventListener('voiceschanged', setVoice);
            }
        }
    }
    
    speakWord(word) {
        if (!this.speechSynthesis || !this.speechEnabled || this.speechVolume <= 0) {
            return;
        }
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(word.toLowerCase());
        
        // Configure speech settings
        if (this.speechVoice) {
            utterance.voice = this.speechVoice;
        }
        utterance.volume = this.speechVolume;
        utterance.rate = 0.8; // Slightly slower for clarity
        utterance.pitch = 1.1; // Slightly higher pitch for friendliness
        
        // Add some personality to the speech
        utterance.onstart = () => {
            console.log(`Speaking: ${word}`);
        };
        
        utterance.onerror = (event) => {
            console.warn('Speech synthesis error:', event.error);
        };
        
        // Speak the word
        this.speechSynthesis.speak(utterance);
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
                <h2>🎪 Congratulations! 🎪</h2>
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
            this.createFloatingText(this.canvas.width / 2, 180, 'ENDLESS MODE ACTIVATED!', '#ff6b6b', 2);
        } else {
            // End the game
            this.gameOver();
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new CircusLetterZapper();
});
