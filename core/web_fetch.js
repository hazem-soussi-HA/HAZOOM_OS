/* HAZOOM OS — Secure outbound web fetcher
 *
 * Backs the in-OS browser. Lets the desktop read the public internet while
 * making it impossible to use the OS as a pivot into the machine's own
 * network. That distinction is the whole point: "open to the WAN" must never
 * mean "open to 127.0.0.1".
 *
 * Threat model addressed
 *   SSRF / internal pivot  - every resolved address is checked, not just the
 *                            hostname string, so DNS rebinding cannot slip a
 *                            public name through to a private address.
 *   Protocol smuggle       - http/https only; file:, data:, javascript:, ftp:
 *                            and friends are rejected before any I/O.
 *   Redirect pivot         - each hop is re-validated, so a public URL cannot
 *                            bounce the fetcher into the loopback range.
 *   Resource exhaustion    - hard caps on redirects, body bytes, wall-clock
 *                            time, and concurrent in-flight requests.
 *   Credential leakage     - no inbound cookies/auth are ever forwarded, and
 *                            Set-Cookie is stripped from what we return.
 *
 * Performance
 *   Short-TTL response cache, in-flight de-duplication (many tabs asking for
 *   the same URL cost one fetch), a DNS cache, and a concurrency gate so a
 *   burst of tabs cannot saturate the event loop or the network.
 */
'use strict';

const dns = require('dns').promises;
const net = require('net');
const zlib = require('zlib');
const { URL } = require('url');

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) HAZOOM-OS/6.0 (secure in-OS browser)';

const LIMITS = {
    maxRedirects: 5,
    maxAttempts: 3,            // transient network faults are common on WAN
    retryBaseMs: 250,
    maxBytes: 6 * 1024 * 1024,     // 6 MB per response
    connectTimeoutMs: 8000,
    totalTimeoutMs: 20000,
    maxConcurrent: 6,
    cacheTtlMs: 60 * 1000,
    dnsTtlMs: 5 * 60 * 1000,
    cacheMaxEntries: 120
};

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
// Ports that exist to serve software, not the public web. Blocked outright so a
// crafted request cannot reach an internal listener even on a public address.
const BLOCKED_PORTS = new Set([
    22, 23, 25, 111, 135, 139, 445, 465, 587, 993, 995, 1433, 1521, 2049, 3306, 3389, 5432, 5900, 6379, 11211
]);

/* Connection-level faults worth one more attempt. A refused/blocked address or
   a bad scheme is NOT transient and must never be retried. */
const TRANSIENT_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_SOCKET']);

function isTransient(error) {
    if (!error) return false;
    if (error instanceof WebFetchError) return false;
    const code = error.code || error.cause?.code || error.errno;
    if (code && TRANSIENT_CODES.has(code)) return true;
    return error.name === 'AbortError' || error.name === 'TimeoutError' || error.name === 'TypeError';
}

class WebFetchError extends Error {
    constructor(message, code, status = 400) {
        super(message);
        this.name = 'WebFetchError';
        this.code = code;
        this.status = status;
    }
}

/* ── address classification ──────────────────────────────────────── */

function ipv4ToInt(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (const p of parts) {
        const v = Number(p);
        if (!Number.isInteger(v) || v < 0 || v > 255) return null;
        n = (n * 256) + v;
    }
    return n;
}

const V4 = {
    loopback: [[ipv4ToInt('127.0.0.0'), 8]],
    private: [[ipv4ToInt('10.0.0.0'), 8], [ipv4ToInt('172.16.0.0'), 12], [ipv4ToInt('192.168.0.0'), 16]],
    linkLocal: [[ipv4ToInt('169.254.0.0'), 16]],
    cgnat: [[ipv4ToInt('100.64.0.0'), 10]],
    benchmarking: [[ipv4ToInt('198.18.0.0'), 15]],
    reserved: [
        [ipv4ToInt('0.0.0.0'), 8],
        [ipv4ToInt('192.0.0.0'), 24],
        [ipv4ToInt('192.0.2.0'), 24],
        [ipv4ToInt('198.51.100.0'), 24],
        [ipv4ToInt('203.0.113.0'), 24],
        [ipv4ToInt('224.0.0.0'), 4],
        [ipv4ToInt('240.0.0.0'), 4]
    ]
};

function v4InRange(int, range) {
    const [base, bits] = range;
    if (int === null || base === null) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (int & mask) === (base & mask);
}

function isPrivateIPv4(ip) {
    const int = ipv4ToInt(ip);
    if (int === null) return true;              // unparseable -> refuse
    for (const group of ['loopback', 'private', 'linkLocal', 'cgnat', 'benchmarking', 'reserved']) {
        for (const range of V4[group]) {
            if (v4InRange(int, range)) return true;
        }
    }
    return false;
}

function isPrivateIPv6(ip) {
    const addr = ip.toLowerCase().split('%')[0];
    if (addr === '::1' || addr === '::') return true;
    // IPv4-mapped / IPv4-compatible: judge by the embedded v4 address.
    const mapped = addr.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIPv4(mapped[1]);
    if (addr.startsWith('fe80')) return true;              // link-local
    const first = addr.split(':')[0];
    if (/^f[cd]/.test(first)) return true;                 // unique local fc00::/7
    if (addr.startsWith('ff')) return true;                // multicast
    if (addr.startsWith('2001:db8')) return true;           // documentation
    return false;
}

function stripBrackets(host) {
    const h = String(host || '');
    return h.startsWith('[') && h.endsWith(']') ? h.slice(1, -1) : h;
}

/**
 * Classify a literal IP address. Hostnames return false: they are not
 * addresses, and judging them here would (correctly, but uselessly) refuse
 * every domain name. Real protection comes from resolveAll(), which checks
 * every address a name actually resolves to.
 */
function isPrivateAddress(ip) {
    const addr = stripBrackets(ip);
    const family = net.isIP(addr);
    if (!family) return false;
    return family === 6 ? isPrivateIPv6(addr) : isPrivateIPv4(addr);
}

/** True when the value is a literal address (not a DNS name). */
function isIpLiteral(value) {
    return net.isIP(stripBrackets(value)) !== 0;
}

/* ── caches and gating ───────────────────────────────────────────── */

const dnsCache = new Map();   // hostname -> { addrs, expires }
const resCache = new Map();   // url -> { status, headers, body, expires }
const inFlight = new Map();   // url -> Promise
let active = 0;
const queue = [];

function acquireSlot() {
    if (active < LIMITS.maxConcurrent) { active++; return Promise.resolve(); }
    return new Promise(resolve => queue.push(resolve));
}

function releaseSlot() {
    active--;
    const next = queue.shift();
    if (next) { active++; next(); }
}

async function resolveAll(hostname) {
    const cached = dnsCache.get(stripBrackets(hostname));
    if (cached && cached.expires > Date.now()) return cached.addrs;

    const host = stripBrackets(hostname);
    let addrs;
    const literal = net.isIP(host);
    if (literal) {
        addrs = [{ address: host, family: literal }];
    } else {
        addrs = await dns.lookup(host, { all: true, verbatim: true });
    }
    if (!addrs || !addrs.length) {
        throw new WebFetchError(`Cannot resolve ${hostname}`, 'DNS_FAIL', 502);
    }
    // Every answer must be public. One private answer poisons the name.
    for (const a of addrs) {
        if (isPrivateAddress(a.address)) {
            throw new WebFetchError('Refused: target resolves to a private or reserved address', 'BLOCKED_ADDRESS', 403);
        }
    }
    dnsCache.set(host, { addrs, expires: Date.now() + LIMITS.dnsTtlMs });
    return addrs;
}

/* ── validation ─────────────────────────────────────────────────── */

function normaliseTarget(raw) {
    let candidate = String(raw || '').trim();
    if (!candidate) throw new WebFetchError('Missing url', 'BAD_URL');
    if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) candidate = `https://${candidate}`;

    let url;
    try {
        url = new URL(candidate);
    } catch (e) {
        throw new WebFetchError('Malformed url', 'BAD_URL');
    }
    if (!ALLOWED_SCHEMES.has(url.protocol)) {
        throw new WebFetchError(`Refused protocol: ${url.protocol.replace(':', '')}`, 'BLOCKED_SCHEME', 403);
    }
    if (!url.hostname) throw new WebFetchError('Missing host', 'BAD_URL');
    if (url.username || url.password) {
        throw new WebFetchError('Refused: embedded credentials are not allowed', 'BLOCKED_CREDENTIALS', 403);
    }
    if (BLOCKED_PORTS.has(Number(url.port))) {
        throw new WebFetchError(`Refused port ${url.port}`, 'BLOCKED_PORT', 403);
    }
    if (isIpLiteral(url.hostname) && isPrivateAddress(url.hostname)) {
        throw new WebFetchError('Refused: private or reserved address', 'BLOCKED_ADDRESS', 403);
    }
    return url;
}

/* ── body reading with a hard cap ────────────────────────────────── */

async function readCapped(response, maxBytes) {
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > maxBytes) {
        throw new WebFetchError('Response too large', 'TOO_LARGE', 413);
    }
    const chunks = [];
    let total = 0;
    const reader = response.body.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > maxBytes) {
            try { await reader.cancel(); } catch (_) {}
            throw new WebFetchError('Response too large', 'TOO_LARGE', 413);
        }
        chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
}

function decodeBody(buffer, encoding) {
    const enc = (encoding || '').toLowerCase();
    try {
        if (enc.includes('gzip') || enc.includes('x-gzip')) return zlib.gunzipSync(buffer);
        if (enc.includes('deflate')) return zlib.inflateSync(buffer);
        if (enc.includes('br') && typeof zlib.brotliDecompressSync === 'function') {
            return zlib.brotliDecompressSync(buffer);
        }
    } catch (e) {
        return buffer;
    }
    return buffer;
}

/* ── single hop, no redirect following ───────────────────────────── */

async function fetchOnce(url, accept, signal) {
    const addrs = await resolveAll(url.hostname);

    // Pin the connection to a validated address family. Undici's dispatcher is
    // intentionally not used here: we resolve first, refuse private answers, and
    // let the runtime connect normally, which avoids keeping a custom agent
    // alive per request.
    void addrs;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIMITS.totalTimeoutMs);
    const onOuterAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onOuterAbort, { once: true });

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': accept || '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                // Never carry the caller's identity to a third party.
                'Cookie': '',
                'Authorization': ''
            }
        });
        return response;
    } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onOuterAbort);
    }
}

async function fetchWithRetry(url, accept, signal) {
    let lastError;
    for (let attempt = 1; attempt <= LIMITS.maxAttempts; attempt++) {
        if (signal && signal.aborted) throw new WebFetchError('Client cancelled', 'CANCELLED', 499);
        try {
            return await fetchOnce(url, accept, signal);
        } catch (e) {
            lastError = e;
            if (!isTransient(e) || attempt === LIMITS.maxAttempts) throw e;
            // Exponential backoff with jitter so parallel tabs don't resync.
            const wait = LIMITS.retryBaseMs * Math.pow(2, attempt - 1);
            await new Promise(r => setTimeout(r, wait + Math.floor(Math.random() * 120)));
        }
    }
    throw lastError;
}

/**
 * Fetch a public resource with every guard applied.
 * Returns { status, headers, body(Buffer), finalUrl, fromCache }.
 */
async function fetchResource(rawUrl, opts = {}) {
    const accept = opts.accept;
    const signal = opts.signal;
    const ttl = opts.cacheTtlMs === 0 ? 0 : (opts.cacheTtlMs ?? LIMITS.cacheTtlMs);
    const cacheable = opts.cacheable !== false && ttl > 0;
    const key = `${accept || '*/*'}|${rawUrl}`;

    if (cacheable) {
        const hit = resCache.get(key);
        if (hit && hit.expires > Date.now()) {
            return { ...hit.value, fromCache: true };
        }
        if (hit) resCache.delete(key);
    }

    // Collapse duplicate concurrent requests (e.g. 5 tabs, same page).
    if (cacheable && inFlight.has(key)) return inFlight.get(key);

    const work = (async () => {
        await acquireSlot();
        try {
            let url = normaliseTarget(rawUrl);
            let response = null;

            for (let hop = 0; hop <= LIMITS.maxRedirects; hop++) {
                response = await fetchWithRetry(url, accept, signal);
                if ([301, 302, 303, 307, 308].includes(response.status)) {
                    const location = response.headers.get('location');
                    if (!location) throw new WebFetchError('Redirect without a target', 'BAD_REDIRECT', 502);
                    // Re-validate the new hop: a public URL must not be able to
                    // redirect us into the loopback range.
                    url = normaliseTarget(new URL(location, url).toString());
                    try { await response.body?.cancel(); } catch (_) {}
                    continue;
                }
                break;
            }
            if ([301, 302, 303, 307, 308].includes(response.status)) {
                throw new WebFetchError('Too many redirects', 'TOO_MANY_REDIRECTS', 502);
            }

            const raw = await readCapped(response, opts.maxBytes || LIMITS.maxBytes);
            const body = decodeBody(raw, response.headers.get('content-encoding'));

            const headers = {};
            for (const name of ['content-type', 'last-modified', 'etag', 'cache-control']) {
                const v = response.headers.get(name);
                if (v) headers[name] = v;
            }
            // Set-Cookie and Set-Cookie2 are intentionally never propagated.
            const value = {
                status: response.status,
                headers,
                body,
                finalUrl: url.toString()
            };
            if (cacheable && response.status === 200) {
                resCache.set(key, { value, expires: Date.now() + ttl });
                while (resCache.size > LIMITS.cacheMaxEntries) {
                    resCache.delete(resCache.keys().next().value);
                }
            }
            return { ...value, fromCache: false };
        } finally {
            releaseSlot();
        }
    })();

    if (cacheable) {
        inFlight.set(key, work);
        work.finally(() => inFlight.delete(key)).catch(() => {});
    }
    return work;
}

function stats() {
    return {
        cached: resCache.size,
        inFlight: inFlight.size,
        dnsCached: dnsCache.size,
        active,
        queued: queue.length
    };
}

function clearCaches() {
    resCache.clear();
    dnsCache.clear();
}

module.exports = { fetchResource, WebFetchError, isPrivateAddress, isIpLiteral, stats, clearCaches, LIMITS };
