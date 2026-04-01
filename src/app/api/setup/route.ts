import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { categories, articles } from '@/lib/db/schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  try {
    const { env } = getRequestContext() as any;
    
    // 바인딩 존재 여부 체크 (디버깅용)
    if (!env || !env.DB) {
      return NextResponse.json({ success: false, error: 'Database binding (DB) is missing in Cloudflare Pages settings.' }, { status: 500 });
    }
    if (!env.MEDIA) {
      return NextResponse.json({ success: false, error: 'R2 bucket binding (MEDIA) is missing in Cloudflare Pages settings.' }, { status: 500 });
    }

    const db = getDb();

    // 1. 카테고리 초기 데이터 삽입 (Seed)
    const seedCategories = [
      { name: 'AI & Machine Learning', slug: 'ai-ml', description: '차세대 인공지능 기술 소식' },
      { name: '3D Printing & Manufacturing', slug: '3d-printing', description: '적층 제조 및 디지털 제작 기술' },
      { name: 'Robotics & Automation', slug: 'robotics', description: '로봇 공학 및 자동화 기술 트렌드' }
    ];

    // 중복 방지 로직 (간단히 모든 카테고리 시도 후 에러 무시 또는 갯수 확인)
    for (const cat of seedCategories) {
      await db.insert(categories).values(cat).onConflictDoNothing();
    }

    // 2. R2 연동 테스트 (간단한 로그 파일)
    if (env.MEDIA) {
      await env.MEDIA.put('test-connection.txt', `Initialized at ${new Date().toISOString()}`);
    }

    // 3. 샘플 기사 (Draft)
    const [firstCategory] = await db.select().from(categories).limit(1);
    if (firstCategory) {
      await db.insert(articles).values({
        title: '3D프린팅타임즈에 오신 것을 환영합니다.',
        slug: 'welcome-to-3d-printing-times',
        content: '# 환영합니다\n\n이곳은 AI와 3D 프린팅의 미래를 다루는 전문 매체입니다.',
        categoryId: firstCategory.id,
        authorId: 'admin',
        status: 'draft'
      }).onConflictDoNothing();
    }

    return NextResponse.json({ success: true, message: 'Initial data seeded and R2 connection verified.' });
  } catch (error: any) {
    console.error('Setup Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
