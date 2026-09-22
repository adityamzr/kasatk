import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/wali')) { if (request.nextUrl.pathname === '/wali/login') return NextResponse.next(); if (!request.cookies.get('paud_parent_session')?.value) return NextResponse.redirect(new URL('/wali/login', request.url)); return NextResponse.next(); }
  const session = request.cookies.get('paud_session')?.value;
  if (!session) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/', '/admin/:path*', '/wali/:path*'] };
