import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data: tenants, error } = await supabase
      .from('Tenant')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error

    // Get transaction counts for each tenant
    const tenantsWithCount = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
        
        return {
          ...tenant,
          _count: { transactions: count || 0 }
        }
      })
    )

    return NextResponse.json(tenantsWithCount)
  } catch (error: any) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, country } = body

    if (!name || !country) {
      return NextResponse.json(
        { error: 'name and country are required' },
        { status: 400 }
      )
    }

    const { data: tenant, error } = await supabase
      .from('Tenant')
      .insert({ name, country })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(tenant, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
