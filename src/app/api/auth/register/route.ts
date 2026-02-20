import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, tenantId } = await req.json();

    // Validate input
    if (!email || !password || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (first user in tenant becomes admin, others become operator)
    const { data: tenantUsers } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId);

    const role = tenantUsers && tenantUsers.length === 0 ? 'admin' : 'operator';

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        role,
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
