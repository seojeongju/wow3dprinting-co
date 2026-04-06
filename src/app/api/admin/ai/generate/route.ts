import { NextRequest, NextResponse } from 'next/server';
import { assertAdminAuthorized, getBindingsEnv } from '@/lib/admin-auth';
import { generateArticleDraftWithFallback } from '@/lib/ai-providers';

export const runtime = 'edge';

/**
 * 기사 초안: AI_PROVIDER 순서대로 시도 후 폴백
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

    const systemInstruction = `당신은 3D 프린팅·제조·로봇 분야 전문 뉴스 에디터입니다.
사용자 키워드와 참고 자료를 바탕으로 한국어 기술 뉴스 초안을 작성합니다.
- 톤: 전문적이고 읽기 쉬움
- 본문은 Markdown (## 소제목, 목록, 강조 등 사용)
- 사실과 추측을 구분하고, 참고 자료에 없는 수치는 만들지 마세요.`;

    const userText = `주제/키워드: ${prompt}

참고 자료:
${searchContext || '(참고 자료 없음 — 주제에 맞는 일반적인 구조의 초안을 작성하세요.)'}

위를 바탕으로 title, slug, content 필드를 채운 기사 초안을 작성하세요.`;

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
