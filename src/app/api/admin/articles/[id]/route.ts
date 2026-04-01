import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth_edge';

export const runtime = 'edge';

/**
 * 기사 수정 (PATCH)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);
    const user = await getSessionUser();

    // 1. 권한 확인
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json() as any;
    const db = getDb();

    // 2. 데이터 업데이트
    const updateData: any = {
      title: body.title,
      content: body.content,
      status: body.status,
      slug: body.slug,
      updatedAt: new Date(),
    };

    if (body.status === 'published') {
      updateData.publishedAt = new Date();
    }

    await db.update(articles)
      .set(updateData)
      .where(eq(articles.id, articleId))
      .run();

    return NextResponse.json({ success: true, message: '기사가 수정되었습니다.' });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json({ message: '수정 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 기사 삭제 (DELETE)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = parseInt(id, 10);
    const user = await getSessionUser();

    // 1. 권한 확인
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: '관리자만 삭제할 수 있습니다.' }, { status: 403 });
    }

    const db = getDb();
    const context = getRequestContext() as any;
    const env = context.env;

    // 2. 삭제 전 썸네일 정보 가져오기 (R2 삭제용)
    const article = await db.select().from(articles).where(eq(articles.id, articleId)).get();

    if (article?.thumbnailKey) {
      try {
        await env.MEDIA.delete(article.thumbnailKey);
      } catch (r2Error) {
        console.error('R2 Delete Error:', r2Error);
      }
    }

    // 3. DB 삭제
    await db.delete(articles).where(eq(articles.id, articleId)).run();

    return NextResponse.json({ success: true, message: '기사가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('Delete Error:', error);
    return NextResponse.json({ message: '삭제 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
