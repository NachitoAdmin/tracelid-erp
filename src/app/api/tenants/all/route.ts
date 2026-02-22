import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/tenants/all - Returns ALL tenants with stats (owner only)
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

    // Get all tenants
    const { data: tenants, error: tenantError } = await supabase
      .from('Tenant')
      .select('id, name, country, createdat, updatedat')
      .order('createdat', { ascending: false });

    if (tenantError) {
      console.error('Error fetching tenants:', tenantError);
      return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }

    // Get all users to count per tenant
    const { data: allUsers, error: userError } = await supabase
      .from('users')
      .select('tenant_id');

    if (userError) {
      console.error('Error fetching users:', userError);
    }

    // Get all transactions to count per tenant
    const { data: allTransactions, error: txError } = await supabase
      .from('transactions')
      .select('tenant_id');

    if (txError) {
      console.error('Error fetching transactions:', txError);
    }

    // Count users per tenant
    const userCountMap = new Map<string, number>();
    allUsers?.forEach(u => {
      userCountMap.set(u.tenant_id, (userCountMap.get(u.tenant_id) || 0) + 1);
    });

    // Count transactions per tenant
    const txCountMap = new Map<string, number>();
    allTransactions?.forEach(t => {
      if (t.tenant_id) {
        txCountMap.set(t.tenant_id, (txCountMap.get(t.tenant_id) || 0) + 1);
      }
    });

    // Combine data
    const enrichedTenants = tenants?.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      country: tenant.country,
      createdAt: tenant.createdat,
      updatedAt: tenant.updatedat,
      userCount: userCountMap.get(tenant.id) || 0,
      transactionCount: txCountMap.get(tenant.id) || 0,
    })) || [];

    // Calculate totals
    const totalUsers = enrichedTenants.reduce((sum, t) => sum + t.userCount, 0);
    const totalTransactions = enrichedTenants.reduce((sum, t) => sum + t.transactionCount, 0);

    return NextResponse.json({
      tenants: enrichedTenants,
      summary: {
        totalTenants: enrichedTenants.length,
        totalUsers,
        totalTransactions,
      }
    });

  } catch (error: any) {
    console.error('Error in /api/tenants/all:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
