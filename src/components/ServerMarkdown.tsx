import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface ServerMarkdownProps {
  content: string;
}

function looksLikeHtml(content: string) {
  return /<\/?(p|div|h[1-6]|ul|ol|li|table|img|figure|section|article|span)\b/i.test(
    content,
  );
}

/**
 * 서버 전용 본문 렌더러.
 * TipTap HTML·Markdown 모두 지원해 크롤러가 본문을 읽을 수 있게 합니다.
 */
export default function ServerMarkdown({ content }: ServerMarkdownProps) {
  const value = content || '';

  // TipTap 등 HTML 본문은 그대로 출력 (검색엔진 SSR용)
  if (looksLikeHtml(value)) {
    return (
      <div
        className="prose prose-zinc dark:prose-invert max-w-none w-full min-w-0 overflow-x-hidden break-words prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg prose-img:max-w-full prose-img:h-auto prose-img:rounded-[2.5rem] prose-img:shadow-2xl [&_img]:max-w-full [&_img]:h-auto"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none w-full min-w-0 overflow-x-hidden break-words whitespace-pre-line prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg prose-img:rounded-3xl prose-img:shadow-2xl">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ className, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              loading="lazy"
              className={`max-w-full h-auto rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-100 bg-gray-50/30 ring-1 ring-black/5 ${className ?? ''}`}
              style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '3.5rem auto' }}
            />
          ),
          a: ({ href, children, ...props }) => (
            <a href={href} rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
