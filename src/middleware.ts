import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = request.cookies.has('calcflow_auth');

  // 1. Le rotte di incorporamento /embed DEVONO essere sempre pubbliche e intoccabili
  if (pathname.startsWith('/embed')) {
    return NextResponse.next();
  }

  // 2. Protezione delle rotte riservate (dashboard e builder)
  if (pathname.startsWith('/dashboard')) {
    if (!hasAuth) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Se l'utente autenticato visita /login, reindirizza alla dashboard
  if (pathname === '/login' && hasAuth) {
    const dashUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};