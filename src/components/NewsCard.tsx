import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Article, Category } from '@/lib/db/schema';
import { Clock, ArrowRight } from 'lucide-react';
import { getExcerpt } from '@/lib/text-utils';

interface NewsCardProps {
  article: Article & { category: Category | null };
  priority?: boolean;
  compact?: boolean;
  horizontal?: boolean;
}

export default function NewsCard({ article, priority, compact, horizontal }: NewsCardProps) {
  const extractValidThumbnail = (content: string) => {
    const matches = Array.from(content.matchAll(/!\[.*?\]\(([^" \)]+).*?\)/g));
    const excludeKeywords = ['spacer', 'pixel', 'logo', 'icon', 'banner', 'invisible', 'dot.gif', 'loading'];

    for (const match of matches) {
      let url = match[1]?.trim();
      if (!url) continue;
      const isInvalid = excludeKeywords.some(kw => url.toLowerCase().includes(kw));
      if (!isInvalid) return url;
    }
    return null;
  };

  const fallbackImage = extractValidThumbnail(article.content);
  
  const getProcessedImageUrl = (key: string | null, fallback: string | null) => {
    let rawUrl = key || fallback;
    if (!rawUrl) return null;
    rawUrl = rawUrl.trim();
    if (rawUrl.startsWith('//')) return `https:${rawUrl}`;
    if (rawUrl.startsWith('http')) return rawUrl;
    return `/api/assets/${rawUrl}`;
  };

  const imageUrl = getProcessedImageUrl(article.thumbnailKey, fallbackImage);

  const excerpt = getExcerpt(article.content, 120);

  if (horizontal) {
    return (
      <div className="group flex gap-4 py-4 border-b border-muted transition-all">
        {imageUrl && (
          <Link href={`/articles/${article.slug}`} className="block w-24 h-24 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image src={imageUrl} alt={article.title} width={96} height={96} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
          </Link>
        )}
        <div className="flex flex-col justify-center gap-1.5 ml-8">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{article.category?.name || 'TECH'}</span>
          <Link href={`/articles/${article.slug}`}>
            <h4 className="text-base font-black leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2 italic">
              {article.title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold uppercase opacity-50">
            <Clock className="w-3 h-3" />
            {article.publishedAt ? format(new Date(article.publishedAt), 'MMM d, yyyy') : 'Recent'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative flex flex-col gap-5 ${priority ? 'lg:gap-8' : 'gap-4'} transition-all`}>
      {imageUrl && (
        <Link href={`/articles/${article.slug}`} className="block overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/5">
          <div className={`${priority ? 'aspect-[21/10]' : 'aspect-video'} bg-muted relative overflow-hidden`}>
            <Image 
              src={imageUrl} 
              alt={article.title} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={priority}
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
              <span className="text-white text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                Read Intel <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
            {article.category?.name || 'INTelligence'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
            / {article.publishedAt ? format(new Date(article.publishedAt), 'yyyy.MM.dd') : 'Recent'}
          </span>
        </div>

        <Link href={`/articles/${article.slug}`}>
          <h3 className={`${priority ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-2xl'} font-black tracking-tighter leading-[1.1] italic group-hover:text-primary transition-all duration-300`}>
            {article.title}
          </h3>
        </Link>

        {!compact && (
          <p className={`text-foreground/80 leading-relaxed font-medium mb-2 ${priority ? 'text-xl lg:max-w-3xl' : 'text-base line-clamp-3'}`}>
            {excerpt}...
          </p>
        )}

        {priority && (
          <Link href={`/articles/${article.slug}`} className="mt-4 w-fit flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-primary group-hover:translate-x-2 transition-transform">
            Continue Reading
            <div className="w-8 h-px bg-primary" />
          </Link>
        )}
      </div>
    </div>
  );
}
