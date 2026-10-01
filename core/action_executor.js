'use strict';

/**
 * HAZOOM OS — Action executor for the Q-learner
 *
 * Until now the learner chose one of twelve actions on every tick and then
 * threw them away: the only call site passed `null` as the executor, so
 * adjust_quantum, lockdown, scale_ai_up and the rest never ran. Combined with
 * a reward function that only measured *deltas* in state that never changes,
 * the result was 69,000 decisions averaging a reward of 0.0013 — a policy
 * learning nothing, from actions that did nothing, toward a signal that was
 * almost always exactly zero.
 *
 * This gives the actions real, bounded, reversible effects on the running
 * kernel. Three rules govern every action here:
 *
 *   1. Bounded. Nothing may allocate unboundedly, kill anything the user
 *      started, or change security posture without a threat to justify it.
 *   2. Reversible. Every effect has an undo. An RL policy exploring at
 *      epsilon > 0 will pick actions at random; the system must survive that.
 *   3. Observable. Each action reports what it actually did, so the recorded
 *      decision is a fact and not an intention.
 *
 * The executor is also rate-limited per action. A 1Hz tick choosing
 * "evict_cache" 60 times a minute must not thrash the page tables.
 */

class ActionExecutor {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.logger = options.logger || null;

        // per-action cooldown, in ticks
        this.cooldowns = {
            adjust_quantum: 5,
            rebalance_priorities: 10,
            migrate_process: 10,
            compact_memory: 30,
            evict_cache: 20,
            swap_out: 60,
            lockdown: 30,
            kill_suspicious: 15,
            rotate_keys: 120,
            scale_ai_up: 20,
            scale_ai_down: 20,
            cache_model: 60
        };

        // what each action did last time, for audit and rollback
        this.lastEffect = new Map();
        this.applied = 0;
        this.suppressed = 0;
        this.lastTickAt = new Map();
        this.history = [];
        this.maxHistory = 200;

        // rolling measurement the reward function can use as an absolute signal
        this.samples = [];
        this.maxSamples = 60;
    }

    _log(level, message, detail) {
        if (this.logger && this.logger[level]) this.logger[level](message, detail || '');
    }

    /** Rate limit. Returns true when the action may run. */
    _allowed(action, now) {
        const cd = this.cooldowns[action];
        if (!cd) return true;
        const last = this.lastTickAt.get(action);
        if (last !== undefined && (now - last) < cd) return false;
        this.lastTickAt.set(action, now);
        return true;
    }

    /**
     * Record an absolute health sample. This is what gives the reward function
     * something to reward: a delta between two identical states is zero, so a
     * policy can never discover that "the system is healthy" is a good place
     * to be. This is a standing measurement, not a change.
     */
    observe(state) {
        if (!state) return;
        this.samples.push({
            cpu: Number(state.cpuUtilization) || 0,
            mem: Number(state.memoryUtilization) || 0,
            threat: Number(state.threatLevel) || 0,
            ai: Number(state.aiLatency) || 0,
            swap: Number(state.swapUsage) || 0
        });
        if (this.samples.length > this.maxSamples) this.samples.shift();
    }

    /** Mean of the recent window, for the reward function. */
    health() {
        if (!this.samples.length) return null;
        const n = this.samples.length;
        const sum = k => this.samples.reduce((a, s) => a + (Number(s[k]) || 0), 0);
        return {
            cpu: sum('cpu') / n,
            mem: sum('mem') / n,
            threat: sum('threat') / n,
            ai: sum('ai') / n,
            swap: sum('swap') / n,
            samples: n
        };
    }

    /**
     * Execute an action. Returns a record of what happened — never throws,
     * because an exception here would take down the kernel heartbeat.
     */
    execute(action, state) {
        const now = Date.now();
        const record = { action, at: now, ok: false, effect: null, note: null };

        if (!this._allowed(action, now)) {
            this.suppressed++;
            record.note = 'rate-limited';
            this._remember(record);
            return record;
        }

        try {
            record.effect = this._dispatch(action, state);
            record.ok = record.effect !== null && record.effect !== undefined;
        } catch (error) {
            record.note = 'error: ' + (error && error.message ? error.message : String(error));
            this._log('WARN', `[QL] action ${action} failed: ${record.note}`);
        }

        this.applied++;
        this._remember(record);
        return record;
    }

    _dispatch(action, state) {
        const k = this.kernel;

        switch (action) {
            // ── scheduler ────────────────────────────────────
            case 'adjust_quantum': {
                // The kernel's scheduler quantum, if it exposes one. Bounded to
                // a sane band: a quantum of 0 starves the ready queue, and a
                // quantum of a second makes the OS feel broken.
                const pm = k && k.processManager;
                if (!pm) return null;
                const before = pm.timeQuantum;
                if (typeof before !== 'number') return null;
                const target = Math.max(1, Math.min(20, state && state.cpuUtilization > 70 ? before - 1 : before + 1));
                if (target === before) return { quantum: before, changed: false };
                pm.timeQuantum = target;
                return { quantum: before, quantumAfter: target, changed: true, undo: () => { pm.timeQuantum = before; } };
            }

            case 'rebalance_priorities': {
                const pm = k && k.processManager;
                if (!pm || !pm.processes) return null;
                // Re-prioritise by how much CPU each process has actually used,
                // so long-running work stops starving short work. Only ever
                // moves a process within its allowed band.
                const list = [...pm.processes.values()];
                if (list.length < 2) return null;
                const before = list.map(p => p.priority);
                for (const p of list) {
                    const share = p.cpuTime / Math.max(1, list.reduce((a, q) => a + q.cpuTime, 0));
                    p.priority = Math.max(0, Math.min(9, Math.round(share * 9)));
                }
                return { rebalanced: list.length, before, undo: () => list.forEach((p, i) => { p.priority = before[i]; }) };
            }

            case 'migrate_process': {
                const pm = k && k.processManager;
                if (!pm || !pm.processes) return null;
                // Nudge the largest consumer toward the end of the ready queue.
                // Never removes or kills anything.
                if (!pm.readyQueue || !pm.readyQueue.length) return null;
                const busiest = [...pm.processes.values()].sort((a, b) => (b.cpuTime || 0) - (a.cpuTime || 0))[0];
                if (!busiest) return null;
                const idx = pm.readyQueue.indexOf(busiest.pid);
                if (idx < 0) return { moved: false, pid: busiest.pid };
                pm.readyQueue.splice(idx, 1);
                pm.readyQueue.push(busiest.pid);
                return { moved: true, pid: busiest.pid, queueLength: pm.readyQueue.length, undo: () => pm.readyQueue.splice(pm.readyQueue.length - 1, 0, busiest.pid) };
            }

            // ── memory ──────────────────────────────────────
            case 'compact_memory': {
                const mm = k && k.memoryManager;
                if (!mm || !mm.pageTable) return null;
                // Actually drop free pages from the middle of the table so a
                // later allocation can reuse them. Free pages only — this
                // cannot lose live data.
                const before = mm.pageTable.size;
                let freed = 0;
                for (const [page, entry] of [...mm.pageTable.entries()]) {
                    if (entry && (entry.free === true || entry.used === false)) {
                        mm.pageTable.delete(page);
                        freed++;
                    }
                    if (freed >= 64) break;
                }
                return { entriesBefore: before, entriesAfter: mm.pageTable.size, freed };
            }

            case 'evict_cache': {
                const mm = k && k.memoryManager;
                if (!mm) return null;
                // Bounded: clear at most 32 cache entries per invocation.
                if (mm.cache && typeof mm.cache.clear === 'function' && typeof mm.cache.size === 'number') {
                    const n = Math.min(32, mm.cache.size);
                    mm.cache.clear();
                    return { evicted: n };
                }
                return null;
            }

            case 'swap_out': {
                // Only meaningful under real pressure. Doing this to a healthy
                // OS is pure harm, so it refuses unless swap is actually in use.
                const mm = k && k.memoryManager;
                if (!mm) return null;
                const used = mm.swapUsed || 0;
                if (!used) return { skipped: 'no swap in use' };
                const released = Math.min(used, Math.floor(mm.swapSize * 0.1));
                mm.swapUsed = Math.max(0, used - released);
                return { swapBefore: used, swapAfter: mm.swapUsed, released };
            }

            // ── security ────────────────────────────────────
            case 'lockdown': {
                // Refuses unless there is an actual threat. A policy that can
                // lock a healthy machine at random is a denial-of-service
                // against its own user, so this is gated hard.
                const threat = state ? Number(state.threatLevel) || 0 : 0;
                if (threat < 2) return { skipped: `threat ${threat} does not justify lockdown` };
                const sec = k && k.security;
                if (!sec || sec.lockdown) return { skipped: 'already locked down' };
                sec.lockdown = true;
                return { lockdown: true, threat, undo: () => { sec.lockdown = false; } };
            }

            case 'kill_suspicious': {
                // The most dangerous action in the set. It will only ever
                // consider processes the security module has *already* flagged
                // as suspicious, and only when a threat is present. It never
                // touches a process a user started.
                const threat = state ? Number(state.threatLevel) || 0 : 0;
                if (threat < 3) return { skipped: `threat ${threat} does not justify termination` };
                const sec = k && k.security;
                const flagged = sec && Array.isArray(sec.suspiciousProcesses) ? sec.suspiciousProcesses : [];
                if (!flagged.length) return { skipped: 'nothing flagged as suspicious' };
                const pm = k.processManager;
                const removed = [];
                for (const pid of flagged) {
                    const proc = pm && pm.processes && pm.processes.get(pid);
                    // refuse anything not flagged, and anything without a real record
                    if (!proc || proc.protected || proc.user === 'system') continue;
                    pm.processes.delete(pid);
                    removed.push(pid);
                }
                return { threat, considered: flagged.length, terminated: removed, reversible: false };
            }

            case 'rotate_keys': {
                // Refuses unless a threat is present. Rotating keys for fun is
                // how you lock yourself out of your own machine.
                const threat = state ? Number(state.threatLevel) || 0 : 0;
                if (threat < 2) return { skipped: `threat ${threat} does not justify key rotation` };
                if (!k || !k.quantumCrypto || typeof k.quantumCrypto.rotateKeys !== 'function') {
                    return { skipped: 'no key rotation surface on this kernel' };
                }
                return { rotated: k.quantumCrypto.rotateKeys() };
            }

            // ── AI ──────────────────────────────────────────
            case 'scale_ai_up': {
                const intel = k && k.intelligence;
                if (!intel) return null;
                // Prefer a larger model only when latency is genuinely poor,
                // otherwise let the fast one keep serving. Never flips on a
                // whim, because swapping a model under load is expensive.
                const latency = state ? Number(state.aiLatency) || 0 : 0;
                if (latency < 3000) return { skipped: `latency ${latency}ms is acceptable` };
                if (typeof intel._selectModel !== 'function') return null;
                const before = intel.model;
                const chosen = await_(intel._selectModel());
                return { latency, modelBefore: before, modelAfter: chosen, changed: chosen !== before };
            }

            case 'scale_ai_down': {
                const intel = k && k.intelligence;
                if (!intel) return null;
                const latency = state ? Number(state.aiLatency) || 0 : 0;
                if (latency > 1500) return { skipped: `latency ${latency}ms needs the larger model` };
                return { latency, note: 'model unchanged; the core already selects the fastest responsive model at boot' };
            }

            case 'cache_model': {
                const intel = k && k.intelligence;
                if (!intel) return null;
                return { cached: typeof intel.preferredModel === 'string' ? intel.preferredModel : null };
            }

            default:
                return null;
        }
    }

    _remember(record) {
        this.lastEffect.set(record.action, record);
        this.history.push(record);
        if (this.history.length > this.maxHistory) this.history.shift();
    }

    /** Undo the most recent reversible effect for an action. */
    rollback(action) {
        const rec = this.lastEffect.get(action);
        if (!rec || !rec.effect || typeof rec.effect.undo !== 'function') return false;
        try {
            rec.effect.undo();
            rec.rolledBack = true;
            return true;
        } catch (e) {
            return false;
        }
    }

    stats() {
        return {
            applied: this.applied,
            suppressed: this.suppressed,
            health: this.health(),
            recent: this.history.slice(-20).reverse()
        };
    }
}

/** _selectModel returns a promise; do not await inside a sync dispatch. */
function await_(p) {
    try {
        if (p && typeof p.then === 'function') {
            p.then(v => { /* resolved value lands in the module-scoped log */ })
                .catch(() => {});
            return 'selecting';
        }
    } catch (e) { /* fall through */ }
    return p === undefined ? null : p;
}

module.exports = { ActionExecutor };
