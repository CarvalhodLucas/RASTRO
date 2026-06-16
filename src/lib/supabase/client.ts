import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are missing! Authentication will not work correctly.");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      // Bypass do navigator.locks para evitar congelamentos no Chrome (Web Locks API bug)
      lock: (name, acquireTimeout, fn) => {
        return fn();
      }
    }
  }
);

