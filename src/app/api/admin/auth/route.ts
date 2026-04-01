import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const runtime = 'edge';

const AUTH_COOKIE_NAME = 'admin_session';

/**
 * 로그인 로직 (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as any;
    const db = getDb();

    // 1. 사용자 조회
    const user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 401 });
    }

    // 2. 비밀번호 검증 (임시: 평문 비교, 운영 시 해싱 비교 권장)
    if (user.passwordHash !== password) {
      return NextResponse.json({ message: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    // 3. 세션 쿠키 설정 (보안 강화: HttpOnly, Secure)
    const response = NextResponse.json({ 
      message: '로그인 성공!',
      user: { id: user.id, name: user.name, role: user.role }
    });

    (await cookies()).set(AUTH_COOKIE_NAME, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7일 유지
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 로그아웃 로직 (DELETE)
 */
export async function DELETE() {
  const response = NextResponse.json({ message: '로그아웃 성공!' });
  (await cookies()).delete(AUTH_COOKIE_NAME);
  return response;
}
