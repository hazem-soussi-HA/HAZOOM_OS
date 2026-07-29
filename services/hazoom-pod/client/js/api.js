/**
 * js/api.js — Thin fetch wrapper for the Hazoom backend.
 *
 * - Prefixes /api automatically.
 * - Attaches the JWT from localStorage (set by auth.js).
 * - Normalizes errors so views can show friendly messages.
 */

const API_BASE = ''; // same origin

function getToken() {
  return localStorage.getItem('hazoom_token') || null;
}

async function request(path, { method = 'GET', body, auth = false, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Stripe webhook returns raw; nothing else here needs raw.
  const data = raw ? await res.text() : await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  patch: (p, body, opts) => request(p, { ...opts, method: 'PATCH', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' }),
};

// Expose globally for the classic <script> modules.
window.api = api;
window.hazoomToast = function (message, isError = false) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMsg');
  if (!toast) return;
  msg.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
};
