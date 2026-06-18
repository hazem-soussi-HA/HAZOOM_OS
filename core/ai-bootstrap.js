// ============================================
// HAZOOM OS v4.0 — AI Kernel Bootstrap
// Standalone entry point for AI-native kernel
// Author: Hazem Soussi (HA) — Shadow Builder
// ============================================

/**
 * Boot the AI-Native HAZOOM OS Kernel
 * This initializes all AI capabilities on top of the base kernel
 */

import { HazoomKernel } from './kernel.js';
import { AIKernelExtension } from './ai-kernel.js';

class HazoomOSAINative {
  constructor() {
    this.kernel = null;
    this.ai = null;
    this.booted = false;
  }

  async boot() {
    console.log('\n' + '═'.repeat(60));
    console.log('  HAZOOM OS v4.0 — AI-NATIVE KERNEL');
    console.log('  Superintelligence Integration Architecture');
    console.log('═'.repeat(60) + '\n');

    const startTime = performance.now();

    // 1. Boot base kernel
    this.kernel = new HazoomKernel();
    await this.kernel.boot();

    // 2. Initialize AI extension
    this.ai = new AIKernelExtension(this.kernel);
    await this.ai.boot();

    const bootTime = performance.now() - startTime;
    this.booted = true;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  AI KERNEL BOOT COMPLETE — ${bootTime.toFixed(0)}ms`);
    console.log(`${'═'.repeat(60)}\n`);

    return { success: true, bootTime };
  }

  getStatus() {
    if (!this.booted) return { booted: false };
    return {
      booted: true,
      kernel: this.kernel?.getStatus(),
      ai: this.ai?.getStatus(),
    };
  }

  // Quick access to AI modules
  get npu() { return this.ai?.npu; }
  get runtime() { return this.ai?.runtime; }
  get fabric() { return this.ai?.fabric; }
  get crypto() { return this.ai?.pqc; }
  get optimizer() { return this.ai?.optimizer; }
}

// Auto-boot when loaded
let hazoomOS = null;

export async function bootHAZOOM() {
  if (!hazoomOS) {
    hazoomOS = new HazoomOSAINative();
    await hazoomOS.boot();
  }
  return hazoomOS;
}

export { HazoomOSAINative, HazoomKernel, AIKernelExtension };
