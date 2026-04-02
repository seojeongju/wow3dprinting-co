import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';

export const runtime = 'edge';

const ARTICLES_PER_PAGE = 12;

async function getLatestArticles(page: number = 1) {
  try {
    const db = getDb();
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

async function getTotalArticlesCount() {
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

  let latestData: Awaited<ReturnType<typeof getLatestArticles>> = [];
  let totalCount = 0;
  let dbError: string | null = null;

  try {
    [latestData, totalCount] = await Promise.all([
      getLatestArticles(currentPage),
      getTotalArticlesCount()
    ]);
  } catch (error: any) {
    console.error('Home Page Error:', error);
    dbError = error.message;
  }

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);
  const [heroArticle, ...remainingArticles] = latestData;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 min-h-screen">
      {/* 에러 발생 시에만 경고 표시 */}
      {dbError && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
          <p className="font-bold">⚠️ 서비스 일시 중단 안내</p>
          <p className="text-sm opacity-80">데이터베이스 연결에 문제가 발생했습니다. 관리자에게 문의해 주세요.</p>
        </div>
      )}

      {/* Search Header */}
      <div className="mb-12 border-b pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">기술 인사이트</h2>
          <p className="text-sm text-muted-foreground font-medium tracking-[0.2em] opacity-60">미래 기술을 읽는 3D프린팅타임즈 소식</p>
        </div>
      </div>

      {/* Hero Section - 1페이지에서만 노출 */}
      {heroArticle && currentPage === 1 ? (
        <section className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <NewsCard article={{ ...heroArticle.article, category: heroArticle.category }} priority />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-10 divide-y">
            <h2 className="text-xs font-black tracking-[0.3em] border-b pb-2 opacity-50 uppercase">최신 업데이트</h2>
            {remainingArticles.slice(0, 3).map((item) => (
              <div key={item.article.id} className="pt-6">
                 <NewsCard article={{ ...item.article, category: item.category }} compact />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Grid Section */}
      <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-20">
        {(currentPage === 1 ? remainingArticles.slice(3) : latestData).map((item) => (
          <NewsCard key={item.article.id} article={{ ...item.article, category: item.category }} />
        ))}
      </section>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="mt-12 py-12 border-t flex justify-center">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
          />
        </div>
      )}

      {latestData.length === 0 && (
        <div className="py-32 text-center border-2 border-dashed rounded-3xl bg-muted/20">
           <h2 className="text-2xl font-black italic text-muted-foreground opacity-30 uppercase">기사 데이터 로드 대기 중</h2>
           <p className="text-sm mt-4 text-muted-foreground font-medium">관리자 시스템에서 마이그레이션이 원활하게 진행 중입니다.</p>
        </div>
      )}
    </div>
  );
}
