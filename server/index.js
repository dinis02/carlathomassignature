const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

const db = require('./database');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:4200', 'http://127.0.0.1:4200'] }));
app.use(express.json({ limit: '1mb' }));

function hashPassword(password) {
  return require('crypto').createHash('sha256').update(String(password)).digest('hex');
}

function publicAccount(account) {
  return {
    id: account.id,
    role: account.role,
    name: account.name,
    email: account.email,
    username: account.username
  };
}

function mapProduct(row) {
  const shades = db.prepare('SELECT name, color FROM product_shades WHERE product_id = ?').all(row.id);
  const finishes = db.prepare('SELECT name FROM product_finishes WHERE product_id = ?').all(row.id).map(f => f.name);
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price,
    badge: row.badge,
    badgeDark: !!row.badge_dark,
    gradientFrom: row.gradient_from,
    gradientTo: row.gradient_to,
    rating: row.rating,
    reviewCount: row.review_count,
    category: row.category,
    description: row.description,
    howToApply: row.how_to_apply,
    ingredients: row.ingredients,
    image: row.image,
    stock: row.stock,
    shades,
    finishes
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: 'data/carla-thomas.sqlite' });
});

app.get('/api/products', (_req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY id').all();
  res.json(rows.map(mapProduct));
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Produto nao encontrado' });
  res.json(mapProduct(row));
});

app.post('/api/auth/login', (req, res) => {
  const login = String(req.body.login || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!login || !password) return res.status(400).json({ error: 'Login e senha sao obrigatorios' });

  const account = db.prepare(`
    SELECT * FROM user_accounts
    WHERE lower(email) = ? OR lower(username) = ?
  `).get(login, login);

  if (!account || account.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  res.json(publicAccount(account));
});

app.post('/api/auth/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || password.length < 6) {
    return res.status(400).json({ error: 'Nome, email e senha com pelo menos 6 caracteres sao obrigatorios' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO user_accounts (role, name, email, username, password_hash)
      VALUES ('user', ?, ?, NULL, ?)
    `).run(name, email, hashPassword(password));

    const account = db.prepare('SELECT * FROM user_accounts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(publicAccount(account));
  } catch {
    res.status(409).json({ error: 'Este email ja existe' });
  }
});

app.get('/api/orders', (_req, res) => {
  const orders = db.prepare(`
    SELECT o.*, c.first_name, c.last_name, c.email, c.phone
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { customer, items, subtotal, discount, shipping, total, shippingMethod, paymentMethod, rewardPoints } = req.body;

  if (!customer?.firstName || !customer?.lastName || !customer?.email) {
    return res.status(400).json({ error: 'Dados do cliente em falta' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'A encomenda nao tem artigos' });
  }

  const orderId = `CTS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
  const insertCustomer = db.prepare(`
    INSERT INTO customers (first_name, last_name, email, phone, address, postcode, city, country)
    VALUES (@firstName, @lastName, @email, @phone, @address, @postcode, @city, @country)
  `);
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, subtotal, discount, shipping, total, shipping_method, payment_method, reward_points)
    VALUES (@id, @customerId, @subtotal, @discount, @shipping, @total, @shippingMethod, @paymentMethod, @rewardPoints)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (
      order_id, product_id, product_name, product_brand, unit_price, quantity, selected_shade, selected_finish
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const customerInfo = insertCustomer.run({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
      postcode: customer.postcode ?? null,
      city: customer.city ?? null,
      country: customer.country ?? 'Portugal'
    });

    insertOrder.run({
      id: orderId,
      customerId: customerInfo.lastInsertRowid,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      shipping: Number(shipping) || 0,
      total: Number(total) || 0,
      shippingMethod: shippingMethod || 'standard',
      paymentMethod: paymentMethod || 'card',
      rewardPoints: Number(rewardPoints) || 0
    });

    for (const item of items) {
      insertItem.run(
        orderId,
        item.product.id,
        item.product.name,
        item.product.brand,
        item.product.price,
        item.quantity,
        item.selectedShade ?? null,
        item.selectedFinish ?? null
      );
    }
  });

  tx();
  res.status(201).json({ id: orderId });
});

app.post('/api/newsletter', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email em falta' });
  db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(email);
  res.status(201).json({ ok: true });
});

app.listen(port, () => {
  console.log(`API Carla Thomas pronta em http://localhost:${port}`);
});
