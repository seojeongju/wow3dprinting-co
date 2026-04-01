import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Markdown from '@/components/Markdown';

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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await getArticle(params.slug);
  if (!data) return { title: 'Article Not Found' };

  return {
    title: `${data.article.title} | 3D Printing Times`,
    description: data.article.content.slice(0, 160),
    openGraph: {
      title: data.article.title,
      images: data.article.thumbnailKey ? [`/api/assets/${data.article.thumbnailKey}`] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const data = await getArticle(params.slug);

  if (!data || data.article.status !== 'published') {
    // Note: In development, we might want to see drafts. 
    // But for production, this check is mandatory.
    if (!data) notFound();
  }

  const { article, category } = data;

  return (
    <article className="container mx-auto px-4 py-12 md:px-6 max-w-4xl min-h-screen">
      <header className="mb-8 flex flex-col gap-4">
        {category && (
          <span className="w-fit text-xs font-black uppercase tracking-tighter text-primary bg-primary/10 px-3 py-1 rounded">
            {category.name}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight italic">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-b py-4">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">BY {article.authorId.toUpperCase()}</span>
            <span>Published on {article.publishedAt ? format(new Date(article.publishedAt), 'MMMM d, yyyy') : 'Recently'}</span>
          </div>
        </div>
      </header>

      {article.thumbnailKey && (
        <div className="relative aspect-video mb-12 rounded-xl overflow-hidden shadow-2xl">
          <Image 
            src={`/api/assets/${article.thumbnailKey}`} 
            alt={article.title} 
            fill 
            className="object-cover" 
            priority
          />
        </div>
      )}

      <Markdown content={article.content} />

      <footer className="mt-20 border-t pt-12">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Expert Analysis & Insights</h3>
        <p className="text-muted-foreground text-sm italic">
          3D Printing Times continues to monitor the intersection of AI and manufacturing technology. 
          Stay tuned for our follow-up reports.
        </p>
      </footer>
    </article>
  );
}
