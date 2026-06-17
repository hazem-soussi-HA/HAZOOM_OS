/**
 * USB Portal Integration Module for Hazoom OS
 * Copyright © 2026 Hazem Soussi - All Rights Reserved
 *
 * This module enables Hazoom OS to detect and interact with USB devices
 * acting as "portals" to external storage and devices.
 */

class USBPortalManager {
    constructor() {
        this.portals = new Map(); // Map of connected USB portals
        this.portalCallbacks = []; // Callbacks for portal events
        this.isSupported = this.checkSupport();
        this.scanInterval = null;
        
        console.log('🔌 USB Portal Manager initialized');
    }

    /**
     * Check if the browser supports the WebUSB API
     */
    checkSupport() {
        if (!navigator.usb) {
            console.warn('⚠️ WebUSB API not supported in this browser');
            return false;
        }
        return true;
    }

    /**
     * Request permission to access USB devices
     */
    async requestAccess(filters = []) {
        if (!this.isSupported) {
            throw new Error('WebUSB API not supported');
        }

        try {
            const devices = await navigator.usb.requestDevice({ filters });
            console.log('🔓 Granted access to USB device:', devices.productName || devices.manufacturerName);
            return devices;
        } catch (error) {
            console.error('❌ Failed to request USB device access:', error);
            throw error;
        }
    }

    /**
     * Scan for connected USB devices that could act as portals
     */
    async scanForPortals() {
        if (!this.isSupported) {
            console.warn('⚠️ Cannot scan for USB portals: WebUSB API not supported');
            return [];
        }

        try {
            const devices = await navigator.usb.getDevices();
            const portals = [];

            for (const device of devices) {
                const portalInfo = this.identifyPortal(device);
                if (portalInfo) {
                    portals.push(portalInfo);
                    
                    // Store the portal if it's new
                    if (!this.portals.has(device.serialNumber || device.productId)) {
                        this.portals.set(device.serialNumber || device.productId, {
                            device,
                            info: portalInfo,
                            connectedAt: new Date()
                        });
                        
                        // Trigger connection event
                        this.triggerEvent('portalConnected', portalInfo);
                    }
                }
            }

            console.log(`🔍 Found ${portals.length} USB portal(s)`);
            return portals;
        } catch (error) {
            console.error('❌ Error scanning for USB portals:', error);
            return [];
        }
    }

    /**
     * Identify if a USB device can act as a portal
     */
    identifyPortal(device) {
        // Common vendor IDs for storage devices
        const storageVendors = [
            0x0781, // SanDisk
            0x0951, // Kingston
            0x090c, // Samsung
            0x13fe, // Kingmax
            0x05dc, // Lexar
            0x148e, // Transcend
            0x0930, // Toshiba
            0x05e3, // Genesys Logic
            0x04e8, // Samsung
            0x0951  // Kingston
        ];

        // Check if device is a mass storage device
        const isStorageDevice = storageVendors.includes(device.vendorId) ||
                               device.productName.toLowerCase().includes('storage') ||
                               device.productName.toLowerCase().includes('disk') ||
                               device.productName.toLowerCase().includes('usb') ||
                               device.productName.toLowerCase().includes('flash');

        if (isStorageDevice) {
            return {
                id: device.serialNumber || device.productId,
                name: device.productName || `USB Storage Device (${device.productId})`,
                vendorId: device.vendorId,
                productId: device.productId,
                manufacturer: device.manufacturerName,
                type: 'storage_portal',
                capacity: 'unknown',
                isConnected: true,
                device: device
            };
        }

        // Check for other types of portals (cameras, phones, etc.)
        if (device.productName.toLowerCase().includes('phone') ||
            device.productName.toLowerCase().includes('android') ||
            device.productName.toLowerCase().includes('camera')) {
            return {
                id: device.serialNumber || device.productId,
                name: device.productName,
                vendorId: device.vendorId,
                productId: device.productId,
                manufacturer: device.manufacturerName,
                type: 'device_portal',
                isConnected: true,
                device: device
            };
        }

        return null;
    }

    /**
     * Start periodic scanning for USB portals
     */
    startScanning(intervalMs = 5000) {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }

        this.scanInterval = setInterval(async () => {
            await this.scanForPortals();
        }, intervalMs);

        console.log(`🔄 USB portal scanning started (interval: ${intervalMs}ms)`);
    }

    /**
     * Stop scanning for USB portals
     */
    stopScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
            console.log('🛑 USB portal scanning stopped');
        }
    }

    /**
     * Register a callback for portal events
     */
    on(event, callback) {
        this.portalCallbacks.push({ event, callback });
    }

    /**
     * Trigger an event
     */
    triggerEvent(event, data) {
        this.portalCallbacks
            .filter(cb => cb.event === event)
            .forEach(cb => cb.callback(data));
    }

    /**
     * Get list of currently connected portals
     */
    getConnectedPortals() {
        return Array.from(this.portals.values()).map(portal => portal.info);
    }

    /**
     * Mount a USB portal to the virtual file system
     */
    async mountPortalToFS(portalId, mountPoint = null) {
        const portal = this.portals.get(portalId);
        if (!portal) {
            throw new Error(`Portal with ID ${portalId} not found`);
        }

        // Generate a default mount point if none provided
        if (!mountPoint) {
            mountPoint = `/media/${portal.info.name.replace(/\s+/g, '_').toLowerCase()}`;
        }

        // Add to the virtual file system
        if (window.hazoomFS) {
            try {
                // Create mount point directory
                const result = window.hazoomFS.mkdir(mountPoint);
                if (result.success) {
                    console.log(`📁 Mounted portal ${portal.info.name} at ${mountPoint}`);
                    
                    // Simulate loading files from the USB device
                    // In a real implementation, this would interface with the actual device
                    this.simulateUSBContents(mountPoint, portal);
                    
                    return { success: true, mountPoint };
                } else {
                    console.error('❌ Failed to create mount point:', result.error);
                    return { success: false, error: result.error };
                }
            } catch (error) {
                console.error('❌ Error mounting portal:', error);
                return { success: false, error: error.message };
            }
        } else {
            console.warn('⚠️ Hazoom file system not available');
            return { success: false, error: 'File system not available' };
        }
    }

    /**
     * Simulate USB contents (placeholder for actual USB file system integration)
     */
    simulateUSBContents(mountPoint, portal) {
        // This is a simulation - in reality, we'd need to interface with the actual USB device
        // which is limited by browser security policies
        
        // Create some sample files to represent the USB content
        const sampleFiles = [
            { name: 'README_USB.txt', content: `Content from ${portal.info.name}\nConnected at: ${portal.connectedAt}\nType: ${portal.info.type}` },
            { name: 'autorun.inf', content: '[autorun]\nicon=setup.exe,0\naction=Open USB Drive' }
        ];

        sampleFiles.forEach(file => {
            const filePath = `${mountPoint}/${file.name}`;
            if (window.hazoomFS) {
                window.hazoomFS.createFileInTree(window.hazoomFS.fileTree, filePath, file.content);
            }
        });

        console.log(`💾 Simulated USB contents for ${portal.info.name} at ${mountPoint}`);
    }

    /**
     * Unmount a USB portal from the virtual file system
     */
    unmountPortal(mountPoint) {
        if (window.hazoomFS) {
            const result = window.hazoomFS.rm(mountPoint, { recursive: true });
            if (result.success) {
                console.log(`⏏️ Unmounted portal from ${mountPoint}`);
                return { success: true };
            } else {
                console.error('❌ Failed to unmount portal:', result.error);
                return { success: false, error: result.error };
            }
        }
        return { success: false, error: 'File system not available' };
    }

    /**
     * Initialize the USB portal system
     */
    async initialize() {
        console.log('🚀 Initializing USB Portal System...');
        
        if (!this.isSupported) {
            console.warn('⚠️ USB Portal System disabled: WebUSB API not supported');
            return { success: false, reason: 'WebUSB API not supported' };
        }

        // Start scanning for portals
        this.startScanning();

        // Perform initial scan
        const portals = await this.scanForPortals();

        console.log(`✅ USB Portal System initialized with ${portals.length} portal(s)`);
        return { success: true, portalCount: portals.length };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopScanning();
        this.portals.clear();
        this.portalCallbacks = [];
        console.log('🧹 USB Portal Manager destroyed');
    }
}

// Initialize the USB Portal Manager
window.USBPortalManager = new USBPortalManager();

// Auto-initialize when the system is ready
document.addEventListener('DOMContentLoaded', async () => {
    if (window.USBPortalManager) {
        await window.USBPortalManager.initialize();
        
        // Register for USB connection events if supported
        if (navigator.usb) {
            navigator.usb.addEventListener('connect', (event) => {
                console.log('🔌 USB device connected:', event.device.productName);
                setTimeout(() => window.USBPortalManager.scanForPortals(), 1000);
            });
            
            navigator.usb.addEventListener('disconnect', (event) => {
                console.log('⏏️ USB device disconnected:', event.device.productName);
                // Handle disconnection in the portal manager
            });
        }
    }
});

// Export for module systems (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = USBPortalManager;
}