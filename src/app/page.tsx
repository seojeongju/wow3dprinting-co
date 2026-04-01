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
  const latestData = await getLatestArticles();
  const [heroArticle, ...remainingArticles] = latestData;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 min-h-screen">
      {/* Search Header Placeholder (for visual depth) */}
      <div className="mb-12 border-b pb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Technology Intelligence</h2>
        <p className="text-sm text-muted-foreground">Breaking innovations in AI, Robotics, and Additive Manufacturing.</p>
      </div>

      {/* Hero Section */}
      {heroArticle ? (
        <section className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <NewsCard article={{ ...heroArticle.article, category: heroArticle.category }} />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-8 divide-y">
            <h2 className="text-xl font-black uppercase tracking-tighter border-b pb-2">Latest Updates</h2>
            {remainingArticles.slice(0, 3).map((item) => (
              <div key={item.article.id} className="pt-4">
                 <NewsCard article={{ ...item.article, category: item.category }} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
           <h2 className="text-xl font-bold text-muted-foreground italic">No articles published yet.</h2>
           <p className="text-sm mt-2">Check back soon for the latest in 3D Printing & AI.</p>
           <div className="mt-8">
              <a href="/api/setup" className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold">RUN SETUP (DEMO)</a>
           </div>
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
