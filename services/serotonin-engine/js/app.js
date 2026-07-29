/**
 * HAZOOM SEROTONIN ENGINE — App Logic
 * Session management, timer, history, navigation
 */

class SerotoninApp {
    constructor() {
        this.engine = null;
        this.visualizer = null;
        this.currentModule = null;
        this.selectedDuration = 10;
        this.selectedMode = 'mandala';
        this.history = this.loadHistory();
    }

    /* ── Initialize ── */
    async init() {
        this.engine = new SerotoninEngine();
        this.visualizer = new SerotoninVisualizer('visualizer-canvas');
        await this.engine.init();
        this.engine.onFrequencyData = (data) => this.onFrequencyData(data);
        return this;
    }

    /* ── Start Session ── */
    async startSession(moduleName) {
        if (this.engine.isPlaying) this.stopSession();

        this.currentModule = moduleName;
        const preset = this.engine.loadPreset(moduleName);
        if (!preset) return;

        const colorMap = {
            restore: '#00ff88',
            abundance: '#ffd700',
            opportunity: '#aa00ff',
            peace: '#00aaff',
        };

        this.visualizer.setColor(colorMap[moduleName] || '#00ff88');
        this.visualizer.setMode(this.selectedMode);
        this.visualizer.start();

        await this.engine.play();

        this.engine.startSession(
            this.selectedDuration,
            (timeRemaining) => this.onTick(timeRemaining),
            () => this.onSessionComplete()
        );

        this.updateUI('playing');
        this.logSession(moduleName, this.selectedDuration);
    }

    /* ── Stop Session ── */
    stopSession() {
        this.engine.stopSession();
        this.visualizer.stop();
        this.updateUI('stopped');
    }

    /* ── Pause Session ── */
    pauseSession() {
        if (this.engine.ctx.state === 'running') {
            this.engine.ctx.suspend();
            this.updateUI('paused');
        } else {
            this.engine.ctx.resume();
            this.updateUI('playing');
        }
    }

    /* ── Callbacks ── */
    onTick(timeRemaining) {
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = SerotoninEngine.formatTime(timeRemaining);

        const progressEl = document.getElementById('progress');
        if (progressEl) {
            const total = this.selectedDuration * 60;
            const pct = ((total - timeRemaining) / total) * 100;
            progressEl.style.width = pct + '%';
        }
    }

    onFrequencyData(data) {
        const bands = this.engine.getBands();
        this.visualizer.setBands(bands);
        this.updateBandDisplay(bands);
    }

    onSessionComplete() {
        this.visualizer.stop();
        this.updateUI('complete');

        const completeEl = document.getElementById('session-complete');
        if (completeEl) completeEl.classList.add('active');

        setTimeout(() => {
            if (completeEl) completeEl.classList.remove('active');
        }, 5000);
    }

    /* ── UI Updates ── */
    updateUI(state) {
        const playBtn = document.getElementById('btn-play');
        const pauseBtn = document.getElementById('btn-pause');
        const stopBtn = document.getElementById('btn-stop');

        if (playBtn) playBtn.style.display = state === 'stopped' || state === 'complete' ? '' : 'none';
        if (pauseBtn) pauseBtn.style.display = state === 'playing' || state === 'paused' ? '' : 'none';
        if (stopBtn) stopBtn.style.display = state === 'playing' || state === 'paused' ? '' : 'none';

        const statusEl = document.getElementById('status');
        if (statusEl) {
            const messages = {
                ready: 'Ready to begin',
                playing: 'Session active',
                paused: 'Paused',
                stopped: 'Session ended',
                complete: 'Namaste',
            };
            statusEl.textContent = messages[state] || '';
        }
    }

    updateBandDisplay(bands) {
        const bars = ['bar-sub', 'bar-bass', 'bar-mid', 'bar-high', 'bar-presence'];
        const vals = [bands.sub, bands.bass, bands.mid, bands.high, bands.presence];
        bars.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.style.height = Math.min(100, vals[i] * 100) + '%';
        });
    }

    /* ── Duration Selection ── */
    setDuration(minutes) {
        this.selectedDuration = minutes;
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.minutes) === minutes);
        });
    }

    /* ── Mode Selection ── */
    setMode(mode) {
        this.selectedMode = mode;
        if (this.visualizer) this.visualizer.setMode(mode);
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    /* ── Session History ── */
    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem('hazoom_history') || '[]');
        } catch {
            return [];
        }
    }

    logSession(module, duration) {
        this.history.push({
            module,
            duration,
            date: new Date().toISOString(),
        });
        localStorage.setItem('hazoom_history', JSON.stringify(this.history));
    }

    getStats() {
        const total = this.history.length;
        const totalMinutes = this.history.reduce((a, s) => a + s.duration, 0);
        const byModule = {};
        this.history.forEach(s => {
            byModule[s.module] = (byModule[s.module] || 0) + 1;
        });
        return { total, totalMinutes, byModule };
    }
}

window.SerotoninApp = SerotoninApp;
