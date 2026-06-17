/**
 * HAZOOM OS V3 — Service Discovery Module
 * Manages service registration and discovery
 */

class ServiceDiscovery {
    constructor() {
        this.services = new Map();
        this.healthCheckInterval = 30000; // 30 seconds
    }

    registerService(name, config) {
        this.services.set(name, {
            ...config,
            registeredAt: Date.now(),
            status: 'registered'
        });
        console.log(`Service registered: ${name}`);
    }

    discoverService(name) {
        return this.services.get(name);
    }

    discoverAllServices() {
        const services = {};
        this.services.forEach((value, key) => {
            services[key] = {
                port: value.port,
                status: value.status,
                registeredAt: value.registeredAt
            };
        });
        return services;
    }

    checkHealth() {
        const results = {};
        this.services.forEach((service, name) => {
            results[name] = {
                healthy: true, // In production, would actually check
                lastCheck: Date.now()
            };
        });
        return results;
    }
}

module.exports = ServiceDiscovery;
