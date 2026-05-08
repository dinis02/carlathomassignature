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
    id: 1, brand: 'Charlotte Tilbury', name: 'Pillow Talk Lipstick',
    price: 33.60, originalPrice: 42.00, badge: '-20%', badgeDark: true,
    gradientFrom: '#C9A08A', gradientTo: '#A07050',
    rating: 4.2, reviewCount: 184, category: 'Labios', stock: 32,
    shades: [
      { name: 'Pillow Talk', color: '#C9956A' },
      { name: 'Coral Bliss', color: '#D4806A' },
      { name: 'Berry Kiss', color: '#8B3A5A' },
      { name: 'Rouge Red', color: '#B02A2A' },
      { name: 'Mocha Rose', color: '#7A4A3A' },
      { name: 'Dusty Pink', color: '#D4A0A8' }
    ],
    finishes: ['Matte', 'Acetinado', 'Brilhante'],
    description: 'O batom mais iconico da Charlotte Tilbury, numa tonalidade nude-rosa universal.',
    howToApply: 'Aplique do centro para o exterior dos labios e finalize com liner para maior definicao.',
    ingredients: 'Ricinus Communis Seed Oil, Ozokerite, Candelilla Cera, Tocopheryl Acetate, Hyaluronic Acid.',
    image: 'assets/produtos/pillow-talk-lipstick.jpg'
  },
  {
    id: 2, brand: 'Charlotte Tilbury', name: 'Pillow Talk Lip Liner',
    price: 18.00, gradientFrom: '#2A2220', gradientTo: '#1A1714',
    rating: 4.8, reviewCount: 248, category: 'Labios', badge: 'Novo', stock: 42,
    shades: [{ name: 'Pillow Talk', color: '#C9956A' }, { name: 'Medium', color: '#A07050' }],
    finishes: ['Classico'], description: 'Lapis de labios nude-rosa para definir e preencher.'
  },
  {
    id: 3, brand: 'Carla Thomas', name: 'Rose Glow Lip Gloss',
    price: 28.00, badge: 'Exclusivo', gradientFrom: '#E8D0C0', gradientTo: '#D4B8A8',
    rating: 5.0, reviewCount: 312, category: 'Labios', stock: 24,
    shades: [{ name: 'Rose Gold', color: '#C9956A' }, { name: 'Champagne', color: '#E8C4A8' }],
    finishes: ['Brilhante'], description: 'Gloss exclusivo com efeito volume e brilho rose dourado.'
  },
  {
    id: 4, brand: 'NARS', name: 'Afterglow Lip Balm',
    price: 26.00, gradientFrom: '#D4C4B5', gradientTo: '#C4B0A0',
    rating: 4.1, reviewCount: 97, category: 'Labios', stock: 18,
    shades: [{ name: 'Nude', color: '#C9956A' }, { name: 'Rosa', color: '#E8B4B8' }],
    finishes: ['Hidratante'], description: 'Balsamo nutritivo com cor subtil e brilho natural.'
  },
  {
    id: 5, brand: 'La Mer', name: 'Creme de la Mer',
    price: 185.00, gradientFrom: '#C4B0A0', gradientTo: '#B09080',
    rating: 4.6, reviewCount: 203, category: 'Rosto', stock: 8,
    description: 'Creme lendario de skincare de luxo.'
  },
  {
    id: 6, brand: 'Dior Beauty', name: 'Rouge Dior Satin',
    price: 39.00, gradientFrom: '#3A302C', gradientTo: '#2A2220',
    rating: 4.3, reviewCount: 156, category: 'Labios', stock: 26,
    shades: [{ name: 'Rouge', color: '#B02A2A' }, { name: 'Rose', color: '#D4A0A8' }],
    finishes: ['Acetinado'], description: 'Textura sedosa com acabamento acetinado.'
  },
  {
    id: 7, brand: 'Armani Beauty', name: 'Lip Maestro Velvet',
    price: 38.00, gradientFrom: '#B8A898', gradientTo: '#A09080',
    rating: 3.9, reviewCount: 67, category: 'Labios', stock: 0,
    description: 'Batom liquido de acabamento aveludado.'
  },
  {
    id: 8, brand: 'Charlotte Tilbury', name: 'Matte Revolution',
    price: 44.00, badge: 'Novo', gradientFrom: '#E8C4B0', gradientTo: '#D4A890',
    rating: 4.9, reviewCount: 89, category: 'Labios', stock: 15,
    shades: [{ name: 'Pillow Talk', color: '#C9956A' }, { name: 'Very Victoria', color: '#D4806A' }],
    finishes: ['Matte'], description: 'Formula matte com acido hialuronico.'
  },
  {
    id: 9, brand: 'NARS', name: 'Velvet Lip Glide',
    price: 27.20, originalPrice: 32.00, badge: '-15%', badgeDark: true,
    gradientFrom: '#4A3030', gradientTo: '#3A2020',
    rating: 3.7, reviewCount: 43, category: 'Labios', stock: 14,
    description: 'Acabamento liquido sedoso e cor pigmentada.'
  },
  {
    id: 10, brand: 'Charlotte Tilbury', name: 'Glowgasm Lips',
    price: 36.00, gradientFrom: '#F0E8E0', gradientTo: '#E0D4C4',
    rating: 4.8, reviewCount: 201, category: 'Labios', stock: 22,
    description: 'Brilho multidimensional para labios luminosos.'
  },
  {
    id: 11, brand: 'Sana Jardin', name: 'Jaipur Chant No. 8',
    price: 89.00, gradientFrom: '#2A2418', gradientTo: '#1A1810',
    rating: 4.5, reviewCount: 128, category: 'Acessorios', stock: 11,
    description: 'Eau de Parfum com especiarias e jasmim.'
  },
  {
    id: 12, brand: 'Armani Beauty', name: 'Luminous Silk Foundation',
    price: 62.00, gradientFrom: '#D4C0A8', gradientTo: '#C4B098',
    rating: 4.7, reviewCount: 345, category: 'Rosto', stock: 19,
    description: 'Base sedosa de cobertura luminosa.'
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
