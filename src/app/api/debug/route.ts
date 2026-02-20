import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Get actual tenant ID
    const { data: tenants } = await supabase
      .from('Tenant')
      .select('id')
      .limit(1)
    
    const realTenantId = tenants?.[0]?.id
    
    // Try insert with minimal fields (no category)
    const minimalInsert = await supabase
      .from('transactions')
      .insert({
        document_number: 'TEST-MIN-001',
        transaction_type: 'SALE',
        amount: 100.00,
        tenant_id: realTenantId,
      })
      .select()
    
    // Try insert with category
    const withCategory = await supabase
      .from('transactions')
      .insert({
        document_number: 'TEST-CAT-001',
        transaction_type: 'SALE',
        category: 'Product Sales',
        amount: 100.00,
        tenant_id: realTenantId,
      })
      .select()
    
    // Clean up test records
    if (minimalInsert.data) {
      await supabase.from('transactions').delete().eq('document_number', 'TEST-MIN-001')
    }
    if (withCategory.data) {
      await supabase.from('transactions').delete().eq('document_number', 'TEST-CAT-001')
    }
    
    return NextResponse.json({
      realTenantId,
      minimalInsertError: minimalInsert.error ? {
        message: minimalInsert.error.message,
        code: minimalInsert.error.code,
      } : null,
      withCategoryError: withCategory.error ? {
        message: withCategory.error.message,
        code: withCategory.error.code,
      } : null,
      minimalInsertSuccess: !!minimalInsert.data,
      withCategorySuccess: !!withCategory.data,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}
