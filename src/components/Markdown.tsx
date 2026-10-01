'use client';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import InteractiveArticleImage from '@/components/InteractiveArticleImage';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none w-full min-w-0 overflow-x-hidden break-words whitespace-pre-line prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ src, alt, ...props }) => {
            if (!src || typeof src !== 'string') return null;
            return (
              <InteractiveArticleImage
                src={src}
                alt={typeof alt === 'string' ? alt : '본문 이미지'}
              />
            );
          },
          table: ({ ...props }) => (
            <div className="w-full max-w-full overflow-x-auto my-8">
              <table {...props} />
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
