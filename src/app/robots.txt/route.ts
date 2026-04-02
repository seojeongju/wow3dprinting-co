import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const host = request.headers.get('host') || '';
  const isWow3d = host.includes('wow3dprinting.com') && !host.includes('.co.kr');
  
  const baseUrl = isWow3d ? 'https://wow3dprinting.com' : 'https://wow3dprinting.co.kr';

  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
