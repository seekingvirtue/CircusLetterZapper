// Data module: translations and word lists
const translations = {
    en: {
        spellThisWord: 'Spell this word:',
        score: 'Score',
        level: 'Level',
        lives: 'Lives',
        combo: 'Combo',
        accuracy: 'Accuracy',
        words: 'Words'
    },
    fr: {
        spellThisWord: '\u00c9pelle ce mot:',
        score: 'Score',
        level: 'Niveau',
        lives: 'Vies',
        combo: 'Combo',
        accuracy: 'Pr\u00e9cision',
        words: 'Mots'
    }
    ,
    atari: {
        spellThisWord: 'PRESS START TO SPELL:',
        score: 'SCORE',
        level: 'LEVEL',
        lives: 'LIVES',
        combo: 'COMBO',
        accuracy: 'ACCURACY',
        words: 'WORDS'
    }
};

const wordLists = {
    en: [
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
    ],
    fr: [
        // Level 1: 3-letter words
        ['CAS', 'JEU', 'VUE', 'THE', 'BAL', 'SOL', 'ROI', 'BON', 'VIN', 'SAC',
         'BUS', 'MUR', 'NEZ', 'OUI', 'NON', 'PIE', 'RUE', 'VIE', 'FEU', 'DOS',
         'CAR', 'BEC', 'MOT', 'NID', 'TOI'],
        
        // Level 2: 4-letter words
        ['CHAT', 'JOIE', 'PAIN', 'BEAU', 'LUNE', 'ROSE', 'NUIT', 'PEUR', 'FOUR', 'VENT',
         'MAIN', 'PAPA', 'DOUX', 'PARC', 'JOUR', 'BLEU', 'NOIR', 'VERT', 'MERE', 'FILS',
         'BOIS', 'LAIT', 'PIED', 'DAME', 'VITE'],
        
        // Level 3: 5-letter words
        ['ECOLE', 'ETOILE', 'PLAGE', 'LIVRE', 'REVER', 'FLEUR', 'HEURE', 'NEIGE', 'MERCI', 'COEUR',
         'TABLE', 'ROUTE', 'POMME', 'ARBRE', 'CHIEN', 'MONDE', 'BELLE', 'HERBE', 'JAUNE', 'ROUGE',
         'VERRE', 'PORTE', 'FROID', 'CHAUD', 'SUCRE'],
        
        // Level 4: 6+ letter circus-themed and advanced words
        ['CIRQUE', 'JONGLEUR', 'ACROBATE', 'CLOWN', 'TRAPEZE', 'BALLON', 'CHAPITEAU', 'SPECTACLE', 'MUSIQUE', 'LUMIERE',
         'ELEPHANT', 'CASCADE', 'COSTUME', 'ARTISTE', 'DANSEUR', 'MAGICIEN', 'EQUILIBRE', 'FUNAMBULE', 'APPLAUDIR', 'FESTIVAL',
         'PAPILLON', 'JARDIN', 'MAISON', 'SOLEIL', 'ENFANT']
    ]
    ,
    atari: [
        // Level 1: short 3-letter retro tech/game acronyms
        ['CPU','ROM','RAM','CRT','GOTO','BIN','BTN','LED','GFX','HUD','RPG','FPS','LAN','USB','PWR','VHS','CDR','VGA','PSX','BIT','SFX','VCS','CAB','ZIP','MAP'],

        // Level 2: 4-letter gameplay/retro words
        ['PONG','GAME','PLAY','SAVE','LOAD','TAPE','DISK','BEEP','FUJI','PAUSE','BOSS','LIFE','SCORE','COIN','TOKEN','MUTE','BOOT','SYNC','MENU','CTRL','ITEM','GOLD','BOMB','WADE','CARD'],

        // Level 3: 5-letter retro/arcade words
        ['ATARI','HARRY','NOLEN','PIXEL','SPRITE','POWER','LASER','ALIEN','SPACE','DRIVE','ROBOT','QUEST','CABLE','SOUND','MUSIC','BLAST','LEVEL','TOKEN','SHOOT','GALAXY','ARCADE','EEPROM','PIXEL','START','RESET'],

        // Level 4: longer retro-themed words
        ['CABINET','JOYSTICK','CARTRIDGE','CONTROLLER','HIGHSCORE','CXSTICK','PIXELART','GAMEPAD','PITFALL','BITCRUSH','SOUNDTRACK','POWERUP','EXTRALIFE','COINOP','INSERTCOIN','CRANE','GALAGA','ASTEROID','DONKEYKONG','PACMAN','JOYSTIK','LEADERBOARD','LEVELUP','COMBAT','BREAKOUT']
    ]
};
