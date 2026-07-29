/**
 * js/cart.js — Shopping cart with localStorage persistence.
 *
 * The cart is the source of truth in the browser (localStorage). When a
 * logged-in user checks out, the items are sent to the backend (see
 * checkout.js), which creates the order and submits to Printify.
 *
 * Each item: { id, productId, title, price (cents), quantity, color, image, design }
 */

const CART_KEY = 'hazoom_cart';

const cart = {
  items: [],

  init() {
    try {
      this.items = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch { this.items = []; }
    this.renderCount();
  },

  save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    this.renderCount();
  },

  add(item) {
    // Match by product + color + design signature so variants stack.
    const sig = JSON.stringify(item.design || null);
    const existing = this.items.find(
      (i) => i.productId === item.productId && i.color === item.color &&
             JSON.stringify(i.design || null) === sig
    );
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      this.items.push({ ...item, quantity: item.quantity || 1 });
    }
    this.save();
    window.hazoomToast('Added to cart');
  },

  remove(index) {
    this.items.splice(index, 1);
    this.save();
  },

  setQty(index, qty) {
    if (qty <= 0) return this.remove(index);
    this.items[index].quantity = qty;
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  count() {
    return this.items.reduce((s, i) => s + i.quantity, 0);
  },

  subtotal() {
    return this.items.reduce((s, i) => s + i.price * i.quantity, 0);
  },

  renderCount() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = String(this.count());
  },

  /** Sync cart to backend for a logged-in user (best-effort). */
  async sync() {
    if (!window.auth.isLoggedIn()) return;
    // The backend derives order items from the checkout payload; we keep
    // this hook for future server-side cart persistence.
    try {
      // No dedicated cart endpoint required for this build; items ride
      // along in the checkout request. Hook left for extensibility.
    } catch (e) { /* non-fatal */ }
  },
};

window.cart = cart;
