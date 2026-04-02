'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, ArrowRight, TrendingUp, Cpu, Zap, Radio, Award, Layers } from 'lucide-react';

type Article = {
  id: number;
  title: string;
  slug: string;
  content: string;
  categoryId?: number | null;
  authorId?: string;
  thumbnailKey: string | null;
  publishedAt: Date | null;
  updatedAt?: Date | null;
  status: string | null;
  targetSites: string;
};

type ArticleWithCategory = {
  article: Article;
  category: { name: string } | null;
};

interface Wow3dHomePageProps {
  latestData: ArticleWithCategory[];
  totalPages: number;
  currentPage: number;
  dbError: string | null;
}

// 고성능 마크다운 요약기 (이미지/링크 완벽 제거)
function getExcerpt(content: string, maxLen = 120) {
  const plain = content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*`>\-_]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

function timeAgo(date: Date | null) {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  } catch { return ''; }
}

const extractValidThumbnail = (content: string) => {
  const matches = Array.from(content.matchAll(/!\[.*?\]\(([^" \)]+).*?\)/g));
  const excludeKeywords = ['spacer', 'pixel', 'logo', 'icon', 'banner', 'invisible', 'dot.gif', 'loading'];

  for (const match of matches) {
    let url = match[1]?.trim();
    if (!url) continue;
    const isInvalid = excludeKeywords.some(kw => url.toLowerCase().includes(kw));
    if (!isInvalid) return url;
  }
  return null;
};

const getProcessedImageUrl = (key: string | null, fallback: string | null) => {
  let rawUrl = key || fallback;
  if (!rawUrl) return null;
  rawUrl = rawUrl.trim();
  if (rawUrl.startsWith('//')) return `https:${rawUrl}`;
  if (rawUrl.startsWith('http')) return rawUrl;
  return `/api/assets/${rawUrl}`;
};

// 프리미엄 이미지 렌더러 (Fallback 및 올바른 경로 처리)
function ArticleImage({ src, fallbackContent, alt, className }: { src: string | null; fallbackContent?: string; alt: string; className?: string }) {
  const fallback = fallbackContent ? extractValidThumbnail(fallbackContent) : null;
  const imageSrc = getProcessedImageUrl(src, fallback);
  
  if (!imageSrc) {
    return (
      <div className={`flex flex-col items-center justify-center ${className} relative`}
           style={{ background: '#F8F9FA' }}>
        <div className="text-gray-200 font-black text-6xl italic select-none">3D</div>
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img 
        src={imageSrc} 
        alt={alt} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
  );
}

// Digital Branding Hero Component (Ultrawide - White Theme)
function DigitalBrandingHero() {
  return (
    <section className="relative h-[clamp(450px,70vh,800px)] w-full rounded-[3rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.12)] mb-20 animate-in fade-in slide-in-from-top-10 duration-1000">
      {/* Background Digital Asset */}
      <img 
        src="/images/wow3d-branding-hero.png" 
        alt="WOW3D Digital Tech Intelligence" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Premium Overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to right, rgba(255,255,255,1) 10%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0) 100%)'
      }} />

      <div className="relative h-full container mx-auto px-10 flex flex-col justify-center max-w-4x">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-[#FF5D00] rounded-2xl flex items-center justify-center rotate-3 shadow-lg shadow-[#FF5D00]/20">
              <Zap className="w-6 h-6 text-white fill-white" />
           </div>
           <span className="text-xs font-black uppercase tracking-[0.5em] text-[#FF5D00]">The Intelligence Radar</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-[#1A1A1E] tracking-tighter leading-none mb-8 italic">
          WOW3D<br />
          PRINTING<br />
          <span className="text-[#FF5D00]">TIMES</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-xl leading-relaxed mb-12">
          최첨단 3D 프린팅 기술과 차세대 제조 인텔리전스를 연결하는 <br />
          국내 유일의 프리미엄 3D 기술 미디어 플랫폼입니다.
        </p>

        <div className="flex items-center gap-6">
           <Link href="#feed" className="px-10 py-5 bg-[#1A1A1E] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#FF5D00] hover:shadow-2xl hover:shadow-[#FF5D00]/30 transition-all duration-500">
              Explore Latest Intel
           </Link>
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#ADB5BD]">
              <Radio className="w-4 h-4 text-[#FF5D00] animate-pulse" />
              Real-time_Sync_Active
           </div>
        </div>
      </div>
    </section>
  );
}

// Magazine Grid Card (White Theme)
function MagazineCard({ item }: { item: ArticleWithCategory }) {
  const { article, category } = item;
  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col h-full bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-[#FF5D00]/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
      <ArticleImage src={article.thumbnailKey} fallbackContent={article.content} alt={article.title} className="aspect-[16/10] w-full" />
      <div className="p-7 flex-1 flex flex-col">
        {category && (
          <div className="text-[9px] font-black text-[#FF5D00] uppercase tracking-[0.25em] mb-4">
            {category.name}
          </div>
        )}
        <h3 className="text-base font-black text-[#1A1A1E] leading-snug group-hover:text-[#FF5D00] transition-colors mb-4 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-6 font-medium">
          {getExcerpt(article.content, 80)}
        </p>
        <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[9px] font-black text-gray-300 uppercase tracking-widest"><Clock className="w-3 h-3" />{timeAgo(article.publishedAt)}</span>
          <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#FF5D00] transition-colors shadow-sm">
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Trending Pulse Bar (White Theme)
function TrendingBar({ items }: { items: ArticleWithCategory[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 flex items-center gap-3 italic">
           <TrendingUp className="w-4 h-4 text-[#FF5D00]" />
           Trending Intel
        </h2>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF5D00]" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-100" />
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        {items.map((item, i) => (
          <Link key={item.article.id} href={`/articles/${item.article.slug}`} className="flex gap-5 group items-start">
            <span className="text-3xl font-black italic select-none" style={{ color: i < 3 ? 'rgba(255,93,0,0.15)' : 'rgba(0,0,0,0.03)' }}>
              {(i + 1).toString().padStart(2, '0')}
            </span>
            <div className="flex-1">
              <h4 className="text-[13px] font-bold text-gray-700 leading-snug group-hover:text-[#FF5D00] transition-colors line-clamp-2">
                {item.article.title}
              </h4>
              <div className="mt-2 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-300">
                <span>{item.category?.name || 'TECHNOLOGY'}</span>
                <span className="opacity-30">•</span>
                <span>{timeAgo(item.article.publishedAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Wow3dHomePage({
  latestData,
  totalPages,
  currentPage,
  dbError,
}: Wow3dHomePageProps) {
  // 최신 순서대로 기사 배치 조정
  const trending = latestData.slice(0, 5); // 트렌딩은 상위 5개 유지
  const feedTop = latestData.slice(0, 4);  // 피드 상단 4개
  const feedRest = latestData.slice(4);    // 나머지 아카이브

  return (
    <div className="min-h-screen pb-24 bg-white" style={{ color: '#1A1A1E' }}>
      <main className="container mx-auto px-4 md:px-6">
        
        {/* Intelligence Status Header (White Theme) */}
        <div className="py-12 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 mb-12">
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5D00] shadow-[0_0_10px_rgba(255,93,0,0.5)] animate-pulse" />
                  Live_Satellite_Data
               </div>
               <div className="hidden lg:flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 border-l border-gray-100 pl-10">
                  <Award className="w-3.5 h-3.5" />
                  Verified_Media
               </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
               <Layers className="w-3.5 h-3.5" />
               Layer_Sync: <span className="text-[#1A1A1E]">0x{currentPage.toString(16).toUpperCase()}</span>
            </div>
        </div>

        {currentPage === 1 && (
          <DigitalBrandingHero />
        )}

        {/* Phase 2: Feed & Sidebar */}
        <section id="feed" className="mb-32 grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
           <div className="lg:col-span-8 flex flex-col gap-12">
              <div className="flex items-center gap-4">
                 <span className="w-16 h-0.5 bg-[#FF5D00]" />
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">Technology Intel Feed</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {feedTop.map((item) => (
                   <MagazineCard key={item.article.id} item={item} />
                 ))}
              </div>
           </div>
           
           <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit bg-gray-50/50 border border-gray-100 p-10 rounded-[2.5rem]">
              <TrendingBar items={trending} />
              
              {/* Premium Action Card */}
              <div className="mt-14 p-8 rounded-3xl bg-[#FF5D00] shadow-[0_20px_40px_rgba(255,93,0,0.3)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                 <Zap className="relative w-8 h-8 text-white mb-4 fill-white" />
                 <h3 className="relative text-xl font-black text-white italic tracking-tighter mb-4">WOW3D <br />Partnership Radar</h3>
                 <p className="relative text-[10px] font-bold uppercase tracking-widest text-white/70 mb-8 leading-relaxed">3D 테크 기업을 위한 최상의 광고 솔루션</p>
                 <Link href="mailto:wow3d16@naver.com" className="relative block w-full py-4 bg-white text-[#FF5D00] text-[10px] font-black uppercase tracking-[0.2em] text-center rounded-xl hover:bg-white/90 transition-colors shadow-lg">
                    Connect with Us
                 </Link>
              </div>
           </aside>
        </section>

        {/* Phase 3: Archive Grid */}
        <section className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5D00] tracking-widest">Global Archives</p>
              <h2 className="text-4xl font-black text-[#1A1A1E] tracking-tighter italic lg:text-5xl">Deep Intel Streams</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {feedRest.map((item) => (
              <MagazineCard key={item.article.id} item={item} />
            ))}
          </div>

          {feedRest.length === 0 && currentPage > 1 && (
            <div className="py-40 text-center border-2 border-dashed border-gray-100 rounded-[4rem] bg-gray-50/50">
               <Cpu className="w-16 h-16 text-gray-200 mx-auto mb-8 animate-pulse" />
               <p className="text-xl font-black uppercase italic tracking-widest text-gray-300">No Data Synchronized Yet</p>
            </div>
          )}
        </section>
            <div className="py-40 text-center border-2 border-dashed border-gray-100 rounded-[4rem] bg-gray-50/50">
               <Cpu className="w-16 h-16 text-gray-200 mx-auto mb-8 animate-pulse" />
               <p className="text-xl font-black uppercase italic tracking-widest text-gray-300">No Data Synchronized Yet</p>
            </div>
          )}
        </section>

        {/* Improved Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 py-20 border-t border-gray-100 flex flex-col items-center gap-12">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link key={page} href={`/?page=${page}`}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all"
                  style={
                    page === currentPage
                      ? { background: '#1A1A1E', color: 'white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }
                      : { background: '#F8F9FA', color: '#ADB5BD', border: '1px solid #E9ECEF' }
                  }>
                  {page.toString().padStart(2, '0')}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
