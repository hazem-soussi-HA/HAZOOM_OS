/**
 * HAZOOM OS v5.0 — Boot Sequence Orchestrator
 * 
 * POST → Bootloader → Kernel Init → Memory → FS → Devices → Security →
 * Q-Learning → Services → Scheduler → ONLINE
 * 
 * Copyright © 2024-2026 Hazem Soussi — All Rights Reserved
 */

'use strict';

const { Logger } = require('./logger');

const BOOT_STAGES = Object.freeze([
    'OFF',
    'POST',           // Power-On Self-Test
    'BOOTLOADER',      // GRUB simulation
    'KERNEL_INIT',     // Kernel load
    'MEMORY_INIT',     // Memory manager
    'FS_INIT',         // File system
    'DEVICE_INIT',     // Device manager
    'SECURITY_INIT',   // Security manager
    'QLEARNING_INIT',  // Q-Learning system
    'SERVICES',        // Service layer
    'ONLINE'           // System ready
]);

class BootSequence {
    constructor(kernel, config = {}) {
        this.kernel = kernel;
        this.logger = new Logger({ source: 'BOOT', level: config.logLevel });
        this.stages = [...BOOT_STAGES];
        this.currentStage = 0;
        this.errors = [];
        this.startTime = null;
        this.stageTimes = {};
    }

    /** Run the full boot sequence */
    boot() {
        this.startTime = Date.now();
        this.logger.info('Power-On Self-Test starting...');

        const results = [];
        for (let i = 1; i < this.stages.length; i++) {
            const stage = this.stages[i];
            const stageStart = Date.now();

            try {
                this.currentStage = i;
                const result = this._executeStage(stage);
                const duration = Date.now() - stageStart;
                this.stageTimes[stage] = duration;
                this.logger.info(`[OK] ${stage} (${duration}ms)`);
                results.push({ stage, status: 'ok', duration, result });
            } catch (e) {
                const duration = Date.now() - stageStart;
                this.stageTimes[stage] = duration;
                this.logger.error(`[FAIL] ${stage}: ${e.message}`);
                this.errors.push({ stage, error: e.message });
                results.push({ stage, status: 'error', duration, error: e.message });
                // Non-fatal stages continue; fatal stages halt
                if (this._isFatal(stage)) {
                    this.logger.error(`Fatal stage ${stage} failed. Boot halted.`);
                    break;
                }
            }
        }

        const totalDuration = Date.now() - this.startTime;
        const success = this.errors.length === 0;

        this.logger.info(
            success
                ? `Boot complete in ${totalDuration}ms — ${this.stages[this.currentStage]}`
                : `Boot failed after ${totalDuration}ms — ${this.errors.length} errors`
        );

        return {
            success,
            stages: results,
            totalDuration,
            errors: this.errors,
            finalStage: this.stages[this.currentStage]
        };
    }

    _executeStage(stage) {
        switch (stage) {
            case 'POST':
                return this._post();
            case 'BOOTLOADER':
                return this._bootloader();
            case 'KERNEL_INIT':
                return this._kernelInit();
            case 'MEMORY_INIT':
                return this._memoryInit();
            case 'FS_INIT':
                return this._fsInit();
            case 'DEVICE_INIT':
                return this._deviceInit();
            case 'SECURITY_INIT':
                return this._securityInit();
            case 'QLEARNING_INIT':
                return this._qlearningInit();
            case 'SERVICES':
                return this._servicesInit();
            case 'ONLINE':
                return this._goOnline();
            default:
                this.logger.warn(`Unknown boot stage: ${stage}`);
                return null;
        }
    }

    _isFatal(stage) {
        // KERNEL_INIT, MEMORY_INIT, FS_INIT are fatal
        return ['KERNEL_INIT', 'MEMORY_INIT', 'FS_INIT'].includes(stage);
    }

    _post() {
        // Power-On Self-Test: verify hardware (simulated)
        const checks = {
            cpu: true,
            memory: this.kernel.memoryManager !== null,
            disk: true,
            network: true
        };
        const allPassed = Object.values(checks).every(v => v);
        if (!allPassed) throw new Error('POST failed: hardware check error');
        return checks;
    }

    _bootloader() {
        // Simulated GRUB: load kernel image
        return { bootloader: 'HAZOOM-GRUB', kernelImage: 'hazoom-kernel-v5' };
    }

    _kernelInit() {
        // Initialize the kernel core
        if (!this.kernel.boot) throw new Error('Kernel has no boot method');
        return this.kernel.boot();
    }

    _memoryInit() {
        return this.kernel.memoryManager?.getStats() ?? { error: 'no memory manager' };
    }

    _fsInit() {
        return this.kernel.fileSystem?.getStats() ?? { error: 'no file system' };
    }

    _deviceInit() {
        return this.kernel.deviceManager?.getStats() ?? { error: 'no device manager' };
    }

    _securityInit() {
        return this.kernel.security?.getStats() ?? { error: 'no security manager' };
    }

    _qlearningInit() {
        // Q-Learning: load persisted state or initialize fresh
        if (this.kernel.qLearner) {
            this.logger.info('Q-Learning system loaded');
            return this.kernel.qLearner.getStatus();
        }
        this.logger.warn('Q-Learning not available, skipping');
        return { status: 'not_loaded' };
    }

    _servicesInit() {
        // Service layer initialization
        return { services: 'initialized' };
    }

    _goOnline() {
        this.kernel.running = true;
        return { status: 'online', uptime: 0 };
    }

    /** Get boot status */
    getStatus() {
        return {
            currentStage: this.stages[this.currentStage],
            stageIndex: this.currentStage,
            totalStages: this.stages.length,
            stageTimes: this.stageTimes,
            errors: this.errors,
            bootTime: this.startTime ? Date.now() - this.startTime : null
        };
    }
}

module.exports = { BootSequence, BOOT_STAGES };
