import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { verifyToken } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Public routes - no auth required
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/api/auth') ||
      pathname === '/api/tenants') {
    return NextResponse.next();
  }

  // For client-side rendered pages, let the client handle auth
  // The dashboard uses localStorage, not cookies
  // Only protect API routes and server-rendered pages
  if (pathname.startsWith('/api/')) {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parse(cookieHeader);
    const token = cookies['auth-token'];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  // For pages, let them handle auth client-side
  // The dashboard component checks localStorage for user data
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
