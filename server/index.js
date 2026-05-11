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

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
      await updateOrderPayment(orderId, {
        status: 'processando',
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent || null
      });
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
    isActive: !!row.is_active,
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
    isActive: !!row.is_active,
    shades: (row.product_shades || []).map(shade => ({ name: shade.name, color: shade.color })),
    finishes: (row.product_finishes || []).map(finish => finish.name)
  };
}

async function listAdminProducts() {
  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_shades(name,color), product_finishes(name)')
      .order('id', { ascending: true });

    if (!error) return data.map(mapSupabaseProduct);
    console.warn('Supabase admin products fallback:', error.message);
  }

  const rows = db.prepare('SELECT * FROM products ORDER BY id').all();
  return rows.map(mapProduct);
}

function normalizeOrderStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'pending_payment') return 'pending_payment';
  if (value === 'processando') return 'processando';
  if (value === 'em transito' || value === 'em_transito' || value === 'shipped') return 'em_transito';
  if (value === 'entregue' || value === 'delivered') return 'entregue';
  if (value === 'cancelada' || value === 'cancelado' || value === 'cancelled') return 'cancelada';
  return value || 'processando';
}

function orderStatusLabel(status) {
  const normalized = normalizeOrderStatus(status);
  const labels = {
    pending_payment: 'Pagamento pendente',
    processando: 'Processando',
    em_transito: 'Em transito',
    entregue: 'Entregue',
    cancelada: 'Cancelada'
  };
  return labels[normalized] || 'Processando';
}

function returnStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();
  const labels = {
    pending: 'Pendente',
    processing: 'Em processamento',
    resolved: 'Resolvida'
  };
  return labels[normalized] || 'Pendente';
}

function formatDateLabel(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function mapProductReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    customerName: row.customer_name,
    rating: Number(row.rating || 0),
    title: row.title,
    comment: row.comment,
    createdAt: row.created_at,
    createdLabel: formatDateLabel(row.created_at)
  };
}

async function listProductReviews(productId) {
  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, customer_name, rating, title, comment, created_at')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!error) return data.map(mapProductReview);
    console.warn('Supabase reviews fallback:', error.message);
  }

  const rows = db.prepare(`
    SELECT id, product_id, customer_name, rating, title, comment, created_at
    FROM product_reviews
    WHERE product_id = ? AND is_approved = 1
    ORDER BY datetime(created_at) DESC
  `).all(productId);
  return rows.map(mapProductReview);
}

function refreshLocalProductReviewTotals(productId) {
  const totals = db.prepare(`
    SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS rating, COUNT(*) AS review_count
    FROM product_reviews
    WHERE product_id = ? AND is_approved = 1
  `).get(productId);
  db.prepare('UPDATE products SET rating = ?, review_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(Number(totals.rating || 0), Number(totals.review_count || 0), productId);
}

async function getFullProduct(productId, includeInactive = false) {
  if (supabaseEnabled()) {
    let query = supabase
      .from('products')
      .select('*, product_shades(name,color), product_finishes(name)')
      .eq('id', productId);
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query.single();
    if (!error && data) return mapSupabaseProduct(data);
    console.warn('Supabase product read fallback:', error?.message);
  }

  const row = db.prepare(`SELECT * FROM products WHERE id = ? ${includeInactive ? '' : 'AND is_active = 1'}`).get(productId);
  return row ? mapProduct(row) : null;
}

function mapSupabaseOrder(row) {
  const items = row.order_items || [];
  return {
    id: row.id,
    date: row.created_at,
    dateLabel: formatDateLabel(row.created_at),
    customerName: `${row.customer_first_name || ''} ${row.customer_last_name || ''}`.trim(),
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    customerPostcode: row.customer_postcode,
    customerCity: row.customer_city,
    customerCountry: row.customer_country,
    itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    items: items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      productBrand: item.product_brand,
      unitPrice: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 0),
      selectedShade: item.selected_shade,
      selectedFinish: item.selected_finish
    })),
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    shipping: Number(row.shipping || 0),
    total: Number(row.total || 0),
    shippingMethod: row.shipping_method,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: normalizeOrderStatus(row.status),
    statusLabel: orderStatusLabel(row.status),
    rewardPoints: Number(row.reward_points || 0),
    stripeSessionId: row.stripe_session_id
  };
}

async function loadAdminOrderDetail(orderId) {
  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (!error && data) return mapSupabaseOrder(data);
    console.warn('Supabase admin order detail fallback:', error?.message);
  }

  const order = db.prepare(`
    SELECT
      o.*,
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.address,
      c.postcode,
      c.city,
      c.country
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) return null;

  const items = db.prepare(`
    SELECT product_id, product_name, product_brand, unit_price, quantity, selected_shade, selected_finish
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `).all(orderId);

  return {
    id: order.id,
    date: order.created_at,
    dateLabel: formatDateLabel(order.created_at),
    customerName: `${order.first_name} ${order.last_name}`.trim(),
    customerEmail: order.email,
    customerPhone: order.phone,
    customerAddress: order.address,
    customerPostcode: order.postcode,
    customerCity: order.city,
    customerCountry: order.country,
    itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    items: items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      productBrand: item.product_brand,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      selectedShade: item.selected_shade,
      selectedFinish: item.selected_finish
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    shippingMethod: order.shipping_method,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    status: normalizeOrderStatus(order.status),
    statusLabel: orderStatusLabel(order.status),
    stripeSessionId: order.stripe_session_id
  };
}

function mapCustomerOrder(order) {
  const items = db.prepare(`
    SELECT product_id, product_name, product_brand, unit_price, quantity, selected_shade, selected_finish
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `).all(order.id);

  return {
    id: order.id,
    date: order.created_at,
    dateLabel: formatDateLabel(order.created_at),
    customerName: `${order.first_name} ${order.last_name}`.trim(),
    customerEmail: order.email,
    itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    items: items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      productBrand: item.product_brand,
      unitPrice: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 0),
      selectedShade: item.selected_shade,
      selectedFinish: item.selected_finish
    })),
    subtotal: Number(order.subtotal || 0),
    discount: Number(order.discount || 0),
    shipping: Number(order.shipping || 0),
    total: Number(order.total || 0),
    shippingMethod: order.shipping_method,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    status: normalizeOrderStatus(order.status),
    statusLabel: orderStatusLabel(order.status),
    rewardPoints: Number(order.reward_points || 0)
  };
}

async function listCustomerOrders(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return [];

  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_email', normalizedEmail)
      .order('created_at', { ascending: false });

    if (!error) return data.map(mapSupabaseOrder);
    console.warn('Supabase customer orders fallback:', error.message);
  }

  const orders = db.prepare(`
    SELECT
      o.*,
      c.first_name,
      c.last_name,
      c.email,
      c.phone
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE lower(c.email) = ?
    ORDER BY datetime(o.created_at) DESC
  `).all(normalizedEmail);

  return orders.map(mapCustomerOrder);
}

async function listAdminOrders() {
  if (supabaseEnabled()) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(id,quantity)')
      .order('created_at', { ascending: false });

    if (!error) {
      return data.map(order => {
        const mapped = mapSupabaseOrder(order);
        return {
          id: mapped.id,
          date: mapped.date,
          dateLabel: mapped.dateLabel,
          customerName: mapped.customerName,
          customerEmail: mapped.customerEmail,
          itemCount: mapped.itemCount,
          shippingMethod: mapped.shippingMethod,
          total: mapped.total,
          status: mapped.status,
          statusLabel: mapped.statusLabel
        };
      });
    }
    console.warn('Supabase admin orders fallback:', error.message);
  }

  const orders = db.prepare(`
    SELECT
      o.id,
      o.created_at,
      o.total,
      o.status,
      o.shipping_method,
      c.first_name,
      c.last_name,
      c.email,
      COUNT(oi.id) AS items_count
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY datetime(o.created_at) DESC
  `).all();

  return orders.map(order => ({
    id: order.id,
    date: order.created_at,
    dateLabel: formatDateLabel(order.created_at),
    customerName: `${order.first_name} ${order.last_name}`.trim(),
    customerEmail: order.email,
    itemCount: Number(order.items_count || 0),
    shippingMethod: order.shipping_method,
    total: Number(order.total || 0),
    status: normalizeOrderStatus(order.status),
    statusLabel: orderStatusLabel(order.status)
  }));
}

function listAdminCustomers() {
  const customers = db.prepare(`
    SELECT
      c.id,
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.city,
      c.country,
      COUNT(o.id) AS orders_count,
      COALESCE(SUM(o.total), 0) AS total_spent,
      MAX(o.created_at) AS last_order_at
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY datetime(COALESCE(MAX(o.created_at), c.created_at)) DESC
  `).all();

  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  return customers.map(customer => ({
    id: customer.id,
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    country: customer.country,
    ordersCount: Number(customer.orders_count || 0),
    totalSpent: Number(customer.total_spent || 0),
    status: customer.last_order_at && new Date(customer.last_order_at).getTime() >= ninetyDaysAgo ? 'active' : 'inactive',
    statusLabel: customer.last_order_at && new Date(customer.last_order_at).getTime() >= ninetyDaysAgo ? 'Activo' : 'Inactivo',
    lastOrderAt: customer.last_order_at,
    lastOrderLabel: customer.last_order_at ? formatDateLabel(customer.last_order_at) : 'Sem encomendas'
  }));
}

function listAdminReturns() {
  const returns = db.prepare(`
    SELECT
      r.*,
      c.first_name,
      c.last_name
    FROM order_returns r
    JOIN orders o ON o.id = r.order_id
    JOIN customers c ON c.id = o.customer_id
    ORDER BY datetime(r.created_at) DESC
  `).all();

  return returns.map(entry => ({
    id: entry.id,
    orderId: entry.order_id,
    customerName: `${entry.first_name} ${entry.last_name}`.trim(),
    productName: entry.product_name,
    reason: entry.reason,
    status: entry.status,
    statusLabel: returnStatusLabel(entry.status),
    createdAt: entry.created_at,
    createdLabel: formatDateLabel(entry.created_at)
  }));
}

async function getDashboardData() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();

  const monthTotals = db.prepare(`
    SELECT
      COUNT(*) AS orders_count,
      COALESCE(SUM(total), 0) AS revenue,
      COALESCE(AVG(total), 0) AS average_order
    FROM orders
    WHERE datetime(created_at) >= datetime(?)
  `).get(monthStart);

  const returnCounts = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
    FROM order_returns
  `).get();

  const statusRows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM orders
    GROUP BY status
  `).all();

  const statusCounts = {
    processando: 0,
    em_transito: 0,
    entregue: 0,
    cancelada: 0,
    pending_payment: 0
  };
  statusRows.forEach(row => {
    const key = normalizeOrderStatus(row.status);
    if (Object.prototype.hasOwnProperty.call(statusCounts, key)) statusCounts[key] = Number(row.count || 0);
  });

  const recentOrders = (await listAdminOrders()).slice(0, 5);
  const customers = listAdminCustomers();
  const returns = listAdminReturns();

  const revenueByDayRows = db.prepare(`
    SELECT strftime('%d', created_at) AS day_label, COALESCE(SUM(total), 0) AS total
    FROM orders
    WHERE datetime(created_at) >= datetime(?)
    GROUP BY strftime('%d', created_at)
    ORDER BY strftime('%d', created_at) ASC
  `).all(monthStart);

  const dailyRevenue = revenueByDayRows.map(row => ({
    label: row.day_label,
    total: Number(row.total || 0)
  }));

  const lowStockRows = db.prepare(`
    SELECT name, stock
    FROM products
    WHERE is_active = 1 AND stock <= 5
    ORDER BY stock ASC, name ASC
    LIMIT 2
  `).all();

  const recentCustomers = customers.slice(0, 2).map(customer => ({
    type: 'customer',
    message: `Novo cliente - ${customer.name}`,
    timeLabel: customer.lastOrderLabel
  }));

  const activities = [
    ...recentOrders.slice(0, 2).map(order => ({
      type: 'order',
      message: `Nova encomenda ${order.id} - ${order.customerName} - ${order.total.toFixed(2)} EUR`,
      timeLabel: order.dateLabel
    })),
    ...returns.slice(0, 1).map(entry => ({
      type: 'return',
      message: `Pedido de devolucao - ${entry.orderId} - ${entry.productName}`,
      timeLabel: entry.createdLabel
    })),
    ...lowStockRows.map(product => ({
      type: 'product',
      message: `Stock baixo - ${product.name} - ${product.stock} unidades`,
      timeLabel: 'Stock actual'
    })),
    ...recentCustomers
  ].slice(0, 5);

  const monthlyRows = db.prepare(`
    SELECT strftime('%m', created_at) AS month_key, COALESCE(SUM(total), 0) AS total
    FROM orders
    WHERE datetime(created_at) >= datetime(?)
    GROUP BY strftime('%m', created_at)
    ORDER BY strftime('%m', created_at) ASC
  `).all(yearStart);

  const monthlyRevenue = monthlyRows.map(row => ({
    label: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][Number(row.month_key) - 1],
    total: Number(row.total || 0)
  }));

  return {
    revenueMonth: Number(monthTotals.revenue || 0),
    ordersMonth: Number(monthTotals.orders_count || 0),
    averageOrderValue: Number(monthTotals.average_order || 0),
    pendingReturns: Number(returnCounts.pending || 0),
    statusCounts,
    dailyRevenue,
    monthlyRevenue,
    recentOrders,
    recentActivity: activities
  };
}

function getAnalyticsData() {
  const totals = db.prepare(`
    SELECT
      COUNT(*) AS orders_count,
      COALESCE(SUM(total), 0) AS revenue,
      COALESCE(AVG(total), 0) AS average_order
    FROM orders
  `).get();

  const subscriberCount = db.prepare('SELECT COUNT(*) AS count FROM newsletter_subscribers').get();
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const monthlyRows = db.prepare(`
    SELECT strftime('%m', created_at) AS month_key, COALESCE(SUM(total), 0) AS total
    FROM orders
    WHERE datetime(created_at) >= datetime(?)
    GROUP BY strftime('%m', created_at)
    ORDER BY strftime('%m', created_at) ASC
  `).all(currentYearStart);

  return {
    totalRevenue: Number(totals.revenue || 0),
    totalOrders: Number(totals.orders_count || 0),
    averageOrderValue: Number(totals.average_order || 0),
    newsletterSubscribers: Number(subscriberCount.count || 0),
    monthlyRevenue: monthlyRows.map(row => ({
      label: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][Number(row.month_key) - 1],
      total: Number(row.total || 0)
    }))
  };
}

function getStoreSettings() {
  return db.prepare(`
    SELECT
      store_name,
      contact_email,
      description,
      notify_orders,
      notify_low_stock,
      notify_returns,
      notify_new_customers
    FROM store_settings
    WHERE id = 1
  `).get();
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

function createLocalOrder(payload, options = {}, orderId = `CTS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`) {
  const { customer, items, subtotal, discount, shipping, total, shippingMethod, paymentMethod, rewardPoints } = payload;
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

async function resolveSupabaseUserId(email) {
  if (!supabaseEnabled() || !email) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', String(email).trim().toLowerCase())
    .maybeSingle();
  return data?.id || null;
}

async function createSupabaseOrder(payload, options = {}, orderId) {
  const { customer, items, subtotal, discount, shipping, total, shippingMethod, paymentMethod, rewardPoints } = payload;
  const status = options.status || 'processando';
  const paymentStatus = options.paymentStatus || 'unpaid';
  const normalizedEmail = String(customer.email || '').trim().toLowerCase();
  const userId = await resolveSupabaseUserId(normalizedEmail);

  const { error: orderError } = await supabase
    .from('orders')
    .upsert({
      id: orderId,
      user_id: userId,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: normalizedEmail,
      customer_phone: customer.phone ?? null,
      customer_address: customer.address ?? null,
      customer_postcode: customer.postcode ?? null,
      customer_city: customer.city ?? null,
      customer_country: customer.country ?? 'Portugal',
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      shipping: Number(shipping) || 0,
      total: Number(total) || 0,
      shipping_method: shippingMethod || 'standard',
      payment_method: paymentMethod || 'stripe',
      reward_points: Number(rewardPoints) || 0,
      status,
      payment_status: paymentStatus
    }, { onConflict: 'id' });

  if (orderError) throw orderError;

  await supabase.from('order_items').delete().eq('order_id', orderId);
  const itemRows = items.map(item => ({
    order_id: orderId,
    product_id: item.product?.id ?? null,
    product_name: item.product?.name || 'Produto',
    product_brand: item.product?.brand || '',
    unit_price: Number(item.product?.price) || 0,
    quantity: Number(item.quantity) || 1,
    selected_shade: item.selectedShade ?? null,
    selected_finish: item.selectedFinish ?? null
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(itemRows);
  if (itemsError) throw itemsError;
}

async function createOrder(payload, options = {}) {
  const orderId = `CTS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
  createLocalOrder(payload, options, orderId);

  if (supabaseEnabled()) {
    try {
      await createSupabaseOrder(payload, options, orderId);
    } catch (err) {
      console.warn('Supabase order insert fallback local only:', err.message);
    }
  }

  return orderId;
}

async function updateOrderPayment(orderId, values) {
  db.prepare(`
    UPDATE orders
    SET status = COALESCE(@status, status),
        payment_status = COALESCE(@paymentStatus, payment_status),
        stripe_session_id = COALESCE(@stripeSessionId, stripe_session_id),
        stripe_payment_intent_id = COALESCE(@stripePaymentIntentId, stripe_payment_intent_id)
    WHERE id = @orderId
  `).run({
    orderId,
    status: values.status ?? null,
    paymentStatus: values.paymentStatus ?? null,
    stripeSessionId: values.stripeSessionId ?? null,
    stripePaymentIntentId: values.stripePaymentIntentId ?? null
  });

  if (supabaseEnabled()) {
    const patch = {};
    if (values.status !== undefined) patch.status = values.status;
    if (values.paymentStatus !== undefined) patch.payment_status = values.paymentStatus;
    if (values.stripeSessionId !== undefined) patch.stripe_session_id = values.stripeSessionId;
    if (values.stripePaymentIntentId !== undefined) patch.stripe_payment_intent_id = values.stripePaymentIntentId;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
      if (error) console.warn('Supabase order payment update failed:', error.message);
    }
  }
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
  const product = await getFullProduct(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produto nao encontrado' });
  res.json(product);
});

app.get('/api/products/:id/reviews', async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) return res.status(400).json({ error: 'Produto invalido' });
  res.json(await listProductReviews(productId));
});

app.post('/api/products/:id/reviews', async (req, res) => {
  const productId = Number(req.params.id);
  const customerName = String(req.body.customerName || '').trim();
  const customerEmail = String(req.body.customerEmail || '').trim().toLowerCase();
  const rating = Number(req.body.rating);
  const title = String(req.body.title || '').trim();
  const comment = String(req.body.comment || '').trim();

  if (!productId || !customerName || !customerEmail || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Nome, email e avaliacao de 1 a 5 sao obrigatorios' });
  }

  try {
    let review;
    if (supabaseEnabled()) {
      const userId = await resolveSupabaseUserId(customerEmail);
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: userId,
          customer_name: customerName,
          customer_email: customerEmail,
          rating,
          title: title || null,
          comment: comment || null,
          is_approved: true
        })
        .select('id, product_id, customer_name, rating, title, comment, created_at')
        .single();
      if (error) throw error;
      review = mapProductReview(data);
    } else {
      const result = db.prepare(`
        INSERT INTO product_reviews (product_id, customer_name, customer_email, rating, title, comment)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(productId, customerName, customerEmail, rating, title || null, comment || null);
      refreshLocalProductReviewTotals(productId);
      review = mapProductReview(db.prepare('SELECT * FROM product_reviews WHERE id = ?').get(result.lastInsertRowid));
    }

    const product = await getFullProduct(productId, true);
    res.status(201).json({ review, product });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Nao foi possivel guardar a avaliacao' });
  }
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

app.put('/api/products/:id', uploadProductImage.single('image'), async (req, res) => {
  const productId = Number(req.params.id);
  const name = String(req.body.name || '').trim();
  const brand = String(req.body.brand || '').trim();
  const category = String(req.body.category || '').trim();
  const price = Number(req.body.price);

  if (!productId || !name || !brand || !category || !Number.isFinite(price) || price <= 0) {
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
      const existing = await supabase.from('products').select('image').eq('id', productId).single();
      const image = req.file ? await uploadProductImageToSupabase(req.file) : existing.data?.image || null;

      const { error } = await supabase
        .from('products')
        .update({
          brand,
          name,
          price,
          original_price: originalPrice,
          badge,
          badge_dark: req.body.badgeDark === 'true',
          gradient_from: gradientFrom,
          gradient_to: gradientTo,
          category,
          description: String(req.body.description || '').trim() || null,
          how_to_apply: String(req.body.howToApply || '').trim() || null,
          ingredients: String(req.body.ingredients || '').trim() || null,
          image,
          stock
        })
        .eq('id', productId);

      if (error) throw error;

      await supabase.from('product_shades').delete().eq('product_id', productId);
      await supabase.from('product_finishes').delete().eq('product_id', productId);

      if (shades.length) {
        const shadeRows = shades.map((shade, index) => ({
          product_id: productId,
          name: shade,
          color: ['#C9956A', '#D4806A', '#8B3A5A', '#B02A2A'][index % 4]
        }));
        const { error: shadesError } = await supabase.from('product_shades').insert(shadeRows);
        if (shadesError) throw shadesError;
      }

      if (finishes.length) {
        const finishRows = finishes.map(finish => ({ product_id: productId, name: finish }));
        const { error: finishesError } = await supabase.from('product_finishes').insert(finishRows);
        if (finishesError) throw finishesError;
      }

      const { data: fullProduct, error: fullError } = await supabase
        .from('products')
        .select('*, product_shades(name,color), product_finishes(name)')
        .eq('id', productId)
        .single();
      if (fullError) throw fullError;
      return res.json(mapSupabaseProduct(fullProduct));
    } catch (err) {
      console.warn('Supabase update product fallback:', err.message);
    }
  }

  const existing = db.prepare('SELECT image FROM products WHERE id = ?').get(productId);
  if (!existing) return res.status(404).json({ error: 'Produto nao encontrado' });

  const image = req.file ? saveProductImageLocally(req.file) : existing.image;

  const result = db.prepare(`
    UPDATE products
    SET
      brand = @brand,
      name = @name,
      price = @price,
      original_price = @originalPrice,
      badge = @badge,
      badge_dark = @badgeDark,
      gradient_from = @gradientFrom,
      gradient_to = @gradientTo,
      category = @category,
      description = @description,
      how_to_apply = @howToApply,
      ingredients = @ingredients,
      image = @image,
      stock = @stock,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id: productId,
    brand,
    name,
    price,
    originalPrice,
    badge,
    badgeDark: req.body.badgeDark === 'true' ? 1 : 0,
    gradientFrom,
    gradientTo,
    category,
    description: String(req.body.description || '').trim() || null,
    howToApply: String(req.body.howToApply || '').trim() || null,
    ingredients: String(req.body.ingredients || '').trim() || null,
    image,
    stock
  });

  if (!result.changes) return res.status(404).json({ error: 'Produto nao encontrado' });

  db.prepare('DELETE FROM product_shades WHERE product_id = ?').run(productId);
  db.prepare('DELETE FROM product_finishes WHERE product_id = ?').run(productId);

  const insertShade = db.prepare('INSERT INTO product_shades (product_id, name, color) VALUES (?, ?, ?)');
  const insertFinish = db.prepare('INSERT INTO product_finishes (product_id, name) VALUES (?, ?)');
  shades.forEach((shade, index) => insertShade.run(productId, shade, ['#C9956A', '#D4806A', '#8B3A5A', '#B02A2A'][index % 4]));
  finishes.forEach(finish => insertFinish.run(productId, finish));

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  res.json(mapProduct(row));
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

app.get('/api/orders', async (req, res) => {
  const orders = await listCustomerOrders(req.query.email);
  res.json({
    orders,
    rewardPoints: orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + Number(order.rewardPoints || 0), 0)
  });
});

app.get('/api/admin/dashboard', async (_req, res) => {
  res.json(await getDashboardData());
});

app.get('/api/admin/products', async (_req, res) => {
  res.json(await listAdminProducts());
});

app.get('/api/admin/orders', async (_req, res) => {
  res.json(await listAdminOrders());
});

app.get('/api/admin/orders/:id', async (req, res) => {
  const order = await loadAdminOrderDetail(req.params.id);
  if (!order) return res.status(404).json({ error: 'Encomenda nao encontrada' });
  res.json(order);
});

app.patch('/api/admin/orders/:id', async (req, res) => {
  const allowed = ['processando', 'em_transito', 'entregue', 'cancelada', 'pending_payment'];
  const nextStatus = normalizeOrderStatus(req.body.status);
  if (!allowed.includes(nextStatus)) {
    return res.status(400).json({ error: 'Estado invalido' });
  }

  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(nextStatus, req.params.id);
  if (supabaseEnabled()) {
    const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', req.params.id);
    if (error) console.warn('Supabase admin status update failed:', error.message);
  }
  if (!result.changes && !supabaseEnabled()) return res.status(404).json({ error: 'Encomenda nao encontrada' });

  const order = await loadAdminOrderDetail(req.params.id);
  res.json(order);
});

app.get('/api/admin/customers', (_req, res) => {
  res.json(listAdminCustomers());
});

app.get('/api/admin/returns', (_req, res) => {
  res.json(listAdminReturns());
});

app.get('/api/admin/analytics', (_req, res) => {
  res.json(getAnalyticsData());
});

app.patch('/api/admin/products/:id/archive', async (req, res) => {
  const productId = Number(req.params.id);
  const isActive = req.body.isActive !== false;

  if (!productId) {
    return res.status(400).json({ error: 'Produto invalido' });
  }

  if (supabaseEnabled()) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId);

      if (error) throw error;

      const { data: fullProduct, error: fullError } = await supabase
        .from('products')
        .select('*, product_shades(name,color), product_finishes(name)')
        .eq('id', productId)
        .single();

      if (fullError) throw fullError;
      return res.json(mapSupabaseProduct(fullProduct));
    } catch (err) {
      console.warn('Supabase archive product fallback:', err.message);
    }
  }

  const result = db.prepare(`
    UPDATE products
    SET is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(isActive ? 1 : 0, productId);

  if (!result.changes) return res.status(404).json({ error: 'Produto nao encontrado' });

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  res.json(mapProduct(row));
});

app.delete('/api/admin/products/:id', async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) {
    return res.status(400).json({ error: 'Produto invalido' });
  }

  if (supabaseEnabled()) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      return res.status(204).send();
    } catch (err) {
      console.warn('Supabase delete product fallback:', err.message);
    }
  }

  db.prepare('DELETE FROM product_shades WHERE product_id = ?').run(productId);
  db.prepare('DELETE FROM product_finishes WHERE product_id = ?').run(productId);
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(productId);

  if (!result.changes) return res.status(404).json({ error: 'Produto nao encontrado' });
  res.status(204).send();
});

app.get('/api/admin/settings', (_req, res) => {
  const settings = getStoreSettings();
  res.json({
    storeName: settings?.store_name || 'Carla Thomas Signature',
    contactEmail: settings?.contact_email || 'info@carlathomassignature.pt',
    description: settings?.description || '',
    notifyOrders: !!settings?.notify_orders,
    notifyLowStock: !!settings?.notify_low_stock,
    notifyReturns: !!settings?.notify_returns,
    notifyNewCustomers: !!settings?.notify_new_customers
  });
});

app.put('/api/admin/settings', (req, res) => {
  const payload = {
    storeName: String(req.body.storeName || '').trim(),
    contactEmail: String(req.body.contactEmail || '').trim(),
    description: String(req.body.description || '').trim(),
    notifyOrders: req.body.notifyOrders ? 1 : 0,
    notifyLowStock: req.body.notifyLowStock ? 1 : 0,
    notifyReturns: req.body.notifyReturns ? 1 : 0,
    notifyNewCustomers: req.body.notifyNewCustomers ? 1 : 0
  };

  if (!payload.storeName || !payload.contactEmail) {
    return res.status(400).json({ error: 'Nome da loja e email de contacto sao obrigatorios' });
  }

  db.prepare(`
    UPDATE store_settings
    SET
      store_name = ?,
      contact_email = ?,
      description = ?,
      notify_orders = ?,
      notify_low_stock = ?,
      notify_returns = ?,
      notify_new_customers = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    payload.storeName,
    payload.contactEmail,
    payload.description,
    payload.notifyOrders,
    payload.notifyLowStock,
    payload.notifyReturns,
    payload.notifyNewCustomers
  );

  res.json(payload);
});

app.post('/api/orders', async (req, res) => {
  const error = validateOrderPayload(req.body);
  if (error) return res.status(400).json({ error });

  const orderId = await createOrder(req.body);
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

    const orderId = await createOrder(payload, {
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

    await updateOrderPayment(orderId, { stripeSessionId: session.id });
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
      await updateOrderPayment(orderId, {
        status: 'processando',
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent || null
      });
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
