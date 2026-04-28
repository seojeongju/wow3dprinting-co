import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { isAdmin as checkIsAdmin } from '@/lib/auth_edge';
import ArticleEditor from '@/components/ArticleEditor';
import { stripHtmlAndMarkdown } from '@/lib/text-utils';

export const runtime = 'edge';

async function getArticle(slug: string) {
  const db = getDb();
  const decodedSlug = decodeURIComponent(slug); // 한글 슬러그 디코딩 추가
  const results = await db
    .select({
      article: articles,
      category: categories,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.slug, decodedSlug))
    .limit(1);

  return results[0];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) return { title: 'Article Not Found' };

  // 호스트에 따른 사이트명 설정
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const domain = host.split(':')[0];
  const isWow3d = domain === 'wow3dprinting.com' || domain.endsWith('.wow3dprinting.com');
  
  const siteTitle = isWow3d ? '와우3D프린팅타임즈' : '3D프린팅타임즈';

  // HTML 및 마크다운 태그를 제거하고 순수 텍스트만 추출
  const cleanDescription = stripHtmlAndMarkdown(data.article.content).slice(0, 160);

  return {
    title: `${data.article.title} | ${siteTitle}`,
    description: cleanDescription,
    openGraph: {
      title: data.article.title,
      description: cleanDescription,
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
