import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const categories: Record<string, string[]> = {
  SALE: ['Product Sales', 'Service Revenue', 'Consulting', 'Software License', 'Hardware', 'Subscription'],
  RETURN: ['Product Return', 'Service Cancellation', 'Refund', 'Defective Item', 'Wrong Item'],
  REBATE: ['Volume Rebate', 'Loyalty Rebate', 'Promotional Rebate', 'Seasonal Rebate'],
  DISCOUNT: ['Early Payment', 'Bulk Order', 'Loyalty Discount', 'Promotional', 'Referral'],
  COST: ['Office Supplies', 'Marketing', 'Travel', 'Software', 'Utilities', 'Rent', 'Salaries', 'Maintenance'],
}

const customers = ['Acme Corp', 'Global Tech', 'EuroMart', 'AsiaTrade', 'Local Business', 'Enterprise Co', 'Startup Inc']

function generateDocumentNumber(prefix: string, index: number): string {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(index + 1).padStart(5, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    console.log('Seed request for tenantId:', tenantId)
    
    if (!tenantId || tenantId === 'all') {
      // Get first tenant if none specified
      const { data: firstTenant } = await supabase
        .from('Tenant')
        .select('id')
        .limit(1)
        .single()
      
      if (!firstTenant) {
        return NextResponse.json(
          { error: 'No tenant found to seed data for' },
          { status: 400 }
        )
      }
      
      return seedForTenant(firstTenant.id)
    }

    return seedForTenant(tenantId)
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed data', details: error?.message },
      { status: 500 }
    )
  }
}

async function seedForTenant(tenantId: string) {
  // Verify tenant exists
  const { data: tenant, error: tenantError } = await supabase
    .from('Tenant')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: 'Tenant not found', details: tenantId },
      { status: 404 }
    )
  }

  // Create 12 diverse transactions
  const transactions = []
  const types = ['SALE', 'SALE', 'SALE', 'SALE', 'SALE', 'RETURN', 'DISCOUNT', 'COST', 'COST', 'REBATE', 'SALE', 'RETURN']
  
  for (let i = 0; i < 12; i++) {
    const type = types[i]
    let amount: number
    
    switch(type) {
      case 'SALE':
        amount = 500 + Math.random() * 4500
        break
      case 'RETURN':
        amount = -(100 + Math.random() * 800)
        break
      case 'COST':
        amount = -(200 + Math.random() * 1000)
        break
      case 'DISCOUNT':
      case 'REBATE':
        amount = -(50 + Math.random() * 300)
        break
      default:
        amount = 100 + Math.random() * 500
    }
    
    const category = categories[type][Math.floor(Math.random() * categories[type].length)]
    const customer = customers[Math.floor(Math.random() * customers.length)]
    
    // Random date in last 60 days
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 60))
    
    transactions.push({
      document_number: generateDocumentNumber(type.substring(0, 3), i),
      transaction_type: type,
      category,
      amount: Math.round(Math.abs(amount) * 100) / 100,
      description: `${category} - ${customer}`,
      tenant_id: tenantId,
      createdAt: date.toISOString(),
    })
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions)
    .select()

  if (error) {
    console.error('Insert error:', error)
    return NextResponse.json(
      { error: 'Failed to insert transactions', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Created ${data?.length || 0} transactions for tenant ${tenant.name}`,
    count: data?.length || 0,
    tenantId,
  })
}
