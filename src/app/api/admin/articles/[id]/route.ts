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
    const context = getRequestContext() as any;
    const env = context.env;

    // 2. 기존 기사 정보 조회 (섬네일 변경 확인용)
    const oldArticle = await db.select().from(articles).where(eq(articles.id, articleId)).get();

    // 3. 데이터 업데이트 준비
    const updateData: any = {
      title: body.title,
      content: body.content,
      status: body.status,
      slug: body.slug,
      thumbnailKey: body.thumbnailKey, // 섬네일 키 추가
      updatedAt: new Date(),
    };

    if (body.status === 'published') {
      updateData.publishedAt = new Date();
    }

    // 4. 섬네일이 변경되거나 삭제된 경우 기존 R2 자산 삭제
    if (oldArticle?.thumbnailKey && oldArticle.thumbnailKey !== body.thumbnailKey) {
      // 외부 URL이 아닌 내부 R2 파일인 경우에만 삭제 시도
      if (!oldArticle.thumbnailKey.startsWith('http')) {
        try {
          await env.MEDIA.delete(oldArticle.thumbnailKey);
        } catch (r2Error) {
          console.error('Old Thumbnail Delete Error:', r2Error);
        }
      }
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
