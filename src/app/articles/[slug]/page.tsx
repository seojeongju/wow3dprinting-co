import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { isAdmin as checkIsAdmin } from '@/lib/auth_edge';
import ArticleEditor from '@/components/ArticleEditor';

export const runtime = 'edge';

async function getArticle(slug: string) {
  const db = getDb();
  const results = await db
    .select({
      article: articles,
      category: categories,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.slug, slug))
    .limit(1);

  return results[0];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) return { title: 'Article Not Found' };

  return {
    title: `${data.article.title} | 3D Printing Times`,
    description: data.article.content.slice(0, 160),
    openGraph: {
      title: data.article.title,
      images: data.article.thumbnailKey ? [(data.article.thumbnailKey.startsWith('http') ? data.article.thumbnailKey : `/api/assets/${data.article.thumbnailKey}`)] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArticle(slug);
  const isAdmin = await checkIsAdmin();

  if (!data || (data.article.status !== 'published' && !isAdmin)) {
    if (!data) notFound();
  }

  const { article, category } = data;

  return (
    <div className="min-h-screen bg-background">
      <ArticleEditor 
        article={article} 
        category={category} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}
