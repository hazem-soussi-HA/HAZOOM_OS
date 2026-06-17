/**
 * Hazoom Operating System - Enhanced Application Runner
 * Copyright © 2025 Hazem Soussi - All Rights Reserved
 * 
 * Advanced cross-platform application runner with full integration
 */

class EnhancedAppRunner {
    constructor() {
        this.runningApps = new Map();
        this.appInstances = new Map();
        this.appRegistry = new Map();
        this.windowManager = new WindowManager();
        this.appIdCounter = 1000;
        
        // Integration with existing systems
        this.platform = window.hazoomPlatform;
        this.appStore = window.hazoomAppStore;
        this.kernel = window.hazoomKernel;
        this.fileSystem = window.hazoomFS;
        
        this.initializeEnhancedRegistry();
        this.setupEventListeners();
    }

    initializeEnhancedRegistry() {
        // Enhanced app definitions with full lifecycle management
        const enhancedApps = {
            // Desktop Applications
            'file-manager': {
                name: 'File Manager',
                type: 'desktop',
                icon: '📁',
                description: 'Browse and manage files',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFileManager.bind(this),
                lifecycle: {
                    onCreate: () => console.log('File Manager created'),
                    onStart: () => console.log('File Manager started'),
                    onStop: () => console.log('File Manager stopped'),
                    onDestroy: () => console.log('File Manager destroyed')
                }
            },
            
            'terminal-pro': {
                name: 'Terminal Pro',
                type: 'desktop',
                icon: '💻',
                description: 'Advanced terminal with tabs and split view',
                category: 'development',
                version: '2.0.0',
                permissions: ['storage', 'notifications'],
                runner: this.runTerminalPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Terminal Pro created'),
                    onStart: () => console.log('Terminal Pro started')
                }
            },
            
            'code-editor-pro': {
                name: 'Code Editor Pro',
                type: 'desktop',
                icon: '📝',
                description: 'Advanced code editor with syntax highlighting',
                category: 'development',
                version: '2.0.0',
                permissions: ['storage', 'clipboard', 'notifications'],
                runner: this.runCodeEditorPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Code Editor Pro created')
                }
            },
            
            'web-browser-pro': {
                name: 'Web Browser Pro',
                type: 'desktop',
                icon: '🌐',
                description: 'Advanced web browser with tabs',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['storage', 'notifications'],
                runner: this.runWebBrowserPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Web Browser Pro created')
                }
            },
            
            'media-player-pro': {
                name: 'Media Player Pro',
                type: 'desktop',
                icon: '🎵',
                description: 'Advanced media player with playlist',
                category: 'entertainment',
                version: '2.0.0',
                permissions: ['storage', 'audio', 'notifications'],
                runner: this.runMediaPlayerPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Media Player Pro created')
                }
            },
            
            'text-editor-pro': {
                name: 'Text Editor Pro',
                type: 'desktop',
                icon: '📄',
                description: 'Rich text editor with formatting',
                category: 'productivity',
                version: '2.0.0',
                permissions: ['storage', 'clipboard'],
                runner: this.runTextEditorPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Text Editor Pro created')
                }
            },
            
            'calculator-pro': {
                name: 'Calculator Pro',
                type: 'desktop',
                icon: '🔢',
                description: 'Scientific calculator',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCalculatorPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Calculator Pro created')
                }
            },
            
            'image-viewer': {
                name: 'Image Viewer',
                type: 'desktop',
                icon: '🖼️',
                description: 'View and edit images',
                category: 'photography',
                version: '2.0.0',
                permissions: ['storage', 'camera'],
                runner: this.runImageViewer.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Image Viewer created')
                }
            },
            
            'pdf-reader': {
                name: 'PDF Reader',
                type: 'desktop',
                icon: '📕',
                description: 'Read PDF documents',
                category: 'productivity',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPDFReader.bind(this),
                lifecycle: {
                    onCreate: () => console.log('PDF Reader created')
                }
            },
            
            'note-taking': {
                name: 'Note Taking',
                type: 'desktop',
                icon: '📝',
                description: 'Advanced note-taking app',
                category: 'productivity',
                version: '2.0.0',
                permissions: ['storage', 'clipboard', 'camera'],
                runner: this.runNoteTaking.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Note Taking created')
                }
            },

            // Mobile Applications
            'phone-pro': {
                name: 'Phone Pro',
                type: 'mobile',
                icon: '📞',
                description: 'Advanced phone with call history',
                category: 'communication',
                version: '2.0.0',
                permissions: ['microphone', 'notifications'],
                runner: this.runPhonePro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Phone Pro created')
                }
            },
            
            'messages-pro': {
                name: 'Messages Pro',
                type: 'mobile',
                icon: '💬',
                description: 'Enhanced messaging with rich features',
                category: 'communication',
                version: '2.0.0',
                permissions: ['storage', 'camera', 'microphone', 'notifications'],
                runner: this.runMessagesPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Messages Pro created')
                }
            },
            
            'camera-pro': {
                name: 'Camera Pro',
                type: 'mobile',
                icon: '📷',
                description: 'Advanced camera with filters',
                category: 'photography',
                version: '2.0.0',
                permissions: ['camera', 'storage', 'microphone'],
                runner: this.runCameraPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Camera Pro created')
                }
            },
            
            'maps-pro': {
                name: 'Maps Pro',
                type: 'mobile',
                icon: '🗺️',
                description: 'Advanced maps with navigation',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['geolocation', 'storage'],
                runner: this.runMapsPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Maps Pro created')
                }
            },
            
            'weather-pro-mobile': {
                name: 'Weather Pro',
                type: 'mobile',
                icon: '🌤️',
                description: 'Detailed weather forecasts',
                category: 'weather',
                version: '2.0.0',
                permissions: ['geolocation', 'notifications'],
                runner: this.runWeatherProMobile.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Weather Pro Mobile created')
                }
            },
            
            'music-pro': {
                name: 'Music Pro',
                type: 'mobile',
                icon: '🎵',
                description: 'Advanced music player',
                category: 'entertainment',
                version: '2.0.0',
                permissions: ['audio', 'storage', 'notifications'],
                runner: this.runMusicPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Music Pro created')
                }
            },
            
            'calculator-pro-mobile': {
                name: 'Calculator Pro',
                type: 'mobile',
                icon: '🔢',
                description: 'Scientific calculator',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCalculatorProMobile.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Calculator Pro Mobile created')
                }
            },
            
            'settings-pro': {
                name: 'Settings Pro',
                type: 'mobile',
                icon: '⚙️',
                description: 'Advanced system settings',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['storage', 'notifications'],
                runner: this.runSettingsPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Settings Pro created')
                }
            },
            
            'gallery': {
                name: 'Gallery',
                type: 'mobile',
                icon: '🖼️',
                description: 'Photo and video gallery',
                category: 'photography',
                version: '2.0.0',
                permissions: ['storage', 'camera'],
                runner: this.runGallery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Gallery created')
                }
            },
            
            'contacts': {
                name: 'Contacts',
                type: 'mobile',
                icon: '👥',
                description: 'Contact management',
                category: 'communication',
                version: '2.0.0',
                permissions: ['storage', 'camera'],
                runner: this.runContacts.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Contacts created')
                }
            },
            
            'calendar-pro': {
                name: 'Calendar Pro',
                type: 'mobile',
                icon: '📅',
                description: 'Advanced calendar and events',
                category: 'productivity',
                version: '2.0.0',
                permissions: ['storage', 'notifications'],
                runner: this.runCalendarPro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Calendar Pro created')
                }
            },
            
            'alarm-clock': {
                name: 'Alarm Clock',
                type: 'mobile',
                icon: '⏰',
                description: 'Alarm and timer',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['audio', 'notifications'],
                runner: this.runAlarmClock.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Alarm Clock created')
                }
            },
            
            'notes-mobile': {
                name: 'Notes',
                type: 'mobile',
                icon: '📝',
                description: 'Quick notes and lists',
                category: 'productivity',
                version: '2.0.0',
                permissions: ['storage', 'clipboard'],
                runner: this.runNotesMobile.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Notes Mobile created')
                }
            },
            
            'tasks-mobile': {
                name: 'Tasks',
                type: 'mobile',
                icon: '✅',
                description: 'Task management',
                category: 'productivity',
                version: '2.0.0',
                permissions: ['storage', 'notifications'],
                runner: this.runTasksMobile.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tasks Mobile created')
                }
            },
            
            'voice-recorder': {
                name: 'Voice Recorder',
                type: 'mobile',
                icon: '🎤',
                description: 'Record audio notes',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['microphone', 'storage'],
                runner: this.runVoiceRecorder.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Voice Recorder created')
                }
            },
            
            'compass': {
                name: 'Compass',
                type: 'mobile',
                icon: '🧭',
                description: 'Direction and orientation',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['sensors', 'geolocation'],
                runner: this.runCompass.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Compass created')
                }
            },
            
            'level': {
                name: 'Level',
                type: 'mobile',
                icon: '📐',
                description: 'Spirit level tool',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['sensors'],
                runner: this.runLevel.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Level created')
                }
            },
            
            'stopwatch': {
                name: 'Stopwatch',
                type: 'mobile',
                icon: '⏱️',
                description: 'Stopwatch and timer',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['notifications'],
                runner: this.runStopwatch.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Stopwatch created')
                }
            },
            
            'flashlight': {
                name: 'Flashlight',
                type: 'mobile',
                icon: '🔦',
                description: 'Turn on flashlight',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['camera'],
                runner: this.runFlashlight.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Flashlight created')
                }
            },
            
            'scanner': {
                name: 'Scanner',
                type: 'mobile',
                icon: '🔍',
                description: 'Document scanner',
                category: 'productivity',
                version: '2.0.0',
                permissions: ['camera', 'storage'],
                runner: this.runScanner.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Scanner created')
                }
            },
            
            'translator-mobile': {
                name: 'Translator',
                type: 'mobile',
                icon: '🌐',
                description: 'Real-time translation',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['microphone', 'camera', 'storage'],
                runner: this.runTranslatorMobile.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Translator Mobile created')
                }
            },
            
            'unit-converter': {
                name: 'Unit Converter',
                type: 'mobile',
                icon: '🔄',
                description: 'Convert units and currencies',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runUnitConverter.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Unit Converter created')
                }
            },
            
            'tip-calculator': {
                name: 'Tip Calculator',
                type: 'mobile',
                icon: '💵',
                description: 'Calculate tips and splits',
                category: 'finance',
                version: '2.0.0',
                permissions: [],
                runner: this.runTipCalculator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tip Calculator created')
                }
            },
            
            'bmi-calculator': {
                name: 'BMI Calculator',
                type: 'mobile',
                icon: '💪',
                description: 'Body Mass Index calculator',
                category: 'health',
                version: '2.0.0',
                permissions: [],
                runner: this.runBMICalculator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('BMI Calculator created')
                }
            },
            
            'world-clock': {
                name: 'World Clock',
                type: 'mobile',
                icon: '🌍',
                description: 'Multiple time zones',
                category: 'utilities',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWorldClock.bind(this),
                lifecycle: {
                    onCreate: () => console.log('World Clock created')
                }
            },
            
            'sudoku': {
                name: 'Sudoku',
                type: 'mobile',
                icon: '9️',
                description: 'Classic sudoku game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSudoku.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Sudoku created')
                }
            },
            
            'tic-tac-toe': {
                name: 'Tic Tac Toe',
                type: 'mobile',
                icon: '❌',
                description: 'Classic tic tac toe',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runTicTacToe.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tic Tac Toe created')
                }
            },
            
            'snake': {
                name: 'Snake',
                type: 'mobile',
                icon: '🐍',
                description: 'Classic snake game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSnake.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Snake created')
                }
            },
            
            'minesweeper': {
                name: 'Minesweeper',
                type: 'mobile',
                icon: '💣',
                description: 'Classic minesweeper',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMinesweeper.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Minesweeper created')
                }
            },
            
            'chess': {
                name: 'Chess',
                type: 'mobile',
                icon: '♟️',
                description: 'Chess game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runChess.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Chess created')
                }
            },
            
            'memory-game-mobile': {
                name: 'Memory Game',
                type: 'mobile',
                icon: '🧠',
                description: 'Memory matching game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMemoryGameMobile.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Memory Game Mobile created')
                }
            },
            
            'quiz-game': {
                name: 'Quiz Game',
                type: 'mobile',
                icon: '❓',
                description: 'Trivia quiz game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runQuizGame.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Quiz Game created')
                }
            },
            
            'word-search': {
                name: 'Word Search',
                type: 'mobile',
                icon: '🔍',
                description: 'Word search puzzle',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWordSearch.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Word Search created')
                }
            },
            
            'crossword': {
                name: 'Crossword',
                type: 'mobile',
                icon: '🔤',
                description: 'Crossword puzzle',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCrossword.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Crossword created')
                }
            },
            
            'hangman': {
                name: 'Hangman',
                type: 'mobile',
                icon: '👤',
                description: 'Word guessing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHangman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hangman created')
                }
            },
            
            'rock-paper-scissors': {
                name: 'Rock Paper Scissors',
                type: 'mobile',
                icon: '✊',
                description: 'Classic hand game',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runRockPaperScissors.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Rock Paper Scissors created')
                }
            },
            
            'higher-lower': {
                name: 'Higher Lower',
                type: 'mobile',
                icon: '📈',
                description: 'Number guessing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHigherLower.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Higher Lower created')
                }
            },
            
            'dice-roller': {
                name: 'Dice Roller',
                type: 'mobile',
                icon: '🎲',
                description: 'Virtual dice',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runDiceRoller.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Dice Roller created')
                }
            },
            
            'coin-flip': {
                name: 'Coin Flip',
                type: 'mobile',
                icon: '🪙',
                description: 'Virtual coin toss',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runCoinFlip.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Coin Flip created')
                }
            },
            
            'magic-8-ball': {
                name: 'Magic 8 Ball',
                type: 'mobile',
                icon: '🎱',
                description: 'Fortune teller',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runMagic8Ball.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Magic 8 Ball created')
                }
            },
            
            'truth-or-dare': {
                name: 'Truth or Dare',
                type: 'mobile',
                icon: '🎭',
                description: 'Party game',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runTruthOrDare.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Truth or Dare created')
                }
            },
            
            'would-you-rather': {
                name: 'Would You Rather',
                type: 'mobile',
                icon: '🤔',
                description: 'Decision game',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runWouldYouRather.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Would You Rather created')
                }
            },
            
            'never-have-i-ever': {
                name: 'Never Have I Ever',
                type: 'mobile',
                icon: '✋',
                description: 'Party confession game',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runNeverHaveIEver.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Never Have I Ever created')
                }
            },
            
            'riddle-master': {
                name: 'Riddle Master',
                type: 'mobile',
                icon: '🧩',
                description: 'Riddle solving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRiddleMaster.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Riddle Master created')
                }
            },
            
            'trivia-master': {
                name: 'Trivia Master',
                type: 'mobile',
                icon: '🏆',
                description: 'Trivia challenge',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTriviaMaster.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Trivia Master created')
                }
            },
            
            'typing-racer': {
                name: 'Typing Racer',
                type: 'mobile',
                icon: '🏎️',
                description: 'Typing speed race',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTypingRacer.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Typing Racer created')
                }
            },
            
            'reaction-tester': {
                name: 'Reaction Tester',
                type: 'mobile',
                icon: '⚡',
                description: 'Test your reflexes',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runReactionTester.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Reaction Tester created')
                }
            },
            
            'color-matching': {
                name: 'Color Matching',
                type: 'mobile',
                icon: '🎨',
                description: 'Color memory game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runColorMatching.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Color Matching created')
                }
            },
            
            'pattern-memory': {
                name: 'Pattern Memory',
                type: 'mobile',
                icon: '🎯',
                description: 'Pattern recall game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPatternMemory.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Pattern Memory created')
                }
            },
            
            'speed-click': {
                name: 'Speed Click',
                type: 'mobile',
                icon: '👆',
                description: 'Clicking speed test',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runSpeedClick.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Speed Click created')
                }
            },
            
            'bubble-pop': {
                name: 'Bubble Pop',
                type: 'mobile',
                icon: '🫧',
                description: 'Pop bubbles game',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runBubblePop.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Bubble Pop created')
                }
            },
            
            'tap-master': {
                name: 'Tap Master',
                type: 'mobile',
                icon: '👆',
                description: 'Tap sequence game',
                category: 'games',
                version: '2.0.0',
                permissions: ['audio'],
                runner: this.runTapMaster.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tap Master created')
                }
            },
            
            'color-match': {
                name: 'Color Match',
                type: 'mobile',
                icon: '🌈',
                description: 'Color matching challenge',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runColorMatch.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Color Match created')
                }
            },
            
            'number-crunch': {
                name: 'Number Crunch',
                type: 'mobile',
                icon: '🔢',
                description: 'Math puzzle game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runNumberCrunch.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Number Crunch created')
                }
            },
            
            'word-master': {
                name: 'Word Master',
                type: 'mobile',
                icon: '📝',
                description: 'Word puzzle game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWordMaster.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Word Master created')
                }
            },
            
            'emoji-matcher': {
                name: 'Emoji Matcher',
                type: 'mobile',
                icon: '😊',
                description: 'Emoji matching game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runEmojiMatcher.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Emoji Matcher created')
                }
            },
            
            'animal-sounds': {
                name: 'Animal Sounds',
                type: 'mobile',
                icon: '🐾',
                description: 'Guess animal sounds',
                category: 'games',
                version: '2.0.0',
                permissions: ['audio'],
                runner: this.runAnimalSounds.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Animal Sounds created')
                }
            },
            
            'music-memory': {
                name: 'Music Memory',
                type: 'mobile',
                icon: '🎵',
                description: 'Music note memory',
                category: 'games',
                version: '2.0.0',
                permissions: ['audio', 'storage'],
                runner: this.runMusicMemory.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Music Memory created')
                }
            },
            
            'rhythm-tapper': {
                name: 'Rhythm Tapper',
                type: 'mobile',
                icon: '🥁',
                description: 'Rhythm game',
                category: 'games',
                version: '2.0.0',
                permissions: ['audio'],
                runner: this.runRhythmTapper.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Rhythm Tapper created')
                }
            },
            
            'color-blind': {
                name: 'Color Blind',
                type: 'mobile',
                icon: '👁️',
                description: 'Color perception test',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runColorBlind.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Color Blind created')
                }
            },
            
            'spot-the-difference': {
                name: 'Spot the Difference',
                type: 'mobile',
                icon: '🔍',
                description: 'Find differences',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSpotTheDifference.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Spot the Difference created')
                }
            },
            
            'hidden-objects': {
                name: 'Hidden Objects',
                type: 'mobile',
                icon: '🔎',
                description: 'Find hidden items',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHiddenObjects.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hidden Objects created')
                }
            },
            
            'jigsaw-puzzle': {
                name: 'Jigsaw Puzzle',
                type: 'mobile',
                icon: '🧩',
                description: 'Jigsaw puzzle game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runJigsawPuzzle.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Jigsaw Puzzle created')
                }
            },
            
            'sliding-puzzle': {
                name: 'Sliding Puzzle',
                type: 'mobile',
                icon: '🖼️',
                description: 'Sliding tile puzzle',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSlidingPuzzle.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Sliding Puzzle created')
                }
            },
            
            'tower-defense': {
                name: 'Tower Defense',
                type: 'mobile',
                icon: '🏰',
                description: 'Strategy defense game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTowerDefense.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tower Defense created')
                }
            },
            
            'space-shooter': {
                name: 'Space Shooter',
                type: 'mobile',
                icon: '🚀',
                description: 'Space arcade shooter',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage', 'sensors'],
                runner: this.runSpaceShooter.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Space Shooter created')
                }
            },
            
            'runner-game': {
                name: 'Runner Game',
                type: 'mobile',
                icon: '🏃',
                description: 'Endless runner',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage', 'sensors'],
                runner: this.runRunnerGame.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Runner Game created')
                }
            },
            
            'flappy-bird': {
                name: 'Flappy Bird',
                type: 'mobile',
                icon: '🐦',
                description: 'Classic flappy bird',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFlappyBird.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Flappy Bird created')
                }
            },
            
            'tetris': {
                name: 'Tetris',
                type: 'mobile',
                icon: '⬛',
                description: 'Classic tetris',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTetris.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tetris created')
                }
            },
            
            'pacman': {
                name: 'Pac-Man',
                type: 'mobile',
                icon: '👻',
                description: 'Classic pacman',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPacman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Pac-Man created')
                }
            },
            
            'breakout': {
                name: 'Breakout',
                type: 'mobile',
                icon: '🧱',
                description: 'Brick breaking game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBreakout.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Breakout created')
                }
            },
            
            'pong': {
                name: 'Pong',
                type: 'mobile',
                icon: '🏓',
                description: 'Classic pong',
                category: 'games',
                version: '2.0.0',
                permissions: [],
                runner: this.runPong.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Pong created')
                }
            },
            
            'asteroids': {
                name: 'Asteroids',
                type: 'mobile',
                icon: '☄️',
                description: 'Space asteroids game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAsteroids.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Asteroids created')
                }
            },
            
            'space-invaders-mobile': {
                name: 'Space Invaders',
                type: 'mobile',
                icon: '👾',
                description: 'Classic space invaders',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSpaceInvadersMobile.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Space Invaders Mobile created')
                }
            },
            
            'galaga': {
                name: 'Galaga',
                type: 'mobile',
                icon: '🛸',
                description: 'Space shooter game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGalaga.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Galaga created')
                }
            },
            
            'centipede': {
                name: 'Centipede',
                type: 'mobile',
                icon: '🐛',
                description: 'Classic centipede',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCentipede.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Centipede created')
                }
            },
            
            'donkey-kong': {
                name: 'Donkey Kong',
                type: 'mobile',
                icon: '🦍',
                description: 'Platform game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDonkeyKong.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Donkey Kong created')
                }
            },
            
            'mario-bros': {
                name: 'Mario Bros',
                type: 'mobile',
                icon: '🍄',
                description: 'Platform game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMarioBros.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mario Bros created')
                }
            },
            
            'frogger': {
                name: 'Frogger',
                type: 'mobile',
                icon: '🐸',
                description: 'Cross the road game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFrogger.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Frogger created')
                }
            },
            
            'dig-dug': {
                name: 'Dig Dug',
                type: 'mobile',
                icon: '⛏️',
                description: 'Digging game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDigDug.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Dig Dug created')
                }
            },
            
            'qbert': {
                name: 'Q*bert',
                type: 'mobile',
                icon: '👾',
                description: 'Isometric puzzle game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runQbert.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Q*bert created')
                }
            },
            
            'defender': {
                name: 'Defender',
                type: 'mobile',
                icon: '🛡️',
                description: 'Side-scrolling shooter',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDefender.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Defender created')
                }
            },
            
            'missile-command': {
                name: 'Missile Command',
                type: 'mobile',
                icon: '🚀',
                description: 'Defense strategy game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMissileCommand.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Missile Command created')
                }
            },
            
            'battle-city': {
                name: 'Battle City',
                type: 'mobile',
                icon: '🏙️',
                description: 'Tank battle game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBattleCity.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Battle City created')
                }
            },
            
            'contra': {
                name: 'Contra',
                type: 'mobile',
                icon: '💥',
                description: 'Action shooter game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runContra.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Contra created')
                }
            },
            
            'double-dragon': {
                name: 'Double Dragon',
                type: 'mobile',
                icon: '👊',
                description: 'Beat em up game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDoubleDragon.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Double Dragon created')
                }
            },
            
            'street-fighter': {
                name: 'Street Fighter',
                type: 'mobile',
                icon: '🥋',
                description: 'Fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runStreetFighter.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Street Fighter created')
                }
            },
            
            'mortal-kombat': {
                name: 'Mortal Kombat',
                type: 'mobile',
                icon: '💀',
                description: 'Fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMortalKombat.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mortal Kombat created')
                }
            },
            
            'tekken': {
                name: 'Tekken',
                type: 'mobile',
                icon: '🥋',
                description: '3D fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTekken.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tekken created')
                }
            },
            
            'virtua-fighter': {
                name: 'Virtua Fighter',
                type: 'mobile',
                icon: '🥊',
                description: '3D fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVirtuaFighter.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Virtua Fighter created')
                }
            },
            
            'soul-calibur': {
                name: 'Soul Calibur',
                type: 'mobile',
                icon: '⚔️',
                description: 'Weapon fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSoulCalibur.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Soul Calibur created')
                }
            },
            
            'dead-or-alive': {
                name: 'Dead or Alive',
                type: 'mobile',
                icon: '💀',
                description: 'Fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDeadOrAlive.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Dead or Alive created')
                }
            },
            
            'king-of-fighters': {
                name: 'King of Fighters',
                type: 'mobile',
                icon: '👑',
                description: 'Team fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runKingOfFighters.bind(this),
                lifecycle: {
                    onCreate: () => console.log('King of Fighters created')
                }
            },
            
            'samurai-shodown': {
                name: 'Samurai Shodown',
                type: 'mobile',
                icon: '🗡️',
                description: 'Weapon fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSamuraiShodown.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Samurai Shodown created')
                }
            },
            
            'fatal-fury': {
                name: 'Fatal Fury',
                type: 'mobile',
                icon: '🔥',
                description: 'Street fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFatalFury.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Fatal Fury created')
                }
            },
            
            'art-of-fighting': {
                name: 'Art of Fighting',
                type: 'mobile',
                icon: '🥋',
                description: 'Martial arts game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runArtOfFighting.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Art of Fighting created')
                }
            },
            
            'time-crisis': {
                name: 'Time Crisis',
                type: 'mobile',
                icon: '⏱️',
                description: 'Light gun shooter',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTimeCrisis.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Time Crisis created')
                }
            },
            
            'house-of-the-dead': {
                name: 'House of the Dead',
                type: 'mobile',
                icon: '🧟',
                description: 'Zombie shooter',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHouseOfTheDead.bind(this),
                lifecycle: {
                    onCreate: () => console.log('House of the Dead created')
                }
            },
            
            'point-blank': {
                name: 'Point Blank',
                type: 'mobile',
                icon: '🎯',
                description: 'Shooting gallery',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPointBlank.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Point Blank created')
                }
            },
            
            'operation-wolf': {
                name: 'Operation Wolf',
                type: 'mobile',
                icon: '🔫',
                description: 'Commando shooter',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runOperationWolf.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Operation Wolf created')
                }
            },
            
            'chase-hq': {
                name: 'Chase HQ',
                type: 'mobile',
                icon: '🚔',
                description: 'Police chase game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runChaseHQ.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Chase HQ created')
                }
            },
            
            'out-run': {
                name: 'Out Run',
                type: 'mobile',
                icon: '🏎️',
                description: 'Racing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runOutRun.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Out Run created')
                }
            },
            
            'daytona-usa': {
                name: 'Daytona USA',
                type: 'mobile',
                icon: '🏁',
                description: 'Arcade racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDaytonaUSA.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Daytona USA created')
                }
            },
            
            'mario-kart': {
                name: 'Mario Kart',
                type: 'mobile',
                icon: '🏎️',
                description: 'Kart racing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMarioKart.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mario Kart created')
                }
            },
            
            'crash-team-racing': {
                name: 'Crash Team Racing',
                type: 'mobile',
                icon: '💥',
                description: 'Kart racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCrashTeamRacing.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Crash Team Racing created')
                }
            },
            
            'diddy-kong-racing': {
                name: 'Diddy Kong Racing',
                type: 'mobile',
                icon: '🦍',
                description: 'Adventure racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDiddyKongRacing.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Diddy Kong Racing created')
                }
            },
            
            'f-zero': {
                name: 'F-Zero',
                type: 'mobile',
                icon: '🚀',
                description: 'Futuristic racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFZero.bind(this),
                lifecycle: {
                    onCreate: () => console.log('F-Zero created')
                }
            },
            
            'wipeout': {
                name: 'Wipeout',
                type: 'mobile',
                icon: '🛸',
                description: 'Anti-gravity racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWipeout.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Wipeout created')
                }
            },
            
            'gran-turismo': {
                name: 'Gran Turismo',
                type: 'mobile',
                icon: '🏁',
                description: 'Realistic racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGranTurismo.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Gran Turismo created')
                }
            },
            
            'forza-motorsport': {
                name: 'Forza Motorsport',
                type: 'mobile',
                icon: '🚗',
                description: 'Racing simulator',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runForzaMotorsport.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Forza Motorsport created')
                }
            },
            
            'need-for-speed': {
                name: 'Need for Speed',
                type: 'mobile',
                icon: '💨',
                description: 'Street racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runNeedForSpeed.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Need for Speed created')
                }
            },
            
            'burnout': {
                name: 'Burnout',
                type: 'mobile',
                icon: '🔥',
                description: 'Crash racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBurnout.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Burnout created')
                }
            },
            
            'midnight-club': {
                name: 'Midnight Club',
                type: 'mobile',
                icon: '🌙',
                description: 'Street racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMidnightClub.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Midnight Club created')
                }
            },
            
            'test-drive': {
                name: 'Test Drive',
                type: 'mobile',
                icon: '🏎️',
                description: 'Exotic car racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTestDrive.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Test Drive created')
                }
            },
            
            'project-gotham': {
                name: 'Project Gotham',
                type: 'mobile',
                icon: '🏙️',
                description: 'City racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runProjectGotham.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Project Gotham created')
                }
            },
            
            'grid': {
                name: 'Grid',
                type: 'mobile',
                icon: '🏁',
                description: 'Racing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGrid.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Grid created')
                }
            },
            
            'assetto-corsa': {
                name: 'Assetto Corsa',
                type: 'mobile',
                icon: '🏎️',
                description: 'Racing simulator',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAssettoCorsa.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Assetto Corsa created')
                }
            },
            
            'iracing': {
                name: 'iRacing',
                type: 'mobile',
                icon: '🌐',
                description: 'Online racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runIRacing.bind(this),
                lifecycle: {
                    onCreate: () => console.log('iRacing created')
                }
            },
            
            'r-factor': {
                name: 'rFactor',
                type: 'mobile',
                icon: '🔧',
                description: 'Racing simulator',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRFactor.bind(this),
                lifecycle: {
                    onCreate: () => console.log('rFactor created')
                }
            },
            
            'automobilista': {
                name: 'Automobilista',
                type: 'mobile',
                icon: '🏁',
                description: 'Brazilian racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAutomobilista.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Automobilista created')
                }
            },
            
            'race-room': {
                name: 'RaceRoom',
                type: 'mobile',
                icon: '🏎️',
                description: 'Racing simulation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRaceRoom.bind(this),
                lifecycle: {
                    onCreate: () => console.log('RaceRoom created')
                }
            },
            
            'project-cars': {
                name: 'Project CARS',
                type: 'mobile',
                icon: '🚗',
                description: 'Racing simulation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runProjectCars.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Project CARS created')
                }
            },
            
            'assetto-corsa-competizione': {
                name: 'Assetto Corsa Competizione',
                type: 'mobile',
                icon: '🏁',
                description: 'GT racing simulation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAssettoCorsaCompetizione.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Assetto Corsa Competizione created')
                }
            },
            
            'r-factor-2': {
                name: 'rFactor 2',
                type: 'mobile',
                icon: '🔧',
                description: 'Advanced racing sim',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRFactor2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('rFactor 2 created')
                }
            },
            
            'live-for-speed': {
                name: 'Live for Speed',
                type: 'mobile',
                icon: '⚡',
                description: 'Racing simulation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runLiveForSpeed.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Live for Speed created')
                }
            },
            
            'race07': {
                name: 'Race 07',
                type: 'mobile',
                icon: '🏁',
                description: 'GT racing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRace07.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Race 07 created')
                }
            },
            
            'gtr-2': {
                name: 'GTR 2',
                type: 'mobile',
                icon: '🏎️',
                description: 'GT racing simulation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGTR2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('GTR 2 created')
                }
            },
            
            'race-the-sun': {
                name: 'Race the Sun',
                type: 'mobile',
                icon: '☀️',
                description: 'Endless racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRaceTheSun.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Race the Sun created')
                }
            },
            
            'trackmania': {
                name: 'Trackmania',
                type: 'mobile',
                icon: '🏁',
                description: 'Stunt racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTrackmania.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Trackmania created')
                }
            },
            
            'carmageddon': {
                name: 'Carmageddon',
                type: 'mobile',
                icon: '💥',
                description: 'Destruction racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCarmageddon.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Carmageddon created')
                }
            },
            
            'flatout': {
                name: 'FlatOut',
                type: 'mobile',
                icon: '🚗',
                description: 'Destruction derby',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFlatout.bind(this),
                lifecycle: {
                    onCreate: () => console.log('FlatOut created')
                }
            },
            
            'wreckfest': {
                name: 'Wreckfest',
                type: 'mobile',
                icon: '🔨',
                description: 'Destruction racing',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWreckfest.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Wreckfest created')
                }
            },
            
            'beamng-drive': {
                name: 'BeamNG.drive',
                type: 'mobile',
                icon: '🚗',
                description: 'Soft-body physics sim',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBeamNGDrive.bind(this),
                lifecycle: {
                    onCreate: () => console.log('BeamNG.drive created')
                }
            },
            
            'my-sumo': {
                name: 'My Summer Car',
                type: 'mobile',
                icon: '🚗',
                description: 'Car building sim',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMySummerCar.bind(this),
                lifecycle: {
                    onCreate: () => console.log('My Summer Car created')
                }
            },
            
            'city-car-driving': {
                name: 'City Car Driving',
                type: 'mobile',
                icon: '🏙️',
                description: 'Driving simulator',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCityCarDriving.bind(this),
                lifecycle: {
                    onCreate: () => console.log('City Car Driving created')
                }
            },
            
            'bus-simulator': {
                name: 'Bus Simulator',
                type: 'mobile',
                icon: '🚌',
                description: 'Bus driving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBusSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Bus Simulator created')
                }
            },
            
            'truck-simulator': {
                name: 'Truck Simulator',
                type: 'mobile',
                icon: '🚚',
                description: 'Truck driving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTruckSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Truck Simulator created')
                }
            },
            
            'farming-simulator': {
                name: 'Farming Simulator',
                type: 'mobile',
                icon: '🚜',
                description: 'Farm management',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFarmingSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Farming Simulator created')
                }
            },
            
            'construction-simulator': {
                name: 'Construction Simulator',
                type: 'mobile',
                icon: '🏗️',
                description: 'Construction game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runConstructionSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Construction Simulator created')
                }
            },
            
            'train-simulator': {
                name: 'Train Simulator',
                type: 'mobile',
                icon: '🚂',
                description: 'Train driving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTrainSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Train Simulator created')
                }
            },
            
            'flight-simulator': {
                name: 'Flight Simulator',
                type: 'mobile',
                icon: '✈️',
                description: 'Aircraft simulation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFlightSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Flight Simulator created')
                }
            },
            
            'boat-simulator': {
                name: 'Boat Simulator',
                type: 'mobile',
                icon: '🚤',
                description: 'Boat driving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBoatSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Boat Simulator created')
                }
            },
            
            'submarine-simulator': {
                name: 'Submarine Simulator',
                type: 'mobile',
                icon: '🛥️',
                description: 'Submarine game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSubmarineSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Submarine Simulator created')
                }
            },
            
            'tank-simulator': {
                name: 'Tank Simulator',
                type: 'mobile',
                icon: '🛡️',
                description: 'Tank warfare game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTankSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tank Simulator created')
                }
            },
            
            'helicopter-simulator': {
                name: 'Helicopter Simulator',
                type: 'mobile',
                icon: '🚁',
                description: 'Helicopter game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHelicopterSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Helicopter Simulator created')
                }
            },
            
            'spaceship-simulator': {
                name: 'Spaceship Simulator',
                type: 'mobile',
                icon: '🚀',
                description: 'Space flight game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSpaceshipSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Spaceship Simulator created')
                }
            },
            
            'robot-simulator': {
                name: 'Robot Simulator',
                type: 'mobile',
                icon: '🤖',
                description: 'Robot control game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRobotSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Robot Simulator created')
                }
            },
            
            'crane-simulator': {
                name: 'Crane Simulator',
                type: 'mobile',
                icon: '🏗️',
                description: 'Crane operation game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCraneSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Crane Simulator created')
                }
            },
            
            'forklift-simulator': {
                name: 'Forklift Simulator',
                type: 'mobile',
                icon: '🏭',
                description: 'Forklift operation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runForkliftSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Forklift Simulator created')
                }
            },
            
            'bulldozer-simulator': {
                name: 'Bulldozer Simulator',
                type: 'mobile',
                icon: '🚜',
                description: 'Bulldozer operation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBulldozerSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Bulldozer Simulator created')
                }
            },
            
            'excavator-simulator': {
                name: 'Excavator Simulator',
                type: 'mobile',
                icon: '🏗️',
                description: 'Excavator operation',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runExcavatorSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Excavator Simulator created')
                }
            },
            
            'combine-harvester': {
                name: 'Combine Harvester',
                type: 'mobile',
                icon: '🌾',
                description: 'Harvesting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCombineHarvester.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Combine Harvester created')
                }
            },
            
            'tractor-simulator': {
                name: 'Tractor Simulator',
                type: 'mobile',
                icon: '🚜',
                description: 'Tractor driving',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTractorSimulator.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tractor Simulator created')
                }
            },
            
            'lawn-mower': {
                name: 'Lawn Mower',
                type: 'mobile',
                icon: '🌿',
                description: 'Lawn mowing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runLawnMower.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Lawn Mower created')
                }
            },
            
            'snow-plow': {
                name: 'Snow Plow',
                type: 'mobile',
                icon: '❄️',
                description: 'Snow removal game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSnowPlow.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Snow Plow created')
                }
            },
            
            'street-sweeper': {
                name: 'Street Sweeper',
                type: 'mobile',
                icon: '🧹',
                description: 'Street cleaning game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runStreetSweeper.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Street Sweeper created')
                }
            },
            
            'garbage-truck': {
                name: 'Garbage Truck',
                type: 'mobile',
                icon: '🗑️',
                description: 'Garbage collection game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGarbageTruck.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Garbage Truck created')
                }
            },
            
            'tow-truck': {
                name: 'Tow Truck',
                type: 'mobile',
                icon: '🚗',
                description: 'Towing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTowTruck.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tow Truck created')
                }
            },
            
            'ambulance': {
                name: 'Ambulance',
                type: 'mobile',
                icon: '🚑',
                description: 'Medical emergency game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAmbulance.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ambulance created')
                }
            },
            
            'fire-truck': {
                name: 'Fire Truck',
                type: 'mobile',
                icon: '🚒',
                description: 'Fire fighting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFireTruck.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Fire Truck created')
                }
            },
            
            'police-car': {
                name: 'Police Car',
                type: 'mobile',
                icon: '🚓',
                description: 'Police chase game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPoliceCar.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Police Car created')
                }
            },
            
            'taxi': {
                name: 'Taxi',
                type: 'mobile',
                icon: '🚕',
                description: 'Taxi driving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTaxi.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Taxi created')
                }
            },
            
            'bus': {
                name: 'Bus',
                type: 'mobile',
                icon: '🚌',
                description: 'Bus driving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBus.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Bus created')
                }
            },
            
            'truck': {
                name: 'Truck',
                type: 'mobile',
                icon: '🚚',
                description: 'Truck driving game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTruck.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Truck created')
                }
            },
            
            'delivery-van': {
                name: 'Delivery Van',
                type: 'mobile',
                icon: '🚐',
                description: 'Delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDeliveryVan.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Delivery Van created')
                }
            },
            
            'moving-van': {
                name: 'Moving Van',
                type: 'mobile',
                icon: '🚛',
                description: 'Moving company game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMovingVan.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Moving Van created')
                }
            },
            
            'ice-cream-truck': {
                name: 'Ice Cream Truck',
                type: 'mobile',
                icon: '🍦',
                description: 'Ice cream selling game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runIceCreamTruck.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ice Cream Truck created')
                }
            },
            
            'food-truck': {
                name: 'Food Truck',
                type: 'mobile',
                icon: '🍔',
                description: 'Food truck business',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFoodTruck.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Food Truck created')
                }
            },
            
            'pizza-delivery': {
                name: 'Pizza Delivery',
                type: 'mobile',
                icon: '🍕',
                description: 'Pizza delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPizzaDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Pizza Delivery created')
                }
            },
            
            'courier-service': {
                name: 'Courier Service',
                type: 'mobile',
                icon: '📦',
                description: 'Package delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCourierService.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Courier Service created')
                }
            },
            
            'mail-carrier': {
                name: 'Mail Carrier',
                type: 'mobile',
                icon: '📬',
                description: 'Mail delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMailCarrier.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mail Carrier created')
                }
            },
            
            'newspaper-delivery': {
                name: 'Newspaper Delivery',
                type: 'mobile',
                icon: '📰',
                description: 'Paper delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runNewspaperDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Newspaper Delivery created')
                }
            },
            
            'milkman': {
                name: 'Milkman',
                type: 'mobile',
                icon: '🥛',
                description: 'Milk delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMilkman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Milkman created')
                }
            },
            
            'flower-delivery': {
                name: 'Flower Delivery',
                type: 'mobile',
                icon: '💐',
                description: 'Flower delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFlowerDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Flower Delivery created')
                }
            },
            
            'cake-delivery': {
                name: 'Cake Delivery',
                type: 'mobile',
                icon: '🎂',
                description: 'Cake delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCakeDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Cake Delivery created')
                }
            },
            
            'grocery-delivery': {
                name: 'Grocery Delivery',
                type: 'mobile',
                icon: '🛒',
                description: 'Grocery delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGroceryDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Grocery Delivery created')
                }
            },
            
            'furniture-delivery': {
                name: 'Furniture Delivery',
                type: 'mobile',
                icon: '🛋️',
                description: 'Furniture delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFurnitureDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Furniture Delivery created')
                }
            },
            
            'car-delivery': {
                name: 'Car Delivery',
                type: 'mobile',
                icon: '🚗',
                description: 'Car delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCarDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Car Delivery created')
                }
            },
            
            'boat-delivery': {
                name: 'Boat Delivery',
                type: 'mobile',
                icon: '🚤',
                description: 'Boat delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBoatDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Boat Delivery created')
                }
            },
            
            'plane-delivery': {
                name: 'Plane Delivery',
                type: 'mobile',
                icon: '✈️',
                description: 'Air delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPlaneDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Plane Delivery created')
                }
            },
            
            'helicopter-delivery': {
                name: 'Helicopter Delivery',
                type: 'mobile',
                icon: '🚁',
                description: 'Helicopter delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHelicopterDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Helicopter Delivery created')
                }
            },
            
            'drone-delivery': {
                name: 'Drone Delivery',
                type: 'mobile',
                icon: '🛸',
                description: 'Drone delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDroneDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Drone Delivery created')
                }
            },
            
            'rocket-delivery': {
                name: 'Rocket Delivery',
                type: 'mobile',
                icon: '🚀',
                description: 'Space delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRocketDelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Rocket Delivery created')
                }
            },
            
            'ufo-delivery': {
                name: 'UFO Delivery',
                type: 'mobile',
                icon: '🛸',
                description: 'Alien delivery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runUFODelivery.bind(this),
                lifecycle: {
                    onCreate: () => console.log('UFO Delivery created')
                }
            },
            
            'magic-carpet': {
                name: 'Magic Carpet',
                type: 'mobile',
                icon: '🪄',
                description: 'Flying carpet game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMagicCarpet.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Magic Carpet created')
                }
            },
            
            'broomstick': {
                name: 'Broomstick',
                type: 'mobile',
                icon: '🧹',
                description: 'Witch flying game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBroomstick.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Broomstick created')
                }
            },
            
            'jetpack': {
                name: 'Jetpack',
                type: 'mobile',
                icon: '🚀',
                description: 'Jetpack game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runJetpack.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Jetpack created')
                }
            },
            
            'flying-carpet': {
                name: 'Flying Carpet',
                type: 'mobile',
                icon: '🪄',
                description: 'Magic carpet ride',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFlyingCarpet.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Flying Carpet created')
                }
            },
            
            'superman': {
                name: 'Superman',
                type: 'mobile',
                icon: '🦸',
                description: 'Flying superhero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSuperman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Superman created')
                }
            },
            
            'iron-man': {
                name: 'Iron Man',
                type: 'mobile',
                icon: '🦾',
                description: 'Flying armor game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runIronMan.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Iron Man created')
                }
            },
            
            'batman': {
                name: 'Batman',
                type: 'mobile',
                icon: '🦇',
                description: 'Glide through city',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBatman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Batman created')
                }
            },
            
            'spiderman': {
                name: 'Spiderman',
                type: 'mobile',
                icon: '🕷️',
                description: 'Web swinging game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSpiderman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Spiderman created')
                }
            },
            
            'wonder-woman': {
                name: 'Wonder Woman',
                type: 'mobile',
                icon: '👸',
                description: 'Flying superhero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWonderWoman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Wonder Woman created')
                }
            },
            
            'thor': {
                name: 'Thor',
                type: 'mobile',
                icon: '⚡',
                description: 'Flying hammer game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runThor.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Thor created')
                }
            },
            
            'super-mario': {
                name: 'Super Mario',
                type: 'mobile',
                icon: '🍄',
                description: 'Platform jumping game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSuperMario.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Super Mario created')
                }
            },
            
            'sonic': {
                name: 'Sonic',
                type: 'mobile',
                icon: '💨',
                description: 'Speed running game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSonic.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Sonic created')
                }
            },
            
            'donkey-kong-jr': {
                name: 'Donkey Kong Jr',
                type: 'mobile',
                icon: '🦍',
                description: 'Climbing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDonkeyKongJr.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Donkey Kong Jr created')
                }
            },
            
            'metroid': {
                name: 'Metroid',
                type: 'mobile',
                icon: '👾',
                description: 'Space exploration game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMetroid.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Metroid created')
                }
            },
            
            'zelda': {
                name: 'Zelda',
                type: 'mobile',
                icon: '🗡️',
                description: 'Adventure game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runZelda.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Zelda created')
                }
            },
            
            'castlevania': {
                name: 'Castlevania',
                type: 'mobile',
                icon: '🧛',
                description: 'Gothic action game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCastlevania.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Castlevania created')
                }
            },
            
            'mega-man': {
                name: 'Mega Man',
                type: 'mobile',
                icon: '🤖',
                description: 'Robot action game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMegaMan.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mega Man created')
                }
            },
            
            'street-fighter-ii': {
                name: 'Street Fighter II',
                type: 'mobile',
                icon: '🥋',
                description: 'Fighting game classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runStreetFighterII.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Street Fighter II created')
                }
            },
            
            'mortal-kombat-ii': {
                name: 'Mortal Kombat II',
                type: 'mobile',
                icon: '💀',
                description: 'Fighting game classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMortalKombatII.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mortal Kombat II created')
                }
            },
            
            'tekken-3': {
                name: 'Tekken 3',
                type: 'mobile',
                icon: '🥋',
                description: '3D fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTekken3.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tekken 3 created')
                }
            },
            
            'soul-calibur-ii': {
                name: 'Soul Calibur II',
                type: 'mobile',
                icon: '⚔️',
                description: 'Weapon fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSoulCaliburII.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Soul Calibur II created')
                }
            },
            
            'king-of-fighters-98': {
                name: 'King of Fighters 98',
                type: 'mobile',
                icon: '👑',
                description: 'Team fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runKingOfFighters98.bind(this),
                lifecycle: {
                    onCreate: () => console.log('King of Fighters 98 created')
                }
            },
            
            'samurai-shodown-ii': {
                name: 'Samurai Shodown II',
                type: 'mobile',
                icon: '🗡️',
                description: 'Weapon fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSamuraiShodownII.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Samurai Shodown II created')
                }
            },
            
            'fatal-fury-2': {
                name: 'Fatal Fury 2',
                type: 'mobile',
                icon: '🔥',
                description: 'Street fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFatalFury2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Fatal Fury 2 created')
                }
            },
            
            'art-of-fighting-2': {
                name: 'Art of Fighting 2',
                type: 'mobile',
                icon: '🥋',
                description: 'Martial arts classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runArtOfFighting2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Art of Fighting 2 created')
                }
            },
            
            'virtua-fighter-2': {
                name: 'Virtua Fighter 2',
                type: 'mobile',
                icon: '🥊',
                description: '3D fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVirtuaFighter2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Virtua Fighter 2 created')
                }
            },
            
            'dead-or-alive-2': {
                name: 'Dead or Alive 2',
                type: 'mobile',
                icon: '💀',
                description: 'Fighting game classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDeadOrAlive2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Dead or Alive 2 created')
                }
            },
            
            'tekken-2': {
                name: 'Tekken 2',
                type: 'mobile',
                icon: '🥋',
                description: '3D fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTekken2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tekken 2 created')
                }
            },
            
            'soul-edge': {
                name: 'Soul Edge',
                type: 'mobile',
                icon: '⚔️',
                description: 'Weapon fighting classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSoulEdge.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Soul Edge created')
                }
            },
            
            'tekken-1': {
                name: 'Tekken 1',
                type: 'mobile',
                icon: '🥋',
                description: '3D fighting pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTekken1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tekken 1 created')
                }
            },
            
            'virtua-fighter-1': {
                name: 'Virtua Fighter 1',
                type: 'mobile',
                icon: '🥊',
                description: '3D fighting pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVirtuaFighter1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Virtua Fighter 1 created')
                }
            },
            
            'dead-or-alive-1': {
                name: 'Dead or Alive 1',
                type: 'mobile',
                icon: '💀',
                description: 'Fighting game pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDeadOrAlive1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Dead or Alive 1 created')
                }
            },
            
            'king-of-fighters-94': {
                name: 'King of Fighters 94',
                type: 'mobile',
                icon: '👑',
                description: 'Team fighting pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runKingOfFighters94.bind(this),
                lifecycle: {
                    onCreate: () => console.log('King of Fighters 94 created')
                }
            },
            
            'samurai-shodown-1': {
                name: 'Samurai Shodown 1',
                type: 'mobile',
                icon: '🗡️',
                description: 'Weapon fighting pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSamuraiShodown1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Samurai Shodown 1 created')
                }
            },
            
            'fatal-fury-1': {
                name: 'Fatal Fury 1',
                type: 'mobile',
                icon: '🔥',
                description: 'Street fighting pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFatalFury1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Fatal Fury 1 created')
                }
            },
            
            'art-of-fighting-1': {
                name: 'Art of Fighting 1',
                type: 'mobile',
                icon: '🥋',
                description: 'Martial arts pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runArtOfFighting1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Art of Fighting 1 created')
                }
            },
            
            'street-fighter-1': {
                name: 'Street Fighter 1',
                type: 'mobile',
                icon: '🥋',
                description: 'Fighting game pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runStreetFighter1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Street Fighter 1 created')
                }
            },
            
            'mortal-kombat-1': {
                name: 'Mortal Kombat 1',
                type: 'mobile',
                icon: '💀',
                description: 'Fighting game pioneer',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMortalKombat1.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mortal Kombat 1 created')
                }
            },
            
            'killer-instinct': {
                name: 'Killer Instinct',
                type: 'mobile',
                icon: '🔪',
                description: 'Combo-based fighting',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runKillerInstinct.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Killer Instinct created')
                }
            },
            
            'battle-toads': {
                name: 'Battletoads',
                type: 'mobile',
                icon: '🐸',
                description: 'Beat em up game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBattletoads.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Battletoads created')
                }
            },
            
            'tmnt': {
                name: 'TMNT',
                type: 'mobile',
                icon: '🐢',
                description: 'Ninja turtles game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTMNT.bind(this),
                lifecycle: {
                    onCreate: () => console.log('TMNT created')
                }
            },
            
            'x-men': {
                name: 'X-Men',
                type: 'mobile',
                icon: '❌',
                description: 'Superhero team game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runXMen.bind(this),
                lifecycle: {
                    onCreate: () => console.log('X-Men created')
                }
            },
            
            'captain-america': {
                name: 'Captain America',
                type: 'mobile',
                icon: '🛡️',
                description: 'Superhero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCaptainAmerica.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Captain America created')
                }
            },
            
            'spiderman-2': {
                name: 'Spiderman 2',
                type: 'mobile',
                icon: '🕷️',
                description: 'Web swinging classic',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSpiderman2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Spiderman 2 created')
                }
            },
            
            'hulk': {
                name: 'Hulk',
                type: 'mobile',
                icon: '💚',
                description: 'Smash game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHulk.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hulk created')
                }
            },
            
            'wolverine': {
                name: 'Wolverine',
                type: 'mobile',
                icon: '🐺',
                description: 'Claw combat game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWolverine.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Wolverine created')
                }
            },
            
            'iron-fist': {
                name: 'Iron Fist',
                type: 'mobile',
                icon: '👊',
                description: 'Martial arts game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runIronFist.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Iron Fist created')
                }
            },
            
            'daredevil': {
                name: 'Daredevil',
                type: 'mobile',
                icon: '👁️',
                description: 'Blind superhero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDaredevil.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Daredevil created')
                }
            },
            
            'black-panther': {
                name: 'Black Panther',
                type: 'mobile',
                icon: '🐆',
                description: 'Superhero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBlackPanther.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Black Panther created')
                }
            },
            
            'doctor-strange': {
                name: 'Doctor Strange',
                type: 'mobile',
                icon: '🔮',
                description: 'Magic game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDoctorStrange.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Doctor Strange created')
                }
            },
            
            'thor-2': {
                name: 'Thor 2',
                type: 'mobile',
                icon: '⚡',
                description: 'Lightning power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runThor2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Thor 2 created')
                }
            },
            
            'captain-marvel': {
                name: 'Captain Marvel',
                type: 'mobile',
                icon: '🌟',
                description: 'Space power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCaptainMarvel.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Captain Marvel created')
                }
            },
            
            'black-widow': {
                name: 'Black Widow',
                type: 'mobile',
                icon: '🕷️',
                description: 'Spy action game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBlackWidow.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Black Widow created')
                }
            },
            
            'hawkeye': {
                name: 'Hawkeye',
                type: 'mobile',
                icon: '🎯',
                description: 'Archery game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHawkeye.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hawkeye created')
                }
            },
            
            'ant-man': {
                name: 'Ant-Man',
                type: 'mobile',
                icon: '🐜',
                description: 'Size changing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAntMan.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ant-Man created')
                }
            },
            
            'wasp': {
                name: 'Wasp',
                type: 'mobile',
                icon: '🐝',
                description: 'Flying hero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWasp.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Wasp created')
                }
            },
            
            'falcon': {
                name: 'Falcon',
                type: 'mobile',
                icon: '🦅',
                description: 'Flying game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFalcon.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Falcon created')
                }
            },
            
            'winter-soldier': {
                name: 'Winter Soldier',
                type: 'mobile',
                icon: '❄️',
                description: 'Combat game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runWinterSoldier.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Winter Soldier created')
                }
            },
            
            'vision': {
                name: 'Vision',
                type: 'mobile',
                icon: '💎',
                description: 'Mind stone game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVision.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Vision created')
                }
            },
            
            'scarlet-witch': {
                name: 'Scarlet Witch',
                type: 'mobile',
                icon: '🔴',
                description: 'Magic power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runScarletWitch.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Scarlet Witch created')
                }
            },
            
            'quicksilver': {
                name: 'Quicksilver',
                type: 'mobile',
                icon: '⚡',
                description: 'Speed power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runQuicksilver.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Quicksilver created')
                }
            },
            
            'mantis': {
                name: 'Mantis',
                type: 'mobile',
                icon: '🦗',
                description: 'Empath game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMantis.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mantis created')
                }
            },
            
            'drax': {
                name: 'Drax',
                type: 'mobile',
                icon: '🗡️',
                description: 'Combat game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDrax.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Drax created')
                }
            },
            
            'groot': {
                name: 'Groot',
                type: 'mobile',
                icon: '🌳',
                description: 'Tree power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGroot.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Groot created')
                }
            },
            
            'rocket-raccoon': {
                name: 'Rocket Raccoon',
                type: 'mobile',
                icon: '🦝',
                description: 'Gadget game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRocketRaccoon.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Rocket Raccoon created')
                }
            },
            
            'star-lord': {
                name: 'Star Lord',
                type: 'mobile',
                icon: '🎧',
                description: 'Space hero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runStarLord.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Star Lord created')
                }
            },
            
            'gamora': {
                name: 'Gamora',
                type: 'mobile',
                icon: '💚',
                description: 'Assassin game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGamora.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Gamora created')
                }
            },
            
            'nebula': {
                name: 'Nebula',
                type: 'mobile',
                icon: '💙',
                description: 'Cyborg game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runNebula.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Nebula created')
                }
            },
            
            'yondu': {
                name: 'Yondu',
                type: 'mobile',
                icon: '🔊',
                description: 'Arrow game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runYondu.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Yondu created')
                }
            },
            
            'korg': {
                name: 'Korg',
                type: 'mobile',
                icon: '🪨',
                description: 'Rock game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runKorg.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Korg created')
                }
            },
            
            'meeko': {
                name: 'Meeko',
                type: 'mobile',
                icon: '🦝',
                description: 'Raccoon game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMeeko.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Meeko created')
                }
            },
            
            'howard-the-duck': {
                name: 'Howard the Duck',
                type: 'mobile',
                icon: '🦆',
                description: 'Duck hero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHowardTheDuck.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Howard the Duck created')
                }
            },
            
            'squirrel-girl': {
                name: 'Squirrel Girl',
                type: 'mobile',
                icon: '🐿️',
                description: 'Squirrel power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSquirrelGirl.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Squirrel Girl created')
                }
            },
            
            'ms-marvel': {
                name: 'Ms. Marvel',
                type: 'mobile',
                icon: '💪',
                description: 'Shape shifting game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMsMarvel.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ms. Marvel created')
                }
            },
            
            'she-hulk': {
                name: 'She-Hulk',
                type: 'mobile',
                icon: '💚',
                description: 'Lawyer hero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSheHulk.bind(this),
                lifecycle: {
                    onCreate: () => console.log('She-Hulk created')
                }
            },
            
            'red-hulk': {
                name: 'Red Hulk',
                type: 'mobile',
                icon: '❤️',
                description: 'Gamma power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runRedHulk.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Red Hulk created')
                }
            },
            
            'a-bomb': {
                name: 'A-Bomb',
                type: 'mobile',
                icon: '💣',
                description: 'Explosive game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runABomb.bind(this),
                lifecycle: {
                    onCreate: () => console.log('A-Bomb created')
                }
            },
            
            'thing': {
                name: 'The Thing',
                type: 'mobile',
                icon: '🧱',
                description: 'Rock hero game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runThing.bind(this),
                lifecycle: {
                    onCreate: () => console.log('The Thing created')
                }
            },
            
            'human-torch': {
                name: 'Human Torch',
                type: 'mobile',
                icon: '🔥',
                description: 'Fire power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHumanTorch.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Human Torch created')
                }
            },
            
            'invisible-woman': {
                name: 'Invisible Woman',
                type: 'mobile',
                icon: '👻',
                description: 'Invisibility game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runInvisibleWoman.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Invisible Woman created')
                }
            },
            
            'mister-fantastic': {
                name: 'Mister Fantastic',
                type: 'mobile',
                icon: '🧍',
                description: 'Stretching game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMisterFantastic.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Mister Fantastic created')
                }
            },
            
            'silver-surfer': {
                name: 'Silver Surfer',
                type: 'mobile',
                icon: '🏄',
                description: 'Cosmic surfing game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSilverSurfer.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Silver Surfer created')
                }
            },
            
            'galactus': {
                name: 'Galactus',
                type: 'mobile',
                icon: '🌌',
                description: 'World eater game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGalactus.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Galactus created')
                }
            },
            
            'doctor-doom': {
                name: 'Doctor Doom',
                type: 'mobile',
                icon: '💀',
                description: 'Villain game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDoctorDoom.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Doctor Doom created')
                }
            },
            
            'magneto': {
                name: 'Magneto',
                type: 'mobile',
                icon: '🧲',
                description: 'Magnetism game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMagneto.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Magneto created')
                }
            },
            
            'apocalypse': {
                name: 'Apocalypse',
                type: 'mobile',
                icon: '💀',
                description: 'Mutant power game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runApocalypse.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Apocalypse created')
                }
            },
            
            'darkseid': {
                name: 'Darkseid',
                type: 'mobile',
                icon: '💀',
                description: 'Dark god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDarkseid.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Darkseid created')
                }
            },
            
            'doomsday': {
                name: 'Doomsday',
                type: 'mobile',
                icon: '💀',
                description: 'Destruction game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runDoomsday.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Doomsday created')
                }
            },
            
            'brainiac': {
                name: 'Brainiac',
                type: 'mobile',
                icon: '🧠',
                description: 'Intellect game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBrainiac.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Brainiac created')
                }
            },
            
            'joker': {
                name: 'Joker',
                type: 'mobile',
                icon: '🃏',
                description: 'Chaos game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runJoker.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Joker created')
                }
            },
            
            'lex-luthor': {
                name: 'Lex Luthor',
                type: 'mobile',
                icon: '💼',
                description: 'Business villain game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runLexLuthor.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Lex Luthor created')
                }
            },
            
            'bizarro': {
                name: 'Bizarro',
                type: 'mobile',
                icon: '🧊',
                description: 'Mirror game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBizarro.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Bizarro created')
                }
            },
            
            'general-zod': {
                name: 'General Zod',
                type: 'mobile',
                icon: '👽',
                description: 'Kryptonian game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runGeneralZod.bind(this),
                lifecycle: {
                    onCreate: () => console.log('General Zod created')
                }
            },
            
            'brainiac-5': {
                name: 'Brainiac 5',
                type: 'mobile',
                icon: '🧠',
                description: 'Future intellect game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBrainiac5.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Brainiac 5 created')
                }
            },
            
            'vandal-savage': {
                name: 'Vandal Savage',
                type: 'mobile',
                icon: '💀',
                description: 'Immortal game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVandalSavage.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Vandal Savage created')
                }
            },
            
            'trigon': {
                name: 'Trigon',
                type: 'mobile',
                icon: '👹',
                description: 'Demon game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTrigon.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Trigon created')
                }
            },
            
            'circe': {
                name: 'Circe',
                type: 'mobile',
                icon: '🧙',
                description: 'Sorceress game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runCirce.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Circe created')
                }
            },
            
            'hades': {
                name: 'Hades',
                type: 'mobile',
                icon: '💀',
                description: 'Underworld game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHades.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hades created')
                }
            },
            
            'zeus': {
                name: 'Zeus',
                type: 'mobile',
                icon: '⚡',
                description: 'God of thunder game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runZeus.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Zeus created')
                }
            },
            
            'poseidon': {
                name: 'Poseidon',
                type: 'mobile',
                icon: '🌊',
                description: 'God of sea game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runPoseidon.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Poseidon created')
                }
            },
            
            'hades-2': {
                name: 'Hades 2',
                type: 'mobile',
                icon: '💀',
                description: 'Underworld sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHades2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hades 2 created')
                }
            },
            
            'kratos': {
                name: 'Kratos',
                type: 'mobile',
                icon: '⚔️',
                description: 'God of war game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runKratos.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Kratos created')
                }
            },
            
            'atreus': {
                name: 'Atreus',
                type: 'mobile',
                icon: '🏹',
                description: 'Son of Kratos game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAtreus.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Atreus created')
                }
            },
            
            'freya': {
                name: 'Freya',
                type: 'mobile',
                icon: '🕊️',
                description: 'Norse goddess game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFreya.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Freya created')
                }
            },
            
            'thor-3': {
                name: 'Thor 3',
                type: 'mobile',
                icon: '⚡',
                description: 'Norse god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runThor3.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Thor 3 created')
                }
            },
            
            'loki': {
                name: 'Loki',
                type: 'mobile',
                icon: '🎭',
                description: 'Trickster game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runLoki.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Loki created')
                }
            },
            
            'odin': {
                name: 'Odin',
                type: 'mobile',
                icon: '👑',
                description: 'Allfather game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runOdin.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Odin created')
                }
            },
            
            'fenrir': {
                name: 'Fenrir',
                type: 'mobile',
                icon: '🐺',
                description: 'Wolf game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFenrir.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Fenrir created')
                }
            },
            
            'jormungandr': {
                name: 'Jormungandr',
                type: 'mobile',
                icon: '🐍',
                description: 'World serpent game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runJormungandr.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Jormungandr created')
                }
            },
            
            'hel': {
                name: 'Hel',
                type: 'mobile',
                icon: '💀',
                description: 'Underworld ruler game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHel.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hel created')
                }
            },
            
            'surtr': {
                name: 'Surtr',
                type: 'mobile',
                icon: '🔥',
                description: 'Fire giant game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSurtr.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Surtr created')
                }
            },
            
            'ymir': {
                name: 'Ymir',
                type: 'mobile',
                icon: '🧊',
                description: 'Ice giant game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runYmir.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ymir created')
                }
            },
            
            'valkyrie': {
                name: 'Valkyrie',
                type: 'mobile',
                icon: '🛡️',
                description: 'Warrior game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runValkyrie.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Valkyrie created')
                }
            },
            
            'heimdall': {
                name: 'Heimdall',
                type: 'mobile',
                icon: '👁️',
                description: 'Guardian game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHeimdall.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Heimdall created')
                }
            },
            
            'tyr': {
                name: 'Tyr',
                type: 'mobile',
                icon: '⚔️',
                description: 'War god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTyr.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tyr created')
                }
            },
            
            'njord': {
                name: 'Njord',
                type: 'mobile',
                icon: '🌊',
                description: 'Sea god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runNjord.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Njord created')
                }
            },
            
            'bragi': {
                name: 'Bragi',
                type: 'mobile',
                icon: '📜',
                description: 'Poet god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBragi.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Bragi created')
                }
            },
            
            'idunn': {
                name: 'Idunn',
                type: 'mobile',
                icon: '🍎',
                description: 'Youth goddess game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runIdunn.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Idunn created')
                }
            },
            
            'sif': {
                name: 'Sif',
                type: 'mobile',
                icon: '🌾',
                description: 'Harvest goddess game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSif.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Sif created')
                }
            },
            
            'skadi': {
                name: 'Skadi',
                type: 'mobile',
                icon: '❄️',
                description: 'Winter goddess game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSkadi.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Skadi created')
                }
            },
            
            'ullr': {
                name: 'Ullr',
                type: 'mobile',
                icon: '🏹',
                description: 'Hunter god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runUllr.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ullr created')
                }
            },
            
            'forseti': {
                name: 'Forseti',
                type: 'mobile',
                icon: '⚖️',
                description: 'Justice god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runForseti.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Forseti created')
                }
            },
            
            'baldr': {
                name: 'Baldr',
                type: 'mobile',
                icon: '✨',
                description: 'Light god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBaldr.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Baldr created')
                }
            },
            
            'hermod': {
                name: 'Hermod',
                type: 'mobile',
                icon: '🏃',
                description: 'Messenger god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHermod.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hermod created')
                }
            },
            
            'vidar': {
                name: 'Vidar',
                type: 'mobile',
                icon: '🦶',
                description: 'Silent god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVidar.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Vidar created')
                }
            },
            
            'vali': {
                name: 'Vali',
                type: 'mobile',
                icon: '🐺',
                description: 'Avenger god game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVali.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Vali created')
                }
            },
            
            'modi': {
                name: 'Modi',
                type: 'mobile',
                icon: '🔨',
                description: 'Thor\'s son game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runModi.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Modi created')
                }
            },
            
            'magni': {
                name: 'Magni',
                type: 'mobile',
                icon: '💪',
                description: 'Thor\'s son game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMagni.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Magni created')
                }
            },
            
            'hela': {
                name: 'Hela',
                type: 'mobile',
                icon: '💀',
                description: 'Death goddess game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHela.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hela created')
                }
            },
            
            'angrboda': {
                name: 'Angrboda',
                type: 'mobile',
                icon: '👹',
                description: 'Giantess game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAngrboda.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Angrboda created')
                }
            },
            
            'fenrir-2': {
                name: 'Fenrir 2',
                type: 'mobile',
                icon: '🐺',
                description: 'Wolf sequel game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFenrir2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Fenrir 2 created')
                }
            },
            
            'jormungandr-2': {
                name: 'Jormungandr 2',
                type: 'mobile',
                icon: '🐍',
                description: 'Serpent sequel game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runJormungandr2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Jormungandr 2 created')
                }
            },
            
            'surtr-2': {
                name: 'Surtr 2',
                type: 'mobile',
                icon: '🔥',
                description: 'Fire giant sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSurtr2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Surtr 2 created')
                }
            },
            
            'ymir-2': {
                name: 'Ymir 2',
                type: 'mobile',
                icon: '🧊',
                description: 'Ice giant sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runYmir2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ymir 2 created')
                }
            },
            
            'loki-2': {
                name: 'Loki 2',
                type: 'mobile',
                icon: '🎭',
                description: 'Trickster sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runLoki2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Loki 2 created')
                }
            },
            
            'thor-4': {
                name: 'Thor 4',
                type: 'mobile',
                icon: '⚡',
                description: 'God of thunder sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runThor4.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Thor 4 created')
                }
            },
            
            'odin-2': {
                name: 'Odin 2',
                type: 'mobile',
                icon: '👑',
                description: 'Allfather sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runOdin2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Odin 2 created')
                }
            },
            
            'freya-2': {
                name: 'Freya 2',
                type: 'mobile',
                icon: '🕊️',
                description: 'Norse goddess sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runFreya2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Freya 2 created')
                }
            },
            
            'kratos-2': {
                name: 'Kratos 2',
                type: 'mobile',
                icon: '⚔️',
                description: 'God of war sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runKratos2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Kratos 2 created')
                }
            },
            
            'atreus-2': {
                name: 'Atreus 2',
                type: 'mobile',
                icon: '🏹',
                description: 'Son sequel game',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAtreus2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Atreus 2 created')
                }
            },
            
            'valkyrie-2': {
                name: 'Valkyrie 2',
                type: 'mobile',
                icon: '🛡️',
                description: 'Warrior sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runValkyrie2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Valkyrie 2 created')
                }
            },
            
            'heimdall-2': {
                name: 'Heimdall 2',
                type: 'mobile',
                icon: '👁️',
                description: 'Guardian sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHeimdall2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Heimdall 2 created')
                }
            },
            
            'tyr-2': {
                name: 'Tyr 2',
                type: 'mobile',
                icon: '⚔️',
                description: 'War god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runTyr2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Tyr 2 created')
                }
            },
            
            'njord-2': {
                name: 'Njord 2',
                type: 'mobile',
                icon: '🌊',
                description: 'Sea god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runNjord2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Njord 2 created')
                }
            },
            
            'bragi-2': {
                name: 'Bragi 2',
                type: 'mobile',
                icon: '📜',
                description: 'Poet god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBragi2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Bragi 2 created')
                }
            },
            
            'idunn-2': {
                name: 'Idunn 2',
                type: 'mobile',
                icon: '🍎',
                description: 'Youth goddess sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runIdunn2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Idunn 2 created')
                }
            },
            
            'sif-2': {
                name: 'Sif 2',
                type: 'mobile',
                icon: '🌾',
                description: 'Harvest goddess sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSif2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Sif 2 created')
                }
            },
            
            'skadi-2': {
                name: 'Skadi 2',
                type: 'mobile',
                icon: '❄️',
                description: 'Winter goddess sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runSkadi2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Skadi 2 created')
                }
            },
            
            'ullr-2': {
                name: 'Ullr 2',
                type: 'mobile',
                icon: '🏹',
                description: 'Hunter god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runUllr2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Ullr 2 created')
                }
            },
            
            'forseti-2': {
                name: 'Forseti 2',
                type: 'mobile',
                icon: '⚖️',
                description: 'Justice god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runForseti2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Forseti 2 created')
                }
            },
            
            'baldr-2': {
                name: 'Baldr 2',
                type: 'mobile',
                icon: '✨',
                description: 'Light god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runBaldr2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Baldr 2 created')
                }
            },
            
            'hermod-2': {
                name: 'Hermod 2',
                type: 'mobile',
                icon: '🏃',
                description: 'Messenger god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHermod2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hermod 2 created')
                }
            },
            
            'vidar-2': {
                name: 'Vidar 2',
                type: 'mobile',
                icon: '🦶',
                description: 'Silent god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVidar2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Vidar 2 created')
                }
            },
            
            'vali-2': {
                name: 'Vali 2',
                type: 'mobile',
                icon: '🐺',
                description: 'Avenger god sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runVali2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Vali 2 created')
                }
            },
            
            'modi-2': {
                name: 'Modi 2',
                type: 'mobile',
                icon: '🔨',
                description: 'Thor\'s son sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runModi2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Modi 2 created')
                }
            },
            
            'magni-2': {
                name: 'Magni 2',
                type: 'mobile',
                icon: '💪',
                description: 'Thor\'s son sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runMagni2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Magni 2 created')
                }
            },
            
            'hela-2': {
                name: 'Hela 2',
                type: 'mobile',
                icon: '💀',
                description: 'Death goddess sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runHela2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Hela 2 created')
                }
            },
            
            'angrboda-2': {
                name: 'Angrboda 2',
                type: 'mobile',
                icon: '👹',
                description: 'Giantess sequel',
                category: 'games',
                version: '2.0.0',
                permissions: ['storage'],
                runner: this.runAngrboda2.bind(this),
                lifecycle: {
                    onCreate: () => console.log('Angrboda 2 created')
                }
            }
        };

        // Register all apps
        for (const [id, app] of Object.entries(enhancedApps)) {
            this.appRegistry.set(id, app);
        }
    }

    setupEventListeners() {
        // Listen for app lifecycle events
        document.addEventListener('app:launch', (e) => {
            const { appId, context } = e.detail;
            this.launchApp(appId, context);
        });

        document.addEventListener('app:close', (e) => {
            const { instanceId } = e.detail;
            this.closeApp(instanceId);
        });

        document.addEventListener('app:minimize', (e) => {
            const { instanceId } = e.detail;
            this.minimizeApp(instanceId);
        });

        document.addEventListener('app:maximize', (e) => {
            const { instanceId } = e.detail;
            this.maximizeApp(instanceId);
        });
    }

    async launchApp(appId, context = {}) {
        const appInfo = this.appRegistry.get(appId) || this.appStore?.appDatabase?.[appId];
        
        if (!appInfo) {
            const error = `App '${appId}' not found`;
            console.error(error);
            this.showNotification(error, 'error');
            return { error };
        }

        // Check if app is installed (for app store apps)
        if (this.appStore && !this.appStore.installedApps.has(appId) && appId !== 'file-manager' && appId !== 'terminal-pro') {
            const installResult = await this.appStore.installApp(appId);
            if (!installResult.success) {
                return installResult;
            }
        }

        // Request permissions
        if (appInfo.permissions && appInfo.permissions.length > 0) {
            const permissionResult = await this.requestAppPermissions(appInfo.permissions);
            if (!permissionResult.success) {
                return { error: 'Permissions denied', details: permissionResult.denied };
            }
        }

        // Create process
        const pid = this.kernel ? this.kernel.fork() : null;
        if (pid && this.kernel) {
            this.kernel.exec(pid, appInfo.name, []);
        }

        // Generate instance ID
        const instanceId = this.appIdCounter++;

        // Create app instance
        const instance = {
            id: instanceId,
            appId: appId,
            pid: pid,
            name: appInfo.name,
            type: appInfo.type,
            icon: appInfo.icon,
            category: appInfo.category,
            version: appInfo.version,
            startTime: Date.now(),
            state: 'running',
            context: context,
            window: null
        };

        // Call lifecycle hook
        if (appInfo.lifecycle && appInfo.lifecycle.onStart) {
            try {
                appInfo.lifecycle.onStart();
            } catch (error) {
                console.error('Lifecycle onStart error:', error);
            }
        }

        // Execute app runner
        try {
            const content = await appInfo.runner(context);
            
            // Create window for desktop apps
            if (appInfo.type === 'desktop') {
                instance.window = this.windowManager.createWindow({
                    title: appInfo.name,
                    icon: appInfo.icon,
                    content: content,
                    instanceId: instanceId,
                    resizable: true,
                    minimizable: true,
                    maximizable: true
                });
            }

            // Store instance
            this.runningApps.set(instanceId, instance);
            this.appInstances.set(instanceId, instance);

            // Show notification
            this.showNotification(`App launched: ${appInfo.name}`, 'success');

            return { success: true, instanceId, pid, content };

        } catch (error) {
            console.error(`App ${appId} execution error:`, error);
            
            if (pid && this.kernel) {
                this.kernel.kill(pid);
            }

            this.showNotification(`Failed to launch ${appInfo.name}: ${error.message}`, 'error');
            return { error: error.message };
        }
    }

    async closeApp(instanceId) {
        const instance = this.appInstances.get(instanceId);
        
        if (!instance) {
            return { error: 'Instance not found' };
        }

        // Get app info for lifecycle hook
        const appInfo = this.appRegistry.get(instance.appId);
        
        // Call lifecycle hook
        if (appInfo && appInfo.lifecycle && appInfo.lifecycle.onStop) {
            try {
                appInfo.lifecycle.onStop();
            } catch (error) {
                console.error('Lifecycle onStop error:', error);
            }
        }

        // Close window
        if (instance.window) {
            this.windowManager.closeWindow(instanceId);
        }

        // Kill process
        if (instance.pid && this.kernel) {
            this.kernel.kill(instance.pid);
        }

        // Remove from tracking
        this.runningApps.delete(instanceId);
        this.appInstances.delete(instanceId);

        // Call destroy lifecycle
        if (appInfo && appInfo.lifecycle && appInfo.lifecycle.onDestroy) {
            try {
                appInfo.lifecycle.onDestroy();
            } catch (error) {
                console.error('Lifecycle onDestroy error:', error);
            }
        }

        this.showNotification(`App closed: ${instance.name}`, 'info');
        return { success: true };
    }

    minimizeApp(instanceId) {
        const instance = this.appInstances.get(instanceId);
        if (instance && instance.window) {
            this.windowManager.minimizeWindow(instanceId);
            return { success: true };
        }
        return { error: 'Instance not found' };
    }

    maximizeApp(instanceId) {
        const instance = this.appInstances.get(instanceId);
        if (instance && instance.window) {
            this.windowManager.maximizeWindow(instanceId);
            return { success: true };
        }
        return { error: 'Instance not found' };
    }

    async requestAppPermissions(permissions) {
        const granted = [];
        const denied = [];

        for (const permission of permissions) {
            if (this.platform) {
                const result = await this.platform.requestPermission(permission);
                if (result.success && result.result.granted) {
                    granted.push(permission);
                } else {
                    denied.push(permission);
                }
            } else {
                // Fallback: auto-grant if no platform API
                granted.push(permission);
            }
        }

        return {
            success: denied.length === 0,
            granted,
            denied
        };
    }

    getRunningApps() {
        return Array.from(this.appInstances.values());
    }

    getAppInfo(appId) {
        return this.appRegistry.get(appId) || this.appStore?.appDatabase?.[appId];
    }

    searchApps(query, category = null, type = null) {
        let apps = Array.from(this.appRegistry.values());

        if (this.appStore) {
            apps = apps.concat(this.appStore.getAvailableApps());
        }

        // Remove duplicates
        const uniqueApps = Array.from(new Map(apps.map(app => [app.id, app])).values());

        if (query) {
            const lowerQuery = query.toLowerCase();
            return uniqueApps.filter(app => 
                app.name.toLowerCase().includes(lowerQuery) ||
                app.description.toLowerCase().includes(lowerQuery) ||
                (app.category && app.category.toLowerCase().includes(lowerQuery))
            );
        }

        if (category) {
            return uniqueApps.filter(app => app.category === category);
        }

        if (type) {
            return uniqueApps.filter(app => app.type === type);
        }

        return uniqueApps;
    }

    showNotification(message, type = 'info') {
        // Use existing notification system or console
        if (window.hazoomUI && window.hazoomUI.showNotification) {
            window.hazoomUI.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Fallback: create browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Hazoom OS', { body: message, icon: '🖥️' });
            }
        }
    }

    // Enhanced App Runner Methods
    async runFileManager(context) {
        const path = context.path || '/home/hazem';
        const fs = this.fileSystem || window.hazoomFS;
        
        if (!fs) {
            return '<div class="error">File system not available</div>';
        }

        const result = fs.ls(path, { all: true });
        
        if (result.error) {
            return `<div class="error">${result.error}</div>`;
        }

        // Build enhanced UI
        const files = result.files;
        let fileGridHTML = '';

        files.forEach(file => {
            const isDirectory = file.type === 'directory';
            const icon = isDirectory ? '📁' : '📄';
            const ext = file.name.split('.').pop().toLowerCase();
            
            let fileClass = 'file-item';
            if (isDirectory) fileClass += ' folder';
            else if (ext === 'txt') fileClass += ' text-file';
            else if (['js', 'html', 'css', 'json'].includes(ext)) fileClass += ' code-file';
            else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) fileClass += ' image-file';
            else if (['mp3', 'wav', 'ogg'].includes(ext)) fileClass += ' audio-file';
            else if (['mp4', 'webm', 'avi'].includes(ext)) fileClass += ' video-file';
            else if (['pdf', 'doc', 'docx'].includes(ext)) fileClass += ' doc-file';

            fileGridHTML += `
                <div class="${fileClass}" data-type="${file.type}" data-name="${file.name}" data-path="${path}/${file.name}">
                    <div class="file-icon">${icon}</div>
                    <div class="file-name">${file.name}</div>
                    ${!isDirectory ? `<div class="file-size">${this.formatFileSize(file.size)}</div>` : ''}
                </div>
            `;
        });

        // Sidebar locations
        const locations = [
            { path: '/home/hazem', icon: '🏠', name: 'Home' },
            { path: '/home/hazem/Documents', icon: '📄', name: 'Documents' },
            { path: '/home/hazem/Desktop', icon: '🖥️', name: 'Desktop' },
            { path: '/home/hazem/Downloads', icon: '⬇️', name: 'Downloads' },
            { path: '/home/hazem/Pictures', icon: '🖼️', name: 'Pictures' },
            { path: '/home/hazem/Music', icon: '🎵', name: 'Music' },
            { path: '/home/hazem/Videos', icon: '🎬', name: 'Videos' },
            { path: '/home/hazem/Projects', icon: '📁', name: 'Projects' }
        ];

        const sidebarHTML = locations.map(loc => {
            const isActive = path === loc.path;
            return `
                <div class="sidebar-item ${isActive ? 'active' : ''}" data-path="${loc.path}">
                    <span class="sidebar-icon">${loc.icon}</span>
                    <span class="sidebar-name">${loc.name}</span>
                </div>
            `;
        }).join('');

        // Breadcrumbs
        const pathParts = path.split('/').filter(p => p);
        const breadcrumbs = ['/', ...pathParts].map((part, index) => {
            const breadcrumbPath = index === 0 ? '/' : '/' + pathParts.slice(0, index).join('/');
            const display = index === 0 ? 'Root' : part;
            return `<span class="breadcrumb" data-path="${breadcrumbPath}">${display}</span>`;
        }).join(' > ');

        return `
            <div class="app-content file-manager-pro" data-current-path="${path}">
                <div class="file-manager-layout">
                    <div class="file-manager-sidebar">
                        <div class="sidebar-header">
                            <span>📍 Locations</span>
                        </div>
                        <div class="sidebar-locations">
                            ${sidebarHTML}
                        </div>
                    </div>
                    <div class="file-manager-main">
                        <div class="file-manager-toolbar">
                            <button class="toolbar-btn" data-action="back">← Back</button>
                            <button class="toolbar-btn" data-action="up">↑ Up</button>
                            <button class="toolbar-btn" data-action="refresh">🔄 Refresh</button>
                            <button class="toolbar-btn" data-action="new-folder">📁 New Folder</button>
                            <button class="toolbar-btn" data-action="new-file">📄 New File</button>
                            <div class="address-bar">${breadcrumbs}</div>
                        </div>
                        <div class="file-manager-content">
                            <div class="file-grid">
                                ${fileGridHTML || '<div class="empty-folder">This folder is empty</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async runTerminalPro(context) {
        return `
            <div class="app-content terminal-pro">
                <div class="terminal-header">
                    <div class="terminal-tabs">
                        <div class="tab active">Terminal 1</div>
                        <div class="tab">Terminal 2</div>
                        <div class="tab">Terminal 3</div>
                        <button class="new-tab">+</button>
                    </div>
                    <div class="terminal-controls">
                        <button class="terminal-btn" data-action="split">Split</button>
                        <button class="terminal-btn" data-action="fullscreen">⛶</button>
                    </div>
                </div>
                <div class="terminal-body">
                    <div class="terminal-output">
                        <div class="welcome-message">
                            <div class="logo-text">🖥️ Terminal Pro</div>
                            <div class="version-info">Advanced Terminal v2.0.0</div>
                            <div class="system-info">Hazoom OS Terminal with tabs and split view</div>
                            <div class="command-hint">Type 'help' for available commands</div>
                        </div>
                    </div>
                    <div class="terminal-input-line">
                        <span class="prompt">hazem@hazoom:~$</span>
                        <input type="text" class="terminal-input" placeholder="Enter command..." />
                    </div>
                </div>
            </div>
        `;
    }

    async runCodeEditorPro(context) {
        const filePath = context.filePath || '/home/hazem/untitled.js';
        const fileContent = context.fileContent || '// Start coding here...\n\nfunction main() {\n    console.log("Hello, Hazoom!");\n}\n\nmain();';
        
        return `
            <div class="app-content code-editor-pro" data-file-path="${filePath}">
                <div class="editor-toolbar">
                    <button class="editor-btn" data-action="new">New</button>
                    <button class="editor-btn" data-action="open">Open</button>
                    <button class="editor-btn" data-action="save">Save</button>
                    <button class="editor-btn" data-action="save-as">Save As</button>
                    <button class="editor-btn" data-action="run">▶ Run</button>
                    <button class="editor-btn" data-action="format">Format</button>
                    <span class="file-name">${filePath.split('/').pop()}</span>
                </div>
                <div class="editor-container">
                    <div class="editor-line-numbers"></div>
                    <textarea class="code-editor" spellcheck="false">${fileContent}</textarea>
                    <div class="editor-output"></div>
                </div>
                <div class="editor-status">Ready | JavaScript | UTF-8</div>
            </div>
        `;
    }

    async runWebBrowserPro(context) {
        const url = context.url || 'https://example.com';
        
        return `
            <div class="app-content browser-pro" data-current-url="${url}">
                <div class="browser-toolbar">
                    <button class="browser-btn" data-action="back">←</button>
                    <button class="browser-btn" data-action="forward">→</button>
                    <button class="browser-btn" data-action="refresh">↻</button>
                    <input type="text" class="browser-url" value="${url}" placeholder="Enter URL..." />
                    <button class="browser-btn" data-action="go">Go</button>
                    <button class="browser-btn" data-action="new-tab">+ Tab</button>
                </div>
                <div class="browser-tabs">
                    <div class="tab active">Tab 1</div>
                    <div class="tab">+ New</div>
                </div>
                <div class="browser-content">
                    <div class="browser-page">
                        <h1>🌐 Web Browser Pro</h1>
                        <p>Advanced web browser with tab support</p>
                        <p><strong>Features:</strong></p>
                        <ul>
                            <li>Multiple tabs</li>
                            <li>URL navigation</li>
                            <li>Back/Forward navigation</li>
                            <li>Page refresh</li>
                        </ul>
                        <p>This is a demonstration browser. Full web browsing requires external API integration.</p>
                    </div>
                </div>
            </div>
        `;
    }

    async runMediaPlayerPro(context) {
        return `
            <div class="app-content media-player-pro">
                <div class="media-layout">
                    <div class="media-visualizer">
                        <div class="visualizer-display">
                            <div class="album-art">🎵</div>
                            <div class="visualizer-bars">
                                ${Array.from({length: 32}, (_, i) => `<div class="bar" style="height: ${Math.random() * 100}%"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="media-info">
                        <h3>No Media Playing</h3>
                        <p>Select a file to start playback</p>
                        <div class="media-meta">
                            <span>Duration: 0:00</span>
                            <span>Format: --</span>
                            <span>Quality: --</span>
                        </div>
                    </div>
                    <div class="media-controls">
                        <button class="media-btn" data-action="prev">⏮</button>
                        <button class="media-btn" data-action="play">▶</button>
                        <button class="media-btn" data-action="pause">⏸</button>
                        <button class="media-btn" data-action="next">⏭</button>
                        <button class="media-btn" data-action="stop">⏹</button>
                    </div>
                    <div class="media-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="time">0:00 / 0:00</span>
                    </div>
                    <div class="media-volume">
                        <span>🔊</span>
                        <input type="range" min="0" max="100" value="70" />
                    </div>
                    <div class="media-playlist">
                        <h4>Playlist</h4>
                        <div class="playlist-items">
                            <div class="playlist-item">🎵 Track 1</div>
                            <div class="playlist-item">🎵 Track 2</div>
                            <div class="playlist-item">🎵 Track 3</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async runTextEditorPro(context) {
        const filePath = context.filePath || '/home/hazem/untitled.txt';
        const fileContent = context.fileContent || '';
        
        return `
            <div class="app-content text-editor-pro" data-file-path="${filePath}">
                <div class="editor-toolbar">
                    <button class="editor-btn" data-action="new">New</button>
                    <button class="editor-btn" data-action="open">Open</button>
                    <button class="editor-btn" data-action="save">Save</button>
                    <button class="editor-btn" data-action="save-as">Save As</button>
                    <div class="formatting-tools">
                        <button class="format-btn" data-action="bold"><strong>B</strong></button>
                        <button class="format-btn" data-action="italic"><em>I</em></button>
                        <button class="format-btn" data-action="underline"><u>U</u></button>
                        <button class="format-btn" data-action="list">• List</button>
                    </div>
                    <span class="file-name">${filePath.split('/').pop()}</span>
                </div>
                <textarea class="rich-editor" placeholder="Start typing...">${fileContent}</textarea>
                <div class="editor-status">Ready | Plain Text | UTF-8</div>
            </div>
        `;
    }

    async runCalculatorPro(context) {
        return `
            <div class="app-content calculator-pro">
                <div class="calculator-display">
                    <div class="calc-history"></div>
                    <div class="calc-main">0</div>
                </div>
                <div class="calculator-buttons">
                    <div class="calc-row">
                        <button class="calc-btn func" data-value="C">C</button>
                        <button class="calc-btn func" data-value="±">±</button>
                        <button class="calc-btn func" data-value="%">%</button>
                        <button class="calc-btn op" data-value="/">÷</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="7">7</button>
                        <button class="calc-btn" data-value="8">8</button>
                        <button class="calc-btn" data-value="9">9</button>
                        <button class="calc-btn op" data-value="*">×</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="4">4</button>
                        <button class="calc-btn" data-value="5">5</button>
                        <button class="calc-btn" data-value="6">6</button>
                        <button class="calc-btn op" data-value="-">−</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="1">1</button>
                        <button class="calc-btn" data-value="2">2</button>
                        <button class="calc-btn" data-value="3">3</button>
                        <button class="calc-btn op" data-value="+">+</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="0" style="grid-column: span 2;">0</button>
                        <button class="calc-btn" data-value=".">.</button>
                        <button class="calc-btn equals" data-value="=">=</button>
                    </div>
                </div>
                <div class="calc-modes">
                    <button class="mode-btn active" data-mode="basic">Basic</button>
                    <button class="mode-btn" data-mode="scientific">Scientific</button>
                    <button class="mode-btn" data-mode="programmer">Programmer</button>
                </div>
            </div>
        `;
    }

    async runImageViewer(context) {
        return `
            <div class="app-content image-viewer">
                <div class="image-toolbar">
                    <button class="image-btn" data-action="open">Open</button>
                    <button class="image-btn" data-action="zoom-in">Zoom +</button>
                    <button class="image-btn" data-action="zoom-out">Zoom -</button>
                    <button class="image-btn" data-action="rotate">Rotate</button>
                    <button class="image-btn" data-action="flip">Flip</button>
                    <button class="image-btn" data-action="crop">Crop</button>
                </div>
                <div class="image-canvas">
                    <div class="image-placeholder">
                        <div style="font-size: 80px;">🖼️</div>
                        <p>Open an image to view</p>
                        <p>Supports: JPG, PNG, GIF, BMP, SVG</p>
                    </div>
                </div>
                <div class="image-info">
                    <span>Size: --</span>
                    <span>Format: --</span>
                    <span>Zoom: 100%</span>
                </div>
            </div>
        `;
    }

    async runPDFReader(context) {
        return `
            <div class="app-content pdf-reader">
                <div class="pdf-toolbar">
                    <button class="pdf-btn" data-action="open">Open PDF</button>
                    <button class="pdf-btn" data-action="prev">← Prev</button>
                    <span class="page-info">Page 1 of 1</span>
                    <button class="pdf-btn" data-action="next">Next →</button>
                    <button class="pdf-btn" data-action="zoom-in">Zoom +</button>
                    <button class="pdf-btn" data-action="zoom-out">Zoom -</button>
                    <button class="pdf-btn" data-action="fullscreen">⛶</button>
                </div>
                <div class="pdf-viewer">
                    <div class="pdf-page">
                        <div class="pdf-placeholder">
                            <div style="font-size: 80px;">📕</div>
                            <p>PDF Reader</p>
                            <p>Open a PDF document to view</p>
                        </div>
                    </div>
                </div>
                <div class="pdf-status">Ready | PDF Viewer v2.0</div>
            </div>
        `;
    }

    async runNoteTaking(context) {
        const filePath = context.filePath || '/home/hazem/notes/note.txt';
        const fileContent = context.fileContent || '';
        
        return `
            <div class="app-content note-taking" data-file-path="${filePath}">
                <div class="note-toolbar">
                    <button class="note-btn" data-action="new">New Note</button>
                    <button class="note-btn" data-action="open">Open</button>
                    <button class="note-btn" data-action="save">Save</button>
                    <button class="note-btn" data-action="save-as">Save As</button>
                    <button class="note-btn" data-action="attach">📎 Attach</button>
                    <button class="note-btn" data-action="record">🎤 Voice</button>
                    <button class="note-btn" data-action="camera">📷 Photo</button>
                </div>
                <div class="note-container">
                    <input type="text" class="note-title" placeholder="Note title..." />
                    <textarea class="note-content" placeholder="Start taking notes...">${fileContent}</textarea>
                </div>
                <div class="note-tags">
                    <input type="text" class="tag-input" placeholder="Add tags..." />
                    <div class="tag-list"></div>
                </div>
                <div class="note-status">Ready | Rich Notes</div>
            </div>
        `;
    }

    // Mobile Apps
    async runPhonePro(context) {
        return `
            <div class="app-content phone-pro">
                <div class="phone-header">
                    <div class="signal">📶</div>
                    <div class="battery">🔋</div>
                </div>
                <div class="phone-dialer">
                    <input type="text" class="phone-number" placeholder="Enter number..." readonly />
                    <div class="keypad">
                        ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => 
                            `<button class="key" data-value="${n}">${n}</button>`
                        ).join('')}
                    </div>
                    <div class="phone-actions">
                        <button class="call-btn">📞 Call</button>
                        <button class="clear-btn">Clear</button>
                    </div>
                </div>
                <div class="phone-history">
                    <h4>Recent Calls</h4>
                    <div class="call-list">
                        <div class="call-item">📞 +1-555-0123 <span class="time">2:34 PM</span></div>
                        <div class="call-item">📞 +1-555-0456 <span class="time">1:15 PM</span></div>
                        <div class="call-item">📞 +1-555-0789 <span class="time">10:42 AM</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    async runMessagesPro(context) {
        return `
            <div class="app-content messages-pro">
                <div class="messages-layout">
                    <div class="conversations-list">
                        <div class="conversation active">
                            <div class="avatar">JD</div>
                            <div class="info">
                                <div class="name">John Doe</div>
                                <div class="preview">Hey, how are you?</div>
                            </div>
                            <div class="time">2:34 PM</div>
                        </div>
                        <div class="conversation">
                            <div class="avatar">JS</div>
                            <div class="info">
                                <div class="name">Jane Smith</div>
                                <div class="preview">Meeting at 3 PM tomorrow</div>
                            </div>
                            <div class="time">1:15 PM</div>
                        </div>
                        <div class="conversation">
                            <div class="avatar">MB</div>
                            <div class="info">
                                <div class="name">Mike Brown</div>
                                <div class="preview">Thanks for the help!</div>
                            </div>
                            <div class="time">10:42 AM</div>
                        </div>
                    </div>
                    <div class="chat-area">
                        <div class="chat-header">
                            <div class="chat-name">John Doe</div>
                            <div class="chat-actions">
                                <button class="chat-btn">📞</button>
                                <button class="chat-btn">📹</button>
                                <button class="chat-btn">ℹ️</button>
                            </div>
                        </div>
                        <div class="chat-messages">
                            <div class="message received">
                                <div class="bubble">Hey, how are you doing?</div>
                                <div class="timestamp">2:30 PM</div>
                            </div>
                            <div class="message sent">
                                <div class="bubble">I'm doing great! How about you?</div>
                                <div class="timestamp">2:32 PM</div>
                            </div>
                            <div class="message received">
                                <div class="bubble">Pretty good. Want to grab lunch?</div>
                                <div class="timestamp">2:34 PM</div>
                            </div>
                        </div>
                        <div class="chat-input">
                            <input type="text" placeholder="Type a message..." />
                            <button class="send-btn">Send</button>
                            <button class="attach-btn">📎</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async runCameraPro(context) {
        return `
            <div class="app-content camera-pro">
                <div class="camera-viewfinder">
                    <div class="camera-placeholder">
                        <div style="font-size: 100px;">📷</div>
                        <p>Camera Pro</p>
                        <p>Click to take photo</p>
                    </div>
                </div>
                <div class="camera-controls">
                    <button class="camera-btn capture">📸 Capture</button>
                    <button class="camera-btn switch">🔄 Switch</button>
                    <button class="camera-btn flash">⚡ Flash</button>
                    <button class="camera-btn timer">⏱️ Timer</button>
                </div>
                <div class="camera-settings">
                    <div class="setting">
                        <label>Resolution</label>
                        <select>
                            <option>4K (3840x2160)</option>
                            <option>1080p (1920x1080)</option>
                            <option>720p (1280x720)</option>
                        </select>
                    </div>
                    <div class="setting">
                        <label>Mode</label>
                        <select>
                            <option>Photo</option>
                            <option>Video</option>
                            <option>Panorama</option>
                            <option>Portrait</option>
                        </select>
                    </div>
                </div>
                <div class="camera-gallery">
                    <h4>Recent Photos</h4>
                    <div class="photo-grid">
                        <div class="photo-item">🖼️</div>
                        <div class="photo-item">🖼️</div>
                        <div class="photo-item">🖼️</div>
                        <div class="photo-item">🖼️</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runMapsPro(context) {
        return `
            <div class="app-content maps-pro">
                <div class="maps-header">
                    <input type="text" class="search-location" placeholder="Search for places..." />
                    <button class="maps-btn">🔍</button>
                    <button class="maps-btn">📍</button>
                    <button class="maps-btn">🗺️</button>
                </div>
                <div class="maps-view">
                    <div class="map-placeholder">
                        <div style="font-size: 80px;">🗺️</div>
                        <p>Interactive Maps</p>
                        <p>Search and navigate</p>
                    </div>
                </div>
                <div class="maps-sidebar">
                    <h4>Recent Locations</h4>
                    <div class="location-list">
                        <div class="location-item">📍 Home</div>
                        <div class="location-item">📍 Work</div>
                        <div class="location-item">📍 Gym</div>
                        <div class="location-item">📍 Grocery Store</div>
                    </div>
                </div>
                <div class="maps-controls">
                    <button class="maps-btn">🚗 Directions</button>
                    <button class="maps-btn">🏪 Nearby</button>
                    <button class="maps-btn">⭐ Saved</button>
                </div>
            </div>
        `;
    }

    async runWeatherProMobile(context) {
        return `
            <div class="app-content weather-pro-mobile">
                <div class="weather-current">
                    <div class="weather-main">
                        <div class="temp">28°C</div>
                        <div class="condition">☀️ Sunny</div>
                        <div class="location">Lagos, Nigeria</div>
                    </div>
                    <div class="weather-details">
                        <div class="detail">💧 Humidity: 75%</div>
                        <div class="detail">💨 Wind: 12 km/h</div>
                        <div class="detail">🌡️ Feels Like: 30°C</div>
                        <div class="detail">👁️ Visibility: 10 km</div>
                    </div>
                </div>
                <div class="weather-forecast">
                    <h4>5-Day Forecast</h4>
                    <div class="forecast-list">
                        <div class="forecast-item">
                            <span>Mon</span>
                            <span>☀️</span>
                            <span>28°/22°</span>
                        </div>
                        <div class="forecast-item">
                            <span>Tue</span>
                            <span>⛅</span>
                            <span>27°/21°</span>
                        </div>
                        <div class="forecast-item">
                            <span>Wed</span>
                            <span>🌧️</span>
                            <span>25°/20°</span>
                        </div>
                        <div class="forecast-item">
                            <span>Thu</span>
                            <span>⛈️</span>
                            <span>24°/19°</span>
                        </div>
                        <div class="forecast-item">
                            <span>Fri</span>
                            <span>☀️</span>
                            <span>29°/23°</span>
                        </div>
                    </div>
                </div>
                <div class="weather-alerts">
                    <h4>Alerts</h4>
                    <div class="alert-list">
                        <div class="alert">⚠️ High UV Index today</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runMusicPro(context) {
        return `
            <div class="app-content music-pro">
                <div class="music-layout">
                    <div class="music-visualizer">
                        <div class="now-playing">
                            <div class="album-art">🎵</div>
                            <div class="track-info">
                                <div class="title">No Track Playing</div>
                                <div class="artist">Select music to play</div>
                            </div>
                        </div>
                        <div class="equalizer">
                            ${Array.from({length: 24}, (_, i) => `<div class="eq-bar" style="height: ${Math.random() * 100}%"></div>`).join('')}
                        </div>
                    </div>
                    <div class="music-controls">
                        <div class="control-buttons">
                            <button class="music-btn">⏮</button>
                            <button class="music-btn play">▶</button>
                            <button class="music-btn">⏭</button>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="time-display">0:00 / 0:00</div>
                        <div class="volume-control">
                            <span>🔊</span>
                            <input type="range" min="0" max="100" value="70" />
                        </div>
                    </div>
                    <div class="music-library">
                        <h4>Library</h4>
                        <div class="library-tabs">
                            <button class="tab active">Songs</button>
                            <button class="tab">Artists</button>
                            <button class="tab">Albums</button>
                            <button class="tab">Playlists</button>
                        </div>
                        <div class="library-list">
                            <div class="library-item">🎵 Song 1 - Artist 1</div>
                            <div class="library-item">🎵 Song 2 - Artist 2</div>
                            <div class="library-item">🎵 Song 3 - Artist 3</div>
                            <div class="library-item">🎵 Song 4 - Artist 4</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async runCalculatorProMobile(context) {
        return `
            <div class="app-content calculator-pro-mobile">
                <div class="calculator-display">
                    <div class="calc-history"></div>
                    <div class="calc-main">0</div>
                </div>
                <div class="calculator-buttons">
                    <div class="calc-row">
                        <button class="calc-btn func" data-value="C">C</button>
                        <button class="calc-btn func" data-value="±">±</button>
                        <button class="calc-btn func" data-value="%">%</button>
                        <button class="calc-btn op" data-value="/">÷</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="7">7</button>
                        <button class="calc-btn" data-value="8">8</button>
                        <button class="calc-btn" data-value="9">9</button>
                        <button class="calc-btn op" data-value="*">×</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="4">4</button>
                        <button class="calc-btn" data-value="5">5</button>
                        <button class="calc-btn" data-value="6">6</button>
                        <button class="calc-btn op" data-value="-">−</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="1">1</button>
                        <button class="calc-btn" data-value="2">2</button>
                        <button class="calc-btn" data-value="3">3</button>
                        <button class="calc-btn op" data-value="+">+</button>
                    </div>
                    <div class="calc-row">
                        <button class="calc-btn" data-value="0" style="grid-column: span 2;">0</button>
                        <button class="calc-btn" data-value=".">.</button>
                        <button class="calc-btn equals" data-value="=">=</button>
                    </div>
                </div>
                <div class="calc-history-list">
                    <h4>History</h4>
                    <div class="history-items">
                        <div class="history-item">2 + 2 = 4</div>
                        <div class="history-item">15 × 3 = 45</div>
                        <div class="history-item">100 ÷ 4 = 25</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runSettingsPro(context) {
        return `
            <div class="app-content settings-pro">
                <div class="settings-layout">
                    <div class="settings-sidebar">
                        <div class="settings-section active">General</div>
                        <div class="settings-section">Display</div>
                        <div class="settings-section">Sound</div>
                        <div class="settings-section">Notifications</div>
                        <div class="settings-section">Privacy</div>
                        <div class="settings-section">Security</div>
                        <div class="settings-section">Network</div>
                        <div class="settings-section">Apps</div>
                        <div class="settings-section">Accounts</div>
                        <div class="settings-section">Storage</div>
                        <div class="settings-section">Battery</div>
                        <div class="settings-section">About</div>
                    </div>
                    <div class="settings-main">
                        <h2>General Settings</h2>
                        <div class="setting-group">
                            <div class="setting-item">
                                <label>Language</label>
                                <select>
                                    <option>English (US)</option>
                                    <option>English (UK)</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>German</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <label>Time Zone</label>
                                <select>
                                    <option>UTC+1 (West Africa Time)</option>
                                    <option>UTC (GMT)</option>
                                    <option>UTC-5 (EST)</option>
                                    <option>UTC+8 (China)</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <label>Date Format</label>
                                <select>
                                    <option>MM/DD/YYYY</option>
                                    <option>DD/MM/YYYY</option>
                                    <option>YYYY-MM-DD</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <label>Dark Mode</label>
                                <input type="checkbox" checked />
                            </div>
                            <div class="setting-item">
                                <label>Auto-rotate</label>
                                <input type="checkbox" />
                            </div>
                            <div class="setting-item">
                                <label>Lock Screen Timeout</label>
                                <select>
                                    <option>1 minute</option>
                                    <option selected>5 minutes</option>
                                    <option>10 minutes</option>
                                    <option>30 minutes</option>
                                    <option>Never</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async runGallery(context) {
        return `
            <div class="app-content gallery">
                <div class="gallery-toolbar">
                    <button class="gallery-btn" data-action="import">Import</button>
                    <button class="gallery-btn" data-action="create-album">New Album</button>
                    <button class="gallery-btn" data-action="select">Select</button>
                    <button class="gallery-btn" data-action="share">Share</button>
                    <button class="gallery-btn" data-action="delete">Delete</button>
                </div>
                <div class="gallery-grid">
                    <div class="gallery-item">🖼️</div>
                    <div class="gallery-item">🖼️</div>
                    <div class="gallery-item">🖼️</div>
                    <div class="gallery-item">🖼️</div>
                    <div class="gallery-item">🖼️</div>
                    <div class="gallery-item">🖼️</div>
                    <div class="gallery-item">🖼️</div>
                    <div class="gallery-item">🖼️</div>
                </div>
                <div class="gallery-albums">
                    <h4>Albums</h4>
                    <div class="album-list">
                        <div class="album-item">📸 Camera Roll (24)</div>
                        <div class="album-item">🖼️ Screenshots (12)</div>
                        <div class="album-item">🎬 Videos (8)</div>
                        <div class="album-item">⭐ Favorites (5)</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runContacts(context) {
        return `
            <div class="app-content contacts">
                <div class="contacts-layout">
                    <div class="contacts-sidebar">
                        <input type="text" class="search-contacts" placeholder="Search contacts..." />
                        <div class="contact-list">
                            <div class="contact-item">
                                <div class="avatar">JD</div>
                                <div class="info">
                                    <div class="name">John Doe</div>
                                    <div class="number">+1-555-0123</div>
                                </div>
                            </div>
                            <div class="contact-item">
                                <div class="avatar">JS</div>
                                <div class="info">
                                    <div class="name">Jane Smith</div>
                                    <div class="number">+1-555-0456</div>
                                </div>
                            </div>
                            <div class="contact-item">
                                <div class="avatar">MB</div>
                                <div class="info">
                                    <div class="name">Mike Brown</div>
                                    <div class="number">+1-555-0789</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="contact-detail">
                        <div class="detail-placeholder">
                            <div style="font-size: 80px;">👥</div>
                            <p>Select a contact to view details</p>
                        </div>
                    </div>
                </div>
                <div class="contacts-actions">
                    <button class="contact-btn">➕ New Contact</button>
                    <button class="contact-btn">📤 Import</button>
                    <button class="contact-btn">💾 Export</button>
                </div>
            </div>
        `;
    }

    async runCalendarPro(context) {
        return `
            <div class="app-content calendar-pro">
                <div class="calendar-header">
                    <button class="cal-btn">←</button>
                    <h3>December 2025</h3>
                    <button class="cal-btn">→</button>
                    <button class="cal-btn">Today</button>
                    <button class="cal-btn">➕ New Event</button>
                </div>
                <div class="calendar-grid">
                    ${Array.from({length: 30}, (_, i) => 
                        `<div class="cal-day ${i === 18 ? 'today' : ''} ${i === 14 ? 'event' : ''} ${i === 22 ? 'event' : ''}">
                            <span class="day-num">${i + 1}</span>
                            ${i === 14 ? '<span class="event-dot"></span>' : ''}
                            ${i === 22 ? '<span class="event-dot"></span>' : ''}
                        </div>`
                    ).join('')}
                </div>
                <div class="calendar-events">
                    <h4>Upcoming Events</h4>
                    <div class="event-list">
                        <div class="event-item">📅 Dec 15 - Team Meeting</div>
                        <div class="event-item">📅 Dec 23 - Project Deadline</div>
                        <div class="event-item">📅 Dec 25 - Holiday</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runAlarmClock(context) {
        return `
            <div class="app-content alarm-clock">
                <div class="clock-display">
                    <div class="current-time">12:00</div>
                    <div class="current-date">Dec 19, 2025</div>
                </div>
                <div class="alarm-list">
                    <h4>Alarms</h4>
                    <div class="alarm-item">
                        <div class="time">07:00 AM</div>
                        <div class="days">Weekdays</div>
                        <div class="toggle"><input type="checkbox" checked /></div>
                    </div>
                    <div class="alarm-item">
                        <div class="time">08:30 AM</div>
                        <div class="days">Weekends</div>
                        <div class="toggle"><input type="checkbox" /></div>
                    </div>
                    <div class="alarm-item">
                        <div class="time">10:00 PM</div>
                        <div class="days">Daily</div>
                        <div class="toggle"><input type="checkbox" checked /></div>
                    </div>
                </div>
                <div class="alarm-actions">
                    <button class="alarm-btn">➕ Add Alarm</button>
                    <button class="alarm-btn">⏱️ Timer</button>
                    <button class="alarm-btn">⏳ Stopwatch</button>
                </div>
            </div>
        `;
    }

    async runNotesMobile(context) {
        return `
            <div class="app-content notes-mobile">
                <div class="notes-toolbar">
                    <button class="note-btn">➕ New</button>
                    <button class="note-btn">📁 Folders</button>
                    <button class="note-btn">🔍 Search</button>
                    <button class="note-btn">⋮ More</button>
                </div>
                <div class="notes-list">
                    <div class="note-item">
                        <div class="note-title">Shopping List</div>
                        <div class="note-preview">Milk, Eggs, Bread, Butter...</div>
                        <div class="note-date">2 hours ago</div>
                    </div>
                    <div class="note-item">
                        <div class="note-title">Meeting Notes</div>
                        <div class="note-preview">Discuss Q4 goals and...</div>
                        <div class="note-date">Yesterday</div>
                    </div>
                    <div class="note-item">
                        <div class="note-title">Ideas</div>
                        <div class="note-preview">New project concept...</div>
                        <div class="note-date">Dec 17</div>
                    </div>
                </div>
                <div class="notes-input">
                    <input type="text" placeholder="Quick note..." />
                    <button class="add-btn">Add</button>
                </div>
            </div>
        `;
    }

    async runTasksMobile(context) {
        return `
            <div class="app-content tasks-mobile">
                <div class="tasks-toolbar">
                    <button class="task-btn">➕ New Task</button>
                    <button class="task-btn">📋 Projects</button>
                    <button class="task-btn">🔍 Search</button>
                    <button class="task-btn">⋮ More</button>
                </div>
                <div class="task-list">
                    <div class="task-item">
                        <input type="checkbox" class="task-check" />
                        <div class="task-info">
                            <div class="task-title">Complete project report</div>
                            <div class="task-due">Due: Tomorrow</div>
                        </div>
                        <div class="task-priority high">High</div>
                    </div>
                    <div class="task-item">
                        <input type="checkbox" class="task-check" />
                        <div class="task-info">
                            <div class="task-title">Email team updates</div>
                            <div class="task-due">Due: Today</div>
                        </div>
                        <div class="task-priority medium">Medium</div>
                    </div>
                    <div class="task-item">
                        <input type="checkbox" class="task-check" checked />
                        <div class="task-info">
                            <div class="task-title completed">Buy groceries</div>
                            <div class="task-due">Completed</div>
                        </div>
                        <div class="task-priority low">Low</div>
                    </div>
                </div>
                <div class="task-stats">
                    <span>3 tasks</span>
                    <span>1 completed</span>
                    <span>67% done</span>
                </div>
            </div>
        `;
    }

    async runVoiceRecorder(context) {
        return `
            <div class="app-content voice-recorder">
                <div class="recorder-display">
                    <div class="recording-time">00:00</div>
                    <div class="waveform">
                        ${Array.from({length: 40}, (_, i) => `<div class="wave" style="height: ${Math.random() * 100}%"></div>`).join('')}
                    </div>
                </div>
                <div class="recorder-controls">
                    <button class="rec-btn record">⏺</button>
                    <button class="rec-btn pause">⏸</button>
                    <button class="rec-btn stop">⏹</button>
                    <button class="rec-btn play">▶</button>
                </div>
                <div class="recordings-list">
                    <h4>Recordings</h4>
                    <div class="recording-item">🎤 Voice Memo 1 <span class="duration">0:45</span></div>
                    <div class="recording-item">🎤 Voice Memo 2 <span class="duration">1:23</span></div>
                    <div class="recording-item">🎤 Voice Memo 3 <span class="duration">0:32</span></div>
                </div>
            </div>
        `;
    }

    async runCompass(context) {
        return `
            <div class="app-content compass">
                <div class="compass-display">
                    <div class="compass-ring">
                        <div class="compass-needle"></div>
                        <div class="compass-marks">
                            <span class="mark n">N</span>
                            <span class="mark e">E</span>
                            <span class="mark s">S</span>
                            <span class="mark w">W</span>
                        </div>
                    </div>
                    <div class="compass-reading">
                        <div class="degrees">0°</div>
                        <div class="direction">North</div>
                    </div>
                </div>
                <div class="compass-info">
                    <div class="info-item">
                        <label>Bearing</label>
                        <span>0°</span>
                    </div>
                    <div class="info-item">
                        <label>Accuracy</label>
                        <span>±5°</span>
                    </div>
                    <div class="info-item">
                        <label>Location</label>
                        <span>Acquiring...</span>
                    </div>
                </div>
                <div class="compass-calibration">
                    <button class="cal-btn">Calibrate</button>
                    <button class="cal-btn">True North</button>
                    <button class="cal-btn">Magnetic North</button>
                </div>
            </div>
        `;
    }

    async runLevel(context) {
        return `
            <div class="app-content level">
                <div class="level-display">
                    <div class="level-bubble">
                        <div class="bubble"></div>
                    </div>
                    <div class="level-readings">
                        <div class="reading">
                            <span>X-axis:</span>
                            <span class="value">0.0°</span>
                        </div>
                        <div class="reading">
                            <span>Y-axis:</span>
                            <span class="value">0.0°</span>
                        </div>
                        <div class="reading">
                            <span>Z-axis:</span>
                            <span class="value">0.0°</span>
                        </div>
                    </div>
                </div>
                <div class="level-status">
                    <div class="status-item">
                        <label>Level:</label>
                        <span class="status good">Perfect</span>
                    </div>
                    <div class="status-item">
                        <label>Angle:</label>
                        <span class="angle">0°</span>
                    </div>
                </div>
                <div class="level-actions">
                    <button class="level-btn">Reset</button>
                    <button class="level-btn">Hold</button>
                    <button class="level-btn">Sound</button>
                </div>
            </div>
        `;
    }

    async runStopwatch(context) {
        return `
            <div class="app-content stopwatch">
                <div class="stopwatch-display">
                    <div class="time">00:00:00.00</div>
                    <div class="laps">
                        <div class="lap">Lap 1: 00:00:00.00</div>
                        <div class="lap">Lap 2: 00:00:00.00</div>
                        <div class="lap">Lap 3: 00:00:00.00</div>
                    </div>
                </div>
                <div class="stopwatch-controls">
                    <button class="sw-btn start">Start</button>
                    <button class="sw-btn lap">Lap</button>
                    <button class="sw-btn reset">Reset</button>
                </div>
                <div class="stopwatch-history">
                    <h4>Previous Times</h4>
                    <div class="history-list">
                        <div class="history-item">1:23.45</div>
                        <div class="history-item">0:45.12</div>
                        <div class="history-item">2:15.78</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runFlashlight(context) {
        return `
            <div class="app-content flashlight">
                <div class="flashlight-display">
                    <div class="flashlight-icon">🔦</div>
                    <div class="flashlight-status">OFF</div>
                </div>
                <div class="flashlight-controls">
                    <button class="flash-btn toggle">Turn On</button>
                    <button class="flash-btn strobe">Strobe</button>
                    <button class="flash-btn sos">SOS</button>
                </div>
                <div class="flashlight-brightness">
                    <label>Brightness</label>
                    <input type="range" min="0" max="100" value="100" />
                </div>
                <div class="flashlight-info">
                    <p>Uses device camera flash LED</p>
                    <p>⚠️ Camera access required</p>
                </div>
            </div>
        `;
    }

    async runScanner(context) {
        return `
            <div class="app-content scanner">
                <div class="scanner-view">
                    <div class="scanner-placeholder">
                        <div style="font-size: 80px;">🔍</div>
                        <p>Document Scanner</p>
                        <p>Point camera at document</p>
                    </div>
                </div>
                <div class="scanner-controls">
                    <button class="scan-btn capture">📷 Scan</button>
                    <button class="scan-btn auto">Auto</button>
                    <button class="scan-btn crop">Crop</button>
                    <button class="scan-btn enhance">Enhance</button>
                </div>
                <div class="scanner-options">
                    <div class="option">
                        <label>Type</label>
                        <select>
                            <option>Document</option>
                            <option>Photo</option>
                            <option>Receipt</option>
                            <option>Business Card</option>
                        </select>
                    </div>
                    <div class="option">
                        <label>Color</label>
                        <select>
                            <option>Color</option>
                            <option>Black & White</option>
                            <option>Grayscale</option>
                        </select>
                    </div>
                </div>
                <div class="scanner-history">
                    <h4>Scanned Documents</h4>
                    <div class="scan-list">
                        <div class="scan-item">📄 Document 1</div>
                        <div class="scan-item">📄 Document 2</div>
                        <div class="scan-item">📄 Document 3</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runTranslatorMobile(context) {
        return `
            <div class="app-content translator-mobile">
                <div class="translator-input">
                    <div class="input-group">
                        <label>From</label>
                        <select>
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                            <option>Chinese</option>
                            <option>Arabic</option>
                        </select>
                        <textarea placeholder="Enter text..."></textarea>
                    </div>
                </div>
                <div class="translator-actions">
                    <button class="trans-btn swap">⇄ Swap</button>
                    <button class="trans-btn translate">Translate</button>
                    <button class="trans-btn speak">🔊 Speak</button>
                </div>
                <div class="translator-output">
                    <div class="output-group">
                        <label>To</label>
                        <select>
                            <option>Spanish</option>
                            <option>English</option>
                            <option>French</option>
                            <option>German</option>
                            <option>Chinese</option>
                            <option>Arabic</option>
                        </select>
                        <div class="translation-result">Translation will appear here...</div>
                    </div>
                </div>
                <div class="translator-history">
                    <h4>Recent Translations</h4>
                    <div class="trans-list">
                        <div class="trans-item">Hello → Hola</div>
                        <div class="trans-item">Goodbye → Adiós</div>
                        <div class="trans-item">Thank you → Gracias</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runUnitConverter(context) {
        return `
            <div class="app-content unit-converter">
                <div class="converter-input">
                    <div class="input-group">
                        <label>From</label>
                        <input type="number" placeholder="0" class="from-value" />
                        <select class="from-unit">
                            <option>Meters</option>
                            <option>Kilometers</option>
                            <option>Miles</option>
                            <option>Feet</option>
                            <option>Inches</option>
                            <option>Yards</option>
                        </select>
                    </div>
                </div>
                <div class="converter-actions">
                    <button class="conv-btn swap">⇄ Swap</button>
                    <button class="conv-btn convert">Convert</button>
                </div>
                <div class="converter-output">
                    <div class="output-group">
                        <label>To</label>
                        <input type="text" placeholder="Result" class="to-value" readonly />
                        <select class="to-unit">
                            <option>Kilometers</option>
                            <option>Meters</option>
                            <option>Miles</option>
                            <option>Feet</option>
                            <option>Inches</option>
                            <option>Yards</option>
                        </select>
                    </div>
                </div>
                <div class="converter-categories">
                    <h4>Categories</h4>
                    <div class="category-list">
                        <button class="cat-btn active">Length</button>
                        <button class="cat-btn">Weight</button>
                        <button class="cat-btn">Temperature</button>
                        <button class="cat-btn">Volume</button>
                        <button class="cat-btn">Currency</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runTipCalculator(context) {
        return `
            <div class="app-content tip-calculator">
                <div class="tip-inputs">
                    <div class="input-group">
                        <label>Bill Amount</label>
                        <input type="number" placeholder="0.00" class="bill-amount" />
                    </div>
                    <div class="input-group">
                        <label>Tip Percentage</label>
                        <select class="tip-percent">
                            <option value="15">15%</option>
                            <option value="18">18%</option>
                            <option value="20" selected>20%</option>
                            <option value="25">25%</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Split Between</label>
                        <input type="number" value="1" min="1" class="split-count" />
                    </div>
                </div>
                <div class="tip-actions">
                    <button class="tip-btn calculate">Calculate</button>
                    <button class="tip-btn reset">Reset</button>
                </div>
                <div class="tip-results">
                    <div class="result-item">
                        <span>Subtotal:</span>
                        <span class="subtotal">$0.00</span>
                    </div>
                    <div class="result-item">
                        <span>Tip Amount:</span>
                        <span class="tip-amount">$0.00</span>
                    </div>
                    <div class="result-item total">
                        <span>Total:</span>
                        <span class="total-amount">$0.00</span>
                    </div>
                    <div class="result-item">
                        <span>Per Person:</span>
                        <span class="per-person">$0.00</span>
                    </div>
                </div>
                <div class="tip-presets">
                    <h4>Quick Presets</h4>
                    <div class="preset-list">
                        <button class="preset-btn" data-tip="15">15%</button>
                        <button class="preset-btn" data-tip="18">18%</button>
                        <button class="preset-btn" data-tip="20">20%</button>
                        <button class="preset-btn" data-tip="25">25%</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runBMICalculator(context) {
        return `
            <div class="app-content bmi-calculator">
                <div class="bmi-inputs">
                    <div class="input-group">
                        <label>Height (cm)</label>
                        <input type="number" placeholder="170" class="height" />
                    </div>
                    <div class="input-group">
                        <label>Weight (kg)</label>
                        <input type="number" placeholder="70" class="weight" />
                    </div>
                </div>
                <div class="bmi-actions">
                    <button class="bmi-btn calculate">Calculate BMI</button>
                    <button class="bmi-btn reset">Reset</button>
                </div>
                <div class="bmi-result">
                    <div class="bmi-value">--</div>
                    <div class="bmi-category">Enter your details</div>
                </div>
                <div class="bmi-info">
                    <h4>BMI Categories</h4>
                    <div class="category-list">
                        <div class="category-item"><span>Underweight</span><span>< 18.5</span></div>
                        <div class="category-item"><span>Normal</span><span>18.5 - 24.9</span></div>
                        <div class="category-item"><span>Overweight</span><span>25.0 - 29.9</span></div>
                        <div class="category-item"><span>Obese</span><span>≥ 30.0</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    async runWorldClock(context) {
        return `
            <div class="app-content world-clock">
                <div class="clock-list">
                    <div class="clock-item">
                        <div class="city">New York</div>
                        <div class="time">07:00 AM</div>
                        <div class="zone">EST</div>
                    </div>
                    <div class="clock-item">
                        <div class="city">London</div>
                        <div class="time">12:00 PM</div>
                        <div class="zone">GMT</div>
                    </div>
                    <div class="clock-item">
                        <div class="city">Tokyo</div>
                        <div class="time">09:00 PM</div>
                        <div class="zone">JST</div>
                    </div>
                    <div class="clock-item">
                        <div class="city">Sydney</div>
                        <div class="time">11:00 PM</div>
                        <div class="zone">AEDT</div>
                    </div>
                </div>
                <div class="clock-actions">
                    <button class="clock-btn">➕ Add City</button>
                    <button class="clock-btn">🌍 World Map</button>
                    <button class="clock-btn">⏰ Alarms</button>
                </div>
                <div class="clock-info">
                    <h4>Time Zone Converter</h4>
                    <div class="converter">
                        <select>
                            <option>12:00 PM</option>
                            <option>1:00 PM</option>
                            <option>2:00 PM</option>
                        </select>
                        <span>→</span>
                        <select>
                            <option>New York</option>
                            <option>London</option>
                            <option>Tokyo</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    async runSudoku(context) {
        return `
            <div class="app-content sudoku">
                <div class="sudoku-header">
                    <div class="difficulty">Medium</div>
                    <div class="timer">05:23</div>
                    <div class="mistakes">Mistakes: 0/3</div>
                </div>
                <div class="sudoku-grid">
                    ${Array.from({length: 81}, (_, i) => {
                        const row = Math.floor(i / 9);
                        const col = i % 9;
                        const isBold = (row === 2 || row === 5) || (col === 2 || col === 5);
                        const isFixed = Math.random() > 0.7;
                        const value = isFixed ? Math.floor(Math.random() * 9) + 1 : '';
                        return `<div class="sudoku-cell ${isBold ? 'bold' : ''} ${isFixed ? 'fixed' : ''}">${value}</div>`;
                    }).join('')}
                </div>
                <div class="sudoku-controls">
                    <div class="number-pad">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="num-btn">${n}</button>`).join('')}
                    </div>
                    <div class="actions">
                        <button class="sudoku-btn">Undo</button>
                        <button class="sudoku-btn">Erase</button>
                        <button class="sudoku-btn">Hint</button>
                        <button class="sudoku-btn">New Game</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runTicTacToe(context) {
        return `
            <div class="app-content tic-tac-toe">
                <div class="game-status">Player X's Turn</div>
                <div class="tic-tac-grid">
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                    <div class="cell"></div>
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Game</button>
                    <button class="game-btn">Vs Computer</button>
                    <button class="game-btn">2 Players</button>
                </div>
                <div class="game-stats">
                    <div class="stat">X Wins: 0</div>
                    <div class="stat">O Wins: 0</div>
                    <div class="stat">Draws: 0</div>
                </div>
            </div>
        `;
    }

    async runSnake(context) {
        return `
            <div class="app-content snake">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="high-score">High: 0</div>
                </div>
                <div class="snake-game-area">
                    <div class="snake-grid">
                        ${Array.from({length: 400}, (_, i) => `<div class="grid-cell"></div>`).join('')}
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="game-instructions">
                    <p>Use arrow keys to control the snake</p>
                    <p>Eat food to grow and earn points</p>
                </div>
            </div>
        `;
    }

    async runMinesweeper(context) {
        return `
            <div class="app-content minesweeper">
                <div class="game-header">
                    <div class="mines-left">💣 10</div>
                    <div class="timer">⏱️ 000</div>
                    <div class="face">🙂</div>
                </div>
                <div class="minesweeper-grid">
                    ${Array.from({length: 81}, (_, i) => `<div class="mine-cell"></div>`).join('')}
                </div>
                <div class="game-controls">
                    <button class="game-btn">Beginner</button>
                    <button class="game-btn">Intermediate</button>
                    <button class="game-btn">Expert</button>
                    <button class="game-btn">New Game</button>
                </div>
            </div>
        `;
    }

    async runChess(context) {
        return `
            <div class="app-content chess">
                <div class="chess-header">
                    <div class="status">White to move</div>
                    <div class="controls">
                        <button class="chess-btn">New Game</button>
                        <button class="chess-btn">Undo</button>
                        <button class="chess-btn">Flip</button>
                    </div>
                </div>
                <div class="chess-board">
                    ${Array.from({length: 64}, (_, i) => {
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const isDark = (row + col) % 2 === 1;
                        return `<div class="chess-square ${isDark ? 'dark' : 'light'}"></div>`;
                    }).join('')}
                </div>
                <div class="chess-info">
                    <div class="captured white">Captured by White: </div>
                    <div class="captured black">Captured by Black: </div>
                </div>
            </div>
        `;
    }

    async runMemoryGameMobile(context) {
        return `
            <div class="app-content memory-game-mobile">
                <div class="game-header">
                    <div class="moves">Moves: 0</div>
                    <div class="time">Time: 0:00</div>
                    <div class="score">Score: 0</div>
                </div>
                <div class="memory-grid">
                    ${Array.from({length: 16}, (_, i) => `<div class="memory-card" data-id="${i}">?</div>`).join('')}
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Game</button>
                    <button class="game-btn">Easy (4x4)</button>
                    <button class="game-btn">Medium (6x6)</button>
                    <button class="game-btn">Hard (8x8)</button>
                </div>
            </div>
        `;
    }

    async runQuizGame(context) {
        return `
            <div class="app-content quiz-game">
                <div class="quiz-header">
                    <div class="category">General Knowledge</div>
                    <div class="progress">Question 1 of 10</div>
                    <div class="score">Score: 0</div>
                </div>
                <div class="quiz-question">
                    <h3>What is the capital of France?</h3>
                    <div class="quiz-options">
                        <button class="quiz-option">London</button>
                        <button class="quiz-option">Berlin</button>
                        <button class="quiz-option correct">Paris</button>
                        <button class="quiz-option">Madrid</button>
                    </div>
                </div>
                <div class="quiz-controls">
                    <button class="quiz-btn">Skip</button>
                    <button class="quiz-btn">Submit</button>
                    <button class="quiz-btn">Next</button>
                </div>
                <div class="quiz-categories">
                    <h4>Categories</h4>
                    <div class="category-list">
                        <button class="cat-btn">General</button>
                        <button class="cat-btn">Science</button>
                        <button class="cat-btn">History</button>
                        <button class="cat-btn">Geography</button>
                        <button class="cat-btn">Movies</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runWordSearch(context) {
        return `
            <div class="app-content word-search">
                <div class="game-header">
                    <div class="words-found">Found: 0/8</div>
                    <div class="timer">Time: 0:00</div>
                </div>
                <div class="word-grid">
                    ${Array.from({length: 100}, (_, i) => `<div class="grid-cell">${String.fromCharCode(65 + Math.floor(Math.random() * 26))}</div>`).join('')}
                </div>
                <div class="word-list">
                    <h4>Find these words:</h4>
                    <div class="words">
                        <span>APPLE</span>
                        <span>BANANA</span>
                        <span>CHERRY</span>
                        <span>DATE</span>
                        <span>ELDERBERRY</span>
                        <span>FIG</span>
                        <span>GRAPE</span>
                        <span>HONEYDEW</span>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Puzzle</button>
                    <button class="game-btn">Hint</button>
                    <button class="game-btn">Shuffle</button>
                </div>
            </div>
        `;
    }

    async runCrossword(context) {
        return `
            <div class="app-content crossword">
                <div class="game-header">
                    <div class="progress">Progress: 0%</div>
                    <div class="timer">Time: 0:00</div>
                </div>
                <div class="crossword-grid">
                    ${Array.from({length: 100}, (_, i) => {
                        const isBlack = Math.random() > 0.8;
                        return `<div class="crossword-cell ${isBlack ? 'black' : ''}"></div>`;
                    }).join('')}
                </div>
                <div class="crossword-clues">
                    <div class="clues-column">
                        <h4>Across</h4>
                        <div class="clue">1. Capital of France</div>
                        <div class="clue">4. Largest ocean</div>
                        <div class="clue">6. Chemical symbol for gold</div>
                    </div>
                    <div class="clues-column">
                        <h4>Down</h4>
                        <div class="clue">2. Planet next to Earth</div>
                        <div class="clue">3. Color of sky</div>
                        <div class="clue">5. 2 + 2</div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn">Check</button>
                    <button class="game-btn">Reveal</button>
                    <button class="game-btn">New Puzzle</button>
                </div>
            </div>
        `;
    }

    async runHangman(context) {
        return `
            <div class="app-content hangman">
                <div class="game-header">
                    <div class="category">Category: Animals</div>
                    <div class="lives">Lives: 6</div>
                    <div class="score">Score: 0</div>
                </div>
                <div class="hangman-drawing">
                    <div class="gallows"></div>
                    <div class="hangman-parts">
                        <div class="part head"></div>
                        <div class="part body"></div>
                        <div class="part left-arm"></div>
                        <div class="part right-arm"></div>
                        <div class="part left-leg"></div>
                        <div class="part right-leg"></div>
                    </div>
                </div>
                <div class="word-display">_ _ _ _ _ _ _</div>
                <div class="letter-buttons">
                    ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => 
                        `<button class="letter-btn">${letter}</button>`
                    ).join('')}
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Game</button>
                    <button class="game-btn">Hint</button>
                    <button class="game-btn">Categories</button>
                </div>
            </div>
        `;
    }

    async runRockPaperScissors(context) {
        return `
            <div class="app-content rock-paper-scissors">
                <div class="game-status">Choose your move!</div>
                <div class="game-arena">
                    <div class="player-side">
                        <div class="choice" id="player-choice">?</div>
                        <div class="label">You</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="computer-side">
                        <div class="choice" id="computer-choice">?</div>
                        <div class="label">Computer</div>
                    </div>
                </div>
                <div class="move-buttons">
                    <button class="move-btn" data-move="rock">✊ Rock</button>
                    <button class="move-btn" data-move="paper">✋ Paper</button>
                    <button class="move-btn" data-move="scissors">✌️ Scissors</button>
                </div>
                <div class="game-stats">
                    <div class="stat">Wins: 0</div>
                    <div class="stat">Losses: 0</div>
                    <div class="stat">Draws: 0</div>
                </div>
                <div class="game-controls">
                    <button class="game-btn">Reset Score</button>
                    <button class="game-btn">Best of 3</button>
                    <button class="game-btn">Best of 5</button>
                </div>
            </div>
        `;
    }

    async runHigherLower(context) {
        return `
            <div class="app-content higher-lower">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="streak">Streak: 0</div>
                </div>
                <div class="game-arena">
                    <div class="current-number">50</div>
                    <div class="question">Will the next number be...</div>
                    <div class="choice-buttons">
                        <button class="choice-btn higher">⬆️ Higher</button>
                        <button class="choice-btn lower">⬇️ Lower</button>
                        <button class="choice-btn equal">= Equal</button>
                    </div>
                </div>
                <div class="game-info">
                    <p>Guess if the next number will be higher, lower, or equal</p>
                    <p>Get 5 correct to win!</p>
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Game</button>
                    <button class="game-btn">How to Play</button>
                </div>
            </div>
        `;
    }

    async runDiceRoller(context) {
        return `
            <div class="app-content dice-roller">
                <div class="dice-display">
                    <div class="dice" id="dice">🎲</div>
                    <div class="result">Roll the dice!</div>
                </div>
                <div class="dice-controls">
                    <button class="dice-btn roll">Roll Dice</button>
                    <button class="dice-btn roll-2">Roll 2 Dice</button>
                    <button class="dice-btn roll-3">Roll 3 Dice</button>
                </div>
                <div class="dice-options">
                    <label>Number of sides:</label>
                    <select class="sides">
                        <option value="4">4-sided</option>
                        <option value="6" selected>6-sided</option>
                        <option value="8">8-sided</option>
                        <option value="10">10-sided</option>
                        <option value="12">12-sided</option>
                        <option value="20">20-sided</option>
                    </select>
                </div>
                <div class="roll-history">
                    <h4>Recent Rolls</h4>
                    <div class="history-list">
                        <div class="history-item">🎲 6</div>
                        <div class="history-item">🎲 4</div>
                        <div class="history-item">🎲 12</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runCoinFlip(context) {
        return `
            <div class="app-content coin-flip">
                <div class="coin-display">
                    <div class="coin" id="coin">🪙</div>
                    <div class="result">Flip the coin!</div>
                </div>
                <div class="coin-controls">
                    <button class="coin-btn flip">Flip Coin</button>
                    <button class="coin-btn flip-10">Flip 10x</button>
                    <button class="coin-btn flip-100">Flip 100x</button>
                </div>
                <div class="coin-stats">
                    <div class="stat">Heads: 0</div>
                    <div class="stat">Tails: 0</div>
                    <div class="stat">Total: 0</div>
                </div>
                <div class="coin-history">
                    <h4>Recent Flips</h4>
                    <div class="history-list">
                        <div class="history-item heads">Heads</div>
                        <div class="history-item tails">Tails</div>
                        <div class="history-item heads">Heads</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runMagic8Ball(context) {
        return `
            <div class="app-content magic-8-ball">
                <div class="ball-display">
                    <div class="ball" id="magic-ball">
                        <div class="ball-text">8</div>
                    </div>
                    <div class="answer">Ask a question and tap the ball</div>
                </div>
                <div class="question-input">
                    <input type="text" placeholder="Ask your question..." class="question" />
                    <button class="ask-btn">Ask</button>
                </div>
                <div class="ball-controls">
                    <button class="ball-btn shake">Shake Ball</button>
                    <button class="ball-btn clear">Clear</button>
                </div>
                <div class="answer-history">
                    <h4>Previous Answers</h4>
                    <div class="history-list">
                        <div class="history-item">Yes</div>
                        <div class="history-item">Ask again later</div>
                        <div class="history-item">Definitely</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runTruthOrDare(context) {
        return `
            <div class="app-content truth-or-dare">
                <div class="game-header">
                    <div class="mode">Truth or Dare</div>
                    <div class="player">Current Player: Player 1</div>
                </div>
                <div class="challenge-display">
                    <div class="challenge-type">?</div>
                    <div class="challenge-text">Choose Truth or Dare to begin</div>
                </div>
                <div class="choice-buttons">
                    <button class="choice-btn truth">Truth</button>
                    <button class="choice-btn dare">Dare</button>
                    <button class="choice-btn skip">Skip</button>
                </div>
                <div class="game-options">
                    <h4>Settings</h4>
                    <div class="option-group">
                        <label>Players:</label>
                        <input type="number" value="4" min="2" max="10" />
                    </div>
                    <div class="option-group">
                        <label>Difficulty:</label>
                        <select>
                            <option>Easy</option>
                            <option selected>Medium</option>
                            <option>Hard</option>
                            <option>Extreme</option>
                        </select>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Game</button>
                    <button class="game-btn">Next Player</button>
                    <button class="game-btn">Add Custom</button>
                </div>
            </div>
        `;
    }

    async runWouldYouRather(context) {
        return `
            <div class="app-content would-you-rather">
                <div class="game-header">
                    <div class="question-number">Question 1</div>
                    <div class="score">Score: 0</div>
                </div>
                <div class="question-display">
                    <h3>Would you rather...</h3>
                    <div class="choices">
                        <button class="choice-btn option-a">Live without internet for a year</button>
                        <div class="vs">OR</div>
                        <button class="choice-btn option-b">Never eat your favorite food again</button>
                    </div>
                </div>
                <div class="game-stats">
                    <div class="stat">Answered: 0</div>
                    <div class="stat">Skipped: 0</div>
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Question</button>
                    <button class="game-btn">Skip</button>
                    <button class="game-btn">Categories</button>
                </div>
                <div class="recent-answers">
                    <h4>Recent Questions</h4>
                    <div class="answer-list">
                        <div class="answer-item">Flying vs Invisibility</div>
                        <div class="answer-item">Beach vs Mountains</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runNeverHaveIEver(context) {
        return `
            <div class="app-content never-have-i-ever">
                <div class="game-header">
                    <div class="statement-number">Statement 1</div>
                    <div class="points">Points: 0</div>
                </div>
                <div class="statement-display">
                    <h3>Never have I ever...</h3>
                    <div class="statement-text">...been skydiving</div>
                </div>
                <div class="response-buttons">
                    <button class="response-btn have">I Have</button>
                    <button class="response-btn never">I Never</button>
                    <button class="response-btn skip">Skip</button>
                </div>
                <div class="game-info">
                    <p>Tap "I Have" if you've done it</p>
                    <p>Tap "I Never" if you haven't</p>
                </div>
                <div class="game-controls">
                    <button class="game-btn">New Statement</button>
                    <button class="game-btn">Reset Score</button>
                    <button class="game-btn">Party Mode</button>
                </div>
                <div class="recent-statements">
                    <h4>Recent Statements</h4>
                    <div class="statement-list">
                        <div class="statement-item">Broken a bone</div>
                        <div class="statement-item">Met a celebrity</div>
                        <div class="statement-item">Been on TV</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runRiddleMaster(context) {
        return `
            <div class="app-content riddle-master">
                <div class="game-header">
                    <div class="level">Level 1</div>
                    <div class="score">Score: 0</div>
                    <div class="hints">Hints: 3</div>
                </div>
                <div class="riddle-display">
                    <h3>Riddle:</h3>
                    <p class="riddle-text">I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?</p>
                    <div class="hint-text" style="display:none;">Think about natural phenomena...</div>
                </div>
                <div class="answer-input">
                    <input type="text" placeholder="Your answer..." class="riddle-answer" />
                    <button class="submit-btn">Submit</button>
                </div>
                <div class="game-controls">
                    <button class="game-btn">Get Hint</button>
                    <button class="game-btn">Skip</button>
                    <button class="game-btn">New Riddle</button>
                </div>
                <div class="riddle-categories">
                    <h4>Categories</h4>
                    <div class="category-list">
                        <button class="cat-btn">Easy</button>
                        <button class="cat-btn">Medium</button>
                        <button class="cat-btn">Hard</button>
                        <button class="cat-btn">Logic</button>
                        <button class="cat-btn">Math</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runTriviaMaster(context) {
        return `
            <div class="app-content trivia-master">
                <div class="game-header">
                    <div class="category">General Knowledge</div>
                    <div class="question-number">Q1 of 10</div>
                    <div class="score">Score: 0</div>
                </div>
                <div class="trivia-question">
                    <h3>What is the largest planet in our solar system?</h3>
                    <div class="trivia-options">
                        <button class="trivia-option">Earth</button>
                        <button class="trivia-option">Saturn</button>
                        <button class="trivia-option correct">Jupiter</button>
                        <button class="trivia-option">Mars</button>
                    </div>
                </div>
                <div class="timer-bar">
                    <div class="timer-fill" style="width: 75%"></div>
                </div>
                <div class="game-controls">
                    <button class="game-btn">Next Question</button>
                    <button class="game-btn">Skip</button>
                    <button class="game-btn">New Game</button>
                </div>
                <div class="trivia-categories">
                    <h4>Categories</h4>
                    <div class="category-list">
                        <button class="cat-btn">General</button>
                        <button class="cat-btn">Science</button>
                        <button class="cat-btn">History</button>
                        <button class="cat-btn">Geography</button>
                        <button class="cat-btn">Entertainment</button>
                        <button class="cat-btn">Sports</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runTypingRacer(context) {
        return `
            <div class="app-content typing-racer">
                <div class="game-header">
                    <div class="wpm">WPM: 0</div>
                    <div class="accuracy">Accuracy: 100%</div>
                    <div class="time">Time: 0s</div>
                </div>
                <div class="typing-display">
                    <div class="target-text">The quick brown fox jumps over the lazy dog</div>
                    <input type="text" class="typing-input" placeholder="Start typing..." />
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start Race</button>
                    <button class="game-btn reset">Reset</button>
                    <button class="game-btn new">New Text</button>
                </div>
                <div class="difficulty-options">
                    <h4>Difficulty</h4>
                    <div class="diff-list">
                        <button class="diff-btn">Easy</button>
                        <button class="diff-btn">Medium</button>
                        <button class="diff-btn">Hard</button>
                        <button class="diff-btn">Expert</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runReactionTester(context) {
        return `
            <div class="app-content reaction-tester">
                <div class="game-header">
                    <div class="average">Avg: -- ms</div>
                    <div class="best">Best: -- ms</div>
                    <div class="attempts">Attempts: 0</div>
                </div>
                <div class="reaction-area">
                    <div class="reaction-box" id="reaction-box">
                        <div class="instruction">Click when it turns green</div>
                    </div>
                </div>
                <div class="reaction-results">
                    <div class="last-time">Last: -- ms</div>
                    <div class="status">Ready</div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start Test</button>
                    <button class="game-btn reset">Reset Stats</button>
                    <button class="game-btn mode">Advanced Mode</button>
                </div>
                <div class="reaction-info">
                    <p>Click the box as fast as you can when it turns green</p>
                    <p>Avoid clicking too early (false start)</p>
                </div>
            </div>
        `;
    }

    async runColorMatching(context) {
        return `
            <div class="app-content color-matching">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="level">Level: 1</div>
                    <div class="time">Time: 30s</div>
                </div>
                <div class="color-display">
                    <div class="target-color" style="background-color: #FF5733;"></div>
                    <div class="instruction">Match this color</div>
                </div>
                <div class="color-controls">
                    <div class="color-picker">
                        <label>Red:</label>
                        <input type="range" min="0" max="255" value="128" class="red-slider" />
                    </div>
                    <div class="color-picker">
                        <label>Green:</label>
                        <input type="range" min="0" max="255" value="128" class="green-slider" />
                    </div>
                    <div class="color-picker">
                        <label>Blue:</label>
                        <input type="range" min="0" max="255" value="128" class="blue-slider" />
                    </div>
                </div>
                <div class="current-color">
                    <div class="color-preview" style="background-color: rgb(128, 128, 128);"></div>
                    <button class="submit-btn">Submit</button>
                </div>
                <div class="game-controls">
                    <button class="game-btn new">New Color</button>
                    <button class="game-btn hint">Hint</button>
                    <button class="game-btn reset">Reset</button>
                </div>
            </div>
        `;
    }

    async runPatternMemory(context) {
        return `
            <div class="app-content pattern-memory">
                <div class="game-header">
                    <div class="level">Level: 1</div>
                    <div class="score">Score: 0</div>
                    <div class="round">Round: 1</div>
                </div>
                <div class="pattern-grid">
                    ${Array.from({length: 9}, (_, i) => `<div class="pattern-cell" data-id="${i}"></div>`).join('')}
                </div>
                <div class="pattern-status">
                    <div class="status">Watch the pattern...</div>
                    <div class="sequence">Sequence: 3</div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start Round</button>
                    <button class="game-btn repeat">Repeat Pattern</button>
                    <button class="game-btn reset">Reset Game</button>
                </div>
                <div class="game-info">
                    <p>Memorize the flashing pattern</p>
                    <p>Repeat it by clicking the cells</p>
                </div>
            </div>
        `;
    }

    async runSpeedClick(context) {
        return `
            <div class="app-content speed-click">
                <div class="game-header">
                    <div class="clicks">Clicks: 0</div>
                    <div class="time">Time: 10s</div>
                    <div class="cps">CPS: 0</div>
                </div>
                <div class="click-area">
                    <button class="click-target">Click Me!</button>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start (10s)</button>
                    <button class="game-btn reset">Reset</button>
                    <button class="game-btn mode">30s Mode</button>
                </div>
                <div class="high-scores">
                    <h4>High Scores</h4>
                    <div class="score-list">
                        <div class="score-item">10s: 45 clicks</div>
                        <div class="score-item">30s: 120 clicks</div>
                    </div>
                </div>
            </div>
        `;
    }

    async runBubblePop(context) {
        return `
            <div class="app-content bubble-pop">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="time">Time: 60s</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="bubble-area">
                    ${Array.from({length: 15}, (_, i) => 
                        `<div class="bubble" style="left: ${Math.random() * 80}%; bottom: ${Math.random() * 80}%; animation-delay: ${Math.random() * 2}s;"></div>`
                    ).join('')}
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start Game</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="game-info">
                    <p>Pop bubbles by clicking them</p>
                    <p>Pop as many as you can in 60 seconds</p>
                </div>
            </div>
        `;
    }

    async runTapMaster(context) {
        return `
            <div class="app-content tap-master">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="level">Level: 1</div>
                    <div class="combo">Combo: x1</div>
                </div>
                <div class="tap-area">
                    <div class="tap-target" id="tap-target">Tap!</div>
                </div>
                <div class="tap-sequence">
                    <h4>Pattern</h4>
                    <div class="sequence-display">Watch...</div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn repeat">Repeat</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="game-info">
                    <p>Watch the pattern, then repeat it</p>
                    <p>Tap the target in the correct sequence</p>
                </div>
            </div>
        `;
    }

    async runColorMatch(context) {
        return `
            <div class="app-content color-match">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="time">Time: 30s</div>
                    <div class="streak">Streak: 0</div>
                </div>
                <div class="color-match-area">
                    <div class="target-color" id="target-color"></div>
                    <div class="color-options">
                        <button class="color-btn" style="background: #FF0000;"></button>
                        <button class="color-btn" style="background: #00FF00;"></button>
                        <button class="color-btn" style="background: #0000FF;"></button>
                        <button class="color-btn" style="background: #FFFF00;"></button>
                        <button class="color-btn" style="background: #FF00FF;"></button>
                        <button class="color-btn" style="background: #00FFFF;"></button>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn reset">Reset</button>
                    <button class="game-btn hard">Hard Mode</button>
                </div>
                <div class="game-info">
                    <p>Click the color that matches the target</p>
                    <p>Get 10 correct to advance</p>
                </div>
            </div>
        `;
    }

    async runNumberCrunch(context) {
        return `
            <div class="app-content number-crunch">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="level">Level: 1</div>
                    <div class="time">Time: 60s</div>
                </div>
                <div class="math-problem">
                    <div class="problem" id="problem">5 + 3 = ?</div>
                    <input type="number" class="answer-input" placeholder="Answer" />
                    <button class="submit-btn">Submit</button>
                </div>
                <div class="game-controls">
                    <button class="game-btn new">New Problem</button>
                    <button class="game-btn skip">Skip</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="math-operations">
                    <h4>Operations</h4>
                    <div class="op-list">
                        <button class="op-btn active">+</button>
                        <button class="op-btn">-</button>
                        <button class="op-btn">×</button>
                        <button class="op-btn">÷</button>
                        <button class="op-btn">Mixed</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runWordMaster(context) {
        return `
            <div class="app-content word-master">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="level">Level: 1</div>
                    <div class="time">Time: 60s</div>
                </div>
                <div class="word-display">
                    <div class="letters" id="letters">A P P L E</div>
                    <input type="text" class="word-input" placeholder="Type the word..." />
                    <button class="submit-btn">Submit</button>
                </div>
                <div class="word-stats">
                    <div class="stat">Words: 0</div>
                    <div class="stat">Accuracy: 100%</div>
                    <div class="stat">Best: 0</div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn skip">Skip</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="word-categories">
                    <h4>Categories</h4>
                    <div class="cat-list">
                        <button class="cat-btn">Easy</button>
                        <button class="cat-btn">Medium</button>
                        <button class="cat-btn">Hard</button>
                        <button class="cat-btn">Animals</button>
                        <button class="cat-btn">Food</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runEmojiMatcher(context) {
        return `
            <div class="app-content emoji-matcher">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="moves">Moves: 0</div>
                    <div class="time">Time: 0:00</div>
                </div>
                <div class="emoji-grid">
                    ${Array.from({length: 16}, (_, i) => 
                        `<div class="emoji-card" data-id="${i}">?</div>`
                    ).join('')}
                </div>
                <div class="game-controls">
                    <button class="game-btn new">New Game</button>
                    <button class="game-btn shuffle">Shuffle</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="emoji-themes">
                    <h4>Themes</h4>
                    <div class="theme-list">
                        <button class="theme-btn">Faces</button>
                        <button class="theme-btn">Animals</button>
                        <button class="theme-btn">Food</button>
                        <button class="theme-btn">Objects</button>
                        <button class="theme-btn">Mixed</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runAnimalSounds(context) {
        return `
            <div class="app-content animal-sounds">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="round">Round: 1</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                </div>
                <div class="sound-display">
                    <button class="play-sound">🔊 Play Sound</button>
                    <div class="animal-options">
                        <button class="animal-btn">🐶 Dog</button>
                        <button class="animal-btn">🐱 Cat</button>
                        <button class="animal-btn">🐮 Cow</button>
                        <button class="animal-btn">🐔 Chicken</button>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn new">New Sound</button>
                    <button class="game-btn reveal">Reveal</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="animal-list">
                    <h4>Animals</h4>
                    <div class="list">
                        <span>🐶</span><span>🐱</span><span>🐮</span><span>🐷</span>
                        <span>🐔</span><span>🦆</span><span>🦉</span><span>🐸</span>
                    </div>
                </div>
            </div>
        `;
    }

    async runMusicMemory(context) {
        return `
            <div class="app-content music-memory">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="level">Level: 1</div>
                    <div class="round">Round: 1</div>
                </div>
                <div class="music-display">
                    <div class="notes">🎵 🎵 🎵</div>
                    <button class="play-pattern">Play Pattern</button>
                </div>
                <div class="note-buttons">
                    ${['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => 
                        `<button class="note-btn" data-note="${note}">${note}</button>`
                    ).join('')}
                </div>
                <div class="game-controls">
                    <button class="game-btn repeat">Repeat</button>
                    <button class="game-btn submit">Submit</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="game-info">
                    <p>Listen to the pattern, then repeat it</p>
                    <p>Pattern length increases each level</p>
                </div>
            </div>
        `;
    }

    async runRhythmTapper(context) {
        return `
            <div class="app-content rhythm-tapper">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="combo">Combo: x1</div>
                    <div class="accuracy">Accuracy: 100%</div>
                </div>
                <div class="rhythm-area">
                    <div class="beat-line">
                        <div class="beat-marker"></div>
                    </div>
                    <div class="tap-zone">
                        <button class="tap-btn">TAP</button>
                    </div>
                </div>
                <div class="rhythm-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="rhythm-modes">
                    <h4>Difficulty</h4>
                    <div class="mode-list">
                        <button class="mode-btn">Easy</button>
                        <button class="mode-btn">Medium</button>
                        <button class="mode-btn">Hard</button>
                        <button class="mode-btn">Expert</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runColorBlind(context) {
        return `
            <div class="app-content color-blind">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="round">Round: 1</div>
                    <div class="time">Time: 0:00</div>
                </div>
                <div class="color-test">
                    <div class="color-shape" id="color-shape"></div>
                    <div class="question">What color is this?</div>
                    <div class="color-options">
                        <button class="color-option">Red</button>
                        <button class="color-option">Green</button>
                        <button class="color-option">Blue</button>
                        <button class="color-option">Yellow</button>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn new">New Color</button>
                    <button class="game-btn reveal">Reveal</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="test-info">
                    <p>Test your color perception</p>
                    <p>Choose the correct color name</p>
                </div>
            </div>
        `;
    }

    async runSpotTheDifference(context) {
        return `
            <div class="app-content spot-the-difference">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="found">Found: 0/5</div>
                    <div class="time">Time: 0:00</div>
                </div>
                <div class="difference-area">
                    <div class="image left">
                        <div class="difference-placeholder">Image A</div>
                    </div>
                    <div class="image right">
                        <div class="difference-placeholder">Image B</div>
                    </div>
                </div>
                <div class="difference-hint">
                    <p>Click on the differences between the two images</p>
                </div>
                <div class="game-controls">
                    <button class="game-btn new">New Puzzle</button>
                    <button class="game-btn hint">Hint</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="difficulty-options">
                    <h4>Difficulty</h4>
                    <div class="diff-list">
                        <button class="diff-btn">Easy (3)</button>
                        <button class="diff-btn">Medium (5)</button>
                        <button class="diff-btn">Hard (10)</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runHiddenObjects(context) {
        return `
            <div class="app-content hidden-objects">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="found">Found: 0/8</div>
                    <div class="time">Time: 3:00</div>
                </div>
                <div class="hidden-area">
                    <div class="scene">
                        <div class="object-list">
                            <div class="object-item">🔍</div>
                            <div class="object-item">🔑</div>
                            <div class="object-item">💎</div>
                            <div class="object-item">⭐</div>
                            <div class="object-item">🌟</div>
                            <div class="object-item">✨</div>
                            <div class="object-item">💫</div>
                            <div class="object-item">🔮</div>
                        </div>
                        <div class="find-list">
                            <h4>Find these:</h4>
                            <div class="items">🔍 🔑 💎 ⭐ 🌟 ✨ 💫 🔮</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn new">New Scene</button>
                    <button class="game-btn hint">Hint</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="game-info">
                    <p>Click on the hidden objects in the scene</p>
                    <p>Find all objects before time runs out</p>
                </div>
            </div>
        `;
    }

    async runJigsawPuzzle(context) {
        return `
            <div class="app-content jigsaw-puzzle">
                <div class="game-header">
                    <div class="pieces">Pieces: 0/25</div>
                    <div class="time">Time: 0:00</div>
                    <div class="moves">Moves: 0</div>
                </div>
                <div class="puzzle-area">
                    <div class="puzzle-board">
                        <div class="puzzle-placeholder">Complete the puzzle</div>
                    </div>
                    <div class="puzzle-pieces">
                        ${Array.from({length: 9}, (_, i) => 
                            `<div class="puzzle-piece" draggable="true">${i + 1}</div>`
                        ).join('')}
                    </div>
                </div>
                <div class="puzzle-controls">
                    <button class="game-btn new">New Puzzle</button>
                    <button class="game-btn shuffle">Shuffle</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="puzzle-difficulty">
                    <h4>Size</h4>
                    <div class="size-list">
                        <button class="size-btn">3x3</button>
                        <button class="size-btn">4x4</button>
                        <button class="size-btn">5x5</button>
                    </div>
                </div>
            </div>
        `;
    }

    async runSlidingPuzzle(context) {
        return `
            <div class="app-content sliding-puzzle">
                <div class="game-header">
                    <div class="moves">Moves: 0</div>
                    <div class="time">Time: 0:00</div>
                    <div class="best">Best: --</div>
                </div>
                <div class="puzzle-grid">
                    ${Array.from({length: 15}, (_, i) => 
                        `<div class="tile" data-value="${i + 1}">${i + 1}</div>`
                    ).join('')}
                    <div class="tile empty"></div>
                </div>
                <div class="puzzle-controls">
                    <button class="game-btn shuffle">Shuffle</button>
                    <button class="game-btn solve">Solve</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="puzzle-info">
                    <p>Click adjacent tiles to move them</p>
                    <p>Arrange numbers in order</p>
                </div>
            </div>
        `;
    }

    async runTowerDefense(context) {
        return `
            <div class="app-content tower-defense">
                <div class="game-header">
                    <div class="lives">Lives: 20</div>
                    <div class="money">Money: $500</div>
                    <div class="wave">Wave: 1</div>
                </div>
                <div class="game-area">
                    <div class="map">
                        <div class="path"></div>
                        <div class="tower-positions">
                            <div class="tower-slot"></div>
                            <div class="tower-slot"></div>
                            <div class="tower-slot"></div>
                        </div>
                    </div>
                </div>
                <div class="tower-shop">
                    <h4>Towers</h4>
                    <div class="tower-list">
                        <button class="tower-btn" data-cost="100">Basic ($100)</button>
                        <button class="tower-btn" data-cost="200">Sniper ($200)</button>
                        <button class="tower-btn" data-cost="150">Rapid ($150)</button>
                        <button class="tower-btn" data-cost="300">Heavy ($300)</button>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start Wave</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn speed">Speed x2</button>
                </div>
            </div>
        `;
    }

    async runSpaceShooter(context) {
        return `
            <div class="app-content space-shooter">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="space">
                        <div class="player-ship">🚀</div>
                        <div class="enemies">
                            <div class="enemy">👾</div>
                            <div class="enemy">👾</div>
                            <div class="enemy">👾</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>Use Arrow Keys to move</p>
                    <p>Press Space to shoot</p>
                </div>
            </div>
        `;
    }

    async runRunnerGame(context) {
        return `
            <div class="app-content runner-game">
                <div class="game-header">
                    <div class="score">Distance: 0m</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="speed">Speed: 1x</div>
                </div>
                <div class="game-area">
                    <div class="runner-track">
                        <div class="runner">🏃</div>
                        <div class="obstacles">
                            <div class="obstacle">🪨</div>
                            <div class="obstacle">🕳️</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn jump">Jump</button>
                    <button class="game-btn slide">Slide</button>
                </div>
                <div class="game-info">
                    <p>Press Jump to avoid obstacles</p>
                    <p>Press Slide to duck under barriers</p>
                </div>
            </div>
        `;
    }

    async runFlappyBird(context) {
        return `
            <div class="app-content flappy-bird">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="best">Best: 0</div>
                </div>
                <div class="game-area">
                    <div class="flappy-sky">
                        <div class="bird">🐦</div>
                        <div class="pipes">
                            <div class="pipe top"></div>
                            <div class="pipe bottom"></div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn flap">Flap</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="game-info">
                    <p>Click Flap or Space to fly</p>
                    <p>Avoid the pipes!</p>
                </div>
            </div>
        `;
    }

    async runTetris(context) {
        return `
            <div class="app-content tetris">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="level">Level: 1</div>
                    <div class="lines">Lines: 0</div>
                </div>
                <div class="game-area">
                    <div class="tetris-grid">
                        ${Array.from({length: 200}, (_, i) => `<div class="grid-cell"></div>`).join('')}
                    </div>
                    <div class="next-piece">
                        <h4>Next</h4>
                        <div class="preview"></div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>← → Move | ↑ Rotate | ↓ Drop</p>
                    <p>Space: Hard Drop</p>
                </div>
            </div>
        `;
    }

    async runPacman(context) {
        return `
            <div class="app-content pacman">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="pacman-maze">
                        <div class="pacman">😊</div>
                        <div class="ghosts">
                            <div class="ghost red">👻</div>
                            <div class="ghost pink">👻</div>
                            <div class="ghost cyan">👻</div>
                            <div class="ghost orange">👻</div>
                        </div>
                        <div class="dots">
                            ${Array.from({length: 20}, () => `<div class="dot">•</div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>Arrow keys to move</p>
                    <p>Eat dots, avoid ghosts</p>
                </div>
            </div>
        `;
    }

    async runBreakout(context) {
        return `
            <div class="app-content breakout">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="breakout-bricks">
                        ${Array.from({length: 30}, (_, i) => `<div class="brick"></div>`).join('')}
                    </div>
                    <div class="breakout-paddle"></div>
                    <div class="breakout-ball"></div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>← → Move paddle</p>
                    <p>Break all bricks!</p>
                </div>
            </div>
        `;
    }

    async runPong(context) {
        return `
            <div class="app-content pong">
                <div class="game-header">
                    <div class="score">Player: 0 | Computer: 0</div>
                    <div class="difficulty">Medium</div>
                </div>
                <div class="game-area">
                    <div class="pong-court">
                        <div class="paddle left"></div>
                        <div class="paddle right"></div>
                        <div class="ball"></div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>↑ ↓ Move paddle</p>
                    <p>First to 11 wins!</p>
                </div>
            </div>
        `;
    }

    async runAsteroids(context) {
        return `
            <div class="app-content asteroids">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="space">
                        <div class="ship">▲</div>
                        <div class="asteroids">
                            <div class="asteroid">🌑</div>
                            <div class="asteroid">🌑</div>
                            <div class="asteroid">🌑</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pause">Pause</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>↑ Thrust | ← → Rotate | Space Shoot</p>
                    <p>Destroy asteroids!</p>
                </div>
            </div>
        `;
    }

    async runSpaceInvadersMobile(context) {
        return `
            <div class="app-content space-invaders-mobile">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="invaders-space">
                        <div class="player">▲</div>
                        <div class="invaders-grid">
                            ${Array.from({length: 24}, (_, i) => `<div class="invader">👾</div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn shoot">Shoot</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>← → Move | Space Shoot</p>
                    <p>Defend Earth!</p>
                </div>
            </div>
        `;
    }

    async runGalaga(context) {
        return `
            <div class="app-content galaga">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="galaga-space">
                        <div class="ship">▲</div>
                        <div class="enemies">
                            <div class="enemy">🛸</div>
                            <div class="enemy">🛸</div>
                            <div class="enemy">🛸</div>
                            <div class="enemy">🛸</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn shoot">Shoot</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>← → Move | Space Shoot</p>
                    <p>Galaga style shooter</p>
                </div>
            </div>
        `;
    }

    async runCentipede(context) {
        return `
            <div class="app-content centipede">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="centipede-field">
                        <div class="shooter">▲</div>
                        <div class="centipede">
                            <div class="segment">🐛</div>
                            <div class="segment">🐛</div>
                            <div class="segment">🐛</div>
                        </div>
                        <div class="mushrooms">
                            <div class="mushroom">🍄</div>
                            <div class="mushroom">🍄</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn shoot">Shoot</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>← → Move | Space Shoot</p>
                    <p>Destroy the centipede!</p>
                </div>
            </div>
        `;
    }

    async runDonkeyKong(context) {
        return `
            <div class="app-content donkey-kong">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="dk-platforms">
                        <div class="mario">👨</div>
                        <div class="donkey-kong">🦍</div>
                        <div class="barrel">🛢️</div>
                        <div class="princess">👸</div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn jump">Jump</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>← → Move | ↑ Jump</p>
                    <p>Rescue the princess!</p>
                </div>
            </div>
        `;
    }

    async runMarioBros(context) {
        return `
            <div class="app-content mario-bros">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="coins">Coins: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                </div>
                <div class="game-area">
                    <div class="mario-world">
                        <div class="mario">👨</div>
                        <div class="platforms">
                            <div class="platform"></div>
                            <div class="platform"></div>
                        </div>
                        <div class="enemies">
                            <div class="enemy">🐢</div>
                            <div class="enemy">🍄</div>
                        </div>
                        <div class="coins">
                            <div class="coin">🪙</div>
                            <div class="coin">🪙</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn jump">Jump</button>
                    <button class="game-btn run">Run</button>
                </div>
                <div class="control-info">
                    <p>← → Move | ↑ Jump</p>
                    <p>Collect coins, avoid enemies</p>
                </div>
            </div>
        `;
    }

    async runFrogger(context) {
        return `
            <div class="app-content frogger">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="frogger-road">
                        <div class="frog">🐸</div>
                        <div class="cars">
                            <div class="car">🚗</div>
                            <div class="car">🚚</div>
                            <div class="car">🏎️</div>
                        </div>
                        <div class="logs">
                            <div class="log">🪵</div>
                            <div class="log">🪵</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn move">Move</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>Arrow keys to move</p>
                    <p>Cross the road safely!</p>
                </div>
            </div>
        `;
    }

    async runDigDug(context) {
        return `
            <div class="app-content dig-dug">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="dig-field">
                        <div class="digger">👨</div>
                        <div class="enemies">
                            <div class="enemy">🐛</div>
                            <div class="enemy">🐛</div>
                        </div>
                        <div class="rocks">
                            <div class="rock">🪨</div>
                            <div class="rock">🪨</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn pump">Pump</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>Arrow keys to move</p>
                    <p>Pump to defeat enemies</p>
                </div>
            </div>
        `;
    }

    async runQbert(context) {
        return `
            <div class="app-content qbert">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="qbert-pyramid">
                        <div class="qbert">👾</div>
                        <div class="coily">🐍</div>
                        <div class="squares">
                            ${Array.from({length: 28}, (_, i) => `<div class="square"></div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn jump">Jump</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>Q W E A S D Z X C to jump</p>
                    <p>Change all squares color</p>
                </div>
            </div>
        `;
    }

    async runDefender(context) {
        return `
            <div class="app-content defender">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="defender-space">
                        <div class="ship">◄</div>
                        <div class="aliens">
                            <div class="alien">👽</div>
                            <div class="alien">👽</div>
                            <div class="alien">👽</div>
                        </div>
                        <div class="humans">👨</div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn shoot">Shoot</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>← → Move | Space Shoot</p>
                    <p>Defend humans from aliens</p>
                </div>
            </div>
        `;
    }

    async runMissileCommand(context) {
        return `
            <div class="app-content missile-command">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="cities">Cities: ❤️❤️❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="missile-field">
                        <div class="cities">
                            <div class="city">🏙️</div>
                            <div class="city">🏙️</div>
                            <div class="city">🏙️</div>
                            <div class="city">🏙️</div>
                            <div class="city">🏙️</div>
                        </div>
                        <div class="silos">
                            <div class="silo">🚀</div>
                            <div class="silo">🚀</div>
                            <div class="silo">🚀</div>
                        </div>
                        <div class="incoming">
                            <div class="missile">☄️</div>
                            <div class="missile">☄️</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn launch">Launch</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>Click to launch interceptors</p>
                    <p>Protect the cities!</p>
                </div>
            </div>
        `;
    }

    async runBattleCity(context) {
        return `
            <div class="app-content battle-city">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="battle-field">
                        <div class="player-tank">▲</div>
                        <div class="enemy-tanks">
                            <div class="tank">▼</div>
                            <div class="tank">▼</div>
                        </div>
                        <div class="base">🏰</div>
                        <div class="walls">
                            <div class="wall"></div>
                            <div class="wall"></div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn shoot">Shoot</button>
                    <button class="game-btn reset">Reset</button>
                </div>
                <div class="control-info">
                    <p>Arrow keys to move</p>
                    <p>Space to shoot</p>
                    <p>Protect your base!</p>
                </div>
            </div>
        `;
    }

    async runContra(context) {
        return `
            <div class="app-content contra">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="contra-jungle">
                        <div class="player">▲</div>
                        <div class="enemies">
                            <div class="enemy">👮</div>
                            <div class="enemy">👮</div>
                        </div>
                        <div class="powerups">
                            <div class="powerup">⚡</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn shoot">Shoot</button>
                    <button class="game-btn jump">Jump</button>
                </div>
                <div class="control-info">
                    <p>Arrow keys to move</p>
                    <p>Space to shoot | ↑ to jump</p>
                    <p>Run and gun!</p>
                </div>
            </div>
        `;
    }

    async runDoubleDragon(context) {
        return `
            <div class="app-content double-dragon">
                <div class="game-header">
                    <div class="score">Score: 0</div>
                    <div class="lives">Lives: ❤️❤️❤️</div>
                    <div class="level">Level: 1</div>
                </div>
                <div class="game-area">
                    <div class="street">
                        <div class="player1">👨</div>
                        <div class="player2">👨</div>
                        <div class="enemies">
                            <div class="enemy">👊</div>
                            <div class="enemy">👊</div>
                        </div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn punch">Punch</button>
                    <button class="game-btn kick">Kick</button>
                </div>
                <div class="control-info">
                    <p>Arrow keys to move</p>
                    <p>A: Punch | S: Kick</p>
                    <p>Beat 'em up!</p>
                </div>
            </div>
        `;
    }

    async runStreetFighter(context) {
        return `
            <div class="app-content street-fighter">
                <div class="game-header">
                    <div class="health">Health: 100%</div>
                    <div class="round">Round: 1</div>
                    <div class="timer">99</div>
                </div>
                <div class="game-area">
                    <div class="arena">
                        <div class="fighter1">🥋</div>
                        <div class="fighter2">🥋</div>
                    </div>
                </div>
                <div class="game-controls">
                    <button class="game-btn start">Start</button>
                    <button class="game-btn punch">Punch</button>
                    <button class="game-btn kick">Kick</button>
                    <button class="game-btn special">Special</button>
                </div>
                <div class="control-info">
                    <p>Arrow keys to move</p>
                    <p>A: Punch | S: Kick | D: Special</p>
                    <p>K.O. your opponent!</p>
                </div>
            </div>
        `;
    }

    async runMortalKombat(context) {
        return `
            <div class="app-content mortal-kombat">
                <div class="game-header">
                    <div