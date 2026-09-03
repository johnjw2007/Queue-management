import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.argv[2] || process.env.SUPABASE_URL || 'https://yooomplbpzfryuifgevc.supabase.co';
const supabaseKey = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Please pass your Supabase service key: node clean_db.js <URL> <KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearStudents() {
  console.log('🧹 Purging all demo student records and violations from Supabase...');
  
  const { error: violError } = await supabase.from('violations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (violError) console.error('Violation purge error:', violError.message);
  else console.log('✅ Violations table cleared.');

  const { error: stuError } = await supabase.from('students').delete().neq('id', '___NONE___');
  if (stuError) console.error('Student purge error:', stuError.message);
  else console.log('✅ Students table cleared (0 records).');
}

clearStudents();
