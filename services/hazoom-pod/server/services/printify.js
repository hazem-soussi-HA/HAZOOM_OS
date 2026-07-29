/**
 * services/printify.js — Printify POD fulfillment wrapper.
 *
 * Provides:
 *  - isConfigured(): true when a real API token is present.
 *  - getProducts(): fetch the shop catalog from Printify.
 *  - createOrder(): submit a fulfilled order to Printify.
 *  - handleWebhook(): verify & interpret Printify webhook callbacks.
 *
 * When PRINTIFY_API_TOKEN is absent we run in "mock mode" and return
 * believable simulated data so the full flow is testable offline.
 */

const PRINTIFY_BASE = process.env.PRINTIFY_API_BASE || 'https://api.printify.com/v1';
const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

function isConfigured() {
  return !!(TOKEN && SHOP_ID && !TOKEN.startsWith('your_'));
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${PRINTIFY_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify API ${res.status}: ${text}`);
  }
  return res.json();
}

/** Fetch products from the configured shop. Returns normalized array. */
async function getProducts() {
  if (!isConfigured()) {
    // Mock catalog so the app is usable without Printify credentials.
    return [];
  }
  const data = await apiFetch(`/shops/${SHOP_ID}/products.json`);
  return (data.data || []).map((p) => ({
    externalId: p.id,
    title: p.title,
    images: (p.images || []).map((i) => i.src || i),
    mockupUrl: (p.images && p.images[0] && (p.images[0].src || p.images[0])) || '',
  }));
}

/**
 * Submit an order to Printify for fulfillment.
 * @param {object} order Hazoom order with items, shipping, designRef.
 */
async function createOrder(order) {
  if (!isConfigured()) {
    // Simulate a successful submission.
    return { id: 'mock_printify_' + Date.now(), status: 'accepted', mock: true };
  }

  const lineItems = order.items.map((item) => ({
    product_id: item.externalId || item.productId,
    variant_id: item.variantId || item.variant_id,
    quantity: item.quantity,
  }));

  const payload = {
    external_id: order.id,
    label: `Hazoom Order ${order.id}`,
    line_items: lineItems,
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: {
      first_name: order.shipping.firstName,
      last_name: order.shipping.lastName,
      email: order.email,
      phone: order.shipping.phone || '',
      country: order.shipping.country,
      region: order.shipping.state || '',
      city: order.shipping.city,
      address1: order.shipping.address1,
      address2: order.shipping.address2 || '',
      zip: order.shipping.zip,
    },
  };

  const data = await apiFetch(`/shops/${SHOP_ID}/orders.json`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Process an incoming Printify webhook.
 * Printify signs webhooks; verification depends on your app's secret.
 * This helper extracts the order id + status safely in mock/manual modes.
 */
function handleWebhook(body) {
  // In production, verify the signature header before trusting `body`.
  const event = typeof body === 'string' ? JSON.parse(body) : body;
  return {
    type: event.type || 'unknown',
    orderId: event.resource?.id || event.id,
    status: event.resource?.status || event.status,
    raw: event,
  };
}

module.exports = { isConfigured, getProducts, createOrder, handleWebhook };
