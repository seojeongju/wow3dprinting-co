/** AI 기사 초안 — 분량·깊이 옵션 (프롬프트용) */

export type ArticleLengthPreset = 'xs' | 'short' | 'medium' | 'long' | 'deep' | 'custom';

export type ArticleDepthPreset = 'compact' | 'standard' | 'deep';

const LENGTH_LABELS: Record<ArticleLengthPreset, string> = {
  xs: '초단신 (~200–350자)',
  short: '짧은 기사 (~400–600자)',
  medium: '보통 (~900–1,200자)',
  long: '긴 기사 (~1,600–2,200자)',
  deep: '심층 (~2,600–3,600자)',
  custom: '직접 지정 (글자 수)',
};

const DEPTH_LABELS: Record<ArticleDepthPreset, string> = {
  compact: '사실 위주 (참고 자료 밀착)',
  standard: '균형 (기본)',
  deep: '탄탄한 전개 (맥락·의미·한계)',
};

export function articleLengthPresetLabel(p: ArticleLengthPreset): string {
  return LENGTH_LABELS[p] ?? LENGTH_LABELS.medium;
}

export function articleDepthPresetLabel(p: ArticleDepthPreset): string {
  return DEPTH_LABELS[p] ?? DEPTH_LABELS.standard;
}

export function clampCustomArticleChars(n: number): number {
  if (!Number.isFinite(n)) return 1200;
  return Math.min(8000, Math.max(200, Math.round(n)));
}

/**
 * 시스템 프롬프트에 붙일 분량·구조·깊이 지시 (고정 스키마 설명과 함께 씀)
 */
export function buildArticleDraftOptionInstructions(
  length: ArticleLengthPreset,
  customChars: number | undefined,
  depth: ArticleDepthPreset
): string {
  const n = clampCustomArticleChars(customChars ?? 1200);

  const lengthParts: string[] = [];

  switch (length) {
    case 'xs':
      lengthParts.push(
        '분량: content 전체 약 200~350자(한글 기준) 목표. 매우 짧게.',
        '구조: 리드는 1단(3~5문장 이내). ## 소제목 블록은 1개만 두고, 그 아래 본문도 짧은 단락 1개로 마무리. (일반적인 "2개 이상" 규칙은 이번 요청에서는 생략 가능)'
      );
      break;
    case 'short':
      lengthParts.push(
        '분량: content 전체 약 400~600자 목표.',
        '구조: 리드 1단 + ## 소제목 블록 1~2개. 각 본문은 짧은 서술 위주.'
      );
      break;
    case 'medium':
      lengthParts.push(
        '분량: content 전체 약 900~1,200자 목표.',
        '구조: 리드 1~2단 + ## 소제목 블록 2~3개, 각 블록마다 서술 단락 1개 이상.'
      );
      break;
    case 'long':
      lengthParts.push(
        '분량: content 전체 약 1,600~2,200자 목표.',
        '구조: 리드 2단 + ## 소제목 블록 3~4개, 단락마다 정보를 충분히 풀어 쓸 것.'
      );
      break;
    case 'deep':
      lengthParts.push(
        '분량: content 전체 약 2,600~3,600자 목표.',
        '구조: 리드 2단 + ## 소제목 블록 4~5개. 배경·의미·영향·기술 맥락을 단계적으로 서술. 반복·잡담 없이 밀도 있게.'
      );
      break;
    case 'custom':
      lengthParts.push(
        `분량: content 전체를 한글 기준 약 ${n}자 전후(대략 ±20% 범위)로 맞출 것.`,
        '구조: 분량에 맞게 ## 소제목 개수를 조절(짧으면 1~2개, 길면 3~5개). 리드+본문 비율을 균형 있게.'
      );
      break;
  }

  const depthParts: string[] = [];
  switch (depth) {
    case 'compact':
      depthParts.push(
        '서술 깊이: 참고 자료·주제에서 도출 가능한 사실과 정의 위주. 추측·전망은 최소한만, 있으면 "~로 알려졌다" 등으로 표시.',
        '문장은 간결하게. 없는 수치·인용·기관명을 만들지 말 것.'
      );
      break;
    case 'deep':
      depthParts.push(
        '서술 깊이: 탄탄한 기사로 — 배경, 산업 맥락, 기술이 갖는 의미, 향후 과제나 한계를 서술형으로 풀어 쓸 것.',
        '단, 참고 자료에 없는 구체 수치·날짜·고유명사 인용은 만들지 말고, 불확실하면 "~로 보인다" "~전망이 있다"로 구분.',
        '소제목 아래 단락은 한 가지 초점에 여러 문장으로 밀도 있게.'
      );
      break;
    case 'standard':
      depthParts.push(
        '서술 깊이: 사실 전달과 간단한 맥락 설명의 균형. 전망은 한두 문장 이내로 절제.'
      );
      break;
  }

  return `[이번 생성 옵션 — 반드시 반영]\n${lengthParts.join('\n')}\n${depthParts.join('\n')}`;
}
