/**
 * @ SPDX-License-Identifier: MIT
 * @ Copyright (c) 2026 Hazem Soussi (HA)
 * Super Mario GTA6 — Web AI Inference
 *
 * Runs trained Mario agent in browser via ONNX Runtime Web.
 */

export class WebAIAgent {
    /**
     * @param {string} modelPath - Path to ONNX model (e.g., 'models/mario_ppo.onnx')
     */
    constructor(modelPath) {
        this.modelPath = modelPath;
        this.session = null;
        this.frameStack = [];
        this.stackSize = 4;
        this.frameSize = 84;
        this.hidden = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        try {
            // Dynamically import ONNX Runtime Web
            const ort = await import('onnxruntime-web');
            this.session = await ort.InferenceSession.create(this.modelPath, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all',
            });
            this.ort = ort;
            this.initialized = true;
            console.log('[WebAI] Model loaded:', this.modelPath);
        } catch (e) {
            console.error('[WebAI] Failed to load model:', e);
        }
    }

    /**
     * Preprocess a canvas frame for the neural network.
     * @param {ImageData|HTMLCanvasElement} source
     * @returns {Float32Array} Grayscale 84×84 normalized to [0,1]
     */
    preprocessFrame(source) {
        let imageData;
        if (source instanceof HTMLCanvasElement) {
            const ctx = source.getContext('2d', { willReadFrequently: true });
            imageData = ctx.getImageData(0, 0, source.width, source.height);
        } else {
            imageData = source;
        }

        const { width, height, data } = imageData;
        const targetSize = this.frameSize;
        const output = new Float32Array(targetSize * targetSize);

        // Bilinear resize + grayscale
        for (let y = 0; y < targetSize; y++) {
            for (let x = 0; x < targetSize; x++) {
                const srcX = (x / targetSize) * width;
                const srcY = (y / targetSize) * height;
                const x0 = Math.floor(srcX);
                const y0 = Math.floor(srcY);
                const x1 = Math.min(x0 + 1, width - 1);
                const y1 = Math.min(y0 + 1, height - 1);
                const fx = srcX - x0;
                const fy = srcY - y0;

                const i00 = (y0 * width + x0) * 4;
                const i10 = (y0 * width + x1) * 4;
                const i01 = (y1 * width + x0) * 4;
                const i11 = (y1 * width + x1) * 4;

                const r = data[i00] * (1-fx) * (1-fy) + data[i10] * fx * (1-fy)
                        + data[i01] * (1-fx) * fy + data[i11] * fx * fy;
                const g = data[i00+1] * (1-fx) * (1-fy) + data[i10+1] * fx * (1-fy)
                        + data[i01+1] * (1-fx) * fy + data[i11+1] * fx * fy;
                const b = data[i00+2] * (1-fx) * (1-fy) + data[i10+2] * fx * (1-fy)
                        + data[i01+2] * (1-fx) * fy + data[i11+2] * fx * fy;

                // Grayscale
                output[y * targetSize + x] = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
            }
        }
        return output;
    }

    /**
     * Push frame to stack and return stacked tensor.
     * @returns {Float32Array} (4, 84, 84) flattened
     */
    pushFrame(processed) {
        this.frameStack.push(processed);
        while (this.frameStack.length > this.stackSize) {
            this.frameStack.shift();
        }
        while (this.frameStack.length < this.stackSize) {
            this.frameStack.unshift(new Float32Array(this.frameSize * this.frameSize));
        }

        const stacked = new Float32Array(this.stackSize * this.frameSize * this.frameSize);
        for (let i = 0; i < this.stackSize; i++) {
            stacked.set(this.frameStack[i], i * this.frameSize * this.frameSize);
        }
        return stacked;
    }

    /**
     * Build game state vector.
     * @param {Object} gameState
     * @returns {Float32Array} 16-dim state vector
     */
    buildStateVector(gameState) {
        const vec = new Float32Array(16);
        vec[0] = (gameState.px || 0) / 96000;
        vec[1] = (gameState.py || 0) / 720;
        vec[2] = (gameState.pvx || 0) / 400;
        vec[3] = (gameState.pvy || 0) / 2000;
        vec[4] = (gameState.pMode || 0) / 2;
        vec[5] = Math.min((gameState.pInv || 0) / 2, 1);
        vec[6] = Math.min((gameState.pStar || 0) / 10, 1);
        vec[7] = Math.min((gameState.coins || 0) / 100, 1);
        vec[8] = Math.min((gameState.score || 0) / 10000, 1);
        vec[9] = Math.min((gameState.time || 400) / 400, 1);
        vec[10] = (gameState.lives || 3) / 3;
        vec[11] = gameState.onCar ? 1 : 0;
        vec[12] = gameState.inAir ? 1 : 0;
        vec[13] = gameState.facing || 1;
        vec[14] = (gameState.camX || 0) / 96000;
        vec[15] = gameState.progress || 0;
        return vec;
    }

    /**
     * Select action given game frame and state.
     * @param {HTMLCanvasElement|ImageData} source
     * @param {Object} gameState
     * @returns {number} Action index [0-7]
     */
    async act(source, gameState) {
        if (!this.session) {
            await this.init();
        }
        if (!this.session) return 0; // fallback to noop

        const processed = this.preprocessFrame(source);
        const stacked = this.pushFrame(processed);
        const state = this.buildStateVector(gameState);

        // Create tensors
        const framesTensor = new this.ort.Tensor(
            'float32', stacked, [1, this.stackSize, this.frameSize, this.frameSize]
        );
        const stateTensor = new this.ort.Tensor(
            'float32', state, [1, 16]
        );

        const feeds = {
            frames: framesTensor,
            state: stateTensor,
        };

        try {
            const results = await this.session.run(feeds);
            const logits = results.logits.data;
            // Greedy action selection
            let bestAction = 0;
            let bestLogit = logits[0];
            for (let i = 1; i < logits.length; i++) {
                if (logits[i] > bestLogit) {
                    bestLogit = logits[i];
                    bestAction = i;
                }
            }
            return bestAction;
        } catch (e) {
            console.error('[WebAI] Inference error:', e);
            return 0;
        }
    }

    reset() {
        this.frameStack = [];
        this.hidden = null;
    }
}

export const ACTION_NAMES = [
    'noop', 'left', 'right', 'jump', 'run', 'jump+run', 'car', 'left+jump'
];
