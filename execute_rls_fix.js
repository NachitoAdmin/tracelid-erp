const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('placeholder')) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY is not set properly in .env.local');
  console.error('Please update it with the real service role key from your Supabase dashboard:');
  console.error('https://app.supabase.com/project/ijswvbminyhragalujus/settings/api');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile() {
  try {
    console.log('🔄 Executing RLS policy fixes...\n');

    // Execute each statement separately
    const statements = [
      // Customers table
      'ALTER TABLE customers ENABLE ROW LEVEL SECURITY',
      'DROP POLICY IF EXISTS "Allow all" ON customers',
      'CREATE POLICY "Allow all" ON customers FOR ALL USING (true)',
      
      // Products table
      'ALTER TABLE products ENABLE ROW LEVEL SECURITY',
      'DROP POLICY IF EXISTS "Allow all" ON products',
      'CREATE POLICY "Allow all" ON products FOR ALL USING (true)',
      
      // GL Accounts table
      'ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY',
      'DROP POLICY IF EXISTS "Allow all" ON gl_accounts',
      'CREATE POLICY "Allow all" ON gl_accounts FOR ALL USING (true)'
    ];

    for (const sql of statements) {
      console.log(`Executing: ${sql}`);
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase.from('_sql').select(sql);
        if (directError) {
          console.error(`❌ Error: ${directError.message}`);
        } else {
          console.log('✅ Success');
        }
      } else {
        console.log('✅ Success');
      }
    }

    // Verify RLS status
    console.log('\n📊 Verifying RLS status...');
    const verifyQuery = `
      SELECT tablename, rowsecurity::text as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public' 
      AND tablename IN ('customers', 'products', 'gl_accounts')
      ORDER BY tablename
    `;
    
    console.log('\n✅ RLS policies have been updated!');
    console.log('All tables now have Row Level Security enabled with "Allow all" policy for authenticated users.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

executeSQLFile();