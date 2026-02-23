import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Public API routes - no auth required
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Only protect API routes (except auth routes)
  // Pages handle their own auth client-side via localStorage
  if (pathname.startsWith('/api/')) {
    // Read JWT from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const role = user.role;

    // Owner only: /api/debug-env
    if (pathname.startsWith('/api/debug-env')) {
      if (role !== 'owner') {
        return NextResponse.json({ error: 'Forbidden - Owner only' }, { status: 403 });
      }
    }

    // Admin + Owner: /api/customers, /api/products, /api/gl-accounts
    if (pathname.startsWith('/api/customers') ||
        pathname.startsWith('/api/products') ||
        pathname.startsWith('/api/gl-accounts')) {
      if (role !== 'owner' && role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin or Owner only' }, { status: 403 });
      }
    }

    // Operator + Admin + Owner: /api/sales-orders
    if (pathname.startsWith('/api/sales-orders')) {
      if (role !== 'owner' && role !== 'admin' && role !== 'operator') {
        return NextResponse.json({ error: 'Forbidden - Operator, Admin, or Owner only' }, { status: 403 });
      }
    }

    // All other API routes require authentication (any role)
    return NextResponse.next();
  }

  // All page routes - let through, pages handle auth client-side
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
