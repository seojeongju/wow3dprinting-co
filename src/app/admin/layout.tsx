import type { ReactNode } from 'react';

/** Cloudflare next-on-pages: 클라이언트 전용 /admin 페이지에도 Edge 런타임이 필요 */
export const runtime = 'edge';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
