const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] ? match[2].trim() : '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    val = val.split(' #')[0].trim();
    env[match[1]] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Querying 'tasks' table in Supabase...");
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    console.error("Error fetching tasks:", error);
  } else {
    console.log("TASKS_IN_DB count:", data.length);
    console.log("TASKS_IN_DB:", JSON.stringify(data, null, 2));
  }
}
run();
