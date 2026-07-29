/**
 * routes/payment.js — Stripe checkout & webhooks.
 *
 * POST /api/payment/create-intent  (auth optional) -> { clientSecret, amount }
 * POST /api/payment/webhook         -> Stripe webhook (raw body required)
 * POST /api/payment/confirm         -> finalize order after client confirms
 *
 * Flow:
 *   1. Client builds cart, calls create-intent with amount (cents).
 *   2. Client confirms payment in browser with Stripe.js.
 *   3. Client posts cart + paymentIntentId to /confirm -> we create the
 *      Order, mark it paid, send confirmation email, return order.
 */

const express = require('express');
const router = express.Router();
const stripeSvc = require('../services/stripe');
const Order = require('../models/Order');
const email = require('../services/email');
const { optionalAuth } = require('../middleware/auth');

// Stripe webhook needs the RAW body to verify the signature, so this
// route mounts express.raw() (see server.js) at /api/payment/webhook.
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount (cents) is required' });
    }
    const intent = await stripeSvc.createPaymentIntent({ amount: Math.round(amount), currency });
    res.json({
      clientSecret: intent.client_secret,
      amount,
      offline: !!intent.offline,
    });
  } catch (err) {
    console.error('[payment:intent]', err);
    res.status(500).json({ error: 'Could not create payment intent' });
  }
});

// Finalize: create the order record once the client finished the Stripe flow.
router.post('/confirm', optionalAuth, async (req, res) => {
  try {
    const { items, shipping, billing, paymentIntentId } = req.body || {};
    if (!items || !items.length || !shipping) {
      return res.status(400).json({ error: 'items and shipping are required' });
    }
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingFee = 500; // $5 flat; could be dynamic
    const total = subtotal + shippingFee;

    const order = await Order.create({
      userId: req.user ? req.user.id : null,
      email: shipping.email,
      items,
      shipping,
      billing: billing || null,
      subtotal,
      shippingFee,
      total,
      status: 'paid',
      designRef: items.map((i) => i.design || null),
    });

    if (paymentIntentId && !stripeSvc.enabled) {
      await Order.updateStatus(order.id, 'paid', { stripeId: paymentIntentId });
    }

    // Fire-and-forget confirmation email (don't block the response).
    email.sendOrderConfirmation(order).catch((e) => console.error('[email]', e));

    res.status(201).json({ order });
  } catch (err) {
    console.error('[payment:confirm]', err);
    res.status(500).json({ error: 'Could not finalize order' });
  }
});

// Stripe webhook — mounted with raw body parser in server.js.
router.post('/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripeSvc.constructWebhookEvent(req.rawBody, sig);
    } catch (err) {
      console.error('[payment:webhook] signature failed', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      // If we tracked an order id in metadata we could mark it paid here.
      console.log('[payment:webhook] payment succeeded', intent.id);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[payment:webhook]', err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

module.exports = router;
