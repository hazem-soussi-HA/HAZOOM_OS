/**
 * js/auth.js — Client-side auth state + auth page rendering.
 *
 * Exposes `window.auth` with:
 *  - state: { user, token }
 *  - isLoggedIn(), isAdmin()
 *  - login(token, user), logout()
 *  - renderLogin(), renderRegister() — view renderers called by app.js router
 *
 * Token is persisted in localStorage; UI reflects logged-in state via
 * updateAuthUI(). Admin link is shown only for admin users.
 */

const AUTH_KEY = 'hazoom_token';
const USER_KEY = 'hazoom_user';

const auth = {
  state: { user: null, token: null },

  init() {
    try {
      this.state.token = localStorage.getItem(AUTH_KEY);
      const raw = localStorage.getItem(USER_KEY);
      this.state.user = raw ? JSON.parse(raw) : null;
    } catch { /* ignore corrupt storage */ }
    this.updateUI();
  },

  isLoggedIn() { return !!this.state.token; },
  isAdmin() { return this.state.user?.role === 'admin'; },

  login(token, user) {
    this.state = { token, user };
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.updateUI();
  },

  logout() {
    this.state = { user: null, token: null };
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    this.updateUI();
  },

  updateUI() {
    const area = document.getElementById('authArea');
    const adminLink = document.getElementById('adminLink');
    if (!area) return;
    if (this.isLoggedIn()) {
      area.innerHTML = `
        <span class="text-slate-500">${this.state.user?.name || this.state.user?.email || 'User'}</span>
        <button id="logoutBtn" class="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">Logout</button>`;
      area.querySelector('#logoutBtn').addEventListener('click', () => {
        this.logout();
        window.hazoomToast('Logged out');
        location.hash = '/';
      });
      if (adminLink) adminLink.classList.toggle('hidden', !this.isAdmin());
    } else {
      area.innerHTML = `
        <a href="/login" data-link class="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">Login</a>
        <a href="/register" data-link class="px-3 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700">Sign up</a>`;
      if (adminLink) adminLink.classList.add('hidden');
    }
  },

  async renderLogin(app) {
    app.innerHTML = `
      <section class="max-w-md mx-auto px-4 py-12 fade-in">
        <h1 class="text-2xl font-bold mb-6 text-center">Welcome back</h1>
        <form id="loginForm" class="card rounded-xl p-6 space-y-4">
          <div>
            <label class="block text-sm mb-1">Email</label>
            <input type="email" name="email" required class="field" placeholder="you@example.com" />
          </div>
          <div>
            <label class="block text-sm mb-1">Password</label>
            <input type="password" name="password" required class="field" placeholder="••••••" />
          </div>
          <button type="submit" class="btn-primary w-full py-2.5 rounded-lg font-semibold">Log in</button>
          <p class="text-sm text-center text-slate-500">No account? <a href="/register" data-link class="text-brand-600">Sign up</a></p>
        </form>
      </section>`;

    app.querySelector('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const { token, user } = await window.api.post('/api/auth/login', {
          email: f.email.value, password: f.password.value,
        });
        this.login(token, user);
        window.hazoomToast(`Welcome, ${user.name || user.email}!`);
        location.hash = user.role === 'admin' ? '/admin' : '/';
      } catch (err) {
        window.hazoomToast(err.message, true);
      }
    });
  },

  async renderRegister(app) {
    app.innerHTML = `
      <section class="max-w-md mx-auto px-4 py-12 fade-in">
        <h1 class="text-2xl font-bold mb-6 text-center">Create your account</h1>
        <form id="regForm" class="card rounded-xl p-6 space-y-4">
          <div>
            <label class="block text-sm mb-1">Name</label>
            <input type="text" name="name" class="field" placeholder="Hazem" />
          </div>
          <div>
            <label class="block text-sm mb-1">Email</label>
            <input type="email" name="email" required class="field" placeholder="you@example.com" />
          </div>
          <div>
            <label class="block text-sm mb-1">Password</label>
            <input type="password" name="password" required minlength="6" class="field" placeholder="min 6 chars" />
          </div>
          <button type="submit" class="btn-primary w-full py-2.5 rounded-lg font-semibold">Create account</button>
          <p class="text-sm text-center text-slate-500">Already have one? <a href="/login" data-link class="text-brand-600">Log in</a></p>
        </form>
      </section>`;

    app.querySelector('#regForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const { token, user } = await window.api.post('/api/auth/register', {
          name: f.name.value, email: f.email.value, password: f.password.value,
        });
        this.login(token, user);
        window.hazoomToast('Account created!');
        location.hash = '/';
      } catch (err) {
        window.hazoomToast(err.message, true);
      }
    });
  },
};

window.auth = auth;
