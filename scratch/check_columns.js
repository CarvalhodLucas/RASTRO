const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const cleanLine = line.replace(/\r/g, '').trim();
  const match = cleanLine.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.includes('#')) {
      val = val.split('#')[0].trim();
    }
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("All columns in profiles:", Object.keys(data[0]));
    console.log("Sample profile:", data[0]);
  } else {
    console.log("No data in profiles table");
  }
}

checkColumns();
