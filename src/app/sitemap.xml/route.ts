import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles, categories } from "@/lib/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import {
  buildArticleUrl,
  buildCategoryUrl,
  escapeXml,
  getSiteContext,
  isIndexableSlug,
  toValidDate,
} from "@/lib/seo";

export const runtime = "edge";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "";
  const { baseUrl, siteId, alternateBaseUrl } = getSiteContext(host);
  const nowIso = new Date().toISOString();

  let sitemapEntries = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <xhtml:link rel="alternate" hreflang="ko-KR" href="${escapeXml(baseUrl)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(baseUrl)}" />
    <lastmod>${nowIso}</lastmod>
    <changefreq>hourly</changefreq>
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
            eq(articles.targetSites, "both"),
          ),
        ),
      )
      .orderBy(desc(articles.publishedAt))
      .all();

    const allCategories = await db.select().from(categories).all();

    for (const article of siteArticles) {
      if (!isIndexableSlug(article.slug)) continue;

      const lastmod = (
        toValidDate(article.updatedAt) ||
        toValidDate(article.publishedAt) ||
        new Date()
      ).toISOString();
      const loc = buildArticleUrl(baseUrl, article.slug);
      const alternateLoc = buildArticleUrl(alternateBaseUrl, article.slug);
      const published = toValidDate(article.publishedAt);
      const isRecentNews =
        published &&
        Date.now() - published.getTime() < 1000 * 60 * 60 * 24 * 2;

      sitemapEntries += `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="ko-KR" href="${escapeXml(loc)}" />
    ${
      article.targetSites === "both"
        ? `<xhtml:link rel="alternate" hreflang="ko" href="${escapeXml(alternateLoc)}" />`
        : ""
    }
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(loc)}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${
      isRecentNews
        ? `
    <news:news>
      <news:publication>
        <news:name>${escapeXml(
          siteId === "wow3d" ? "와우3D프린팅타임즈" : "3D프린팅타임즈",
        )}</news:name>
        <news:language>ko</news:language>
      </news:publication>
      <news:publication_date>${published!.toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>`
        : ""
    }
  </url>`;
    }

    for (const category of allCategories) {
      const loc = buildCategoryUrl(baseUrl, category.slug);
      sitemapEntries += `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  } catch (error) {
    console.error("Sitemap route error:", error);
  }

  sitemapEntries += "\n</urlset>";

  return new NextResponse(sitemapEntries, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
