import { NextRequest, NextResponse } from 'next/server';
import { assertAdminAuthorized, getBindingsEnv } from '@/lib/admin-auth';
import { generateArticleDraftWithFallback } from '@/lib/ai-providers';

export const runtime = 'edge';

/**
 * 기사 초안: 제목(title) + 본문(content)=리드 후 ##소제목/기사내용 블록, AI_PROVIDER 순 폴백
 * auto(기본): Groq → OpenAI → Gemini
 * 환경: GROQ_API_KEY, GROQ_MODEL(선택), GEMINI_API_KEY, OPENAI_API_KEY, AI_PROVIDER
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      searchResults?: Array<{ title?: string; source?: string; snippet?: string; link?: string }>;
      password?: string;
    };

    const auth = assertAdminAuthorized(body.password);
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: 401 });
    }

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ success: false, message: '키워드(주제)를 입력하세요.' }, { status: 400 });
    }

    const env = getBindingsEnv() as Record<string, unknown>;

    const searchContext =
      body.searchResults
        ?.map(
          (res) =>
            `제목: ${res.title || ''}\n출처: ${res.source || ''}\nURL: ${res.link || ''}\n요약: ${res.snippet || ''}`
        )
        .join('\n\n') || '';

    const systemInstruction = `당신은 3D 프린팅·제조·로봇 분야 전문 신문(기술면) 편집자입니다.
출력은 반드시 **제목(title 필드) + 본문(content 필드)** 의 역할이 분리된 구조여야 합니다.

[1] 제목 — JSON의 title
- 신문 헤드라인 한 줄. 간결·정보 밀도. 광고문구·과장 지양.

[2] 본문 — JSON의 content (Markdown, 아래 순서를 정확히 지킬 것)
- content 안에 기사 제목을 #/## 로 다시 쓰지 마세요. 제목은 title에만 있습니다.
- (A) **리드**: 맨 위에 ## 없이 평문 단락만 1~2개. 5W1H 핵심, 뉴스체.
- (B) **소제목 + 기사 내용** 블록을 최소 2개(권장 3~4개) 연속으로 둡니다. 각 블록 형식:
  - 한 줄: ## (공백)소제목문구
  - 빈 줄
  - 그 아래: 해당 소제목에 대한 **기사 내용**(서술형 문단 1개 이상). 이 부분이 본문입니다.
- 소제목은 모두 같은 레벨의 ## 만 사용. ### 은 필요할 때만 소수.
- 소제목 아래를 불릿·번호 목록만으로 채우지 마세요. 반드시 서술 문단을 포함하세요.
- 톤: 객관적 뉴스체. 에세이·강의록·PPT 목차형 금지.
- 기술 용어 정확히(예: SLM은 선택적 레이저 융합 금속 적층). 사실과 전망 구분. 없는 수치·인용·고유명사 생성 금지.`;

    const userText = `주제/키워드: ${prompt}

참고 자료:
${searchContext || '(참고 자료 없음 — 주제에 맞는 일반적인 구조의 초안을 작성하세요.)'}

아래 예시와 같은 **패턴**으로 title, slug, content를 채우세요 (예시 문구는 복사하지 말고 주제에 맞게 새로 작성).

예시 content 패턴:
---
(리드 단락 한두 개 — 앞에 ## 없음)

## 첫 번째 소제목
이 소제목에 대한 기사 내용을 서술형으로 여러 문장으로 씁니다.

## 두 번째 소제목
배경·의미·영향 등을 문단으로 씁니다.

## 세 번째 소제목
필요 시 네 번째 ## 블록까지 이어갑니다.
---`;

    const { title, slug, content, usedProvider } = await generateArticleDraftWithFallback(
      env,
      systemInstruction,
      userText
    );

    return NextResponse.json({
      success: true,
      title,
      slug,
      content,
      provider: usedProvider,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '기사 생성 중 오류가 발생했습니다.';
    console.error('AI Generate Error:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
