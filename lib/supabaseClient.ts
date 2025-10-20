console.log('Loaded URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
import { createClient } from '@supabase/supabase-js';

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Missing');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('TEST ENV VAR:', process.env.TEST_ENV_VAR);
// Test Supabase connection
(async () => {
  const { data, error } = await supabase.from('events').select('*').limit(1);
  console.log('🔌 Connection test:', { data, error });
})();
