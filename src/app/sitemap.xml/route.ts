import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles, categories } from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import {
  buildArticleUrl,
  buildCategoryUrl,
  escapeXml,
  getSiteContext,
  toValidDate,
} from "@/lib/seo";

export const runtime = 'edge';

export async function GET(request: Request) {
  const host = request.headers.get('host') || '';
  const { baseUrl, siteId } = getSiteContext(host);
  const nowIso = new Date().toISOString();

  let sitemapEntries = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  try {
    const db = getDb();

    const siteArticles = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          or(
            eq(articles.targetSites, siteId),
            eq(articles.targetSites, "both")
          )
        )
      )
      .all();

    const allCategories = await db.select().from(categories).all();

    siteArticles.forEach((article) => {
      const lastmod =
        (toValidDate(article.updatedAt) || toValidDate(article.publishedAt) || new Date()).toISOString();

      sitemapEntries += `
  <url>
    <loc>${escapeXml(buildArticleUrl(baseUrl, article.slug))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    allCategories.forEach((category) => {
      sitemapEntries += `
  <url>
    <loc>${escapeXml(buildCategoryUrl(baseUrl, category.slug))}</loc>
    <lastmod>${nowIso}</lastmod>
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
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
