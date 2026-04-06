import { NextRequest, NextResponse } from 'next/server';
import { assertAdminAuthorized, findEnvKey, getBindingsEnv } from '@/lib/admin-auth';

export const runtime = 'edge';

/**
 * Serper.dev를 이용한 최신 기술 뉴스 검색 (관리자 대시보드 전용)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { keyword?: string; password?: string };
    const keyword = body.keyword?.trim();
    const auth = assertAdminAuthorized(body.password);
    if (!auth.ok) {
      return NextResponse.json({ success: false, message: auth.message }, { status: 401 });
    }

    if (!keyword) {
      return NextResponse.json({ success: false, message: '키워드를 입력하세요.' }, { status: 400 });
    }

    const env = getBindingsEnv() as Record<string, unknown>;
    const apiKey = findEnvKey(env, 'SERPER_API_KEY');

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            'SERPER_API_KEY가 설정되지 않았습니다. Cloudflare Pages 환경 변수 또는 로컬 .dev.vars에 추가하세요.',
        },
        { status: 500 }
      );
    }

    const searchQuery = `${keyword} 3d printing additive manufacturing news`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: 'kr',
        hl: 'ko',
        num: 8,
      }),
    });

    const rawText = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      throw new Error(`검색 API 응답이 JSON이 아닙니다 (${response.status})`);
    }

    if (!response.ok) {
      const msg =
        typeof data.message === 'string'
          ? data.message
          : typeof data.error === 'string'
            ? data.error
            : rawText.slice(0, 200);
      throw new Error(`검색 API 오류 (${response.status}): ${msg}`);
    }

    const organic = Array.isArray(data.organic) ? data.organic : [];
    const results = organic.map((item: Record<string, unknown>) => {
      const link = String(item.link || '');
      let source = typeof item.source === 'string' ? item.source : '';
      if (!source && link) {
        try {
          source = new URL(link).hostname;
        } catch {
          source = '';
        }
      }
      return {
        title: String(item.title || '(제목 없음)'),
        link,
        snippet: String(item.snippet || ''),
        source,
      };
    });

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.';
    console.error('AI Search Error:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
