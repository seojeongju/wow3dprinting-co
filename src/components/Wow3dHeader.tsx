import Link from 'next/link';
import { headers } from 'next/headers';
import { getSessionUser } from '@/lib/auth_edge';
import { getDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Search, Bell, Menu, Printer, Flame, Cpu, Zap } from 'lucide-react';

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
    { label: 'Intelligence', href: '/' },
    { label: 'Reviews', href: '/' },
    { label: 'Materials', href: '/' },
    { label: 'Industry', href: '/' },
    { label: 'Community', href: '/' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5" style={{ background: '#08080A' }}>
      {/* 초정밀 티커 바 */}
      <div className="bg-[#111114] border-b border-white/5 py-1.5 overflow-hidden">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-orange-600/10 border border-orange-600/20">
              <Zap className="w-2.5 h-2.5 text-orange-500 fill-orange-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">Live Intel</span>
            </div>
            <div className="flex gap-8 overflow-hidden whitespace-nowrap text-[10px] font-bold tracking-tight text-white/40">
              {tickerArticles.length > 0
                ? tickerArticles.map((a, i) => (
                  <Link key={i} href={`/articles/${a.slug}`} className="hover:text-orange-500 transition-colors flex items-center gap-2">
                    <span className="opacity-20">•</span>
                    {a.title}
                  </Link>
                ))
                : <span className="opacity-20 animate-pulse">Synchronizing latest 3D printing data...</span>
              }
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[9px] font-black tracking-widest text-white/20 uppercase">
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* 메인 헤더 레이어 */}
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* 하이엔드 로고 디자인 */}
          <Link href="/" className="flex items-start gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-orange-600/20">
                 <Printer className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded flex items-center justify-center shadow-sm">
                <Cpu className="w-2.5 h-2.5 text-black" />
              </div>
            </div>
            <div className="flex flex-col -mt-1">
              <span className="text-[10px] font-black tracking-[0.4em] text-orange-600/60 uppercase">WOW3D</span>
              <span className="text-xl font-black tracking-tighter text-white leading-none">
                프린팅타임즈
              </span>
              <span className="text-[8px] tracking-[0.3em] font-medium text-white/20 uppercase mt-1">
                Premium 3D Tech Media
              </span>
            </div>
          </Link>

          {/* 중앙 네비게이션 */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-white transition-all group"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-orange-600 transition-all group-hover:w-1/2" />
              </Link>
            ))}
          </nav>

          {/* 피드 컨트롤 */}
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl focus-within:border-orange-600/50 transition-all">
              <Search className="w-4 h-4 text-white/20" />
              <input 
                type="text" 
                placeholder="INTEL SEARCH..." 
                className="bg-transparent border-none text-[10px] font-black tracking-widest outline-none w-32 placeholder:text-white/10 ml-3 text-white"
              />
            </div>
            
            <button className="relative p-2 rounded-xl text-white/30 hover:bg-white/5 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-orange-600 rounded-full ring-2 ring-[#08080A]" />
            </button>

            {isAdmin && (
              <Link href="/admin"
                className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black text-white transition-all active:scale-95 shadow-xl shadow-orange-600/20"
                style={{ background: 'linear-gradient(135deg, #FF5D00, #EA580C)' }}>
                <Printer className="w-4 h-4" />
                POST INTEL
              </Link>
            )}

            <button className="lg:hidden p-2 rounded-xl text-white/40 hover:bg-white/5">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 카테고리 필터 바 (Glassmorphism) */}
        <div className="flex items-center gap-2.5 pb-6 overflow-x-auto scrollbar-hide pt-2">
          {['All Platforms', 'Hardwares', 'FDM Solutions', 'Resin Tech', 'Metal AM', 'Bio Printing', 'Embedded AI', 'Slicers', 'Filaments', 'Ventures'].map((cat, i) => (
            <button
              key={cat}
              className="shrink-0 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              style={
                i === 0
                  ? { background: 'white', color: 'black' }
                  : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.05)' }
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
