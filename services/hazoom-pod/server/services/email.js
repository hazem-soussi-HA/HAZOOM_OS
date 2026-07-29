/**
 * services/email.js — Transactional email (order confirmations) via Nodemailer.
 *
 * If SMTP credentials are missing we log the message instead of failing —
 * so local development never blocks an order from completing.
 */

const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  console.warn('[email] SMTP not configured — emails will be logged, not sent.');
}

function formatCents(cents) {
  return '$' + (cents / 100).toFixed(2);
}

async function sendOrderConfirmation(order) {
  const itemsText = (order.items || [])
    .map((i) => `  - ${i.title} x${i.quantity}  ${formatCents(i.price * i.quantity)}`)
    .join('\n');
  const html = `
    <h2>Thanks for your order, ${order.shipping?.firstName || 'friend'}!</h2>
    <p>Your Hazoom order <strong>${order.id}</strong> is confirmed.</p>
    <pre>${itemsText}</pre>
    <p><strong>Total:</strong> ${formatCents(order.total)}</p>
    <p>We'll email you again when it ships.</p>
  `;

  if (!transporter) {
    console.log(`[email:mock] Order confirmation for ${order.email}\n${itemsText}`);
    return { sent: false, mock: true };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Hazoom <no-reply@hazoom.example>',
    to: order.email,
    subject: `Hazoom Order Confirmation — ${order.id}`,
    html,
  });
  return { sent: true };
}

module.exports = { sendOrderConfirmation, formatCents };
