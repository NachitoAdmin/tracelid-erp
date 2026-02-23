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
      product_id,
      quantity,
      quantity_unit,
      price,
      total_amount,
      tenant_id,
      transaction_type,
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

    const { data, error } = await supabase
      .from('sales_orders')
      .insert({
        sales_order_number,
        customer_id,
        product_id,
        quantity: quantity || 1,
        quantity_unit: quantity_unit || 'PCS',
        price,
        total_amount,
        status: 'pending',
        tenant_id,
        transaction_type: transaction_type || 'SALE',
        country: country || 'US',
        cost_center,
        profit_center,
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
