import { NextRequest, NextResponse } from 'next/server';
import { assertAdminAuthorized, getBindingsEnv } from '@/lib/admin-auth';
import { runAssistWithFallback, type AssistAction } from '@/lib/ai-providers';

export const runtime = 'edge';

/**
 * 문장 어시스턴트: Groq 우선(auto), 실패 시 Gemini·OpenAI 폴백
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
    const valid: AssistAction[] = ['rewrite', 'expand', 'shorten', 'titles', 'lead', 'bullets'];
    if (!action || !valid.includes(action)) {
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
    const { result, titles, usedProvider } = await runAssistWithFallback(env, action, text, body.context);

    return NextResponse.json({
      success: true,
      result,
      titles,
      provider: usedProvider,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '어시스턴트 처리 오류';
    console.error('AI Assist Error:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
