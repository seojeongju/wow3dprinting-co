import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

/**
 * Serper.dev를 이용한 최신 기술 뉴스 검색
 */
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json() as { keyword: string };
    const context = getRequestContext();
    // Cloudflare Pages 환경 변수는 context.env에, 로글 환경 변수는 process.env에 있습니다.
    const env = (context?.env || process.env) as any;
    const apiKey = env.SERPER_API_KEY;

    if (!apiKey) {
      const envSource = context?.env ? 'Cloudflare Runtime' : 'Node.js Process';
      return NextResponse.json({ 
        success: false, 
        message: `SERPER_API_KEY를 찾을 수 없습니다. (Source: ${envSource}) 환경 변수 추가 후 반드시 '재배포(Redeploy)'를 진행했는지 확인해 주세요.` 
      }, { status: 500 });
    }

    const searchQuery = `${keyword} 3d printing robotics latest news`;
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        gl: 'kr', // 한국 지역 결과 우선
        hl: 'ko', // 한국어 결과 우선
        num: 5,
      }),
    });

    if (!response.ok) {
      throw new Error('검색 API 호출 실패');
    }

    const data = await response.json() as any;
    const results = data.organic?.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: item.source || new URL(item.link).hostname,
    })) || [];

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('AI Search Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || '검색 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
