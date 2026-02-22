import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/users/all - Returns ALL users across all tenants (owner only)
export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized - Owner access required' }, { status: 403 });
    }

    // Get all users with their tenant info
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        first_name,
        last_name,
        is_active,
        created_at,
        updated_at,
        tenant_id,
        tenant:Tenant(name, country)
      `)
      .order('created_at', { ascending: false });

    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Transform data for frontend
    const enrichedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      tenantId: user.tenant_id,
      tenantName: (user.tenant as any)?.name || 'Unknown',
      tenantCountry: (user.tenant as any)?.country || 'Unknown',
    })) || [];

    // Calculate role distribution
    const roleCounts = enrichedUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      users: enrichedUsers,
      summary: {
        totalUsers: enrichedUsers.length,
        activeUsers: enrichedUsers.filter(u => u.isActive).length,
        inactiveUsers: enrichedUsers.filter(u => !u.isActive).length,
        roleDistribution: roleCounts,
      }
    });

  } catch (error: any) {
    console.error('Error in /api/users/all:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
