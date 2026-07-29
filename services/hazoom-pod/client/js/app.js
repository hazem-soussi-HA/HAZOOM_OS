/**
 * js/app.js — SPA router + bootstrap + design-system helpers.
 * Hash-based routing (#/path). Theme now switches between `dark` and `light`
 * classes on <html> (the CSS design system keys off both). Also wires a
 * reveal-on-scroll observer and exposes window.hazoom.ui helpers.
 */

const app = document.getElementById('app');

// ---- Theme ----
function initTheme() {
  const saved = localStorage.getItem('hazoom_theme');
  const dark = saved ? saved !== 'light' : true; // default dark
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.classList.toggle('light', !dark);
  updateThemeIcon(dark);
}
function updateThemeIcon(dark) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = dark ? '🌙' : '☀️';
}
function toggleTheme() {
  const isDark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  localStorage.setItem('hazoom_theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

// ---- Reveal on scroll ----
let revealObserver;
function initReveal() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
}
function observeReveals(root = document) {
  root.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (Math.min(i, 6) * 60) + 'ms';
    if (revealObserver) revealObserver.observe(el);
  });
}

// ---- UI helper namespace ----
window.hazoom = window.hazoom || {};
window.hazoom.ui = {
  reveal(html, cls = '') { return `<div class="reveal ${cls}">${html}</div>`; },
  money(cents) { return '$' + (cents / 100).toFixed(2); },
};

// ---- Router ----
async function router() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, query] = hash.split('?');
  const parts = path.split('/').filter(Boolean);

  cart.renderCount();
  auth.updateUI();

  try {
    if (path === '/' || path === '') {
      await window.homeView.renderHome(app);
    } else if (path === '/shop') {
      await window.productsView.renderShop(app);
    } else if (parts[0] === 'product' && parts[1]) {
      await window.productsView.renderProduct(app, parts[1]);
    } else if (path === '/cart') {
      window.productsView.renderCart(app);
    } else if (path === '/designer') {
      await window.designerView.renderDesigner(app);
    } else if (path === '/checkout') {
      await window.checkoutView.renderCheckout(app);
    } else if (parts[0] === 'order' && parts[1]) {
      await window.checkoutView.renderOrder(app, parts[1]);
    } else if (path === '/orders') {
      await window.checkoutView.renderOrders(app);
    } else if (path === '/login') {
      await window.auth.renderLogin(app);
    } else if (path === '/register') {
      await window.auth.renderRegister(app);
    } else if (path === '/admin') {
      await renderAdmin(app);
    } else {
      app.innerHTML = `<div class="max-w-md mx-auto px-4 py-20 text-center text-[var(--text-dim)]">Page not found. <a href="/" data-link class="text-[var(--brand)]">Home →</a></div>`;
    }
  } catch (err) {
    app.innerHTML = `<p class="text-center text-red-500 py-20">${err.message}</p>`;
  }
  window.scrollTo(0, 0);
  observeReveals(app);
}

// Intercept same-origin data-link clicks that use hash navigation.
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-link]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href && href.startsWith('/')) {
    e.preventDefault();
    location.hash = href;
  }
});

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  // Populate the app version from the API (single source of truth: package.json).
  try {
    window.api.get('/api/config').then((cfg) => {
      const el = document.getElementById('appVersion');
      if (el && cfg && cfg.version) el.textContent = cfg.version;
    }).catch(() => {});
  } catch { /* api helper may not be ready; footer keeps placeholder */ }
  initTheme();
  initReveal();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  auth.init();
  cart.init();
  window.addEventListener('hashchange', router);
  router();
});
