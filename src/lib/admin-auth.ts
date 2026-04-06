import { getRequestContext } from '@cloudflare/next-on-pages';

/** Cloudflare Pages 런타임과 로컬 Node 모두에서 env 읽기 */
export function getBindingsEnv(): Record<string, string | undefined> {
  try {
    const ctx = getRequestContext() as unknown as { env?: Record<string, string | undefined> } | undefined;
    const fromCf = ctx?.env ?? {};
    return { ...process.env, ...fromCf };
  } catch {
    return { ...process.env };
  }
}

export function findEnvKey(env: Record<string, unknown>, target: string): string | undefined {
  const v = env[target];
  if (typeof v === 'string' && v) return v;
  const cleanKey = Object.keys(env).find((k) => k.trim() === target);
  if (cleanKey && typeof env[cleanKey] === 'string') return env[cleanKey] as string;
  return undefined;
}

/** ADMIN_PASSWORD가 설정된 경우 클라이언트에서 보낸 비밀번호와 일치해야 함 */
export function assertAdminAuthorized(passwordFromClient: string | undefined | null): { ok: true } | { ok: false; message: string } {
  const env = getBindingsEnv();
  const required = env.ADMIN_PASSWORD;
  if (required && passwordFromClient !== required) {
    return { ok: false, message: '관리자 인증이 필요합니다. 대시보드의 관리자 비밀번호를 입력한 뒤 다시 시도하세요.' };
  }
  return { ok: true };
}
