/**
 * HAZOOM OS v5.0 — Centralized Configuration
 * No dotenv dependency. Environment variables with file-based defaults.
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Default configuration
const DEFAULTS = {
    // Server
    httpPort: 3000,
    httpsPort: 8443,
    host: '0.0.0.0',
    maxRequestBody: '1mb',

    // Security
    rateLimitWindow: 15 * 60 * 1000,  // 15 minutes
    rateLimitMax: 300,
    helmetEnabled: true,

    // Kernel
    maxProcesses: 1024,
    totalMemoryGB: 16,
    pageSize: 4096,
    swapGB: 4,
    kernelReservedMB: 512,
    timeQuantum: 100,

    // WebSocket
    wsTickInterval: 2000,  // ms between kernel ticks pushed to clients

    // Q-Learning
    qLearning: {
        enabled: true,
        mode: 'hybrid',  // 'tabular', 'dqn', 'hybrid'
        tabular: {
            alpha: 0.1,
            gamma: 0.95,
            epsilon: 1.0,
            epsilonMin: 0.01,
            epsilonDecay: 0.995
        },
        dqn: {
            learningRate: 0.00025,
            gamma: 0.99,
            epsilon: 1.0,
            epsilonMin: 0.01,
            epsilonDecay: 0.9999,
            bufferSize: 100000,
            batchSize: 32,
            targetUpdateFreq: 1000,
            momentum: 0.9
        },
        persistencePath: 'data/qlearner'
    },

    // Logging
    logLevel: 'info',  // debug, info, warn, error
    logMaxLines: 5000,

    // Paths
    sslDir: 'ssl',
    staticDir: '.'
};

class Config {
    constructor(overrides = {}) {
        // Start with defaults
        this._config = { ...DEFAULTS };

        // Load from config file if exists
        this._loadFile();

        // Apply environment variable overrides
        this._loadEnv();

        // Apply programmatic overrides
        this._merge(overrides);
    }

    _loadFile() {
        const configPaths = [
            path.join(__dirname, '..', 'config', 'default.json'),
            path.join(__dirname, '..', 'config', 'local.json')
        ];

        for (const configPath of configPaths) {
            try {
                if (fs.existsSync(configPath)) {
                    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    this._merge(data);
                }
            } catch (e) {
                // Config file errors are non-fatal
                console.warn(`[CONFIG] Failed to load ${configPath}: ${e.message}`);
            }
        }
    }

    _loadEnv() {
        const envMap = {
            PORT: 'httpPort',
            HTTPS_PORT: 'httpsPort',
            HOST: 'host',
            NODE_ENV: 'env',
            LOG_LEVEL: 'logLevel'
        };

        for (const [envKey, configKey] of Object.entries(envMap)) {
            if (process.env[envKey] !== undefined) {
                const val = process.env[envKey];
                this._config[configKey] = /^\d+$/.test(val) ? parseInt(val) : val;
            }
        }
    }

    _merge(obj) {
        for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                this._config[key] = {
                    ...(this._config[key] || {}),
                    ...value
                };
            } else {
                this._config[key] = value;
            }
        }
    }

    /** Get a config value */
    get(key, defaultValue) {
        const keys = key.split('.');
        let current = this._config;
        for (const k of keys) {
            if (current[k] === undefined) return defaultValue;
            current = current[k];
        }
        return current;
    }

    /** Set a config value at runtime */
    set(key, value) {
        const keys = key.split('.');
        let current = this._config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    }

    /** Get all config as plain object */
    toJSON() {
        return { ...this._config };
    }

    /** Check if running in production */
    get isProduction() {
        return this._config.env === 'production' || process.env.NODE_ENV === 'production';
    }

    /** Check if SSL is available */
    get hasSSL() {
        const sslDir = path.join(__dirname, '..', this._config.sslDir);
        return fs.existsSync(path.join(sslDir, 'server.key'))
            && fs.existsSync(path.join(sslDir, 'server.crt'));
    }
}

// Singleton instance
let _instance = null;

function getConfig(overrides) {
    if (!_instance || overrides) {
        _instance = new Config(overrides);
    }
    return _instance;
}

module.exports = { Config, getConfig, DEFAULTS };
