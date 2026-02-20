import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const VALID_TRANSACTION_TYPES = ['SALE', 'RETURN', 'REBATE', 'DISCOUNT', 'COST'] as const

type TransactionType = typeof VALID_TRANSACTION_TYPES[number]

async function generateDocumentNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = 'INV'
  
  try {
    const { data: existingCounter } = await supabase
      .from('document_counters')
      .select('*')
      .eq('tenantId', tenantId)
      .eq('prefix', prefix)
      .eq('year', year)
      .single()
    
    let lastNumber = 0
    
    if (existingCounter) {
      lastNumber = existingCounter.last_number || 0
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
  } catch (error) {
    return `${prefix}-${year}-${Date.now().toString().slice(-5)}`
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('createdat', { ascending: false })

    if (error) throw error

    return NextResponse.json(transactions || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tenantId, 
      transactionType, 
      amount, 
      description,
      productId,
      productName,
      customerId,
      customerName,
    } = body

    if (!tenantId || !transactionType || amount === undefined) {
      return NextResponse.json(
        { error: 'tenantId, transactionType, and amount are required' },
        { status: 400 }
      )
    }

    const upperType = transactionType.toUpperCase()
    if (!VALID_TRANSACTION_TYPES.includes(upperType as TransactionType)) {
      return NextResponse.json(
        { error: `Invalid transaction type: ${transactionType}` },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: 'Invalid amount' },
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

    // Build insert data dynamically
    const insertData: any = {
      document_number: documentNumber,
      transaction_type: upperType,
      amount: parsedAmount,
      description: description || null,
      tenant_id: tenantId,
    }

    // Add optional fields if provided
    if (productId) insertData.product_id = productId
    if (productName) insertData.product_name = productName
    if (customerId) insertData.customer_id = customerId
    if (customerName) insertData.customer_name = customerName

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { 
          error: 'Database insert failed', 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error?.message },
      { status: 500 }
    )
  }
}
