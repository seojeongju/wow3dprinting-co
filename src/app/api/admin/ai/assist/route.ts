import { NextRequest, NextResponse } from 'next/server';
import { assertAdminAuthorized, findEnvKey, getBindingsEnv } from '@/lib/admin-auth';

export const runtime = 'edge';

export type AssistAction = 'rewrite' | 'expand' | 'shorten' | 'titles' | 'lead' | 'bullets';

const ACTION_HINT: Record<AssistAction, string> = {
  rewrite: '같은 의미를 유지하며 문장을 다듬고 자연스러운 한국어 뉴스체로 고쳐 주세요.',
  expand: '근거와 맥락을 보강해 2~3배 분량으로 확장하세요. 추측은 "~로 알려졌다" 등으로 표시하세요.',
  shorten: '핵심만 남기고 절반 이하 길이로 압축하세요.',
  titles: '아래 텍스트에 맞는 한국어 뉴스 제목 후보를 제시하세요 (응답 형식은 시스템 스키마를 따릅니다).',
  lead: '뉴스 리드(도입) 문단 2~4문장을 작성하세요. 5W1H를 반영하되 과장하지 마세요.',
  bullets: '본문을 Markdown 불릿 목록으로 요약 정리하세요.',
};

/**
 * 선택 구간·문맥에 대한 빠른 AI 편집 (어시스턴트)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: AssistAction;
      text?: string;
      context?: string;
      password?: string;
    };

    const auth = assertAdminAuthorized(body.password);
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: 401 });
    }

    const action = body.action;
    if (!action || !ACTION_HINT[action]) {
      return NextResponse.json({ success: false, message: '유효하지 않은 action입니다.' }, { status: 400 });
    }

    let text = body.text?.trim() || '';
    if (action === 'titles' && !text && body.context?.trim()) {
      text = body.context.trim();
    }
    if (!text) {
      return NextResponse.json({ success: false, message: '편집할 텍스트(또는 제목 후보용 요지)를 입력하세요.' }, { status: 400 });
    }

    const env = getBindingsEnv() as Record<string, unknown>;
    const apiKey = findEnvKey(env, 'GEMINI_API_KEY');
    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'GEMINI_API_KEY가 없습니다.' }, { status: 500 });
    }

    const ctx = body.context?.trim();
    const userBlock = ctx
      ? `[전체 맥락]\n${ctx}\n\n[대상 텍스트]\n${text}`
      : `[대상 텍스트]\n${text}`;

    const instruction = `${ACTION_HINT[action]}\n\n${userBlock}`;

    const wantJsonArray = action === 'titles';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const genCfg: Record<string, unknown> = {
      temperature: 0.5,
      responseMimeType: wantJsonArray ? 'application/json' : 'text/plain',
    };
    if (wantJsonArray) {
      genCfg.responseSchema = {
        type: 'array',
        items: { type: 'string' },
        minItems: 3,
        maxItems: 7,
      };
    }

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: instruction }] }],
        generationConfig: genCfg,
      }),
    });

    const raw = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`Gemini 응답 오류 (${response.status})`);
    }

    if (!response.ok) {
      const err = data as { error?: { message?: string } };
      throw new Error(err.error?.message || `Gemini ${response.status}`);
    }

    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    let out = candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (wantJsonArray) {
      try {
        const arr = JSON.parse(out) as unknown;
        if (Array.isArray(arr)) {
          const titles = arr.map(String).filter(Boolean);
          return NextResponse.json({
            success: true,
            titles,
            result: titles.map((t, i) => `${i + 1}. ${t}`).join('\n'),
          });
        }
      } catch {
        /* fall through */
      }
      return NextResponse.json({ success: true, result: out, titles: [] });
    }

    return NextResponse.json({ success: true, result: out });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '어시스턴트 처리 오류';
    console.error('AI Assist Error:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
