// ============================================
// HAZOOM OS - SECURE PERSISTENT DATA SYSTEM
// ============================================

const PersistentDataSystem = {
    config: {
        // Storage keys
        STORAGE_PREFIX: 'hazoom_secure_',
        ENCRYPTION_KEY: 'hazoom_master_key',
        BACKUP_KEY: 'hazoom_backup',
        
        // Security settings
        ENCRYPTION_ENABLED: true,
        COMPRESSION_ENABLED: true,
        AUTO_BACKUP_INTERVAL: 300000, // 5 minutes
        MAX_BACKUPS: 5,
        
        // Data validation
        MAX_VALUE_SIZE: 10 * 1024 * 1024, // 10MB per value
        MAX_TOTAL_STORAGE: 50 * 1024 * 1024, // 50MB total
        
        // Scalability
        CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large data
        INDEXING_ENABLED: true
    },

    state: {
        encryptionKey: null,
        initialized: false,
        backupTimer: null,
        dataIndex: {},
        writeQueue: [],
        isProcessing: false
    },

    // ============================================
    // INITIALIZATION
    // ============================================
    init: function() {
        console.log('🔐 Initializing Secure Persistent Data System...');
        
        try {
            this.generateOrLoadKey();
            this.buildDataIndex();
            this.restoreWriteQueue();
            this.startAutoBackup();
            this.state.initialized = true;
            
            console.log('✅ Secure Persistent Data System initialized');
            console.log(`🔒 Encryption: ${this.config.ENCRYPTION_ENABLED ? 'Enabled' : 'Disabled'}`);
            console.log(`📊 Indexed items: ${Object.keys(this.state.dataIndex).length}`);
            console.log(`🗄️ Storage used: ${this.getStorageUsage()}`);
        } catch (e) {
            console.error('❌ Failed to initialize persistent data system:', e);
            this.state.initialized = false;
        }
    },

    // ============================================
    // ENCRYPTION
    // ============================================
    generateOrLoadKey: function() {
        let key = localStorage.getItem(this.config.ENCRYPTION_KEY);
        
        if (!key) {
            key = this.generateKey();
            localStorage.setItem(this.config.ENCRYPTION_KEY, key);
            console.log('🔑 Generated new encryption key');
        } else {
            console.log('🔑 Loaded existing encryption key');
        }
        
        this.state.encryptionKey = key;
        return key;
    },

    generateKey: function() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    },

    encrypt: function(data) {
        if (!this.config.ENCRYPTION_ENABLED) return data;
        
        try {
            const key = this.state.encryptionKey;
            const json = JSON.stringify(data);
            const encrypted = this.xorEncrypt(json, key);
            return {
                encrypted: true,
                data: encrypted,
                timestamp: Date.now(),
                version: '2.1.0'
            };
        } catch (e) {
            console.error('❌ Encryption failed:', e);
            return { encrypted: false, data: data, error: e.message };
        }
    },

    decrypt: function(encryptedData) {
        if (!encryptedData.encrypted) return encryptedData.data;
        
        try {
            const key = this.state.encryptionKey;
            const decrypted = this.xorDecrypt(encryptedData.data, key);
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('❌ Decryption failed:', e);
            return null;
        }
    },

    xorEncrypt: function(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    },

    xorDecrypt: function(encoded, key) {
        const text = atob(encoded);
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    },

    // ============================================
    // DATA OPERATIONS
    // ============================================
    set: function(key, value, options = {}) {
        if (!this.state.initialized) {
            console.warn('⚠️ Data system not initialized, initializing now...');
            this.init();
        }

        const timestamp = Date.now();
        const metadata = {
            created: timestamp,
            modified: timestamp,
            size: this.calculateSize(value),
            checksum: this.checksum(JSON.stringify(value)),
            tags: options.tags || [],
            ttl: options.ttl || null
        };

        const dataObject = {
            value: value,
            metadata: metadata,
            encrypted: this.encrypt({ value: value, metadata: metadata })
        };

        try {
            localStorage.setItem(this.config.STORAGE_PREFIX + key, JSON.stringify(dataObject));
            this.updateIndex(key, metadata);
            
            if (options.immediate) {
                this.flushWriteQueue();
            }

            return true;
        } catch (e) {
            console.error('❌ Failed to set data:', e);
            this.state.writeQueue.push({ key, value, options });
            return false;
        }
    },

    get: function(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(this.config.STORAGE_PREFIX + key);
            if (!raw) return defaultValue;

            const dataObject = JSON.parse(raw);
            const decrypted = this.decrypt(dataObject.encrypted);

            if (decrypted) {
                if (this.isExpired(decrypted.metadata)) {
                    console.log(`⏰ Data expired: ${key}`);
                    this.remove(key);
                    return defaultValue;
                }

                return decrypted.value;
            }

            return defaultValue;
        } catch (e) {
            console.error(`❌ Failed to get data for key: ${key}`, e);
            return defaultValue;
        }
    },

    remove: function(key) {
        try {
            localStorage.removeItem(this.config.STORAGE_PREFIX + key);
            delete this.state.dataIndex[key];
            console.log(`🗑️ Removed data: ${key}`);
        } catch (e) {
            console.error(`❌ Failed to remove data for key: ${key}`, e);
        }
    },

    clear: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.config.STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        this.state.dataIndex = {};
        console.log('🧹 Cleared all secure data');
    },

    // ============================================
    // INDEXING & SEARCH
    // ============================================
    buildDataIndex: function() {
        this.state.dataIndex = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (!key.startsWith(this.config.STORAGE_PREFIX)) return;
            
            try {
                const raw = localStorage.getItem(key);
                if (!raw) return;
                
                const dataObject = JSON.parse(raw);
                const shortKey = key.replace(this.config.STORAGE_PREFIX, '');
                
                this.state.dataIndex[shortKey] = dataObject.metadata;
            } catch (e) {
                console.error(`❌ Failed to index: ${key}`, e);
            }
        });
    },

    updateIndex: function(key, metadata) {
        this.state.dataIndex[key] = metadata;
    },

    search: function(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.entries(this.state.dataIndex).forEach(([key, metadata]) => {
            if (key.toLowerCase().includes(queryLower)) {
                results.push({ key, metadata });
            }
            
            if (metadata.tags) {
                metadata.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(queryLower)) {
                        if (!results.find(r => r.key === key)) {
                            results.push({ key, metadata });
                        }
                    }
                });
            }
        });
        
        return results;
    },

    getKeysByTag: function(tag) {
        return Object.entries(this.state.dataIndex)
            .filter(([key, metadata]) => metadata.tags && metadata.tags.includes(tag))
            .map(([key, metadata]) => ({ key, metadata }));
    },

    // ============================================
    // SCALABILITY - CHUNKED STORAGE
    // ============================================
    setLarge: function(key, value, options = {}) {
        const size = this.calculateSize(value);
        
        if (size <= this.config.MAX_VALUE_SIZE) {
            return this.set(key, value, options);
        }

        console.log(`📦 Data too large (${(size / 1024 / 1024).toFixed(2)}MB), using chunked storage`);
        
        try {
            const chunks = this.chunkData(value);
            const chunkKeys = [];
            
            chunks.forEach((chunk, index) => {
                const chunkKey = `${key}_chunk_${index}`;
                this.set(chunkKey, chunk, { ...options, immediate: false });
                chunkKeys.push(chunkKey);
            });

            const manifest = {
                chunks: chunkKeys,
                chunkCount: chunks.length,
                totalSize: size,
                checksum: this.checksum(JSON.stringify(value)),
                created: Date.now()
            };
            
            this.set(`${key}_manifest`, manifest, { immediate: true });
            return true;
        } catch (e) {
            console.error('❌ Failed to store large data:', e);
            return false;
        }
    },

    getLarge: function(key) {
        const manifest = this.get(`${key}_manifest`);
        if (!manifest || !manifest.chunks) {
            return this.get(key);
        }

        try {
            const chunks = manifest.chunks.map(chunkKey => this.get(chunkKey));
            const combined = this.combineChunks(chunks);
            
            const checksum = this.checksum(JSON.stringify(combined));
            if (checksum !== manifest.checksum) {
                console.error('❌ Data integrity check failed');
                return null;
            }
            
            return combined;
        } catch (e) {
            console.error('❌ Failed to retrieve large data:', e);
            return null;
        }
    },

    chunkData: function(data) {
        const json = JSON.stringify(data);
        const chunks = [];
        
        for (let i = 0; i < json.length; i += this.config.CHUNK_SIZE) {
            chunks.push(json.slice(i, i + this.config.CHUNK_SIZE));
        }
        
        return chunks;
    },

    combineChunks: function(chunks) {
        return JSON.parse(chunks.join(''));
    },

    // ============================================
    // BACKUP & RESTORE
    // ============================================
    backup: function() {
        const timestamp = new Date().toISOString();
        const backupData = {
            timestamp: timestamp,
            version: this.config.ENCRYPTION_ENABLED ? 'encrypted' : 'plain',
            data: {},
            index: { ...this.state.dataIndex }
        };

        Object.keys(this.state.dataIndex).forEach(key => {
            const raw = localStorage.getItem(this.config.STORAGE_PREFIX + key);
            if (raw) {
                backupData.data[key] = raw;
            }
        });

        const backups = this.getBackups();
        backups.push(backupData);

        if (backups.length > this.config.MAX_BACKUPS) {
            backups.shift();
        }

        try {
            localStorage.setItem(this.config.BACKUP_KEY, JSON.stringify(backups));
            console.log(`💾 Backup created: ${timestamp}, Total: ${backups.length}`);
            return true;
        } catch (e) {
            console.error('❌ Backup failed:', e);
            return false;
        }
    },

    getBackups: function() {
        try {
            const backups = localStorage.getItem(this.config.BACKUP_KEY);
            return backups ? JSON.parse(backups) : [];
        } catch (e) {
            console.error('❌ Failed to get backups:', e);
            return [];
        }
    },

    restore: function(backupIndex) {
        const backups = this.getBackups();
        
        if (backupIndex < 0 || backupIndex >= backups.length) {
            console.error('❌ Invalid backup index:', backupIndex);
            return false;
        }

        const backup = backups[backupIndex];
        
        try {
            if (confirm(`Restore backup from ${backup.timestamp}?\n\nThis will replace all current data.`)) {
                // Clear current data
                this.clear();
                
                // Restore data
                Object.entries(backup.data).forEach(([key, value]) => {
                    localStorage.setItem(this.config.STORAGE_PREFIX + key, value);
                });
                
                // Restore encryption key
                if (backup.encryptionKey) {
                    localStorage.setItem(this.config.ENCRYPTION_KEY, backup.encryptionKey);
                    this.state.encryptionKey = backup.encryptionKey;
                }
                
                // Rebuild index
                this.buildDataIndex();
                
                console.log(`✅ Backup restored: ${backup.timestamp}`);
                return true;
            }
            return false;
        } catch (e) {
            console.error('❌ Restore failed:', e);
            return false;
        }
    },

    startAutoBackup: function() {
        if (this.state.backupTimer) {
            clearInterval(this.state.backupTimer);
        }

        this.state.backupTimer = setInterval(() => {
            this.backup();
        }, this.config.AUTO_BACKUP_INTERVAL);

        console.log(`🔄 Auto backup enabled (every ${this.config.AUTO_BACKUP_INTERVAL / 1000 / 60} minutes)`);
    },

    stopAutoBackup: function() {
        if (this.state.backupTimer) {
            clearInterval(this.state.backupTimer);
            this.state.backupTimer = null;
            console.log('⏸️ Auto backup disabled');
        }
    },

    // ============================================
    // WRITE QUEUE & FLUSHING
    // ============================================
    flushWriteQueue: function() {
        if (this.state.writeQueue.length === 0) return;
        
        console.log(`📝 Flushing write queue: ${this.state.writeQueue.length} items`);
        const queue = [...this.state.writeQueue];
        this.state.writeQueue = [];
        
        queue.forEach(item => {
            try {
                this.set(item.key, item.value, item.options);
            } catch (e) {
                console.error(`❌ Failed to flush item: ${item.key}`, e);
            }
        });
    },

    restoreWriteQueue: function() {
        const saved = localStorage.getItem(this.config.STORAGE_PREFIX + 'write_queue');
        if (saved) {
            try {
                this.state.writeQueue = JSON.parse(saved);
                console.log(`📥 Restored write queue: ${this.state.writeQueue.length} items`);
                localStorage.removeItem(this.config.STORAGE_PREFIX + 'write_queue');
            } catch (e) {
                console.error('❌ Failed to restore write queue:', e);
            }
        }
    },

    // ============================================
    // UTILITIES
    // ============================================
    calculateSize: function(obj) {
        return new Blob([JSON.stringify(obj)]).size;
    },

    checksum: function(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return hash.toString(16);
    },

    isExpired: function(metadata) {
        if (!metadata.ttl) return false;
        return Date.now() > (metadata.created + metadata.ttl);
    },

    getStorageUsage: function() {
        let used = 0;
        let total = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = new Blob([value]).size;
            total += size;
            
            if (key.startsWith(this.config.STORAGE_PREFIX)) {
                used += size;
            }
        }

        const percentage = total > 0 ? ((used / total) * 100).toFixed(1) : 0;
        return `${(used / 1024 / 1024).toFixed(2)}MB / ${(total / 1024 / 1024).toFixed(2)}MB (${percentage}%)`;
    },

    getDataIndex: function() {
        return { ...this.state.dataIndex };
    },

    exportData: function() {
        const data = {
            version: '2.1.0',
            exported: new Date().toISOString(),
            encryptionEnabled: this.config.ENCRYPTION_ENABLED,
            data: {}
        };

        Object.keys(this.state.dataIndex).forEach(key => {
            data.data[key] = {
                value: this.get(key),
                metadata: this.state.dataIndex[key]
            };
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hazoom-os-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📤 Data exported');
        return true;
    },

    importData: function(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (confirm(`Import data from ${data.exported}?\n\nThis will merge with existing data.`)) {
                Object.entries(data.data).forEach(([key, item]) => {
                    this.set(key, item.value, { tags: item.metadata.tags });
                });
                
                console.log(`📥 Data imported: ${Object.keys(data.data).length} items`);
                return true;
            }
            return false;
        } catch (e) {
            console.error('❌ Import failed:', e);
            return false;
        }
    },

    // ============================================
    // DIAGNOSTICS
    // ============================================
    diagnostics: function() {
        const report = {
            system: {
                initialized: this.state.initialized,
                encryptionEnabled: this.config.ENCRYPTION_ENABLED,
                encryptionKey: this.state.encryptionKey ? 'Set' : 'Not Set',
                autoBackup: this.state.backupTimer ? 'Active' : 'Inactive'
            },
            storage: {
                usage: this.getStorageUsage(),
                indexedItems: Object.keys(this.state.dataIndex).length,
                writeQueueSize: this.state.writeQueue.length,
                maxStorage: `${this.config.MAX_TOTAL_STORAGE / 1024 / 1024}MB`,
                maxValueSize: `${this.config.MAX_VALUE_SIZE / 1024 / 1024}MB`
            },
            backups: {
                count: this.getBackups().length,
                maxBackups: this.config.MAX_BACKUPS
            },
            recentOperations: this.state.dataIndex
        };

        console.log('🔍 Persistent Data System Diagnostics:', report);
        return report;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        PersistentDataSystem.init();
    }, 100);
});

// Export to window for global access
window.PersistentDataSystem = PersistentDataSystem;
