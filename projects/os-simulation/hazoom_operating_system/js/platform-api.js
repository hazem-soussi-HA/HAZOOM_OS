/**
 * Hazoom Operating System - Cross-Platform API Layer
 * Copyright © 2025 Hazem Soussi - All Rights Reserved
 * 
 * Unified API for device capabilities and platform-specific features
 */

class HazoomPlatformAPI {
    constructor() {
        this.platform = this.detectPlatform();
        this.capabilities = this.detectCapabilities();
        this.permissions = new Map();
        this.deviceInfo = this.collectDeviceInfo();
    }

    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;
        
        if (width <= 768) {
            return 'mobile';
        } else if (width <= 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    detectCapabilities() {
        return {
            // Device APIs
            camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            geolocation: !!navigator.geolocation,
            microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            sensors: !!('DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window),
            
            // Storage APIs
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            indexedDB: !!window.indexedDB,
            
            // Network APIs
            online: navigator.onLine,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
            
            // Media APIs
            audio: !!window.AudioContext || !!window.webkitAudioContext,
            video: !!document.createElement('video').canPlayType,
            
            // UI APIs
            touch: 'ontouchstart' in window,
            pointer: !!window.PointerEvent,
            vibration: !!navigator.vibrate,
            
            // File APIs
            fileSystem: !!(window.requestFileSystem || window.webkitRequestFileSystem),
            
            // Performance APIs
            performance: !!window.performance,
            memory: !!performance.memory
        };
    }

    collectDeviceInfo() {
        return {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            cores: navigator.hardwareConcurrency || 1,
            memory: performance.memory ? performance.memory.jsHeapSizeLimit : null,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelRatio: window.devicePixelRatio || 1
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesEnabled: navigator.cookieEnabled
        };
    }

    // Permission Management
    async requestPermission(permission, context = {}) {
        const permissionMap = {
            'camera': () => this.requestCamera(),
            'microphone': () => this.requestMicrophone(),
            'geolocation': () => this.requestGeolocation(),
            'notifications': () => this.requestNotifications(),
            'storage': () => this.requestStorage(),
            'sensors': () => this.requestSensors()
        };

        if (!permissionMap[permission]) {
            return { error: `Unknown permission: ${permission}` };
        }

        try {
            const result = await permissionMap[permission](context);
            this.permissions.set(permission, result);
            return { success: true, permission, result };
        } catch (error) {
            return { error: error.message, permission };
        }
    }

    async requestCamera() {
        if (!this.capabilities.camera) {
            throw new Error('Camera not available');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Release immediately
            return { granted: true, type: 'camera' };
        } catch (error) {
            return { granted: false, reason: error.name };
        }
    }

    async requestMicrophone() {
        if (!this.capabilities.microphone) {
            throw new Error('Microphone not available');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return { granted: true, type: 'microphone' };
        } catch (error) {
            return { granted: false, reason: error.name };
        }
    }

    async requestGeolocation() {
        if (!this.capabilities.geolocation) {
            throw new Error('Geolocation not available');
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    granted: true,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                }),
                error => resolve({ granted: false, reason: error.message }),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    async requestNotifications() {
        if (!('Notification' in window)) {
            throw new Error('Notifications not supported');
        }

        if (Notification.permission === 'granted') {
            return { granted: true, type: 'notifications' };
        }

        const permission = await Notification.requestPermission();
        return { granted: permission === 'granted', type: 'notifications' };
    }

    async requestStorage() {
        // Check available storage
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                granted: true,
                type: 'storage',
                quota: estimate.quota,
                usage: estimate.usage,
                percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return { granted: true, type: 'storage' };
    }

    async requestSensors() {
        const sensors = [];
        
        if ('DeviceMotionEvent' in window) {
            sensors.push('motion');
        }
        
        if ('DeviceOrientationEvent' in window) {
            sensors.push('orientation');
        }

        return {
            granted: sensors.length > 0,
            type: 'sensors',
            available: sensors
        };
    }

    // Device Capabilities
    async getBatteryStatus() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            } catch (error) {
                return { error: 'Battery API not available' };
            }
        }
        return { error: 'Battery API not supported' };
    }

    async getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!connection) {
            return { error: 'Network Information API not supported' };
        }

        return {
            type: connection.type,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
    }

    // Vibration API
    vibrate(pattern) {
        if (this.capabilities.vibration) {
            navigator.vibrate(pattern);
            return { success: true };
        }
        return { error: 'Vibration not supported' };
    }

    // Screen Management
    async requestFullscreen(element) {
        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    }

    async exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    }

    // Clipboard API
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true };
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                return { success: successful };
            } catch (err) {
                document.body.removeChild(textarea);
                return { error: 'Copy failed' };
            }
        }
    }

    async readFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            return { success: true, text };
        } catch (error) {
            return { error: 'Read from clipboard failed' };
        }
    }

    // Share API
    async share(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                return { success: true };
            } catch (error) {
                return { error: error.message };
            }
        }
        return { error: 'Web Share API not supported' };
    }

    // File System Access (Modern API)
    async openFilePicker(options = {}) {
        if ('showOpenFilePicker' in window) {
            try {
                const handles = await window.showOpenFilePicker(options);
                const files = await Promise.all(handles.map(handle => handle.getFile()));
                return { success: true, files };
            } catch (error) {
                return { error: error.message };
            }
        }
        return { error: 'File System Access API not supported' };
    }

    async saveFilePicker(content, filename = 'file.txt') {
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({ suggestedName: filename });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                return { success: true };
            } catch (error) {
                return { error: error.message };
            }
        }
        return { error: 'File System Access API not supported' };
    }

    // Performance Monitoring
    getPerformanceMetrics() {
        if (!this.capabilities.performance) {
            return { error: 'Performance API not available' };
        }

        const memory = performance.memory;
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
            memory: memory ? {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            } : null,
            navigation: navigation ? {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                redirectCount: navigation.redirectCount
            } : null,
            paint: paint.map(entry => ({
                name: entry.name,
                startTime: entry.startTime
            }))
        };
    }

    // Device Orientation/Motion
    async startMotionTracking(callback) {
        if (!this.capabilities.sensors) {
            return { error: 'Sensors not available' };
        }

        const handler = (event) => {
            callback({
                acceleration: event.acceleration,
                accelerationIncludingGravity: event.accelerationIncludingGravity,
                rotationRate: event.rotationRate,
                interval: event.interval
            });
        };

        if ('DeviceMotionEvent' in window) {
            window.addEventListener('devicemotion', handler);
            return { success: true, stop: () => window.removeEventListener('devicemotion', handler) };
        }

        return { error: 'DeviceMotionEvent not supported' };
    }

    async startOrientationTracking(callback) {
        if (!this.capabilities.sensors) {
            return { error: 'Sensors not available' };
        }

        const handler = (event) => {
            callback({
                alpha: event.alpha,
                beta: event.beta,
                gamma: event.gamma,
                absolute: event.absolute
            });
        };

        if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', handler);
            return { success: true, stop: () => window.removeEventListener('deviceorientation', handler) };
        }

        return { error: 'DeviceOrientationEvent not supported' };
    }

    // Utility Methods
    isMobile() {
        return this.platform === 'mobile';
    }

    isTablet() {
        return this.platform === 'tablet';
    }

    isDesktop() {
        return this.platform === 'desktop';
    }

    hasCapability(capability) {
        return this.capabilities[capability] === true;
    }

    getPlatformInfo() {
        return {
            platform: this.platform,
            capabilities: this.capabilities,
            device: this.deviceInfo
        };
    }
}

// Initialize global platform API
window.hazoomPlatform = new HazoomPlatformAPI();