import { api, el, $, escapeHtml, renderProse, statusBadge, currentUser, toast, soundBadge, soundBandLabel, SOUND_TYPES, SOUND_BANDS, birdImage } from './ui.js';

// ---------- HOME ----------
export function homeView() {
  const root = el('div', { class: 'space-y-8' });
  root.append(
    el('section', { class: 'bg-emerald-700 text-white rounded-2xl p-8 md:p-12' },
      el('h1', { class: 'text-3xl md:text-4xl font-bold mb-3' }, 'Learn about birds — from feathers to flight'),
      el('p', { class: 'max-w-2xl text-emerald-50' },
        'A full encyclopedia of the world’s birds: taxonomy, identification, behavior, habitats, ' +
        'conservation, and curated learning tracks. Search, browse, and contribute.'),
      el('div', { class: 'mt-6 flex gap-3' },
        el('a', { href: '#/browse', class: 'bg-white text-emerald-700 font-semibold px-5 py-2 rounded-lg hover:bg-emerald-50' }, 'Browse birds'),
        el('a', { href: '#/learn', class: 'border border-emerald-200 text-white px-5 py-2 rounded-lg hover:bg-emerald-600' }, 'Start learning')
      )
    )
  );

  // Quick stats + featured
  const stats = el('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-4' });
  root.append(stats);
  api('/birds/taxonomy').then(({ conservation }) => {
    const total = conservation.reduce((a, c) => a + c.count, 0);
    const threatened = conservation.filter((c) => ['VU', 'EN', 'CR'].includes(c.conservation_status)).reduce((a, c) => a + c.count, 0);
    stats.append(
      statCard(total, 'Species in encyclopedia'),
      statCard(conservation.length, 'Conservation categories'),
      statCard(threatened, 'Threatened (VU/EN/CR)'),
      statCard('11k+', 'Bird species worldwide')
    );
  }).catch(() => {});

  const featured = el('div', {});
  root.append(el('h2', { class: 'text-xl font-semibold text-slate-700' }, 'Featured birds'), featured);
  api('/birds?limit=6').then(({ rows }) => {
    const grid = el('div', { class: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3' });
    rows.forEach((b) => grid.append(birdCard(b)));
    featured.append(grid);
  }).catch(() => {});

  return root;
}

function statCard(value, label) {
  return el('div', { class: 'bg-white rounded-xl shadow-sm p-4 text-center' },
    el('div', { class: 'text-2xl font-bold text-emerald-700' }, String(value)),
    el('div', { class: 'text-xs text-slate-500 mt-1' }, label)
  );
}

function birdCard(b) {
  const card = el('a', { href: `#/bird/${b.id}`, class: 'block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-slate-100' });
  const thumb = birdImage(b, { className: 'w-full h-40 object-cover', alt: b.common_name });
  card.append(
    thumb,
    el('div', { class: 'p-4' },
      el('div', { class: 'flex items-start justify-between gap-2' },
        el('div', {},
          el('h3', { class: 'font-semibold text-slate-800' }, b.common_name),
          el('p', { class: 'text-sm italic text-slate-500' }, b.scientific_name)
        ),
        statusBadge(b.conservation_status)
      ),
      el('p', { class: 'text-xs text-slate-500 mt-2' }, [b.order_name, b.family].filter(Boolean).join(' · ')),
      el('div', { class: 'flex flex-wrap gap-1.5 mt-2' },
        soundBadge(b.sound_type),
        soundBandLabel(b.sound_band)
      ),
      el('p', { class: 'text-sm text-slate-600 mt-2 line-clamp-3' }, b.description || '')
    )
  );
  return card;
}

// ---------- BROWSE / SEARCH ----------
export function browseView() {
  const root = el('div', { class: 'space-y-4' });
  const qInput = el('input', { type: 'search', placeholder: 'Search by name or scientific name…', class: 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400' });
  const orderSel = el('select', { class: 'border border-slate-300 rounded-lg px-3 py-2' });
  const statusSel = el('select', { class: 'border border-slate-300 rounded-lg px-3 py-2' },
    el('option', { value: '' }, 'All statuses'),
    ...['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD'].map((s) => el('option', { value: s }, s))
  );
  const soundSel = el('select', { class: 'border border-slate-300 rounded-lg px-3 py-2' },
    el('option', { value: '' }, 'All sounds'),
    ...SOUND_TYPES.map((s) => el('option', { value: s }, s))
  );
  const results = el('div', { class: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' });
  const count = el('p', { class: 'text-sm text-slate-500' });

  const controls = el('div', { class: 'bg-white rounded-xl shadow-sm p-4 space-y-3' },
    qInput,
    el('div', { class: 'flex flex-wrap gap-3' },
      el('label', { class: 'text-xs text-slate-500 flex items-center gap-1' }, 'Order', orderSel),
      el('label', { class: 'text-xs text-slate-500 flex items-center gap-1' }, 'Status', statusSel),
      el('label', { class: 'text-xs text-slate-500 flex items-center gap-1' }, 'Sound', soundSel)
    )
  );
  root.append(controls, count, results);

  let qTimer;
  const load = async () => {
    const q = qInput.value.trim();
    const order = orderSel.value;
    const status = statusSel.value;
    const sound = soundSel.value;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (order) params.set('order', order);
    if (status) params.set('status', status);
    if (sound) params.set('sound', sound);
    params.set('limit', '120');
    results.innerHTML = '<p class="text-slate-400 text-sm col-span-full">Loading…</p>';
    try {
      const { rows, total } = await api(`/birds?${params.toString()}`);
      count.textContent = `${total} bird${total === 1 ? '' : 's'} found`;
      results.innerHTML = '';
      if (!rows.length) {
        results.append(el('p', { class: 'text-slate-400 text-sm col-span-full' }, 'No birds match your filters.'));
        return;
      }
      rows.forEach((b) => results.append(birdCard(b)));
    } catch (e) {
      results.innerHTML = '';
      results.append(el('p', { class: 'text-red-600 text-sm col-span-full' }, e.message));
    }
  };

  qInput.addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(load, 250); });
  orderSel.addEventListener('change', load);
  statusSel.addEventListener('change', load);

  // Populate order dropdown from taxonomy
  api('/birds/taxonomy').then(({ taxonomy }) => {
    const orders = [...new Set(taxonomy.map((t) => t.order_name).filter(Boolean))].sort();
    orderSel.append(el('option', { value: '' }, 'All orders'));
    orders.forEach((o) => orderSel.append(el('option', { value: o }, o)));
    load();
  }).catch(() => load());

  return root;
}

// ---------- BIRD DETAIL ----------
export async function birdDetailView(id) {
  const root = el('div', { class: 'space-y-4' });
  root.append(el('p', { class: 'text-slate-400 text-sm' }, 'Loading…'));
  try {
    const b = await api(`/birds/${id}`);
    root.innerHTML = '';

    const header = el('div', { class: 'bg-white rounded-xl shadow-sm p-6 flex flex-wrap items-start gap-4 justify-between' },
      el('div', {},
        el('h1', { class: 'text-2xl font-bold text-slate-800' }, b.common_name),
        el('p', { class: 'italic text-slate-500' }, b.scientific_name),
        el('div', { class: 'mt-2 flex gap-2 flex-wrap' },
          statusBadge(b.conservation_status),
          b.order_name ? el('span', { class: 'text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded' }, b.order_name) : null,
          b.family ? el('span', { class: 'text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded' }, b.family) : null,
          soundBadge(b.sound_type),
          soundBandLabel(b.sound_band)
        )
      ),
      editControls(b)
    );
    root.append(header);

    // Hero image
    root.append(el('div', { class: 'bg-white rounded-xl shadow-sm overflow-hidden' },
      birdImage(b, { className: 'w-full h-64 md:h-80 object-cover', alt: b.common_name })
    ));

    const facts = el('div', { class: 'grid md:grid-cols-2 gap-4' });
    const detail = el('div', { class: 'bg-white rounded-xl shadow-sm p-6 space-y-3' });
    const addRow = (label, val) => {
      if (val == null || val === '') return;
      detail.append(el('div', {},
        el('dt', { class: 'text-xs font-semibold text-slate-400 uppercase tracking-wide' }, label),
        el('dd', { class: 'text-slate-700' }, val)
      ));
    };
    if (b.description) addRow('Overview', b.description);
    if (b.identification) addRow('Identification', b.identification);
    if (b.behavior) addRow('Behavior', b.behavior);
    if (b.diet) addRow('Diet', b.diet);
    if (b.habitat) addRow('Habitat', b.habitat);
    if (b.range) addRow('Range', b.range);
    if (b.sound_type || b.sound_band || b.sound_description) {
      const sound = [soundBadgeInline(b.sound_type), soundBandInline(b.sound_band)]
        .filter(Boolean).join(' ');
      const parts = [sound, b.sound_description].filter(Boolean);
      addRow('Sound', parts.join(' — '));
    }

    const side = el('div', { class: 'bg-white rounded-xl shadow-sm p-6 space-y-3' },
      el('h2', { class: 'font-semibold text-slate-700' }, 'At a glance'));
    const stat = (k, v) => el('div', { class: 'flex justify-between text-sm border-b border-slate-100 py-1' },
      el('span', { class: 'text-slate-500' }, k), el('span', { class: 'text-slate-700 font-medium' }, v));
    if (b.size_cm) side.append(stat('Length', `${b.size_cm} cm`));
    if (b.wingspan_cm) side.append(stat('Wingspan', `${b.wingspan_cm} cm`));
    if (b.class_name) side.append(stat('Class', b.class_name));
    if (b.conservation_status) side.append(stat('Status', b.conservation_status));
    if (Array.isArray(b.fun_facts) && b.fun_facts.length) {
      side.append(el('h3', { class: 'font-semibold text-slate-700 pt-2' }, 'Fun facts'));
      const ul = el('ul', { class: 'list-disc list-inside text-sm text-slate-600 space-y-1' });
      b.fun_facts.forEach((f) => ul.append(el('li', {}, f)));
      side.append(ul);
    }
    facts.append(detail, side);
    root.append(facts);
  } catch (e) {
    root.innerHTML = '';
    root.append(el('div', { class: 'bg-red-50 text-red-700 p-4 rounded-lg' }, e.message));
  }
  return root;
}

function editControls(b) {
  const u = currentUser();
  if (!u) return el('span', {});
  const wrap = el('div', { class: 'flex gap-2' });
  wrap.append(
    el('a', { href: `#/edit/bird/${b.id}`, class: 'text-sm bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700' }, 'Edit')
  );
  if (u.role === 'admin') {
    wrap.append(el('button', {
      class: 'text-sm bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700',
      onClick: async () => {
        if (!confirm(`Delete ${b.common_name}? This cannot be undone.`)) return;
        try {
          await api(`/birds/${b.id}`, { method: 'DELETE' });
          toast('Deleted');
          location.hash = '#/browse';
        } catch (e) { toast(e.message); }
      },
    }, 'Delete'));
  }
  return wrap;
}

// Plain-text variants for the detail "Sound" row (addRow renders text nodes).
function soundBadgeInline(type) {
  return SOUND_TYPES.includes(type) ? type : '';
}
function soundBandInline(band) {
  return SOUND_BANDS.includes(band) ? `pitch: ${band}` : '';
}

// ---------- LEARN ----------
export async function learnView() {
  const root = el('div', { class: 'space-y-6' });
  root.append(el('h1', { class: 'text-2xl font-bold text-slate-800' }, 'Learning tracks'));
  root.append(el('p', { class: 'text-slate-600 max-w-2xl' },
    'Guided articles covering everything you need to understand birds — from what makes a bird a bird, ' +
    'to identification, behavior, and conservation.'));
  try {
    const { topics, categories } = await api('/topics');
    const list = el('div', { class: 'space-y-6' });
    for (const cat of categories) {
      const group = el('div', {}, el('h2', { class: 'text-lg font-semibold text-emerald-700 mb-2' }, cat));
      const grid = el('div', { class: 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' });
      topics.filter((t) => t.category === cat).forEach((t) => {
        grid.append(el('a', { href: `#/topic/${t.slug}`, class: 'block bg-white rounded-xl shadow-sm hover:shadow-md p-4 border border-slate-100' },
          el('div', { class: 'flex items-center gap-2' },
            el('span', { class: 'text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded' }, t.level),
            el('span', { class: 'text-xs text-slate-400' }, cat)
          ),
          el('h3', { class: 'font-semibold text-slate-800 mt-2' }, t.title),
          el('p', { class: 'text-sm text-slate-600 mt-1' }, t.summary || '')
        ));
      });
      group.append(grid);
      list.append(group);
    }
    root.append(list);
  } catch (e) {
    root.append(el('p', { class: 'text-red-600' }, e.message));
  }
  return root;
}

export async function topicView(slug) {
  const root = el('div', { class: 'space-y-4 max-w-3xl' });
  root.append(el('p', { class: 'text-slate-400 text-sm' }, 'Loading…'));
  try {
    const t = await api(`/topics/${slug}`);
    const u = currentUser();
    root.innerHTML = '';
    root.append(
      el('a', { href: '#/learn', class: 'text-sm text-emerald-600 hover:underline' }, '← Back to learning'),
      el('div', { class: 'flex items-center gap-2' },
        el('span', { class: 'text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded' }, t.level),
        el('span', { class: 'text-xs text-slate-400' }, t.category)
      ),
      el('h1', { class: 'text-2xl font-bold text-slate-800' }, t.title),
      el('p', { class: 'text-slate-500' }, t.summary || ''),
      renderProse(t.content)
    );
    if (u) {
      root.append(el('a', { href: `#/edit/topic/${t.id}`, class: 'inline-block text-sm bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700' }, 'Edit this topic'));
    }
  } catch (e) {
    root.innerHTML = '';
    root.append(el('div', { class: 'bg-red-50 text-red-700 p-4 rounded-lg' }, e.message));
  }
  return root;
}

// ---------- AUTH (login/register) ----------
export function authView(mode) {
  const isLogin = mode === 'login';
  const root = el('div', { class: 'max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 space-y-4 mt-8' });
  root.append(el('h1', { class: 'text-xl font-bold text-slate-800' }, isLogin ? 'Sign in' : 'Create an account'));
  root.append(el('p', { class: 'text-sm text-slate-500' },
    isLogin ? 'Access your account to contribute.' : 'Join to add and edit bird entries and topics.'));

  const username = el('input', { class: 'w-full border border-slate-300 rounded-lg px-3 py-2', placeholder: 'Username', autocomplete: 'username' });
  const email = isLogin ? null : el('input', { class: 'w-full border border-slate-300 rounded-lg px-3 py-2', placeholder: 'Email', type: 'email' });
  const password = el('input', { class: 'w-full border border-slate-300 rounded-lg px-3 py-2', placeholder: 'Password', type: 'password', autocomplete: isLogin ? 'current-password' : 'new-password' });
  const msg = el('p', { class: 'text-sm text-red-600 min-h-[1rem]' });

  const submit = async () => {
    msg.textContent = '';
    try {
      const path = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { username: username.value.trim(), password: password.value }
        : { username: username.value.trim(), email: email.value.trim(), password: password.value };
      const { token, user } = await api(path, { method: 'POST', body });
      localStorage.setItem('birds_token', token);
      toast(`Welcome, ${user.username}!`);
      location.hash = '#/';
    } catch (e) {
      msg.textContent = e.message;
    }
  };

  root.append(username);
  if (email) root.append(email);
  root.append(password, msg);
  root.append(el('button', { class: 'w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-semibold', onClick: submit }, isLogin ? 'Sign in' : 'Register'));
  root.append(el('p', { class: 'text-sm text-center text-slate-500' },
    isLogin ? "No account? " : 'Already registered? ',
    el('a', { href: isLogin ? '#/register' : '#/login', class: 'text-emerald-600 hover:underline' }, isLogin ? 'Register' : 'Sign in')
  ));
  return root;
}

// ---------- EDITOR ----------
export async function editorView(kind, id) {
  const root = el('div', { class: 'max-w-2xl mx-auto space-y-4' });
  const isBird = kind === 'bird';
  const isNew = !id;
  root.append(el('h1', { class: 'text-xl font-bold text-slate-800' },
    `${isNew ? 'New' : 'Edit'} ${isBird ? 'bird' : 'topic'}`));

  const existing = !isNew ? (isBird ? await api(`/birds/${id}`) : await api(`/topics/${id}`)) : {};
  const form = el('form', { class: 'bg-white rounded-xl shadow-sm p-6 space-y-3' });

  const fields = isBird
    ? [
        ['common_name', 'Common name', 'text'],
        ['scientific_name', 'Scientific name', 'text'],
        ['order_name', 'Order', 'text'],
        ['family', 'Family', 'text'],
        ['conservation_status', 'Conservation status (LC/NT/VU/EN/CR/EX/DD)', 'text'],
        ['size_cm', 'Length (cm)', 'number'],
        ['wingspan_cm', 'Wingspan (cm)', 'number'],
        ['diet', 'Diet', 'text'],
        ['habitat', 'Habitat', 'text'],
        ['range', 'Range', 'text'],
        ['sound_type', 'Sound type (Song/Call/Alarm/Drum/Wingbeat/Silent)', 'text'],
        ['sound_band', 'Sound pitch band (Low/Mid/High/Very high)', 'text'],
        ['sound_description', 'Sound description', 'textarea'],
        ['identification', 'Identification', 'textarea'],
        ['behavior', 'Behavior', 'textarea'],
        ['description', 'Description', 'textarea'],
        ['fun_facts', 'Fun facts (one per line)', 'textarea'],
        ['image_url', 'Image URL', 'text'],
      ]
    : [
        ['slug', 'Slug (unique id, e.g. what-is-a-bird)', 'text'],
        ['title', 'Title', 'text'],
        ['category', 'Category', 'text'],
        ['level', 'Level (beginner/intermediate/advanced)', 'text'],
        ['summary', 'Summary', 'textarea'],
        ['content', 'Content (use • for bullet lines)', 'textarea'],
        ['order_index', 'Order index (number)', 'number'],
      ];

  const inputs = {};
  for (const [name, label, type] of fields) {
    const val = existing[name] != null ? (Array.isArray(existing[name]) ? existing[name].join('\n') : existing[name]) : '';
    const input = type === 'textarea'
      ? el('textarea', { class: 'w-full border border-slate-300 rounded-lg px-3 py-2 h-24' }, val)
      : el('input', { class: 'w-full border border-slate-300 rounded-lg px-3 py-2', type: type || 'text' });
    if (type !== 'textarea' && val !== '') input.value = val;
    inputs[name] = input;
    form.append(el('label', { class: 'block' },
      el('span', { class: 'text-xs font-semibold text-slate-500' }, label), input));
  }

  const err = el('p', { class: 'text-sm text-red-600 min-h-[1rem]' });
  form.append(err);
  form.append(el('button', { type: 'submit', class: 'bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-semibold' }, isNew ? 'Create' : 'Save changes'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const payload = {};
    for (const [name] of fields) {
      const v = inputs[name].value;
      if (name === 'fun_facts') {
        payload[name] = v.split('\n').map((s) => s.trim()).filter(Boolean);
      } else if (['size_cm', 'wingspan_cm', 'order_index'].includes(name)) {
        payload[name] = v === '' ? null : Number(v);
      } else {
        payload[name] = v;
      }
    }
    try {
      if (isNew) {
        const created = isBird ? await api('/birds', { method: 'POST', body: payload }) : await api('/topics', { method: 'POST', body: payload });
        toast('Created');
        location.hash = isBird ? `#/bird/${created.id}` : `#/topic/${created.slug}`;
      } else {
        const path = isBird ? `/birds/${id}` : `/topics/${id}`;
        const updated = isBird ? await api(path, { method: 'PUT', body: payload }) : await api(path, { method: 'PUT', body: payload });
        toast('Saved');
        location.hash = isBird ? `#/bird/${id}` : `#/topic/${updated.slug}`;
      }
    } catch (e2) {
      err.textContent = e2.message;
    }
  });

  root.append(form);
  return root;
}

// ---------- 3D ATLAS (the_new_age integration) ----------
// Embeds the offline "Birds of Africa" 3D atlas full-bleed inside the SPA shell.
// The atlas is an independent, air-gapped sub-app served at /atlas/; we never
// touch its code, so its offline/secure posture is preserved.
export function atlasView() {
  // Full-bleed: escape the centered SPA container, hide the footer, and let the
  // 3D canvas fill the remaining viewport height so orbit/zoom feels native.
  document.body.classList.add('atlas-active');
  const root = el('div', { class: 'atlas-fullbleed' });
  const frame = el('iframe', {
    src: '/atlas/',
    title: 'Birds of Africa — 3D Ornithology Atlas',
    class: 'w-full border-0 block',
    style: 'height: calc(100vh - 56px); min-height: 480px; background:#0b1020;',
    loading: 'lazy',
  });
  // Remove the full-bleed/footer-hidden state whenever we navigate away.
  frame.addEventListener('load', () => {});
  root.append(frame);
  // Cleanup on unload via a one-shot hashchange listener.
  const cleanup = () => {
    document.body.classList.remove('atlas-active');
    window.removeEventListener('hashchange', cleanup);
  };
  window.addEventListener('hashchange', cleanup);
  return root;
}

// ---------- 3D EAGLE MASCOT ----------
// Full-bleed interactive 3D bald eagle, served from /mascot/eagle.html.
// Reuses the vendored (offline) Three.js under /atlas/vendor, so it works
// with zero internet just like the atlas.
export function eagleView() {
  document.body.classList.add('atlas-active');
  const root = el('div', { class: 'atlas-fullbleed' });
  const frame = el('iframe', {
    src: '/mascot/eagle.html',
    title: 'Bald Eagle — Interactive 3D Mascot',
    class: 'w-full border-0 block',
    style: 'height: calc(100vh - 56px); min-height: 480px; background:#0b1020;',
    loading: 'lazy',
  });
  root.append(frame);
  const cleanup = () => {
    document.body.classList.remove('atlas-active');
    window.removeEventListener('hashchange', cleanup);
  };
  window.addEventListener('hashchange', cleanup);
  return root;
}

// ---------- ABOUT ----------
export function aboutView() {
  const root = el('div', { class: 'max-w-3xl space-y-4' });
  root.append(
    el('h1', { class: 'text-2xl font-bold text-slate-800' }, 'About this encyclopedia'),
    renderProse(
      'The Birds Encyclopedia is a full-stack learning application built to help anyone understand birds.\n' +
      'It covers what defines a bird, how they are classified, how to identify them in the field, ' +
      'their behavior and ecology, and the conservation challenges they face.\n' +
      'The project is open and editable: register an account to contribute new species and learning topics.\n' +
      'Admins can manage all content. All data here is for educational use — always confirm identifications ' +
      'with a regional field guide or a trusted birding community.\n' +
      'Tech: Node.js + Express + SQLite on the backend, a vanilla-JS single-page app on the frontend, ' +
      'with JWT authentication for contributors.'
    )
  );
  return root;
}
