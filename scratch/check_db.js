const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const cleanLine = line.replace(/\r/g, '').trim();
  const match = cleanLine.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    // strip comments if any
    if (val.includes('#')) {
      val = val.split('#')[0].trim();
    }
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key", { supabaseUrl, supabaseAnonKey });
  console.log("Parsed keys:", Object.keys(env));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking profiles table...");
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log("Profiles sample:", data);
  }
}

check();
