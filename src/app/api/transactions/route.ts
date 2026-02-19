import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const VALID_TRANSACTION_TYPES = ['SALE', 'RETURN', 'REBATE', 'DISCOUNT', 'COST'] as const
type TransactionType = typeof VALID_TRANSACTION_TYPES[number]

async function generateDocumentNumber(tenantId: string, prefix: string = 'INV'): Promise<string> {
  const year = new Date().getFullYear()
  
  // Get or create counter
  const { data: existingCounter } = await supabase
    .from('document_counters')
    .select('*')
    .eq('tenantId', tenantId)
    .eq('prefix', prefix)
    .eq('year', year)
    .single()
  
  let lastNumber = 0
  
  if (existingCounter) {
    lastNumber = existingCounter.last_number
    await supabase
      .from('document_counters')
      .update({ last_number: lastNumber + 1 })
      .eq('id', existingCounter.id)
  } else {
    await supabase
      .from('document_counters')
      .insert({ tenantId, prefix, year, last_number: 1 })
  }
  
  return `${prefix}-${year}-${String(lastNumber + 1).padStart(5, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const type = searchParams.get('type')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('createdAt', { ascending: false })

    if (type) {
      query = query.eq('transaction_type', type.toUpperCase())
    }

    const { data: transactions, error } = await query

    if (error) throw error

    // Get tenant info for each transaction
    const { data: tenant } = await supabase
      .from('Tenant')
      .select('name, country')
      .eq('id', tenantId)
      .single()

    const transactionsWithTenant = (transactions || []).map(t => ({
      ...t,
      tenant: tenant || { name: 'Unknown', country: 'Unknown' }
    }))

    return NextResponse.json(transactionsWithTenant)
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, transactionType, amount, description } = body

    if (!tenantId || !transactionType || amount === undefined) {
      return NextResponse.json(
        { error: 'tenantId, transactionType, and amount are required' },
        { status: 400 }
      )
    }

    const upperType = transactionType.toUpperCase()
    if (!VALID_TRANSACTION_TYPES.includes(upperType as TransactionType)) {
      return NextResponse.json(
        { error: `Invalid transaction type. Must be one of: ${VALID_TRANSACTION_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('Tenant')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const documentNumber = await generateDocumentNumber(tenantId)

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        document_number: documentNumber,
        transaction_type: upperType,
        amount: parseFloat(amount),
        description,
        tenant_id: tenantId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...transaction,
      tenant: { name: tenant.name, country: tenant.country }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
