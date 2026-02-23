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
    const updates: any = { delivery_status, updated_at: new Date().toISOString() };
    if (delivery_date) updates.delivery_date = delivery_date;

    const { data, error } = await supabase
      .from('delivery_status')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    const updates: any = { delivery_status, updated_at: new Date().toISOString() };
    if (delivery_date) updates.delivery_date = delivery_date;

    const { data, error } = await supabase
      .from('delivery_status')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
