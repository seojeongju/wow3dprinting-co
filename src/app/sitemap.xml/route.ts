import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const isWow3d = host.includes('wow3dprinting.com') && !host.includes('.co.kr');
  
  const baseUrl = isWow3d ? 'https://wow3dprinting.com' : 'https://wow3dprinting.co.kr';
  const siteId: 'wow3d' | 'times' = isWow3d ? 'wow3d' : 'times';

  let sitemapEntries = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  try {
    const db = getDb();
    
    // 기사 목록 조회
    const siteArticles = await db
      .select()
      .from(articles)
      .where(
        or(
          eq(articles.targetSites, siteId),
          eq(articles.targetSites, 'both')
        )
      )
      .all();

    // 카테고리 목록 조회
    const allCategories = await db.select().from(categories).all();

    siteArticles.forEach((article) => {
      const date = article.updatedAt || article.publishedAt || new Date();
      sitemapEntries += `
  <url>
    <loc>${baseUrl}/articles/${article.slug}</loc>
    <lastmod>${new Date(date).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    allCategories.forEach((category) => {
      sitemapEntries += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    });

  } catch (error) {
    console.error('Sitemap route error:', error);
  }

  sitemapEntries += '\n</urlset>';

  return new NextResponse(sitemapEntries, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
