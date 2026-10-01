/* HAZOOM OS — service worker
 *
 * "Local-first" is a claim the OS has to actually keep. Without a service
 * worker the desktop is a web page that dies the moment the network does, and
 * the whole premise — yours, running on your machine, sovereign — quietly
 * becomes untrue at the worst moment.
 *
 * So the shell is precached and served cache-first. The app survives going
 * offline, reloads offline, and can be installed to the desktop as a real
 * application window rather than a browser tab.
 *
 * Rules that follow from that, and are the reason this file is not longer:
 *
 *   - Precaching is explicit. Only the shell and its modules are listed.
 *     A blind "cache everything on first load" would store the entire repo
 *     including 45MB of model-adjacent assets and video, and would serve a
 *     stale build forever with no invalidation story.
 *
 *   - Navigation is network-first, not cache-first. A cached index.html is
 *     the worst thing that can happen to a development OS: you change code,
 *     reload, and see yesterday. Network-first with a cache fallback gives
 *     offline capability without lying about freshness. It is only safe here
 *     because the OS is loopback — "network" is the local server, which is
 *     always there unless the OS itself is stopped.
 *
 *   - The secure fetcher is never cached. /api/web/* proxies the public
 *     internet through a deliberately strict SSRF and redirect guard. Caching
 *     it here would silently turn a one-shot security decision into a
 *     replayable stored response, and the in-OS browser already has its own
 *     audited cache with its own TTL. Two caches for one fetcher is how a
 *     security boundary quietly stops being one.
 *
 *   - Bounded, and old generations are deleted on activate. An unbounded cache
 *     on a machine that runs for weeks is a slow disk failure.
 *
 *   - No credentials. Nothing here reads, stores, or forwards a token. The
 *     JWT lives in the page, not here.
 */

const VERSION = 'hazoom-os-v6.0.0';
const SHELL_CACHE = VERSION + '-shell';
const ASSET_CACHE = VERSION + '-assets';

const MAX_ASSET_ENTRIES = 300;

/* The shell and the modules it needs in order to draw a desktop at all. */
const SHELL = [
    '/',
    '/index.html',
    '/showcase.html',
    '/manifest.json',
    '/core/icons.js',
    '/core/os-desktop.js',
    '/core/app_registry.js',
    '/core/app_launcher.js',
    '/core/boot_audio.js',
    '/core/universe_background.js',
    '/core/quantum_state.js',
    '/core/service_constellation.js',
    '/core/websocket.js',
    '/core/system_monitor.js',
    '/core/os-filesystem.js',
    '/apps/system/convergence.html',
    '/assets/icons/console.svg',
    '/assets/icons/consciousness-core.svg'
];

/* Prefetched lazily as the user actually reaches them. */
const WARM = [
    '/apps/core-apps/terminal.html',
    '/apps/core-apps/deep-browser.html',
    '/apps/core-apps/settings.html',
    '/apps/tools/transistor-studio.html',
    '/apps/tools/github-bridge.html'
];

/* Never cached, under any circumstances. */
const NEVER_CACHE = [
    '/api/web/',        // secure outbound fetcher — audited elsewhere
    '/api/auth/',       // credentials and tokens
    '/api/v1/auth/',
    '/api/benchmark',   // must reflect the machine as it is now
    '/api/surface',     // same: a cached "everything is fine" is a lie
    '/api/status',
    '/api/services',
    '/api/qlearner'
];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(SHELL_CACHE);
        // addAll is all-or-nothing: one 404 and the whole install fails, which
        // would leave the OS with no worker at all. Add individually so a single
        // missing asset cannot break installation.
        await Promise.all(SHELL.map(async url => {
            try {
                const res = await fetch(url, { cache: 'reload' });
                if (res && res.ok) await cache.put(url, res);
            } catch (e) { /* offline during install: the fetch will happen on demand */ }
        }));
        self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

function isNeverCache(url) {
    return NEVER_CACHE.some(prefix => url.pathname.startsWith(prefix));
}

async function trimCache(name, max) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    if (keys.length <= max) return;
    // oldest first — Cache API preserves insertion order
    for (const req of keys.slice(0, keys.length - max)) {
        await cache.delete(req);
    }
}

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // same-origin only. The OS never caches or mediates a third-party request.
    if (url.origin !== self.location.origin) return;
    if (isNeverCache(url)) return;

    // Navigation: network first, cache as the offline fallback. On loopback
    // "network" is the local server, so this is fresh whenever the OS runs and
    // still works when it does not.
    if (req.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const res = await fetch(req);
                const cache = await caches.open(SHELL_CACHE);
                cache.put('/', res.clone()).catch(() => {});
                return res;
            } catch (e) {
                const cached = await caches.match('/', { cacheName: SHELL_CACHE });
                return cached || new Response(
                    '<!doctype html><meta charset="utf-8"><title>HAZOOM OS offline</title>' +
                    '<body style="background:#04060c;color:#e8f6ff;font:15px system-ui;padding:40px">' +
                    '<h1 style="font-weight:600">HAZOOM OS is offline</h1>' +
                    '<p style="color:#7f95ab">The shell was never cached. Start the OS and reload.</p>',
                    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
            }
        })());
        return;
    }

    // Everything else: cache first, then fill in the background.
    event.respondWith((async () => {
        const cached = await caches.match(req);
        if (cached) {
            // revalidate quietly so the next load is not stale
            event.waitUntil((async () => {
                try {
                    const fresh = await fetch(req);
                    if (fresh && fresh.ok) {
                        const cache = await caches.open(ASSET_CACHE);
                        await cache.put(req, fresh.clone());
                        await trimCache(ASSET_CACHE, MAX_ASSET_ENTRIES);
                    }
                } catch (e) { /* offline: the cached copy stands */ }
            })());
            return cached;
        }
        try {
            const res = await fetch(req);
            if (res && res.ok && res.type === 'basic') {
                const cache = await caches.open(ASSET_CACHE);
                cache.put(req, res.clone()).catch(() => {});
                trimCache(ASSET_CACHE, MAX_ASSET_ENTRIES).catch(() => {});
            }
            return res;
        } catch (e) {
            return new Response('', { status: 504, statusText: 'offline' });
        }
    })());
});

self.addEventListener('message', event => {
    // Lets the shell warm the cache deliberately instead of racing it.
    if (event.data === 'warm') {
        event.waitUntil((async () => {
            const cache = await caches.open(ASSET_CACHE);
            await Promise.all(WARM.map(async url => {
                try {
                    const res = await fetch(url, { cache: 'reload' });
                    if (res && res.ok) await cache.put(url, res);
                } catch (e) { /* not fatal: it will be fetched on demand */ }
            }));
        })());
    }
});
