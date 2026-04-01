import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import NewsCard from '@/components/NewsCard';

export const runtime = 'edge';

async function getLatestArticles() {
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
      .limit(10);
    
    return results;
  } catch (error) {
    console.error('Fetch Articles Error:', error);
    return [];
  }
}

export default async function Home() {
  let latestData: Awaited<ReturnType<typeof getLatestArticles>> = [];
  let dbError: string | null = null;

  try {
    latestData = await getLatestArticles();
  } catch (error: any) {
    console.error('Home Page Error:', error);
    dbError = error.message;
  }

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
          <h2 className="text-3xl font-black uppercase tracking-tighter">기술 인텔리전스</h2>
          <p className="text-sm text-muted-foreground font-medium tracking-[0.2em] opacity-60">WOW3D의 공식 기술 미디어</p>
        </div>
        <div className="px-4 py-2 bg-muted/30 border rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Live Updates: {latestData.length > 0 ? 'Active' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Hero Section */}
      {heroArticle ? (
        <section className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <NewsCard article={{ ...heroArticle.article, category: heroArticle.category }} priority />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-10 divide-y">
            <h2 className="text-xs font-black tracking-[0.3em] border-b pb-2 opacity-50">최신 업데이트</h2>
            {remainingArticles.slice(0, 3).map((item) => (
              <div key={item.article.id} className="pt-6">
                 <NewsCard article={{ ...item.article, category: item.category }} compact />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="py-32 text-center border-2 border-dashed rounded-3xl bg-muted/20">
           <h2 className="text-2xl font-black italic text-muted-foreground opacity-30">등록된 기사가 없습니다</h2>
           <p className="text-sm mt-4 text-muted-foreground font-medium">곧 3D 프린팅과 AI, 로보틱스의 미래가 다뤄질 예정입니다.</p>
        </div>
      )}

      {/* Grid Section */}
      {remainingArticles.length > 3 && (
        <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {remainingArticles.slice(3).map((item) => (
             <NewsCard key={item.article.id} article={{ ...item.article, category: item.category }} />
           ))}
        </section>
      )}
    </div>
  );
}
