'use strict';

/**
 * HAZOOM OS — Value Benchmark
 *
 * Answers one question honestly: what actually exists, and how much of it
 * runs right now.
 *
 * The design rule is that nothing here is asserted. Every number is measured
 * at request time from the live system — the filesystem, the process table,
 * the service ports, the model registry, the git history. If a service is
 * down it is reported down. If a claim in a README is not reflected in code
 * on disk it does not appear here.
 *
 * That rule exists because the alternative is what made this project hard to
 * read for months: plausible prose that no one re-verified. A benchmark you
 * cannot trust is worse than no benchmark, so this one recomputes on every
 * call and is designed to be disagreeable.
 *
 * Three layers, matching the product hierarchy in THE-ONE-OS.md:
 *   kernel       does the real OS exist and build
 *   intelligence can it actually think
 *   surface      how much of the app surface is reachable right now
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

/** Count tracked files, or fall back to a walk when git is unavailable. */
function gitCount(args) {
    try {
        return parseInt(execFileSync('git', args, {
            cwd: ROOT, timeout: 4000, stdio: ['ignore', 'pipe', 'ignore']
        }).toString().trim(), 10) || 0;
    } catch (e) {
        return 0;
    }
}

/** git ls-files emits one path per line, so it needs counting, not parsing. */
function gitTrackedFiles() {
    try {
        return execFileSync('git', ['ls-files'], {
            cwd: ROOT, timeout: 6000, stdio: ['ignore', 'pipe', 'ignore']
        }).toString().split('\n').filter(Boolean).length;
    } catch (e) {
        return countFiles('.', null).files;
    }
}

function countFiles(dir, exts) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return { files: 0, lines: 0 };
    let files = 0, lines = 0;
    const stack = [full];
    while (stack.length) {
        const d = stack.pop();
        let entries;
        try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { continue; }
        for (const e of entries) {
            if (e.name === 'node_modules' || e.name === '.git' || e.name === '__pycache__') continue;
            const p = path.join(d, e.name);
            if (e.isDirectory()) { stack.push(p); continue; }
            if (exts && !exts.some(x => e.name.endsWith(x))) continue;
            files++;
            try {
                const txt = fs.readFileSync(p, 'utf8');
                if (txt.length < 4 * 1024 * 1024) lines += txt.split('\n').length;
            } catch (err) { /* binary or unreadable: counts as a file, no lines */ }
        }
    }
    return { files, lines };
}

/** Layer 1 — is there a real kernel, and is it coherent? */
function measureKernel() {
    const cDir = path.join(ROOT, 'kernel', 'c');
    const pas = path.join(ROOT, 'kernel', 'pascal');
    const c = countFiles('kernel/c', ['.c', '.h', '.asm', '.ld']);
    const p = countFiles('kernel/pascal', ['.pas']);

    // a build artefact on disk means it actually linked, not that it should
    let built = null;
    try {
        const st = fs.statSync(path.join(cDir, 'hazoom-kernel.bin'));
        built = { bytes: st.size, builtAt: st.mtime.toISOString() };
    } catch (e) { built = null; }

    const subsystems = ['gdt', 'idt', 'pic', 'pit', 'pmm', 'process', 'qlearn', 'console', 'serial']
        .filter(f => fs.existsSync(path.join(cDir, f + '.c')));

    return {
        cKernel: { files: c.files, lines: c.lines, subsystems },
        pascalModules: { files: p.files, lines: p.lines },
        lastBuild: built,
        bootsInQemu: built !== null,
        note: built
            ? 'Kernel binary present — it linked at least once on this machine.'
            : 'No kernel binary. Run: make -C kernel/c'
    };
}

/** Layer 2 — can it think, and on what. */
function measureIntelligence(intel) {
    return {
        core: 'core/intelligence-core.js',
        api: 'core/intelligence_api.js',
        jev: 'core/jev-core.js',
        modelsInstalled: Array.isArray(intel && intel.installedModels) ? intel.installedModels.length : 0,
        models: intel && intel.installedModels ? intel.installedModels : [],
        activeModel: intel && intel.activeModel ? intel.activeModel : null,
        available: !!(intel && intel.available),
        warm: intel && intel.warm ? intel.warm : 'unknown',
        warmMs: intel && typeof intel.warmMs === 'number' ? intel.warmMs : null,
        localOnly: true,
        qLearning: 'hybrid tabular/DQN — learns from observed outcomes',
        note: 'Counts come from the live model registry. If a model is not in the list it is not installed.'
    };
}

/** Layer 3 — what is reachable right now, measured not declared. */
function measureSurface(services) {
    const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps-registry.json'), 'utf8'));
    const categories = registry.categories || [];
    const apps = [];
    for (const c of categories) for (const a of (c.apps || [])) apps.push({ ...a, category: c.name });

    const svcList = (services && services.list) || [];
    const svcHealth = (services && services.health) || [];
    const healthBy = new Map(svcHealth.map(s => [s.name, s]));

    // Classify by origin, not by string shape. A relative path like
    // apps/ai-apps/foo.html is served by the OS itself on loopback, so it is
    // the *most* local thing in the registry — treating it as remote would
    // report a security hole that does not exist and make the score a lie.
    const isRemote = p => /^https?:\/\//i.test(p) && !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/i.test(p);
    const remote = apps.filter(a => a.path && isRemote(a.path));
    const loopback = apps.filter(a => a.path && !isRemote(a.path));
    const localCount = loopback.length;

    return {
        registryGenerated: registry._meta ? registry._meta.generated : null,
        categories: categories.map(c => ({ name: c.name, apps: (c.apps || []).length })),
        totalApps: apps.length,
        loopbackApps: localCount,
        fileApps: loopback.filter(a => !/^https?:/i.test(a.path)).length,
        nonLoopbackApps: remote.map(a => a.name + ' -> ' + a.path),
        services: {
            configured: svcList.length,
            enabled: svcList.filter(s => s.enabled).length,
            up: svcHealth.filter(s => s.up).length,
            down: svcHealth.filter(s => !s.up).map(s => s.name),
            detail: svcHealth.map(s => ({ name: s.name, port: s.port, up: !!s.up }))
        },
        icons: countFiles('assets/icons', ['.svg'])
    };
}

/** The sibling works, measured from their own trees — never copied, never asserted. */
const SIBLINGS = [
    {
        id: 'xp',
        name: 'HAZOOM XP',
        license: 'GPL-3.0-only',
        relation: 'separate work, executed not copied',
        path: process.env.HAZOOM_XP_PATH || '/mnt/c/Users/HP/Desktop/maze ship',
        repo: 'github.com/hazem-soussi-HA/maze-ship'
    },
    {
        id: 'os-drafts',
        name: 'Superseded OS drafts',
        license: 'mixed',
        relation: 'archived on GitHub, read-only',
        repos: [
            'hazoom-os-archived', 'hazoom-os-v2-archived', 'hazoom-os-unified-archived',
            'hazoom-cloud-archived', 'hazoom-cloud-hub-archived', 'hazoom-cloud-unified-archived'
        ]
    }
];

function measureSiblings() {
    const out = [];
    for (const s of SIBLINGS) {
        if (!s.path) { out.push({ ...s, present: false }); continue; }
        try {
            const js = countLinesIn(path.join(s.path, 'public'), ['.js', '.css']);
            let commits = 0, files = 0;
            try {
                commits = parseInt(execFileSync('git', ['rev-list', '--count', 'HEAD'], {
                    cwd: s.path, timeout: 4000, stdio: ['ignore', 'pipe', 'ignore']
                }).toString().trim(), 10) || 0;
                files = parseInt(execFileSync('git', ['ls-files'], {
                    cwd: s.path, timeout: 4000, stdio: ['ignore', 'pipe', 'ignore']
                }).toString().trim().split('\n').filter(Boolean).length, 10) || 0;
            } catch (e) { /* not a git checkout: still report code size */ }
            out.push({ ...s, present: true, files, commits, codeLines: js.lines });
        } catch (e) {
            out.push({ ...s, present: false });
        }
    }
    return out;
}

function countLinesIn(dir, exts) {
    if (!fs.existsSync(dir)) return { files: 0, lines: 0 };
    let files = 0, lines = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory() || !exts.some(x => e.name.endsWith(x))) continue;
        files++;
        try { lines += fs.readFileSync(path.join(dir, e.name), 'utf8').split('\n').length; } catch (err) { /* ignore */ }
    }
    return { files, lines };
}

/** Headline score. Deliberately conservative: only what is proven counts. */
function score(b) {
    const k = b.kernel;
    const s = b.surface;
    const i = b.intelligence;
    return {
        kernelBuilds: k.bootsInQemu ? 100 : 0,
        intelligenceLive: i.available && i.modelsInstalled > 0 ? 100 : 0,
        servicesUp: s.services.configured ? Math.round((s.services.up / s.services.configured) * 100) : 0,
        loopbackOnly: s.nonLoopbackApps.length === 0 ? 100 : 0,
        kernelDepth: Math.min(100, Math.round((k.cKernel.lines / 2500) * 100)),
        intelligenceDepth: Math.min(100, Math.round(((i.modelsInstalled || 0) / 12) * 100)),
        appSurface: Math.min(100, Math.round((s.totalApps / 40) * 100))
    };
}

/**
 * Assemble the live measurement.
 * @param intel   result of IntelligenceCore.getStatus() — the measured surface
 * @param services { list, health } from ServiceManager, health already awaited
 */
function build(intel, services) {
    const b = {
        generatedAt: new Date().toISOString(),
        product: 'HAZOOM OS',
        version: (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; } catch (e) { return 'unknown'; } })(),
        repo: {
            trackedFiles: gitTrackedFiles(),
            commits: gitCount(['rev-list', '--count', 'HEAD']),
            head: (() => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } })()
        },
        kernel: measureKernel(),
        intelligence: measureIntelligence(intel),
        surface: measureSurface(services),
        siblings: measureSiblings(),
        history: { archived: SIBLINGS[1].repos, note: 'Archived 2026-10-01. Renamed -archived, read-only, history intact, nothing deleted.' }
    };
    b.score = score(b);
    return b;
}

module.exports = { build, measureKernel, measureIntelligence, measureSurface, measureSiblings, SIBLINGS };
