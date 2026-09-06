import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = request.cookies.has('calcflow_auth');

  const isProtectedRoute = pathname === '/' || pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/login');

  // Blocca accessi non autenticati lato server
  if (isProtectedRoute && !hasAuth) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Evita che un utente già loggato riveda la schermata di login
  if (isAuthRoute && hasAuth) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login'
  ]
};