import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

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

    // 슬러그 중복 검사
    const db = getDb();
    const existingArticle = await db.select().from(articles).where(eq(articles.slug, slug)).get();
    
    if (existingArticle) {
      return NextResponse.json({ success: false, message: '이미 존재하는 슬러그입니다. 다른 슬러그를 사용해주세요.' }, { status: 409 });
    }

    let thumbnailKey: string | null = null;

    // R2에 썸네일 업로드 처리
    if (thumbnail && thumbnail.size > 0) {
      const buffer = await thumbnail.arrayBuffer();
      // 확장자 추출
      const fileName = (thumbnail as File).name || 'thumbnail.png';
      const extension = fileName.split('.').pop() || 'png';
      
      // 고유 키 생성
      thumbnailKey = `articles/${Date.now()}-${slug}.${extension}`;
      
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
      slug,
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
