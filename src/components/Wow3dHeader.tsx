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
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 shadow-sm" style={{ background: '#FFFFFF' }}>
      {/* 정밀 티커 바 (Light Theme) */}
      <div className="bg-[#F8F9FA] border-b border-gray-100 py-1.5 overflow-hidden">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-[#FF5D00]/5 border border-[#FF5D00]/10">
              <Zap className="w-2.5 h-2.5 text-[#FF5D00] fill-[#FF5D00]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF5D00]">Live Intel</span>
            </div>
            <div className="flex gap-8 overflow-hidden whitespace-nowrap text-[10px] font-bold tracking-tight text-gray-400">
              {tickerArticles.length > 0
                ? tickerArticles.map((a, i) => (
                  <Link key={i} href={`/articles/${a.slug}`} className="hover:text-[#FF5D00] transition-colors flex items-center gap-2">
                    <span className="opacity-20">•</span>
                    {a.title}
                  </Link>
                ))
                : <span className="opacity-30">Fetching latest tech data stream...</span>
              }
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[9px] font-black tracking-widest text-[#ADB5BD] uppercase">
             <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* 메인 헤더 레이어 */}
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* 프리미엄 로고 */}
          <Link href="/" className="flex items-start gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-[#FF5D00] rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-[#FF5D00]/20">
                 <Printer className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-white rounded border border-gray-100 flex items-center justify-center shadow-sm">
                <Cpu className="w-2.5 h-2.5 text-black" />
              </div>
            </div>
            <div className="flex flex-col -mt-1">
              <span className="text-[10px] font-black tracking-[0.4em] text-[#FF5D00]/60 uppercase">WOW3D</span>
              <span className="text-xl font-black tracking-tighter text-[#1A1A1E] leading-none">
                프린팅타임즈
              </span>
              <span className="text-[8px] tracking-[0.3em] font-medium text-gray-300 uppercase mt-1">
                3D Tech Intelligence
              </span>
            </div>
          </Link>

          {/* 중앙 네비게이션 */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative px-5 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#ADB5BD] hover:text-[#1A1A1E] transition-all group"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#FF5D00] transition-all group-hover:w-1/2" />
              </Link>
            ))}
          </nav>

          {/* 시스템 액션 */}
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center bg-[#F8F9FA] border border-gray-100 px-4 py-2.5 rounded-xl focus-within:ring-2 focus-within:ring-[#FF5D00]/10 transition-all">
              <Search className="w-4 h-4 text-gray-300" />
              <input 
                type="text" 
                placeholder="SEARCH INTEL..." 
                className="bg-transparent border-none text-[10px] font-black tracking-widest outline-none w-36 placeholder:text-gray-200 ml-3 text-[#1A1A1E]"
              />
            </div>
            
            <button className="relative p-2.5 rounded-xl text-gray-300 hover:bg-gray-50 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF5D00] rounded-full ring-2 ring-white" />
            </button>

            {isAdmin && (
              <Link href="/admin"
                className="hidden md:flex items-center gap-2 px-6 py-3.5 rounded-xl text-[10px] font-black text-white transition-all active:scale-95 shadow-lg shadow-[#FF5D00]/20"
                style={{ background: 'linear-gradient(135deg, #FF5D00, #EA580C)' }}>
                <Printer className="w-4 h-4" />
                NEW POST
              </Link>
            )}

            <button className="lg:hidden p-2.5 rounded-xl text-gray-400 hover:bg-gray-50">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 카테고리 슬라이더 (White Theme) */}
        <div className="flex items-center gap-2.5 pb-6 overflow-x-auto scrollbar-hide pt-2">
          {['Everything', 'Hardware', 'Resin Tech', 'Metal AM', 'Design', 'Software', 'Filaments', 'Ventures', 'Case Studies'].map((cat, i) => (
            <button
              key={cat}
              className="shrink-0 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              style={
                i === 0
                  ? { background: '#1A1A1E', color: 'white', shadow: '0 4px 12px rgba(0,0,0,0.1)' }
                  : { background: '#F8F9FA', color: '#ADB5BD', border: '1px solid #E9ECEF' }
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
