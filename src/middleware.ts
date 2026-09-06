import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = request.cookies.has('calcflow_auth');

  // Solo la dashboard e i suoi sotto-percorsi sono protetti
  const isProtectedRoute = pathname.startsWith('/dashboard');

  // 1. Se tenti di entrare nella dashboard senza essere autenticato -> vai a /login
  if (isProtectedRoute && !hasAuth) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*'
  ]
};