/**
 * services/stripe.js — Stripe payment service wrapper.
 *
 * Wraps the Stripe SDK with Hazoom-specific helpers:
 *  - createPaymentIntent: starts a payment for an order amount.
 *  - constructWebhookEvent: verifies & parses incoming webhook signatures.
 *
 * If STRIPE_SECRET_KEY is not configured we degrade to a safe "offline"
 * mode so the rest of the app can still boot and be tested locally.
 */

const Stripe = require('stripe');

const key = process.env.STRIPE_SECRET_KEY;
const enabled = !!(key && key.startsWith('sk_'));

const stripe = enabled ? new Stripe(key) : null;

if (!enabled) {
  console.warn('[stripe] STRIPE_SECRET_KEY not set — running in OFFLINE mode (no real charges).');
}

async function createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
  if (!stripe) {
    // Offline mode: return a fake client secret so the flow can be demoed.
    return { id: 'pi_offline_' + Date.now(), client_secret: 'offline_secret', offline: true };
  }
  const intent = await stripe.paymentIntents.create({
    amount,            // MUST be in cents
    currency,
    automatic_payment_methods: { enabled: true },
    metadata,
  });
  return intent;
}

function constructWebhookEvent(rawBody, signature) {
  if (!stripe) throw new Error('Stripe is not configured');
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

async function retrievePaymentIntent(id) {
  if (!stripe) return { id, status: 'succeeded', offline: true };
  return stripe.paymentIntents.retrieve(id);
}

module.exports = { stripe, enabled, createPaymentIntent, constructWebhookEvent, retrievePaymentIntent };
