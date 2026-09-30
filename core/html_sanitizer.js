/* HAZOOM OS — Remote HTML sanitizer
 *
 * Rewrites a third-party page so it can be rendered inside the OS without
 * inheriting our origin's privileges.
 *
 * Layered defence, because a single regex pass is never a guarantee:
 *   1. This module removes the dangerous constructs outright.
 *   2. The route serving the result pins a strict CSP (script-src 'none',
 *      form-action 'none', frame-src 'none'). Even a construct this file
 *      fails to recognise cannot execute.
 *
 * Without both layers, rendering remote HTML on our own origin would let that
 * page run script against the OS's own API — reasoning endpoints included.
 */
'use strict';

const { URL } = require('url');

const PAGE_ROUTE = '/api/web/page';
const ASSET_ROUTE = '/api/web/asset';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Attribute values arrive entity-encoded (query strings are full of &amp;).
   Resolving them verbatim produces a URL the upstream server cannot match. */
const NAMED_ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0', '#39': "'" };

function decodeEntities(value) {
    return String(value || '').replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, name) => {
        const key = name.toLowerCase();
        if (NAMED_ENTITIES[key] !== undefined) return NAMED_ENTITIES[key];
        if (key.startsWith('#x')) {
            const code = parseInt(key.slice(2), 16);
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        if (key.startsWith('#')) {
            const code = parseInt(key.slice(1), 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        return match;
    });
}

/** Only these schemes may survive in a rewritten attribute. */
function safeHref(value, base) {
    if (!value) return null;
    const raw = decodeEntities(String(value).trim());
    if (!raw || raw.startsWith('#')) return null;
    if (/^(javascript|vbscript|data|blob|file|about):/i.test(raw)) return null;
    try {
        const resolved = new URL(raw, base);
        if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return null;
        return resolved.toString();
    } catch (e) {
        return null;
    }
}

function pageUrl(absolute) {
    return `${PAGE_ROUTE}?url=${encodeURIComponent(absolute)}`;
}

function assetUrl(absolute) {
    return `${ASSET_ROUTE}?url=${encodeURIComponent(absolute)}`;
}

/** Rebuild a srcset so every candidate points at the asset proxy. */
function rewriteSrcset(value, base) {
    const out = [];
    for (const part of String(value).split(',')) {
        const bits = part.trim().split(/\s+/);
        if (!bits[0]) continue;
        const abs = safeHref(decodeEntities(bits[0]), base);
        if (abs) out.push(`${assetUrl(abs)}${bits[1] ? ' ' + bits[1] : ''}`);
    }
    return out.join(', ');
}

/* Elements removed entirely, contents included. Nested frames and plugins are
   both a security bypass and a performance hazard. */
const DROP_WITH_CONTENT = /<(script|noscript|iframe|frame|frameset|object|embed|applet|template|portal)\b[\s\S]*?<\/\1\s*>/gi;
/* Elements removed outright. <link> is deliberately NOT in this set: stylesheet
   links must survive so rewriteUrls() can route them through the asset proxy.
   Speculative/preload links are removed separately, above. */
const DROP_TAG_ONLY = /<\/?(base|meta)\b[^>]*>/gi;

function stripDangerous(html) {
    let out = html;
    // Self-closing / unclosed variants of the dangerous set.
    out = out.replace(/<(script|iframe|object|embed|applet)\b[^>]*\/?>/gi, '');
    out = out.replace(/<\/((script|iframe|object|embed|applet))\s*>/gi, '');
    out = out.replace(DROP_WITH_CONTENT, '');
    // Inline event handlers: on*="..." / on*='...' / on*=value
    out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    // style expressions and url(javascript:)
    out = out.replace(/expression\s*\(/gi, 'blocked(');
    out = out.replace(/url\s*\(\s*['"]?\s*javascript:[^)]*\)/gi, 'url(blocked)');
    // <base> hijacks every relative URL on the page.
    out = out.replace(/<base\b[^>]*>/gi, '');
    // Auto-refresh loops.
    out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');
    // Speculative connections waste bandwidth and leak intent to third parties.
    out = out.replace(/<link\b[^>]*rel\s*=\s*["']?(?:preload|prefetch|preconnect|dns-prefetch|prerender)["']?[^>]*>/gi, '');
    out = out.replace(DROP_TAG_ONLY, m => (/^<meta\b/i.test(m) && !/http-equiv/i.test(m) ? m : ''));
    // Inline <style> may not import or url() anything executable.
    out = out.replace(/@import\s+(url\()?\s*['"]?[^;]*;?/gi, match => (/javascript:|expression\(/i.test(match) ? '' : match));
    return out;
}

function rewriteUrls(html, base) {
    // Images
    html = html.replace(/<img\b([^>]*)>/gi, (tag, attrs) => {
        let a = attrs;
        a = a.replace(/\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, (m, _q, d, s, u) => {
            const abs = safeHref(d || s || u, base);
            return abs ? ` src="${assetUrl(abs)}"` : ' src=""';
        });
        a = a.replace(/\ssrcset\s*=\s*("([^"]*)"|'([^']*)')/i, (m, _q, d, s) => {
            const v = rewriteSrcset(d || s, base);
            return v ? ` srcset="${esc(v)}"` : '';
        });
        a = a.replace(/\sloading\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, ' loading="lazy"');
        a = a.replace(/\sdecoding\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, ' decoding="async"');
        a = a.replace(/\s(onload|onerror)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        return `<img${a}>`;
    });

    // Stylesheets
    html = html.replace(/<link\b([^>]*rel\s*=\s*["']?stylesheet["']?[^>]*)>/gi, (tag, attrs) => {
        const m = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        if (!m) return '';
        const abs = safeHref(m[2] || m[3] || m[4], base);
        return abs
            ? `<link rel="stylesheet" href="${assetUrl(abs)}" referrerpolicy="no-referrer">`
            : '';
    });

    // Media
    html = html.replace(/<(video|audio|source|track)\b([^>]*)>/gi, (tag, name, attrs) => {
        let a = attrs.replace(/\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, (m, _q, d, s, u) => {
            const abs = safeHref(d || s || u, base);
            return abs ? ` src="${assetUrl(abs)}"` : '';
        });
        a = a.replace(/\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        return `<${name}${a}>`;
    });

    // Links: keep navigation inside the browser instead of the top-level window.
    html = html.replace(/<a\b([^>]*)>/gi, (tag, attrs) => {
        let a = attrs.replace(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, (m, _q, d, s, u) => {
            const abs = safeHref(d || s || u, base);
            return abs ? ` href="${pageUrl(abs)}"` : ' href="#"';
        });
        a = a.replace(/\starget\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ' target="_blank"');
        a = a.replace(/\srel\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        a = a.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        return `<a${a} rel="noopener noreferrer">`;
    });

    // Forms: keep the markup readable but never let it submit anywhere.
    html = html.replace(/<form\b([^>]*)>/gi, '<form action="about:blank" onsubmit="return false" autocomplete="off">');
    html = html.replace(/<\/form\s*>/gi, '</form>');
    html = html.replace(/<input\b([^>]*)>/gi, (tag, attrs) => {
        const a = attrs.replace(/\stype\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, ' type="text"');
        return `<input${a} readonly>`;
    });
    html = html.replace(/<button\b([^>]*)>/gi, '<button type="button"$1>');

    return html;
}

function injectShell(html, { title, url, headAssets }) {
    const head = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${esc(title || url)}</title>
<style>
  html,body{margin:0;padding:0}
  body{font:14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e8ecf4;background:#0a0c14;overflow-wrap:break-word}
  img,video,svg,canvas{max-width:100%;height:auto}
  a{color:#22d3ee}
  pre,code{white-space:pre-wrap;word-break:break-word}
  table{max-width:100%;display:block;overflow-x:auto}
  input,button{font:inherit}
  ::selection{background:rgba(0,232,255,.3)}
</style>
${headAssets || ''}
</head>
<body>
<div id="hz-banner" style="position:sticky;top:0;z-index:9;padding:6px 10px;background:rgba(0,232,255,.08);border-bottom:1px solid rgba(0,232,255,.25);font:12px system-ui;color:#9fe8ff">
  Secured view &middot; scripts disabled &middot; <span class="hz-url">${esc(String(url).slice(0, 200))}</span>
</div>
`;
    return head + html + '\n</body>\n</html>';
}

function sanitizeHtml(html, { baseUrl, title }) {
    const source = String(html || '');

    // The upstream <head> carries CSP, <base> and preload hints we must not
    // keep, but it also carries the stylesheets. Harvest those first, then throw
    // the rest of the head away.
    const headMatch = source.match(/<head[^>]*>([\s\S]*?)<\/head\s*>/i);
    const head = headMatch ? headMatch[1] : '';

    const sheetLinks = [];
    for (const m of head.matchAll(/<link\b([^>]*rel\s*=\s*["']?stylesheet["']?[^>]*)>/gi)) {
        const href = m[1].match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const abs = href ? safeHref(href[2] || href[3] || href[4], baseUrl) : null;
        if (abs) sheetLinks.push(abs);
    }
    const inlineStyles = [...head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)]
        .map(m => m[1])
        .filter(block => !/javascript:|expression\s*\(/i.test(block));

    // Body content only, so we never emit a nested <html>/<head>/<body>.
    const bodyMatch = source.match(/<body[^>]*>([\s\S]*?)<\/body\s*>/i);
    let out = bodyMatch ? bodyMatch[1] : source;

    if (!bodyMatch) {
        out = out.replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/i, '');
        out = out.replace(/<\/?html\b[^>]*>/gi, '');
        out = out.replace(/<\/?body\b[^>]*>/gi, '');
        out = out.replace(/<\/?head\b[^>]*>/gi, '');
    }

    out = stripDangerous(out);
    out = rewriteUrls(out, baseUrl);

    // Re-attach the harvested styles, proxied like every other asset.
    let head_assets = '';
    if (sheetLinks.length) {
        head_assets += sheetLinks.slice(0, 12)
            .map(u => `<link rel="stylesheet" href="${assetUrl(u)}">`).join('');
    }
    for (const block of inlineStyles.slice(0, 8)) {
        head_assets += `<style>${block}</style>`;
    }

    return injectShell(out, { title, url: baseUrl, headAssets: head_assets });
}

module.exports = { sanitizeHtml, safeHref, PAGE_ROUTE, ASSET_ROUTE };
