import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Article, Category } from '@/lib/db/schema';

interface NewsCardProps {
  article: Article & { category: Category | null };
  priority?: boolean;
  compact?: boolean;
}

export default function NewsCard({ article, priority, compact }: NewsCardProps) {
  // compact 모드 시 타이틀 크기 등을 줄이는 클래스 스위칭 용도
  const titleClass = compact ? "text-base font-bold leading-tight" : (priority ? "text-3xl font-black leading-tight" : "text-lg font-bold leading-tight");
  
  return (
    <div className={`group relative flex flex-col gap-3 border-b pb-6 last:border-0 md:border-0 md:pb-0 ${compact ? 'flex-row items-start' : ''}`}>
      <Link href={`/articles/${article.slug}`} className={`block overflow-hidden rounded-lg ${compact ? 'w-24 shrink-0' : 'w-full'}`}>
        <div className="aspect-video bg-muted relative transition-transform duration-500 group-hover:scale-105">
           {article.thumbnailKey ? (
             <Image 
               src={`/api/assets/${article.thumbnailKey}`} 
               alt={article.title} 
               fill 
               className="object-cover"
               priority={priority}
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-accent">
               <span className={`font-bold uppercase tracking-widest text-primary/40 ${compact ? 'text-[8px]' : 'text-xs'}`}>이미지<br/>없음</span>
             </div>
           )}
        </div>
      </Link>
      <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
        <div className="flex items-center gap-2">
          {article.category && (
            <span className="text-[10px] font-black uppercase tracking-tighter text-primary bg-primary/10 px-2 py-0.5 rounded">
              {article.category.name}
            </span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground border-l pl-2">
            {article.publishedAt ? format(new Date(article.publishedAt), 'yyyy년 M월 d일') : '최근'}
          </span>
        </div>
        <Link href={`/articles/${article.slug}`}>
          <h3 className={`${titleClass} tracking-tight group-hover:text-primary transition-colors line-clamp-2`}>
            {article.title}
          </h3>
        </Link>
        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
             {/* Simple regex to strip markdown for preview */}
             {article.content.replace(/[#*`]/g, '').slice(0, 100)}...
          </p>
        )}
      </div>
    </div>
  );
}
