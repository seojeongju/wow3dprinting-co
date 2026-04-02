import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

/**
 * Serper.dev를 이용한 최신 기술 뉴스 검색
 */
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json() as { keyword: string };
    const cfContext = getRequestContext();
    const env = (cfContext?.env || process.env || {}) as any;
    const apiKey = env.SERPER_API_KEY;

    if (!apiKey) {
      // 보안을 위해 키 목록만 추출 (값은 제외)
      const availableKeys = Object.keys(env).join(', ');
      const envSource = cfContext?.env ? 'Cloudflare Runtime' : 'Node.js Process';
      
      return NextResponse.json({ 
        success: false, 
        message: `SERPER_API_KEY를 찾을 수 없습니다. (Source: ${envSource})\n현재 인식된 변수 목록: [${availableKeys || '없음'}]\n환경 변수 등록 후 반드시 '재배포(Redeploy)'를 완료했는지 확인해 주세요.` 
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
