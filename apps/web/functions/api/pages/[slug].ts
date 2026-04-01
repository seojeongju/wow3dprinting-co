import type { Env } from "../../types";
import { badRequest, json, methodNotAllowed, readJson, requireAdmin, slugify, unauthorized } from "../../_lib/http";

interface PagePayload {
  title: string;
  content_html: string;
  published_at?: string | null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const slug = context.params.slug as string;
  const { request, env } = context;

  if (request.method === "GET") {
    const page = await env.DB.prepare("SELECT * FROM pages WHERE slug = ?").bind(slug).first();
    if (!page) return json({ error: "not found" }, 404);
    return json(page);
  }

  if (request.method !== "PUT") return methodNotAllowed(request.method);
  if (!requireAdmin(request, env)) return unauthorized();

  const body = await readJson<PagePayload>(request);
  if (!body.title || !body.content_html) return badRequest("title/content_html은 필수입니다.");

  const now = new Date().toISOString();
  const normalizedSlug = slugify(slug);

  await env.DB.prepare(
    `INSERT INTO pages (id, slug, title, content_html, published_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       title = excluded.title,
       content_html = excluded.content_html,
       published_at = excluded.published_at,
       updated_at = excluded.updated_at`
  )
    .bind(crypto.randomUUID(), normalizedSlug, body.title, body.content_html, body.published_at ?? now, now)
    .run();

  return json({ slug: normalizedSlug });
};
