import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

/**
 * 자산 서빙 (GET) - 하위 경로 지원 catch-all route
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { env } = getRequestContext() as any;
    const { key } = await params;

    if (!env.MEDIA) {
      return new NextResponse('R2 Storage not configured', { status: 500 });
    }

    // 배열로 들어온 경로 세그먼트를 다시 슬래시(/)로 결합하여 전체 키 복원
    const fullKey = key.join('/');

    const object = await env.MEDIA.get(fullKey);

    if (!object) {
      return new NextResponse('Asset not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(object.body, {
      headers,
    });
  } catch (error) {
    console.error('R2 Asset Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
