/**
 * SEO / AEO 공통 유틸
 * - 도메인별 사이트 컨텍스트
 * - 구조화 데이터(JSON-LD)
 * - URL / XML 헬퍼
 */

export type SiteId = "times" | "wow3d";

export function getSiteContext(host: string) {
  const domain = host.split(":")[0].toLowerCase();
  const isWow3d =
    domain === "wow3dprinting.com" || domain.endsWith(".wow3dprinting.com");

  return {
    isWow3d,
    siteId: (isWow3d ? "wow3d" : "times") as SiteId,
    siteTitle: isWow3d ? "와우3D프린팅타임즈" : "3D프린팅타임즈",
    siteDescription: isWow3d
      ? "국내 유일 프리미엄 3D 프린팅 전문 미디어. 최첨단 3D 프린팅 기술, 산업 동향, 장비 리뷰 및 제조 인텔리전스를 제공합니다."
      : "첨단 제조 기술, 머신러닝 혁신, AI·3D 프린팅·로보틱스 최신 트렌드를 가장 먼저 전달하는 국내 최고의 기술 미디어입니다.",
    baseUrl: isWow3d
      ? "https://wow3dprinting.com"
      : "https://wow3dprinting.co.kr",
    ogImage: isWow3d
      ? "https://wow3dprinting.com/og-image.png"
      : "https://wow3dprinting.co.kr/og-image-times.png",
    alternateBaseUrl: isWow3d
      ? "https://wow3dprinting.co.kr"
      : "https://wow3dprinting.com",
  };
}

export function isArticleVisibleOnSite(
  targetSites: SiteId | "both" | string | null | undefined,
  siteId: SiteId,
) {
  return targetSites === "both" || targetSites === siteId;
}

export function toValidDate(value: Date | string | number | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildArticleUrl(baseUrl: string, slug: string) {
  return new URL(`/articles/${encodeURIComponent(slug)}`, baseUrl).toString();
}

export function buildCategoryUrl(baseUrl: string, slug: string, page?: number) {
  const url = new URL(`/category/${encodeURIComponent(slug)}`, baseUrl);
  if (page && page > 1) {
    url.searchParams.set("page", String(page));
  }
  return url.toString();
}

export function resolveAssetUrl(baseUrl: string, rawUrl?: string | null) {
  if (!rawUrl) return null;

  const normalized = rawUrl.trim();
  if (!normalized) return null;
  if (normalized.startsWith("//")) return `https:${normalized}`;
  if (/^https?:\/\//i.test(normalized)) return normalized;

  return new URL(`/api/assets/${encodeURI(normalized)}`, baseUrl).toString();
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** 인덱스에 부적합한 슬러그(테스트/쓰레기) 필터 */
export function isIndexableSlug(slug: string) {
  const value = (slug || "").trim();
  if (!value) return false;
  if (value.length < 2) return false;
  // 순수 숫자·타임스탬프형 슬러그는 유지(실제 기사일 수 있음)
  // 명백한 테스트성 단문만 제외
  const blocked = ["test", "테스트", "asdf", "sample", "demo"];
  return !blocked.includes(value.toLowerCase());
}

export function buildOrganizationJsonLd(opts: {
  siteTitle: string;
  baseUrl: string;
  description: string;
  logoUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: opts.siteTitle,
    url: opts.baseUrl,
    description: opts.description,
    logo: {
      "@type": "ImageObject",
      url: opts.logoUrl,
    },
    publishingPrinciples: `${opts.baseUrl}/policy/terms`,
    sameAs: [
      "https://wow3dprinting.co.kr",
      "https://wow3dprinting.com",
    ],
  };
}

export function buildWebsiteJsonLd(opts: {
  siteTitle: string;
  baseUrl: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: opts.siteTitle,
    url: opts.baseUrl,
    description: opts.description,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${opts.baseUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildNewsArticleJsonLd(opts: {
  title: string;
  description: string;
  articleUrl: string;
  imageUrl: string;
  siteTitle: string;
  baseUrl: string;
  logoUrl: string;
  categoryName?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  articleBody?: string | null;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: opts.title,
    description: opts.description,
    datePublished: opts.publishedAt ?? undefined,
    dateModified: opts.modifiedAt ?? opts.publishedAt ?? undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": opts.articleUrl,
    },
    url: opts.articleUrl,
    image: [opts.imageUrl],
    articleSection: opts.categoryName ?? undefined,
    keywords: opts.keywords?.length ? opts.keywords.join(", ") : undefined,
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    articleBody: opts.articleBody
      ? opts.articleBody.slice(0, 5000)
      : undefined,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "article p"],
    },
    author: {
      "@type": "Organization",
      name: opts.siteTitle,
      url: opts.baseUrl,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: opts.siteTitle,
      url: opts.baseUrl,
      logo: {
        "@type": "ImageObject",
        url: opts.logoUrl,
      },
    },
  };
}

/** 본문에서 FAQ 후보(Q/A 패턴)를 추출해 AEO용 FAQPage 생성 */
export function buildFaqJsonLdFromContent(content: string, pageUrl: string) {
  if (!content) return null;

  const plain = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "");

  const qaPairs: Array<{ q: string; a: string }> = [];

  // ## 질문? 형태 또는 Q. / A. 패턴
  const headingQa = plain.matchAll(
    /(?:^|\n)##\s*([^\n]{8,120}\?)\s*\n+([\s\S]*?)(?=\n##\s|$)/g,
  );
  for (const match of headingQa) {
    const q = match[1]?.trim();
    const a = match[2]?.replace(/[#>*_`]/g, " ").replace(/\s+/g, " ").trim();
    if (q && a && a.length > 20) qaPairs.push({ q, a: a.slice(0, 500) });
    if (qaPairs.length >= 6) break;
  }

  if (qaPairs.length < 2) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qaPairs.map((pair) => ({
      "@type": "Question",
      name: pair.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.a,
      },
    })),
    url: pageUrl,
  };
}
