// ---- API client with token handling ----
const TOKEN_KEY = 'birds_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  return t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
}
function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ---- Small DOM helpers ----
export const $ = (sel, root = document) => root.querySelector(sel);
export const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'value') node.value = v;
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
};

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 2500);
}

export function currentUser() {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

// Render multi-line "content" into <p>/<ul> blocks (markdown-lite).
export function renderProse(text) {
  const wrap = el('div', { class: 'prose text-slate-700' });
  const lines = String(text || '').split('\n');
  let list = null;
  const flush = () => {
    if (list) {
      wrap.append(list);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      if (!list) list = el('ul');
      list.append(el('li', {}, line.trim().replace(/^[•\-]\s*/, '')));
    } else {
      flush();
      wrap.append(el('p', {}, line));
    }
  }
  flush();
  return wrap;
}

const STATUS_META = {
  LC: ['Least Concern', 'bg-green-100 text-green-700'],
  NT: ['Near Threatened', 'bg-lime-100 text-lime-700'],
  VU: ['Vulnerable', 'bg-yellow-100 text-yellow-700'],
  EN: ['Endangered', 'bg-orange-100 text-orange-700'],
  CR: ['Critically Endangered', 'bg-red-100 text-red-700'],
  EW: ['Extinct in Wild', 'bg-red-200 text-red-800'],
  EX: ['Extinct', 'bg-red-300 text-red-900'],
  DD: ['Data Deficient', 'bg-slate-200 text-slate-600'],
};
export function statusBadge(code) {
  const [label, cls] = STATUS_META[code] || ['Unknown', 'bg-slate-100 text-slate-600'];
  return el('span', { class: `inline-block text-xs px-2 py-0.5 rounded ${cls}` }, `${code} · ${label}`);
}

// Controlled vocabulary for bird sound classification.
export const SOUND_TYPES = ['Song', 'Call', 'Alarm', 'Drum', 'Wingbeat', 'Silent'];
export const SOUND_BANDS = ['Low', 'Mid', 'High', 'Very high'];

const SOUND_EMOJI = {
  Song: '🎵', Call: '🗣️', Alarm: '🚨', Drum: '🥁', Wingbeat: '🌬️', Silent: '🔇',
};
export function soundBadge(type) {
  if (!type || !SOUND_TYPES.includes(type)) return null;
  return el('span', { class: 'inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded' },
    `${SOUND_EMOJI[type] || ''} ${type}`);
}
export function soundBandLabel(band) {
  if (!band || !SOUND_BANDS.includes(band)) return null;
  return el('span', { class: 'text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded' }, `Pitch: ${band}`);
}

// Placeholder shown when a bird has no image (keeps the layout stable).
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">🐦 No image yet</text></svg>`
);
// Build an <img> for a bird. Falls back to a placeholder when image_url is empty,
// and on error (e.g. a dead link) so a broken-image icon never shows.
export function birdImage(b, { className = '', alt = '' } = {}) {
  const src = (b && b.image_url) || PLACEHOLDER;
  const img = el('img', {
    src,
    loading: 'lazy',
    class: className,
    alt: alt || (b ? b.common_name : 'bird'),
    onerror: (e) => { e.target.src = PLACEHOLDER; },
  });
  return img;
}
