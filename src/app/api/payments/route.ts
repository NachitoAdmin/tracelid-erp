import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';



export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    let query = supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (tenantId) query = query.eq('tenant_id', tenantId);

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
      vendor_id,
      vendor_name,
      material_id,
      material_name,
      quantity,
      quantity_unit,
      cost_center,
      amount_paid,
      payment_date,
      tenant_id,
    } = body;

    if (!vendor_id || !amount_paid || !payment_date || !tenant_id) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        vendor_id,
        vendor_name,
        material_id,
        material_name,
        quantity: quantity || 1,
        quantity_unit: quantity_unit || 'PCS',
        cost_center,
        amount_paid,
        payment_date,
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
