import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';

export const runtime = 'edge';

type NormalizeRequest = {
  password?: string;
  dryRun?: boolean;
  limit?: number;
  onlySlugPrefix?: string;
};

function parseDateSafe(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const normalized = value < 1_000_000_000_000 ? value * 1000 : value;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as NormalizeRequest;
    const dryRun = body.dryRun === true;
    const requestedPrefix = (body.onlySlugPrefix || 'migrated-').trim();
    const slugPrefix = requestedPrefix.length > 0 ? requestedPrefix : 'migrated-';
    const limit =
      typeof body.limit === 'number' && Number.isFinite(body.limit) && body.limit > 0
        ? Math.floor(body.limit)
        : null;

    const context = getRequestContext() as any;
    const env = context.env;

    if (env.ADMIN_PASSWORD && body.password !== env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: '인증 실패: 잘못된 비밀번호입니다.' },
        { status: 401 }
      );
    }

    const db = getDb();
    const slugLikePattern = `${slugPrefix}%`;
    const migratedRows = await db
      .select()
      .from(articles)
      .where(sql`${articles.slug} LIKE ${slugLikePattern}`)
      .all();

    let scanned = 0;
    let fixed = 0;
    const candidates: Array<{ id: number; slug: string; reasons: string[] }> = [];

    for (const row of migratedRows) {
      if (limit !== null && scanned >= limit) break;
      scanned++;
      const patch: Partial<typeof articles.$inferInsert> = {};
      const reasons: string[] = [];

      if (typeof row.authorId !== 'string' || row.authorId.trim().length === 0) {
        patch.authorId = 'admin';
        reasons.push('authorId');
      }

      if (typeof row.content !== 'string' || row.content.trim().length === 0) {
        patch.content = '(마이그레이션 데이터 정리로 본문이 보정되었습니다.)';
        reasons.push('content');
      }

      if (row.status === 'published') {
        const published = parseDateSafe(row.publishedAt);
        if (!published) {
          patch.publishedAt = parseDateSafe(row.updatedAt) ?? new Date();
          reasons.push('publishedAt');
        }
      }

      const needsFix = reasons.length > 0;
      if (!needsFix) continue;

      candidates.push({ id: row.id, slug: row.slug, reasons });

      if (!dryRun) {
        await db
          .update(articles)
          .set({
            ...patch,
            updatedAt: new Date(),
          })
          .where(and(eq(articles.id, row.id), sql`${articles.slug} LIKE ${slugLikePattern}`))
          .run();
      }

      fixed++;
    }

    return NextResponse.json({
      success: true,
      dryRun,
      slugPrefix,
      limit,
      matchedTotal: migratedRows.length,
      scanned,
      fixed,
      candidates: candidates.slice(0, 50),
      message: dryRun
        ? '점검 미리보기 완료 (실제 수정 없음)'
        : 'migrated 기사 데이터 정리 완료',
    });
  } catch (error: any) {
    console.error('Normalize migrated articles failed:', error);
    return NextResponse.json(
      { success: false, message: '정리 작업 중 오류가 발생했습니다.', error: error?.message || 'unknown' },
      { status: 500 }
    );
  }
}
