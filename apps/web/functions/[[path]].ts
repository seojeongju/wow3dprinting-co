import type { Env } from "./types";

function htmlDocument(title: string, body: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='24' font-size='24'%3E3%3C/text%3E%3C/svg%3E" />
  <title>${title}</title>
</head>
<body style="max-width: 960px; margin: 2rem auto; font-family: Arial, sans-serif;">
${body}
</body>
</html>`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const path = new URL(context.request.url).pathname;

  if (path.startsWith("/api/") || path.startsWith("/media/")) {
    return context.next();
  }

  // 리다이렉트보다 먼저: 루트·정적 HTML은 항상 public 자산으로 넘긴다(DB에 source_path='/' 가 있으면 홈이 기사로 보내지는 버그 방지)
  if (path === "/" || path === "/index.html" || path === "/admin.html" || path === "/article.html") {
    return context.next();
  }

  const redirect = await context.env.DB.prepare(
    "SELECT target_path, status_code FROM redirects WHERE source_path = ?"
  )
    .bind(path)
    .first<{ target_path: string; status_code: number }>();
  if (redirect) {
    return Response.redirect(new URL(redirect.target_path, context.request.url).toString(), redirect.status_code);
  }

  if (path.startsWith("/news/")) {
    const slug = path.replace("/news/", "").split("/")[0] || "";
    type ArticleRow = { title: string; body_html: string; published_at: string; slug: string };

    let article = await context.env.DB.prepare(
      "SELECT title, body_html, published_at, slug FROM articles WHERE slug = ? AND status = 'published'"
    )
      .bind(slug)
      .first<ArticleRow>();

    // 재이관 등으로 slug 접미사(해시)만 바뀐 옛 URL 지원: 같은 제목 접두(예: 3dprintingtimescookie-*) 기사 1건이면 캐논 URL로 이동
    if (!article) {
      const parsed = slug.match(/^(.+)-([a-f0-9]{12})$/i);
      const prefix = parsed?.[1];
      if (prefix && prefix !== "untitled" && prefix.length >= 4) {
        const { results } = await context.env.DB.prepare(
          `SELECT title, body_html, published_at, slug FROM articles
           WHERE status = 'published' AND slug LIKE ?
           ORDER BY published_at DESC
           LIMIT 2`
        )
          .bind(`${prefix}-%`)
          .all<ArticleRow>();
        const list = (results ?? []) as ArticleRow[];
        if (list.length === 1) {
          const row = list[0];
          if (row.slug !== slug) {
            return Response.redirect(new URL(`/news/${row.slug}`, context.request.url).toString(), 301);
          }
          article = row;
        }
      }
    }

    if (!article) return new Response("Not found", { status: 404 });

    return new Response(
      htmlDocument(
        article.title,
        `<a href="/">← 홈</a><h1>${article.title}</h1><p>${article.published_at ?? ""}</p><article>${article.body_html}</article>`
      ),
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  // /슬러그 만 열었을 때(잘못된 링크·구 북마크) → /news/슬러그 로 보낸다. 콘솔 404 혼동을 줄임.
  const singleSeg = path.match(/^\/([^/]+)$/);
  if (singleSeg && !singleSeg[1].includes(".")) {
    const maybeSlug = singleSeg[1];
    const exists = await context.env.DB.prepare(
      "SELECT 1 AS ok FROM articles WHERE slug = ? AND status = 'published' LIMIT 1"
    )
      .bind(maybeSlug)
      .first<{ ok: number }>();
    if (exists) {
      return Response.redirect(new URL(`/news/${maybeSlug}`, context.request.url).toString(), 301);
    }
  }

  const pageSlug = path.replace(/^\//, "");
  const page = await context.env.DB.prepare("SELECT title, content_html FROM pages WHERE slug = ?")
    .bind(pageSlug)
    .first<{ title: string; content_html: string }>();
  if (!page) return context.next();

  return new Response(htmlDocument(page.title, `<a href="/">← 홈</a><h1>${page.title}</h1>${page.content_html}`), {
    headers: { "content-type": "text/html; charset=utf-8" }
  });
};
