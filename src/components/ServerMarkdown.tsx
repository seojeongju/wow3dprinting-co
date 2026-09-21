interface ServerMarkdownProps {
  content: string;
}

function looksLikeHtml(content: string) {
  return /<\/?(p|div|h[1-6]|ul|ol|li|table|img|figure|section|article|span|br)\b/i.test(
    content,
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Edge/SSR 안전한 경량 마크다운 → HTML (hooks/react-markdown 미사용) */
function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  const flushList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  const inline = (text: string) => {
    let out = escapeHtml(text);
    out = out.replace(
      /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
      '<img src="$2" alt="$1" loading="lazy" style="max-width:100%;height:auto;display:block;margin:2rem auto" />',
    );
    out = out.replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" rel="noopener noreferrer">$1</a>',
    );
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    return out;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    flushList();
    html.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  return html.join("\n");
}

/**
 * 서버 전용 본문 렌더러.
 * react-markdown(hooks)을 쓰지 않아 Edge 빌드/SSR이 안정적입니다.
 */
export default function ServerMarkdown({ content }: ServerMarkdownProps) {
  const value = content || "";
  const html = looksLikeHtml(value) ? value : markdownToHtml(value);

  return (
    <div
      className="prose prose-zinc dark:prose-invert max-w-none w-full min-w-0 overflow-x-hidden break-words prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-lg prose-img:max-w-full prose-img:h-auto prose-img:rounded-[2.5rem] prose-img:shadow-2xl [&_img]:max-w-full [&_img]:h-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
