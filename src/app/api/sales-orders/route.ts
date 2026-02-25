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
      customer_id,
      product_id,
      quantity,
      price,
      total_amount,
      tenant_id,
    } = body;

    // Auto-generate sales_order_number if not provided
    const sales_order_number = body.sales_order_number || `SO-${Date.now()}`;

    if (!customer_id || !tenant_id) {
      return NextResponse.json(
        { error: 'customer_id and tenant_id are required' },
        { status: 400 }
      );
    }

    // Build insert object with only core fields
    const insertData: any = {
      sales_order_number,
      customer_id,
      tenant_id,
      status: 'pending',
      customer_name: body.customer_name || null,
      product_name: body.product_name || null,
      quantity_unit: body.quantity_unit || null,
    };

    // Only add optional fields if they exist in body
    if (product_id) insertData.product_id = product_id;
    if (quantity !== undefined) insertData.quantity = quantity;
    if (price !== undefined) insertData.price = price;
    if (total_amount !== undefined) insertData.total_amount = total_amount;

    console.log('Inserting:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('sales_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Create delivery_status record for tracking
    try {
      await supabase.from('delivery_status').insert({
        sales_order_number: sales_order_number,
        tenant_id: tenant_id,
        delivery_status: 'pending',
        delivery_date: null,
      });
      console.log('Delivery status record created for:', sales_order_number);
    } catch (deliveryErr: any) {
      console.error('Failed to create delivery status:', deliveryErr.message);
      // Don't fail the request if delivery_status creation fails
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

// DELETE /api/sales-orders - Delete sales order
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/sales-orders - Delete sales order
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
