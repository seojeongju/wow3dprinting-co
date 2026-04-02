import Link from 'next/link';
import { headers } from 'next/headers';
import { getSessionUser } from '@/lib/auth_edge';
import { getDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Search, Bell, Menu, Printer, Flame, Layers } from 'lucide-react';

async function getLatestTicker() {
  try {
    const db = getDb();
    return await db.select({ title: articles.title, slug: articles.slug })
      .from(articles).where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt)).limit(5);
  } catch { return []; }
}

export default async function Wow3dHeader() {
  const user = await getSessionUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';
  const tickerArticles = await getLatestTicker();

  const navItems = [
    { label: '최신뉴스', href: '/' },
    { label: '프린터리뷰', href: '/' },
    { label: '소재/재료', href: '/' },
    { label: '산업동향', href: '/' },
    { label: '커뮤니티', href: '/' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: '#0F0500' }}>
      {/* 속보 티커 */}
      <div
        className="border-b py-2 overflow-hidden"
        style={{ borderColor: 'rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.05)' }}
      >
        <div className="container mx-auto px-4 flex items-center gap-4">
          <div
            className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
            style={{ background: '#F97316', color: 'white' }}
          >
            <Flame className="w-2.5 h-2.5 fill-white" />
            속보
          </div>
          <div className="flex gap-10 overflow-hidden whitespace-nowrap text-[11px] text-orange-200/60 font-medium">
            {tickerArticles.length > 0
              ? tickerArticles.map((a, i) => (
                <Link key={i} href={`/articles/${a.slug}`} className="hover:text-orange-400 transition-colors shrink-0">
                  {a.title}
                </Link>
              ))
              : <span className="opacity-40">최신 3D 프린팅 뉴스를 불러오는 중...</span>
            }
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-5">
          {/* 로고 */}
          <Link href="/" className="flex flex-col leading-none group">
            <span className="text-[11px] font-black tracking-[0.4em] uppercase" style={{ color: 'rgba(249,115,22,0.5)' }}>
              WOW3D
            </span>
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-orange-400 transition-colors">
              프린팅타임즈
            </span>
            <span className="text-[9px] tracking-[0.25em] uppercase font-medium" style={{ color: 'rgba(249,115,22,0.4)' }}>
              3D Printing Media
            </span>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-bold text-orange-100/60 hover:text-white rounded-xl transition-all hover:bg-orange-500/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black text-orange-300/60 hover:text-white transition-colors"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <Search className="w-3.5 h-3.5" />
              <span>검색...</span>
            </button>
            <button className="relative p-2.5 rounded-xl transition-all hover:bg-orange-500/10">
              <Bell className="w-5 h-5 text-orange-300/50" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#F97316' }} />
            </button>
            {isAdmin && (
              <Link href="/admin"
                className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 4px 15px rgba(249,115,22,0.3)' }}>
                <Printer className="w-3.5 h-3.5" />
                기사 작성
              </Link>
            )}
            <button className="lg:hidden p-2.5 rounded-xl text-orange-300/50 hover:bg-orange-500/10">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 카테고리 탭 바 */}
        <div className="flex items-center gap-2 pb-4 overflow-x-auto scrollbar-hide">
          {['전체', '3D프린터', 'FDM/FFF', 'SLA/DLP', '산업용', '바이오', '금속', '소프트웨어', '소재', '스타트업'].map((cat, i) => (
            <button
              key={cat}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={
                i === 0
                  ? { background: '#F97316', color: 'white' }
                  : { background: 'rgba(249,115,22,0.08)', color: 'rgba(255,200,150,0.7)', border: '1px solid rgba(249,115,22,0.15)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
