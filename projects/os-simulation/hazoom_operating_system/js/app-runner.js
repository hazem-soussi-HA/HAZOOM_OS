/**
 * Hazoom Operating System - Application Runner
 * Copyright © 2025 Hazem Soussi - All Rights Reserved
 * 
 * Cross-platform application runner for mobile and desktop apps
 */

class HazoomAppRunner {
    constructor() {
        this.runningApps = new Map();
        this.appRegistry = this.initializeAppRegistry();
        this.appIdCounter = 1000;
        this.currentFileManagerPath = '/home/hazem';
        this.fileManagerHistory = [];
    }
    
    initializeAppRegistry() {
        return {
            // Desktop Applications
            'file-manager': {
                name: 'File Manager',
                type: 'desktop',
                icon: '📁',
                description: 'Browse and manage files',
                runner: this.runFileManager.bind(this)
            },
            'terminal': {
                name: 'Terminal',
                type: 'desktop',
                icon: '💻',
                description: 'Command line interface',
                runner: this.runTerminal.bind(this)
            },
            'web-browser': {
                name: 'Web Browser',
                type: 'desktop',
                icon: '🌐',
                description: 'Browse the web',
                runner: this.runWebBrowser.bind(this)
            },
            'text-editor': {
                name: 'Text Editor',
                type: 'desktop',
                icon: '📝',
                description: 'Edit text files',
                runner: this.runTextEditor.bind(this)
            },
            'media-player': {
                name: 'Media Player',
                type: 'desktop',
                icon: '🎵',
                description: 'Play audio and video',
                runner: this.runMediaPlayer.bind(this)
            },
            'app-store': {
                name: 'App Store',
                type: 'desktop',
                icon: '🚀',
                description: 'Download and install apps',
                runner: this.runAppStore.bind(this)
            },
            'notepad': {
                name: 'Notepad',
                type: 'desktop',
                icon: '📝',
                description: 'Simple text editor',
                runner: this.runNotepad.bind(this)
            },
            
            // Mobile Applications
            'phone': {
                name: 'Phone',
                type: 'mobile',
                icon: '📞',
                description: 'Make and receive calls',
                runner: this.runPhone.bind(this)
            },
            'messages': {
                name: 'Messages',
                type: 'mobile',
                icon: '💬',
                description: 'Send and receive messages',
                runner: this.runMessages.bind(this)
            },
            'camera': {
                name: 'Camera',
                type: 'mobile',
                icon: '📷',
                description: 'Take photos and videos',
                runner: this.runCamera.bind(this)
            },
            'maps': {
                name: 'Maps',
                type: 'mobile',
                icon: '🗺️',
                description: 'Navigation and maps',
                runner: this.runMaps.bind(this)
            },
            'weather': {
                name: 'Weather',
                type: 'mobile',
                icon: '🌤️',
                description: 'Weather forecast',
                runner: this.runWeather.bind(this)
            },
            'music': {
                name: 'Music',
                type: 'mobile',
                icon: '🎵',
                description: 'Music player',
                runner: this.runMusic.bind(this)
            },
            'calculator': {
                name: 'Calculator',
                type: 'mobile',
                icon: '🔢',
                description: 'Perform calculations',
                runner: this.runCalculator.bind(this)
            },
            'settings': {
                name: 'Settings',
                type: 'mobile',
                icon: '⚙️',
                description: 'System settings',
                runner: this.runSettings.bind(this)
            }
        };
    }
    
    launchApp(appId, context = {}) {
        const appInfo = this.appRegistry[appId];
        
        if (!appInfo) {
            console.error(`App not found: ${appId}`);
            return { error: `Application '${appId}' not found` };
        }
        
        // Create process for the app
        const pid = window.hazoomKernel.fork();
        window.hazoomKernel.exec(pid, appInfo.name, []);
        
        // Generate app instance ID
        const instanceId = this.appIdCounter++;
        
        // Run the app
        const appInstance = {
            id: instanceId,
            appId: appId,
            pid: pid,
            name: appInfo.name,
            type: appInfo.type,
            icon: appInfo.icon,
            startTime: Date.now()
        };
        
        this.runningApps.set(instanceId, appInstance);
        
        // Execute the app's runner
        const result = appInfo.runner(context);
        
        return {
            success: true,
            instanceId: instanceId,
            pid: pid,
            content: result
        };
    }
    
    closeApp(instanceId) {
        const app = this.runningApps.get(instanceId);
        
        if (!app) {
            return { error: 'Application instance not found' };
        }
        
        // Kill the process
        window.hazoomKernel.kill(app.pid);
        
        // Remove from running apps
        this.runningApps.delete(instanceId);
        
        return { success: true };
    }
    
    getRunningApps() {
        return Array.from(this.runningApps.values());
    }
    
    // Enhanced File Manager with Navigation
    runFileManager(context) {
        const currentPath = context.path || this.currentFileManagerPath;
        const fs = window.hazoomFS;
        
        // Get directory contents
        const result = fs.ls(currentPath, { all: true });
        
        if (result.error) {
            return `
                <div class="app-content file-manager-app">
                    <h2>📁 File Manager</h2>
                    <div class="error-message">Error: ${result.error}</div>
                </div>
            `;
        }
        
        // Sidebar locations
        const sidebarLocations = [
            { path: '/home/hazem', icon: '🏠', name: 'Home' },
            { path: '/home/hazem/Documents', icon: '📄', name: 'Documents' },
            { path: '/home/hazem/Desktop', icon: '🖥️', name: 'Desktop' },
            { path: '/home/hazem/Downloads', icon: '⬇️', name: 'Downloads' },
            { path: '/home/hazem/Pictures', icon: '🖼️', name: 'Pictures' },
            { path: '/home/hazem/Music', icon: '🎵', name: 'Music' },
            { path: '/home/hazem/Videos', icon: '🎬', name: 'Videos' },
            { path: '/home/hazem/Projects', icon: '📁', name: 'Projects' }
        ];
        
        // Build sidebar HTML
        const sidebarHTML = sidebarLocations.map(loc => {
            const isActive = currentPath === loc.path;
            return `
                <div class="sidebar-item ${isActive ? 'active' : ''}" data-path="${loc.path}">
                    <span class="sidebar-icon">${loc.icon}</span>
                    <span class="sidebar-name">${loc.name}</span>
                </div>
            `;
        }).join('');
        
        // Build file grid HTML
        const files = result.files;
        let fileGridHTML = '';
        
        if (files.length === 0) {
            fileGridHTML = '<div class="empty-folder">This folder is empty</div>';
        } else {
            files.forEach(file => {
                const isDirectory = file.type === 'directory';
                const icon = isDirectory ? '📁' : '📄';
                const fileType = isDirectory ? 'folder' : 'file';
                const ext = file.name.split('.').pop().toLowerCase();
                
                // Determine file type for color coding
                let fileClass = 'file-item';
                if (isDirectory) fileClass += ' folder';
                else if (ext === 'txt') fileClass += ' text-file';
                else if (['js', 'html', 'css'].includes(ext)) fileClass += ' code-file';
                else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) fileClass += ' image-file';
                
                fileGridHTML += `
                    <div class="${fileClass}" 
                         data-type="${fileType}" 
                         data-name="${file.name}" 
                         data-path="${currentPath}/${file.name}"
                         data-ext="${ext}">
                        <div class="file-icon">${icon}</div>
                        <div class="file-name">${file.name}</div>
                        ${!isDirectory ? `<div class="file-size">${this.formatFileSize(file.size)}</div>` : ''}
                    </div>
                `;
            });
        }
        
        // Navigation breadcrumbs
        const pathParts = currentPath.split('/').filter(p => p);
        const breadcrumbs = ['/', ...pathParts].map((part, index) => {
            const path = index === 0 ? '/' : '/' + pathParts.slice(0, index).join('/');
            const display = index === 0 ? 'Root' : part;
            return `<span class="breadcrumb" data-path="${path}">${display}</span>`;
        }).join(' > ');
        
        return `
            <div class="app-content file-manager-app" data-current-path="${currentPath}">
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
                            <div class="address-bar">${breadcrumbs}</div>
                        </div>
                        <div class="file-manager-content">
                            <div class="file-grid">
                                ${fileGridHTML}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Notepad application for opening text files
    runNotepad(context) {
        const filePath = context.filePath || '';
        const fileContent = context.fileContent || '';
        const fileName = context.fileName || 'untitled.txt';
        
        return `
            <div class="app-content notepad-app" data-file-path="${filePath}" data-file-name="${fileName}">
                <div class="notepad-toolbar">
                    <button class="notepad-btn" data-action="new">New</button>
                    <button class="notepad-btn" data-action="open">Open</button>
                    <button class="notepad-btn" data-action="save">Save</button>
                    <button class="notepad-btn" data-action="saveas">Save As</button>
                    <span class="notepad-filename">${fileName}</span>
                </div>
                <textarea class="notepad-editor" placeholder="Start typing...">${fileContent}</textarea>
                <div class="notepad-status">Ready</div>
            </div>
        `;
    }
    
    // Terminal (placeholder - actual terminal is in main view)
    runTerminal(context) {
        return `
            <div class="app-content terminal-app">
                <h2>💻 Terminal</h2>
                <p>Terminal is running in the main view.</p>
                <p>Switch to the Terminal tab for full access.</p>
            </div>
        `;
    }
    
    // Web Browser
    runWebBrowser(context) {
        return `
            <div class="app-content browser-app">
                <h2>🌐 Web Browser</h2>
                <div class="browser-interface">
                    <div class="browser-controls">
                        <button>← Back</button>
                        <button>→ Forward</button>
                        <button>⟳ Reload</button>
                        <input type="text" placeholder="Enter URL..." style="flex: 1; margin: 0 10px; padding: 8px; border-radius: 4px; border: 1px solid #444;">
                        <button>Go</button>
                    </div>
                    <div class="browser-content" style="margin-top: 20px; padding: 20px; background: white; color: black; border-radius: 4px;">
                        <h1>Welcome to Hazoom Browser</h1>
                        <p>A modern web browser built into Hazoom OS.</p>
                        <p>This is a demonstration of the application runner framework.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Text Editor
    runTextEditor(context) {
        return `
            <div class="app-content editor-app">
                <h2>📝 Text Editor</h2>
                <div class="editor-interface">
                    <div class="editor-toolbar">
                        <button>New</button>
                        <button>Open</button>
                        <button>Save</button>
                        <button>Save As</button>
                    </div>
                    <textarea style="width: 100%; height: 400px; margin-top: 10px; padding: 10px; font-family: 'JetBrains Mono', monospace; background: #1e1e1e; color: #d4d4d4; border: 1px solid #444; border-radius: 4px;" placeholder="Start typing..."></textarea>
                </div>
            </div>
        `;
    }
    
    // Media Player
    runMediaPlayer(context) {
        return `
            <div class="app-content media-player-app">
                <h2>🎵 Media Player</h2>
                <div class="player-interface">
                    <div class="now-playing" style="text-align: center; padding: 40px;">
                        <div style="font-size: 80px;">🎵</div>
                        <h3>No media playing</h3>
                        <p>Select a file to play</p>
                    </div>
                    <div class="player-controls" style="text-align: center; margin-top: 20px;">
                        <button style="padding: 10px 20px; margin: 5px;">⏮ Previous</button>
                        <button style="padding: 10px 20px; margin: 5px;">▶️ Play</button>
                        <button style="padding: 10px 20px; margin: 5px;">⏸ Pause</button>
                        <button style="padding: 10px 20px; margin: 5px;">⏭ Next</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // App Store
    runAppStore(context) {
        return `
            <div class="app-content app-store-app">
                <h2>🚀 App Store</h2>
                <p>Browse and install applications for Hazoom OS.</p>
                <p>Switch to the Apps tab for the full app store experience.</p>
            </div>
        `;
    }
    
    // Mobile Apps
    runPhone(context) {
        return `
            <div class="app-content phone-app">
                <h2>📞 Phone</h2>
                <div class="phone-interface">
                    <div class="dial-pad" style="text-align: center;">
                        <input type="text" placeholder="Enter number..." style="width: 80%; padding: 15px; font-size: 24px; text-align: center; margin-bottom: 20px; background: #1e1e1e; color: white; border: 1px solid #444; border-radius: 8px;">
                        <div class="keypad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 300px; margin: 0 auto;">
                            ${[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(n => 
                                `<button style="padding: 20px; font-size: 24px; border-radius: 8px; background: #2a2a2a; color: white; border: 1px solid #444;">${n}</button>`
                            ).join('')}
                        </div>
                        <button style="margin-top: 20px; padding: 15px 40px; font-size: 18px; background: #4CAF50; color: white; border: none; border-radius: 25px;">📞 Call</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    runMessages(context) {
        return `
            <div class="app-content messages-app">
                <h2>💬 Messages</h2>
                <div class="messages-interface">
                    <div class="conversations-list" style="padding: 20px;">
                        <div style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px;">
                            <strong>John Doe</strong>
                            <p style="color: #888;">Hey, how are you?</p>
                        </div>
                        <div style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px;">
                            <strong>Jane Smith</strong>
                            <p style="color: #888;">Meeting at 3 PM tomorrow</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    runCamera(context) {
        return `
            <div class="app-content camera-app">
                <h2>📷 Camera</h2>
                <div class="camera-interface" style="text-align: center; padding: 40px;">
                    <div style="font-size: 100px;">📷</div>
                    <p>Camera interface</p>
                    <button style="margin-top: 20px; padding: 15px 30px; background: #2196F3; color: white; border: none; border-radius: 25px; font-size: 16px;">Take Photo</button>
                </div>
            </div>
        `;
    }
    
    runMaps(context) {
        return `
            <div class="app-content maps-app">
                <h2>🗺️ Maps</h2>
                <div class="maps-interface">
                    <input type="text" placeholder="Search location..." style="width: 90%; padding: 15px; margin: 20px auto; display: block; background: #1e1e1e; color: white; border: 1px solid #444; border-radius: 8px;">
                    <div style="text-align: center; padding: 60px; background: #2a2a2a; margin: 20px; border-radius: 8px;">
                        <div style="font-size: 60px;">🗺️</div>
                        <p>Map view placeholder</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    runWeather(context) {
        return `
            <div class="app-content weather-app">
                <h2>🌤️ Weather</h2>
                <div class="weather-interface" style="text-align: center; padding: 40px;">
                    <h3>Lagos, Nigeria</h3>
                    <div style="font-size: 80px; margin: 20px 0;">🌤️</div>
                    <div style="font-size: 48px; font-weight: bold;">28°C</div>
                    <p style="font-size: 18px; color: #888;">Partly Cloudy</p>
                    <div style="display: flex; justify-content: space-around; margin-top: 40px;">
                        <div><div>🌡️</div><div>High: 32°C</div></div>
                        <div><div>💧</div><div>Humidity: 75%</div></div>
                        <div><div>💨</div><div>Wind: 12 km/h</div></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    runMusic(context) {
        return `
            <div class="app-content music-app">
                <h2>🎵 Music</h2>
                <div class="music-interface">
                    <div class="now-playing" style="text-align: center; padding: 40px;">
                        <div style="font-size: 80px;">🎵</div>
                        <h3>No song playing</h3>
                        <p>Select a song from your library</p>
                    </div>
                    <div class="music-controls" style="text-align: center; margin-top: 20px;">
                        <button style="padding: 10px 20px; margin: 5px;">⏮</button>
                        <button style="padding: 10px 20px; margin: 5px;">▶️</button>
                        <button style="padding: 10px 20px; margin: 5px;">⏸</button>
                        <button style="padding: 10px 20px; margin: 5px;">⏭</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    runCalculator(context) {
        return `
            <div class="app-content calculator-app">
                <h2>🔢 Calculator</h2>
                <div class="calculator-interface" style="max-width: 300px; margin: 20px auto;">
                    <input type="text" placeholder="0" readonly style="width: 100%; padding: 20px; font-size: 32px; text-align: right; background: #1e1e1e; color: white; border: 1px solid #444; border-radius: 8px; margin-bottom: 10px;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        ${['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+'].map(b => 
                            `<button style="padding: 20px; font-size: 20px; background: ${b === '=' ? '#4CAF50' : '#2a2a2a'}; color: white; border: 1px solid #444; border-radius: 8px;">${b}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    runSettings(context) {
        return `
            <div class="app-content settings-app">
                <h2>⚙️ Settings</h2>
                <div class="settings-interface" style="padding: 20px;">
                    <div class="setting-item" style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px;">
                        <strong>🔔 Notifications</strong>
                        <p style="color: #888;">Manage notification preferences</p>
                    </div>
                    <div class="setting-item" style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px;">
                        <strong>🎨 Display</strong>
                        <p style="color: #888;">Brightness, theme, and appearance</p>
                    </div>
                    <div class="setting-item" style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px;">
                        <strong>📶 Network</strong>
                        <p style="color: #888;">Wi-Fi, mobile data, and connections</p>
                    </div>
                    <div class="setting-item" style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px;">
                        <strong>🔒 Privacy & Security</strong>
                        <p style="color: #888;">Manage privacy and security settings</p>
                    </div>
                    <div class="setting-item" style="padding: 15px; background: #2a2a2a; margin-bottom: 10px; border-radius: 8px;">
                        <strong>ℹ️ About</strong>
                        <p style="color: #888;">Hazoom OS v1.0.0 - © 2025 Hazem Soussi</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Helper methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    // File Manager navigation methods
    navigateToPath(path) {
        this.currentFileManagerPath = path;
        return this.launchApp('file-manager', { path: path });
    }
    
    // Notepad file operations
    openFileInNotepad(filePath) {
        const fs = window.hazoomFS;
        const fileNode = fs.getNode(filePath);
        
        if (!fileNode) {
            return { error: 'File not found' };
        }
        
        if (fileNode.type === 'directory') {
            return { error: 'Cannot open directory' };
        }
        
        const content = fileNode.content || '';
        const fileName = fileNode.name;
        
        return this.launchApp('notepad', { 
            filePath: filePath, 
            fileContent: content, 
            fileName: fileName 
        });
    }
    
    saveNotepadFile(filePath, content, fileName) {
        const fs = window.hazoomFS;
        
        if (!filePath) {
            // Save as - need to prompt for path
            return { error: 'Save As requires a file path' };
        }
        
        const result = fs.writeFile(filePath, content);
        return result;
    }
}

// Initialize global app runner
window.hazoomAppRunner = new HazoomAppRunner();