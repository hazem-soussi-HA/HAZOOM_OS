/**
 * HAZOOM OS V3 — Version Negotiation Module
 * Handles API version negotiation between services
 */

class VersionNegotiator {
    constructor() {
        this.supportedVersions = {
            'v1': true,
            'v2': true,
            'v3': true
        };
        this.defaultVersion = 'v3';
    }

    negotiate(versionHeader) {
        if (!versionHeader) {
            return this.defaultVersion;
        }

        // Check if requested version is supported
        if (this.supportedVersions[versionHeader]) {
            return versionHeader;
        }

        // Fallback to highest supported version
        return this.defaultVersion;
    }

    getSupportedVersions() {
        return Object.keys(this.supportedVersions).filter(v => this.supportedVersions[v]);
    }
}

module.exports = VersionNegotiator;
