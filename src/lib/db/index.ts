import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import * as schema from './schema';

export const getDb = () => {
  const { env } = getRequestContext() as any;
  if (!env || !env.DB) {
    throw new Error('Database binding "DB" is missing. Please check Cloudflare Pages settings.');
  }
  return drizzle(env.DB, { schema });
};

// types 지원을 위한 전역 env 정의 (선택 사항)
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
  }
}
