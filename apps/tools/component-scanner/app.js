// Circuit Human Scan - VRINX Integration
class CircuitScanApp {
    constructor() {
        this.vrinxConnected = false;
        this.scanning = false;
        this.scanInterval = null;
        this.protocols = {
            hdmi: { status: 'disconnected', name: 'HDMI' },
            displayport: { status: 'disconnected', name: 'DisplayPort' },
            'usb-c': { status: 'disconnected', name: 'USB-C' },
            wireless: { status: 'disconnected', name: 'Wireless Display' }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateVrinxStatus();
        this.updateProtocolStatus();
    }
    
    bindEvents() {
        document.getElementById('connectVRINX')?.addEventListener('click', () => this.connectToVRINX());
        document.getElementById('startScan')?.addEventListener('click', () => this.startScan());
        document.getElementById('stopScan')?.addEventListener('click', () => this.stopScan());
        
        // Protocol connection buttons
        Object.keys(this.protocols).forEach(protocol => {
            const element = document.getElementById(`${protocol}Status`?.parentElement);
            if (element) {
                element.addEventListener('click', () => this.toggleProtocol(protocol));
            }
        });
    }
    
    // VRINX Integration Methods
    async connectToVRINX() {
        try {
            // Simulate VRINX API connection
            console.log('Connecting to VRINX systems...');
            
            // Check if VRINX API is available
            const vrinxApi = this.checkVRINXAvailability();
            
            if (vrinxApi) {
                await this.authenticateWithVRINX();
                this.vrinxConnected = true;
                this.updateVrinxStatus(true);
                console.log('Successfully connected to VRINX');
                this.showNotification('VRINX Connected', 'Successfully integrated with VRINX systems', 'success');
            } else {
                throw new Error('VRINX API not available');
            }
        } catch (error) {
            console.error('VRINX connection failed:', error);
            this.vrinxConnected = false;
            this.updateVrinxStatus(false);
            this.showNotification('VRINX Error', 'Failed to connect to VRINX systems', 'error');
        }
    }
    
    checkVRINXAvailability() {
        // Check for VRINX API availability
        if (typeof window !== 'undefined') {
            // Check for VRINX SDK or API
            if (window.VRINX || window.vrinx) {
                return true;
            }
            
            // Check for API endpoints
            return fetch('/api/vrinx/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                mode: 'no-cors'
            }).then(() => true).catch(() => false);
        }
        return false;
    }
    
    async authenticateWithVRINX() {
        // Authenticate with VRINX systems
        const authData = {
            clientId: 'circuit-scan-app',
            timestamp: Date.now(),
            capabilities: ['human-scan', 'display-protocols']
        };
        
        try {
            const response = await fetch('/api/vrinx/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authData)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('VRINX Authentication successful:', data);
                return true;
            }
        } catch (error) {
            console.error('VRINX authentication failed:', error);
            throw error;
        }
    }
    
    updateVrinxStatus(connected = false) {
        const statusElement = document.getElementById('vrinxStatus');
        if (statusElement) {
            const dot = statusElement.querySelector('.status-dot');
            const text = statusElement.querySelector('span:last-child');
            
            if (dot && text) {
                dot.className = 'status-dot' + (connected ? '' : ' disconnected');
                text.textContent = `VRINX: ${connected ? 'Connected' : 'Disconnected'}`;
            }
        }
    }
    
    // Display Protocol Methods
    toggleProtocol(protocol) {
        const protocolInfo = this.protocols[protocol];
        if (!protocolInfo) return;
        
        protocolInfo.status = protocolInfo.status === 'connected' ? 'disconnected' : 'connected';
        this.updateProtocolStatus();
        this.logProtocolAction(protocol, protocolInfo.status);
    }
    
    updateProtocolStatus() {
        Object.keys(this.protocols).forEach(protocol => {
            const element = document.getElementById(`${protocol}Status`);
            if (element) {
                const status = this.protocols[protocol].status;
                element.className = 'status-indicator ' + (status === 'connected' ? 'connected' : 'disconnected');
                element.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
            }
        });
    }
    
    logProtocolAction(protocol, status) {
        const logEntry = {
            protocol: protocol,
            status: status,
            timestamp: new Date().toISOString()
        };
        console.log('Protocol action:', logEntry);
        
        // Send to VRINX if connected
        if (this.vrinxConnected) {
            this.sendToVRINX('protocol_status', logEntry);
        }
    }
    
    // Scan Methods
    async startScan() {
        if (this.scanning) return;
        
        this.scanning = true;
        document.getElementById('startScan').disabled = true;
        document.getElementById('stopScan').disabled = false;
        
        this.clearScanOutput();
        this.addScanResult('info', 'Scan Started', 'Initializing human scan detection...');
        
        // Start scanning interval
        this.scanInterval = setInterval(() => this.performScan(), 2000);
        
        // Perform initial scan
        await this.performScan();
    }
    
    stopScan() {
        this.scanning = false;
        document.getElementById('startScan').disabled = false;
        document.getElementById('stopScan').disabled = true;
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        this.addScanResult('info', 'Scan Stopped', 'Human scan detection has been stopped.');
    }
    
    async performScan() {
        try {
            // Simulate scan results
            const scanResults = this.generateScanResults();
            
            this.addScanResult('success', 'Human Detected', `Confidence: ${scanResults.confidence}%`);
            this.addScanResult('info', 'Position Data', `X: ${scanResults.x}, Y: ${scanResults.y}, Z: ${scanResults.z}`);
            this.addScanResult('info', 'Movement Analysis', `Velocity: ${scanResults.velocity}m/s`);
            
            // Send to VRINX if connected
            if (this.vrinxConnected) {
                await this.sendScanDataToVRINX(scanResults);
            }
            
        } catch (error) {
            console.error('Scan error:', error);
            this.addScanResult('error', 'Scan Error', error.message);
        }
    }
    
    generateScanResults() {
        // Simulate realistic scan data
        return {
            confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
            x: (Math.random() * 100 - 50).toFixed(2),
            y: (Math.random() * 100 - 50).toFixed(2),
            z: (Math.random() * 50 + 10).toFixed(2),
            velocity: (Math.random() * 5).toFixed(2)
        };
    }
    
    async sendScanDataToVRINX(scanData) {
        try {
            await fetch('/api/vrinx/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'human_scan',
                    data: scanData,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to send scan data to VRINX:', error);
        }
    }
    
    // Display Management
    addScanResult(type, title, details) {
        const output = document.getElementById('scanOutput');
        if (!output) return;
        
        const resultElement = document.createElement('div');
        resultElement.className = `result-item ${type}`;
        resultElement.innerHTML = `
            <div class="result-title">${title}</div>
            <div class="result-details">${details}</div>
        `;
        
        output.appendChild(resultElement);
        output.scrollTop = output.scrollHeight;
        
        // Limit results to prevent overflow
        const results = output.querySelectorAll('.result-item');
        if (results.length > 20) {
            results[0].remove();
        }
    }
    
    clearScanOutput() {
        const output = document.getElementById('scanOutput');
        if (output) {
            output.innerHTML = '<p>Scan results will appear here...</p>';
        }
    }
    
    // VRINX Communication
    async sendToVRINX(endpoint, data) {
        try {
            await fetch(`/api/vrinx/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('VRINX communication error:', error);
        }
    }
    
    // Utility Methods
    showNotification(title, message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        notification.innerHTML = `<strong>${title}</strong><br>${message}`;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CircuitScanApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitScanApp;
}
