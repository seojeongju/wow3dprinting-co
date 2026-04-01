import type { Env } from "../types";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

export function methodNotAllowed(method: string): Response {
  return json({ error: `Method ${method} not allowed` }, 405);
}

export function unauthorized(): Response {
  return json({ error: "Unauthorized" }, 401);
}

export function badRequest(message: string): Response {
  return json({ error: message }, 400);
}

export function requireAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.replace("Bearer ", "").trim();
  return token.length > 0 && token === env.ADMIN_TOKEN;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
