import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // First, check what tables exist
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .ilike('table_name', 'tenant%')
    
    // Check Tenant table columns
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'Tenant')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    // Try to get tenants
    const { data: tenants, error } = await supabase
      .from('Tenant')
      .select('*')
      .order('createdAt', { ascending: false })

    return NextResponse.json({
      tables: tables || [],
      tableError: tableError?.message,
      columns: columns || [],
      columnError: columnError?.message,
      tenants: tenants || [],
      tenantError: error?.message,
      env: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
        supabaseKey: supabaseKey ? 'Set' : 'Not set',
      }
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const errors: string[] = []
  
  try {
    const body = await request.json()
    const { name, country, password } = body

    errors.push(`Received: name=${name}, country=${country}, password=${password ? 'Set' : 'Not set'}`)

    if (!name || !country) {
      return NextResponse.json(
        { error: 'name and country are required', received: body },
        { status: 400 }
      )
    }

    // Try insert with full error details
    const insertData: any = { name, country }
    if (password) insertData.password = password
    
    errors.push(`Inserting: ${JSON.stringify(insertData)}`)

    const { data: tenant, error } = await supabase
      .from('Tenant')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      errors.push(`Supabase error: ${JSON.stringify(error)}`)
      return NextResponse.json(
        { 
          error: 'Failed to create tenant', 
          details: error.message, 
          code: error.code,
          hint: error.hint,
          errors
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ tenant, debug: { errors } }, { status: 201 })
  } catch (error: any) {
    errors.push(`Catch error: ${error?.message || String(error)}`)
    return NextResponse.json(
      { error: 'Failed to create tenant', details: error?.message || String(error), errors },
      { status: 500 }
    )
  }
}
