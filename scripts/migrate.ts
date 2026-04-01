import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * ⚠️ 환경 설정란 ⚠️
 */
const CONFIG = {
  // 기사 목록이 포함된 메인 페이지 또는 게시판 주소
  TARGET_BOARD_URL: 'https://wow3dprinting.co.kr/index#about', 
  API_URL: 'http://localhost:3000/api/admin/articles',
  SELECTORS: {
    // 게시판 목록에서 개별 글을 가리키는 <a> 태그 (패턴 매칭 사용)
    LIST_ITEM_LINK: 'a[href*="/forum/view/"]', 
    
    // 개별 기사 상세 페이지 내의 선택자
    ARTICLE_TITLE: '.tpl-forum-title', 
    ARTICLE_CONTENT: '.fr-view', 
    ARTICLE_DATE: '.tpl-forum-date',
    ARTICLE_THUMBNAIL_META: 'meta[property="og:image"]',
  },
  CATEGORY_ID: '1', // 기본 카테고리 ID
};

/**
 * 날짜 문자열 변환 (2026. 3. 26 -> ISO String)
 */
function parseKoreanDate(dateStr: string): string {
  try {
    const parts = dateStr.replace(/\./g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const date = new Date(year, month, day, 12, 0, 0);
      return date.toISOString();
    }
  } catch (e) {
    console.error('날짜 파싱 실패:', dateStr);
  }
  return new Date().toISOString();
}

/**
 * 이미지 다운로드 헬퍼
 */
async function downloadImageAsBuffer(imageUrl: string): Promise<{ buffer: Buffer, contentType: string } | null> {
  try {
    const res = await fetch(imageUrl);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return { 
      buffer, 
      contentType: res.headers.get('content-type') || 'image/jpeg' 
    };
  } catch (e) {
    // console.error(`이미지 다운로드 실패: ${imageUrl}`);
    return null;
  }
}

async function runMigration() {
  const args = process.argv.slice(2);
  const limitStr = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitStr ? parseInt(limitStr) : Infinity;

  console.log('🚀 3D프린팅타임즈 데이터 마이그레이션 시작 (Limit: ' + (limit === Infinity ? '전체' : limit) + ')');

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // 봇 차단 회피를 위한 User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  try {
    console.log(`📡 목록 페이지 접속: ${CONFIG.TARGET_BOARD_URL}`);
    await page.goto(CONFIG.TARGET_BOARD_URL, { waitUntil: 'networkidle2' });
    
    // 게시판 요소가 로드될 때까지 대기 (최대 10초)
    console.log('⏳ 기사 목록 로딩 대기 중...');
    await new Promise(r => setTimeout(r, 5000)); 

    // 1. 기사 링크 목록 추출
    const articleLinks = await page.evaluate((selector) => {
      const links = Array.from(document.querySelectorAll(selector));
      // 중복 링크 제거 및 절대 경로 확보
      return [...new Set(links.map((a: any) => a.href))].filter(Boolean);
    }, CONFIG.SELECTORS.LIST_ITEM_LINK);

    if (articleLinks.length === 0) {
      console.error('❌ 기사 링크를 찾지 못했습니다. 메인 페이지에 기사 위젯이 노출되어 있는지 확인하세요.');
      // 스크린샷 저장 (디버깅용)
      await page.screenshot({ path: 'migration_error.png' });
      return;
    }

    const targetLinks = articleLinks.slice(0, limit);
    console.log(`✅ 총 ${articleLinks.length}개 중 ${targetLinks.length}개의 기사를 이관 대상으로 확정했습니다.`);

    // 2. 각 기사별 순회 추출
    for (let i = 0; i < targetLinks.length; i++) {
      const url = targetLinks[i];
      console.log(`\n📄 [${i + 1}/${targetLinks.length}] 추출 중: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // 데이터 파싱
        const articleData = await page.evaluate((sel) => {
          const titleEl = document.querySelector(sel.ARTICLE_TITLE);
          const contentEl = document.querySelector(sel.ARTICLE_CONTENT);
          const dateEl = document.querySelector(sel.ARTICLE_DATE);
          const thumbMeta = document.querySelector(sel.ARTICLE_THUMBNAIL_META);
          
          return {
            title: titleEl ? titleEl.textContent?.trim() : '',
            contentHtml: contentEl ? contentEl.innerHTML : '',
            dateStr: dateEl ? dateEl.textContent?.trim() : '',
            thumbnailUrl: (thumbMeta as any)?.content || null
          };
        }, CONFIG.SELECTORS);

        if (!articleData.title || !articleData.contentHtml) {
          console.warn(`⚠️ 데이터 누락 (${url}) - 건너뜁니다.`);
          continue;
        }

        const markdownContent = turndownService.turndown(articleData.contentHtml);
        const isoDate = parseKoreanDate(articleData.dateStr);

        // 3. FormData 구성
        const form = new FormData();
        form.append('title', articleData.title);
        // 슬러그 중복 방지를 위한 시간값 포함
        const uniqueSlug = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        form.append('slug', uniqueSlug);
        form.append('content', markdownContent);
        form.append('categoryId', CONFIG.CATEGORY_ID);
        form.append('status', 'published');
        // createdAt은 서버 API가 지원해야 함. 현재 API가 지원하지 않을 경우 수동 D1 작업 필요.
        
        if (articleData.thumbnailUrl) {
          const imgData = await downloadImageAsBuffer(articleData.thumbnailUrl);
          if (imgData) {
            form.append('thumbnail', imgData.buffer, {
              filename: 'thumbnail.jpg',
              contentType: imgData.contentType,
            });
          }
        }

        console.log(`📤 API 서버 전송 중: ${articleData.title}`);
        const res = await fetch(CONFIG.API_URL, {
          method: 'POST',
          body: form,
        });

        if (res.ok) {
          console.log(`✅ 이관 성공: ${articleData.title}`);
        } else {
          const errMsg = await res.text();
          console.error(`❌ 이관 실패 (${res.status}):`, errMsg);
        }

      } catch (e) {
        console.error(`❌ 에러 발생 (${url}):`, e);
      }
      
      // 대상 서버 부하 방지를 위한 딜레이
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n🎉 마이그레이션 작업(테스트) 완료!');
  } catch (error) {
    console.error('크롤러 실행 중 치명적 오류:', error);
  } finally {
    await browser.close();
  }
}

runMigration();
