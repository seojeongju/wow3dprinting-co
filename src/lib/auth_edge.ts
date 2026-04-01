import { cookies } from 'next/headers';
import { getDb } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const AUTH_COOKIE_NAME = 'admin_session';

/**
 * Edge Runtime에서 사용 가능한 초기 관리자 세션 검증 헬퍼
 */
export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  // 세션 ID가 사용자 ID인 간단한 방식 (실제 운영 시에는 JWT 또는 세션 테이블 권장)
  const db = getDb();
  const user = await db.select().from(users).where(eq(users.id, sessionId)).get();

  return user || null;
}

/**
 * 관리자 권한 확인
 */
export async function isAdmin() {
  const user = await getSessionUser();
  return user?.role === 'admin';
}

/**
 * 편집자 이상 권한 확인 (Admin, Editor)
 */
export async function isEditor() {
  const user = await getSessionUser();
  return user?.role === 'admin' || user?.role === 'editor';
}
