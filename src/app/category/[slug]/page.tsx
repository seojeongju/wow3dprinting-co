import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import NewsCard from '@/components/NewsCard';

export const runtime = 'edge';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  // Next.js 15: params 맵은 비동기적으로 해결해야 합니다.
  const resolvedParams = await params;
  const db = getDb();

  // 1. 해당 슬러그의 카테고리 정보 가져오기
  const category = await db.select().from(categories).where(eq(categories.slug, resolvedParams.slug)).get();

  if (!category) {
    notFound(); // 404 페이지로 라우팅
  }

  // 2. 해당 카테고리에 속한 공개된 기사 목록 최신순으로 가져오기
  const categoryArticles = await db
    .select()
    .from(articles)
    .where(and(eq(articles.categoryId, category.id), eq(articles.status, 'published')))
    .orderBy(desc(articles.publishedAt))
    .all();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      {/* 카테고리 헤더 */}
      <div className="mb-12 border-b-4 border-primary pb-6 inline-block pr-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-3">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            {category.description}
          </p>
        )}
      </div>

      {/* 기사 목록 그리드 */}
      {categoryArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoryArticles.map((article) => (
            <NewsCard 
              key={article.id} 
              article={{ ...article, category: category }} 
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center bg-muted/20 border border-dashed rounded-xl">
          <p className="text-muted-foreground font-medium">아직 이 카테고리에 등록된 기사가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
