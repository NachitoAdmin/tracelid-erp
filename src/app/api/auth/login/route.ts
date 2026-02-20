import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword, generateToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    console.log('Login attempt for:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get user with tenant info
    const { data: user, error } = await supabase
      .from('users')
      .select('*, tenant:Tenant(id, name, country)')
      .eq('email', email)
      .single();

    console.log('User query result:', { user: user ? 'found' : 'not found', error: error?.message });

    if (error || !user) {
      console.log('User not found or error:', error?.message);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    console.log('Verifying password...');
    const isValid = await verifyPassword(password, user.password_hash);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if active
    if (!user.is_active) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
    }

    // Generate JWT
    const token = generateToken(user.id, user.email, user.role);
    console.log('JWT generated for user:', user.id);

    // Set HTTP-only cookie
    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenant: user.tenant || { id: user.tenant_id, name: 'Unknown' },
      },
    };
    
    console.log('Login successful, returning:', JSON.stringify(responseData));

    const response = NextResponse.json(responseData);
    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
