import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const paid = searchParams.get('paid');

    let query = supabase
      .from('receivables')
      .select('*')
      .order('received_date', { ascending: false });

    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (paid !== null) {
      const isPaid = paid === 'true';
      query = query.gt('amount_received', 0);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const {
      customer_id,
      customer_name,
      sales_order_number,
      amount_due,
      amount_received,
      status,
      due_date,
      tenant_id,
    } = body;

    if (!sales_order_number || !tenant_id) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('receivables')
      .insert({
        customer_id,
        customer_name,
        sales_order_number,
        amount_due: amount_due || 0,
        amount_received: amount_received || 0,
        status: status || 'unpaid',
        due_date,
        tenant_id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { id, amount_received, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const updates: any = {};
    if (amount_received !== undefined) updates.amount_received = amount_received;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('receivables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
