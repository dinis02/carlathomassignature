const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

const dbPath = path.join(__dirname, '..', 'data', 'carla-thomas.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    original_price REAL,
    badge TEXT,
    badge_dark INTEGER NOT NULL DEFAULT 0,
    gradient_from TEXT NOT NULL,
    gradient_to TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    description TEXT,
    how_to_apply TEXT,
    ingredients TEXT,
    image TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_shades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_finishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    comment TEXT,
    is_approved INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    postcode TEXT,
    city TEXT,
    country TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    shipping REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    shipping_method TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    reward_points INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processando',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_brand TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    selected_shade TEXT,
    selected_finish TEXT
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    store_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    description TEXT,
    notify_orders INTEGER NOT NULL DEFAULT 1,
    notify_low_stock INTEGER NOT NULL DEFAULT 1,
    notify_returns INTEGER NOT NULL DEFAULT 1,
    notify_new_customers INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(col => col.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('orders', 'payment_status', "TEXT NOT NULL DEFAULT 'unpaid'");
ensureColumn('orders', 'stripe_session_id', 'TEXT');
ensureColumn('orders', 'stripe_payment_intent_id', 'TEXT');

const seedProducts = [
  {
    id: 1,
    brand: 'Debi',
    name: 'Debi Velvet Lip Cloud',
    price: 24.90,
    badge: 'Novo',
    gradientFrom: '#E4C6BD',
    gradientTo: '#A85D5A',
    rating: 0,
    reviewCount: 0,
    category: 'Labios',
    stock: 18,
    shades: [{ name: 'Rosewood Muse', color: '#A55258' }],
    finishes: ['Velvet', 'Longa duração'],
    description: 'Batom liquido com cor rosewood elegante, cobertura uniforme e acabamento aveludado confortavel.',
    howToApply: 'Aplique uma camada fina no centro dos labios e esbata para o contorno. Para maior intensidade, repita apos alguns segundos.',
    ingredients: 'Isododecane, Dimethicone, Trimethylsiloxysilicate, Silica, Synthetic Fluorphlogopite, Tocopherol, Aroma.',
    image: 'assets/produtos/debi-101.jpg'
  }
];

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
  if (count > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, brand, name, price, original_price, badge, badge_dark, gradient_from,
      gradient_to, rating, review_count, category, description, how_to_apply,
      ingredients, image, stock
    ) VALUES (
      @id, @brand, @name, @price, @originalPrice, @badge, @badgeDark, @gradientFrom,
      @gradientTo, @rating, @reviewCount, @category, @description, @howToApply,
      @ingredients, @image, @stock
    )
  `);
  const insertShade = db.prepare('INSERT INTO product_shades (product_id, name, color) VALUES (?, ?, ?)');
  const insertFinish = db.prepare('INSERT INTO product_finishes (product_id, name) VALUES (?, ?)');

  const tx = db.transaction((products) => {
    for (const product of products) {
      insertProduct.run({
        ...product,
        originalPrice: product.originalPrice ?? null,
        badge: product.badge ?? null,
        badgeDark: product.badgeDark ? 1 : 0,
        description: product.description ?? null,
        howToApply: product.howToApply ?? null,
        ingredients: product.ingredients ?? null,
        image: product.image ?? null
      });
      for (const shade of product.shades ?? []) insertShade.run(product.id, shade.name, shade.color);
      for (const finish of product.finishes ?? []) insertFinish.run(product.id, finish);
    }
  });

  tx(seedProducts);
}

seed();

db.prepare(`
  INSERT INTO store_settings (
    id, store_name, contact_email, description,
    notify_orders, notify_low_stock, notify_returns, notify_new_customers
  )
  VALUES (1, ?, ?, ?, 1, 1, 1, 0)
  ON CONFLICT(id) DO NOTHING
`).run(
  'Carla Thomas Signature',
  'info@carlathomassignature.pt',
  'Curadoria de beleza premium para quem valoriza autenticidade, qualidade e ritual.'
);

function hashPassword(password) {
  return require('crypto').createHash('sha256').update(String(password)).digest('hex');
}

function seedAccounts() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM user_accounts').get().count;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO user_accounts (role, name, email, username, password_hash)
    VALUES (@role, @name, @email, @username, @passwordHash)
  `);

  insert.run({
    role: 'admin',
    name: 'Dinis Rosca',
    email: 'admin@carlathomas.pt',
    username: 'admin',
    passwordHash: hashPassword('admin123')
  });

  insert.run({
    role: 'user',
    name: 'Cliente Demo',
    email: 'cliente@demo.pt',
    username: 'cliente',
    passwordHash: hashPassword('cliente123')
  });
}

seedAccounts();

module.exports = db;
