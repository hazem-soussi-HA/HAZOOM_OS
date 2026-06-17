/**
 * HAZOOM OS - Aether Bridge
 * Connects the Frontend User Interface to the Python Core via Virtual Ethernet (WebSockets)
 */

class AetherBridge {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = [];
        this.reconnectAttempts = 0;
    }

    connect() {
        console.log("[Aether] Initiating Uplink...");
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        try {
            this.socket = new WebSocket(`${protocol}//${host}/ws`);
        } catch (error) {
            console.error("[Aether] WebSocket connection failed:", error);
            this.isConnected = false;
            // Allow system to boot even if WebSocket fails
            this.notifyListeners({ type: 'system', status: 'failed' });
            return;
        }

        this.socket.onopen = () => {
            console.log("[Aether] Uplink Established. Creating Virtual Ethernet...");
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.notifyListeners({ type: 'system', status: 'connected' });
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("[Aether] Signal Received:", data);
                this.notifyListeners(data);
            } catch (e) {
                console.error("[Aether] Signal Corrupted:", e);
            }
        };

        this.socket.onclose = () => {
            console.log("[Aether] Uplink Lost.");
            this.isConnected = false;
            this.notifyListeners({ type: 'system', status: 'disconnected' });
            // Don't auto-reconnect to prevent connection loop
            // this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
            console.error("[Aether] Uplink Error:", error);
            console.warn("[Aether] Continuing without WebSocket connection...");
            // Allow system to function normally even without WebSocket
            this.isConnected = false;
            this.notifyListeners({ type: 'system', status: 'error' });
        };
    }

    attemptReconnect() {
        if (this.reconnectAttempts < 5) {
            this.reconnectAttempts++;
            const delay = 1000 * this.reconnectAttempts;
            console.log(`[Aether] Reconnecting in ${delay}ms...`);
            setTimeout(() => this.connect(), delay);
        }
    }

    /**
     * Send a thought/command to the Core
     * @param {string} type - 'thought', 'command', 'action'
     * @param {object} content - The data payload
     */
    transmit(type, content) {
        if (!this.isConnected) {
            console.warn("[Aether] Cannot transmit: Uplink down.");
            return;
        }
        
        const packet = JSON.stringify({
            timestamp: Date.now(),
            type: type,
            content: content
        });
        
        this.socket.send(packet);
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners(data) {
        this.listeners.forEach(cb => cb(data));
    }
}

// Initialize Global Bridge
window.HazoomAether = new AetherBridge();

// Auto-connect when document loads
document.addEventListener('DOMContentLoaded', () => {
    window.HazoomAether.connect();
});
