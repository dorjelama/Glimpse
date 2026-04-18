import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('glimpse-token')?.value;
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/view') ||
    pathname.startsWith('/g/');

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
