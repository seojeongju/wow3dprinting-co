import type { Env } from "../types";

export const onRequest: PagesFunction<Env> = async (context) => {
  const keyPath = context.params.path;
  const key = Array.isArray(keyPath) ? keyPath.join("/") : String(keyPath || "");
  const object = await context.env.MEDIA_BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");

  return new Response(object.body, { headers });
};
