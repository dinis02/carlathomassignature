require('dotenv').config();

const path = require('path');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sqlite = new Database(path.join(__dirname, '..', 'data', 'carla-thomas.sqlite'));
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  const products = sqlite.prepare('SELECT * FROM products ORDER BY id').all();

  for (const row of products) {
    const product = {
      id: row.id,
      brand: row.brand,
      name: row.name,
      price: row.price,
      original_price: row.original_price,
      badge: row.badge,
      badge_dark: !!row.badge_dark,
      gradient_from: row.gradient_from,
      gradient_to: row.gradient_to,
      rating: row.rating,
      review_count: row.review_count,
      category: row.category,
      description: row.description,
      how_to_apply: row.how_to_apply,
      ingredients: row.ingredients,
      image: row.image,
      stock: row.stock,
      is_active: !!row.is_active
    };

    const { error: productError } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'id' });
    if (productError) throw productError;

    await supabase.from('product_shades').delete().eq('product_id', row.id);
    await supabase.from('product_finishes').delete().eq('product_id', row.id);

    const shades = sqlite.prepare('SELECT name, color FROM product_shades WHERE product_id = ?').all(row.id);
    if (shades.length) {
      const { error } = await supabase
        .from('product_shades')
        .insert(shades.map(shade => ({ product_id: row.id, name: shade.name, color: shade.color })));
      if (error) throw error;
    }

    const finishes = sqlite.prepare('SELECT name FROM product_finishes WHERE product_id = ?').all(row.id);
    if (finishes.length) {
      const { error } = await supabase
        .from('product_finishes')
        .insert(finishes.map(finish => ({ product_id: row.id, name: finish.name })));
      if (error) throw error;
    }
  }

  console.log(`Migrated ${products.length} products to Supabase.`);
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
