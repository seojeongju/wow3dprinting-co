import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * 멀티 사이트 미들웨어
 * 접속 도메인(Host 헤더)을 감지하여 x-site-id 헤더를 주입합니다.
 *
 * wow3dprinting.co.kr → site='times' (3D프린팅타임즈)
 * wow3dprinting.com   → site='wow3d' (와우3D프린팅타임즈)
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl;

  // 사이트 ID 결정
  let siteId: 'times' | 'wow3d' = 'times'; // 기본값: 기존 사이트

  if (host.includes('wow3dprinting.com') && !host.includes('wow3dprinting.co.kr')) {
    // wow3dprinting.com → 와우3D프린팅타임즈 (신규 사이트)
    siteId = 'wow3d';
  }

  // 요청 헤더에 site-id 추가하여 페이지 컴포넌트로 전달
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-site-id', siteId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 미들웨어 적용 경로: /admin, /api, /_next, /favicon 등 정적 자원 제외
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
