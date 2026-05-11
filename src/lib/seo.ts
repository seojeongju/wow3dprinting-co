export type SiteId = "times" | "wow3d";

export function getSiteContext(host: string) {
  const domain = host.split(":")[0].toLowerCase();
  const isWow3d =
    domain === "wow3dprinting.com" || domain.endsWith(".wow3dprinting.com");

  return {
    isWow3d,
    siteId: (isWow3d ? "wow3d" : "times") as SiteId,
    siteTitle: isWow3d ? "와우3D프린팅타임즈" : "3D프린팅타임즈",
    baseUrl: isWow3d
      ? "https://wow3dprinting.com"
      : "https://wow3dprinting.co.kr",
  };
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
