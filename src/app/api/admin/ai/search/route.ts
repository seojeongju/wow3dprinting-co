import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Serper.dev를 이용한 최신 기술 뉴스 검색
 */
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json() as { keyword: string };
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'SERPER_API_KEY가 설정되지 않았습니다. .dev.vars 또는 환경변수를 확인하세요.' 
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
