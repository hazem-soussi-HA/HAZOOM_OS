const http = require('http');
const url = require('url');

// VRINX Integration Server
class VRINXIntegrationServer {
    constructor(port = 8888) {
        this.port = port;
        this.vrinxClients = new Map();
        this.scanSessions = new Map();
        
        this.setupRoutes();
        this.startServer();
    }
    
    setupRoutes() {
        this.server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const method = req.method;
            const path = parsedUrl.pathname;
            
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Route handling
            if (path === '/api/vrinx/auth' && method === 'POST') {
                this.handleAuth(req, res);
            } else if (path === '/api/vrinx/scan' && method === 'POST') {
                this.handleScan(req, res);
            } else if (path === '/api/vrinx/health' && method === 'GET') {
                this.handleHealthCheck(req, res);
            } else if (path.startsWith('/api/vrinx/') && method === 'POST') {
                this.handleVRINXEvent(req, res, path);
            } else {
                this.handleNotFound(res);
            }
        });
    }
    
    startServer() {
        this.server.listen(this.port, () => {
            console.log(`VRINX Integration Server running on port ${this.port}`);
        });
    }
    
    // Authentication endpoint
    handleAuth(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { clientId, timestamp, capabilities } = data;
                
                // Validate and register client
                const clientIdHash = this.hashClientId(clientId);
                this.vrinxClients.set(clientIdHash, {
                    id: clientId,
                    capabilities,
                    authenticated: true,
                    timestamp: new Date().toISOString()
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    clientId: clientIdHash,
                    token: this.generateToken(clientIdHash),
                    capabilities: capabilities
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid authentication data' }));
            }
        });
    }
    
    // Scan data endpoint
    async handleScan(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const scanData = JSON.parse(body);
                
                // Process scan data
                const sessionId = this.generateSessionId();
                this.scanSessions.set(sessionId, {
                    ...scanData,
                    timestamp: new Date().toISOString(),
                    status: 'processed'
                });
                
                // Broadcast to connected VRINX clients
                await this.broadcastToVRINX('scan_result', {
                    sessionId,
                    ...scanData
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    sessionId,
                    processed: true
                }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid scan data' }));
            }
        });
    }
    
    // Health check endpoint
    handleHealthCheck(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            vrinxClients: this.vrinxClients.size,
            scanSessions: this.scanSessions.size
        }));
    }
    
    // VRINX event handling
    handleVRINXEvent(req, res, path) {
        const eventType = path.replace('/api/vrinx/', '');
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const eventData = JSON.parse(body);
                console.log(`VRINX Event: ${eventType}`, eventData);
                
                // Handle different event types
                this.processVRINXEvent(eventType, eventData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, event: eventType }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid event data' }));
            }
        });
    }
    
    // Process VRINX events
    processVRINXEvent(eventType, data) {
        switch (eventType) {
            case 'human_detected':
                this.handleHumanDetection(data);
                break;
            case 'protocol_change':
                this.handleProtocolChange(data);
                break;
            case 'scan_complete':
                this.handleScanComplete(data);
                break;
            default:
                console.log('Unknown VRINX event:', eventType);
        }
    }
    
    handleHumanDetection(data) {
        console.log('Human detected:', data);
        // Trigger scan or notification
    }
    
    handleProtocolChange(data) {
        console.log('Protocol changed:', data);
        // Update display protocols
    }
    
    handleScanComplete(data) {
        console.log('Scan complete:', data);
        // Process final scan results
    }
    
    // Broadcast to VRINX clients
    async broadcastToVRINX(eventType, data) {
        const message = JSON.stringify({
            event: eventType,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // In a real implementation, this would send to connected VRINX clients
        console.log(`Broadcasting to VRINX: ${eventType}`, data);
    }
    
    // Utility methods
    hashClientId(clientId) {
        // Simple hash for client identification
        return require('crypto').createHash('md5').update(clientId).digest('hex');
    }
    
    generateToken(clientId) {
        return require('crypto').randomBytes(32).toString('hex');
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    handleNotFound(res) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
}

// Start the server
const server = new VRINXIntegrationServer(8888);

module.exports = VRINXIntegrationServer;
