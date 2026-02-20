import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const cookies = parse(req.headers.get('cookie') || '');
    const token = cookies['auth-token'];

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: user } = await supabase
      .from('users')
      .select('*, tenant:Tenant(*)')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        tenant: user.tenant,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
