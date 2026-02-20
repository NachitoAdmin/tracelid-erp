import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, tenantId } = await req.json();

    console.log('Register API called:', { email, firstName, lastName, tenantId: tenantId?.substring(0, 8) + '...' });

    // Validate input
    if (!email || !password || !tenantId) {
      console.log('Missing required fields:', { email: !!email, password: !!password, tenantId: !!tenantId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.log('Error checking existing user:', checkError);
    }

    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    console.log('Password hashed successfully');

    // Check if this is the first user in the tenant
    const { data: tenantUsers, error: tenantError } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId);

    if (tenantError) {
      console.log('Error checking tenant users:', tenantError);
    }

    const role = tenantUsers && tenantUsers.length === 0 ? 'admin' : 'operator';
    console.log('Assigning role:', role, '(tenant has', tenantUsers?.length || 0, 'users)');

    // Create user
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
      console.log('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user: ' + error.message }, { status: 500 });
    }

    console.log('User created successfully:', user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
  } catch (error: any) {
    console.log('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
