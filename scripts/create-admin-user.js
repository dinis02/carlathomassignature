require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const name = String(process.env.ADMIN_NAME || 'Admin').trim();
const password = String(process.env.ADMIN_PASSWORD || '');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (!email || password.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD with at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (error && error.status !== 422) throw error;

  const userId = data.user?.id || await findUserIdByEmail(email);
  if (!userId) throw new Error(`Could not find Supabase Auth user for ${email}.`);

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, name, role: 'admin' }, { onConflict: 'id' });

  if (profileError) throw profileError;
  console.log(`Admin ready in Supabase Auth: ${email}`);
}

async function findUserIdByEmail(targetEmail) {
  let page = 1;

  while (page < 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find(item => item.email?.toLowerCase() === targetEmail);
    if (user) return user.id;
    if (data.users.length < 100) return null;
    page++;
  }

  return null;
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
