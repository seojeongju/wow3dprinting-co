'use client';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none w-full min-w-0 overflow-x-hidden break-words whitespace-pre-line prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg prose-img:rounded-3xl prose-img:shadow-2xl">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ style, width, height, className, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              loading="lazy"
              width={undefined}
              height={undefined}
              style={{
                ...(typeof style === 'object' && style ? style : {}),
                maxWidth: '100%',
                width: 'auto',
                height: 'auto',
                display: 'block',
                margin: '3.5rem auto',
              }}
              className={`max-w-full h-auto rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-100 bg-gray-50/30 ring-1 ring-black/5 ${className ?? ''}`}
            />
          ),
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
