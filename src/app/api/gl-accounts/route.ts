import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';



// GET /api/gl-accounts - List GL accounts
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const isPostable = searchParams.get('isPostable');
    const type = searchParams.get('type');

    let query = supabase
      .from('gl_accounts')
      .select('*')
      .order('account_code', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (isPostable !== null) {
      query = query.eq('is_postable', isPostable === 'true');
    }

    if (type) {
      query = query.eq('type', type);
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

// POST /api/gl-accounts - Create GL account
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const {
      account_code,
      name,
      type,
      pl_section,
      is_postable,
      normal_balance,
      tenant_id,
    } = body;

    if (!account_code || !name || !type || !tenant_id) {
      return NextResponse.json(
        { error: 'account_code, name, type, and tenant_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('gl_accounts')
      .insert({
        account_code,
        name,
        type,
        pl_section: pl_section || '',
        is_postable: is_postable ?? true,
        normal_balance: normal_balance || 'debit',
        tenant_id,
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

// PUT /api/gl-accounts - Update GL account
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('gl_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
