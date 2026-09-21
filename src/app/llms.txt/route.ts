import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import {
  buildArticleUrl,
  getSiteContext,
  isIndexableSlug,
} from "@/lib/seo";
import { stripHtmlAndMarkdown as stripText } from "@/lib/text-utils";

export const runtime = "edge";

/**
 * AEO용 llms.txt — AI 검색/요약 엔진이 사이트 구조를 파악하도록 제공
 * https://llmstxt.org/
 */
export async function GET(request: Request) {
  const host = request.headers.get("host") || "";
  const { baseUrl, siteTitle, siteDescription, siteId } = getSiteContext(host);

  let recentLines = "";
  try {
    const db = getDb();
    const rows = await db
      .select({
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
      })
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
      .limit(30)
      .all();

    recentLines = rows
      .filter((row) => isIndexableSlug(row.slug))
      .map((row) => {
        const summary = stripText(row.content || "").slice(0, 120);
        return `- [${row.title}](${buildArticleUrl(baseUrl, row.slug)}): ${summary}`;
      })
      .join("\n");
  } catch (error) {
    console.error("llms.txt error:", error);
  }

  const body = `# ${siteTitle}

> ${siteDescription}

이 사이트는 한국어 3D 프린팅·AI·첨단 제조 전문 뉴스 미디어입니다.

## 주요 페이지
- [홈](${baseUrl}/): 최신 기사 피드
- [사이트맵](${baseUrl}/sitemap.xml)
- [robots](${baseUrl}/robots.txt)

## 최근 기사
${recentLines || "- (기사 목록을 불러오지 못했습니다)"}

## 연락/정책
- [이용약관](${baseUrl}/policy/terms)
- [개인정보처리방침](${baseUrl}/policy/privacy)
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
