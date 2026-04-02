'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, Eye, ArrowRight, Flame, TrendingUp, Star, ChevronRight } from 'lucide-react';

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

function getExcerpt(content: string, maxLen = 80) {
  const plain = content
    .replace(/!\[.*?\]\(.*?\)/g, '')   // 마크다운 이미지 제거 ![alt](url)
    .replace(/\[.*?\]\(.*?\)/g, '')    // 마크다운 링크 제거 [text](url)
    .replace(/https?:\/\/\S+/g, '')    // 남은 URL 제거
    .replace(/[#*`>\-_]/g, '')         // 마크다운 특수문자 제거
    .replace(/\n+/g, ' ')              // 줄바꿈 → 공백
    .replace(/\s{2,}/g, ' ')           // 다중 공백 정리
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

function timeAgo(date: Date | null) {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
  } catch { return ''; }
}

// 와우3D 전용 기사 카드 (메인 Hero)
function HeroCard({ item }: { item: ArticleWithCategory }) {
  const { article, category } = item;
  return (
    <Link href={`/articles/${article.slug}`} className="relative group block rounded-3xl overflow-hidden"
      style={{ minHeight: 420 }}>
      {/* 썸네일 */}
      <div className="absolute inset-0 w-full h-full">
        {article.thumbnailKey ? (
          <img src={`/api/media/${article.thumbnailKey}`} alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full" style={{
            background: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 50%, #F97316 100%)'
          }} />
        )}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(15,5,0,0.95) 0%, rgba(15,5,0,0.6) 40%, rgba(15,5,0,0.1) 100%)'
        }} />
      </div>

      {/* 컨텐츠 */}
      <div className="relative flex flex-col justify-end h-full p-8" style={{ minHeight: 420 }}>
        {category && (
          <span className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit"
            style={{ background: '#F97316', color: 'white' }}>
            <Flame className="w-2.5 h-2.5 fill-white" />
            {category.name}
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3 group-hover:text-orange-300 transition-colors">
          {article.title}
        </h2>
        <p className="text-sm text-orange-100/60 leading-relaxed mb-4 hidden md:block">
          {getExcerpt(article.content, 100)}
        </p>
        <div className="flex items-center gap-4 text-[11px] text-orange-200/40 font-medium">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(article.publishedAt)}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />조회 1.2K</span>
        </div>
      </div>

      {/* 호버 화살표 */}
      <div className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
        style={{ background: '#F97316' }}>
        <ArrowRight className="w-4 h-4 text-white" />
      </div>
    </Link>
  );
}

// 와우3D 전용 기사 카드 (리스트형)
function ListCard({ item, rank }: { item: ArticleWithCategory; rank?: number }) {
  const { article, category } = item;
  return (
    <Link href={`/articles/${article.slug}`}
      className="flex gap-4 p-4 rounded-2xl group transition-all hover:bg-orange-500/5"
      style={{ border: '1px solid rgba(249,115,22,0.08)' }}>
      {rank !== undefined && (
        <span className="text-4xl font-black leading-none shrink-0 w-8 text-center"
          style={{ color: rank < 3 ? '#F97316' : 'rgba(249,115,22,0.2)' }}>
          {rank + 1}
        </span>
      )}
      <div className="flex gap-3 flex-1 min-w-0">
        {article.thumbnailKey && (
          <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0">
            <img src={`/api/media/${article.thumbnailKey}`} alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {category && (
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#F97316' }}>
              {category.name}
            </span>
          )}
          <h3 className="text-sm font-bold text-orange-50/90 leading-snug mt-1 group-hover:text-orange-300 transition-colors line-clamp-2">
            {article.title}
          </h3>
          <span className="text-[10px] text-orange-200/30 mt-1 block">{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

// 와우3D 전용 기사 카드 (그리드형)
function GridCard({ item }: { item: ArticleWithCategory }) {
  const { article, category } = item;
  return (
    <Link href={`/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,115,22,0.08)' }}>
      {/* 이미지 */}
      <div className="relative overflow-hidden aspect-video">
        {article.thumbnailKey ? (
          <img src={`/api/media/${article.thumbnailKey}`} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1C0A00, #7C2D12)' }}>
            <span className="text-4xl font-black italic" style={{ color: 'rgba(249,115,22,0.2)' }}>3D</span>
          </div>
        )}
        {category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase"
            style={{ background: 'rgba(249,115,22,0.9)', color: 'white' }}>
            {category.name}
          </span>
        )}
      </div>
      {/* 내용 */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-bold text-orange-50/90 leading-snug group-hover:text-orange-300 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,200,150,0.4)' }}>
          {getExcerpt(article.content)}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3"
          style={{ borderTop: '1px solid rgba(249,115,22,0.08)' }}>
          <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(249,115,22,0.4)' }}>
            <Clock className="w-3 h-3" />{timeAgo(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: '#F97316' }}>
            읽기 <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Wow3dHomePage({
  latestData,
  totalPages,
  currentPage,
  dbError,
}: Wow3dHomePageProps) {
  const [hero, second, ...rest] = latestData;
  const topArticles = rest.slice(0, 5);
  const gridArticles = rest.slice(5);

  return (
    <div className="min-h-screen" style={{ background: '#0F0500', color: '#FFF7ED' }}>
      {/* 전역 스타일 */}
      <style>{`
        .wow3d-page * { box-sizing: border-box; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>

      <div className="wow3d-page container mx-auto px-4 py-8 md:px-6">

        {/* === 메인 Hero 섹션 === */}
        {latestData.length > 0 && currentPage === 1 && (
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Hero 기사 (2/3) */}
              {hero && (
                <div className="lg:col-span-2 anim-fade-up">
                  <HeroCard item={hero} />
                </div>
              )}

              {/* 두 번째 기사 + 인기 랭킹 (1/3) */}
              <div className="flex flex-col gap-4">
                {/* 두 번째 기사 */}
                {second && (
                  <Link href={`/articles/${second.article.slug}`}
                    className="relative rounded-2xl overflow-hidden group"
                    style={{ minHeight: 200 }}>
                    {second.article.thumbnailKey ? (
                      <img src={`/api/media/${second.article.thumbnailKey}`} alt=""
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #431407, #EA580C)' }} />
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,5,0,0.9), transparent)' }} />
                    <div className="relative p-5 flex flex-col justify-end h-full" style={{ minHeight: 200 }}>
                      {second.category && (
                        <span className="text-[10px] font-black uppercase" style={{ color: '#F97316' }}>
                          {second.category.name}
                        </span>
                      )}
                      <h3 className="text-base font-black text-white leading-tight mt-1 group-hover:text-orange-300 transition-colors line-clamp-2">
                        {second.article.title}
                      </h3>
                    </div>
                  </Link>
                )}

                {/* 🔥 현재 인기 */}
                <div className="flex-1 rounded-2xl p-5" style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.1)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4" style={{ color: '#F97316' }} />
                    <h3 className="text-xs font-black tracking-widest uppercase text-orange-300/70">지금 인기</h3>
                  </div>
                  <div className="flex flex-col gap-1">
                    {topArticles.slice(0, 4).map((item, i) => (
                      <ListCard key={item.article.id} item={item} rank={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* === 뉴스레터 배너 === */}
        {currentPage === 1 && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-10"
              style={{ background: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 50%, #F97316 100%)' }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-orange-200/60 mb-2">NEWSLETTER</p>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    3D 프린팅 트렌드를<br />매일 아침 받아보세요
                  </h3>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <input type="email" placeholder="이메일 주소 입력"
                    className="flex-1 md:w-64 px-5 py-3.5 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                  <button className="px-6 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95"
                    style={{ background: 'white', color: '#EA580C' }}>
                    구독
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* === 기사 그리드 === */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full" style={{ background: '#F97316' }} />
              <h2 className="text-lg font-black text-white">
                {currentPage === 1 ? '최신 뉴스' : `페이지 ${currentPage}`}
              </h2>
            </div>
            <Link href="/" className="flex items-center gap-1 text-xs font-bold transition-colors hover:text-orange-400"
              style={{ color: 'rgba(249,115,22,0.6)' }}>
              전체보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(currentPage === 1 ? gridArticles : latestData).map((item) => (
              <GridCard key={item.article.id} item={item} />
            ))}
          </div>

          {(currentPage === 1 ? gridArticles : latestData).length === 0 && (
            <div className="py-24 text-center rounded-3xl"
              style={{ border: '2px dashed rgba(249,115,22,0.15)' }}>
              <div className="text-5xl mb-4">🖨️</div>
              <p className="font-bold text-orange-200/40">아직 기사가 없습니다</p>
            </div>
          )}
        </section>

        {/* === 페이지네이션 === */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pb-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link key={page} href={`/?page=${page}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all"
                style={
                  page === currentPage
                    ? { background: '#F97316', color: 'white' }
                    : { background: 'rgba(249,115,22,0.08)', color: 'rgba(249,115,22,0.5)', border: '1px solid rgba(249,115,22,0.1)' }
                }>
                {page}
              </Link>
            ))}
          </div>
        )}

        {/* === 광고/제휴 섹션 === */}
        <section className="mb-8">
          <div className="rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8"
            style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.12)' }}>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(249,115,22,0.5)' }}>PARTNERSHIP</span>
              <h3 className="text-xl font-black text-white mt-1">
                3D 프린팅 제품/서비스를<br />
                <span style={{ color: '#F97316' }}>와우3D에 홍보하세요</span>
              </h3>
            </div>
            <Link href="mailto:wow3d16@naver.com"
              className="shrink-0 px-8 py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 8px 20px rgba(249,115,22,0.3)' }}>
              광고 문의
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
