/**
 * server/seed.js — Idempotent bootstrap data.
 *
 * Creates an admin account (if it doesn't exist) and a handful of demo
 * products so the storefront is populated on a fresh database.
 * Safe to run repeatedly; it only inserts what is missing.
 */

const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

async function run() {
  // --- Admin account ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@hazoom.example';
  const existingAdmin = await User.findByEmail(adminEmail);
  if (!existingAdmin) {
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin123!', 12);
    await User.create({ email: adminEmail, passwordHash: hash, name: 'Hazoom Admin', role: 'admin' });
    console.log(`[seed] Created admin: ${adminEmail} (password from SEED_ADMIN_PASSWORD)`);
  }

  // --- Demo products (only if catalog is empty) ---
  const current = await Product.list();
  if (current.length === 0) {
    const demo = [
      {
        title: 'Classic Cotton T-Shirt', category: 'tshirt', basePrice: 1999,
        description: 'Soft 100% combed cotton tee. Customize with your design.',
        colors: ['#ffffff', '#000000', '#1e3a8a', '#dc2626'],
        images: ['https://placehold.co/600x600/1e293b/ffffff?text=T-Shirt'],
        mockupUrl: 'https://placehold.co/600x600/1e293b/ffffff?text=T-Shirt', stock: 999,
      },
      {
        title: 'Ceramic Coffee Mug', category: 'mug', basePrice: 1499,
        description: '11oz ceramic mug, dishwasher & microwave safe.',
        colors: ['#ffffff', '#000000'],
        images: ['https://placehold.co/600x600/7c3aed/ffffff?text=Mug'],
        mockupUrl: 'https://placehold.co/600x600/7c3aed/ffffff?text=Mug', stock: 999,
      },
      {
        title: 'Pullover Hoodie', category: 'hoodie', basePrice: 3499,
        description: 'Warm fleece-lined hoodie with kangaroo pocket.',
        colors: ['#000000', '#1e3a8a', '#6b7280'],
        images: ['https://placehold.co/600x600/0f766e/ffffff?text=Hoodie'],
        mockupUrl: 'https://placehold.co/600x600/0f766e/ffffff?text=Hoodie', stock: 999,
      },
      {
        title: 'Matte Phone Case', category: 'phonecase', basePrice: 1799,
        description: 'Slim snap-on case for most modern phones.',
        colors: ['#000000', '#ffffff', '#dc2626'],
        images: ['https://placehold.co/600x600/db2777/ffffff?text=Phone+Case'],
        mockupUrl: 'https://placehold.co/600x600/db2777/ffffff?text=Phone+Case', stock: 999,
      },
    ];
    for (const p of demo) await Product.create(p);
    console.log(`[seed] Inserted ${demo.length} demo products.`);
  }
}

module.exports = { run };
