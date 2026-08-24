import { $, currentUser, setToken, toast } from './ui.js';
import {
  homeView, browseView, birdDetailView, learnView, topicView,
  authView, editorView, aboutView, atlasView, eagleView,
} from './views.js';

// ---- Top-bar auth area ----
function renderAuthArea() {
  const area = $('#auth-area');
  const u = currentUser();
  area.innerHTML = '';
  if (u) {
    area.append(
      el('span', { class: 'text-slate-500' }, u.username + (u.role === 'admin' ? ' (admin)' : '')),
      el('a', { href: '#/browse', class: 'text-slate-600 hover:text-emerald-700' }, 'Browse'),
      el('a', { href: '#/learn', class: 'text-slate-600 hover:text-emerald-700' }, 'Learn'),
      el('a', { href: '#/edit/bird/new', class: 'text-emerald-600 hover:underline' }, '+ Bird'),
      el('a', { href: '#/edit/topic/new', class: 'text-emerald-600 hover:underline' }, '+ Topic'),
      el('button', {
        class: 'text-slate-400 hover:text-red-600',
        onClick: () => { setToken(null); toast('Signed out'); location.hash = '#/'; },
      }, 'Sign out')
    );
  } else {
    area.append(
      el('a', { href: '#/login', class: 'text-slate-600 hover:text-emerald-700' }, 'Sign in'),
      el('a', { href: '#/register', class: 'bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700' }, 'Register')
    );
  }
}

// `el` is needed by renderAuthArea; import it
import { el } from './ui.js';

// ---- Router ----
const routes = [
  { re: /^\/?$/, view: () => homeView() },
  { re: /^\/browse\/?$/, view: () => browseView() },
  { re: /^\/atlas\/?$/, view: () => atlasView() },
  { re: /^\/eagle\/?$/, view: () => eagleView() },
  { re: /^\/bird\/(\d+)\/?$/, view: (m) => birdDetailView(m[1]) },
  { re: /^\/learn\/?$/, view: () => learnView() },
  { re: /^\/topic\/([\w-]+)\/?$/, view: (m) => topicView(m[1]) },
  { re: /^\/login\/?$/, view: () => authView('login') },
  { re: /^\/register\/?$/, view: () => authView('register') },
  { re: /^\/about\/?$/, view: () => aboutView() },
  { re: /^\/edit\/bird\/(\w+)\/?$/, view: (m) => editorView('bird', m[1] === 'new' ? null : m[1]) },
  { re: /^\/edit\/topic\/(\w+)\/?$/, view: (m) => editorView('topic', m[1] === 'new' ? null : m[1]) },
];

async function render() {
  renderAuthArea();
  const hash = location.hash.replace(/^#/, '') || '/';
  const view = $('#view');
  view.innerHTML = '<p class="text-slate-400 text-sm">Loading…</p>';
  for (const r of routes) {
    const m = hash.match(r.re);
    if (m) {
      try {
        const node = await r.view(m);
        view.innerHTML = '';
        view.append(node);
      } catch (e) {
        view.innerHTML = '';
        view.append(el('div', { class: 'bg-red-50 text-red-700 p-4 rounded-lg' }, e.message));
      }
      window.scrollTo(0, 0);
      return;
    }
  }
  view.innerHTML = '';
  view.append(el('div', { class: 'text-center py-12' },
    el('p', { class: 'text-slate-500' }, 'Page not found.'),
    el('a', { href: '#/', class: 'text-emerald-600 hover:underline' }, 'Go home')
  ));
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();
