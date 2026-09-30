/* HAZOOM OS — Boot audio engine
 *
 * Synthesises the power-on, boot-tick and shutdown cues with the Web Audio API
 * instead of shipping audio files. That keeps the OS genuinely offline-first:
 * no asset downloads, no CDN, no licensing, and the whole soundscape costs
 * zero bytes on the wire.
 *
 * Browser autoplay policy is respected properly: an AudioContext may only be
 * created/resumed from a real user gesture, so the splash's "Power On" control
 * is what unlocks audio. Without that gesture we simply stay silent rather than
 * throwing or spamming console warnings.
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'hazoom_boot_sound';

    class BootAudio {
        constructor() {
            this.ctx = null;
            this.master = null;
            this.unlocked = false;
            this.supported = typeof (global.AudioContext || global.webkitAudioContext) === 'function';
            this.enabled = this._readPref();
        }

        _readPref() {
            try {
                const v = localStorage.getItem(STORAGE_KEY);
                return v === null ? true : v === 'on';
            } catch (e) { return true; }
        }

        setEnabled(on) {
            this.enabled = !!on;
            try { localStorage.setItem(STORAGE_KEY, this.enabled ? 'on' : 'off'); } catch (e) {}
            if (this.enabled) this.unlock();
            return this.enabled;
        }

        toggle() { return this.setEnabled(!this.enabled); }

        /** Must be called from a user gesture handler. Safe to call repeatedly. */
        unlock() {
            if (!this.supported || !this.enabled) return false;
            try {
                if (!this.ctx) {
                    const AC = global.AudioContext || global.webkitAudioContext;
                    this.ctx = new AC();
                    this.master = this.ctx.createGain();
                    // Restrained level: this is a system cue, not media.
                    this.master.gain.value = 0.22;
                    this.master.connect(this.ctx.destination);
                }
                if (this.ctx.state === 'suspended') this.ctx.resume();
                this.unlocked = this.ctx.state === 'running';
            } catch (e) {
                this.unlocked = false;
            }
            return this.unlocked;
        }

        get ready() { return this.enabled && this.unlocked && this.ctx && this.ctx.state === 'running'; }

        /* ── primitives ─────────────────────────────────────────────── */

        /** One shaped oscillator voice. */
        tone(opts) {
            if (!this.ready) return;
            const {
                freq = 440, dur = 0.25, type = 'sine', gain = 0.5,
                attack = 0.008, delay = 0, glideTo = null, filter = null, detune = 0
            } = opts;
            const t0 = this.ctx.currentTime + delay;
            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();

            osc.type = type;
            osc.detune.value = detune;
            osc.frequency.setValueAtTime(freq, t0);
            if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);

            // Percussive envelope; the ramp avoids the click of hard gating.
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
            env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

            let node = osc;
            if (filter) {
                const f = this.ctx.createBiquadFilter();
                f.type = filter.type || 'lowpass';
                f.frequency.setValueAtTime(filter.freq || 1200, t0);
                if (filter.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, filter.to), t0 + dur);
                f.Q.value = filter.q || 1;
                node.connect(f);
                node = f;
            }
            node.connect(env);
            env.connect(this.master);
            osc.start(t0);
            osc.stop(t0 + dur + 0.05);
        }

        /** Filtered noise burst: the breathy part of a power-on sweep. */
        noise(opts) {
            if (!this.ready) return;
            const { dur = 0.5, gain = 0.12, from = 200, to = 4000, delay = 0, q = 1 } = opts;
            const t0 = this.ctx.currentTime + delay;
            const frames = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
            const buf = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const f = this.ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.Q.value = q;
            f.frequency.setValueAtTime(from, t0);
            f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
            const env = this.ctx.createGain();
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.25);
            env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

            src.connect(f); f.connect(env); env.connect(this.master);
            src.start(t0);
        }

        /* ── cues ────────────────────────────────────────────────────── */

        /** Rising filtered swell: the machine coming alive. */
        powerOn() {
            if (!this.ready) return;
            this.noise({ dur: 0.85, gain: 0.09, from: 120, to: 5200, q: 0.7 });
            this.tone({ freq: 90, glideTo: 300, dur: 0.9, type: 'sawtooth', gain: 0.16, filter: { type: 'lowpass', freq: 300, to: 2600, q: 6 } });
            [261.63, 392.00, 523.25].forEach((f, i) => {
                this.tone({ freq: f, dur: 0.7, type: 'sine', gain: 0.10, delay: 0.16 + i * 0.07, attack: 0.05 });
            });
        }

        /** Short blip per boot step; pitch climbs with progress. */
        tick(step = 0) {
            if (!this.ready) return;
            const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
            this.tone({
                freq: scale[Math.min(step, scale.length - 1)],
                dur: 0.11, type: 'triangle', gain: 0.10
            });
        }

        /** Resolved major arpeggio when the system reports online. */
        complete() {
            if (!this.ready) return;
            const chord = [523.25, 659.25, 783.99, 1046.50];
            chord.forEach((f, i) => {
                this.tone({ freq: f, dur: 0.95, type: 'sine', gain: 0.12, delay: i * 0.085, attack: 0.02 });
                this.tone({ freq: f * 2, dur: 0.55, type: 'sine', gain: 0.035, delay: i * 0.085, attack: 0.02 });
            });
            this.tone({ freq: 130.81, dur: 1.1, type: 'sine', gain: 0.09, delay: 0.1, attack: 0.06 });
        }

        /** Descending pair used when boot cannot reach online. */
        fault() {
            if (!this.ready) return;
            this.tone({ freq: 320, dur: 0.22, type: 'square', gain: 0.07 });
            this.tone({ freq: 210, dur: 0.34, type: 'square', gain: 0.07, delay: 0.16 });
        }

        /** Soft click for UI confirmations (icon drop, window open). */
        click() {
            if (!this.ready) return;
            this.tone({ freq: 1400, dur: 0.045, type: 'sine', gain: 0.05 });
        }
    }

    global.HAZOOM_BOOT_AUDIO = new BootAudio();
})(window);
