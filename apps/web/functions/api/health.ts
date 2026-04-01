import type { Env } from "../types";

export const onRequest: PagesFunction<Env> = async ({ env }) => {
  try {
    await env.DB.prepare("SELECT 1").first();
    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" }
      }
    );
  }
};
