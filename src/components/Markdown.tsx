'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg prose-img:rounded-3xl prose-img:shadow-2xl">
      <ReactMarkdown
        components={{
          img: ({node, ...props}) => (
            <img 
              {...props} 
              loading="lazy" 
              style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '2.5rem auto' }} 
              className="rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border bg-muted/20"
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
