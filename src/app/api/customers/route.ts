import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY_DEV;

function getSupabaseClient() {
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_KEY_DEV must be set');
  }
  return createClient(supabaseUrl, serviceKey);
}

// GET /api/customers - List customers
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');

    let query = supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,customer_code.ilike.%${search}%`);
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

// POST /api/customers - Create customer
export async function POST(req: NextRequest) {
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_KEY_DEV:', process.env.SUPABASE_SERVICE_KEY_DEV ? 'SET' : 'NOT SET');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
  
  try {
    const supabase = getSupabaseClient();
    const body = await req.json();
    const {
      customer_code,
      name,
      country,
      city,
      email,
      tenant_id,
    } = body;

    if (!customer_code || !name || !tenant_id) {
      return NextResponse.json(
        { error: 'customer_code, name, and tenant_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        customer_code,
        name,
        country: country || '',
        city: city || '',
        email: email || '',
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

// PUT /api/customers - Update customer
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
      .from('customers')
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
