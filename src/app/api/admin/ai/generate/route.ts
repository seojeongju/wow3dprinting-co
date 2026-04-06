import { NextRequest, NextResponse } from 'next/server';
import { assertAdminAuthorized, findEnvKey, getBindingsEnv } from '@/lib/admin-auth';

export const runtime = 'edge';

const ARTICLE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '기사 제목 (한국어)' },
    slug: { type: 'string', description: '영문 소문자·숫자·하이픈 슬러그' },
    content: { type: 'string', description: 'Markdown 본문' },
  },
  required: ['title', 'slug', 'content'],
};

/**
 * Gemini로 기사 초안(JSON) 생성
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
    const apiKey = findEnvKey(env, 'GEMINI_API_KEY');

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'GEMINI_API_KEY가 설정되지 않았습니다. Cloudflare 대시보드 또는 .dev.vars를 확인하세요.',
        },
        { status: 500 }
      );
    }

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
- 사실과 추측을 구분하고, 참고 자료에 없는 수치는 만들지 마세요.
- 응답은 지정된 JSON 스키마에만 맞출 것.`;

    const userText = `주제/키워드: ${prompt}

참고 자료:
${searchContext || '(참고 자료 없음 — 주제에 맞는 일반적인 구조의 초안을 작성하세요.)'}

위를 바탕으로 title, slug, content 필드를 채운 기사 초안을 작성하세요.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: {
          temperature: 0.65,
          topP: 0.9,
          topK: 40,
          responseMimeType: 'application/json',
          responseSchema: ARTICLE_JSON_SCHEMA,
        },
      }),
    });

    const raw = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`Gemini 응답 파싱 실패 (${response.status}): ${raw.slice(0, 120)}`);
    }

    if (!response.ok) {
      const err = data as { error?: { message?: string } };
      throw new Error(err.error?.message || `Gemini API 오류 (${response.status})`);
    }

    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    const text = candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini가 빈 응답을 반환했습니다.');
    }

    let parsed: { title?: string; slug?: string; content?: string };
    try {
      parsed = JSON.parse(text) as { title?: string; slug?: string; content?: string };
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('AI 응답이 올바른 JSON이 아닙니다.');
      parsed = JSON.parse(m[0]) as { title?: string; slug?: string; content?: string };
    }

    const title = String(parsed.title || '').trim();
    const slug = String(parsed.slug || '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');
    const content = String(parsed.content || '').trim();

    if (!title || !content) {
      throw new Error('생성된 초안에 제목 또는 본문이 비어 있습니다.');
    }

    return NextResponse.json({
      success: true,
      title,
      slug: slug || `article-${Date.now()}`,
      content,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '기사 생성 중 오류가 발생했습니다.';
    console.error('AI Generate Error:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
