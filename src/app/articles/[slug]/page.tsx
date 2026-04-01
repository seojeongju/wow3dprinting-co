import { getDb } from '@/lib/db';
import { articles, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Markdown from '@/components/Markdown';
import { isAdmin as checkIsAdmin } from '@/lib/auth_edge';
import AdminActions from '@/components/AdminActions';
import { Settings, Trash2, Edit3 } from 'lucide-react';

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
      images: data.article.thumbnailKey ? [`/api/assets/${data.article.thumbnailKey}`] : [],
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
    <article className="container mx-auto px-4 py-12 md:px-6 max-w-4xl min-h-screen">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="mb-12 p-6 bg-primary/[0.03] border border-primary/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Admin Intelligence</p>
              <p className="text-xs text-muted-foreground font-medium italic opacity-70">실시간 기사 관리 및 콘텐츠 최적화 모드가 활성화되었습니다.</p>
            </div>
          </div>
          <AdminActions article={article} />
        </div>
      )}

      <header className="mb-14 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {category && (
            <span className="w-fit text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              {category.name}
            </span>
          )}
          <div className="h-px w-8 bg-muted-foreground/20" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-40">
            Status: {article.status?.toUpperCase() || 'PUBLISHED'}
          </span>
        </div>
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
