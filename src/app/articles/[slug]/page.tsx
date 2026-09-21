import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { articles, categories } from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isAdmin as checkIsAdmin } from "@/lib/auth_edge";
import ArticleEditor from "@/components/ArticleEditor";
import ArticleView from "@/components/ArticleView";
import { stripHtmlAndMarkdown } from "@/lib/text-utils";
import {
  buildArticleUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLdFromContent,
  buildNewsArticleJsonLd,
  getSiteContext,
  isArticleVisibleOnSite,
  resolveAssetUrl,
  serializeJsonLd,
  toValidDate,
} from "@/lib/seo";

export const runtime = "edge";

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
        : eq(articles.slug, decodedSlug),
    )
    .limit(1);

  return results[0] ?? null;
}

async function getArticleSafe(slug: string, siteId?: "times" | "wow3d") {
  try {
    return await getArticle(slug, siteId);
  } catch (error) {
    console.error("Article fetch failed:", error);
    return null;
  }
}

async function safeIsAdmin() {
  try {
    return await checkIsAdmin();
  } catch (error) {
    console.error("Admin check failed:", error);
    return false;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const { baseUrl, siteTitle, isWow3d, siteId, alternateBaseUrl, ogImage } =
    getSiteContext(host);
  const data = await getArticleSafe(slug, siteId);
  if (!data || data.article.status !== "published") {
    return {
      title: "Article Not Found",
      robots: { index: false, follow: false },
    };
  }

  const rawContent =
    typeof data.article.content === "string" ? data.article.content : "";
  const cleanDescription = stripHtmlAndMarkdown(rawContent).slice(0, 160);
  const articleUrl = buildArticleUrl(baseUrl, data.article.slug);
  const alternateUrl = buildArticleUrl(alternateBaseUrl, data.article.slug);
  const imageUrl =
    resolveAssetUrl(baseUrl, data.article.thumbnailKey) || ogImage;
  const publishedDate = toValidDate(data.article.publishedAt);
  const modifiedDate = toValidDate(data.article.updatedAt) || publishedDate;
  const keywords = [
    siteTitle,
    data.category?.name,
    "3D 프린팅",
    "적층 제조",
    ...data.article.title.split(/\s+/).slice(0, 6),
  ].filter(Boolean) as string[];

  const isOnBoth = data.article.targetSites === "both";

  return {
    title: data.article.title,
    description: cleanDescription || `${data.article.title} | ${siteTitle}`,
    keywords,
    authors: [{ name: siteTitle, url: baseUrl }],
    creator: siteTitle,
    publisher: siteTitle,
    category: data.category?.name,
    alternates: {
      canonical: articleUrl,
      ...(isOnBoth
        ? {
            languages: {
              "ko-KR": articleUrl,
              "x-default": articleUrl,
              ko: alternateUrl,
            },
          }
        : {
            languages: {
              "ko-KR": articleUrl,
              "x-default": articleUrl,
            },
          }),
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
          width: 1200,
          height: 630,
          alt: data.article.title,
        },
      ],
      publishedTime: publishedDate?.toISOString(),
      modifiedTime: modifiedDate?.toISOString(),
      section: data.category?.name,
      tags: keywords,
    },
    twitter: {
      card: "summary_large_image",
      title: data.article.title,
      description: cleanDescription,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "article:section": data.category?.name || (isWow3d ? "3D Printing" : "Tech"),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const { baseUrl, siteTitle, siteId, ogImage } = getSiteContext(host);

  const [data, isAdmin] = await Promise.all([
    getArticleSafe(slug, siteId),
    safeIsAdmin(),
  ]);

  if (
    !data ||
    !isArticleVisibleOnSite(data.article.targetSites, siteId) ||
    (data.article.status !== "published" && !isAdmin)
  ) {
    notFound();
  }

  const { article, category } = data;
  const articleUrl = buildArticleUrl(baseUrl, article.slug);
  const cleanDescription = stripHtmlAndMarkdown(article.content).slice(0, 160);
  const plainBody = stripHtmlAndMarkdown(article.content);
  const imageUrl = resolveAssetUrl(baseUrl, article.thumbnailKey) || ogImage;
  const publishedDate = toValidDate(article.publishedAt);
  const modifiedDate = toValidDate(article.updatedAt) || publishedDate;

  const newsJsonLd = buildNewsArticleJsonLd({
    title: article.title,
    description: cleanDescription,
    articleUrl,
    imageUrl,
    siteTitle,
    baseUrl,
    logoUrl: ogImage,
    categoryName: category?.name,
    publishedAt: publishedDate?.toISOString() ?? null,
    modifiedAt: modifiedDate?.toISOString() ?? null,
    articleBody: plainBody,
    keywords: [siteTitle, category?.name, "3D 프린팅"].filter(Boolean) as string[],
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: siteTitle, url: baseUrl },
    ...(category
      ? [
          {
            name: category.name,
            url: `${baseUrl}/category/${encodeURIComponent(category.slug)}`,
          },
        ]
      : []),
    { name: article.title, url: articleUrl },
  ]);

  const faqJsonLd = buildFaqJsonLdFromContent(article.content, articleUrl);

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [newsJsonLd, breadcrumbJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdGraph) }}
      />

      {/* 크롤러/일반 독자: 서버 렌더 뷰 (noindex 유발 SSR 오류 방지) */}
      {!isAdmin ? (
        <ArticleView article={article} category={category} />
      ) : (
        <ArticleEditor article={article} category={category} isAdmin={isAdmin} />
      )}
    </div>
  );
}
