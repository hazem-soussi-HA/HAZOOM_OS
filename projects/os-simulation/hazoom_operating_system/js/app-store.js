/**
 * Hazoom Operating System - App Store & Management System
 * Copyright © 2025 Hazem Soussi - All Rights Reserved
 * 
 * Complete application store with installation, updates, and management
 */

class HazoomAppStore {
    constructor() {
        this.installedApps = new Map();
        this.appRegistry = new Map();
        this.appDatabase = this.initializeAppDatabase();
        this.downloadQueue = [];
        this.updateManager = new AppUpdateManager();
        this.permissionManager = new AppPermissionManager();
        
        this.loadInstalledApps();
        this.initializeDefaultApps();
    }

    initializeAppDatabase() {
        return {
            // Productivity Apps
            'spreadsheet-pro': {
                id: 'spreadsheet-pro',
                name: 'Spreadsheet Pro',
                version: '1.2.0',
                category: 'productivity',
                type: 'desktop',
                icon: '📊',
                description: 'Advanced spreadsheet application with formulas, charts, and data analysis',
                developer: 'Hazoom Labs',
                size: '2.4 MB',
                price: 0,
                rating: 4.8,
                downloads: 12500,
                permissions: ['storage', 'clipboard'],
                features: ['Formulas', 'Charts', 'Data Import/Export', 'Collaboration'],
                screenshots: ['📊', '📈', '📋'],
                lastUpdated: '2024-12-10'
            },
            
            'design-studio': {
                id: 'design-studio',
                name: 'Design Studio',
                version: '2.0.1',
                category: 'creativity',
                type: 'desktop',
                icon: '🎨',
                description: 'Professional graphic design and vector editing tool',
                developer: 'Creative Tech',
                size: '4.8 MB',
                price: 0,
                rating: 4.6,
                downloads: 8900,
                permissions: ['storage', 'camera', 'clipboard'],
                features: ['Vector Graphics', 'Layers', 'Export Multiple Formats', 'Templates'],
                screenshots: ['🎨', '📐', '🖼️'],
                lastUpdated: '2024-12-08'
            },
            
            'code-editor': {
                id: 'code-editor',
                name: 'Code Editor',
                version: '3.1.0',
                category: 'development',
                type: 'desktop',
                icon: '💻',
                description: 'Advanced code editor with syntax highlighting and auto-completion',
                developer: 'DevTools Inc',
                size: '3.2 MB',
                price: 0,
                rating: 4.9,
                downloads: 25000,
                permissions: ['storage', 'clipboard', 'notifications'],
                features: ['Syntax Highlighting', 'Auto-completion', 'Multiple Languages', 'Git Integration'],
                screenshots: ['💻', '📝', '🔍'],
                lastUpdated: '2024-12-12'
            },
            
            'video-editor': {
                id: 'video-editor',
                name: 'Video Editor',
                version: '1.5.0',
                category: 'creativity',
                type: 'desktop',
                icon: '📹',
                description: 'Professional video editing suite with timeline and effects',
                developer: 'Media Labs',
                size: '5.6 MB',
                price: 0,
                rating: 4.5,
                downloads: 6700,
                permissions: ['storage', 'camera', 'microphone'],
                features: ['Timeline Editing', 'Effects & Transitions', 'Audio Mixing', 'Export HD'],
                screenshots: ['📹', '🎬', '🎵'],
                lastUpdated: '2024-12-05'
            },

            // Mobile Apps
            'social-messenger': {
                id: 'social-messenger',
                name: 'Social Messenger',
                version: '2.3.0',
                category: 'communication',
                type: 'mobile',
                icon: '💬',
                description: 'Instant messaging with end-to-end encryption',
                developer: 'Social Tech',
                size: '1.8 MB',
                price: 0,
                rating: 4.7,
                downloads: 50000,
                permissions: ['camera', 'microphone', 'storage', 'notifications'],
                features: ['End-to-End Encryption', 'Voice Messages', 'Group Chats', 'Stickers'],
                screenshots: ['💬', '👥', '🎭'],
                lastUpdated: '2024-12-11'
            },

            'fitness-tracker': {
                id: 'fitness-tracker',
                name: 'Fitness Tracker',
                version: '1.1.0',
                category: 'health',
                type: 'mobile',
                icon: '🏃',
                description: 'Track workouts, steps, and health metrics',
                developer: 'Health Apps',
                size: '2.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 4200,
                permissions: ['geolocation', 'sensors', 'storage', 'notifications'],
                features: ['Step Counter', 'GPS Tracking', 'Workout Plans', 'Progress Charts'],
                screenshots: ['🏃', '📊', '🎯'],
                lastUpdated: '2024-12-03'
            },

            'recipe-manager': {
                id: 'recipe-manager',
                name: 'Recipe Manager',
                version: '1.0.5',
                category: 'lifestyle',
                type: 'mobile',
                icon: '🍳',
                description: 'Organize recipes, meal planning, and shopping lists',
                developer: 'Kitchen Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.3,
                downloads: 3100,
                permissions: ['storage', 'camera'],
                features: ['Recipe Storage', 'Meal Planning', 'Shopping Lists', 'Camera Import'],
                screenshots: ['🍳', '📝', '🛒'],
                lastUpdated: '2024-11-28'
            },

            // Games
            'space-invaders': {
                id: 'space-invaders',
                name: 'Space Invaders',
                version: '1.0.0',
                category: 'games',
                type: 'desktop',
                icon: '🚀',
                description: 'Classic arcade space shooter',
                developer: 'Game Studio',
                size: '890 KB',
                price: 0,
                rating: 4.2,
                downloads: 15000,
                permissions: ['storage', 'sensors'],
                features: ['Classic Gameplay', 'High Scores', 'Multiple Levels', 'Touch Support'],
                screenshots: ['🚀', '👾', '⭐'],
                lastUpdated: '2024-12-01'
            },

            'puzzle-master': {
                id: 'puzzle-master',
                name: 'Puzzle Master',
                version: '2.1.0',
                category: 'games',
                type: 'mobile',
                icon: '🧩',
                description: 'Collection of brain-teasing puzzles and logic games',
                developer: 'Brain Games',
                size: '2.3 MB',
                price: 0,
                rating: 4.6,
                downloads: 8900,
                permissions: ['storage', 'notifications'],
                features: ['100+ Puzzles', 'Daily Challenges', 'Leaderboards', 'Hints System'],
                screenshots: ['🧩', '🎯', '🏆'],
                lastUpdated: '2024-12-09'
            },

            // Utilities
            'file-compressor': {
                id: 'file-compressor',
                name: 'File Compressor',
                version: '1.2.0',
                category: 'utilities',
                type: 'desktop',
                icon: '🗜️',
                description: 'Compress and decompress files with multiple formats',
                developer: 'Utility Labs',
                size: '1.1 MB',
                price: 0,
                rating: 4.5,
                downloads: 7200,
                permissions: ['storage'],
                features: ['ZIP/RAR Support', 'Batch Processing', 'Password Protection', 'Cloud Integration'],
                screenshots: ['🗜️', '📦', '🔐'],
                lastUpdated: '2024-12-06'
            },

            'calculator-plus': {
                id: 'calculator-plus',
                name: 'Calculator Plus',
                version: '1.3.0',
                category: 'utilities',
                type: 'mobile',
                icon: '🧮',
                description: 'Scientific calculator with advanced functions',
                developer: 'Math Apps',
                size: '980 KB',
                price: 0,
                rating: 4.8,
                downloads: 12000,
                permissions: ['storage'],
                features: ['Scientific Functions', 'Unit Conversion', 'History', 'Themes'],
                screenshots: ['🧮', '📊', '🎨'],
                lastUpdated: '2024-12-07'
            },

            // Entertainment
            'music-streamer': {
                id: 'music-streamer',
                name: 'Music Streamer',
                version: '1.4.0',
                category: 'entertainment',
                type: 'desktop',
                icon: '🎵',
                description: 'Stream and organize your music library',
                developer: 'Audio Tech',
                size: '2.7 MB',
                price: 0,
                rating: 4.4,
                downloads: 5400,
                permissions: ['storage', 'audio', 'notifications'],
                features: ['Playlist Management', 'Equalizer', 'Visualizations', 'Background Play'],
                screenshots: ['🎵', '🎛️', '🌈'],
                lastUpdated: '2024-12-04'
            },

            'movie-player': {
                id: 'movie-player',
                name: 'Movie Player',
                version: '1.1.0',
                category: 'entertainment',
                type: 'desktop',
                icon: '🎬',
                description: 'Video player with support for multiple formats',
                developer: 'Video Tech',
                size: '1.9 MB',
                price: 0,
                rating: 4.6,
                downloads: 6800,
                permissions: ['storage', 'fullscreen'],
                features: ['Multiple Formats', 'Subtitles', 'Playback Controls', 'Picture-in-Picture'],
                screenshots: ['🎬', '📺', '⏯️'],
                lastUpdated: '2024-12-02'
            },

            // Education
            'language-learner': {
                id: 'language-learner',
                name: 'Language Learner',
                version: '2.0.0',
                category: 'education',
                type: 'mobile',
                icon: '📚',
                description: 'Interactive language learning with flashcards and quizzes',
                developer: 'Edu Apps',
                size: '3.2 MB',
                price: 0,
                rating: 4.7,
                downloads: 9800,
                permissions: ['storage', 'audio', 'notifications'],
                features: ['Multiple Languages', 'Spaced Repetition', 'Audio Pronunciation', 'Progress Tracking'],
                screenshots: ['📚', '🎯', '🔊'],
                lastUpdated: '2024-12-10'
            },

            'math-tutor': {
                id: 'math-tutor',
                name: 'Math Tutor',
                version: '1.2.0',
                category: 'education',
                type: 'desktop',
                icon: '📐',
                description: 'Learn mathematics with interactive lessons',
                developer: 'Edu Labs',
                size: '2.4 MB',
                price: 0,
                rating: 4.5,
                downloads: 4500,
                permissions: ['storage', 'notifications'],
                features: ['Interactive Lessons', 'Practice Problems', 'Step-by-Step Solutions', 'Progress Reports'],
                screenshots: ['📐', '📊', '✅'],
                lastUpdated: '2024-12-08'
            },

            // Business
            'task-manager': {
                id: 'task-manager',
                name: 'Task Manager',
                version: '1.5.0',
                category: 'business',
                type: 'desktop',
                icon: '✅',
                description: 'Organize tasks, projects, and deadlines',
                developer: 'Productivity Co',
                size: '1.8 MB',
                price: 0,
                rating: 4.6,
                downloads: 11000,
                permissions: ['storage', 'notifications', 'clipboard'],
                features: ['Task Lists', 'Project Boards', 'Reminders', 'Collaboration'],
                screenshots: ['✅', '📋', '📅'],
                lastUpdated: '2024-12-11'
            },

            'invoice-generator': {
                id: 'invoice-generator',
                name: 'Invoice Generator',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '🧾',
                description: 'Create professional invoices and estimates',
                developer: 'Finance Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.4,
                downloads: 3200,
                permissions: ['storage', 'clipboard', 'print'],
                features: ['Template Library', 'PDF Export', 'Client Management', 'Payment Tracking'],
                screenshots: ['🧾', '💰', '📊'],
                lastUpdated: '2024-11-30'
            },

            // Security
            'password-vault': {
                id: 'password-vault',
                name: 'Password Vault',
                version: '1.3.0',
                category: 'security',
                type: 'desktop',
                icon: '🔐',
                description: 'Secure password manager with encryption',
                developer: 'Security Labs',
                size: '2.1 MB',
                price: 0,
                rating: 4.8,
                downloads: 7800,
                permissions: ['storage', 'clipboard', 'notifications'],
                features: ['AES-256 Encryption', 'Auto-fill', 'Password Generator', 'Sync'],
                screenshots: ['🔐', '🔑', '🛡️'],
                lastUpdated: '2024-12-09'
            },

            // Travel
            'travel-planner': {
                id: 'travel-planner',
                name: 'Travel Planner',
                version: '1.1.0',
                category: 'travel',
                type: 'mobile',
                icon: '✈️',
                description: 'Plan trips, itineraries, and travel budgets',
                developer: 'Travel Tech',
                size: '2.6 MB',
                price: 0,
                rating: 4.3,
                downloads: 2900,
                permissions: ['geolocation', 'storage', 'camera'],
                features: ['Itinerary Builder', 'Budget Tracker', 'Offline Maps', 'Photo Journal'],
                screenshots: ['✈️', '🗺️', '📸'],
                lastUpdated: '2024-12-01'
            },

            // Weather
            'weather-pro': {
                id: 'weather-pro',
                name: 'Weather Pro',
                version: '1.4.0',
                category: 'weather',
                type: 'mobile',
                icon: '☀️',
                description: 'Detailed weather forecasts and alerts',
                developer: 'Weather Labs',
                size: '1.9 MB',
                price: 0,
                rating: 4.7,
                downloads: 14000,
                permissions: ['geolocation', 'notifications'],
                features: ['7-Day Forecast', 'Radar Maps', 'Severe Alerts', 'Widgets'],
                screenshots: ['☀️', '🌧️', '🗺️'],
                lastUpdated: '2024-12-12'
            },

            // News
            'news-aggregator': {
                id: 'news-aggregator',
                name: 'News Aggregator',
                version: '1.2.0',
                category: 'news',
                type: 'desktop',
                icon: '📰',
                description: 'Personalized news from multiple sources',
                developer: 'Media Labs',
                size: '1.6 MB',
                price: 0,
                rating: 4.2,
                downloads: 5600,
                permissions: ['storage', 'notifications'],
                features: ['Custom Feeds', 'Offline Reading', 'Categories', 'Bookmarks'],
                screenshots: ['📰', '📌', '📚'],
                lastUpdated: '2024-12-06'
            },

            // Photography
            'photo-editor': {
                id: 'photo-editor',
                name: 'Photo Editor',
                version: '1.6.0',
                category: 'photography',
                type: 'desktop',
                icon: '📸',
                description: 'Professional photo editing with filters and effects',
                developer: 'Photo Tech',
                size: '3.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 9200,
                permissions: ['storage', 'camera'],
                features: ['Filters & Effects', 'Crop & Resize', 'Color Correction', 'Batch Processing'],
                screenshots: ['📸', '🎨', '✨'],
                lastUpdated: '2024-12-07'
            },

            // Finance
            'expense-tracker': {
                id: 'expense-tracker',
                name: 'Expense Tracker',
                version: '1.3.0',
                category: 'finance',
                type: 'mobile',
                icon: '💰',
                description: 'Track expenses and manage budgets',
                developer: 'Finance Apps',
                size: '1.7 MB',
                price: 0,
                rating: 4.5,
                downloads: 8700,
                permissions: ['storage', 'notifications'],
                features: ['Expense Logging', 'Budget Planning', 'Charts & Reports', 'Receipt Scanner'],
                screenshots: ['💰', '📊', '📈'],
                lastUpdated: '2024-12-04'
            },

            // Health
            'meditation-app': {
                id: 'meditation-app',
                name: 'Meditation App',
                version: '1.0.0',
                category: 'health',
                type: 'mobile',
                icon: '🧘',
                description: 'Guided meditation and mindfulness exercises',
                developer: 'Mindful Tech',
                size: '2.2 MB',
                price: 0,
                rating: 4.8,
                downloads: 6500,
                permissions: ['audio', 'storage', 'notifications'],
                features: ['Guided Sessions', 'Timer', 'Progress Tracking', 'Ambient Sounds'],
                screenshots: ['🧘', '🎵', '📊'],
                lastUpdated: '2024-12-03'
            },

            // Social
            'event-planner': {
                id: 'event-planner',
                name: 'Event Planner',
                version: '1.1.0',
                category: 'social',
                type: 'mobile',
                icon: '🎉',
                description: 'Plan and organize events with guests',
                developer: 'Social Apps',
                size: '1.9 MB',
                price: 0,
                rating: 4.4,
                downloads: 4100,
                permissions: ['storage', 'notifications', 'geolocation'],
                features: ['Guest Lists', 'RSVP Tracking', 'Venue Finder', 'Reminders'],
                screenshots: ['🎉', '📋', '📍'],
                lastUpdated: '2024-11-29'
            },

            // Developer Tools
            'api-tester': {
                id: 'api-tester',
                name: 'API Tester',
                version: '1.2.0',
                category: 'development',
                type: 'desktop',
                icon: '🔧',
                description: 'Test and debug REST APIs',
                developer: 'DevTools Inc',
                size: '2.3 MB',
                price: 0,
                rating: 4.7,
                downloads: 7300,
                permissions: ['storage', 'notifications'],
                features: ['Request Builder', 'Response Viewer', 'Headers Management', 'Collections'],
                screenshots: ['🔧', '🌐', '📊'],
                lastUpdated: '2024-12-10'
            },

            // Database Apps
            'database-manager': {
                id: 'database-manager',
                name: 'Database Manager',
                version: '1.0.0',
                category: 'development',
                type: 'desktop',
                icon: '🗄️',
                description: 'Manage databases with visual interface',
                developer: 'Data Labs',
                size: '2.8 MB',
                price: 0,
                rating: 4.5,
                downloads: 3400,
                permissions: ['storage', 'clipboard'],
                features: ['Query Builder', 'Table Viewer', 'Export/Import', 'Schema Editor'],
                screenshots: ['🗄️', '📊', '📝'],
                lastUpdated: '2024-12-02'
            },

            // Cloud Storage
            'cloud-drive': {
                id: 'cloud-drive',
                name: 'Cloud Drive',
                version: '1.4.0',
                category: 'utilities',
                type: 'desktop',
                icon: '☁️',
                description: 'Cloud file storage and synchronization',
                developer: 'Cloud Tech',
                size: '2.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 10500,
                permissions: ['storage', 'notifications'],
                features: ['File Sync', 'Share Links', 'Version History', 'Offline Access'],
                screenshots: ['☁️', '📁', '🔗'],
                lastUpdated: '2024-12-08'
            },

            // Note Taking
            'smart-notes': {
                id: 'smart-notes',
                name: 'Smart Notes',
                version: '1.5.0',
                category: 'productivity',
                type: 'mobile',
                icon: '📝',
                description: 'Advanced note-taking with organization',
                developer: 'Productivity Co',
                size: '1.6 MB',
                price: 0,
                rating: 4.7,
                downloads: 13200,
                permissions: ['storage', 'camera', 'clipboard'],
                features: ['Rich Text', 'Tags & Folders', 'Voice Notes', 'Search'],
                screenshots: ['📝', '🏷️', '🔍'],
                lastUpdated: '2024-12-11'
            },

            // Music Production
            'beat-maker': {
                id: 'beat-maker',
                name: 'Beat Maker',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🥁',
                description: 'Create music beats and melodies',
                developer: 'Audio Tech',
                size: '3.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 4800,
                permissions: ['audio', 'storage'],
                features: ['Drum Pads', 'Sequencer', 'Synthesizer', 'Export'],
                screenshots: ['🥁', '🎹', '🎵'],
                lastUpdated: '2024-12-05'
            },

            // Drawing
            'digital-canvas': {
                id: 'digital-canvas',
                name: 'Digital Canvas',
                version: '1.2.0',
                category: 'creativity',
                type: 'desktop',
                icon: '🎨',
                description: 'Digital drawing and painting application',
                developer: 'Creative Tech',
                size: '2.9 MB',
                price: 0,
                rating: 4.5,
                downloads: 6200,
                permissions: ['storage', 'camera'],
                features: ['Brush Library', 'Layers', 'Color Picker', 'Export'],
                screenshots: ['🎨', '🖌️', '🌈'],
                lastUpdated: '2024-12-06'
            },

            // Time Management
            'focus-timer': {
                id: 'focus-timer',
                name: 'Focus Timer',
                version: '1.1.0',
                category: 'productivity',
                type: 'desktop',
                icon: '⏱️',
                description: 'Pomodoro timer with productivity tracking',
                developer: 'Productivity Co',
                size: '980 KB',
                price: 0,
                rating: 4.8,
                downloads: 9500,
                permissions: ['notifications', 'storage'],
                features: ['Pomodoro Technique', 'Break Reminders', 'Stats & Analytics', 'Customizable'],
                screenshots: ['⏱️', '📊', '🎯'],
                lastUpdated: '2024-12-09'
            },

            // Language Tools
            'translator': {
                id: 'translator',
                name: 'Translator',
                version: '1.3.0',
                category: 'utilities',
                type: 'mobile',
                icon: '🌐',
                description: 'Real-time translation for 100+ languages',
                developer: 'Language Tech',
                size: '2.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 11800,
                permissions: ['storage', 'microphone', 'camera'],
                features: ['Text Translation', 'Voice Input', 'Camera Translate', 'Offline Mode'],
                screenshots: ['🌐', '🎤', '📷'],
                lastUpdated: '2024-12-10'
            },

            // Shopping
            'shopping-list': {
                id: 'shopping-list',
                name: 'Shopping List',
                version: '1.0.0',
                category: 'lifestyle',
                type: 'mobile',
                icon: '🛒',
                description: 'Smart shopping lists with categories',
                developer: 'Lifestyle Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 3800,
                permissions: ['storage', 'notifications'],
                features: ['Smart Categories', 'Price Tracking', 'Shared Lists', 'History'],
                screenshots: ['🛒', '📋', '💰'],
                lastUpdated: '2024-11-28'
            },

            // Sports
            'sports-tracker': {
                id: 'sports-tracker',
                name: 'Sports Tracker',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '⚽',
                description: 'Track sports activities and statistics',
                developer: 'Sports Tech',
                size: '1.8 MB',
                price: 0,
                rating: 4.4,
                downloads: 2900,
                permissions: ['geolocation', 'sensors', 'storage'],
                features: ['Activity Tracking', 'GPS Routes', 'Statistics', 'Achievements'],
                screenshots: ['⚽', '📊', '🏆'],
                lastUpdated: '2024-12-01'
            },

            // Books
            'ebook-reader': {
                id: 'ebook-reader',
                name: 'E-Book Reader',
                version: '1.2.0',
                category: 'books',
                type: 'desktop',
                icon: '📚',
                description: 'Read eBooks with customizable viewing',
                developer: 'Book Tech',
                size: '2.2 MB',
                price: 0,
                rating: 4.7,
                downloads: 8200,
                permissions: ['storage', 'clipboard'],
                features: ['Multiple Formats', 'Custom Themes', 'Bookmarks', 'Annotations'],
                screenshots: ['📚', '📖', '🔖'],
                lastUpdated: '2024-12-07'
            },

            // Cooking
            'recipe-scanner': {
                id: 'recipe-scanner',
                name: 'Recipe Scanner',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🍳',
                description: 'Scan and digitize paper recipes',
                developer: 'Kitchen Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.2,
                downloads: 2100,
                permissions: ['camera', 'storage'],
                features: ['OCR Scanning', 'Auto-Categorize', 'Ingredient Lists', 'Cooking Timer'],
                screenshots: ['🍳', '📷', '⏱️'],
                lastUpdated: '2024-11-30'
            },

            // Gardening
            'plant-care': {
                id: 'plant-care',
                name: 'Plant Care',
                version: '1.0.0',
                category: 'lifestyle',
                type: 'mobile',
                icon: '🌱',
                description: 'Track plant care and watering schedules',
                developer: 'Nature Apps',
                size: '1.3 MB',
                price: 0,
                rating: 4.5,
                downloads: 3400,
                permissions: ['storage', 'camera', 'notifications'],
                features: ['Plant Database', 'Watering Reminders', 'Photo Journal', 'Tips'],
                screenshots: ['🌱', '💧', '📸'],
                lastUpdated: '2024-12-02'
            },

            // Astronomy
            'star-gazer': {
                id: 'star-gazer',
                name: 'Star Gazer',
                version: '1.1.0',
                category: 'education',
                type: 'mobile',
                icon: '🔭',
                description: 'Identify stars and constellations',
                developer: 'Space Apps',
                size: '2.6 MB',
                price: 0,
                rating: 4.6,
                downloads: 5200,
                permissions: ['geolocation', 'camera', 'sensors'],
                features: ['Star Map', 'Planet Tracker', 'Night Mode', 'Astronomy Facts'],
                screenshots: ['🔭', '⭐', '🌌'],
                lastUpdated: '2024-12-08'
            },

            // Meditation
            'breathing-exercises': {
                id: 'breathing-exercises',
                name: 'Breathing Exercises',
                version: '1.0.0',
                category: 'health',
                type: 'mobile',
                icon: '🫁',
                description: 'Guided breathing exercises for relaxation',
                developer: 'Mindful Tech',
                size: '980 KB',
                price: 0,
                rating: 4.7,
                downloads: 4600,
                permissions: ['audio', 'notifications'],
                features: ['Multiple Techniques', 'Visual Guides', 'Timer', 'Progress'],
                screenshots: ['🫁', '🧘', '📊'],
                lastUpdated: '2024-12-03'
            },

            // Pets
            'pet-tracker': {
                id: 'pet-tracker',
                name: 'Pet Tracker',
                version: '1.0.0',
                category: 'lifestyle',
                type: 'mobile',
                icon: '🐾',
                description: 'Track pet health and activities',
                developer: 'Pet Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.3,
                downloads: 2800,
                permissions: ['storage', 'camera', 'notifications'],
                features: ['Health Records', 'Vaccine Reminders', 'Photo Gallery', 'Weight Tracker'],
                screenshots: ['🐾', '🏥', '📸'],
                lastUpdated: '2024-11-29'
            },

            // Gardening
            'plant-identifier': {
                id: 'plant-identifier',
                name: 'Plant Identifier',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🌿',
                description: 'Identify plants using camera',
                developer: 'Nature Apps',
                size: '2.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 3900,
                permissions: ['camera', 'storage'],
                features: ['AI Identification', 'Plant Database', 'Care Tips', 'Save History'],
                screenshots: ['🌿', '📷', 'ℹ️'],
                lastUpdated: '2024-12-04'
            },

            // Astronomy
            'night-sky': {
                id: 'night-sky',
                name: 'Night Sky',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🌟',
                description: 'Explore the night sky and celestial objects',
                developer: 'Space Apps',
                size: '2.8 MB',
                price: 0,
                rating: 4.5,
                downloads: 4100,
                permissions: ['geolocation', 'sensors', 'camera'],
                features: ['Star Map', 'Satellite Tracker', 'Event Alerts', 'AR Mode'],
                screenshots: ['🌟', '🛰️', '📱'],
                lastUpdated: '2024-12-05'
            },

            // Cooking
            'meal-planner': {
                id: 'meal-planner',
                name: 'Meal Planner',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🥗',
                description: 'Plan weekly meals and nutrition',
                developer: 'Health Apps',
                size: '1.7 MB',
                price: 0,
                rating: 4.6,
                downloads: 5300,
                permissions: ['storage', 'notifications'],
                features: ['Weekly Planning', 'Nutrition Info', 'Shopping List', 'Recipes'],
                screenshots: ['🥗', '📅', '🛒'],
                lastUpdated: '2024-12-06'
            },

            // Finance
            'investment-tracker': {
                id: 'investment-tracker',
                name: 'Investment Tracker',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '📈',
                description: 'Track investments and portfolio performance',
                developer: 'Finance Apps',
                size: '2.3 MB',
                price: 0,
                rating: 4.4,
                downloads: 3200,
                permissions: ['storage', 'notifications'],
                features: ['Portfolio View', 'Performance Charts', 'Alerts', 'Reports'],
                screenshots: ['📈', '📊', '💰'],
                lastUpdated: '2024-12-07'
            },

            // Music
            'lyrics-finder': {
                id: 'lyrics-finder',
                name: 'Lyrics Finder',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🎵',
                description: 'Find song lyrics and sync with music',
                developer: 'Audio Tech',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 4700,
                permissions: ['storage', 'audio'],
                features: ['Search Lyrics', 'Sync with Music', 'Favorites', 'Offline Mode'],
                screenshots: ['🎵', '📝', '⭐'],
                lastUpdated: '2024-12-01'
            },

            // Photography
            'photo-collage': {
                id: 'photo-collage',
                name: 'Photo Collage',
                version: '1.0.0',
                category: 'photography',
                type: 'mobile',
                icon: '🖼️',
                description: 'Create beautiful photo collages',
                developer: 'Photo Tech',
                size: '1.9 MB',
                price: 0,
                rating: 4.5,
                downloads: 6100,
                permissions: ['storage', 'camera'],
                features: ['Templates', 'Custom Layouts', 'Stickers', 'Sharing'],
                screenshots: ['🖼️', '🎨', '📤'],
                lastUpdated: '2024-12-02'
            },

            // Weather
            'storm-tracker': {
                id: 'storm-tracker',
                name: 'Storm Tracker',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '⛈️',
                description: 'Real-time severe weather tracking',
                developer: 'Weather Labs',
                size: '2.4 MB',
                price: 0,
                rating: 4.7,
                downloads: 5800,
                permissions: ['geolocation', 'notifications'],
                features: ['Radar Maps', 'Storm Alerts', 'Forecast', 'Safety Tips'],
                screenshots: ['⛈️', '🗺️', '⚠️'],
                lastUpdated: '2024-12-08'
            },

            // Education
            'flashcards': {
                id: 'flashcards',
                name: 'Flashcards',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🎴',
                description: 'Create and study flashcards',
                developer: 'Edu Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 7200,
                permissions: ['storage', 'notifications'],
                features: ['Card Creation', 'Spaced Repetition', 'Decks', 'Progress'],
                screenshots: ['🎴', '📚', '📊'],
                lastUpdated: '2024-12-03'
            },

            // Business
            'meeting-scheduler': {
                id: 'meeting-scheduler',
                name: 'Meeting Scheduler',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '📅',
                description: 'Schedule meetings and manage calendar',
                developer: 'Productivity Co',
                size: '1.6 MB',
                price: 0,
                rating: 4.4,
                downloads: 4300,
                permissions: ['storage', 'notifications'],
                features: ['Calendar View', 'Meeting Rooms', 'Invites', 'Reminders'],
                screenshots: ['📅', '👥', '✉️'],
                lastUpdated: '2024-12-04'
            },

            // Security
            'secure-notes': {
                id: 'secure-notes',
                name: 'Secure Notes',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '🔒',
                description: 'Encrypted notes and sensitive information',
                developer: 'Security Labs',
                size: '1.3 MB',
                price: 0,
                rating: 4.8,
                downloads: 6500,
                permissions: ['storage', 'clipboard'],
                features: ['AES-256 Encryption', 'Password Protection', 'Categories', 'Search'],
                screenshots: ['🔒', '📝', '🔍'],
                lastUpdated: '2024-12-05'
            },

            // Travel
            'budget-tracker': {
                id: 'budget-tracker',
                name: 'Budget Tracker',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '💵',
                description: 'Track travel expenses and budgets',
                developer: 'Travel Tech',
                size: '1.4 MB',
                price: 0,
                rating: 4.3,
                downloads: 2900,
                permissions: ['storage', 'notifications'],
                features: ['Expense Logging', 'Budget Limits', 'Currency Converter', 'Reports'],
                screenshots: ['💵', '📊', '💱'],
                lastUpdated: '2024-12-01'
            },

            // News
            'podcast-player': {
                id: 'podcast-player',
                name: 'Podcast Player',
                version: '1.0.0',
                category: 'entertainment',
                type: 'desktop',
                icon: '🎙️',
                description: 'Listen to podcasts with advanced features',
                developer: 'Audio Tech',
                size: '1.8 MB',
                price: 0,
                rating: 4.6,
                downloads: 5400,
                permissions: ['audio', 'storage', 'notifications'],
                features: ['Subscriptions', 'Speed Control', 'Sleep Timer', 'Offline'],
                screenshots: ['🎙️', '🎧', '⏰'],
                lastUpdated: '2024-12-06'
            },

            // Sports
            'workout-tracker': {
                id: 'workout-tracker',
                name: 'Workout Tracker',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '💪',
                description: 'Track workouts and fitness progress',
                developer: 'Fitness Apps',
                size: '1.9 MB',
                price: 0,
                rating: 4.5,
                downloads: 6800,
                permissions: ['sensors', 'storage', 'notifications'],
                features: ['Exercise Library', 'Progress Charts', 'Timer', 'Achievements'],
                screenshots: ['💪', '📊', '🏆'],
                lastUpdated: '2024-12-07'
            },

            // Books
            'book-club': {
                id: 'book-club',
                name: 'Book Club',
                version: '1.0.0',
                category: 'books',
                type: 'mobile',
                icon: '📖',
                description: 'Organize book clubs and reading lists',
                developer: 'Book Tech',
                size: '1.5 MB',
                price: 0,
                rating: 4.4,
                downloads: 3100,
                permissions: ['storage', 'notifications'],
                features: ['Reading Lists', 'Discussion Forums', 'Progress Tracking', 'Recommendations'],
                screenshots: ['📖', '💬', '📚'],
                lastUpdated: '2024-12-02'
            },

            // Food
            'nutrition-tracker': {
                id: 'nutrition-tracker',
                name: 'Nutrition Tracker',
                version: '1.0.0',
                category: 'health',
                type: 'mobile',
                icon: '🥗',
                description: 'Track daily nutrition and calories',
                developer: 'Health Apps',
                size: '2.0 MB',
                price: 0,
                rating: 4.6,
                downloads: 7500,
                permissions: ['storage', 'camera', 'notifications'],
                features: ['Food Database', 'Calorie Counter', 'Macro Tracking', 'Goals'],
                screenshots: ['🥗', '📊', '🎯'],
                lastUpdated: '2024-12-03'
            },

            // Nature
            'bird-watcher': {
                id: 'bird-watcher',
                name: 'Bird Watcher',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🦅',
                description: 'Identify and track bird sightings',
                developer: 'Nature Apps',
                size: '2.2 MB',
                price: 0,
                rating: 4.5,
                downloads: 2800,
                permissions: ['camera', 'geolocation', 'storage'],
                features: ['Bird Database', 'Photo ID', 'Location Logging', 'Life List'],
                screenshots: ['🦅', '📷', '📍'],
                lastUpdated: '2024-12-04'
            },

            // Space
            'iss-tracker': {
                id: 'iss-tracker',
                name: 'ISS Tracker',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🛰️',
                description: 'Track International Space Station',
                developer: 'Space Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.7,
                downloads: 4900,
                permissions: ['geolocation', 'notifications'],
                features: ['Real-time Position', 'Pass Alerts', 'Crew Info', '3D View'],
                screenshots: ['🛰️', '🌍', '👥'],
                lastUpdated: '2024-12-05'
            },

            // Cooking
            'baking-companion': {
                id: 'baking-companion',
                name: 'Baking Companion',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🍞',
                description: 'Baking recipes and timer',
                developer: 'Kitchen Apps',
                size: '1.6 MB',
                price: 0,
                rating: 4.4,
                downloads: 3600,
                permissions: ['storage', 'notifications'],
                features: ['Baking Recipes', 'Unit Converter', 'Timer', 'Tips'],
                screenshots: ['🍞', '⏱️', '📐'],
                lastUpdated: '2024-12-06'
            },

            // Finance
            'crypto-tracker': {
                id: 'crypto-tracker',
                name: 'Crypto Tracker',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '₿',
                description: 'Track cryptocurrency prices and portfolio',
                developer: 'Finance Apps',
                size: '1.9 MB',
                price: 0,
                rating: 4.3,
                downloads: 5200,
                permissions: ['storage', 'notifications'],
                features: ['Price Alerts', 'Portfolio Manager', 'Charts', 'News'],
                screenshots: ['₿', '📈', '📰'],
                lastUpdated: '2024-12-07'
            },

            // Music
            'dj-mixer': {
                id: 'dj-mixer',
                name: 'DJ Mixer',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🎧',
                description: 'Mix music and create DJ sets',
                developer: 'Audio Tech',
                size: '2.7 MB',
                price: 0,
                rating: 4.2,
                downloads: 4100,
                permissions: ['audio', 'storage'],
                features: ['Dual Decks', 'Effects', 'Crossfader', 'Recording'],
                screenshots: ['🎧', '🎚️', '🎵'],
                lastUpdated: '2024-12-01'
            },

            // Photography
            'screenshot-tool': {
                id: 'screenshot-tool',
                name: 'Screenshot Tool',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '📸',
                description: 'Capture and annotate screenshots',
                developer: 'Photo Tech',
                size: '1.2 MB',
                price: 0,
                rating: 4.6,
                downloads: 8900,
                permissions: ['storage', 'clipboard'],
                features: ['Screen Capture', 'Annotations', 'Blur Tool', 'Sharing'],
                screenshots: ['📸', '✏️', '📤'],
                lastUpdated: '2024-12-02'
            },

            // Weather
            'air-quality': {
                id: 'air-quality',
                name: 'Air Quality',
                version: '1.0.0',
                category: 'weather',
                type: 'mobile',
                icon: '🌫️',
                description: 'Real-time air quality monitoring',
                developer: 'Weather Labs',
                size: '1.3 MB',
                price: 0,
                rating: 4.5,
                downloads: 4200,
                permissions: ['geolocation', 'notifications'],
                features: ['AQI Index', 'Pollutant Data', 'Health Tips', 'Alerts'],
                screenshots: ['🌫️', '📊', '⚠️'],
                lastUpdated: '2024-12-03'
            },

            // Education
            'typing-tutor': {
                id: 'typing-tutor',
                name: 'Typing Tutor',
                version: '1.0.0',
                category: 'education',
                type: 'desktop',
                icon: '⌨️',
                description: 'Learn touch typing with exercises',
                developer: 'Edu Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.7,
                downloads: 6700,
                permissions: ['storage', 'notifications'],
                features: ['Lessons', 'Practice Mode', 'Progress Tracking', 'Games'],
                screenshots: ['⌨️', '📊', '🎯'],
                lastUpdated: '2024-12-04'
            },

            // Business
            'invoice-designer': {
                id: 'invoice-designer',
                name: 'Invoice Designer',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '🎨',
                description: 'Design custom invoice templates',
                developer: 'Finance Apps',
                size: '1.8 MB',
                price: 0,
                rating: 4.4,
                downloads: 2900,
                permissions: ['storage', 'print'],
                features: ['Template Editor', 'Branding', 'PDF Export', 'Client DB'],
                screenshots: ['🎨', '🧾', '💾'],
                lastUpdated: '2024-12-05'
            },

            // Security
            'password-generator': {
                id: 'password-generator',
                name: 'Password Generator',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '🔑',
                description: 'Generate strong secure passwords',
                developer: 'Security Labs',
                size: '890 KB',
                price: 0,
                rating: 4.8,
                downloads: 9200,
                permissions: ['clipboard'],
                features: ['Custom Rules', 'Strength Check', 'Copy to Clipboard', 'History'],
                screenshots: ['🔑', '📊', '📋'],
                lastUpdated: '2024-12-06'
            },

            // Travel
            'currency-converter': {
                id: 'currency-converter',
                name: 'Currency Converter',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '💱',
                description: 'Real-time currency conversion',
                developer: 'Travel Tech',
                size: '1.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 7800,
                permissions: ['storage', 'notifications'],
                features: ['100+ Currencies', 'Offline Mode', 'Favorites', 'Charts'],
                screenshots: ['💱', '📊', '⭐'],
                lastUpdated: '2024-12-07'
            },

            // News
            'rss-reader': {
                id: 'rss-reader',
                name: 'RSS Reader',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '📡',
                description: 'Read RSS feeds with clean interface',
                developer: 'Media Labs',
                size: '1.5 MB',
                price: 0,
                rating: 4.3,
                downloads: 4500,
                permissions: ['storage', 'notifications'],
                features: ['Feed Management', 'Offline Reading', 'Search', 'Bookmarks'],
                screenshots: ['📡', '📰', '🔖'],
                lastUpdated: '2024-12-01'
            },

            // Sports
            'score-tracker': {
                id: 'score-tracker',
                name: 'Score Tracker',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '🏆',
                description: 'Track scores for any sport',
                developer: 'Sports Tech',
                size: '1.2 MB',
                price: 0,
                rating: 4.4,
                downloads: 3400,
                permissions: ['storage', 'notifications'],
                features: ['Multiple Sports', 'Live Updates', 'Statistics', 'History'],
                screenshots: ['🏆', '📊', '📈'],
                lastUpdated: '2024-12-02'
            },

            // Books
            'audiobook-player': {
                id: 'audiobook-player',
                name: 'Audiobook Player',
                version: '1.0.0',
                category: 'books',
                type: 'mobile',
                icon: '🎧',
                description: 'Listen to audiobooks with advanced controls',
                developer: 'Book Tech',
                size: '1.6 MB',
                price: 0,
                rating: 4.5,
                downloads: 5600,
                permissions: ['audio', 'storage', 'notifications'],
                features: ['Speed Control', 'Sleep Timer', 'Bookmarks', 'Chapters'],
                screenshots: ['🎧', '📖', '⏰'],
                lastUpdated: '2024-12-03'
            },

            // Food
            'restaurant-finder': {
                id: 'restaurant-finder',
                name: 'Restaurant Finder',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🍴',
                description: 'Find restaurants and reviews',
                developer: 'Food Apps',
                size: '1.9 MB',
                price: 0,
                rating: 4.2,
                downloads: 4100,
                permissions: ['geolocation', 'camera', 'storage'],
                features: ['Nearby Search', 'Reviews', 'Photos', 'Bookmarks'],
                screenshots: ['🍴', '📍', '⭐'],
                lastUpdated: '2024-12-04'
            },

            // Nature
            'weather-forecast': {
                id: 'weather-forecast',
                name: 'Weather Forecast',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '☀️',
                description: 'Detailed weather forecasts and alerts',
                developer: 'Weather Labs',
                size: '2.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 8700,
                permissions: ['geolocation', 'notifications'],
                features: ['7-Day Forecast', 'Radar', 'Alerts', 'Widgets'],
                screenshots: ['☀️', '🌧️', '🗺️'],
                lastUpdated: '2024-12-05'
            },

            // Space
            'meteor-shower': {
                id: 'meteor-shower',
                name: 'Meteor Shower',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '☄️',
                description: 'Track meteor showers and celestial events',
                developer: 'Space Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.5,
                downloads: 3200,
                permissions: ['geolocation', 'notifications'],
                features: ['Event Calendar', 'Alerts', 'Visibility Maps', 'Tips'],
                screenshots: ['☄️', '📅', '🌌'],
                lastUpdated: '2024-12-06'
            },

            // Cooking
            'kitchen-timer': {
                id: 'kitchen-timer',
                name: 'Kitchen Timer',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '⏲️',
                description: 'Multi-task kitchen timer',
                developer: 'Kitchen Apps',
                size: '980 KB',
                price: 0,
                rating: 4.7,
                downloads: 6500,
                permissions: ['audio', 'notifications'],
                features: ['Multiple Timers', 'Presets', 'Alarm Sounds', 'Background'],
                screenshots: ['⏲️', '🔔', '📋'],
                lastUpdated: '2024-12-07'
            },

            // Finance
            'loan-calculator': {
                id: 'loan-calculator',
                name: 'Loan Calculator',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '💰',
                description: 'Calculate loan payments and interest',
                developer: 'Finance Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 5400,
                permissions: ['storage'],
                features: ['Mortgage Calculator', 'Amortization', 'Interest Rates', 'Export'],
                screenshots: ['💰', '📊', '📈'],
                lastUpdated: '2024-12-01'
            },

            // Music
            'metronome': {
                id: 'metronome',
                name: 'Metronome',
                version: '1.0.0',
                category: 'music',
                type: 'mobile',
                icon: '🎵',
                description: 'Practice with precise timing',
                developer: 'Audio Tech',
                size: '890 KB',
                price: 0,
                rating: 4.8,
                downloads: 7200,
                permissions: ['audio'],
                features: ['BPM Control', 'Time Signatures', 'Visual Beat', 'Presets'],
                screenshots: ['🎵', '⏱️', '📊'],
                lastUpdated: '2024-12-02'
            },

            // Photography
            'color-picker': {
                id: 'color-picker',
                name: 'Color Picker',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '🎨',
                description: 'Extract colors from images',
                developer: 'Photo Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.4,
                downloads: 4300,
                permissions: ['storage'],
                features: ['Image Upload', 'Color Palette', 'HEX/RGB', 'Export'],
                screenshots: ['🎨', '🌈', '💾'],
                lastUpdated: '2024-12-03'
            },

            // Weather
            'uv-index': {
                id: 'uv-index',
                name: 'UV Index',
                version: '1.0.0',
                category: 'weather',
                type: 'mobile',
                icon: '☀️',
                description: 'Real-time UV radiation levels',
                developer: 'Weather Labs',
                size: '980 KB',
                price: 0,
                rating: 4.5,
                downloads: 4800,
                permissions: ['geolocation', 'notifications'],
                features: ['Current UV', 'Protection Tips', 'Alerts', 'Forecast'],
                screenshots: ['☀️', '📊', '⚠️'],
                lastUpdated: '2024-12-04'
            },

            // Education
            'math-puzzles': {
                id: 'math-puzzles',
                name: 'Math Puzzles',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🧮',
                description: 'Math puzzles for all ages',
                developer: 'Edu Apps',
                size: '1.3 MB',
                price: 0,
                rating: 4.6,
                downloads: 6100,
                permissions: ['storage', 'notifications'],
                features: ['Multiple Levels', 'Timed Challenges', 'Leaderboard', 'Hints'],
                screenshots: ['🧮', '🎯', '🏆'],
                lastUpdated: '2024-12-05'
            },

            // Business
            'time-tracker': {
                id: 'time-tracker',
                name: 'Time Tracker',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '⏰',
                description: 'Track time spent on projects',
                developer: 'Productivity Co',
                size: '1.2 MB',
                price: 0,
                rating: 4.7,
                downloads: 5900,
                permissions: ['storage', 'notifications'],
                features: ['Project Tracking', 'Reports', 'Timer', 'Export'],
                screenshots: ['⏰', '📊', '📤'],
                lastUpdated: '2024-12-06'
            },

            // Security
            'data-encryptor': {
                id: 'data-encryptor',
                name: 'Data Encryptor',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '🔐',
                description: 'Encrypt and decrypt files',
                developer: 'Security Labs',
                size: '1.5 MB',
                price: 0,
                rating: 4.8,
                downloads: 7100,
                permissions: ['storage'],
                features: ['AES-256', 'Batch Processing', 'Secure Deletion', 'Key Management'],
                screenshots: ['🔐', '📁', '🔑'],
                lastUpdated: '2024-12-07'
            },

            // Travel
            'packing-list': {
                id: 'packing-list',
                name: 'Packing List',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '🧳',
                description: 'Smart packing lists for trips',
                developer: 'Travel Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.4,
                downloads: 3800,
                permissions: ['storage', 'notifications'],
                features: ['Templates', 'Custom Lists', 'Weather-based', 'Sharing'],
                screenshots: ['🧳', '📋', '🌤️'],
                lastUpdated: '2024-12-01'
            },

            // News
            'headlines': {
                id: 'headlines',
                name: 'Headlines',
                version: '1.0.0',
                category: 'news',
                type: 'mobile',
                icon: '📰',
                description: 'Breaking news headlines',
                developer: 'Media Labs',
                size: '1.1 MB',
                price: 0,
                rating: 4.3,
                downloads: 5200,
                permissions: ['storage', 'notifications'],
                features: ['Breaking News', 'Categories', 'Offline', 'Bookmarks'],
                screenshots: ['📰', '⚡', '📌'],
                lastUpdated: '2024-12-02'
            },

            // Sports
            'fitness-challenges': {
                id: 'fitness-challenges',
                name: 'Fitness Challenges',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '🎯',
                description: 'Join fitness challenges and goals',
                developer: 'Fitness Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.5,
                downloads: 4200,
                permissions: ['sensors', 'storage', 'notifications'],
                features: ['Challenges', 'Progress', 'Rewards', 'Community'],
                screenshots: ['🎯', '📊', '🏆'],
                lastUpdated: '2024-12-03'
            },

            // Books
            'book-recommendations': {
                id: 'book-recommendations',
                name: 'Book Recommendations',
                version: '1.0.0',
                category: 'books',
                type: 'desktop',
                icon: '📚',
                description: 'Discover new books to read',
                developer: 'Book Tech',
                size: '1.6 MB',
                price: 0,
                rating: 4.6,
                downloads: 4900,
                permissions: ['storage'],
                features: ['Personalized Picks', 'Genres', 'Ratings', 'Wishlist'],
                screenshots: ['📚', '⭐', '📝'],
                lastUpdated: '2024-12-04'
            },

            // Food
            'calorie-calculator': {
                id: 'calorie-calculator',
                name: 'Calorie Calculator',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🔢',
                description: 'Calculate daily calorie needs',
                developer: 'Health Apps',
                size: '980 KB',
                price: 0,
                rating: 4.4,
                downloads: 5600,
                permissions: ['storage'],
                features: ['BMR Calculator', 'Activity Levels', 'Goals', 'Tips'],
                screenshots: ['🔢', '📊', '🎯'],
                lastUpdated: '2024-12-05'
            },

            // Nature
            'plant-care-reminders': {
                id: 'plant-care-reminders',
                name: 'Plant Care Reminders',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🪴',
                description: 'Reminders for plant care',
                developer: 'Nature Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 3900,
                permissions: ['storage', 'notifications', 'camera'],
                features: ['Watering Reminders', 'Plant Database', 'Photos', 'Tips'],
                screenshots: ['🪴', '💧', '📸'],
                lastUpdated: '2024-12-06'
            },

            // Space
            'moon-phase': {
                id: 'moon-phase',
                name: 'Moon Phase',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🌙',
                description: 'Track moon phases and lunar cycles',
                developer: 'Space Apps',
                size: '980 KB',
                price: 0,
                rating: 4.7,
                downloads: 5400,
                permissions: ['geolocation', 'notifications'],
                features: ['Current Phase', 'Calendar', 'Eclipse Alerts', 'Info'],
                screenshots: ['🌙', '📅', 'ℹ️'],
                lastUpdated: '2024-12-07'
            },

            // Cooking
            'recipe-finder': {
                id: 'recipe-finder',
                name: 'Recipe Finder',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '🔍',
                description: 'Search recipes by ingredients',
                developer: 'Kitchen Apps',
                size: '1.8 MB',
                price: 0,
                rating: 4.5,
                downloads: 6200,
                permissions: ['storage'],
                features: ['Ingredient Search', 'Filters', 'Favorites', 'Shopping List'],
                screenshots: ['🔍', '🍳', '🛒'],
                lastUpdated: '2024-12-01'
            },

            // Finance
            'tax-calculator': {
                id: 'tax-calculator',
                name: 'Tax Calculator',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '💵',
                description: 'Calculate taxes and deductions',
                developer: 'Finance Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.4,
                downloads: 4100,
                permissions: ['storage'],
                features: ['Income Tax', 'Deductions', 'Refund Estimator', 'Reports'],
                screenshots: ['💵', '📊', '📈'],
                lastUpdated: '2024-12-02'
            },

            // Music
            'guitar-tuner': {
                id: 'guitar-tuner',
                name: 'Guitar Tuner',
                version: '1.0.0',
                category: 'music',
                type: 'mobile',
                icon: '🎸',
                description: 'Tune your guitar with precision',
                developer: 'Audio Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.8,
                downloads: 8300,
                permissions: ['audio'],
                features: ['Auto Tuning', 'Multiple Instruments', 'Visual Feedback', 'Presets'],
                screenshots: ['🎸', '🎵', '📊'],
                lastUpdated: '2024-12-03'
            },

            // Photography
            'background-remover': {
                id: 'background-remover',
                name: 'Background Remover',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '🖼️',
                description: 'Remove backgrounds from images',
                developer: 'Photo Tech',
                size: '2.1 MB',
                price: 0,
                rating: 4.3,
                downloads: 5700,
                permissions: ['storage'],
                features: ['AI Removal', 'Manual Tools', 'Batch Processing', 'Formats'],
                screenshots: ['🖼️', '✂️', '📁'],
                lastUpdated: '2024-12-04'
            },

            // Weather
            'weather-widgets': {
                id: 'weather-widgets',
                name: 'Weather Widgets',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '📊',
                description: 'Desktop weather widgets',
                developer: 'Weather Labs',
                size: '1.3 MB',
                price: 0,
                rating: 4.5,
                downloads: 4900,
                permissions: ['geolocation'],
                features: ['Multiple Widgets', 'Customizable', 'Real-time', 'Alerts'],
                screenshots: ['📊', '☀️', '⚙️'],
                lastUpdated: '2024-12-05'
            },

            // Education
            'vocabulary-builder': {
                id: 'vocabulary-builder',
                name: 'Vocabulary Builder',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🧠',
                description: 'Expand your vocabulary',
                developer: 'Edu Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.7,
                downloads: 6800,
                permissions: ['storage', 'notifications'],
                features: ['Word of the Day', 'Quizzes', 'Progress', 'Offline'],
                screenshots: ['🧠', '📚', '🎯'],
                lastUpdated: '2024-12-06'
            },

            // Business
            'invoice-tracker': {
                id: 'invoice-tracker',
                name: 'Invoice Tracker',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '📊',
                description: 'Track invoice payments and status',
                developer: 'Finance Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.6,
                downloads: 4300,
                permissions: ['storage', 'notifications'],
                features: ['Payment Status', 'Reminders', 'Reports', 'Export'],
                screenshots: ['📊', '💰', '📤'],
                lastUpdated: '2024-12-07'
            },

            // Security
            'secure-backup': {
                id: 'secure-backup',
                name: 'Secure Backup',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '💾',
                description: 'Encrypted backup solution',
                developer: 'Security Labs',
                size: '1.7 MB',
                price: 0,
                rating: 4.7,
                downloads: 5200,
                permissions: ['storage'],
                features: ['AES-256', 'Compression', 'Scheduling', 'Verification'],
                screenshots: ['💾', '🔐', '📁'],
                lastUpdated: '2024-12-01'
            },

            // Travel
            'hotel-finder': {
                id: 'hotel-finder',
                name: 'Hotel Finder',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '🏨',
                description: 'Find and book hotels',
                developer: 'Travel Tech',
                size: '1.9 MB',
                price: 0,
                rating: 4.2,
                downloads: 3600,
                permissions: ['geolocation', 'storage'],
                features: ['Search & Filter', 'Reviews', 'Bookmarks', 'Price Comparison'],
                screenshots: ['🏨', '📍', '⭐'],
                lastUpdated: '2024-12-02'
            },

            // News
            'news-sources': {
                id: 'news-sources',
                name: 'News Sources',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '🔗',
                description: 'Aggregate news from multiple sources',
                developer: 'Media Labs',
                size: '1.4 MB',
                price: 0,
                rating: 4.4,
                downloads: 4700,
                permissions: ['storage', 'notifications'],
                features: ['Multiple Sources', 'Custom Feeds', 'Offline', 'Search'],
                screenshots: ['🔗', '📰', '🔍'],
                lastUpdated: '2024-12-03'
            },

            // Sports
            'running-tracker': {
                id: 'running-tracker',
                name: 'Running Tracker',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '🏃',
                description: 'Track runs and routes',
                developer: 'Fitness Apps',
                size: '1.6 MB',
                price: 0,
                rating: 4.6,
                downloads: 7200,
                permissions: ['geolocation', 'sensors', 'storage'],
                features: ['GPS Tracking', 'Pace Analysis', 'Routes', 'Goals'],
                screenshots: ['🏃', '🗺️', '📊'],
                lastUpdated: '2024-12-04'
            },

            // Books
            'reading-challenge': {
                id: 'reading-challenge',
                name: 'Reading Challenge',
                version: '1.0.0',
                category: 'books',
                type: 'mobile',
                icon: '🎯',
                description: 'Set and track reading goals',
                developer: 'Book Tech',
                size: '1.1 MB',
                price: 0,
                rating: 4.5,
                downloads: 4100,
                permissions: ['storage', 'notifications'],
                features: ['Goal Setting', 'Progress', 'Reminders', 'Achievements'],
                screenshots: ['🎯', '📚', '🏆'],
                lastUpdated: '2024-12-05'
            },

            // Food
            'nutrition-labels': {
                id: 'nutrition-labels',
                name: 'Nutrition Labels',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '🏷️',
                description: 'Create nutrition labels for recipes',
                developer: 'Health Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 3200,
                permissions: ['storage'],
                features: ['Label Generator', 'FDA Format', 'Export', 'Templates'],
                screenshots: ['🏷️', '📊', '💾'],
                lastUpdated: '2024-12-06'
            },

            // Nature
            'wildlife-sounds': {
                id: 'wildlife-sounds',
                name: 'Wildlife Sounds',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🦉',
                description: 'Listen to wildlife sounds',
                developer: 'Nature Apps',
                size: '2.3 MB',
                price: 0,
                rating: 4.7,
                downloads: 4500,
                permissions: ['audio', 'storage'],
                features: ['Sound Library', 'Identify', 'Favorites', 'Offline'],
                screenshots: ['🦉', '🎵', '⭐'],
                lastUpdated: '2024-12-07'
            },

            // Space
            'satellite-tracker': {
                id: 'satellite-tracker',
                name: 'Satellite Tracker',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🛰️',
                description: 'Track satellites in real-time',
                developer: 'Space Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.6,
                downloads: 5100,
                permissions: ['geolocation', 'notifications'],
                features: ['Real-time Tracking', 'Pass Predictions', 'ISS', 'Starlink'],
                screenshots: ['🛰️', '📍', '📊'],
                lastUpdated: '2024-12-01'
            },

            // Cooking
            'cooking-converter': {
                id: 'cooking-converter',
                name: 'Cooking Converter',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '📐',
                description: 'Convert cooking measurements',
                developer: 'Kitchen Apps',
                size: '980 KB',
                price: 0,
                rating: 4.5,
                downloads: 5800,
                permissions: ['storage'],
                features: ['Unit Conversion', 'Temperature', 'Scaling', 'Favorites'],
                screenshots: ['📐', '🌡️', '⭐'],
                lastUpdated: '2024-12-02'
            },

            // Finance
            'budget-planner': {
                id: 'budget-planner',
                name: 'Budget Planner',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '📋',
                description: 'Plan and manage budgets',
                developer: 'Finance Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.7,
                downloads: 6300,
                permissions: ['storage', 'notifications'],
                features: ['Budget Templates', 'Tracking', 'Reports', 'Goals'],
                screenshots: ['📋', '📊', '🎯'],
                lastUpdated: '2024-12-03'
            },

            // Music
            'music-visualizer': {
                id: 'music-visualizer',
                name: 'Music Visualizer',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🌈',
                description: 'Visualize music in real-time',
                developer: 'Audio Tech',
                size: '1.8 MB',
                price: 0,
                rating: 4.4,
                downloads: 4900,
                permissions: ['audio'],
                features: ['Multiple Visuals', 'Customizable', 'Recording', 'Export'],
                screenshots: ['🌈', '🎵', '🎬'],
                lastUpdated: '2024-12-04'
            },

            // Photography
            'screenshot-annotator': {
                id: 'screenshot-annotator',
                name: 'Screenshot Annotator',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '✏️',
                description: 'Annotate and edit screenshots',
                developer: 'Photo Tech',
                size: '1.3 MB',
                price: 0,
                rating: 4.6,
                downloads: 6700,
                permissions: ['storage', 'clipboard'],
                features: ['Drawing Tools', 'Text', 'Arrows', 'Blur'],
                screenshots: ['✏️', '📸', '📤'],
                lastUpdated: '2024-12-05'
            },

            // Weather
            'weather-history': {
                id: 'weather-history',
                name: 'Weather History',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '📜',
                description: 'Historical weather data',
                developer: 'Weather Labs',
                size: '1.6 MB',
                price: 0,
                rating: 4.3,
                downloads: 3800,
                permissions: ['geolocation'],
                features: ['Historical Data', 'Charts', 'Export', 'Comparison'],
                screenshots: ['📜', '📊', '📈'],
                lastUpdated: '2024-12-06'
            },

            // Education
            'study-timer': {
                id: 'study-timer',
                name: 'Study Timer',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '📚',
                description: 'Pomodoro timer for studying',
                developer: 'Edu Apps',
                size: '980 KB',
                price: 0,
                rating: 4.8,
                downloads: 8900,
                permissions: ['notifications', 'storage'],
                features: ['Pomodoro', 'Breaks', 'Stats', 'Customizable'],
                screenshots: ['📚', '⏱️', '📊'],
                lastUpdated: '2024-12-07'
            },

            // Business
            'meeting-notes': {
                id: 'meeting-notes',
                name: 'Meeting Notes',
                version: '1.0.0',
                category: 'business',
                type: 'mobile',
                icon: '📝',
                description: 'Take structured meeting notes',
                developer: 'Productivity Co',
                size: '1.1 MB',
                price: 0,
                rating: 4.5,
                downloads: 5200,
                permissions: ['storage', 'audio', 'clipboard'],
                features: ['Templates', 'Voice Notes', 'Action Items', 'Sharing'],
                screenshots: ['📝', '📋', '📤'],
                lastUpdated: '2024-12-01'
            },

            // Security
            'privacy-checker': {
                id: 'privacy-checker',
                name: 'Privacy Checker',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '🛡️',
                description: 'Check and improve privacy settings',
                developer: 'Security Labs',
                size: '1.2 MB',
                price: 0,
                rating: 4.7,
                downloads: 6100,
                permissions: ['storage'],
                features: ['Privacy Scan', 'Recommendations', 'Reports', 'Tips'],
                screenshots: ['🛡️', '📊', '💡'],
                lastUpdated: '2024-12-02'
            },

            // Travel
            'road-trip-planner': {
                id: 'road-trip-planner',
                name: 'Road Trip Planner',
                version: '1.0.0',
                category: 'travel',
                type: 'desktop',
                icon: '🚗',
                description: 'Plan road trips and routes',
                developer: 'Travel Tech',
                size: '1.9 MB',
                price: 0,
                rating: 4.4,
                downloads: 3400,
                permissions: ['geolocation', 'storage'],
                features: ['Route Planning', 'Stops', 'Cost Estimator', 'Sharing'],
                screenshots: ['🚗', '🗺️', '📍'],
                lastUpdated: '2024-12-03'
            },

            // News
            'fact-checker': {
                id: 'fact-checker',
                name: 'Fact Checker',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '🔍',
                description: 'Verify news and claims',
                developer: 'Media Labs',
                size: '1.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 4500,
                permissions: ['storage'],
                features: ['Claim Verification', 'Sources', 'Rating System', 'History'],
                screenshots: ['🔍', '✅', '📊'],
                lastUpdated: '2024-12-04'
            },

            // Sports
            'team-manager': {
                id: 'team-manager',
                name: 'Team Manager',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '👥',
                description: 'Manage sports teams and schedules',
                developer: 'Sports Tech',
                size: '1.5 MB',
                price: 0,
                rating: 4.3,
                downloads: 2900,
                permissions: ['storage', 'notifications'],
                features: ['Roster Management', 'Scheduling', 'Attendance', 'Stats'],
                screenshots: ['👥', '📅', '📊'],
                lastUpdated: '2024-12-05'
            },

            // Books
            'book-scanner': {
                id: 'book-scanner',
                name: 'Book Scanner',
                version: '1.0.0',
                category: 'books',
                type: 'mobile',
                icon: '📷',
                description: 'Scan book barcodes and catalog',
                developer: 'Book Tech',
                size: '1.3 MB',
                price: 0,
                rating: 4.5,
                downloads: 4800,
                permissions: ['camera', 'storage'],
                features: ['Barcode Scan', 'Database', 'Collections', 'Wishlist'],
                screenshots: ['📷', '📚', '📋'],
                lastUpdated: '2024-12-06'
            },

            // Food
            'restaurant-reviews': {
                id: 'restaurant-reviews',
                name: 'Restaurant Reviews',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '⭐',
                description: 'Read and write restaurant reviews',
                developer: 'Food Apps',
                size: '1.6 MB',
                price: 0,
                rating: 4.2,
                downloads: 3700,
                permissions: ['geolocation', 'camera', 'storage'],
                features: ['Review Writing', 'Photos', 'Ratings', 'Bookmarks'],
                screenshots: ['⭐', '📷', '📍'],
                lastUpdated: '2024-12-07'
            },

            // Nature
            'weather-alerts': {
                id: 'weather-alerts',
                name: 'Weather Alerts',
                version: '1.0.0',
                category: 'weather',
                type: 'mobile',
                icon: '⚠️',
                description: 'Severe weather alerts and warnings',
                developer: 'Weather Labs',
                size: '1.1 MB',
                price: 0,
                rating: 4.7,
                downloads: 6200,
                permissions: ['geolocation', 'notifications'],
                features: ['Real-time Alerts', 'Maps', 'Safety Tips', 'History'],
                screenshots: ['⚠️', '🗺️', '🛡️'],
                lastUpdated: '2024-12-01'
            },

            // Space
            'planet-tracker': {
                id: 'planet-tracker',
                name: 'Planet Tracker',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🪐',
                description: 'Track visible planets',
                developer: 'Space Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 4600,
                permissions: ['geolocation', 'notifications'],
                features: ['Planet Positions', 'Visibility Alerts', 'Info', 'Sky Map'],
                screenshots: ['🪐', '📍', '🗺️'],
                lastUpdated: '2024-12-02'
            },

            // Cooking
            'baking-convert': {
                id: 'baking-convert',
                name: 'Baking Convert',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🥄',
                description: 'Baking measurement converter',
                developer: 'Kitchen Apps',
                size: '980 KB',
                price: 0,
                rating: 4.5,
                downloads: 5100,
                permissions: ['storage'],
                features: ['Metric/Imperial', 'Temperature', 'Scaling', 'Favorites'],
                screenshots: ['🥄', '🌡️', '⭐'],
                lastUpdated: '2024-12-03'
            },

            // Finance
            'net-worth': {
                id: 'net-worth',
                name: 'Net Worth',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '💎',
                description: 'Track net worth over time',
                developer: 'Finance Apps',
                size: '1.3 MB',
                price: 0,
                rating: 4.6,
                downloads: 4200,
                permissions: ['storage', 'notifications'],
                features: ['Asset Tracking', 'Liabilities', 'Charts', 'Goals'],
                screenshots: ['💎', '📊', '📈'],
                lastUpdated: '2024-12-04'
            },

            // Music
            'drum-machine': {
                id: 'drum-machine',
                name: 'Drum Machine',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🥁',
                description: 'Create drum beats and patterns',
                developer: 'Audio Tech',
                size: '2.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 3800,
                permissions: ['audio', 'storage'],
                features: ['Drum Kits', 'Sequencer', 'Patterns', 'Export'],
                screenshots: ['🥁', '🎵', '💾'],
                lastUpdated: '2024-12-05'
            },

            // Photography
            'color-grading': {
                id: 'color-grading',
                name: 'Color Grading',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '🎨',
                description: 'Professional color grading for photos',
                developer: 'Photo Tech',
                size: '1.7 MB',
                price: 0,
                rating: 4.5,
                downloads: 4900,
                permissions: ['storage'],
                features: ['Color Wheels', 'Curves', 'Presets', 'Export'],
                screenshots: ['🎨', '🌈', '💾'],
                lastUpdated: '2024-12-06'
            },

            // Weather
            'weather-comparison': {
                id: 'weather-comparison',
                name: 'Weather Comparison',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '⚖️',
                description: 'Compare weather between locations',
                developer: 'Weather Labs',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 3100,
                permissions: ['storage'],
                features: ['Multiple Locations', 'Side-by-side', 'Charts', 'Export'],
                screenshots: ['⚖️', '📊', '📤'],
                lastUpdated: '2024-12-07'
            },

            // Education
            'memory-game': {
                id: 'memory-game',
                name: 'Memory Game',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🧠',
                description: 'Brain training memory game',
                developer: 'Edu Apps',
                size: '1.0 MB',
                price: 0,
                rating: 4.7,
                downloads: 7200,
                permissions: ['storage', 'audio'],
                features: ['Multiple Levels', 'Timer', 'High Scores', 'Sounds'],
                screenshots: ['🧠', '🎯', '🏆'],
                lastUpdated: '2024-12-01'
            },

            // Business
            'crm-lite': {
                id: 'crm-lite',
                name: 'CRM Lite',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '👥',
                description: 'Simple customer relationship management',
                developer: 'Productivity Co',
                size: '1.8 MB',
                price: 0,
                rating: 4.4,
                downloads: 3900,
                permissions: ['storage', 'notifications'],
                features: ['Contact Management', 'Deals', 'Tasks', 'Reports'],
                screenshots: ['👥', '📊', '📋'],
                lastUpdated: '2024-12-02'
            },

            // Security
            '2fa-manager': {
                id: '2fa-manager',
                name: '2FA Manager',
                version: '1.0.0',
                category: 'security',
                type: 'mobile',
                icon: '🔑',
                description: 'Two-factor authentication manager',
                developer: 'Security Labs',
                size: '1.1 MB',
                price: 0,
                rating: 4.8,
                downloads: 6800,
                permissions: ['storage', 'notifications'],
                features: ['TOTP Codes', 'Backup Codes', 'Cloud Sync', 'Security'],
                screenshots: ['🔑', '🔐', '☁️'],
                lastUpdated: '2024-12-03'
            },

            // Travel
            'expense-splitter': {
                id: 'expense-splitter',
                name: 'Expense Splitter',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '💸',
                description: 'Split expenses with travel companions',
                developer: 'Travel Tech',
                size: '980 KB',
                price: 0,
                rating: 4.5,
                downloads: 4200,
                permissions: ['storage', 'notifications'],
                features: ['Group Splitting', 'Balances', 'Settlements', 'History'],
                screenshots: ['💸', '👥', '📊'],
                lastUpdated: '2024-12-04'
            },

            // News
            'news-archive': {
                id: 'news-archive',
                name: 'News Archive',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '📦',
                description: 'Save and organize news articles',
                developer: 'Media Labs',
                size: '1.3 MB',
                price: 0,
                rating: 4.4,
                downloads: 3600,
                permissions: ['storage'],
                features: ['Save Articles', 'Organize', 'Search', 'Export'],
                screenshots: ['📦', '📰', '🔍'],
                lastUpdated: '2024-12-05'
            },

            // Sports
            'score-board': {
                id: 'score-board',
                name: 'Score Board',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '🎯',
                description: 'Digital score board for any game',
                developer: 'Sports Tech',
                size: '980 KB',
                price: 0,
                rating: 4.6,
                downloads: 5400,
                permissions: ['storage'],
                features: ['Multiple Games', 'Custom Rules', 'Timer', 'History'],
                screenshots: ['🎯', '📊', '⏱️'],
                lastUpdated: '2024-12-06'
            },

            // Books
            'book-quotes': {
                id: 'book-quotes',
                name: 'Book Quotes',
                version: '1.0.0',
                category: 'books',
                type: 'mobile',
                icon: '💬',
                description: 'Collection of book quotes',
                developer: 'Book Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.5,
                downloads: 4100,
                permissions: ['storage', 'clipboard'],
                features: ['Quote Collection', 'Categories', 'Favorites', 'Share'],
                screenshots: ['💬', '📚', '📤'],
                lastUpdated: '2024-12-07'
            },

            // Food
            'leftover-ideas': {
                id: 'leftover-ideas',
                name: 'Leftover Ideas',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🍲',
                description: 'Recipes for leftover ingredients',
                developer: 'Kitchen Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 3200,
                permissions: ['storage'],
                features: ['Ingredient Search', 'Recipes', 'Favorites', 'Shopping List'],
                screenshots: ['🍲', '🔍', '🛒'],
                lastUpdated: '2024-12-01'
            },

            // Nature
            'camping-checklist': {
                id: 'camping-checklist',
                name: 'Camping Checklist',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🏕️',
                description: 'Essential camping gear checklist',
                developer: 'Nature Apps',
                size: '980 KB',
                price: 0,
                rating: 4.6,
                downloads: 4500,
                permissions: ['storage', 'notifications'],
                features: ['Pre-made Lists', 'Custom Items', 'Categories', 'Sharing'],
                screenshots: ['🏕️', '📋', '📤'],
                lastUpdated: '2024-12-02'
            },

            // Space
            'constellation-guide': {
                id: 'constellation-guide',
                name: 'Constellation Guide',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '⭐',
                description: 'Learn about constellations',
                developer: 'Space Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.7,
                downloads: 5200,
                permissions: ['geolocation', 'camera'],
                features: ['Star Maps', 'Constellation Info', 'Myths', 'AR Mode'],
                screenshots: ['⭐', '🔭', '📱'],
                lastUpdated: '2024-12-03'
            },

            // Cooking
            'meal-prep-planner': {
                id: 'meal-prep-planner',
                name: 'Meal Prep Planner',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🍱',
                description: 'Plan and prep weekly meals',
                developer: 'Kitchen Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.5,
                downloads: 4800,
                permissions: ['storage', 'notifications'],
                features: ['Weekly Planning', 'Prep Schedule', 'Shopping List', 'Recipes'],
                screenshots: ['🍱', '📅', '🛒'],
                lastUpdated: '2024-12-04'
            },

            // Finance
            'debt-payoff': {
                id: 'debt-payoff',
                name: 'Debt Payoff',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '📉',
                description: 'Plan debt payoff strategies',
                developer: 'Finance Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 3900,
                permissions: ['storage'],
                features: ['Snowball Method', 'Avalanche', 'Schedules', 'Progress'],
                screenshots: ['📉', '📊', '✅'],
                lastUpdated: '2024-12-05'
            },

            // Music
            'ear-training': {
                id: 'ear-training',
                name: 'Ear Training',
                version: '1.0.0',
                category: 'music',
                type: 'mobile',
                icon: '🎵',
                description: 'Improve your musical ear',
                developer: 'Audio Tech',
                size: '1.3 MB',
                price: 0,
                rating: 4.7,
                downloads: 5600,
                permissions: ['audio', 'storage'],
                features: ['Interval Training', 'Chords', 'Progress', 'Customizable'],
                screenshots: ['🎵', '📊', '🎯'],
                lastUpdated: '2024-12-06'
            },

            // Photography
            'photo-resizer': {
                id: 'photo-resizer',
                name: 'Photo Resizer',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '📐',
                description: 'Resize and optimize images',
                developer: 'Photo Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.4,
                downloads: 6200,
                permissions: ['storage'],
                features: ['Batch Resize', 'Quality Control', 'Formats', 'Presets'],
                screenshots: ['📐', '🖼️', '💾'],
                lastUpdated: '2024-12-07'
            },

            // Weather
            'season-tracker': {
                id: 'season-tracker',
                name: 'Season Tracker',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '🍂',
                description: 'Track seasonal changes and solstices',
                developer: 'Weather Labs',
                size: '980 KB',
                price: 0,
                rating: 4.3,
                downloads: 2800,
                permissions: ['geolocation'],
                features: ['Season Dates', 'Daylight Hours', 'Equinox Alerts', 'Info'],
                screenshots: ['🍂', '📅', '☀️'],
                lastUpdated: '2024-12-01'
            },

            // Education
            'brain-teasers': {
                id: 'brain-teasers',
                name: 'Brain Teasers',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🧩',
                description: 'Challenging puzzles and riddles',
                developer: 'Edu Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.6,
                downloads: 6100,
                permissions: ['storage'],
                features: ['Riddles', 'Logic Puzzles', 'Hints', 'Progress'],
                screenshots: ['🧩', '💡', '📊'],
                lastUpdated: '2024-12-02'
            },

            // Business
            'invoice-templates': {
                id: 'invoice-templates',
                name: 'Invoice Templates',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '📄',
                description: 'Professional invoice templates',
                developer: 'Finance Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.5,
                downloads: 4200,
                permissions: ['storage', 'print'],
                features: ['Template Library', 'Customization', 'Branding', 'Export'],
                screenshots: ['📄', '🎨', '💾'],
                lastUpdated: '2024-12-03'
            },

            // Security
            'security-audit': {
                id: 'security-audit',
                name: 'Security Audit',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '🔍',
                description: 'Comprehensive security audit tool',
                developer: 'Security Labs',
                size: '1.6 MB',
                price: 0,
                rating: 4.8,
                downloads: 5400,
                permissions: ['storage'],
                features: ['System Scan', 'Vulnerability Check', 'Reports', 'Fixes'],
                screenshots: ['🔍', '🛡️', '📊'],
                lastUpdated: '2024-12-04'
            },

            // Travel
            'travel-budget': {
                id: 'travel-budget',
                name: 'Travel Budget',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '💰',
                description: 'Budget planning for trips',
                developer: 'Travel Tech',
                size: '1.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 3700,
                permissions: ['storage', 'notifications'],
                features: ['Budget Planning', 'Expense Tracking', 'Currency', 'Reports'],
                screenshots: ['💰', '📊', '💱'],
                lastUpdated: '2024-12-05'
            },

            // News
            'news-ticker': {
                id: 'news-ticker',
                name: 'News Ticker',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '📡',
                description: 'Live news ticker widget',
                developer: 'Media Labs',
                size: '980 KB',
                price: 0,
                rating: 4.2,
                downloads: 3100,
                permissions: ['notifications'],
                features: ['Live Updates', 'Custom Feeds', 'Widget', 'Alerts'],
                screenshots: ['📡', '📰', '⚡'],
                lastUpdated: '2024-12-06'
            },

            // Sports
            'workout-planner': {
                id: 'workout-planner',
                name: 'Workout Planner',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '💪',
                description: 'Plan and track workout routines',
                developer: 'Fitness Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 5800,
                permissions: ['storage', 'notifications'],
                features: ['Routine Builder', 'Progress Tracking', 'Reminders', 'Exercises'],
                screenshots: ['💪', '📋', '📊'],
                lastUpdated: '2024-12-07'
            },

            // Books
            'reading-list': {
                id: 'reading-list',
                name: 'Reading List',
                version: '1.0.0',
                category: 'books',
                type: 'desktop',
                icon: '📖',
                description: 'Organize your reading list',
                developer: 'Book Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.5,
                downloads: 4600,
                permissions: ['storage'],
                features: ['Wishlist', 'Currently Reading', 'Completed', 'Notes'],
                screenshots: ['📖', '📝', '✅'],
                lastUpdated: '2024-12-01'
            },

            // Food
            'diet-tracker': {
                id: 'diet-tracker',
                name: 'Diet Tracker',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🥗',
                description: 'Track diet and nutrition goals',
                developer: 'Health Apps',
                size: '1.3 MB',
                price: 0,
                rating: 4.7,
                downloads: 6400,
                permissions: ['storage', 'camera', 'notifications'],
                features: ['Meal Logging', 'Goals', 'Progress', 'Recipes'],
                screenshots: ['🥗', '📊', '🎯'],
                lastUpdated: '2024-12-02'
            },

            // Nature
            'hiking-tracker': {
                id: 'hiking-tracker',
                name: 'Hiking Tracker',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🥾',
                description: 'Track hiking trails and stats',
                developer: 'Nature Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.6,
                downloads: 4900,
                permissions: ['geolocation', 'sensors', 'storage'],
                features: ['GPS Tracking', 'Elevation', 'Routes', 'Achievements'],
                screenshots: ['🥾', '🗺️', '📊'],
                lastUpdated: '2024-12-03'
            },

            // Space
            'meteor-counter': {
                id: 'meteor-counter',
                name: 'Meteor Counter',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '☄️',
                description: 'Count and log meteors',
                developer: 'Space Apps',
                size: '980 KB',
                price: 0,
                rating: 4.4,
                downloads: 3200,
                permissions: ['storage', 'notifications'],
                features: ['Counter', 'Timer', 'Logging', 'Sharing'],
                screenshots: ['☄️', '📊', '📤'],
                lastUpdated: '2024-12-04'
            },

            // Cooking
            'spice-rack': {
                id: 'spice-rack',
                name: 'Spice Rack',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🧂',
                description: 'Organize and track spices',
                developer: 'Kitchen Apps',
                size: '1.0 MB',
                price: 0,
                rating: 4.5,
                downloads: 3800,
                permissions: ['storage', 'camera'],
                features: ['Inventory', 'Expiry Alerts', 'Recipes', 'Shopping'],
                screenshots: ['🧂', '📋', '🛒'],
                lastUpdated: '2024-12-05'
            },

            // Finance
            'investment-portfolio': {
                id: 'investment-portfolio',
                name: 'Investment Portfolio',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '📈',
                description: 'Track investment portfolio performance',
                developer: 'Finance Apps',
                size: '1.7 MB',
                price: 0,
                rating: 4.6,
                downloads: 4500,
                permissions: ['storage', 'notifications'],
                features: ['Portfolio View', 'Performance Charts', 'Alerts', 'Reports'],
                screenshots: ['📈', '📊', '💰'],
                lastUpdated: '2024-12-06'
            },

            // Music
            'song-identifier': {
                id: 'song-identifier',
                name: 'Song Identifier',
                version: '1.0.0',
                category: 'music',
                type: 'mobile',
                icon: '🎵',
                description: 'Identify songs playing around you',
                developer: 'Audio Tech',
                size: '1.2 MB',
                price: 0,
                rating: 4.7,
                downloads: 7200,
                permissions: ['audio', 'storage'],
                features: ['Audio Recognition', 'Results', 'History', 'Sharing'],
                screenshots: ['🎵', '🔍', '📤'],
                lastUpdated: '2024-12-07'
            },

            // Photography
            'photo-montage': {
                id: 'photo-montage',
                name: 'Photo Montage',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '🖼️',
                description: 'Create photo montages and collages',
                developer: 'Photo Tech',
                size: '1.6 MB',
                price: 0,
                rating: 4.4,
                downloads: 4100,
                permissions: ['storage'],
                features: ['Templates', 'Layouts', 'Effects', 'Export'],
                screenshots: ['🖼️', '🎨', '💾'],
                lastUpdated: '2024-12-01'
            },

            // Weather
            'weather-history-compare': {
                id: 'weather-history-compare',
                name: 'Weather History Compare',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '📊',
                description: 'Compare historical weather patterns',
                developer: 'Weather Labs',
                size: '1.4 MB',
                price: 0,
                rating: 4.3,
                downloads: 2900,
                permissions: ['storage'],
                features: ['Year Comparison', 'Charts', 'Data Export', 'Analysis'],
                screenshots: ['📊', '📈', '📤'],
                lastUpdated: '2024-12-02'
            },

            // Education
            'logic-puzzles': {
                id: 'logic-puzzles',
                name: 'Logic Puzzles',
                version: '1.0.0',
                category: 'education',
                type: 'desktop',
                icon: '🧩',
                description: 'Challenging logic puzzles',
                developer: 'Edu Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.7,
                downloads: 5600,
                permissions: ['storage'],
                features: ['Multiple Difficulties', 'Timer', 'Hints', 'Progress'],
                screenshots: ['🧩', '🎯', '📊'],
                lastUpdated: '2024-12-03'
            },

            // Business
            'sales-tracker': {
                id: 'sales-tracker',
                name: 'Sales Tracker',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '💰',
                description: 'Track sales and revenue',
                developer: 'Productivity Co',
                size: '1.3 MB',
                price: 0,
                rating: 4.5,
                downloads: 3700,
                permissions: ['storage', 'notifications'],
                features: ['Sales Logging', 'Reports', 'Goals', 'Analytics'],
                screenshots: ['💰', '📊', '📈'],
                lastUpdated: '2024-12-04'
            },

            // Security
            'password-checker': {
                id: 'password-checker',
                name: 'Password Checker',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '🔐',
                description: 'Check password strength and security',
                developer: 'Security Labs',
                size: '980 KB',
                price: 0,
                rating: 4.8,
                downloads: 6900,
                permissions: ['clipboard'],
                features: ['Strength Analysis', 'Breach Check', 'Suggestions', 'History'],
                screenshots: ['🔐', '📊', '✅'],
                lastUpdated: '2024-12-05'
            },

            // Travel
            'travel-companion': {
                id: 'travel-companion',
                name: 'Travel Companion',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '🧳',
                description: 'All-in-one travel companion',
                developer: 'Travel Tech',
                size: '2.0 MB',
                price: 0,
                rating: 4.4,
                downloads: 4200,
                permissions: ['geolocation', 'storage', 'camera'],
                features: ['Planning', 'Expenses', 'Offline Maps', 'Photos'],
                screenshots: ['🧳', '🗺️', '📸'],
                lastUpdated: '2024-12-06'
            },

            // News
            'news-by-topic': {
                id: 'news-by-topic',
                name: 'News by Topic',
                version: '1.0.0',
                category: 'news',
                type: 'mobile',
                icon: '🏷️',
                description: 'News organized by topics',
                developer: 'Media Labs',
                size: '1.2 MB',
                price: 0,
                rating: 4.5,
                downloads: 4800,
                permissions: ['storage', 'notifications'],
                features: ['Topic Selection', 'Custom Feeds', 'Offline', 'Sharing'],
                screenshots: ['🏷️', '📰', '📤'],
                lastUpdated: '2024-12-07'
            },

            // Sports
            'sports-schedule': {
                id: 'sports-schedule',
                name: 'Sports Schedule',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '📅',
                description: 'Track sports schedules and scores',
                developer: 'Sports Tech',
                size: '1.1 MB',
                price: 0,
                rating: 4.3,
                downloads: 3400,
                permissions: ['storage', 'notifications'],
                features: ['Game Schedules', 'Live Scores', 'Teams', 'Alerts'],
                screenshots: ['📅', '🏆', '⚡'],
                lastUpdated: '2024-12-01'
            },

            // Books
            'book-reviews': {
                id: 'book-reviews',
                name: 'Book Reviews',
                version: '1.0.0',
                category: 'books',
                type: 'desktop',
                icon: '⭐',
                description: 'Write and read book reviews',
                developer: 'Book Tech',
                size: '1.3 MB',
                price: 0,
                rating: 4.6,
                downloads: 4100,
                permissions: ['storage'],
                features: ['Review Writing', 'Ratings', 'Search', 'Community'],
                screenshots: ['⭐', '📝', '🔍'],
                lastUpdated: '2024-12-02'
            },

            // Food
            'recipe-scaler': {
                id: 'recipe-scaler',
                name: 'Recipe Scaler',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '📏',
                description: 'Scale recipes for different servings',
                developer: 'Kitchen Apps',
                size: '980 KB',
                price: 0,
                rating: 4.5,
                downloads: 4600,
                permissions: ['storage'],
                features: ['Servings Scaling', 'Unit Conversion', 'Ingredients', 'Export'],
                screenshots: ['📏', '🍳', '💾'],
                lastUpdated: '2024-12-03'
            },

            // Nature
            'bird-songs': {
                id: 'bird-songs',
                name: 'Bird Songs',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🐦',
                description: 'Identify birds by their songs',
                developer: 'Nature Apps',
                size: '1.8 MB',
                price: 0,
                rating: 4.7,
                downloads: 5200,
                permissions: ['audio', 'storage'],
                features: ['Sound Library', 'Recording', 'Identification', 'Favorites'],
                screenshots: ['🐦', '🎵', '⭐'],
                lastUpdated: '2024-12-04'
            },

            // Space
            'eclipse-tracker': {
                id: 'eclipse-tracker',
                name: 'Eclipse Tracker',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🌑',
                description: 'Track solar and lunar eclipses',
                developer: 'Space Apps',
                size: '1.0 MB',
                price: 0,
                rating: 4.6,
                downloads: 3900,
                permissions: ['geolocation', 'notifications'],
                features: ['Eclipse Calendar', 'Visibility Maps', 'Alerts', 'Safety Tips'],
                screenshots: ['🌑', '📅', '⚠️'],
                lastUpdated: '2024-12-05'
            },

            // Cooking
            'cooking-timer-pro': {
                id: 'cooking-timer-pro',
                name: 'Cooking Timer Pro',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '⏲️',
                description: 'Advanced multi-timer for cooking',
                developer: 'Kitchen Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.8,
                downloads: 6700,
                permissions: ['audio', 'notifications'],
                features: ['Multiple Timers', 'Presets', 'Voice Alerts', 'Background'],
                screenshots: ['⏲️', '🔔', '📋'],
                lastUpdated: '2024-12-06'
            },

            // Finance
            'retirement-planner': {
                id: 'retirement-planner',
                name: 'Retirement Planner',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '🏖️',
                description: 'Plan your retirement savings',
                developer: 'Finance Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.6,
                downloads: 4200,
                permissions: ['storage'],
                features: ['Savings Calculator', 'Investment Projections', 'Goals', 'Reports'],
                screenshots: ['🏖️', '📊', '📈'],
                lastUpdated: '2024-12-07'
            },

            // Music
            'piano-tutor': {
                id: 'piano-tutor',
                name: 'Piano Tutor',
                version: '1.0.0',
                category: 'music',
                type: 'mobile',
                icon: '🎹',
                description: 'Learn to play piano',
                developer: 'Audio Tech',
                size: '1.9 MB',
                price: 0,
                rating: 4.5,
                downloads: 5400,
                permissions: ['audio', 'storage'],
                features: ['Lessons', 'Practice Modes', 'Progress', 'Sheet Music'],
                screenshots: ['🎹', '📚', '📊'],
                lastUpdated: '2024-12-01'
            },

            // Photography
            'photo-curator': {
                id: 'photo-curator',
                name: 'Photo Curator',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '🗂️',
                description: 'Organize and curate photo collections',
                developer: 'Photo Tech',
                size: '1.4 MB',
                price: 0,
                rating: 4.4,
                downloads: 3800,
                permissions: ['storage'],
                features: ['Tagging', 'Collections', 'Search', 'Export'],
                screenshots: ['🗂️', '🏷️', '📤'],
                lastUpdated: '2024-12-02'
            },

            // Weather
            'weather-history-search': {
                id: 'weather-history-search',
                name: 'Weather History Search',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '🔍',
                description: 'Search historical weather data',
                developer: 'Weather Labs',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 3100,
                permissions: ['storage'],
                features: ['Date Search', 'Location Search', 'Data Export', 'Charts'],
                screenshots: ['🔍', '📊', '📤'],
                lastUpdated: '2024-12-03'
            },

            // Education
            'memory-match': {
                id: 'memory-match',
                name: 'Memory Match',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🎮',
                description: 'Memory matching card game',
                developer: 'Edu Apps',
                size: '980 KB',
                price: 0,
                rating: 4.7,
                downloads: 6200,
                permissions: ['audio', 'storage'],
                features: ['Multiple Themes', 'Difficulty Levels', 'High Scores', 'Timer'],
                screenshots: ['🎮', '🎯', '🏆'],
                lastUpdated: '2024-12-04'
            },

            // Business
            'project-timer': {
                id: 'project-timer',
                name: 'Project Timer',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '⏱️',
                description: 'Track time on multiple projects',
                developer: 'Productivity Co',
                size: '1.0 MB',
                price: 0,
                rating: 4.6,
                downloads: 4900,
                permissions: ['storage', 'notifications'],
                features: ['Multiple Projects', 'Reports', 'Export', 'Reminders'],
                screenshots: ['⏱️', '📊', '📤'],
                lastUpdated: '2024-12-05'
            },

            // Security
            'secure-messenger': {
                id: 'secure-messenger',
                name: 'Secure Messenger',
                version: '1.0.0',
                category: 'security',
                type: 'mobile',
                icon: '🔒',
                description: 'End-to-end encrypted messaging',
                developer: 'Security Labs',
                size: '1.6 MB',
                price: 0,
                rating: 4.8,
                downloads: 5800,
                permissions: ['storage', 'camera', 'microphone'],
                features: ['E2E Encryption', 'Voice Messages', 'Self-destruct', 'Groups'],
                screenshots: ['🔒', '💬', '👥'],
                lastUpdated: '2024-12-06'
            },

            // Travel
            'travel-photos': {
                id: 'travel-photos',
                name: 'Travel Photos',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '📸',
                description: 'Organize travel photos with maps',
                developer: 'Travel Tech',
                size: '1.3 MB',
                price: 0,
                rating: 4.5,
                downloads: 4100,
                permissions: ['camera', 'geolocation', 'storage'],
                features: ['Photo Map', 'Trip Albums', 'Sharing', 'Editing'],
                screenshots: ['📸', '🗺️', '📤'],
                lastUpdated: '2024-12-07'
            },

            // News
            'news-quiz': {
                id: 'news-quiz',
                name: 'News Quiz',
                version: '1.0.0',
                category: 'news',
                type: 'mobile',
                icon: '❓',
                description: 'Test your news knowledge',
                developer: 'Media Labs',
                size: '1.0 MB',
                price: 0,
                rating: 4.4,
                downloads: 3600,
                permissions: ['storage'],
                features: ['Daily Quiz', 'Categories', 'Scores', 'Leaderboard'],
                screenshots: ['❓', '📊', '🏆'],
                lastUpdated: '2024-12-01'
            },

            // Sports
            'fitness-challenges-pro': {
                id: 'fitness-challenges-pro',
                name: 'Fitness Challenges Pro',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '💪',
                description: 'Advanced fitness challenges',
                developer: 'Fitness Apps',
                size: '1.7 MB',
                price: 0,
                rating: 4.6,
                downloads: 5200,
                permissions: ['sensors', 'storage', 'notifications'],
                features: ['Custom Challenges', 'Progress', 'Rewards', 'Community'],
                screenshots: ['💪', '🎯', '🏆'],
                lastUpdated: '2024-12-02'
            },

            // Books
            'book-club-pro': {
                id: 'book-club-pro',
                name: 'Book Club Pro',
                version: '1.0.0',
                category: 'books',
                type: 'desktop',
                icon: '📚',
                description: 'Advanced book club management',
                developer: 'Book Tech',
                size: '1.5 MB',
                price: 0,
                rating: 4.7,
                downloads: 4300,
                permissions: ['storage', 'notifications'],
                features: ['Multiple Clubs', 'Voting', 'Discussions', 'Scheduling'],
                screenshots: ['📚', '💬', '📅'],
                lastUpdated: '2024-12-03'
            },

            // Food
            'recipe-importer': {
                id: 'recipe-importer',
                name: 'Recipe Importer',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '📥',
                description: 'Import recipes from websites',
                developer: 'Kitchen Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 3700,
                permissions: ['storage'],
                features: ['Web Import', 'Parsing', 'Organization', 'Export'],
                screenshots: ['📥', '🍳', '📁'],
                lastUpdated: '2024-12-04'
            },

            // Nature
            'weather-station': {
                id: 'weather-station',
                name: 'Weather Station',
                version: '1.0.0',
                category: 'nature',
                type: 'desktop',
                icon: '🌡️',
                description: 'Personal weather station data',
                developer: 'Weather Labs',
                size: '1.4 MB',
                price: 0,
                rating: 4.5,
                downloads: 4200,
                permissions: ['geolocation'],
                features: ['Local Data', 'History', 'Charts', 'Export'],
                screenshots: ['🌡️', '📊', '📈'],
                lastUpdated: '2024-12-05'
            },

            // Space
            'space-news': {
                id: 'space-news',
                name: 'Space News',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🚀',
                description: 'Latest space exploration news',
                developer: 'Space Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.6,
                downloads: 4800,
                permissions: ['storage', 'notifications'],
                features: ['Latest News', 'Mission Updates', 'Launch Alerts', 'Offline'],
                screenshots: ['🚀', '📰', '⚡'],
                lastUpdated: '2024-12-06'
            },

            // Cooking
            'cooking-converter-pro': {
                id: 'cooking-converter-pro',
                name: 'Cooking Converter Pro',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '🔄',
                description: 'Advanced cooking conversion tools',
                developer: 'Kitchen Apps',
                size: '1.0 MB',
                price: 0,
                rating: 4.7,
                downloads: 5600,
                permissions: ['storage'],
                features: ['All Units', 'Temperature', 'Scaling', 'Favorites'],
                screenshots: ['🔄', '🌡️', '⭐'],
                lastUpdated: '2024-12-07'
            },

            // Finance
            'crypto-portfolio': {
                id: 'crypto-portfolio',
                name: 'Crypto Portfolio',
                version: '1.0.0',
                category: 'finance',
                type: 'mobile',
                icon: '₿',
                description: 'Track cryptocurrency investments',
                developer: 'Finance Apps',
                size: '1.3 MB',
                price: 0,
                rating: 4.4,
                downloads: 5900,
                permissions: ['storage', 'notifications'],
                features: ['Portfolio Tracking', 'Price Alerts', 'Charts', 'News'],
                screenshots: ['₿', '📈', '📊'],
                lastUpdated: '2024-12-01'
            },

            // Music
            'lyrics-editor': {
                id: 'lyrics-editor',
                name: 'Lyrics Editor',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '✏️',
                description: 'Edit and sync song lyrics',
                developer: 'Audio Tech',
                size: '1.1 MB',
                price: 0,
                rating: 4.5,
                downloads: 3800,
                permissions: ['storage'],
                features: ['Lyric Editing', 'Time Sync', 'Export', 'Validation'],
                screenshots: ['✏️', '🎵', '💾'],
                lastUpdated: '2024-12-02'
            },

            // Photography
            'photo-watermark': {
                id: 'photo-watermark',
                name: 'Photo Watermark',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '💧',
                description: 'Add watermarks to photos',
                developer: 'Photo Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.4,
                downloads: 4500,
                permissions: ['storage'],
                features: ['Text Watermarks', 'Logo Watermarks', 'Batch Processing', 'Positioning'],
                screenshots: ['💧', '🖼️', '📁'],
                lastUpdated: '2024-12-03'
            },

            // Weather
            'weather-dashboard': {
                id: 'weather-dashboard',
                name: 'Weather Dashboard',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '📊',
                description: 'Comprehensive weather dashboard',
                developer: 'Weather Labs',
                size: '1.6 MB',
                price: 0,
                rating: 4.6,
                downloads: 5200,
                permissions: ['geolocation', 'notifications'],
                features: ['Multiple Widgets', 'Real-time Data', 'Alerts', 'Customizable'],
                screenshots: ['📊', '☀️', '⚙️'],
                lastUpdated: '2024-12-04'
            },

            // Education
            'math-flashcards': {
                id: 'math-flashcards',
                name: 'Math Flashcards',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🔢',
                description: 'Math practice with flashcards',
                developer: 'Edu Apps',
                size: '980 KB',
                price: 0,
                rating: 4.7,
                downloads: 6100,
                permissions: ['storage', 'audio'],
                features: ['Multiple Operations', 'Difficulty Levels', 'Timed', 'Progress'],
                screenshots: ['🔢', '🎴', '📊'],
                lastUpdated: '2024-12-05'
            },

            // Business
            'invoice-tracker-pro': {
                id: 'invoice-tracker-pro',
                name: 'Invoice Tracker Pro',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '📊',
                description: 'Advanced invoice tracking and management',
                developer: 'Finance Apps',
                size: '1.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 4200,
                permissions: ['storage', 'notifications', 'print'],
                features: ['Advanced Tracking', 'Reminders', 'Reports', 'Templates'],
                screenshots: ['📊', '💰', '📤'],
                lastUpdated: '2024-12-06'
            },

            // Security
            'secure-cloud': {
                id: 'secure-cloud',
                name: 'Secure Cloud',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '☁️',
                description: 'Encrypted cloud storage',
                developer: 'Security Labs',
                size: '1.5 MB',
                price: 0,
                rating: 4.7,
                downloads: 5400,
                permissions: ['storage'],
                features: ['End-to-end Encryption', 'Sync', 'Sharing', 'Versioning'],
                screenshots: ['☁️', '🔐', '📁'],
                lastUpdated: '2024-12-07'
            },

            // Travel
            'travel-journal': {
                id: 'travel-journal',
                name: 'Travel Journal',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '📔',
                description: 'Digital travel journal with photos',
                developer: 'Travel Tech',
                size: '1.2 MB',
                price: 0,
                rating: 4.5,
                downloads: 3900,
                permissions: ['camera', 'geolocation', 'storage'],
                features: ['Journal Entries', 'Photo Integration', 'Maps', 'Sharing'],
                screenshots: ['📔', '📷', '📍'],
                lastUpdated: '2024-12-01'
            },

            // News
            'news-filter': {
                id: 'news-filter',
                name: 'News Filter',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '🎛️',
                description: 'Filter news by bias and quality',
                developer: 'Media Labs',
                size: '1.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 3400,
                permissions: ['storage'],
                features: ['Bias Detection', 'Quality Rating', 'Custom Filters', 'Sources'],
                screenshots: ['🎛️', '📰', '📊'],
                lastUpdated: '2024-12-02'
            },

            // Sports
            'sports-analytics': {
                id: 'sports-analytics',
                name: 'Sports Analytics',
                version: '1.0.0',
                category: 'sports',
                type: 'desktop',
                icon: '📈',
                description: 'Analyze sports statistics',
                developer: 'Sports Tech',
                size: '1.3 MB',
                price: 0,
                rating: 4.6,
                downloads: 4100,
                permissions: ['storage'],
                features: ['Stat Analysis', 'Charts', 'Comparisons', 'Export'],
                screenshots: ['📈', '📊', '📤'],
                lastUpdated: '2024-12-03'
            },

            // Books
            'book-scanner-pro': {
                id: 'book-scanner-pro',
                name: 'Book Scanner Pro',
                version: '1.0.0',
                category: 'books',
                type: 'mobile',
                icon: '📷',
                description: 'Advanced book scanning and cataloging',
                developer: 'Book Tech',
                size: '1.4 MB',
                price: 0,
                rating: 4.7,
                downloads: 5200,
                permissions: ['camera', 'storage'],
                features: ['Barcode Scan', 'OCR', 'Database', 'Export'],
                screenshots: ['📷', '📚', '📤'],
                lastUpdated: '2024-12-04'
            },

            // Food
            'nutrition-label-pro': {
                id: 'nutrition-label-pro',
                name: 'Nutrition Label Pro',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '🏷️',
                description: 'Professional nutrition label creator',
                developer: 'Health Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.5,
                downloads: 3600,
                permissions: ['storage', 'print'],
                features: ['FDA Compliance', 'Customization', 'Batch Processing', 'Export'],
                screenshots: ['🏷️', '📊', '🖨️'],
                lastUpdated: '2024-12-05'
            },

            // Nature
            'plant-disease': {
                id: 'plant-disease',
                name: 'Plant Disease',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🦠',
                description: 'Identify plant diseases',
                developer: 'Nature Apps',
                size: '1.6 MB',
                price: 0,
                rating: 4.4,
                downloads: 4200,
                permissions: ['camera', 'storage'],
                features: ['AI Detection', 'Treatment Info', 'Prevention', 'History'],
                screenshots: ['🦠', '📷', '💊'],
                lastUpdated: '2024-12-06'
            },

            // Space
            'rocket-launch': {
                id: 'rocket-launch',
                name: 'Rocket Launch',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🚀',
                description: 'Track rocket launches worldwide',
                developer: 'Space Apps',
                size: '1.0 MB',
                price: 0,
                rating: 4.7,
                downloads: 5600,
                permissions: ['storage', 'notifications'],
                features: ['Launch Schedule', 'Live Updates', 'Countdowns', 'Info'],
                screenshots: ['🚀', '⏱️', '📡'],
                lastUpdated: '2024-12-07'
            },

            // Cooking
            'cooking-converters': {
                id: 'cooking-converters',
                name: 'Cooking Converters',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🔄',
                description: 'All-in-one cooking converters',
                developer: 'Kitchen Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.6,
                downloads: 4900,
                permissions: ['storage'],
                features: ['All Units', 'Temperature', 'Scaling', 'Favorites'],
                screenshots: ['🔄', '🌡️', '⭐'],
                lastUpdated: '2024-12-01'
            },

            // Finance
            'stock-tracker': {
                id: 'stock-tracker',
                name: 'Stock Tracker',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '📈',
                description: 'Track stock prices and portfolio',
                developer: 'Finance Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.5,
                downloads: 5800,
                permissions: ['storage', 'notifications'],
                features: ['Real-time Prices', 'Portfolio', 'Alerts', 'Charts'],
                screenshots: ['📈', '📊', '💰'],
                lastUpdated: '2024-12-02'
            },

            // Music
            'music-library': {
                id: 'music-library',
                name: 'Music Library',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🎵',
                description: 'Organize your music collection',
                developer: 'Audio Tech',
                size: '1.3 MB',
                price: 0,
                rating: 4.6,
                downloads: 4700,
                permissions: ['storage', 'audio'],
                features: ['Library Management', 'Metadata Editing', 'Playlists', 'Search'],
                screenshots: ['🎵', '📁', '🔍'],
                lastUpdated: '2024-12-03'
            },

            // Photography
            'photo-effects': {
                id: 'photo-effects',
                name: 'Photo Effects',
                version: '1.0.0',
                category: 'photography',
                type: 'mobile',
                icon: '✨',
                description: 'Apply effects and filters to photos',
                developer: 'Photo Tech',
                size: '1.4 MB',
                price: 0,
                rating: 4.4,
                downloads: 5200,
                permissions: ['camera', 'storage'],
                features: ['Filters', 'Effects', 'Batch Processing', 'Sharing'],
                screenshots: ['✨', '🎨', '📤'],
                lastUpdated: '2024-12-04'
            },

            // Weather
            'weather-maps': {
                id: 'weather-maps',
                name: 'Weather Maps',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '🗺️',
                description: 'Interactive weather maps',
                developer: 'Weather Labs',
                size: '1.7 MB',
                price: 0,
                rating: 4.5,
                downloads: 4300,
                permissions: ['geolocation'],
                features: ['Radar Maps', 'Satellite', 'Layers', 'Animation'],
                screenshots: ['🗺️', '🌧️', '📡'],
                lastUpdated: '2024-12-05'
            },

            // Education
            'typing-speed': {
                id: 'typing-speed',
                name: 'Typing Speed',
                version: '1.0.0',
                category: 'education',
                type: 'desktop',
                icon: '⌨️',
                description: 'Test and improve typing speed',
                developer: 'Edu Apps',
                size: '980 KB',
                price: 0,
                rating: 4.7,
                downloads: 6400,
                permissions: ['storage'],
                features: ['Speed Tests', 'Accuracy', 'Progress', 'Leaderboard'],
                screenshots: ['⌨️', '📊', '🏆'],
                lastUpdated: '2024-12-06'
            },

            // Business
            'meeting-cost': {
                id: 'meeting-cost',
                name: 'Meeting Cost',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '💵',
                description: 'Calculate meeting costs',
                developer: 'Productivity Co',
                size: '980 KB',
                price: 0,
                rating: 4.4,
                downloads: 3800,
                permissions: ['storage'],
                features: ['Cost Calculator', 'Attendees', 'Timer', 'Reports'],
                screenshots: ['💵', '👥', '📊'],
                lastUpdated: '2024-12-07'
            },

            // Security
            'secure-notes-pro': {
                id: 'secure-notes-pro',
                name: 'Secure Notes Pro',
                version: '1.0.0',
                category: 'security',
                type: 'mobile',
                icon: '📝',
                description: 'Advanced encrypted notes',
                developer: 'Security Labs',
                size: '1.1 MB',
                price: 0,
                rating: 4.8,
                downloads: 5900,
                permissions: ['storage', 'biometric'],
                features: ['Biometric Lock', 'Categories', 'Search', 'Backup'],
                screenshots: ['📝', '🔐', '📁'],
                lastUpdated: '2024-12-01'
            },

            // Travel
            'travel-checklist': {
                id: 'travel-checklist',
                name: 'Travel Checklist',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '✅',
                description: 'Complete travel preparation checklist',
                developer: 'Travel Tech',
                size: '980 KB',
                price: 0,
                rating: 4.5,
                downloads: 4200,
                permissions: ['storage', 'notifications'],
                features: ['Pre-made Lists', 'Custom Items', 'Categories', 'Sharing'],
                screenshots: ['✅', '📋', '📤'],
                lastUpdated: '2024-12-02'
            },

            // News
            'news-trends': {
                id: 'news-trends',
                name: 'News Trends',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '🔥',
                description: 'Track trending news topics',
                developer: 'Media Labs',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 3500,
                permissions: ['storage'],
                features: ['Trending Topics', 'Charts', 'Historical Data', 'Alerts'],
                screenshots: ['🔥', '📊', '📈'],
                lastUpdated: '2024-12-03'
            },

            // Sports
            'sports-highlights': {
                id: 'sports-highlights',
                name: 'Sports Highlights',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '🎬',
                description: 'Watch sports highlights',
                developer: 'Sports Tech',
                size: '1.5 MB',
                price: 0,
                rating: 4.6,
                downloads: 4800,
                permissions: ['storage', 'audio'],
                features: ['Video Highlights', 'Multiple Sports', 'Favorites', 'Sharing'],
                screenshots: ['🎬', '🏆', '📤'],
                lastUpdated: '2024-12-04'
            },

            // Books
            'book-notes': {
                id: 'book-notes',
                name: 'Book Notes',
                version: '1.0.0',
                category: 'books',
                type: 'mobile',
                icon: '📝',
                description: 'Take notes while reading',
                developer: 'Book Tech',
                size: '1.0 MB',
                price: 0,
                rating: 4.5,
                downloads: 4100,
                permissions: ['storage', 'clipboard'],
                features: ['Note Taking', 'Highlights', 'Export', 'Search'],
                screenshots: ['📝', '📚', '🔍'],
                lastUpdated: '2024-12-05'
            },

            // Food
            'cooking-converters-pro': {
                id: 'cooking-converters-pro',
                name: 'Cooking Converters Pro',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '🔄',
                description: 'Professional cooking conversion suite',
                developer: 'Kitchen Apps',
                size: '1.3 MB',
                price: 0,
                rating: 4.7,
                downloads: 5200,
                permissions: ['storage'],
                features: ['All Conversions', 'Custom Units', 'Batch Convert', 'Export'],
                screenshots: ['🔄', '📐', '💾'],
                lastUpdated: '2024-12-06'
            },

            // Nature
            'camping-gear': {
                id: 'camping-gear',
                name: 'Camping Gear',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '⛺',
                description: 'Camping gear checklist and reviews',
                developer: 'Nature Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 3600,
                permissions: ['storage', 'camera'],
                features: ['Gear Lists', 'Reviews', 'Packing', 'Sharing'],
                screenshots: ['⛺', '📋', '📷'],
                lastUpdated: '2024-12-07'
            },

            // Space
            'space-facts': {
                id: 'space-facts',
                name: 'Space Facts',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🌌',
                description: 'Interesting space facts and trivia',
                developer: 'Space Apps',
                size: '980 KB',
                price: 0,
                rating: 4.6,
                downloads: 5400,
                permissions: ['storage'],
                features: ['Daily Facts', 'Categories', 'Quiz', 'Favorites'],
                screenshots: ['🌌', '📚', '⭐'],
                lastUpdated: '2024-12-01'
            },

            // Cooking
            'cooking-recipes-pro': {
                id: 'cooking-recipes-pro',
                name: 'Cooking Recipes Pro',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '🍳',
                description: 'Advanced recipe management',
                developer: 'Kitchen Apps',
                size: '1.6 MB',
                price: 0,
                rating: 4.6,
                downloads: 4900,
                permissions: ['storage', 'camera'],
                features: ['Recipe Database', 'Meal Planning', 'Shopping Lists', 'Import'],
                screenshots: ['🍳', '📋', '🛒'],
                lastUpdated: '2024-12-02'
            },

            // Finance
            'crypto-mining': {
                id: 'crypto-mining',
                name: 'Crypto Mining',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '⛏️',
                description: 'Track cryptocurrency mining',
                developer: 'Finance Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.3,
                downloads: 4200,
                permissions: ['storage', 'notifications'],
                features: ['Mining Stats', 'Profitability', 'Alerts', 'Charts'],
                screenshots: ['⛏️', '📊', '📈'],
                lastUpdated: '2024-12-03'
            },

            // Music
            'music-composer': {
                id: 'music-composer',
                name: 'Music Composer',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🎼',
                description: 'Compose and arrange music',
                developer: 'Audio Tech',
                size: '2.1 MB',
                price: 0,
                rating: 4.5,
                downloads: 3800,
                permissions: ['audio', 'storage'],
                features: ['MIDI Editor', 'Instruments', 'Export', 'Playback'],
                screenshots: ['🎼', '🎹', '💾'],
                lastUpdated: '2024-12-04'
            },

            // Photography
            'photo-collage-pro': {
                id: 'photo-collage-pro',
                name: 'Photo Collage Pro',
                version: '1.0.0',
                category: 'photography',
                type: 'mobile',
                icon: '🖼️',
                description: 'Advanced photo collage maker',
                developer: 'Photo Tech',
                size: '1.5 MB',
                price: 0,
                rating: 4.6,
                downloads: 5600,
                permissions: ['storage', 'camera'],
                features: ['Advanced Layouts', 'Stickers', 'Text', 'Sharing'],
                screenshots: ['🖼️', '🎨', '📤'],
                lastUpdated: '2024-12-05'
            },

            // Weather
            'weather-history-pro': {
                id: 'weather-history-pro',
                name: 'Weather History Pro',
                version: '1.0.0',
                category: 'weather',
                type: 'desktop',
                icon: '📊',
                description: 'Advanced historical weather analysis',
                developer: 'Weather Labs',
                size: '1.4 MB',
                price: 0,
                rating: 4.4,
                downloads: 3900,
                permissions: ['storage'],
                features: ['Deep Analysis', 'Comparisons', 'Export', 'Reports'],
                screenshots: ['📊', '📈', '📤'],
                lastUpdated: '2024-12-06'
            },

            // Education
            'brain-training': {
                id: 'brain-training',
                name: 'Brain Training',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🧠',
                description: 'Cognitive training exercises',
                developer: 'Edu Apps',
                size: '1.3 MB',
                price: 0,
                rating: 4.7,
                downloads: 6200,
                permissions: ['storage', 'notifications'],
                features: ['Daily Exercises', 'Progress', 'Challenges', 'Stats'],
                screenshots: ['🧠', '📊', '🎯'],
                lastUpdated: '2024-12-07'
            },

            // Business
            'time-blocking': {
                id: 'time-blocking',
                name: 'Time Blocking',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '📅',
                description: 'Schedule time blocks for productivity',
                developer: 'Productivity Co',
                size: '1.0 MB',
                price: 0,
                rating: 4.6,
                downloads: 4500,
                permissions: ['storage', 'notifications'],
                features: ['Visual Schedule', 'Templates', 'Reminders', 'Analytics'],
                screenshots: ['📅', '📊', '⏰'],
                lastUpdated: '2024-12-01'
            },

            // Security
            'secure-backup-pro': {
                id: 'secure-backup-pro',
                name: 'Secure Backup Pro',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '💾',
                description: 'Advanced encrypted backup solution',
                developer: 'Security Labs',
                size: '1.6 MB',
                price: 0,
                rating: 4.8,
                downloads: 5800,
                permissions: ['storage'],
                features: ['Incremental Backup', 'Cloud Sync', 'Scheduling', 'Verification'],
                screenshots: ['💾', '🔐', '☁️'],
                lastUpdated: '2024-12-02'
            },

            // Travel
            'travel-budget-pro': {
                id: 'travel-budget-pro',
                name: 'Travel Budget Pro',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '💰',
                description: 'Advanced travel budget management',
                developer: 'Travel Tech',
                size: '1.2 MB',
                price: 0,
                rating: 4.5,
                downloads: 4100,
                permissions: ['storage', 'notifications'],
                features: ['Multi-trip', 'Currency', 'Reports', 'Sharing'],
                screenshots: ['💰', '📊', '📤'],
                lastUpdated: '2024-12-03'
            },

            // News
            'news-archiver': {
                id: 'news-archiver',
                name: 'News Archiver',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '📦',
                description: 'Archive and search news articles',
                developer: 'Media Labs',
                size: '1.1 MB',
                price: 0,
                rating: 4.4,
                downloads: 3700,
                permissions: ['storage'],
                features: ['Auto Archive', 'Full-text Search', 'Export', 'Filters'],
                screenshots: ['📦', '🔍', '📤'],
                lastUpdated: '2024-12-04'
            },

            // Sports
            'fitness-tracker-pro': {
                id: 'fitness-tracker-pro',
                name: 'Fitness Tracker Pro',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '📊',
                description: 'Advanced fitness tracking and analysis',
                developer: 'Fitness Apps',
                size: '1.7 MB',
                price: 0,
                rating: 4.7,
                downloads: 6100,
                permissions: ['sensors', 'geolocation', 'storage'],
                features: ['Advanced Metrics', 'Trends', 'Goals', 'Export'],
                screenshots: ['📊', '📈', '🎯'],
                lastUpdated: '2024-12-05'
            },

            // Books
            'book-collection': {
                id: 'book-collection',
                name: 'Book Collection',
                version: '1.0.0',
                category: 'books',
                type: 'desktop',
                icon: '📚',
                description: 'Manage large book collections',
                developer: 'Book Tech',
                size: '1.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 4300,
                permissions: ['storage', 'camera'],
                features: ['Barcode Scanning', 'Database', 'Statistics', 'Export'],
                screenshots: ['📚', '📷', '📊'],
                lastUpdated: '2024-12-06'
            },

            // Food
            'meal-prep-pro': {
                id: 'meal-prep-pro',
                name: 'Meal Prep Pro',
                version: '1.0.0',
                category: 'food',
                type: 'mobile',
                icon: '🍱',
                description: 'Advanced meal preparation planning',
                developer: 'Kitchen Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.6,
                downloads: 5200,
                permissions: ['storage', 'notifications', 'camera'],
                features: ['Batch Planning', 'Nutrition', 'Shopping', 'Recipes'],
                screenshots: ['🍱', '📊', '🛒'],
                lastUpdated: '2024-12-07'
            },

            // Nature
            'weather-station-pro': {
                id: 'weather-station-pro',
                name: 'Weather Station Pro',
                version: '1.0.0',
                category: 'nature',
                type: 'desktop',
                icon: '📡',
                description: 'Professional weather station software',
                developer: 'Weather Labs',
                size: '1.8 MB',
                price: 0,
                rating: 4.5,
                downloads: 4200,
                permissions: ['geolocation', 'notifications'],
                features: ['Sensor Integration', 'Historical Data', 'Alerts', 'Export'],
                screenshots: ['📡', '📊', '📤'],
                lastUpdated: '2024-12-01'
            },

            // Space
            'space-telescope': {
                id: 'space-telescope',
                name: 'Space Telescope',
                version: '1.0.0',
                category: 'education',
                type: 'desktop',
                icon: '🔭',
                description: 'Virtual telescope and astronomy tool',
                developer: 'Space Apps',
                size: '1.6 MB',
                price: 0,
                rating: 4.7,
                downloads: 4800,
                permissions: ['geolocation'],
                features: ['Star Map', 'Object Database', 'Observation Log', 'Guides'],
                screenshots: ['🔭', '⭐', '📚'],
                lastUpdated: '2024-12-02'
            },

            // Cooking
            'cooking-timer-suite': {
                id: 'cooking-timer-suite',
                name: 'Cooking Timer Suite',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '⏲️',
                description: 'Complete cooking timer system',
                developer: 'Kitchen Apps',
                size: '1.1 MB',
                price: 0,
                rating: 4.8,
                downloads: 5600,
                permissions: ['audio', 'notifications'],
                features: ['Multiple Timers', 'Presets', 'Recipes Integration', 'Alerts'],
                screenshots: ['⏲️', '🔔', '📋'],
                lastUpdated: '2024-12-03'
            },

            // Finance
            'crypto-trading': {
                id: 'crypto-trading',
                name: 'Crypto Trading',
                version: '1.0.0',
                category: 'finance',
                type: 'desktop',
                icon: '💹',
                description: 'Cryptocurrency trading analysis',
                developer: 'Finance Apps',
                size: '1.9 MB',
                price: 0,
                rating: 4.3,
                downloads: 4900,
                permissions: ['storage', 'notifications'],
                features: ['Price Charts', 'Technical Analysis', 'Alerts', 'Portfolio'],
                screenshots: ['💹', '📊', '📈'],
                lastUpdated: '2024-12-04'
            },

            // Music
            'music-visualizer-pro': {
                id: 'music-visualizer-pro',
                name: 'Music Visualizer Pro',
                version: '1.0.0',
                category: 'music',
                type: 'desktop',
                icon: '🌈',
                description: 'Advanced music visualization',
                developer: 'Audio Tech',
                size: '1.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 4200,
                permissions: ['audio'],
                features: ['3D Visuals', 'Customizable', 'Recording', 'Export'],
                screenshots: ['🌈', '🎵', '🎬'],
                lastUpdated: '2024-12-05'
            },

            // Photography
            'photo-editing-suite': {
                id: 'photo-editing-suite',
                name: 'Photo Editing Suite',
                version: '1.0.0',
                category: 'photography',
                type: 'desktop',
                icon: '🎨',
                description: 'Complete photo editing toolkit',
                developer: 'Photo Tech',
                size: '2.2 MB',
                price: 0,
                rating: 4.5,
                downloads: 5400,
                permissions: ['storage'],
                features: ['Advanced Tools', 'Layers', 'Filters', 'Export'],
                screenshots: ['🎨', '🖼️', '💾'],
                lastUpdated: '2024-12-06'
            },

            // Weather
            'weather-forecast-pro': {
                id: 'weather-forecast-pro',
                name: 'Weather Forecast Pro',
                version: '1.0.0',
                category: 'weather',
                type: 'mobile',
                icon: '☀️',
                description: 'Professional weather forecasting',
                developer: 'Weather Labs',
                size: '1.3 MB',
                price: 0,
                rating: 4.7,
                downloads: 6200,
                permissions: ['geolocation', 'notifications'],
                features: ['15-Day Forecast', 'Advanced Radar', 'Alerts', 'Widgets'],
                screenshots: ['☀️', '🗺️', '⚠️'],
                lastUpdated: '2024-12-07'
            },

            // Education
            'learning-tracker': {
                id: 'learning-tracker',
                name: 'Learning Tracker',
                version: '1.0.0',
                category: 'education',
                type: 'desktop',
                icon: '🎓',
                description: 'Track learning progress and goals',
                developer: 'Edu Apps',
                size: '1.2 MB',
                price: 0,
                rating: 4.6,
                downloads: 4500,
                permissions: ['storage', 'notifications'],
                features: ['Goal Setting', 'Progress Charts', 'Reminders', 'Reports'],
                screenshots: ['🎓', '📊', '🎯'],
                lastUpdated: '2024-12-01'
            },

            // Business
            'crm-pro': {
                id: 'crm-pro',
                name: 'CRM Pro',
                version: '1.0.0',
                category: 'business',
                type: 'desktop',
                icon: '👥',
                description: 'Professional customer relationship management',
                developer: 'Productivity Co',
                size: '1.9 MB',
                price: 0,
                rating: 4.5,
                downloads: 4800,
                permissions: ['storage', 'notifications', 'print'],
                features: ['Advanced CRM', 'Sales Pipeline', 'Analytics', 'Reports'],
                screenshots: ['👥', '📊', '📈'],
                lastUpdated: '2024-12-02'
            },

            // Security
            'security-suite': {
                id: 'security-suite',
                name: 'Security Suite',
                version: '1.0.0',
                category: 'security',
                type: 'desktop',
                icon: '🛡️',
                description: 'Complete security toolkit',
                developer: 'Security Labs',
                size: '1.7 MB',
                price: 0,
                rating: 4.8,
                downloads: 6100,
                permissions: ['storage', 'clipboard'],
                features: ['Encryption', 'Password Manager', 'Audit', 'Backup'],
                screenshots: ['🛡️', '🔐', '💾'],
                lastUpdated: '2024-12-03'
            },

            // Travel
            'travel-companion-pro': {
                id: 'travel-companion-pro',
                name: 'Travel Companion Pro',
                version: '1.0.0',
                category: 'travel',
                type: 'mobile',
                icon: '🧳',
                description: 'Complete travel companion suite',
                developer: 'Travel Tech',
                size: '1.8 MB',
                price: 0,
                rating: 4.6,
                downloads: 4600,
                permissions: ['geolocation', 'camera', 'storage', 'notifications'],
                features: ['Planning', 'Expenses', 'Offline', 'Photos', 'Guides'],
                screenshots: ['🧳', '🗺️', '📸'],
                lastUpdated: '2024-12-04'
            },

            // News
            'news-suite': {
                id: 'news-suite',
                name: 'News Suite',
                version: '1.0.0',
                category: 'news',
                type: 'desktop',
                icon: '📰',
                description: 'Complete news aggregation suite',
                developer: 'Media Labs',
                size: '1.5 MB',
                price: 0,
                rating: 4.4,
                downloads: 4200,
                permissions: ['storage', 'notifications'],
                features: ['Multiple Sources', 'Offline Reading', 'Search', 'Archive'],
                screenshots: ['📰', '📦', '🔍'],
                lastUpdated: '2024-12-05'
            },

            // Sports
            'fitness-suite': {
                id: 'fitness-suite',
                name: 'Fitness Suite',
                version: '1.0.0',
                category: 'sports',
                type: 'mobile',
                icon: '💪',
                description: 'Complete fitness tracking suite',
                developer: 'Fitness Apps',
                size: '1.6 MB',
                price: 0,
                rating: 4.7,
                downloads: 5800,
                permissions: ['sensors', 'geolocation', 'storage', 'notifications'],
                features: ['Tracking', 'Workouts', 'Nutrition', 'Goals', 'Community'],
                screenshots: ['💪', '📊', '🎯'],
                lastUpdated: '2024-12-06'
            },

            // Books
            'library-manager': {
                id: 'library-manager',
                name: 'Library Manager',
                version: '1.0.0',
                category: 'books',
                type: 'desktop',
                icon: '📚',
                description: 'Complete library management system',
                developer: 'Book Tech',
                size: '1.4 MB',
                price: 0,
                rating: 4.6,
                downloads: 4400,
                permissions: ['storage', 'camera', 'print'],
                features: ['Barcode Scanning', 'Database', 'Lending', 'Reports'],
                screenshots: ['📚', '📷', '📊'],
                lastUpdated: '2024-12-07'
            },

            // Food
            'cooking-suite': {
                id: 'cooking-suite',
                name: 'Cooking Suite',
                version: '1.0.0',
                category: 'food',
                type: 'desktop',
                icon: '🍳',
                description: 'Complete cooking and recipe suite',
                developer: 'Kitchen Apps',
                size: '1.9 MB',
                price: 0,
                rating: 4.6,
                downloads: 5200,
                permissions: ['storage', 'camera', 'notifications'],
                features: ['Recipes', 'Meal Planning', 'Converters', 'Timers', 'Shopping'],
                screenshots: ['🍳', '📋', '🛒'],
                lastUpdated: '2024-12-01'
            },

            // Nature
            'nature-guide': {
                id: 'nature-guide',
                name: 'Nature Guide',
                version: '1.0.0',
                category: 'nature',
                type: 'mobile',
                icon: '🌿',
                description: 'Complete nature identification guide',
                developer: 'Nature Apps',
                size: '1.7 MB',
                price: 0,
                rating: 4.7,
                downloads: 4900,
                permissions: ['camera', 'geolocation', 'storage'],
                features: ['Plant ID', 'Bird ID', 'Weather', 'Journal'],
                screenshots: ['🌿', '📷', '📍'],
                lastUpdated: '2024-12-02'
            },

            // Space
            'astronomy-suite': {
                id: 'astronomy-suite',
                name: 'Astronomy Suite',
                version: '1.0.0',
                category: 'education',
                type: 'mobile',
                icon: '🌌',
                description: 'Complete astronomy toolkit',
                developer: 'Space Apps',
                size: '1.5 MB',
                price: 0,
                rating: 4.7,
                downloads: 5100,
                permissions: ['geolocation', 'camera', 'sensors'],
                features: ['Star Map', 'Satellite Tracking', 'Events', 'AR Mode'],
                screenshots: ['🌌', '🔭', '📱'],
                lastUpdated: '2024-12-03'
            }
        };
    }

    initializeDefaultApps() {
        // Register all apps from database
        for (const [id, app] of Object.entries(this.appDatabase)) {
            this.appRegistry.set(id, app);
        }
    }

    async installApp(appId) {
        const app = this.appDatabase[appId];
        
        if (!app) {
            return { error: `App ${appId} not found` };
        }

        if (this.installedApps.has(appId)) {
            return { error: 'App already installed' };
        }

        // Check permissions
        const permissionResult = await this.permissionManager.requestPermissions(app.permissions);
        if (!permissionResult.success) {
            return { error: 'Permissions denied', details: permissionResult.denied };
        }

        // Simulate download
        const downloadResult = await this.simulateDownload(app);
        if (!downloadResult.success) {
            return downloadResult;
        }

        // Install app
        const installedApp = {
            ...app,
            installDate: new Date().toISOString(),
            lastUsed: null,
            version: app.version
        };

        this.installedApps.set(appId, installedApp);
        this.saveInstalledApps();

        // Notify user
        this.showNotification(`App installed: ${app.name}`, 'success');

        return { success: true, app: installedApp };
    }

    async uninstallApp(appId) {
        if (!this.installedApps.has(appId)) {
            return { error: 'App not installed' };
        }

        const app = this.installedApps.get(appId);
        this.installedApps.delete(appId);
        this.saveInstalledApps();

        this.showNotification(`App uninstalled: ${app.name}`, 'info');

        return { success: true };
    }

    async updateApp(appId) {
        const app = this.appDatabase[appId];
        const installed = this.installedApps.get(appId);

        if (!installed) {
            return { error: 'App not installed' };
        }

        if (installed.version === app.version) {
            return { error: 'App is already up to date' };
        }

        // Simulate update
        const updateResult = await this.simulateUpdate(app);
        if (!updateResult.success) {
            return updateResult;
        }

        installed.version = app.version;
        installed.lastUpdated = new Date().toISOString();
        this.saveInstalledApps();

        this.showNotification(`App updated: ${app.name} to v${app.version}`, 'success');

        return { success: true, version: app.version };
    }

    async simulateDownload(app) {
        // Simulate download progress
        const size = this.parseSize(app.size);
        const duration = Math.min(3000, size * 10); // Max 3 seconds
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true });
            }, duration);
        });
    }

    async simulateUpdate(app) {
        // Simulate update process
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true });
            }, 1500);
        });
    }

    parseSize(sizeStr) {
        const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB)/);
        if (!match) return 1;
        
        const value = parseFloat(match[1]);
        const unit = match[2];
        
        if (unit === 'KB') return value;
        if (unit === 'MB') return value * 1024;
        if (unit === 'GB') return value * 1024 * 1024;
        
        return value;
    }

    getInstalledApps() {
        return Array.from(this.installedApps.values());
    }

    getAvailableApps() {
        return Array.from(this.appDatabase.values());
    }

    searchApps(query, category = null, type = null) {
        let apps = this.getAvailableApps();

        if (query) {
            const lowerQuery = query.toLowerCase();
            apps = apps.filter(app => 
                app.name.toLowerCase().includes(lowerQuery) ||
                app.description.toLowerCase().includes(lowerQuery) ||
                app.category.toLowerCase().includes(lowerQuery) ||
                app.features.some(f => f.toLowerCase().includes(lowerQuery))
            );
        }

        if (category) {
            apps = apps.filter(app => app.category === category);
        }

        if (type) {
            apps = apps.filter(app => app.type === type);
        }

        return apps;
    }

    getAppsByCategory(category) {
        return this.getAvailableApps().filter(app => app.category === category);
    }

    getAppsByType(type) {
        return this.getAvailableApps().filter(app => app.type === type);
    }

    getCategories() {
        const categories = new Set();
        this.appDatabase.forEach(app => categories.add(app.category));
        return Array.from(categories).sort();
    }

    getStats() {
        return {
            totalApps: this.appDatabase.size,
            installedApps: this.installedApps.size,
            availableApps: this.appDatabase.size - this.installedApps.size,
            categories: this.getCategories().length,
            totalDownloads: Array.from(this.appDatabase.values()).reduce((sum, app) => sum + app.downloads, 0)
        };
    }

    saveInstalledApps() {
        try {
            const data = Array.from(this.installedApps.entries());
            localStorage.setItem('hazoom_installed_apps', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save installed apps:', error);
        }
    }

    loadInstalledApps() {
        try {
            const data = localStorage.getItem('hazoom_installed_apps');
            if (data) {
                const parsed = JSON.parse(data);
                this.installedApps = new Map(parsed);
            }
        } catch (error) {
            console.error('Failed to load installed apps:', error);
        }
    }

    showNotification(message, type = 'info') {
        // This will be handled by the UI controller
        if (window.hazoomUI) {
            window.hazoomUI.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

class AppUpdateManager {
    constructor() {
        this.updateQueue = [];
        this.autoUpdate = true;
    }

    async checkForUpdates() {
        // Check for app updates
        return [];
    }

    async updateAll() {
        // Update all apps
        return { success: true, updated: 0 };
    }

    setAutoUpdate(enabled) {
        this.autoUpdate = enabled;
    }
}

class AppPermissionManager {
    constructor() {
        this.grantedPermissions = new Map();
    }

    async requestPermissions(permissions) {
        const granted = [];
        const denied = [];

        for (const permission of permissions) {
            const result = await this.requestPermission(permission);
            if (result.granted) {
                granted.push(permission);
            } else {
                denied.push(permission);
            }
        }

        return {
            success: denied.length === 0,
            granted,
            denied
        };
    }

    async requestPermission(permission) {
        // Check if already granted
        if (this.grantedPermissions.has(permission)) {
            return { granted: true };
        }

        // Use platform API to request permission
        if (window.hazoomPlatform) {
            const result = await window.hazoomPlatform.requestPermission(permission);
            if (result.success && result.result.granted) {
                this.grantedPermissions.set(permission, true);
                return { granted: true };
            }
        }

        return { granted: false };
    }

    hasPermission(permission) {
        return this.grantedPermissions.has(permission);
    }

    revokePermission(permission) {
        this.grantedPermissions.delete(permission);
    }
}

// Initialize global app store
window.hazoomAppStore = new HazoomAppStore();