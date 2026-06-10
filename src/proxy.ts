import { auth } from '@features/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // 에디터/마이 경로: 더모먼트 부원만 접근 가능
  if (pathname.startsWith('/write') || pathname.startsWith('/edit') || pathname.startsWith('/my')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (!session.user.isMomentMember) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 로그인 페이지: 이미 로그인 상태면 홈으로
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/write', '/edit/:path*', '/my', '/login'],
};
