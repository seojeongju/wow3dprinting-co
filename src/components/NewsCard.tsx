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
  // 1. 본문에서 첫 번째 마크다운 이미지 URL 추출 (R2 키가 없을 때의 폴백 용도)
  const extractFirstImage = (content: string) => {
    const match = content.match(/!\[.*?\]\((.*?)\)/);
    return match ? match[1] : null;
  };

  const fallbackImage = extractFirstImage(article.content);
  const imageUrl = article.thumbnailKey 
    ? `/api/assets/${article.thumbnailKey}` 
    : (fallbackImage || null);

  // 2. 본문 요약문 정제 (마크다운 이미지, 링크, 특수문자 제거)
  const cleanExcerpt = (content: string) => {
    return content
      .replace(/!\[.*?\]\((.*?)\)/g, '') // 이미지 태그 제거
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // 링크는 텍스트만 유지
      .replace(/[#*`>_-]/g, '') // 마크다운 기호 제거
      .replace(/\n+/g, ' ') // 줄바꿈 공백 처리
      .trim();
  };

  const excerpt = cleanExcerpt(article.content).slice(0, 100);

  // compact 모드 시 타이틀 크기 등을 줄이는 클래스 스위칭 용도
  const titleClass = compact ? "text-base font-bold leading-tight" : (priority ? "text-3xl font-black leading-tight" : "text-lg font-bold leading-tight");
  
  return (
    <div className={`group relative flex flex-col gap-3 border-b pb-6 last:border-0 md:border-0 md:pb-0 ${compact ? 'flex-row items-start' : ''}`}>
      <Link href={`/articles/${article.slug}`} className={`block overflow-hidden rounded-lg ${compact ? 'w-24 shrink-0' : 'w-full'}`}>
        <div className="aspect-video bg-muted relative transition-transform duration-500 group-hover:scale-105">
            {imageUrl ? (
              <Image 
                src={imageUrl} 
                alt={article.title} 
                fill 
                className="object-cover"
                priority={priority}
                unoptimized={!article.thumbnailKey} // 외부 URL인 경우 최적화 생략
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-accent/20">
                <div className="w-8 h-8 opacity-20 mb-2 text-primary/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>
                <span className={`font-black uppercase tracking-[0.3em] text-primary/30 ${compact ? 'text-[6px]' : 'text-[10px]'}`}>No Media</span>
              </div>
            )}
        </div>
      </Link>
      <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            Tech Intelligence
          </span>
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
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed opacity-85">
             {excerpt}...
          </p>
        )}
      </div>
    </div>
  );
}
