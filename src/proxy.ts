import { NextResponse, type NextRequest } from 'next/server';

/**
 * A deploy with no DATABASE_URL cannot serve any storefront route, because
 * every one of them reads the catalog. Rather than returning a stack trace on
 * each request, send traffic to /setup with instructions. Once the variable is
 * present this is a no-op on every request.
 */
export function proxy(request: NextRequest) {
  if (process.env.DATABASE_URL) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === '/setup' || pathname.startsWith('/img/')) return NextResponse.next();

  // Health checks and webhooks should still get a truthful status code.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'The database is not configured for this deployment.' },
      { status: 503 },
    );
  }

  return NextResponse.rewrite(new URL('/setup', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
