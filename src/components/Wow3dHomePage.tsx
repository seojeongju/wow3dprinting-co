/**
 * 와우3D프린팅타임즈 (wow3dprinting.com) 전용 홈페이지
 * 기존 3D프린팅타임즈와 동일한 구조, 오렌지/앰버 컬러톤 적용
 */
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { Zap, TrendingUp, BarChart3, Globe } from 'lucide-react';

type ArticleWithCategory = {
  article: any;
  category: any;
};

interface Wow3dHomePageProps {
  latestData: ArticleWithCategory[];
  totalPages: number;
  currentPage: number;
  dbError: string | null;
}

export default function Wow3dHomePage({
  latestData,
  totalPages,
  currentPage,
  dbError,
}: Wow3dHomePageProps) {
  const [heroArticle, ...remainingArticles] = latestData;
  const sideArticles = remainingArticles.slice(0, 3);
  const gridArticles = remainingArticles.slice(3);

  const techIndex = (1.24 + (Math.random() * 0.1 - 0.05)).toFixed(2);
  const aiAdoption = (84.2 + (Math.random() * 2.0 - 1.0)).toFixed(1);
  const isIndexPositive = parseFloat(techIndex) >= 0;

  return (
    // 와우3D 사이트 전용 오렌지/앰버 컬러 CSS 변수 오버라이드
    <div
      className="container mx-auto px-4 py-12 md:px-6 min-h-screen"
      style={{
        '--site-primary': '#F97316',
        '--site-primary-dark': '#EA580C',
        '--site-primary-light': '#FED7AA',
        '--site-primary-bg': '#FFF7ED',
      } as React.CSSProperties}
    >
      {/* 와우3D 사이트 전용 컬러 스타일 주입 */}
      <style>{`
        .wow3d-accent { color: #F97316; }
        .wow3d-bg { background-color: #F97316; }
        .wow3d-border { border-color: #F97316; }
        .wow3d-badge { background-color: #FFF7ED; color: #C2410C; }
        .wow3d-btn { background-color: #F97316; color: white; }
        .wow3d-btn:hover { background-color: #EA580C; }
        .wow3d-card-accent { border-color: #F97316; }
        .wow3d-shadow { box-shadow: 0 4px 30px rgba(249, 115, 22, 0.15); }
      `}</style>

      {/* 신규 사이트 배너 (와우3D 브랜드 표시) */}
      <div className="mb-8 flex items-center gap-3 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 w-fit">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">
          Wow3D Printing Times — wow3dprinting.com
        </span>
      </div>

      {/* 시스템 스테이터스 바 */}
      <div className="mb-12 flex items-center justify-between border-y py-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40"
        style={{ borderColor: 'rgba(249,115,22,0.15)' }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            GLOBAL 3D INDEX: <span className={`ml-1 ${isIndexPositive ? 'wow3d-accent' : 'text-destructive'}`}>
              {isIndexPositive ? '+' : ''}{techIndex}%
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 border-l pl-6" style={{ borderColor: 'rgba(249,115,22,0.2)' }}>
            <BarChart3 className="w-3 h-3" />
            PRINT ADOPTION: <span className="ml-1 wow3d-accent">{aiAdoption}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" style={{ color: '#F97316', fill: '#F97316' }} />
          SYSTEM: <span className="ml-1 wow3d-accent uppercase">Active_Wow3D_{Math.floor(Math.random() * 900) + 100}</span>
        </div>
      </div>

      {dbError && (
        <div className="mb-8 p-6 bg-orange-50 border border-orange-200 text-orange-700 rounded-[2rem] flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black uppercase tracking-widest text-xs">CONNECTION ERROR</p>
            <p className="text-sm opacity-70">데이터베이스 동기화 중 오류 발생. 잠시 후 재시도해 주세요.</p>
          </div>
        </div>
      )}

      {/* Hero Spotlight Section */}
      {heroArticle && currentPage === 1 ? (
        <section className="mb-24 grid grid-cols-1 gap-16 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px" style={{ background: '#F97316' }} />
              <h2 className="text-xs font-black uppercase tracking-[0.4em] wow3d-accent">Premium Intelligence</h2>
            </div>
            <NewsCard article={{ ...heroArticle.article, category: heroArticle.category }} priority />
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: '1px solid rgba(249,115,22,0.2)' }}>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Hot Topics</h2>
              <TrendingUp className="w-4 h-4" style={{ color: '#F97316' }} />
            </div>
            <div className="flex flex-col gap-2">
              {sideArticles.map((item) => (
                <NewsCard key={item.article.id} article={{ ...item.article, category: item.category }} horizontal />
              ))}
            </div>

            {/* 뉴스레터 카드 - 오렌지 테마 */}
            <div className="mt-12 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 20px 60px rgba(249,115,22,0.3)' }}>
              <Zap className="absolute -right-4 -top-4 w-24 h-24 opacity-10 rotate-12 transition-transform group-hover:scale-125" />
              <h3 className="text-xl font-black italic tracking-tighter leading-tight mb-4">
                3D Printing<br />Innovation Hub
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-6">
                매일 아침 최신 3D 프린팅 소식을 받아보세요.
              </p>
              <button className="w-full bg-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-50 transition-all"
                style={{ color: '#EA580C' }}>
                JOIN WOW3D RADAR
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* 기사 그리드 섹션 */}
      <section className="mb-32">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Printing Radar</h2>
            <div className="h-px w-24 bg-muted hidden md:block" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(currentPage === 1 ? gridArticles : latestData).map((item) => (
            <NewsCard key={item.article.id} article={{ ...item.article, category: item.category }} />
          ))}
        </div>
      </section>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-12 py-20 border-t flex flex-col items-center gap-8" style={{ borderColor: 'rgba(249,115,22,0.1)' }}>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
            Page {currentPage} of {totalPages} — Wow3D Intelligence
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}

      {/* 광고/제휴 섹션 - 오렌지 테마 */}
      <section className="mb-12 mt-12">
        <div className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 text-white border shadow-2xl"
          style={{ background: '#1A0A00', borderColor: 'rgba(249,115,22,0.15)' }}>
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-[80px]"
            style={{ background: 'rgba(249,115,22,0.15)' }} />

          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] rounded"
                  style={{ background: '#F97316', color: 'white' }}>
                  PARTNERSHIP
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] italic" style={{ color: 'rgba(249,115,22,0.5)' }}>
                  ADVERTISE WITH WOW3D
                </h2>
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight mb-4 italic">
                Connect with 3D Printing <span style={{ color: '#F97316' }}>Innovators.</span>
              </h3>
              <p className="text-[11px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                3D프린팅 전문 크리에이터와 기업에게 귀사의 혁신을 직접 전달하세요.
              </p>
              <Link
                href="mailto:wow3d16@naver.com"
                className="inline-block px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                style={{ background: '#F97316', color: 'white' }}
              >
                광고 등록 및 제휴 문의
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
              {[
                { label: 'Monthly Traffic', value: '45K+' },
                { label: 'Global Reach', value: '180+' },
                { label: 'Conversion', value: '12.4%' },
                { label: 'Avg Reading', value: '04:20' }
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl text-center min-w-[120px]"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.1)' }}>
                  <div className="text-[8px] font-black tracking-[0.1em] mb-1 uppercase"
                    style={{ color: 'rgba(249,115,22,0.6)' }}>{stat.label}</div>
                  <div className="text-lg font-black italic tracking-tighter">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {latestData.length === 0 && (
        <div className="py-40 text-center border-4 border-dashed rounded-[4rem] bg-muted/5 flex flex-col items-center"
          style={{ borderColor: 'rgba(249,115,22,0.2)' }}>
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-8">
            <Globe className="w-10 h-10 opacity-20 animate-pulse" style={{ color: '#F97316' }} />
          </div>
          <h2 className="text-3xl font-black italic text-muted-foreground opacity-30 uppercase tracking-tighter">
            Initializing Wow3D Feed
          </h2>
          <p className="text-sm mt-4 text-muted-foreground font-medium max-w-sm">
            3D 프린팅 최신 소식을 동기화하고 있습니다. 잠시만 기다려 주십시오.
          </p>
        </div>
      )}
    </div>
  );
}
