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

    console.log('Updating delivery_status to:', delivery_status, 'length:', delivery_status?.length);

    // Fetch existing delivery record first
    const { data: existingDelivery, error: fetchError } = await supabase
      .from('delivery_status')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
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

    console.log('Delivery updated to:', delivery_status);
    console.log('Fetched delivery record:', JSON.stringify(existingDelivery));

    // If status is delivered, check if invoice exists and create one if not
    if (delivery_status === 'delivered' && existingDelivery) {
      try {
        // Check if invoice already exists for this sales_order_number
        const { data: existingInvoice, error: existingError } = await supabase
          .from('sales_invoices')
          .select('id')
          .eq('sales_order_number', existingDelivery.sales_order_number)
          .single();

        console.log('Existing invoice check:', JSON.stringify(existingInvoice));
        if (existingError) {
          console.log('Existing invoice check error:', existingError.message);
        }

        if (!existingInvoice) {
          // No invoice exists, create one
          const invoiceNumber = `INV-${Date.now()}`;
          const { data: invoiceResult, error: insertError } = await supabase
            .from('sales_invoices')
            .insert({
              invoice_number: invoiceNumber,
              sales_order_number: existingDelivery.sales_order_number,
              tenant_id: existingDelivery.tenant_id,
              invoice_date: new Date().toISOString().split('T')[0],
            })
            .select()
            .single();

          console.log('Invoice insert result:', JSON.stringify(invoiceResult));
          if (insertError) {
            console.log('Invoice insert error:', insertError.message);
          }
          console.log('Invoice created:', invoiceNumber);
        } else {
          console.log('Invoice already exists for sales order:', existingDelivery.sales_order_number);
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

    console.log('Updating delivery_status to:', delivery_status, 'length:', delivery_status?.length);

    // Fetch existing delivery record first
    const { data: existingDelivery, error: fetchError } = await supabase
      .from('delivery_status')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
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

    console.log('Delivery updated to:', delivery_status);
    console.log('Fetched delivery record:', JSON.stringify(existingDelivery));

    // If status is delivered, check if invoice exists and create one if not
    if (delivery_status === 'delivered' && existingDelivery) {
      try {
        // Check if invoice already exists for this sales_order_number
        const { data: existingInvoice, error: existingError } = await supabase
          .from('sales_invoices')
          .select('id')
          .eq('sales_order_number', existingDelivery.sales_order_number)
          .single();

        console.log('Existing invoice check:', JSON.stringify(existingInvoice));
        if (existingError) {
          console.log('Existing invoice check error:', existingError.message);
        }

        if (!existingInvoice) {
          // No invoice exists, create one
          const invoiceNumber = `INV-${Date.now()}`;
          const { data: invoiceResult, error: insertError } = await supabase
            .from('sales_invoices')
            .insert({
              invoice_number: invoiceNumber,
              sales_order_number: existingDelivery.sales_order_number,
              tenant_id: existingDelivery.tenant_id,
              invoice_date: new Date().toISOString().split('T')[0],
            })
            .select()
            .single();

          console.log('Invoice insert result:', JSON.stringify(invoiceResult));
          if (insertError) {
            console.log('Invoice insert error:', insertError.message);
          }
          console.log('Invoice created:', invoiceNumber);
        } else {
          console.log('Invoice already exists for sales order:', existingDelivery.sales_order_number);
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
