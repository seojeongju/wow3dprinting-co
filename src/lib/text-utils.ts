/**
 * HTML 및 마크다운 태그를 제거하여 순수 텍스트만 추출합니다.
 */
export function stripHtmlAndMarkdown(content: string): string {
  if (!content) return '';

  return content
    // 1. HTML 태그 제거
    .replace(/<[^>]*>/g, '')
    // 2. 마크다운 이미지 제거: ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 3. 마크다운 링크 제거: [text](url) -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // 4. URL 제거
    .replace(/https?:\/\/\S+/g, '')
    // 5. 마크다운 특수문자 제거 (#, *, `, >, -, _)
    .replace(/[#*`>\-_]/g, '')
    // 6. HTML 엔티티 변환
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&bull;/g, '•')

    // 7. 연속된 공백 및 줄바꿈 정리
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * 콘텐츠에서 지정된 길이만큼의 요약본을 생성합니다.
 */
export function getExcerpt(content: string, maxLen: number = 120): string {
  const plainText = stripHtmlAndMarkdown(content);
  return plainText.length > maxLen ? plainText.slice(0, maxLen) + '...' : plainText;
}
