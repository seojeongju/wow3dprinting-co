import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionUser } from '@/lib/auth_edge';
export const runtime = 'edge';

/**
 * 자산 업로드 (POST) - R2 Storage 연동
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();

    // 1. 권한 확인 (관리자/편집자만 업로드 가능)
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: '업로드할 파일이 없습니다.' }, { status: 400 });
    }

    // 2. 파일 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 3. R2 업로드 준비
    const context = getRequestContext() as any;
    const env = context.env;

    if (!env.MEDIA) {
      return NextResponse.json({ message: 'R2 스토리지가 설정되지 않았습니다.' }, { status: 500 });
    }

    const buffer = await file.arrayBuffer();
    const extension = file.name.split('.').pop() || 'jpg';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `uploads/${timestamp}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

    // 4. R2 저장
    await env.MEDIA.put(fileName, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return NextResponse.json({
      success: true,
      key: fileName,
      url: `/api/assets/${fileName}`,
      name: file.name
    });

  } catch (error: any) {
    console.error('Asset Upload Error:', error);
    return NextResponse.json({ message: '업로드 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
