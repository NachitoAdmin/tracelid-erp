import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // For now, return mock users since we don't have a users table yet
    // In production, this would query a users table with roles
    const { data: tenants } = await supabase
      .from('Tenant')
      .select('id, name')

    const mockUsers = [
      { id: '1', email: 'owner@tracelid.com', role: 'OWNER_ADMIN', tenantId: null, tenantName: 'All Tenants' },
      ...(tenants || []).map((t, i) => ({
        id: `user-${i}`,
        email: `admin@${t.name.toLowerCase().replace(/\s+/g, '')}.com`,
        role: 'TENANT_ADMIN',
        tenantId: t.id,
        tenantName: t.name,
      })),
    ]

    return NextResponse.json(mockUsers)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error?.message },
      { status: 500 }
    )
  }
}
