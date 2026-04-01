import type { Env } from "../types";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) {
    return new Response(JSON.stringify({ items: [] }), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  const { results } = await env.DB.prepare(
    `SELECT slug, title, summary, published_at
     FROM articles
     WHERE status = 'published'
       AND (title LIKE ? OR body_html LIKE ?)
     ORDER BY published_at DESC
     LIMIT 20`
  )
    .bind(`%${q}%`, `%${q}%`)
    .all();

  return new Response(JSON.stringify({ items: results }), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
};
