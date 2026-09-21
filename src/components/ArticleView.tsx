import ServerMarkdown from '@/components/ServerMarkdown';
import { format } from 'date-fns';
import { toValidDate } from '@/lib/seo';

interface ArticleViewProps {
  article: {
    title: string;
    content: string;
    authorId?: string | null;
    thumbnailKey?: string | null;
    publishedAt?: Date | string | number | null;
    status?: string | null;
  };
  category?: { name: string; slug?: string } | null;
}

function resolveImageSrc(key?: string | null) {
  if (!key) return null;
  const rawUrl = key.trim();
  if (!rawUrl) return null;
  if (rawUrl.startsWith('//')) return `https:${rawUrl}`;
  if (rawUrl.startsWith('http')) return rawUrl;
  return `/api/assets/${rawUrl}`;
}

/**
 * 검색엔진/AI 크롤러용 서버 렌더 기사 뷰.
 * 클라이언트 에디터와 분리해 SSR 실패·noindex를 방지합니다.
 */
export default function ArticleView({ article, category }: ArticleViewProps) {
  const safeAuthor =
    typeof article.authorId === 'string' && article.authorId.trim().length > 0
      ? article.authorId.toUpperCase()
      : '관리자';

  const published = toValidDate(article.publishedAt);
  const publishedLabel = published
    ? format(published, 'yyyy년 M월 d일')
    : '최근';

  const imageSrc = resolveImageSrc(article.thumbnailKey);

  return (
    <article className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-4xl">
      <header className="mb-14 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {category?.name ? (
            <span className="w-fit text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              {category.name}
            </span>
          ) : null}
          <div className="h-px w-8 bg-muted-foreground/20" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-40">
            상태: {article.status === 'published' ? '공개됨' : '임시저장'}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight italic">
          {article.title}
        </h1>

        <div className="flex items-center justify-between border-y py-6 mt-4">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">작성: {safeAuthor}</span>
            <time dateTime={published?.toISOString()}>게시일: {publishedLabel}</time>
          </div>
        </div>
      </header>

      {imageSrc ? (
        <div className="relative mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={article.title}
            className="w-full h-auto max-h-[min(70vh,720px)] object-contain"
          />
        </div>
      ) : null}

      <div className="prose prose-lg prose-zinc max-w-none w-full min-w-0 overflow-x-hidden break-words whitespace-pre-line prose-headings:font-black prose-headings:tracking-tighter prose-headings:italic prose-p:leading-relaxed prose-img:max-w-full prose-img:h-auto prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:mx-auto">
        <ServerMarkdown content={article.content || ''} />
      </div>

      <footer className="mt-20 border-t pt-12">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-6">전문가 분석 및 인사이트</h2>
        <p className="text-muted-foreground text-sm italic">
          3D프린팅타임즈는 인공지능과 제조 기술의 융합을 지속적으로 모니터링합니다.
          추가적인 후속 리포트를 기대해 주세요.
        </p>
      </footer>
    </article>
  );
}
