'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
