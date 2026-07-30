import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';
import {
  buildArticleUrl,
  buildCategoryUrl,
  getSiteContext,
  toValidDate,
} from '@/lib/seo';

export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const { baseUrl, siteId } = getSiteContext(host);
    const now = new Date();
    const sitemapEntries: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];

    const db = getDb();
    
    // 기사 목록 조회
    const siteArticles = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, 'published'),
          or(
            eq(articles.targetSites, siteId),
            eq(articles.targetSites, 'both')
          )
        )
      )
      .all();

    // 카테고리 목록 조회
    const allCategories = await db.select().from(categories).all();

    siteArticles.forEach((article) => {
      const lastModified = toValidDate(article.updatedAt) || toValidDate(article.publishedAt) || now;
      sitemapEntries.push({
        url: buildArticleUrl(baseUrl, article.slug),
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });

    allCategories.forEach((category) => {
      sitemapEntries.push({
        url: buildCategoryUrl(baseUrl, category.slug),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    });

    return sitemapEntries;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [
      {
        url: 'https://wow3dprinting.co.kr',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: 'https://wow3dprinting.com',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  }
}
