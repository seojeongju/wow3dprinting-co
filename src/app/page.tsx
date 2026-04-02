import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { desc, eq, count, or } from 'drizzle-orm';
import { headers } from 'next/headers';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import Wow3dHomePage from '@/components/Wow3dHomePage';
import Link from 'next/link';
import { Zap, TrendingUp, BarChart3, Globe } from 'lucide-react';

export const runtime = 'edge';

const ARTICLES_PER_PAGE = 12; // 1 Hero + 3 Side + 8 Grid

/**
 * 사이트별 기사 조회 필터
 * - 'times': target_sites가 'times' 또는 'both'인 기사
 * - 'wow3d': target_sites가 'wow3d' 또는 'both'인 기사
 */
async function getLatestArticles(page: number = 1, siteId: 'times' | 'wow3d' = 'times') {
  try {
    const db = getDb();
    const siteFilter = siteId === 'wow3d'
      ? or(eq(articles.targetSites, 'wow3d'), eq(articles.targetSites, 'both'))
      : or(eq(articles.targetSites, 'times'), eq(articles.targetSites, 'both'));

    const results = await db
      .select({
        article: articles,
        category: categories,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt))
      .limit(ARTICLES_PER_PAGE)
      .offset((page - 1) * ARTICLES_PER_PAGE);

    return results;
  } catch (error) {
    console.error('Fetch Articles Error:', error);
    return [];
  }
}

async function getTotalArticlesCount(siteId: 'times' | 'wow3d' = 'times') {
  try {
    const db = getDb();
    const result = await db
      .select({ value: count() })
      .from(articles)
      .where(eq(articles.status, 'published'))
      .get();

    return result?.value || 0;
  } catch (error) {
    console.error('Count Articles Error:', error);
    return 0;
  }
}

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);

  // host 헤더를 직접 읽어 사이트 분기 (미들웨어보다 안정적)
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteId: 'times' | 'wow3d' =
    host.includes('wow3dprinting.com') && !host.includes('.co.kr') ? 'wow3d' : 'times';

  let latestData: Awaited<ReturnType<typeof getLatestArticles>> = [];
  let totalCount = 0;
  let dbError: string | null = null;

  try {
    [latestData, totalCount] = await Promise.all([
      getLatestArticles(currentPage, siteId),
      getTotalArticlesCount(siteId),
    ]);
  } catch (error: any) {
    console.error('Home Page Error:', error);
    dbError = error.message;
  }

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  // === 와우3D프린팅타임즈 (wow3dprinting.com) 렌더링 ===
  if (siteId === 'wow3d') {
    return (
      <Wow3dHomePage
        latestData={latestData}
        totalPages={totalPages}
        currentPage={currentPage}
        dbError={dbError}
      />
    );
  }

  // === 3D프린팅타임즈 (wow3dprinting.co.kr) 렌더링 (기존 유지) ===
  const [heroArticle, ...remainingArticles] = latestData;
  const sideArticles = remainingArticles.slice(0, 3);
  const gridArticles = remainingArticles.slice(3);

  const techIndex = (1.24 + (Math.random() * 0.1 - 0.05)).toFixed(2);
  const aiAdoption = (84.2 + (Math.random() * 2.0 - 1.0)).toFixed(1);
  const isIndexPositive = parseFloat(techIndex) >= 0;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 min-h-screen">
      {/* 시스템 스테이터스 바 */}
      <div className="mb-12 flex items-center justify-between border-y border-primary/10 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            GLOBAL TECH INDEX: <span className={isIndexPositive ? 'text-primary' : 'text-destructive'}>
              {isIndexPositive ? '+' : ''}{techIndex}%
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 border-l pl-6">
            <BarChart3 className="w-3 h-3" />
            AI ADOPTION RATE: <span className="text-primary">{aiAdoption}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 fill-primary text-primary" />
          SYSTEM STATUS: <span className="text-primary uppercase">Active_Link_{Math.floor(Math.random() * 900) + 100}</span>
        </div>
      </div>

      {dbError && (
        <div className="mb-8 p-6 bg-destructive/5 border border-destructive/20 text-destructive rounded-[2rem] flex items-center gap-4">
          <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black uppercase tracking-widest text-xs">CRITICAL CONNECTION ERROR</p>
            <p className="text-sm opacity-70">데이터베이스 동기화 중 오류가 발생했습니다. 잠시 후 서버가 재기동됩니다.</p>
          </div>
        </div>
      )}

      {/* Hero Spotlight Section */}
      {heroArticle && currentPage === 1 ? (
        <section className="mb-24 grid grid-cols-1 gap-16 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Spotlight Intelligence</h2>
            </div>
            <NewsCard article={{ ...heroArticle.article, category: heroArticle.category }} priority />
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="flex items-center justify-between mb-8 border-b border-primary/20 pb-4">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">Latest Briefing</h2>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-2">
              {sideArticles.map((item) => (
                <NewsCard key={item.article.id} article={{ ...item.article, category: item.category }} horizontal />
              ))}
            </div>

            {/* Newsletter Shortcut Card */}
            <div className="mt-12 p-8 bg-primary rounded-[2.5rem] text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <Zap className="absolute -right-4 -top-4 w-24 h-24 opacity-10 rotate-12 transition-transform group-hover:scale-125" />
              <h3 className="text-xl font-black italic tracking-tighter leading-tight mb-4">
                Stay Ahead <br />of the Tech Curve
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-6">
                매일 아침 3D 프린팅 AI 인사이트를 보내드립니다.
              </p>
              <button className="w-full bg-white text-primary py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all">
                JOIN THE RADAR
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Primary Intelligence Grid */}
      <section className="mb-32">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase text-foreground">Intelligence Radar</h2>
            <div className="h-px w-32 bg-muted hidden md:block" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(currentPage === 1 ? gridArticles : latestData).map((item) => (
            <NewsCard key={item.article.id} article={{ ...item.article, category: item.category }} />
          ))}
        </div>
      </section>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="mt-12 py-20 border-t border-muted-foreground/10 flex flex-col items-center gap-8">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
            Page {currentPage} of {totalPages} Intelligence Layers
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      )}

      {/* Partnership & Advertisement Section */}
      <section className="mb-12 mt-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0A0A0B] p-8 md:p-12 text-white border border-white/5 shadow-2xl">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-2 py-0.5 bg-primary text-black text-[9px] font-black uppercase tracking-[0.2em] rounded">
                  PARTNERSHIP
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">ADVERTISE WITH US</h2>
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight mb-6 italic">
                Connect with the Future of <span className="text-primary">3D Tech.</span>
              </h3>
              <p className="text-white/70 text-sm md:text-base leading-relaxed mb-8 font-medium">
                글로벌 기술 리더들에게 귀사의 혁신을 직접 전달하세요.
                강력한 AI 오디언스 타겟팅으로 광고 효율을 극대화합니다.
              </p>
              <Link href="mailto:wow3d16@naver.com" className="inline-block bg-primary text-black px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all active:scale-95">
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
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center min-w-[120px]">
                  <div className="text-[8px] font-black tracking-[0.1em] text-primary/60 mb-1 uppercase">{stat.label}</div>
                  <div className="text-lg font-black italic tracking-tighter">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {latestData.length === 0 && (
        <div className="py-40 text-center border-4 border-dashed rounded-[4rem] bg-muted/5 flex flex-col items-center">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-8">
            <Globe className="w-10 h-10 opacity-20 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black italic text-muted-foreground opacity-30 uppercase tracking-tighter">Initializing Intelligence Feed</h2>
          <p className="text-sm mt-4 text-muted-foreground font-medium max-w-sm">
            인공지능 엔진이 최신 기술 데이터를 동기화하고 있습니다. 잠시만 기다려 주십시오.
          </p>
        </div>
      )}
    </div>
  );
}
