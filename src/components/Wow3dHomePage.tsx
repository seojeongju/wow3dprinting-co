import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, Eye, ArrowRight, TrendingUp, Cpu, Zap, Share2, Layers, Award, Radio } from 'lucide-react';

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

// 프리미엄 이미지 렌더러 (Fallback 및 올바른 경로 처리)
function ArticleImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const imageSrc = src ? `/api/assets/${src}` : null;
  
  if (!imageSrc) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}
           style={{ background: 'linear-gradient(135deg, #0A0A0B 0%, #1A1B23 100%)' }}>
        <div className="text-white/5 font-black text-6xl italic select-none">3D</div>
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
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

// Spotlight Hero Component (Ultrawide)
function SpotlightHero({ item }: { item: ArticleWithCategory }) {
  const { article, category } = item;
  return (
    <Link href={`/articles/${article.slug}`} className="relative group block rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-orange-600/10">
      <div className="h-[520px] w-full">
        <ArticleImage src={article.thumbnailKey} alt={article.title} className="w-full h-full" />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(8,8,10,0) 0%, rgba(8,8,10,0.6) 40%, rgba(8,8,10,0.95) 90%, #08080A 100%)'
        }} />
      </div>

      <div className="absolute bottom-0 left-0 w-full p-8 md:p-14">
        <div className="flex items-center gap-3 mb-6">
          {category && (
            <span className="px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-orange-600 text-white shadow-lg">
              {category.name}
            </span>
          )}
          <span className="flex items-center gap-2 text-[10px] font-black text-white/40 tracking-widest uppercase">
            <Radio className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
            Spotlight Intel
          </span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-6 max-w-4xl group-hover:translate-x-2 transition-transform duration-500">
          {article.title}
        </h1>
        
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-2xl line-clamp-2">
            {getExcerpt(article.content, 180)}
          </p>
          <div className="shrink-0 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/30 border-l border-white/10 pl-8">
            <div className="flex flex-col">
              <span className="text-orange-600 mb-1">Time</span>
              <span>{timeAgo(article.publishedAt)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-orange-600 mb-1">Impact</span>
              <span>High_Value</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Advanced Grid Card
function MagazineCard({ item }: { item: ArticleWithCategory }) {
  const { article, category } = item;
  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col h-full bg-[#111114] border border-white/5 rounded-3xl overflow-hidden hover:border-orange-600/30 transition-all duration-300">
      <ArticleImage src={article.thumbnailKey} alt={article.title} className="aspect-[4/3] w-full" />
      <div className="p-6 flex-1 flex flex-col">
        {category && (
          <div className="text-[9px] font-black text-orange-600 uppercase tracking-[0.25em] mb-3">
            {category.name}
          </div>
        )}
        <h3 className="text-base font-black text-white/90 leading-snug group-hover:text-white transition-colors mb-4 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2 mb-6">
          {getExcerpt(article.content, 80)}
        </p>
        <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[9px] font-black text-white/20 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{timeAgo(article.publishedAt)}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
            <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Side Ranking Bar
function TrendingBar({ items }: { items: ArticleWithCategory[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3 italic">
           <TrendingUp className="w-4 h-4 text-orange-600" />
           Live Pulse
        </h2>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-orange-600" />
          <div className="w-1 h-1 rounded-full bg-orange-600/30" />
          <div className="w-1 h-1 rounded-full bg-orange-600/10" />
        </div>
      </div>
      
      <div className="flex flex-col gap-5">
        {items.map((item, i) => (
          <Link key={item.article.id} href={`/articles/${item.article.slug}`} className="flex gap-5 group items-start">
            <span className="text-3xl font-black italic select-none" style={{ color: i < 3 ? 'rgba(255,93,0,0.4)' : 'rgba(255,255,255,0.05)' }}>
              {(i + 1).toString().padStart(2, '0')}
            </span>
            <div className="flex-1">
              <h4 className="text-[13px] font-bold text-white/60 leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">
                {item.article.title}
              </h4>
              <div className="mt-2 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/10">
                <span>{item.category?.name || 'In-Deep'}</span>
                <span>•</span>
                <span className="text-orange-600/30 underline decoration-orange-600/10">Read Intel</span>
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
  const [hero, ...rest] = latestData;
  const trending = rest.slice(0, 5);
  const others = rest.slice(5);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#08080A' }}>
      <main className="container mx-auto px-4 md:px-6">
        
        {/* Intelligence Status Header */}
        <div className="py-12 flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 opacity-50 mb-12">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white">
                  <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                  Satellite_Active
               </div>
               <div className="hidden lg:flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 border-l border-white/10 pl-8">
                  <Award className="w-3 h-3" />
                  Premium_Media_Access
               </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
               <Layers className="w-3 h-3" />
               Current_Layer: <span className="text-white/60">0x{currentPage.toString(16).toUpperCase()}</span>
            </div>
        </div>

        {currentPage === 1 && latestData.length > 0 && (
          <>
            {/* Phase 1: Wide Hero */}
            <section className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               <SpotlightHero item={hero} />
            </section>

            {/* Phase 2: Trending & Mixed Grid */}
            <section className="mb-32 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
               <div className="lg:col-span-8 flex flex-col gap-12">
                  <div className="flex items-center gap-4">
                     <span className="w-12 h-0.5 bg-orange-600" />
                     <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Advanced Intel Feed</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {others.slice(0, 4).map((item) => (
                       <MagazineCard key={item.article.id} item={item} />
                     ))}
                  </div>
               </div>
               
               <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit bg-[#0F0F12] border border-white/5 p-10 rounded-[2.5rem]">
                  <TrendingBar items={trending} />
                  
                  {/* Premium Recruitment/Ad Card */}
                  <div className="mt-12 p-8 rounded-3xl bg-orange-600 shadow-2xl shadow-orange-600/20 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                     <Zap className="relative w-8 h-8 text-white mb-4 fill-white" />
                     <h3 className="relative text-xl font-black text-white italic tracking-tighter mb-4">와우3D 기사 제보 <br />&amp; 기술 광고</h3>
                     <p className="relative text-[10px] font-bold uppercase tracking-widest text-white/60 mb-8">혁신적인 3D 기술을 공유하십시오.</p>
                     <Link href="mailto:wow3d16@naver.com" className="relative block w-full py-4 bg-white text-orange-600 text-[10px] font-black uppercase tracking-[0.2em] text-center rounded-xl hover:bg-white/90 transition-colors">
                        Connect with Radar
                     </Link>
                  </div>
               </aside>
            </section>
          </>
        )}

        {/* Phase 3: Secondary Intelligence Grid */}
        <section className="mb-32 container mx-auto px-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 text-glow">Intelligence Radar</p>
              <h2 className="text-4xl font-black text-white tracking-tighter italic lg:text-5xl">Deep Dive Archives</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {(currentPage === 1 ? others.slice(4) : latestData).map((item) => (
              <MagazineCard key={item.article.id} item={item} />
            ))}
          </div>

          {(currentPage === 1 ? others.slice(4) : latestData).length === 0 && (
            <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/5 bg-glow-orange opacity-30">
               <Cpu className="w-16 h-16 text-white mx-auto mb-8 animate-pulse" />
               <p className="text-xl font-black uppercase italic tracking-widest text-white">Scanning for data streams...</p>
            </div>
          )}
        </section>

        {/* Global Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 py-20 border-t border-white/5 flex flex-col items-center gap-12">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link key={page} href={`/?page=${page}`}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all"
                  style={
                    page === currentPage
                      ? { background: 'white', color: 'black', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }
                      : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.05)' }
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
        .text-glow { text-shadow: 0 0 20px rgba(255,93,0,0.4); }
        .bg-glow-orange { box-shadow: inset 0 0 100px rgba(255,93,0,0.05); }
      `}</style>
    </div>
  );
}
