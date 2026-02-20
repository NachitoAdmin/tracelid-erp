import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { verifyToken } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Protected routes
  const cookies = parse(req.headers.get('cookie') || '');
  const token = cookies['auth-token'];

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role-based redirects
  if (pathname.startsWith('/admin') && decoded.role === 'operator') {
    return NextResponse.redirect(new URL('/operator', req.url));
  }

  if (pathname === '/' && decoded.role === 'operator') {
    return NextResponse.redirect(new URL('/operator', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
