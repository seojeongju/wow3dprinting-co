import type { Env } from "../../types";
import { badRequest, json, methodNotAllowed, readJson, requireAdmin, slugify, unauthorized } from "../../_lib/http";

interface ArticlePayload {
  title: string;
  summary?: string;
  body_html: string;
  status?: "draft" | "review" | "published";
  category_id?: string | null;
  author_id?: string | null;
  hero_image_r2_key?: string | null;
  published_at?: string | null;
  slug?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, slug, title, summary, status, hero_image_r2_key, published_at, created_at, updated_at FROM articles WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 100"
    ).all();
    return json({ items: results });
  }

  if (request.method !== "POST") return methodNotAllowed(request.method);
  if (!requireAdmin(request, env)) return unauthorized();

  const body = await readJson<ArticlePayload>(request);
  if (!body.title || !body.body_html) return badRequest("title/body_html은 필수입니다.");

  const id = crypto.randomUUID();
  const slug = body.slug ? slugify(body.slug) : slugify(body.title);
  const status = body.status ?? "draft";
  const publishedAt = status === "published" ? body.published_at ?? new Date().toISOString() : null;

  await env.DB.prepare(
    `INSERT INTO articles (
      id, slug, title, summary, body_html, status, category_id, author_id, hero_image_r2_key, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      slug,
      body.title,
      body.summary ?? null,
      body.body_html,
      status,
      body.category_id ?? null,
      body.author_id ?? null,
      body.hero_image_r2_key ?? null,
      publishedAt
    )
    .run();

  return json({ id, slug }, 201);
};
