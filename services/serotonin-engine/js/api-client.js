/**
 * NANO Protocol — API Client
 * Connects frontend to Doctoral Guide API
 */

class NanoAPI {
    constructor(baseURL = 'http://localhost:8098') {
        this.baseURL = baseURL;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetch(endpoint, useCache = true) {
        const cacheKey = endpoint;
        
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.time < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (useCache) {
                this.cache.set(cacheKey, { data, time: Date.now() });
            }
            
            return data;
        } catch (error) {
            console.warn(`API fetch failed for ${endpoint}:`, error);
            return null;
        }
    }

    // Frequency endpoints
    async getAllFrequencies() {
        return this.fetch('/api/frequencies');
    }

    async getFrequency(hz) {
        return this.fetch(`/api/frequency/${hz}`);
    }

    // Binaural beats
    async getBinauralBeats() {
        return this.fetch('/api/binaural');
    }

    async getBinauralBand(band) {
        return this.fetch(`/api/binaural/${band}`);
    }

    // Modules
    async getAllModules() {
        return this.fetch('/api/modules');
    }

    async getModule(name) {
        return this.fetch(`/api/modules/${name}`);
    }

    // References
    async getReferences() {
        return this.fetch('/api/references');
    }

    // Search
    async search(query) {
        return this.fetch(`/api/search?q=${encodeURIComponent(query)}`);
    }

    // Healing map
    async getHealingMap() {
        return this.fetch('/api/healing-map');
    }

    // Session builder
    async buildSession(intention, duration = 20, experience = 'beginner') {
        return this.fetch(`/api/session-builder?intention=${intention}&duration=${duration}&experience=${experience}`);
    }

    // About
    async getAbout() {
        return this.fetch('/api/about');
    }

    // Check API status
    async isOnline() {
        try {
            const response = await fetch(this.baseURL);
            return response.ok;
        } catch {
            return false;
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create global instance
window.nanoAPI = new NanoAPI();

// Integration helper for SerotoninApp
class SerotoninAppAPI {
    constructor(app) {
        this.app = app;
        this.api = window.nanoAPI;
    }

    async loadModuleData(moduleName) {
        const data = await this.api.getModule(moduleName);
        if (data && data.data) {
            return {
                name: data.data.name,
                frequencies: data.data.frequencies,
                binaural: data.data.binaural,
                binauralHz: data.data.binaural_hz,
                duration: data.data.duration_minutes,
                color: data.data.color,
                structure: data.data.session_structure,
                frequencyDetails: data.frequency_details
            };
        }
        return null;
    }

    async loadAllModules() {
        const data = await this.api.getAllModules();
        if (data && data.modules) {
            return Object.entries(data.modules).map(([key, mod]) => ({
                id: key,
                name: mod.name,
                intention: mod.intention,
                frequencies: mod.frequencies,
                color: mod.color
            }));
        }
        return [];
    }

    async getFrequencyInfo(hz) {
        const data = await this.api.getFrequency(hz);
        if (data) {
            return {
                hz: data.frequency,
                name: data.data.name,
                effects: data.data.claimed_effects,
                scientific: data.data.scientific_effects,
                integrations: data.integrations
            };
        }
        return null;
    }

    async getSessionRecommendation(intention, duration, experience) {
        const data = await this.api.buildSession(intention, duration, experience);
        if (data && data.session) {
            return data.session;
        }
        return null;
    }

    async getHealingRecommendation(condition) {
        const data = await this.api.getHealingMap();
        if (data && data.healing_map) {
            return data.healing_map[condition] || null;
        }
        return null;
    }

    async searchFrequencies(query) {
        const data = await this.api.search(query);
        return data ? data.results : null;
    }

    enrichModuleWithAPI(moduleName) {
        return this.loadModuleData(moduleName).then(apiData => {
            if (!apiData) return;
            
            // Update module info in UI if needed
            const infoEl = document.getElementById('module-info');
            if (infoEl) {
                const freqList = apiData.frequencyDetails.map(f => 
                    `<span class="freq-tag">${f Hz} — ${f.name}</span>`
                ).join('');
                
                infoEl.innerHTML = `
                    <div class="api-enriched">
                        <h4>${apiData.name}</h4>
                        <div class="freq-tags">${freqList}</div>
                        <p class="structure">${apiData.structure.opening} → ${apiData.structure.core} → ${apiData.structure.closing}</p>
                    </div>
                `;
            }
        });
    }
}

window.SerotoninAppAPI = SerotoninAppAPI;
