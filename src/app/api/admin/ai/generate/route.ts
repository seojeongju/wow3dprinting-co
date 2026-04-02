import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

/**
 * Gemini API를 사용하여 기사 초안 작성
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, searchResults } = await request.json() as { prompt: string, searchResults?: any[] };
    const cfContext = getRequestContext();
    const env = (cfContext?.env || process.env || {}) as any;
    
    // 환경 변수 이름을 앞뒤 공백 없이 찾아내는 정밀 매칭 함수
    const findEnvKey = (target: string) => {
      if (env[target]) return env[target];
      const cleanKey = Object.keys(env).find(k => k.trim() === target);
      return cleanKey ? env[cleanKey] : null;
    };

    const apiKey = findEnvKey('GEMINI_API_KEY');

    if (!apiKey) {
      const availableKeys = Object.keys(env).join(', ');
      const envSource = cfContext?.env ? 'Cloudflare Runtime' : 'Node.js Process';
      
      return NextResponse.json({ 
        success: false, 
        message: `GEMINI_API_KEY를 찾을 수 없습니다. (Source: ${envSource})\n현재 인식된 변수 목록: [${availableKeys || '없음'}]\n환경 변수 이름 앞뒤에 공백이 없는지 대시보드에서 꼭 확인해 주세요.` 
      }, { status: 500 });
    }

    const searchContext = searchResults?.map(res => `제목: ${res.title}\n출처: ${res.source}\n내용: ${res.snippet}`).join('\n\n') || '';

    const systemPrompt = `
당신은 전문적인 IT/기술 뉴스 에디터입니다.
사용자가 제공하는 키워드와 검색 결과를 바탕으로 최신 기술 뉴스를 작성하세요.
반드시 아래 형식을 지켜주세요.

언어: 한국어
톤: 전문적이지만 읽기 쉬운 전문 기술 블로그/뉴스 스타일
포맷: Markdown

응답은 반드시 JSON 형식이어야 합니다. 필드:
{
  "title": "기학하고 매력적인 제목",
  "slug": "영어-소문자-하이픈-형식-슬러그",
  "content": "마크다운 본문 (서론, 본론, 분석, 결론 포함)"
}
`;

    const userMessage = `
키워드: ${prompt}
검색 자료: 
${searchContext}

위 자료를 분석하여 3D 프린팅 및 로봇공학 전문 뉴스 기사를 작성해줘.
데이터가 부족하면 일반적인 기술 지식을 바탕으로 풍성하게 작성해줘.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\n" + userMessage }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as any;
    const aiResponseText = data.candidates[0].content.parts[0].text;
    const aiResult = JSON.parse(aiResponseText);

    return NextResponse.json({ success: true, ...aiResult });
  } catch (error: any) {
    console.error('AI Generate Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || '기사 생성 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
