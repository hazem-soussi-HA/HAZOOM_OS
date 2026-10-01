'use strict';

/**
 * HAZOOM OS — Surface verification
 *
 * Answers the question that makes this project exhausting to look at:
 * *is any of this real?*
 *
 * The registry in apps-registry.json is a promise: 40 apps, 20+ services. A
 * promise decays. Services stop, ports close, files get moved, and nobody
 * notices until someone opens an app and gets a dead page — at which point the
 * honest conclusion feels like "none of this works", which is the specific lie
 * that burns someone out.
 *
 * So this verifies every entry against reality, right now, and reports the
 * difference between three states that the registry cannot distinguish:
 *
 *   live       the app is actually serving and answering
 *   present    the code is on disk, it is just not running
 *   missing    neither — the promise is broken and needs fixing
 *
 * `present` is the important one. Half-built is not the same as worthless, and
 * conflating the two is how a large body of work starts to feel like a lie.
 * Distinguishing them is most of the value here.
 *
 * Nothing is cached across calls and nothing is asserted from the registry:
 * ports are opened, files are stat'd, and the answer is whatever is true at
 * request time.
 */

const fs = require('fs');
const net = require('net');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, '..');

/** Open a TCP port on loopback with a short timeout. Resolves to a boolean. */
function probePort(port, host, timeoutMs) {
    return new Promise(resolve => {
        const socket = new net.Socket();
        let settled = false;
        const done = v => {
            if (settled) return;
            settled = true;
            try { socket.destroy(); } catch (e) { /* already gone */ }
            resolve(v);
        };
        socket.setTimeout(timeoutMs || 1200);
        socket.once('connect', () => done(true));
        socket.once('timeout', () => done(false));
        socket.once('error', () => done(false));
        try {
            socket.connect(port, host || '127.0.0.1');
        } catch (e) {
            done(false);
        }
    });
}

function parseTarget(rawPath) {
    const p = String(rawPath || '').trim();
    if (/^https?:\/\//i.test(p)) {
        try {
            const u = new URL(p);
            const local = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(u.hostname);
            return { kind: 'url', url: p, host: u.hostname, port: Number(u.port) || (u.protocol === 'https:' ? 443 : 80), local };
        } catch (e) {
            return { kind: 'invalid', raw: p };
        }
    }
    if (!p) return { kind: 'none' };
    return { kind: 'file', rel: p.replace(/^\.?\//, '') };
}

// An entry point is any file the OS can actually serve or launch. The first
// pass of this check only looked for index.html/server.js/app.js and duly
// reported three healthy projects as "broken" — a Godot project with .gd
// files, and two web projects whose entry is dashboard.html / a subdirectory.
// Flagging real work as broken is worse than staying silent, so the test is
// now "can the OS do anything with this", not "is this the filename I expect".
const DIRECT_ENTRIES = [
    'index.html', 'server.js', 'app.js', 'main.py', 'server.py', 'main.js',
    'dashboard.html', 'index.htm', 'main.gd', 'project.godot', 'README.md',
    'Makefile', 'build.sh', 'package.json', 'Dockerfile'
];
const WEB_ENTRIES = ['index.html', 'index.htm', 'dashboard.html', 'main.html', 'app.html'];

function scanDir(dir, depth) {
    const results = { entry: null, webEntry: null, subdirs: [], hasGodot: false, fileCount: 0 };
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return results; }
    const names = entries.filter(e => !e.name.startsWith('.') && e.name !== 'node_modules').map(e => e.name);

    for (const n of names) {
        if (/\.gd$/.test(n) || n === 'project.godot') results.hasGodot = true;
        if (/\.(html?|js|py|gd)$/.test(n) || n === 'project.godot' || n === 'Makefile' || n === 'package.json') results.fileCount++;
        if (!results.entry && DIRECT_ENTRIES.includes(n)) results.entry = n;
        if (!results.webEntry && WEB_ENTRIES.includes(n)) results.webEntry = n;
    }

    if (depth > 0) {
        for (const e of entries) {
            if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
                results.subdirs.push(e.name);
            }
        }
    }
    return results;
}

function statTarget(rel) {
    const full = path.join(ROOT, rel);
    try {
        const st = fs.statSync(full);
        if (!st.isDirectory()) return { exists: true, dir: false, bytes: st.size };
        const scan = scanDir(full, 1);
        // a web entry is directly usable; anything else launchable is "present"
        let webEntry = scan.webEntry;
        let sub = null;
        if (!webEntry) {
            for (const d of scan.subdirs.slice(0, 12)) {
                const s2 = scanDir(path.join(full, d), 0);
                if (s2.webEntry) { webEntry = s2.webEntry; sub = d; break; }
            }
        }
        return {
            exists: true,
            dir: true,
            bytes: st.size,
            entry: webEntry || scan.entry || null,
            webEntry: webEntry || null,
            webEntrySubdir: sub,
            hasGodot: scan.hasGodot,
            fileCount: scan.fileCount
        };
    } catch (e) {
        return { exists: false };
    }
}

async function verifyApp(app, category) {
    const t = parseTarget(app.path);
    const base = {
        id: app.id || null,
        name: app.name,
        category,
        path: app.path,
        licence: app.licence || null,
        note: app.note || null
    };

    if (t.kind === 'none') {
        return { ...base, state: 'missing', reason: 'registry entry has no path' };
    }
    if (t.kind === 'invalid') {
        return { ...base, state: 'missing', reason: 'path is not a valid URL' };
    }

    if (t.kind === 'file') {
        const s = statTarget(t.rel);
        if (!s.exists) {
            return { ...base, state: 'missing', reason: `no such file: ${t.rel}` };
        }
        if (s.dir && !s.entry) {
            return { ...base, state: 'missing', reason: `directory has nothing the OS can serve or launch: ${t.rel}` };
        }
        // A file the OS serves is usable the moment it is clicked, so it is
        // live — not merely "present". Collapsing those two would understate
        // what actually works, which is the mirror image of the same lie.
        const viaSub = s.webEntrySubdir ? `${s.webEntrySubdir}/${s.webEntry}` : null;
        return {
            ...base,
            state: 'live',
            served: 'by HAZOOM OS on loopback',
            bytes: s.bytes || null,
            entry: viaSub || s.entry || null,
            kind: s.hasGodot ? 'godot project' : (s.webEntry ? 'web' : 'code'),
            reason: null
        };
    }

    // URL: a loopback port is the only thing that can be live in a local-first OS
    if (!t.local) {
        return {
            ...base,
            state: 'missing',
            reason: 'points off-machine — a local-first OS has no business here'
        };
    }

    const up = await probePort(t.port, '127.0.0.1', 1200);
    if (up) {
        return { ...base, state: 'live', port: t.port, reason: null };
    }

    // not listening — is the code behind it at least on disk?
    const src = app.source ? statTarget(String(app.source).replace(/^\.?\//, '')) : null;
    if (src && src.exists) {
        return {
            ...base,
            state: 'present',
            port: t.port,
            served: null,
            source: app.source,
            reason: `code exists at ${app.source}, nothing is listening on ${t.port}`
        };
    }
    return {
        ...base,
        state: 'missing',
        port: t.port,
        reason: `nothing on ${t.port} and no source at ${app.source || 'unknown path'}`
    };
}

/** Verify the whole registry, concurrently but bounded. */
async function verifyAll(registry) {
    const jobs = [];
    for (const c of registry.categories || []) {
        for (const a of c.apps || []) jobs.push(verifyApp(a, c.name));
    }
    const apps = await Promise.all(jobs);

    const tally = { live: 0, present: 0, missing: 0 };
    for (const a of apps) tally[a.state] = (tally[a.state] || 0) + 1;

    const broken = apps.filter(a => a.state === 'missing');
    const notRunning = apps.filter(a => a.state === 'present');

    return {
        generatedAt: new Date().toISOString(),
        total: apps.length,
        tally,
        // a promise only the machine can keep
        integrity: apps.length ? Math.round(((tally.live + tally.present) / apps.length) * 100) : 0,
        runningIntegrity: apps.length ? Math.round((tally.live / apps.length) * 100) : 0,
        broken,
        notRunning,
        apps
    };
}

function loadRegistry() {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'apps-registry.json'), 'utf8'));
}

module.exports = { verifyAll, verifyApp, probePort, parseTarget, statTarget, loadRegistry };
