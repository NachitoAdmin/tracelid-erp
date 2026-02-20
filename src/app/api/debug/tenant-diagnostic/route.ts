import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseKey: supabaseKey ? 'Set' : 'Not set',
      serviceKey: process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Not set',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    },
    tests: {}
  }

  // Test 1: Check connection
  try {
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .ilike('table_name', 'tenant%')
    
    diagnostics.tests.tableQuery = {
      success: !tableError,
      error: tableError?.message,
      tablesFound: tables?.length || 0
    }
  } catch (err: any) {
    diagnostics.tests.tableQuery = { success: false, error: err.message }
  }

  // Test 2: Check Tenant columns
  try {
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'Tenant')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    diagnostics.tests.columnsQuery = {
      success: !colError,
      error: colError?.message,
      columns: columns?.map(c => c.column_name) || []
    }
  } catch (err: any) {
    diagnostics.tests.columnsQuery = { success: false, error: err.message }
  }

  // Test 3: Try direct insert
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('Tenant')
      .insert({ name: 'DiagTest', country: 'US', password: 'test' })
      .select()
      .single()
    
    diagnostics.tests.insert = {
      success: !insertError,
      error: insertError?.message,
      errorCode: insertError?.code,
      errorDetails: insertError,
      data: insertData
    }

    // Clean up if successful
    if (insertData?.id) {
      await supabase.from('Tenant').delete().eq('id', insertData.id)
    }
  } catch (err: any) {
    diagnostics.tests.insert = { success: false, error: err.message }
  }

  return NextResponse.json(diagnostics)
}
