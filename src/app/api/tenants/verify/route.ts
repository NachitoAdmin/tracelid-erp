import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { tenantId, password } = await request.json()

    if (!tenantId || !password) {
      return NextResponse.json(
        { error: 'Missing tenantId or password' },
        { status: 400 }
      )
    }

    // Fetch tenant password
    const { data: tenant, error } = await supabase
      .from('Tenant')
      .select('password')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // If no password set, allow access
    if (!tenant.password) {
      return NextResponse.json({ success: true })
    }

    // Simple password comparison (in production, use bcrypt)
    if (password === tenant.password) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error: any) {
    console.error('Password verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed', details: error?.message },
      { status: 500 }
    )
  }
}
