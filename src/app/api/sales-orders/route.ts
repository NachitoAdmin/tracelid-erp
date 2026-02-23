import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// GET /api/sales-orders - List sales orders
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');

    let query = supabase
      .from('sales_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/sales-orders - Create sales order
export async function POST(req: NextRequest) {
    const supabase = getSupabaseClient();
  try {

    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    const {
      country,
      cost_center,
      profit_center,
      customer_id,
      customer_name,
      product_id,
      product_name,
      quantity,
      quantity_unit,
      price,
      total_amount,
      tenant_id,
      transaction_type,
      gl_account_id,
      is_damaged_return,
    } = body;

    // Auto-generate sales_order_number if not provided
    const sales_order_number = body.sales_order_number || `SO-${Date.now()}`;

    if (!customer_id || !tenant_id) {
      return NextResponse.json(
        { error: 'customer_id and tenant_id are required' },
        { status: 400 }
      );
    }

    // Determine GL account based on transaction type
    let finalGlAccountId = gl_account_id;
    
    if (transaction_type === 'SALE') {
      // For SALE: auto-assign via DB trigger (GROSS_REVENUE)
      // Don't set gl_account_id, let the trigger handle it
      finalGlAccountId = null;
    } else if (transaction_type === 'RETURN') {
      // For RETURN: determine based on damage status
      if (is_damaged_return) {
        // Get DAMAGE_COST account (4120)
        const { data: damageAccount } = await supabase
          .from('gl_accounts')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('account_code', '4120')
          .single();
        finalGlAccountId = damageAccount?.id || null;
      } else {
        // Get original sale account (4100)
        const { data: saleAccount } = await supabase
          .from('gl_accounts')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('account_code', '4100')
          .single();
        finalGlAccountId = saleAccount?.id || null;
      }
    }
    // For COST: use the provided gl_account_id

    const { data, error } = await supabase
      .from('sales_orders')
      .insert({
        country: country || 'US',
        cost_center,
        profit_center,
        sales_order_number,
        customer_id,
        customer_name,
        product_id,
        product_name,
        quantity: quantity || 1,
        quantity_unit: quantity_unit || 'PCS',
        price,
        total_amount,
        status: 'pending',
        tenant_id,
        transaction_type: transaction_type || 'SALE',
        gl_account_id: finalGlAccountId,
        is_damaged_return: is_damaged_return || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/sales-orders - Update sales order status
export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
