require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');
const multer = require('multer');
const { supabase, bucket: supabaseBucket, isEnabled: supabaseEnabled } = require('./supabase');

fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
fs.mkdirSync(path.join(__dirname, '..', 'src', 'assets', 'produtos'), { recursive: true });

const db = require('./database');
const app = express();
const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const uploadProductImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('O ficheiro tem de ser uma imagem'));
    cb(null, true);
  }
});

const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  clientUrl,
  'https://carlathomassignature.pt',
  'https://www.carlathomassignature.pt'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem nao autorizada pelo CORS'));
  }
}));

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook nao configurado' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook invalido: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      db.prepare(`
        UPDATE orders
        SET status = 'processando',
            payment_status = 'paid',
            stripe_session_id = ?,
            stripe_payment_intent_id = ?
        WHERE id = ?
      `).run(session.id, session.payment_intent || null, orderId);
    }
  }

  res.json({ received: true });
});

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

function publicSupabaseAccount(account) {
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

function mapSupabaseProduct(row) {
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
    shades: (row.product_shades || []).map(shade => ({ name: shade.name, color: shade.color })),
    finishes: (row.product_finishes || []).map(finish => finish.name)
  };
}

function productFileName(file) {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const base = path.basename(file.originalname, ext).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'produto';
  return `${Date.now()}-${base}${ext}`;
}

async function uploadProductImageToSupabase(file) {
  if (!file || !supabaseEnabled()) return null;
  const filename = productFileName(file);
  const storagePath = `products/${filename}`;
  const { error } = await supabase.storage
    .from(supabaseBucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
  if (error) throw error;
  const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

function saveProductImageLocally(file) {
  if (!file) return null;
  const filename = productFileName(file);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'assets', 'produtos', filename), file.buffer);
  return `assets/produtos/${filename}`;
}

function validateOrderPayload(payload) {
  if (!payload.customer?.firstName || !payload.customer?.lastName || !payload.customer?.email) {
    return 'Dados do cliente em falta';
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return 'A encomenda nao tem artigos';
  }
  return null;
}

function createOrder(payload, options = {}) {
  const { customer, items, subtotal, discount, shipping, total, shippingMethod, paymentMethod, rewardPoints } = payload;
  const orderId = `CTS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
  const status = options.status || 'processando';
  const paymentStatus = options.paymentStatus || 'unpaid';

  const insertCustomer = db.prepare(`
    INSERT INTO customers (first_name, last_name, email, phone, address, postcode, city, country)
    VALUES (@firstName, @lastName, @email, @phone, @address, @postcode, @city, @country)
  `);
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, customer_id, subtotal, discount, shipping, total, shipping_method,
      payment_method, reward_points, status, payment_status
    )
    VALUES (
      @id, @customerId, @subtotal, @discount, @shipping, @total, @shippingMethod,
      @paymentMethod, @rewardPoints, @status, @paymentStatus
    )
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
      paymentMethod: paymentMethod || 'stripe',
      rewardPoints: Number(rewardPoints) || 0,
      status,
      paymentStatus
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
  return orderId;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: supabaseEnabled() ? 'supabase' : 'data/carla-thomas.sqlite',
    supabase: supabaseEnabled()
  });
});

app.get('/api/products', async (_req, res) => {
  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_shades(name,color), product_finishes(name)')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (!error) return res.json(data.map(mapSupabaseProduct));
    console.warn('Supabase products fallback:', error.message);
  }

  const rows = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY id').all();
  res.json(rows.map(mapProduct));
});

app.get('/api/products/:id', async (req, res) => {
  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_shades(name,color), product_finishes(name)')
      .eq('id', Number(req.params.id))
      .eq('is_active', true)
      .single();

    if (!error && data) return res.json(mapSupabaseProduct(data));
    console.warn('Supabase product fallback:', error?.message);
  }

  const row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Produto nao encontrado' });
  res.json(mapProduct(row));
});

app.post('/api/products', uploadProductImage.single('image'), async (req, res) => {
  const name = String(req.body.name || '').trim();
  const brand = String(req.body.brand || '').trim();
  const category = String(req.body.category || '').trim();
  const price = Number(req.body.price);

  if (!name || !brand || !category || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Nome, marca, categoria e preco valido sao obrigatorios' });
  }

  const gradientFrom = String(req.body.gradientFrom || '#E8D0C0');
  const gradientTo = String(req.body.gradientTo || '#C9956A');
  const originalPrice = req.body.originalPrice ? Number(req.body.originalPrice) : null;
  const badge = String(req.body.badge || '').trim() || null;
  const stock = Number.isFinite(Number(req.body.stock)) ? Number(req.body.stock) : 0;
  const shades = String(req.body.shades || '').split(',').map(s => s.trim()).filter(Boolean);
  const finishes = String(req.body.finishes || '').split(',').map(s => s.trim()).filter(Boolean);

  if (supabaseEnabled()) {
    try {
      const image = await uploadProductImageToSupabase(req.file);
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          brand,
          name,
          price,
          original_price: originalPrice,
          badge,
          badge_dark: req.body.badgeDark === 'true',
          gradient_from: gradientFrom,
          gradient_to: gradientTo,
          rating: Number(req.body.rating) || 0,
          review_count: Number(req.body.reviewCount) || 0,
          category,
          description: String(req.body.description || '').trim() || null,
          how_to_apply: String(req.body.howToApply || '').trim() || null,
          ingredients: String(req.body.ingredients || '').trim() || null,
          image,
          stock,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (shades.length) {
        const shadeRows = shades.map((shade, index) => ({
          product_id: product.id,
          name: shade,
          color: ['#C9956A', '#D4806A', '#8B3A5A', '#B02A2A'][index % 4]
        }));
        const { error: shadesError } = await supabase.from('product_shades').insert(shadeRows);
        if (shadesError) throw shadesError;
      }

      if (finishes.length) {
        const finishRows = finishes.map(finish => ({ product_id: product.id, name: finish }));
        const { error: finishesError } = await supabase.from('product_finishes').insert(finishRows);
        if (finishesError) throw finishesError;
      }

      const { data: fullProduct, error: fullError } = await supabase
        .from('products')
        .select('*, product_shades(name,color), product_finishes(name)')
        .eq('id', product.id)
        .single();
      if (fullError) throw fullError;
      return res.status(201).json(mapSupabaseProduct(fullProduct));
    } catch (err) {
      console.warn('Supabase create product fallback:', err.message);
    }
  }

  const image = saveProductImageLocally(req.file);
  const maxId = db.prepare('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM products').get().nextId;

  db.prepare(`
    INSERT INTO products (
      id, brand, name, price, original_price, badge, badge_dark, gradient_from,
      gradient_to, rating, review_count, category, description, how_to_apply,
      ingredients, image, stock, is_active
    ) VALUES (
      @id, @brand, @name, @price, @originalPrice, @badge, @badgeDark, @gradientFrom,
      @gradientTo, @rating, @reviewCount, @category, @description, @howToApply,
      @ingredients, @image, @stock, 1
    )
  `).run({
    id: maxId,
    brand,
    name,
    price,
    originalPrice,
    badge,
    badgeDark: req.body.badgeDark === 'true' ? 1 : 0,
    gradientFrom,
    gradientTo,
    rating: Number(req.body.rating) || 0,
    reviewCount: Number(req.body.reviewCount) || 0,
    category,
    description: String(req.body.description || '').trim() || null,
    howToApply: String(req.body.howToApply || '').trim() || null,
    ingredients: String(req.body.ingredients || '').trim() || null,
    image,
    stock
  });

  const insertShade = db.prepare('INSERT INTO product_shades (product_id, name, color) VALUES (?, ?, ?)');
  const insertFinish = db.prepare('INSERT INTO product_finishes (product_id, name) VALUES (?, ?)');
  shades.forEach((shade, index) => insertShade.run(maxId, shade, ['#C9956A', '#D4806A', '#8B3A5A', '#B02A2A'][index % 4]));
  finishes.forEach(finish => insertFinish.run(maxId, finish));

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(maxId);
  res.status(201).json(mapProduct(row));
});

app.post('/api/auth/login', async (req, res) => {
  const login = String(req.body.login || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!login || !password) return res.status(400).json({ error: 'Login e senha sao obrigatorios' });

  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .or(`email.eq.${login},username.eq.${login}`)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: 'A tabela de utilizadores ainda nao esta configurada no Supabase' });
    }

    if (!data || data.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Credenciais invalidas' });
    }

    return res.json(publicSupabaseAccount(data));
  }

  const account = db.prepare(`
    SELECT * FROM user_accounts
    WHERE lower(email) = ? OR lower(username) = ?
  `).get(login, login);

  if (!account || account.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  res.json(publicAccount(account));
});

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || password.length < 6) {
    return res.status(400).json({ error: 'Nome, email e senha com pelo menos 6 caracteres sao obrigatorios' });
  }

  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('user_accounts')
      .insert({
        role: 'user',
        name,
        email,
        username: null,
        password_hash: hashPassword(password)
      })
      .select()
      .single();

    if (!error && data) return res.status(201).json(publicSupabaseAccount(data));

    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Este email ja existe' });
    }

    return res.status(500).json({ error: 'Nao foi possivel criar a conta no Supabase' });
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
  const error = validateOrderPayload(req.body);
  if (error) return res.status(400).json({ error });

  const orderId = createOrder(req.body);
  res.status(201).json({ id: orderId });
});

app.post('/api/payments/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: 'Stripe ainda nao esta configurado. Adicione STRIPE_SECRET_KEY no ficheiro .env.'
    });
  }

  const error = validateOrderPayload(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const payload = {
      ...req.body,
      paymentMethod: 'stripe'
    };
    const total = Number(payload.total) || 0;
    if (total <= 0) {
      return res.status(400).json({ error: 'O total da encomenda tem de ser superior a 0.' });
    }

    const orderId = createOrder(payload, {
      status: 'pending_payment',
      paymentStatus: 'unpaid'
    });

    const lineItems = payload.items.map(item => ({
      quantity: Number(item.quantity) || 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(item.product.price) * 100),
        product_data: {
          name: item.product.name,
          description: item.product.brand
        }
      }
    }));

    if (Number(payload.shipping) > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(Number(payload.shipping) * 100),
          product_data: {
            name: 'Envio'
          }
        }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: payload.customer.email,
      line_items: lineItems,
      success_url: `${clientUrl}/confirmacao?order=${orderId}&total=${total}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/checkout?payment=cancelled&order=${orderId}`,
      metadata: {
        orderId
      }
    });

    db.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?').run(session.id, orderId);
    res.status(201).json({ id: orderId, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Nao foi possivel criar pagamento Stripe' });
  }
});

app.get('/api/payments/session-status', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: 'Stripe ainda nao esta configurado. Adicione STRIPE_SECRET_KEY no ficheiro .env.'
    });
  }

  const sessionId = String(req.query.session_id || '');
  if (!sessionId) return res.status(400).json({ error: 'session_id em falta' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId || null;

    if (orderId && session.payment_status === 'paid') {
      db.prepare(`
        UPDATE orders
        SET status = 'processando',
            payment_status = 'paid',
            stripe_session_id = ?,
            stripe_payment_intent_id = ?
        WHERE id = ?
      `).run(session.id, session.payment_intent || null, orderId);
    }

    res.json({
      orderId,
      status: session.status,
      paymentStatus: session.payment_status,
      total: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Nao foi possivel confirmar o pagamento Stripe' });
  }
});

app.post('/api/newsletter', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email em falta' });
  db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(email);
  res.status(201).json({ ok: true });
});

const browserDist = path.join(__dirname, '..', 'dist', 'carla-thomas-signature', 'browser');
if (fs.existsSync(browserDist)) {
  app.use(express.static(browserDist, { maxAge: '1y', index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(browserDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Carla Thomas pronta em http://localhost:${port}`);
});
