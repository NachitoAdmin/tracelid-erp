import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword, generateToken } from '@/lib/auth';
import { serialize } from 'cookie';

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log('=== LOGIN API CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.log('Failed to parse request body:', e);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { email, password } = body;
    console.log('Login attempt for:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    console.log('Creating Supabase client...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY_DEV || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Querying user from database...');
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

    console.log('Verifying password...');
    const isValid = await verifyPassword(password, user.password_hash);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
    }

    console.log('Generating JWT...');
    const token = generateToken(user.id, user.email, user.role);
    console.log('JWT generated for user:', user.id);

    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    const responseData = {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenant: user.tenant || { id: user.tenant_id, name: 'Unknown' },
      },
    };
    
    console.log('Login successful, returning user data');

    const response = NextResponse.json(responseData, { status: 200 });
    response.headers.set('Set-Cookie', cookie);
    console.log('=== LOGIN API COMPLETED ===');
    return response;
  } catch (error: any) {
    console.error('=== LOGIN API ERROR ===', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
