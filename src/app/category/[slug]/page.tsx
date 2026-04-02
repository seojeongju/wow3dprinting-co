import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(resolvedSearchParams.page as string) || 1);
  const limit = 12; // 한 페이지에 12개 노출
  const offset = (page - 1) * limit;

  const db = getDb();

  // 1. 해당 슬러그의 카테고리 정보 가져오기
  const category = await db.select().from(categories).where(eq(categories.slug, resolvedParams.slug)).get();

  if (!category) {
    notFound();
  }

  // 2. 해당 카테고리에 속한 공개된 전체 기사 개수 카운트
  const totalArticlesRes = await db
    .select({ total: count() })
    .from(articles)
    .where(and(eq(articles.categoryId, category.id), eq(articles.status, 'published')))
    .get();
  
  const totalArticles = totalArticlesRes?.total || 0;
  const totalPages = Math.ceil(totalArticles / limit);

  // 3. 해당 카테고리에 속한 공개된 기사 목록 최신순으로 가져오기 (Paging 적용)
  const categoryArticles = await db
    .select()
    .from(articles)
    .where(and(eq(articles.categoryId, category.id), eq(articles.status, 'published')))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset)
    .all();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
      {/* 카테고리 헤더 */}
      <div className="mb-12 border-b-4 border-primary pb-6 inline-block pr-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-1">
          {category.name}
        </h1>
        <div className="flex items-center gap-4">
          {category.description && (
            <p className="text-muted-foreground text-sm font-medium tracking-wide">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* 기사 목록 그리드 */}
      {categoryArticles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categoryArticles.map((article) => (
              <NewsCard 
                key={article.id} 
                article={{ ...article, category: category }} 
              />
            ))}
          </div>

          {/* 페이지네이션 UI */}
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            baseUrl={`/category/${resolvedParams.slug}`} 
          />
        </>
      ) : (
        <div className="py-24 text-center bg-muted/20 border border-dashed rounded-xl">
          <p className="text-muted-foreground font-medium">아직 이 카테고리에 등록된 기사가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
