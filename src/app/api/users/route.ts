import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { verifyToken, hashPassword } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const cookies = parse(req.headers.get('cookie') || '');
    const token = cookies['auth-token'] || '';
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get current user's tenant
    const { data: currentUser } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', decoded.userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all users in tenant
    const { data: users } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, is_active, created_at')
      .eq('tenant_id', currentUser.tenant_id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const cookies = parse(req.headers.get('cookie') || '');
    const token = cookies['auth-token'] || '';
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, password, role, firstName, lastName } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get current user's tenant
    const { data: currentUser } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', decoded.userId)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        role: role || 'operator',
        tenant_id: currentUser.tenant_id,
        first_name: firstName,
        last_name: lastName,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Verify admin
    const cookies = parse(req.headers.get('cookie') || '');
    const token = cookies['auth-token'] || '';
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, role, isActive } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const updates: any = {};
    if (role) updates.role = role;
    if (typeof isActive === 'boolean') updates.is_active = isActive;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
