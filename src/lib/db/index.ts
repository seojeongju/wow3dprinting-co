import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import * as schema from './schema';

export const getDb = () => {
  const context = getRequestContext();
  
  if (!context || !context.env || !context.env.DB) {
    // 런타임에서 바인딩을 찾을 수 없는 경우 명시적 에러 발생 (상위 try-catch에서 잡히도록 함)
    throw new Error('Cloudflare D1 Database binding "DB" not found. Please verify bindings and redeploy.');
  }
  
  const { env } = context as any;
  return drizzle(env.DB, { schema });
};

// types 지원을 위한 전역 env 정의 (선택 사항)
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
  }
}
