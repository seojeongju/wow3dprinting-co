import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');

    const context = getRequestContext() as any;
    const env = context.env;
    
    // 비밀번호 검증
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: '인증되지 않은 접근입니다.' }, { status: 401 });
    }

    const db = getDb();
    const allArticles = await db.select().from(articles).orderBy(articles.publishedAt).all();
    
    // 최신순 정렬 (ID 또는 정렬 필드 기준)
    const sortedArticles = allArticles.sort((a, b) => (b.id || 0) - (a.id || 0));

    return NextResponse.json({
      success: true,
      articles: sortedArticles,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: '목록 조회 오류', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password');
    const articleId = searchParams.get('id');

    if (!articleId) {
      return NextResponse.json({ success: false, message: '기사 ID가 필요합니다.' }, { status: 400 });
    }

    const context = getRequestContext() as any;
    const env = context.env;

    // 비밀번호 검증
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: '인증되지 않은 접근입니다.' }, { status: 401 });
    }

    const db = getDb();
    const id = parseInt(articleId, 10);

    // 썸네일 키 조회 후 R2에서도 삭제
    const article = await db.select().from(articles).where(eq(articles.id, id)).get();
    if (article?.thumbnailKey && !article.thumbnailKey.startsWith('http')) {
      try { await env.MEDIA.delete(article.thumbnailKey); } catch {}
    }

    // DB에서 삭제
    await db.delete(articles).where(eq(articles.id, id)).run();

    return NextResponse.json({ success: true, message: '기사가 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: '삭제 중 오류', error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // 필수 필드 추출
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const categoryIdRaw = formData.get('categoryId');
    const categoryId = categoryIdRaw ? parseInt(categoryIdRaw as string, 10) : null;
    const status = formData.get('status') as string || 'draft';
    const authorId = formData.get('authorId') as string || 'admin';
    const password = formData.get('password') as string;
    // 게시 대상 사이트 (기본값: 'both' - 두 사이트 동시 게시)
    const targetSitesRaw = formData.get('targetSites') as string || 'both';
    const targetSites = ['times', 'wow3d', 'both'].includes(targetSitesRaw) ? targetSitesRaw as 'times' | 'wow3d' | 'both' : 'both';

    const thumbnail = formData.get('thumbnail') as Blob | null;

    // TODO: 간단한 비밀번호 검증 (실 환경에서는 env.ADMIN_PASSWORD나 Cloudflare Access 사용)
    const context = getRequestContext() as any;
    const env = context.env;
    
    if (env.ADMIN_PASSWORD && password !== env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: '인증 실패: 잘못된 비밀번호입니다.' }, { status: 401 });
    }

    if (!title || !slug || !content) {
      return NextResponse.json({ success: false, message: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 슬러그 고유성 확보 (Smart Slug Generation)
    const db = getDb();
    let finalSlug = slug;
    let suffix = 1;
    
    while (true) {
      const existingArticle = await db.select().from(articles).where(eq(articles.slug, finalSlug)).get();
      if (!existingArticle) break;
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }

    let thumbnailKey: string | null = null;

    // R2에 썸네일 업로드 처리
    if (thumbnail && thumbnail.size > 0) {
      const buffer = await thumbnail.arrayBuffer();
      // 확장자 추출
      const fileName = (thumbnail as File).name || 'thumbnail.png';
      const extension = fileName.split('.').pop() || 'png';
      
      // 고유 키 생성 (최종 확정된 finalSlug 사용)
      thumbnailKey = `articles/${Date.now()}-${finalSlug}.${extension}`;
      
      // 버퍼를 스트림으로 직접 전달하거나 ArrayBuffer를 사용
      await env.MEDIA.put(thumbnailKey, buffer, {
        httpMetadata: {
          contentType: thumbnail.type || 'application/octet-stream',
        }
      });
    }

    // D1에 기사 정보 저장
    const newArticle = {
      title,
      slug: finalSlug, // 최종 확정된 고유 슬러그 저장
      content,
      categoryId,
      authorId,
      status: status as any,
      targetSites, // 게시 대상 사이트
      thumbnailKey,
      publishedAt: status === 'published' ? new Date() : null,
    };

    const result = await db.insert(articles).values(newArticle).returning().get();

    return NextResponse.json({
      success: true,
      message: '기사가 성공적으로 등록되었습니다.',
      article: result,
    });

  } catch (error: any) {
    console.error('Article Upload Error:', error);
    return NextResponse.json(
      { success: false, message: '기사 등록 중 서버 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
