import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VALID_TRANSACTION_TYPES = ['SALE', 'RETURN', 'REBATE', 'DISCOUNT', 'COST'] as const

type TransactionType = typeof VALID_TRANSACTION_TYPES[number]

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    throw new Error('Missing Supabase credentials')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

async function getNextDocumentNumber(supabase: any, tenantId: string, prefix: string, year: number): Promise<number> {
  try {
    // Use RPC or a more reliable method to get and increment the counter
    // First, try to get existing counter
    const { data: existing, error: selectError } = await supabase
      .from('document_counters')
      .select('id, last_number')
      .eq('tenantId', tenantId)
      .eq('prefix', prefix)
      .eq('year', year)
      .single()
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error fetching counter:', selectError)
    }
    
    let nextNumber: number
    
    if (existing) {
      // Counter exists - increment it
      const currentNumber = existing.last_number || 0
      nextNumber = currentNumber + 1
      
      const { error: updateError } = await supabase
        .from('document_counters')
        .update({ last_number: nextNumber })
        .eq('id', existing.id)
      
      if (updateError) {
        console.error('Error updating counter:', updateError)
        // Fallback: use timestamp
        return Date.now() % 100000
      }
    } else {
      // No counter exists - create one starting at 1
      nextNumber = 1
      
      const { error: insertError } = await supabase
        .from('document_counters')
        .insert({ 
          tenantId, 
          prefix, 
          year, 
          last_number: nextNumber 
        })
      
      if (insertError) {
        console.error('Error inserting counter:', insertError)
        // Fallback: use timestamp
        return Date.now() % 100000
      }
    }
    
    return nextNumber
  } catch (err) {
    console.error('Exception in getNextDocumentNumber:', err)
    // Fallback to timestamp-based number
    return Date.now() % 100000
  }
}

async function generateDocumentNumber(
  supabase: any, 
  tenantId: string, 
  transactionType: string, 
  referenceSaleId?: string
): Promise<string> {
  const year = new Date().getFullYear()
  
  // RETURN gets Credit Note (CN) prefix
  const prefix = transactionType === 'RETURN' ? 'CN' : 'INV'
  
  try {
    // For DISCOUNT/REBATE/COST on an existing sale, use the sale's document number
    if (referenceSaleId && ['DISCOUNT', 'REBATE', 'COST'].includes(transactionType)) {
      const { data: sale } = await supabase
        .from('transactions')
        .select('document_number')
        .eq('id', referenceSaleId)
        .single()
      
      if (sale?.document_number) {
        return sale.document_number
      }
    }
    
    // Get next number for this prefix/tenant/year
    const nextNumber = await getNextDocumentNumber(supabase, tenantId, prefix, year)
    
    return `${prefix}-${year}-${String(nextNumber).padStart(5, '0')}`
  } catch (error) {
    console.error('Error generating document number:', error)
    // Fallback to timestamp-based number
    return `${prefix}-${year}-${Date.now().toString().slice(-5)}`
  }
}

export async function GET(request: NextRequest) {
  console.log('=== TRANSACTIONS GET API CALLED ===')
  
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    console.log('Tenant ID:', tenantId)

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

    if (error) {
      console.error('GET Error:', error)
      throw error
    }

    console.log('Found', transactions?.length || 0, 'transactions')
    return NextResponse.json(transactions || [])
  } catch (error: any) {
    console.error('GET API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('=== TRANSACTIONS POST API CALLED ===')
  
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { 
      tenantId, 
      transactionType, 
      amount, 
      description,
      productId,
      productName,
      customerId,
      customerName,
      referenceSaleId,
    } = body

    console.log('Extracted values:', { tenantId, transactionType, amount, description })

    if (!tenantId || !transactionType || amount === undefined) {
      console.log('Validation failed:', { tenantId, transactionType, amount })
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
    console.log('Checking tenant:', tenantId)
    const { data: tenant, error: tenantError } = await supabase
      .from('Tenant')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantError) {
      console.log('Tenant query error:', tenantError)
    }
    
    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found', details: tenantError?.message },
        { status: 404 }
      )
    }
    console.log('Tenant found:', tenant.name)

    // Generate unique document number
    const documentNumber = await generateDocumentNumber(supabase, tenantId, upperType, referenceSaleId)
    console.log('Generated document number:', documentNumber)

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

    console.log('Insert data:', JSON.stringify(insertData, null, 2))

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      return NextResponse.json(
        { 
          error: 'Database insert failed', 
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      )
    }

    console.log('Transaction created successfully:', transaction)
    console.log('=== TRANSACTIONS POST API COMPLETED ===')
    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    console.error('=== TRANSACTIONS POST API ERROR ===', error)
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error?.message },
      { status: 500 }
    )
  }
}
