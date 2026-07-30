import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { articles, categories } from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isAdmin as checkIsAdmin } from "@/lib/auth_edge";
import ArticleEditor from "@/components/ArticleEditor";
import { stripHtmlAndMarkdown } from "@/lib/text-utils";
import {
  buildArticleUrl,
  getSiteContext,
  isArticleVisibleOnSite,
  resolveAssetUrl,
  serializeJsonLd,
  toValidDate,
} from "@/lib/seo";

export const runtime = 'edge';

function safeDecodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

async function getArticle(slug: string, siteId?: "times" | "wow3d") {
  const db = getDb();
  const decodedSlug = safeDecodeSlug(slug);
  const siteFilter = siteId
    ? or(eq(articles.targetSites, siteId), eq(articles.targetSites, "both"))
    : undefined;
  const results = await db
    .select({
      article: articles,
      category: categories,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      siteFilter
        ? and(eq(articles.slug, decodedSlug), siteFilter)
        : eq(articles.slug, decodedSlug)
    )
    .limit(1);

  return results[0] ?? null;
}

async function getArticleSafe(slug: string, siteId?: "times" | "wow3d") {
  try {
    return await getArticle(slug, siteId);
  } catch (error) {
    console.error('Article fetch failed:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const { baseUrl, siteTitle, isWow3d, siteId } = getSiteContext(host);
  const data = await getArticleSafe(slug, siteId);
  if (!data || data.article.status !== "published") {
    return { title: 'Article Not Found' };
  }

  // HTML 및 마크다운 태그를 제거하고 순수 텍스트만 추출
  const rawContent = typeof data.article.content === 'string' ? data.article.content : '';
  const cleanDescription = stripHtmlAndMarkdown(rawContent).slice(0, 160);
  const articleUrl = buildArticleUrl(baseUrl, data.article.slug);
  const defaultImage = `${baseUrl}/${isWow3d ? "og-image.png" : "og-image-times.png"}`;
  const imageUrl =
    resolveAssetUrl(baseUrl, data.article.thumbnailKey) || defaultImage;
  const publishedDate = toValidDate(data.article.publishedAt);
  const modifiedDate = toValidDate(data.article.updatedAt) || publishedDate;
  const publishedTime = publishedDate?.toISOString();
  const modifiedTime = modifiedDate?.toISOString();

  return {
    title: data.article.title,
    description: cleanDescription,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: data.article.title,
      description: cleanDescription,
      url: articleUrl,
      type: "article",
      siteName: siteTitle,
      locale: "ko_KR",
      images: [
        {
          url: imageUrl,
          alt: data.article.title,
        },
      ],
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: "summary_large_image",
      title: data.article.title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const { baseUrl, siteTitle, isWow3d, siteId } = getSiteContext(host);
  const [data, isAdmin] = await Promise.all([
    getArticleSafe(slug),
    checkIsAdmin(),
  ]);

  if (
    !data ||
    !isArticleVisibleOnSite(data.article.targetSites, siteId) ||
    (data.article.status !== 'published' && !isAdmin)
  ) {
    notFound();
  }

  const { article, category } = data;
  const articleUrl = buildArticleUrl(baseUrl, article.slug);
  const cleanDescription = stripHtmlAndMarkdown(article.content).slice(0, 160);
  const defaultImage = `${baseUrl}/${isWow3d ? "og-image.png" : "og-image-times.png"}`;
  const imageUrl =
    resolveAssetUrl(baseUrl, article.thumbnailKey) || defaultImage;
  const publishedDate = toValidDate(article.publishedAt);
  const modifiedDate = toValidDate(article.updatedAt) || publishedDate;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: cleanDescription,
    datePublished: publishedDate?.toISOString(),
    dateModified: modifiedDate?.toISOString(),
    mainEntityOfPage: articleUrl,
    url: articleUrl,
    image: [imageUrl],
    articleSection: category?.name ?? undefined,
    author: {
      "@type": "Organization",
      name: siteTitle,
    },
    publisher: {
      "@type": "Organization",
      name: siteTitle,
      url: baseUrl,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ArticleEditor 
        article={article} 
        category={category} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}
