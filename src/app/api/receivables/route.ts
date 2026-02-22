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
      sales_order_number,
      amount_received,
      bank_id,
      account_id,
      received_date,
      tenant_id,
    } = body;

    if (!customer_id || !sales_order_number || !tenant_id) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('receivables')
      .insert({
        customer_id,
        sales_order_number,
        amount_received: amount_received || 0,
        bank_id,
        account_id,
        received_date,
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
