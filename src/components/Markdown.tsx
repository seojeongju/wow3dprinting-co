'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg prose-img:rounded-3xl prose-img:shadow-2xl break-words break-keep overflow-hidden whitespace-pre-wrap w-full">
      <ReactMarkdown
        components={{
          img: ({node, ...props}) => (
            <img 
              {...props} 
              loading="lazy" 
              style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '3.5rem auto' }} 
              className="rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-100 bg-gray-50/30 ring-1 ring-black/5"
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
