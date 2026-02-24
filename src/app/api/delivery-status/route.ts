import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';



export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');

    let query = supabase
      .from('delivery_status')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (status) query = query.eq('delivery_status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { id, delivery_status, delivery_date } = body;

    if (!id || !delivery_status) {
      return NextResponse.json({ error: 'id and delivery_status required' }, { status: 400 });
    }

    const updates: any = { delivery_status, updated_at: new Date().toISOString() };
    if (delivery_date) updates.delivery_date = delivery_date;

    const { data, error } = await supabase
      .from('delivery_status')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If status is delivered and we have the record, create an invoice
    if (delivery_status === 'delivered' && data) {
      try {
        const existingDelivery = data;
        // Fetch the sales order to get all required invoice fields
        const { data: salesOrder } = await supabase
          .from('sales_orders')
          .select('*')
          .eq('sales_order_number', existingDelivery.sales_order_number)
          .single();

        if (salesOrder) {
          // Check if invoice already exists
          const { data: existingInvoice } = await supabase
            .from('sales_invoices')
            .select('id')
            .eq('sales_order_number', existingDelivery.sales_order_number)
            .single();

          if (!existingInvoice) {
            const invoiceNumber = `INV-${Date.now()}`;
            await supabase
              .from('sales_invoices')
              .insert({
                invoice_number: invoiceNumber,
                sales_order_number: salesOrder.sales_order_number,
                tenant_id: salesOrder.tenant_id,
                customer_id: salesOrder.customer_id || null,
                customer_name: salesOrder.customer_name || null,
                product_id: salesOrder.product_id || null,
                product_name: salesOrder.product_name || null,
                quantity: salesOrder.quantity || null,
                quantity_unit: salesOrder.quantity_unit || null,
                price: salesOrder.price || null,
                total_amount: salesOrder.total_amount || null,
                invoice_date: new Date().toISOString().split('T')[0],
                status: 'unpaid',
              });
          }
        }
      } catch (invoiceErr: any) {
        console.error('Invoice creation error:', invoiceErr.message);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT handler - same as PATCH for compatibility
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { id, delivery_status, delivery_date } = body;

    if (!id || !delivery_status) {
      return NextResponse.json({ error: 'id and delivery_status required' }, { status: 400 });
    }

    const updates: any = { delivery_status, updated_at: new Date().toISOString() };
    if (delivery_date) updates.delivery_date = delivery_date;

    const { data, error } = await supabase
      .from('delivery_status')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If status is delivered and we have the record, create an invoice
    if (delivery_status === 'delivered' && data) {
      try {
        const existingDelivery = data;
        // Fetch the sales order to get all required invoice fields
        const { data: salesOrder } = await supabase
          .from('sales_orders')
          .select('*')
          .eq('sales_order_number', existingDelivery.sales_order_number)
          .single();

        if (salesOrder) {
          // Check if invoice already exists
          const { data: existingInvoice } = await supabase
            .from('sales_invoices')
            .select('id')
            .eq('sales_order_number', existingDelivery.sales_order_number)
            .single();

          if (!existingInvoice) {
            const invoiceNumber = `INV-${Date.now()}`;
            await supabase
              .from('sales_invoices')
              .insert({
                invoice_number: invoiceNumber,
                sales_order_number: salesOrder.sales_order_number,
                tenant_id: salesOrder.tenant_id,
                customer_id: salesOrder.customer_id || null,
                customer_name: salesOrder.customer_name || null,
                product_id: salesOrder.product_id || null,
                product_name: salesOrder.product_name || null,
                quantity: salesOrder.quantity || null,
                quantity_unit: salesOrder.quantity_unit || null,
                price: salesOrder.price || null,
                total_amount: salesOrder.total_amount || null,
                invoice_date: new Date().toISOString().split('T')[0],
                status: 'unpaid',
              });
          }
        }
      } catch (invoiceErr: any) {
        console.error('Invoice creation error:', invoiceErr.message);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
