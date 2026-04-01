import type { Env } from "../../types";
import { badRequest, json, methodNotAllowed, requireAdmin, unauthorized } from "../../_lib/http";

interface UploadPayload {
  filename: string;
  contentType: string;
  base64: string;
  altText?: string;
  sourceUrl?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== "POST") return methodNotAllowed(request.method);
  if (!requireAdmin(request, env)) return unauthorized();

  const body = (await request.json()) as UploadPayload;
  if (!body.filename || !body.contentType || !body.base64) {
    return badRequest("filename/contentType/base64은 필수입니다.");
  }

  const id = crypto.randomUUID();
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${id}-${body.filename}`;
  const bytes = Uint8Array.from(atob(body.base64), (char) => char.charCodeAt(0));

  await env.MEDIA_BUCKET.put(key, bytes, {
    httpMetadata: {
      contentType: body.contentType
    }
  });

  await env.DB.prepare(
    "INSERT INTO media_assets (id, r2_key, mime_type, alt_text, source_url) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, key, body.contentType, body.altText ?? null, body.sourceUrl ?? null)
    .run();

  return json({
    id,
    key,
    url: `/media/${key}`
  });
};
