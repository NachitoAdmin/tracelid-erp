import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Public routes - no auth required (exact matches and startsWith)
  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/auth/register'];
  
  // Check exact matches first
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check startsWith for broader matches
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Read JWT from Authorization header (localStorage sends this)
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

  // Owner only: /api/debug-env, /admin/*
  if (pathname.startsWith('/api/debug-env') || pathname.startsWith('/admin')) {
    if (role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden - Owner only' }, { status: 403 });
    }
  }

  // Admin + Owner: /master-data, /api/customers, /api/products, /api/gl-accounts
  if (pathname.startsWith('/master-data') || 
      pathname.startsWith('/api/customers') ||
      pathname.startsWith('/api/products') ||
      pathname.startsWith('/api/gl-accounts')) {
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin or Owner only' }, { status: 403 });
    }
  }

  // Operator + Admin + Owner: /sales-orders, /api/sales-orders
  if (pathname.startsWith('/sales-orders') || pathname.startsWith('/api/sales-orders')) {
    if (role !== 'owner' && role !== 'admin' && role !== 'operator') {
      return NextResponse.json({ error: 'Forbidden - Operator, Admin, or Owner only' }, { status: 403 });
    }
  }

  // All other routes require authentication (any role)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
