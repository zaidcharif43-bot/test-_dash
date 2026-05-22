const { Client } = require('pg');

const connectionString = "postgresql://postgres.wjedjuueiuxoejhvkhfq:zn%mH3LRLXXH6Au@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

async function run() {
  const client = new Client({ 
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  try {
    console.log("Connecting to Supabase PostgreSQL database...");
    await client.connect();
    console.log("Connected successfully.");

    // 1. Add password column if it does not exist
    console.log("Adding 'password' column to public.users table if not exists...");
    await client.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password text;");
    console.log("'password' column verified/added.");

    // 2. Set default password for admin@iksatech.com if it is NULL
    console.log("Updating admin@iksatech.com's password to 'admin123' if empty...");
    const res = await client.query(
      "UPDATE public.users SET password = 'admin123' WHERE email = 'admin@iksatech.com' AND (password IS NULL OR password = '');"
    );
    console.log(`Updated ${res.rowCount} row(s).`);

    // 3. Select all active users to verify
    console.log("Fetching current users table list to verify schema:");
    const { rows } = await client.query("SELECT id, full_name, email, role, password, is_active FROM public.users;");
    console.table(rows);

  } catch (err) {
    console.error("Database migration error:", err);
  } finally {
    await client.end();
    console.log("Disconnected from database.");
  }
}

run();
