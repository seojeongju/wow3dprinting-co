import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { env } = getRequestContext();
    const key = params.key;

    if (!env.MEDIA) {
      return new NextResponse('R2 Storage not configured', { status: 500 });
    }

    const object = await env.MEDIA.get(key);

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
