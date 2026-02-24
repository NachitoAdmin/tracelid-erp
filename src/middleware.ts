import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const OWNER_EMAIL = 'nachitobot888@gmail.com';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow access to login and maintenance pages
  if (pathname === '/login' || pathname === '/maintenance') {
    return NextResponse.next();
  }

  // Check for auth token in cookies (httpOnly) or localStorage (via header if needed)
  // In middleware we can only access cookies, not localStorage
  const token = request.cookies.get('auth-token')?.value;

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token and check if user is the owner
  const decoded = verifyToken(token);

  if (!decoded) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is not the owner, redirect to maintenance page
  if (decoded.email !== OWNER_EMAIL) {
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  // Owner is allowed through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (we handle auth separately there)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
