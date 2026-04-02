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
    
    // 환경 변수 이름을 앞뒤 공백 없이 찾아내는 정밀 매칭 함수
    const findEnvKey = (target: string) => {
      if (env[target]) return env[target];
      const cleanKey = Object.keys(env).find(k => k.trim() === target);
      return cleanKey ? env[cleanKey] : null;
    };

    const apiKey = findEnvKey('SERPER_API_KEY');

    if (!apiKey) {
      const availableKeys = Object.keys(env).join(', ');
      const envSource = cfContext?.env ? 'Cloudflare Runtime' : 'Node.js Process';
      
      return NextResponse.json({ 
        success: false, 
        message: `SERPER_API_KEY를 찾을 수 없습니다. (Source: ${envSource})\n현재 인식된 변수 목록: [${availableKeys || '없음'}]\n환경 변수 이름 앞뒤에 공백이 없는지 대시보드에서 꼭 확인해 주세요.` 
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
