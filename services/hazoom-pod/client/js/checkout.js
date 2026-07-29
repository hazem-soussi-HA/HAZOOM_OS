/**
 * js/checkout.js — Checkout flow: address, payment, confirmation.
 *
 * 1. Collects shipping (and optional billing) address.
 * 2. Calls /api/payment/create-intent with the cart total (in cents).
 * 3. If Stripe is in OFFLINE mode (no real key), we simulate success so the
 *    demo works without an API key. Otherwise we mount Stripe.js and confirm.
 * 4. Calls /api/payment/confirm to persist the order + send confirmation.
 *
 * Stripe.js is loaded lazily only when a real publishable key is present.
 */

const SHIPPING_FEE = 500; // $5.00 — must match server

function money(cents) { return '$' + (cents / 100).toFixed(2); }

async function renderCheckout(app) {
  if (!window.cart.items.length) {
    app.innerHTML = `<div class="max-w-md mx-auto px-4 py-20 text-center text-slate-500">Your cart is empty. <a href="/" data-link class="text-brand-600">Shop →</a></div>`;
    return;
  }

  const subtotal = window.cart.subtotal();
  const total = subtotal + SHIPPING_FEE;

  app.innerHTML = `
    <section class="max-w-4xl mx-auto px-4 py-8 fade-in grid md:grid-cols-5 gap-6">
      <form id="checkoutForm" class="md:col-span-3 card rounded-xl p-5 space-y-3">
        <h1 class="text-xl font-bold mb-2">Shipping details</h1>
        <div class="grid grid-cols-2 gap-3">
          <input name="firstName" required class="field" placeholder="First name" />
          <input name="lastName" required class="field" placeholder="Last name" />
        </div>
        <input name="email" type="email" required class="field" placeholder="Email (for confirmation)" />
        <input name="phone" class="field" placeholder="Phone (optional)" />
        <input name="address1" required class="field" placeholder="Address line 1" />
        <input name="address2" class="field" placeholder="Address line 2 (optional)" />
        <div class="grid grid-cols-2 gap-3">
          <input name="city" required class="field" placeholder="City" />
          <input name="state" class="field" placeholder="State / Region" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <input name="zip" required class="field" placeholder="ZIP / Postal" />
          <input name="country" required class="field" placeholder="Country" value="US" />
        </div>
        <label class="flex items-center gap-2 text-sm mt-2">
          <input type="checkbox" id="sameBilling" checked /> Billing same as shipping
        </label>
        <button id="payBtn" type="submit" class="btn-primary w-full py-3 rounded-lg font-semibold mt-3">Pay ${money(total)}</button>
        <p id="payNote" class="text-xs text-center text-slate-400"></p>
      </form>

      <aside class="md:col-span-2 card rounded-xl p-5 h-fit">
        <h2 class="font-bold mb-3">Summary</h2>
        <div class="space-y-2 text-sm">
          ${window.cart.items.map((i) => `<div class="flex justify-between"><span>${i.title} ×${i.quantity}</span><span>${money(i.price*i.quantity)}</span></div>`).join('')}
          <div class="flex justify-between border-t pt-2"><span>Subtotal</span><span>${money(subtotal)}</span></div>
          <div class="flex justify-between"><span>Shipping</span><span>${money(SHIPPING_FEE)}</span></div>
          <div class="flex justify-between font-bold border-t pt-2"><span>Total</span><span>${money(total)}</span></div>
        </div>
      </aside>
    </section>`;

  const note = app.querySelector('#payNote');
  const payBtn = app.querySelector('#payBtn');

  // Fetch public config to know if Stripe is live or offline.
  let config = {};
  try { config = await window.api.get('/api/config'); } catch { /* ignore */ }
  if (config.stripeOffline) {
    note.textContent = 'Demo mode: no real payment is processed (Stripe key not set).';
  }

  app.querySelector('#checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const shipping = {
      firstName: f.firstName.value, lastName: f.lastName.value, email: f.email.value,
      phone: f.phone.value, address1: f.address1.value, address2: f.address2.value,
      city: f.city.value, state: f.state.value, zip: f.zip.value, country: f.country.value,
    };
    const billing = app.querySelector('#sameBilling').checked ? null : shipping;
    const items = window.cart.items.map((i) => ({
      productId: i.productId, title: i.title, price: i.price, quantity: i.quantity, color: i.color, design: i.design,
    }));

    payBtn.disabled = true;
    payBtn.textContent = 'Processing…';
    try {
      // Step 1: create payment intent (or offline placeholder).
      const intentRes = await window.api.post('/api/payment/create-intent', { amount: total });

      let paymentIntentId = 'offline';
      if (!intentRes.offline && config.stripePublishableKey) {
        // Real Stripe flow: load Stripe.js and confirm the card payment.
        paymentIntentId = await confirmWithStripe(
          config.stripePublishableKey, intentRes.clientSecret
        );
      }

      // Step 2: finalize order on the server.
      const { order } = await window.api.post('/api/payment/confirm', {
        items, shipping, billing, paymentIntentId,
      });

      window.cart.clear();
      window.hazoomToast('Order placed! Check your email.');
      location.hash = '/order/' + order.id;
    } catch (err) {
      window.hazoomToast(err.message, true);
      payBtn.disabled = false;
      payBtn.textContent = 'Pay ' + money(total);
    }
  });
}

/**
 * Confirm a Stripe PaymentIntent in the browser with Stripe.js.
 * Returns the resulting paymentIntent id on success; throws otherwise.
 */
async function confirmWithStripe(publishableKey, clientSecret) {
  if (!window.Stripe) {
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }
  const stripe = window.Stripe(publishableKey);
  // For a full card UI you'd mount Elements; here we use the redirect flow
  // for brevity. Replace with Stripe Elements for inline card capture.
  const { error, paymentIntent } = await stripe.confirmPayment({
    clientSecret,
    confirmParams: { return_url: location.origin + '/orders' },
  });
  if (error) throw new Error(error.message);
  return paymentIntent.id;
}

/**
 * Order confirmation view (after successful checkout).
 */
async function renderOrder(app, id) {
  app.innerHTML = `<div class="flex justify-center py-20"><div class="spinner"></div></div>`;
  try {
    const { order } = await window.api.get(`/api/orders/${id}`);
    const isMine = !order.userId || (window.auth.state.user && order.userId === window.auth.state.user.id) || window.auth.isAdmin();
    if (!isMine) throw new Error('Order not found');

    app.innerHTML = `
      <section class="max-w-2xl mx-auto px-4 py-10 fade-in text-center">
        <div class="text-5xl mb-4">✅</div>
        <h1 class="text-2xl font-bold">Order confirmed</h1>
        <p class="text-slate-500 mt-1">Order <code>${order.id}</code></p>
        <div class="card rounded-xl p-5 mt-6 text-left">
          <div class="flex justify-between border-b pb-2"><span>Status</span><span class="font-semibold capitalize">${order.status}</span></div>
          <div class="flex justify-between border-b pb-2 mt-2"><span>Total</span><span class="font-semibold">${money(order.total)}</span></div>
          <div class="mt-3 space-y-1 text-sm">
            ${order.items.map((i) => `<div class="flex justify-between"><span>${i.title} ×${i.quantity}</span><span>${money(i.price*i.quantity)}</span></div>`).join('')}
          </div>
        </div>
        <a href="/orders" data-link class="btn-primary inline-block mt-6 px-6 py-3 rounded-lg font-semibold">View my orders</a>
      </section>`;
  } catch (err) {
    app.innerHTML = `<p class="text-center text-red-500 py-20">${err.message}</p>`;
  }
}

/**
 * My orders list.
 */
async function renderOrders(app) {
  if (!window.auth.isLoggedIn()) {
    app.innerHTML = `<div class="max-w-md mx-auto px-4 py-20 text-center text-slate-500">Please <a href="/login" data-link class="text-brand-600">log in</a> to view orders.</div>`;
    return;
  }
  app.innerHTML = `<div class="flex justify-center py-20"><div class="spinner"></div></div>`;
  try {
    const { orders } = await window.api.get('/api/orders');
    if (!orders.length) {
      app.innerHTML = `<div class="max-w-md mx-auto px-4 py-20 text-center text-slate-500">No orders yet. <a href="/" data-link class="text-brand-600">Start shopping →</a></div>`;
      return;
    }
    app.innerHTML = `
      <section class="max-w-3xl mx-auto px-4 py-8 fade-in">
        <h1 class="text-2xl font-bold mb-6">My orders</h1>
        <div class="space-y-3">
          ${orders.map((o) => `
            <div class="card rounded-xl p-4 flex items-center justify-between">
              <div>
                <p class="font-semibold">${o.items.map((i)=>i.title).join(', ').slice(0,60)}</p>
                <p class="text-xs text-slate-500">${new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div class="text-right">
                <p class="font-bold">${money(o.total)}</p>
                <span class="text-xs uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">${o.status}</span>
              </div>
            </div>`).join('')}
        </div>
      </section>`;
  } catch (err) {
    app.innerHTML = `<p class="text-center text-red-500 py-20">${err.message}</p>`;
  }
}

window.checkoutView = { renderCheckout, renderOrder, renderOrders };
