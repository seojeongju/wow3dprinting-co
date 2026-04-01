import type { Env } from "../../types";
import { badRequest, json, methodNotAllowed, readJson, requireAdmin, slugify, unauthorized } from "../../_lib/http";

interface UpdatePayload {
  title?: string;
  summary?: string | null;
  body_html?: string;
  status?: "draft" | "review" | "published";
  category_id?: string | null;
  author_id?: string | null;
  hero_image_r2_key?: string | null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const slug = context.params.slug as string;
  const { request, env } = context;

  if (request.method === "GET") {
    const result = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).first();
    if (!result) return json({ error: "not found" }, 404);
    return json(result);
  }

  if (!requireAdmin(request, env)) return unauthorized();

  if (request.method === "PUT") {
    const body = await readJson<UpdatePayload>(request);
    const existing = await env.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(slug).first();
    if (!existing) return json({ error: "not found" }, 404);

    const nextTitle = body.title ?? (existing.title as string);
    const nextSlug = slugify(nextTitle);
    const nextStatus = body.status ?? (existing.status as "draft" | "review" | "published");
    const publishedAt =
      nextStatus === "published"
        ? ((existing.published_at as string | null) ?? new Date().toISOString())
        : null;

    if (!body.body_html && !existing.body_html) return badRequest("body_html은 필수입니다.");

    await env.DB.prepare(
      `UPDATE articles
       SET slug = ?, title = ?, summary = ?, body_html = ?, status = ?, category_id = ?, author_id = ?, hero_image_r2_key = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(
        nextSlug,
        nextTitle,
        body.summary ?? (existing.summary as string | null),
        body.body_html ?? (existing.body_html as string),
        nextStatus,
        body.category_id ?? (existing.category_id as string | null),
        body.author_id ?? (existing.author_id as string | null),
        body.hero_image_r2_key ?? (existing.hero_image_r2_key as string | null),
        publishedAt,
        existing.id
      )
      .run();

    return json({ slug: nextSlug });
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM articles WHERE slug = ?").bind(slug).run();
    return json({ ok: true });
  }

  return methodNotAllowed(request.method);
};
