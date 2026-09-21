import { NextResponse } from "next/server";
import { getSiteContext } from "@/lib/seo";

export const runtime = "edge";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "";
  const { baseUrl } = getSiteContext(host);

  // /api/assets 는 OG·본문 이미지 크롤링에 필요 → 허용
  // 관리자/내부 API만 차단
  const robots = `User-agent: *
Allow: /
Allow: /api/assets/
Disallow: /admin/
Disallow: /api/admin/
Disallow: /api/setup
Disallow: /api/categories

User-agent: Yeti
Allow: /
Allow: /api/assets/
Disallow: /admin/
Disallow: /api/admin/

User-agent: Googlebot
Allow: /
Allow: /api/assets/
Disallow: /admin/
Disallow: /api/admin/

User-agent: Googlebot-Image
Allow: /api/assets/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
