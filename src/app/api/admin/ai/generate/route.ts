import { NextRequest, NextResponse } from 'next/server';
import { assertAdminAuthorized, getBindingsEnv } from '@/lib/admin-auth';
import { generateArticleDraftWithFallback } from '@/lib/ai-providers';

export const runtime = 'edge';

/**
 * 기사 초안: 신문 기사체(리드·서술 본문) 지시, AI_PROVIDER 순서대로 시도 후 폴백
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
사용자 키워드와 참고 자료를 바탕으로 한국어 **신문 기사체** 초안을 작성합니다.

[형식 — 반드시 준수]
- title: 신문 헤드라인처럼 간결하고 정보 밀도가 높게 (광고문구·과장 표현 지양).
- content(Markdown): **신문 본문** 구조만 사용합니다.
  1) **첫 단락(리드)**: 누가·무엇을·언제·어디서·왜·어떻게를 압축해 한 덩어리로 요약. 독자가 리드만 읽어도 핵심을 알 수 있게.
  2) **2단락 이후**: 리드에서 덜 드러난 배경·의미·맥락·영향을 서술형 문단으로 전개. 단락마다 한 가지 초점.
  3) **소제목**: 필요할 때만 ## 로 1~3개. 남발하지 말 것.
  4) **목록**: 보조 설명에만 제한적으로 사용. '장점' '예를 들어'만 불릿으로 도배하지 말고 문장으로 풀어 쓸 것.
  5) **톤**: 객관적 뉴스체(~다/~했다). 에세이, 블로그, 발표 자료 목차형은 금지.
- 기술 용어는 정확히 쓰고(예: SLM은 선택적 레이저 융합 금속 적층; 스테레오리소그래피와 혼동 금지), 불확실하면 단정하지 말 것.
- 사실과 추측·전망을 구분하고, 참고 자료에 없는 수치·인용·고유명사는 만들지 마세요.`;

    const userText = `주제/키워드: ${prompt}

참고 자료:
${searchContext || '(참고 자료 없음 — 주제에 맞는 일반적인 신문 기사 형식의 초안을 작성하세요.)'}

위를 바탕으로 title, slug, content 필드를 채우되, content는 위 시스템 지침의 **신문 기사 형식**을 따르세요.`;

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
