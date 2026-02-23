import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/journal-entries - List journal entries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching journal entries:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('Journal entries GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/journal-entries - Create journal entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenant_id, date, description, account_code, debit, credit, created_by } = body;

    if (!tenant_id || !date || !description || !account_code) {
      return NextResponse.json(
        { error: 'tenant_id, date, description, and account_code are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        tenant_id,
        date,
        description,
        account_code,
        debit: debit || 0,
        credit: credit || 0,
        created_by: created_by || 'system',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating journal entry:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Journal entries POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/journal-entries - Delete journal entry
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting journal entry:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Journal entries DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
