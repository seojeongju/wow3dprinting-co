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
  // 1. 본문에서 유효한 첫 번째 마크다운 이미지 URL 추출 (스페이서, 로고 등 제외)
  const extractValidThumbnail = (content: string) => {
    // 순수 URL만 캡처하고 뒤에 오는 공백이나 타이틀("title")은 제외하는 정규식
    const matches = Array.from(content.matchAll(/!\[.*?\]\(([^" \)]+).*?\)/g));
    
    // 섬네일로 부적합한 이미지 키워드
    const excludeKeywords = ['spacer', 'pixel', 'logo', 'icon', 'banner', 'invisible', 'dot.gif', 'loading'];

    for (const match of matches) {
      let url = match[1]?.trim();
      if (!url) continue;

      // 키워드 필터링 (부적합한 이미지는 건너뜀)
      const isInvalid = excludeKeywords.some(kw => url.toLowerCase().includes(kw));
      if (!isInvalid) {
        return url;
      }
    }
    return null;
  };

  const fallbackImage = extractValidThumbnail(article.content);
  
  // 외부 URL인지 내부 R2 키인지 판별 로직
  const getProcessedImageUrl = (key: string | null, fallback: string | null) => {
    let rawUrl = key || fallback;
    if (!rawUrl) return null;
    
    rawUrl = rawUrl.trim();
    
    // 프로토콜 상대 경로(//)는 https:를 붙여 명시화
    if (rawUrl.startsWith('//')) {
      return `https:${rawUrl}`;
    }
    
    // http로 시작하면 외부 URL이므로 그대로 반환 (단, s가 붙지 않은 경우에도 허용)
    if (rawUrl.startsWith('http')) {
      return rawUrl;
    }
    
    return `/api/assets/${rawUrl}`;
  };

  const imageUrl = getProcessedImageUrl(article.thumbnailKey, fallbackImage);

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
      {imageUrl && (
        <Link href={`/articles/${article.slug}`} className={`block overflow-hidden rounded-lg ${compact ? 'w-24 shrink-0' : 'w-full'}`}>
          <div className="aspect-video bg-muted relative transition-transform duration-500 group-hover:scale-105">
              <Image 
                src={imageUrl} 
                alt={article.title} 
                fill 
                className="object-cover"
                priority={priority}
                unoptimized={true}
              />
          </div>
        </Link>
      )}
      <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'} ${!imageUrl ? 'w-full py-4 px-2' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            3D프린팅 기술 인사이트
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
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed opacity-85 mt-1">
             {excerpt}...
          </p>
        )}
      </div>
    </div>
  );
}
