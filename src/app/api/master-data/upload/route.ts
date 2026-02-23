import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, tenantId, data } = body

    console.log('tenantId received:', tenantId)

    if (!type || !tenantId || !data || !data.rows) {
      return NextResponse.json(
        { error: 'Missing required fields: type, tenantId, data' },
        { status: 400 }
      )
    }

    console.log(`Processing ${type} upload for tenant ${tenantId}`)
    console.log(`Rows to process: ${data.rows.length}`)

    let result: any

    switch (type) {
      case 'customers':
        result = await uploadCustomers(tenantId, data)
        break
      case 'products':
        result = await uploadProducts(tenantId, data)
        break
      case 'gl_accounts':
        result = await uploadGlAccounts(tenantId, data)
        break
      case 'costs':
        result = await uploadCosts(tenantId, data)
        break
      case 'rebates':
        result = await uploadRebates(tenantId, data)
        break
      default:
        return NextResponse.json(
          { error: `Unknown upload type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully uploaded ${result.count} ${type}`,
    })
  } catch (error: any) {
    console.error('Upload error full:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: error?.message || error?.toString() || 'Upload failed', details: error },
      { status: 500 }
    )
  }
}

async function uploadCustomers(tenantId: string, data: any) {
  const headers = data.headers.map((h: string) => h.toLowerCase().trim())
  const rows = data.rows

  const customers = rows.map((row: string[]) => {
    const customer: any = { tenant_id: tenantId }
    headers.forEach((header: string, index: number) => {
      switch (header) {
        case 'customer_id':
          customer.customer_code = row[index]
          break
        case 'customer_name':
          customer.name = row[index]
          break
        case 'email':
          customer.email = row[index]
          break
        // phone and address columns are ignored (not in customers table)
      }
    })
    return customer
  })

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert(customers)
    .select()

  if (error) {
    console.error('Error inserting customers:', error)
    throw error
  }

  return { count: inserted?.length || customers.length }
}

async function uploadProducts(tenantId: string, data: any) {
  const headers = data.headers.map((h: string) => h.toLowerCase().trim())
  const rows = data.rows

  const products = rows.map((row: string[]) => {
    const product: any = { tenant_id: tenantId }
    headers.forEach((header: string, index: number) => {
      switch (header) {
        case 'product_id':
          product.product_code = row[index]
          break
        case 'product_name':
          product.name = row[index]
          break
        case 'price':
          product.sales_price = parseFloat(row[index]) || 0
          break
        case 'uom':
          product.uom = row[index]
          break
        case 'cost':
          product.standard_cost = parseFloat(row[index]) || 0
          break
      }
    })
    return product
  })

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(products)
    .select()

  if (error) {
    console.error('Error inserting products:', error)
    throw error
  }

  return { count: inserted?.length || products.length }
}

async function uploadGlAccounts(tenantId: string, data: any) {
  const headers = data.headers.map((h: string) => h.toLowerCase().trim())
  const rows = data.rows

  const accounts = rows.map((row: string[]) => {
    const account: any = { tenant_id: tenantId }
    headers.forEach((header: string, index: number) => {
      switch (header) {
        case 'account_code':
          account.account_code = row[index]
          break
        case 'account_name':
          account.name = row[index]
          break
        case 'type':
          account.type = row[index]
          break
        case 'pl_section':
          account.pl_section = row[index]
          break
        case 'is_postable':
          account.is_postable = row[index]?.toLowerCase() === 'true' || row[index] === '1'
          break
        case 'normal_balance':
          account.normal_balance = row[index]?.toUpperCase() || 'DEBIT'
          break
      }
    })
    return account
  })

  const { data: inserted, error } = await supabase
    .from('gl_accounts')
    .insert(accounts)
    .select()

  if (error) {
    console.error('Error inserting gl_accounts:', error)
    throw error
  }

  return { count: inserted?.length || accounts.length }
}

async function uploadCosts(tenantId: string, data: any) {
  const headers = data.headers.map((h: string) => h.toLowerCase().trim())
  const rows = data.rows

  const costs = rows.map((row: string[]) => {
    const cost: any = { tenant_id: tenantId }
    headers.forEach((header: string, index: number) => {
      switch (header) {
        case 'product_id':
          cost.product_id = row[index]
          break
        case 'cost_amount':
          cost.cost_amount = parseFloat(row[index]) || 0
          break
        case 'date':
          cost.date = row[index]
          break
      }
    })
    return cost
  })

  const { data: inserted, error } = await supabase
    .from('product_costs')
    .insert(costs)
    .select()

  if (error) {
    console.error('Error inserting costs:', error)
    throw error
  }

  return { count: inserted?.length || costs.length }
}

async function uploadRebates(tenantId: string, data: any) {
  const headers = data.headers.map((h: string) => h.toLowerCase().trim())
  const rows = data.rows

  const rebates = rows.map((row: string[]) => {
    const rebate: any = { tenant_id: tenantId }
    headers.forEach((header: string, index: number) => {
      switch (header) {
        case 'customer_id':
          rebate.customer_id = row[index]
          break
        case 'product_id':
          rebate.product_id = row[index]
          break
        case 'rebate_amount':
          rebate.rebate_amount = parseFloat(row[index]) || 0
          break
        case 'discount_amount':
          rebate.discount_amount = parseFloat(row[index]) || 0
          break
        case 'valid_from':
          rebate.valid_from = row[index]
          break
        case 'valid_to':
          rebate.valid_to = row[index]
          break
      }
    })
    return rebate
  })

  const { data: inserted, error } = await supabase
    .from('rebates_discounts')
    .insert(rebates)
    .select()

  if (error) {
    console.error('Error inserting rebates:', error)
    throw error
  }

  return { count: inserted?.length || rebates.length }
}
