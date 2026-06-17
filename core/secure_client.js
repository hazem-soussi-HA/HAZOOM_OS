// ============================================
// HAZOOM OS SECURE CLIENT
// ============================================
// Client-side JavaScript for secure API communication
// No HTML extensions exposed, all communication via API

class HAZOOMSecureClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.sessionId = null;
        this.updateInterval = null;
        this.supervisionInterval = null;
        this.config = {
            updateRate: 1000, // Dashboard updates
            supervisionRate: 369, // Supervision updates
            maxLogs: 50,
            voiceEnabled: true
        };
        
        // Initialize on load
        this.init();
    }

    init() {
        // Check for existing session
        const savedSession = localStorage.getItem('hazoomSession');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            if (this.isSessionValid(session)) {
                this.sessionId = session.id;
                this.showDashboard();
                return;
            }
        }
        
        // Show login page
        this.showLogin();
    }

    isSessionValid(session) {
        if (!session || !session.id || !session.expires) return false;
        return Date.now() < session.expires;
    }

    // ============================================
    // API COMMUNICATION
    // ============================================

    async apiRequest(endpoint, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.sessionId) {
            headers['X-Session-ID'] = this.sessionId;
        }

        const options = {
            method: method,
            headers: headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            
            if (response.status === 401) {
                this.logout();
                throw new Error('Unauthorized');
            }

            if (response.status === 429) {
                throw new Error('Rate limit exceeded');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            this.addLog(`API Error: ${error.message}`, 'error');
            throw error;
        }
    }

    // ============================================
    // AUTHENTICATION
    // ============================================

    async login(username, password) {
        try {
            const response = await this.apiRequest('/api/login', 'POST', {
                username: username,
                password: password
            });

            if (response.success) {
                this.sessionId = response.sessionId;
                
                // Store session securely
                const session = {
                    id: response.sessionId,
                    expires: Date.now() + (30 * 60 * 1000), // 30 minutes
                    username: username
                };
                localStorage.setItem('hazoomSession', JSON.stringify(session));
                
                this.showDashboard();
                this.addLog('Login successful', 'success');
                this.speak('Admin monitor online. System status is normal.');
                
                return true;
            } else {
                this.addLog('Login failed: ' + response.message, 'error');
                return false;
            }
        } catch (error) {
            this.addLog('Login error: ' + error.message, 'error');
            return false;
        }
    }

    logout() {
        if (this.sessionId) {
            this.apiRequest('/api/logout', 'POST').catch(() => {});
        }
        
        localStorage.removeItem('hazoomSession');
        this.sessionId = null;
        this.stopAllIntervals();
        this.showLogin();
        this.addLog('Logged out', 'info');
    }

    // ============================================
    // UI MANAGEMENT
    // ============================================

    showLogin() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <h2>Admin Access</h2>
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" placeholder="Enter admin username" value="admin">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" placeholder="Enter admin password" value="admin123">
                    </div>
                    <button class="btn" onclick="client.handleLogin()">Login</button>
                    <div style="margin-top: 15px; color: #777; font-size: 0.8em; text-align: center;">
                        Secure Supervision Dashboard
                    </div>
                </div>
            </div>
        `;
    }

    showDashboard() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="dashboard-container">
                <!-- Header -->
                <div class="header">
                    <h1 class="gradient-text">🔒 HAZOOM OS Secure Monitor</h1>
                    <div class="header-subtitle">Real-time Supervision System</div>
                </div>

                <!-- Hazoom Time Online -->
                <div class="hazoom-time-card" onclick="client.handleHazoomTimeClick()">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: var(--primary-purple);">⚡ HAZOOM TIME ONLINE</span>
                        <span class="live-indicator"><span class="live-dot"></span>LIVE</span>
                    </div>
                    <div class="hazoom-time-display" id="hazoomTimeDisplay">--:--:--</div>
                    <div class="hazoom-time-date" id="hazoomTimeDate">Loading...</div>
                    <div class="hazoom-time-clicks" id="hazoomTimeClicks">Clicks: 0</div>
                </div>

                <!-- Navigation -->
                <div class="nav-tabs">
                    <div class="nav-tab active" onclick="client.switchTab('dashboard')">📊 Dashboard</div>
                    <div class="nav-tab" onclick="client.switchTab('supervision')">🎯 Supervision</div>
                    <div class="nav-tab" onclick="client.switchTab('settings')">⚙️ Settings</div>
                    <div class="nav-tab" onclick="client.logout()">🚪 Logout</div>
                </div>

                <!-- Dashboard Tab -->
                <div class="tab-content active" id="tab-dashboard">
                    <div class="quick-stats">
                        <div class="quick-stat">
                            <div class="quick-stat-value" id="topBarClock">--:--:--</div>
                            <div class="quick-stat-label">TopBar Clock</div>
                        </div>
                        <div class="quick-stat">
                            <div class="quick-stat-value" id="dashboardClock">--:--:--</div>
                            <div class="quick-stat-label">Dashboard Clock</div>
                        </div>
                        <div class="quick-stat">
                            <div class="quick-stat-value" id="hazoomClock">--:--:--</div>
                            <div class="quick-stat-label">Hazoom Clock</div>
                        </div>
                        <div class="quick-stat">
                            <div class="quick-stat-value" id="updateRate">1000ms</div>
                            <div class="quick-stat-label">Update Rate</div>
                        </div>
                    </div>

                    <div class="system-status-banner">
                        <div>
                            <div style="font-size: 0.9em; color: #a0a0ff; margin-bottom: 4px;">System Health</div>
                            <div class="status-health" id="systemHealth">98.5%</div>
                        </div>
                        <div class="status-details">
                            <div>HAZOOM OS v2.1</div>
                            <div style="font-size: 0.8em; opacity: 0.8;">Secure Server Active</div>
                        </div>
                    </div>

                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-label">CPU Usage</div>
                            <div class="metric-value" id="cpuValue">45<span class="metric-unit">%</span></div>
                            <div class="metric-status status-normal" id="cpuStatus">Normal</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Memory</div>
                            <div class="metric-value" id="memoryValue">6.2<span class="metric-unit">GB</span></div>
                            <div class="metric-status status-normal" id="memoryStatus">Normal</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Disk Space</div>
                            <div class="metric-value" id="diskValue">142<span class="metric-unit">GB</span></div>
                            <div class="metric-status status-warning" id="diskStatus">High</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Network</div>
                            <div class="metric-value" id="networkValue">1.2<span class="metric-unit">Mbps</span></div>
                            <div class="metric-status status-normal" id="networkStatus">Normal</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Active Agents</div>
                            <div class="metric-value" id="agentsValue">12<span class="metric-unit"></span></div>
                            <div class="metric-status status-normal" id="agentsStatus">Running</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Success Rate</div>
                            <div class="metric-value" id="successValue">96.8<span class="metric-unit">%</span></div>
                            <div class="metric-status status-normal" id="successStatus">Excellent</div>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="client.refreshData()">🔄 Refresh Data</button>
                        <button class="action-btn" onclick="client.toggleRealtimeUpdates()" id="updateToggle">⏸️ Pause Updates</button>
                        <button class="action-btn" onclick="client.exportData()">📥 Export Data</button>
                    </div>

                    <div style="margin-top: 16px;">
                        <div class="chart-title">📋 System Log</div>
                        <div class="logs-console" id="logs">
                            <div class="log-entry">
                                <span class="log-time">[--:--:--]</span>
                                <span class="log-message log-info">Secure monitor initialized</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Supervision Tab -->
                <div class="tab-content" id="tab-supervision">
                    <div class="header" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2)); border-color: rgba(239, 68, 68, 0.4);">
                        <h2 style="margin: 0; color: #ff6b6b;">🎯 Real-Time Supervision System</h2>
                        <div style="font-size: 0.9em; color: #ffaa00; margin-top: 8px;">Live CPU & Memory Monitoring with Action Controls</div>
                    </div>

                    <div class="system-status-banner" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2)); border-color: rgba(239, 68, 68, 0.4);">
                        <div>
                            <div style="font-size: 0.9em; color: #ffaa00; margin-bottom: 4px;">Supervision Status</div>
                            <div class="status-health" id="supervisionStatus" style="color: #ff6b6b;">ACTIVE</div>
                        </div>
                        <div class="status-details">
                            <div>Update Rate: <span id="supervisionRate">369ms</span></div>
                            <div style="font-size: 0.8em; opacity: 0.8;">Ultra-Fast Monitoring</div>
                        </div>
                    </div>

                    <div class="metric-card" style="margin-bottom: 16px; border-color: rgba(239, 68, 68, 0.5);">
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center;">
                            <div>
                                <div class="metric-label" style="color: #ff6b6b;">🔴 CPU SUPERVISION</div>
                                <div class="metric-value" id="supervisionCpuValue">45<span class="metric-unit">%</span></div>
                                <div class="metric-status" id="supervisionCpuStatus">Normal</div>
                                <div style="font-size: 0.75em; color: #ff8888; margin-top: 4px;">Real-time CPU usage monitoring</div>
                            </div>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="action-btn danger" onclick="client.supervisionAction('cpu', 'throttle')">⚡ Throttle</button>
                                <button class="action-btn" onclick="client.supervisionAction('cpu', 'optimize')">🔧 Optimize</button>
                                <button class="action-btn" onclick="client.supervisionAction('cpu', 'analyze')">📊 Analyze</button>
                            </div>
                        </div>
                        <div style="margin-top: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; padding: 8px; height: 60px; position: relative; overflow: hidden;">
                            <div id="cpuLiveChart" style="width: 100%; height: 100%; display: flex; align-items: flex-end; gap: 2px;"></div>
                        </div>
                    </div>

                    <div class="metric-card" style="margin-bottom: 16px; border-color: rgba(245, 158, 11, 0.5);">
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center;">
                            <div>
                                <div class="metric-label" style="color: #ffaa00;">🟡 MEMORY SUPERVISION</div>
                                <div class="metric-value" id="supervisionMemoryValue">6.2<span class="metric-unit">GB</span></div>
                                <div class="metric-status" id="supervisionMemoryStatus">Normal</div>
                                <div style="font-size: 0.75em; color: #ffcc88; margin-top: 4px;">Live memory allocation tracking</div>
                            </div>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="action-btn danger" onclick="client.supervisionAction('memory', 'clear')">🗑️ Clear</button>
                                <button class="action-btn" onclick="client.supervisionAction('memory', 'compact')">📦 Compact</button>
                                <button class="action-btn" onclick="client.supervisionAction('memory', 'profile')">🔍 Profile</button>
                            </div>
                        </div>
                        <div style="margin-top: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; padding: 8px; height: 60px; position: relative; overflow: hidden;">
                            <div id="memoryLiveChart" style="width: 100%; height: 100%; display: flex; align-items: flex-end; gap: 2px;"></div>
                        </div>
                    </div>

                    <div class="metrics-grid">
                        <div class="metric-card" style="border-color: rgba(16, 185, 129, 0.5);">
                            <div class="metric-label" style="color: #10b981;">🟢 PROCESSING</div>
                            <div class="metric-value" id="processingRate">0<span class="metric-unit">/s</span></div>
                            <div class="metric-status status-normal">Tasks/sec</div>
                        </div>
                        <div class="metric-card" style="border-color: rgba(6, 182, 212, 0.5);">
                            <div class="metric-label" style="color: #06b6d4;">🔵 EFFICIENCY</div>
                            <div class="metric-value" id="efficiencyRate">96<span class="metric-unit">%</span></div>
                            <div class="metric-status status-normal">Optimal</div>
                        </div>
                        <div class="metric-card" style="border-color: rgba(139, 92, 246, 0.5);">
                            <div class="metric-label" style="color: #8b5cf6;">🟣 RESPONSE</div>
                            <div class="metric-value" id="responseTime">45<span class="metric-unit">ms</span></div>
                            <div class="metric-status status-normal">Fast</div>
                        </div>
                        <div class="metric-card" style="border-color: rgba(239, 68, 68, 0.5);">
                            <div class="metric-label" style="color: #ef4444;">🔴 ALERTS</div>
                            <div class="metric-value" id="alertCount">0<span class="metric-unit"></span></div>
                            <div class="metric-status status-normal">Active</div>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="action-btn danger" onclick="client.supervisionAction('system', 'emergency')">🚨 Emergency Stop</button>
                        <button class="action-btn primary" onclick="client.supervisionAction('system', 'restart')">🔄 Restart All</button>
                        <button class="action-btn" onclick="client.supervisionAction('system', 'pause')">⏸️ Pause All</button>
                        <button class="action-btn" onclick="client.supervisionAction('system', 'resume')">▶️ Resume All</button>
                        <button class="action-btn" onclick="client.exportSupervisionData()">📥 Export Data</button>
                    </div>

                    <div style="margin-top: 16px;">
                        <div class="chart-title">📋 Supervision Event Log</div>
                        <div class="logs-console" id="supervisionLogs" style="max-height: 250px;">
                            <div class="log-entry">
                                <span class="log-time">[--:--:--]</span>
                                <span class="log-message log-info">Supervision system initialized</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Settings Tab -->
                <div class="tab-content" id="tab-settings">
                    <div class="settings-section">
                        <div class="settings-title">🔔 Notifications & Alerts</div>
                        <div class="setting-item">
                            <div class="setting-label">Voice Announcements</div>
                            <div class="setting-control">
                                <div class="toggle-switch active" id="voiceToggle" onclick="client.toggleVoice()"></div>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-label">Real-time Updates</div>
                            <div class="setting-control">
                                <div class="toggle-switch active" id="realtimeToggle" onclick="client.toggleRealtime()"></div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="settings-title">⚙️ System Configuration</div>
                        <div class="setting-item">
                            <div class="setting-label">Update Interval</div>
                            <div class="setting-control">
                                <select class="filter-select" id="updateInterval" onchange="client.changeUpdateInterval()">
                                    <option value="369">369ms (Ultra-fast)</option>
                                    <option value="500">500ms (Fast)</option>
                                    <option value="1000" selected>1000ms (Normal)</option>
                                    <option value="2000">2000ms (Slow)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="action-btn primary" onclick="client.saveSettings()">💾 Save Settings</button>
                        <button class="action-btn" onclick="client.resetSettings()">🔄 Reset to Default</button>
                    </div>
                </div>
            </div>
        `;
        
        // Start monitoring
        this.startClockUpdates();
        this.startHazoomTimeUpdates();
        this.startRealtimeUpdates();
        this.startSupervision();
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(`tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.addLog(`Switched to ${tabName} tab`, 'info');
    }

    // ============================================
    // REAL-TIME UPDATES
    // ============================================

    startClockUpdates() {
        setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
            
            const clocks = ['topBarClock', 'dashboardClock', 'hazoomClock'];
            clocks.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = timeStr;
            });
        }, 1000);
    }

    startHazoomTimeUpdates() {
        setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
            const dateStr = now.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            const timeEl = document.getElementById('hazoomTimeDisplay');
            const dateEl = document.getElementById('hazoomTimeDate');
            
            if (timeEl) timeEl.textContent = timeStr;
            if (dateEl) dateEl.textContent = dateStr;
        }, 1000);
    }

    handleHazoomTimeClick() {
        const clicksEl = document.getElementById('hazoomTimeClicks');
        if (!clicksEl) return;
        
        const current = parseInt(clicksEl.textContent.match(/\d+/)[0]);
        const newCount = current + 1;
        clicksEl.textContent = `Clicks: ${newCount}`;
        
        // Visual feedback
        const card = document.querySelector('.hazoom-time-card');
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 100);
        
        this.addLog(`Hazoom Time clicked: ${newCount} total`, 'info');
        
        if (newCount % 5 === 0) {
            this.showToast(`Hazoom Time clicked ${newCount} times!`, 'success');
            this.speak('Hazoom time interaction recorded.');
        }
    }

    async startRealtimeUpdates() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        this.updateInterval = setInterval(async () => {
            if (!this.config.realtimeUpdates) return;
            
            try {
                const metrics = await this.apiRequest('/api/metrics');
                this.updateDashboardMetrics(metrics);
            } catch (error) {
                console.error('Update error:', error);
            }
        }, this.config.updateRate);
    }

    updateDashboardMetrics(metrics) {
        if (!metrics) return;
        
        // Update metric cards
        this.updateMetric('cpuValue', metrics.cpu, '%');
        this.updateMetric('memoryValue', metrics.memory, 'GB');
        this.updateMetric('diskValue', metrics.disk, 'GB');
        this.updateMetric('networkValue', metrics.network, 'Mbps');
        this.updateMetric('agentsValue', metrics.agents, '');
        this.updateMetric('successValue', metrics.success, '%');
        
        // Update system health
        const healthEl = document.getElementById('systemHealth');
        if (healthEl) healthEl.textContent = metrics.health.toFixed(1) + '%';
        
        // Update status indicators
        this.updateStatusIndicators(metrics);
        
        // Update counters
        const updateCounter = document.getElementById('updateCounter');
        if (updateCounter) {
            const current = parseInt(updateCounter.textContent) || 0;
            updateCounter.textContent = current + 1;
        }
        
        // Voice announcements for critical thresholds
        if (this.config.voiceEnabled) {
            if (metrics.cpu > 80 && this.lastAnnouncement !== 'cpu') {
                this.speak(`Warning. CPU usage is at ${metrics.cpu.toFixed(0)} percent`);
                this.lastAnnouncement = 'cpu';
                setTimeout(() => this.lastAnnouncement = '', 10000);
            }
            if (metrics.memory > 8 && this.lastAnnouncement !== 'memory') {
                this.speak(`Memory usage is at ${metrics.memory.toFixed(1)} gigabytes`);
                this.lastAnnouncement = 'memory';
                setTimeout(() => this.lastAnnouncement = '', 10000);
            }
        }
        
        // Add log periodically
        if (Math.random() > 0.95) {
            this.addLog(`Metrics updated - CPU: ${metrics.cpu.toFixed(1)}%, Memory: ${metrics.memory.toFixed(1)}GB`, 'info');
        }
    }

    updateMetric(id, value, unit) {
        const el = document.getElementById(id);
        if (el && value !== undefined) {
            el.innerHTML = value.toFixed ? value.toFixed(1) + `<span class="metric-unit">${unit}</span>` : value + `<span class="metric-unit">${unit}</span>`;
        }
    }

    updateStatusIndicators(metrics) {
        // CPU Status
        const cpuStatus = document.getElementById('cpuStatus');
        if (cpuStatus) {
            if (metrics.cpu > 80) {
                cpuStatus.textContent = 'High';
                cpuStatus.className = 'metric-status status-error';
            } else if (metrics.cpu > 60) {
                cpuStatus.textContent = 'Elevated';
                cpuStatus.className = 'metric-status status-warning';
            } else {
                cpuStatus.textContent = 'Normal';
                cpuStatus.className = 'metric-status status-normal';
            }
        }
        
        // Memory Status
        const memoryStatus = document.getElementById('memoryStatus');
        if (memoryStatus) {
            if (metrics.memory > 8) {
                memoryStatus.textContent = 'High';
                memoryStatus.className = 'metric-status status-warning';
            } else {
                memoryStatus.textContent = 'Normal';
                memoryStatus.className = 'metric-status status-normal';
            }
        }
        
        // Network Status
        const networkStatus = document.getElementById('networkStatus');
        if (networkStatus) {
            if (metrics.network > 3) {
                networkStatus.textContent = 'Busy';
                networkStatus.className = 'metric-status status-warning';
            } else {
                networkStatus.textContent = 'Normal';
                networkStatus.className = 'metric-status status-normal';
            }
        }
    }

    // ============================================
    // SUPERVISION SYSTEM
    // ============================================

    startSupervision() {
        if (this.supervisionInterval) clearInterval(this.supervisionInterval);
        
        this.supervisionInterval = setInterval(async () => {
            try {
                const data = await this.apiRequest('/api/supervision');
                this.updateSupervisionMetrics(data);
            } catch (error) {
                console.error('Supervision error:', error);
            }
        }, this.config.supervisionRate);
    }

    updateSupervisionMetrics(data) {
        if (!data) return;
        
        // Update CPU/Memory values
        const cpuEl = document.getElementById('supervisionCpuValue');
        const memEl = document.getElementById('supervisionMemoryValue');
        
        if (cpuEl) cpuEl.innerHTML = data.cpu.toFixed(1) + '<span class="metric-unit">%</span>';
        if (memEl) memEl.innerHTML = data.memory.toFixed(1) + '<span class="metric-unit">GB</span>';
        
        // Update status indicators
        const cpuStatus = document.getElementById('supervisionCpuStatus');
        const memStatus = document.getElementById('supervisionMemoryStatus');
        
        if (cpuStatus) {
            if (data.cpu > 80) {
                cpuStatus.textContent = 'CRITICAL';
                cpuStatus.className = 'metric-status status-error';
            } else if (data.cpu > 60) {
                cpuStatus.textContent = 'High';
                cpuStatus.className = 'metric-status status-warning';
            } else {
                cpuStatus.textContent = 'Normal';
                cpuStatus.className = 'metric-status status-normal';
            }
        }
        
        if (memStatus) {
            if (data.memory > 8) {
                memStatus.textContent = 'High';
                memStatus.className = 'metric-status status-warning';
            } else {
                memStatus.textContent = 'Normal';
                memStatus.className = 'metric-status status-normal';
            }
        }
        
        // Update combined metrics
        this.updateMetric('processingRate', data.processing, '/s');
        this.updateMetric('efficiencyRate', data.efficiency, '%');
        this.updateMetric('responseTime', data.responseTime, 'ms');
        this.updateMetric('alertCount', data.alerts, '');
        
        // Update live charts
        this.updateLiveChart('cpuLiveChart', data.cpu, 'rgba(239, 68, 68, 0.6)');
        this.updateLiveChart('memoryLiveChart', data.memory * 10, 'rgba(245, 158, 11, 0.6)');
        
        // Update supervision status
        const statusEl = document.getElementById('supervisionStatus');
        if (statusEl) {
            statusEl.textContent = 'ACTIVE';
            statusEl.style.color = '#00ff88';
        }
    }

    updateLiveChart(chartId, value, color) {
        const chart = document.getElementById(chartId);
        if (!chart) return;
        
        const bar = document.createElement('div');
        bar.style.width = '4px';
        bar.style.height = Math.min(value, 100) + '%';
        bar.style.backgroundColor = color;
        bar.style.borderRadius = '2px';
        bar.style.transition = 'all 0.3s ease';
        
        chart.appendChild(bar);
        
        while (chart.children.length > 50) {
            chart.removeChild(chart.firstChild);
        }
    }

    async supervisionAction(target, action) {
        const timestamp = new Date().toLocaleTimeString();
        
        try {
            const response = await this.apiRequest('/api/actions', 'POST', {
                target: target,
                action: action
            });
            
            if (response.success) {
                this.addSupervisionLog(`[${timestamp}] ${response.message}`, 'success');
                this.speak(response.message);
                
                // Visual feedback
                const btn = event.target;
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 100);
                
                // Update metrics based on action
                if (target === 'cpu' && action === 'throttle') {
                    const cpuEl = document.getElementById('supervisionCpuValue');
                    if (cpuEl) {
                        const current = parseFloat(cpuEl.textContent);
                        cpuEl.innerHTML = (current - 15).toFixed(1) + '<span class="metric-unit">%</span>';
                    }
                } else if (target === 'memory' && action === 'clear') {
                    const memEl = document.getElementById('supervisionMemoryValue');
                    if (memEl) {
                        const current = parseFloat(memEl.textContent);
                        memEl.innerHTML = (current - 1.2).toFixed(1) + '<span class="metric-unit">GB</span>';
                    }
                } else if (target === 'system' && action === 'emergency') {
                    this.addSupervisionLog(`[${timestamp}] 🚨 EMERGENCY STOP INITIATED`, 'error');
                    // Stop supervision temporarily
                    if (this.supervisionInterval) {
                        clearInterval(this.supervisionInterval);
                        setTimeout(() => this.startSupervision(), 2000);
                    }
                }
            }
        } catch (error) {
            this.addSupervisionLog(`[${timestamp}] Action failed: ${error.message}`, 'error');
        }
    }

    // ============================================
    // DATA EXPORT
    // ============================================

    async exportData() {
        try {
            const data = await this.apiRequest('/api/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hazoom_export_${Date.now()}.json`;
            a.click();
            
            this.addLog('Data exported successfully', 'success');
            this.showToast('Data exported', 'success');
            this.speak('Data exported');
        } catch (error) {
            this.addLog('Export failed: ' + error.message, 'error');
        }
    }

    async exportSupervisionData() {
        try {
            const data = await this.apiRequest('/api/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `supervision_data_${Date.now()}.json`;
            a.click();
            
            this.addSupervisionLog('Supervision data exported', 'success');
            this.showToast('Supervision data exported', 'success');
            this.speak('Supervision data exported');
        } catch (error) {
            this.addSupervisionLog('Export failed: ' + error.message, 'error');
        }
    }

    // ============================================
    // SETTINGS
    // ============================================

    toggleVoice() {
        this.config.voiceEnabled = !this.config.voiceEnabled;
        const toggle = document.getElementById('voiceToggle');
        
        if (this.config.voiceEnabled) {
            toggle.classList.add('active');
            this.addLog('Voice announcements enabled', 'success');
            this.showToast('Voice enabled', 'success');
            this.speak('Voice announcements enabled');
        } else {
            toggle.classList.remove('active');
            this.addLog('Voice announcements disabled', 'warning');
            this.showToast('Voice disabled', 'warning');
        }
    }

    toggleRealtime() {
        this.config.realtimeUpdates = !this.config.realtimeUpdates;
        const toggle = document.getElementById('realtimeToggle');
        
        if (this.config.realtimeUpdates) {
            toggle.classList.add('active');
            this.startRealtimeUpdates();
            this.addLog('Real-time updates enabled', 'success');
            this.showToast('Updates enabled', 'success');
        } else {
            toggle.classList.remove('active');
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            this.addLog('Real-time updates disabled', 'warning');
            this.showToast('Updates disabled', 'warning');
        }
    }

    changeUpdateInterval() {
        const select = document.getElementById('updateInterval');
        if (select) {
            this.config.updateRate = parseInt(select.value);
            
            if (this.updateInterval && this.config.realtimeUpdates) {
                clearInterval(this.updateInterval);
                this.startRealtimeUpdates();
            }
            
            const rateEl = document.getElementById('updateRate');
            if (rateEl) rateEl.textContent = select.value + 'ms';
            
            this.addLog(`Update interval changed to ${select.value}ms`, 'info');
            this.showToast('Update interval changed', 'success');
        }
    }

    saveSettings() {
        const settings = {
            voiceEnabled: this.config.voiceEnabled,
            realtimeUpdates: this.config.realtimeUpdates,
            updateRate: this.config.updateRate,
            supervisionRate: this.config.supervisionRate
        };
        
        localStorage.setItem('hazoomSettings', JSON.stringify(settings));
        this.addLog('Settings saved', 'success');
        this.showToast('Settings saved', 'success');
        this.speak('Settings saved');
    }

    resetSettings() {
        if (confirm('Reset all settings to default?')) {
            this.config.voiceEnabled = true;
            this.config.realtimeUpdates = true;
            this.config.updateRate = 1000;
            this.config.supervisionRate = 369;
            
            // Reset UI
            const voiceToggle = document.getElementById('voiceToggle');
            const realtimeToggle = document.getElementById('realtimeToggle');
            const updateInterval = document.getElementById('updateInterval');
            
            if (voiceToggle) voiceToggle.classList.add('active');
            if (realtimeToggle) realtimeToggle.classList.add('active');
            if (updateInterval) updateInterval.value = '1000';
            
            const rateEl = document.getElementById('updateRate');
            if (rateEl) rateEl.textContent = '1000ms';
            
            this.addLog('Settings reset to default', 'warning');
            this.showToast('Settings reset', 'warning');
            this.speak('Settings reset to default');
        }
    }

    refreshData() {
        this.addLog('Refreshing data...', 'info');
        this.showToast('Refreshing data', 'info');
        this.speak('Refreshing data');
        
        // Trigger immediate update
        if (this.config.realtimeUpdates) {
            this.apiRequest('/api/metrics')
                .then(metrics => this.updateDashboardMetrics(metrics))
                .then(() => {
                    this.addLog('Data refreshed', 'success');
                    this.showToast('Data refreshed', 'success');
                });
        }
    }

    // ============================================
    // LOGGING & UI HELPERS
    // ============================================

    addLog(message, type = 'info') {
        const logs = document.getElementById('logs');
        if (!logs) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const now = new Date();
        const timestamp = now.toTimeString().split(' ')[0];
        
        entry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message log-${type}">${message}</span>
        `;
        
        logs.insertBefore(entry, logs.firstChild);
        
        while (logs.children.length > this.config.maxLogs) {
            logs.removeChild(logs.lastChild);
        }
    }

    addSupervisionLog(message, type = 'info') {
        const logs = document.getElementById('supervisionLogs');
        if (!logs) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const now = new Date();
        const timestamp = now.toTimeString().split(' ')[0];
        
        entry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message log-${type}">${message}</span>
        `;
        
        logs.insertBefore(entry, logs.firstChild);
        
        while (logs.children.length > 30) {
            logs.removeChild(logs.lastChild);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) {
            // Create toast container if it doesn't exist
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    speak(text) {
        if (!this.config.voiceEnabled || !window.speechSynthesis) return;
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }

    stopAllIntervals() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.supervisionInterval) {
            clearInterval(this.supervisionInterval);
            this.supervisionInterval = null;
        }
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showToast('Please enter username and password', 'error');
            return;
        }
        
        this.login(username, password);
    }
}

// Initialize client when page loads
let client;
document.addEventListener('DOMContentLoaded', () => {
    client = new HAZOOMSecureClient();
    
    // Load saved settings
    const savedSettings = localStorage.getItem('hazoomSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (client) {
            client.config.voiceEnabled = settings.voiceEnabled !== false;
            client.config.realtimeUpdates = settings.realtimeUpdates !== false;
            client.config.updateRate = settings.updateRate || 1000;
            client.config.supervisionRate = settings.supervisionRate || 369;
        }
    }
});