import puppeteer from 'puppeteer';
import TurndownService from 'turndown';
import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * ⚠️ 환경 설정란 ⚠️
 */
const CONFIG = {
  // 90개씩 보여주는 SID 기반 고속 주소로 변경
  BASE_BOARD_URL: 'https://wow3dprinting.co.kr/1229069', 
  API_URL: 'https://wow3dprinting-co.pages.dev/api/admin/articles',
  SELECTORS: {
    // 게시판 목록의 개별 기사 링크 선택자
    LIST_ITEM_LINK: 'a[href*="/forum/view/"]', 
    // 개별 기사 상세 페이지 내의 선택자
    ARTICLE_TITLE: '.tpl-forum-title', 
    ARTICLE_CONTENT: '.fr-view', 
    ARTICLE_DATE: '.tpl-forum-date',
    ARTICLE_THUMBNAIL_META: 'meta[property="og:image"]',
  },
  CATEGORY_ID: '1', // 기본 카테고리
};

/**
 * 날짜 문자열 변환 (2024. 3. 26 -> ISO String)
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
    // console.error('날짜 파싱 실패:', dateStr);
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
    return null;
  }
}

async function runMigration() {
  const args = process.argv.slice(2);
  const limitStr = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitStr ? parseInt(limitStr) : Infinity;

  console.log('🚀 [전수 마이그레이션 모드] 3D프린팅타임즈 데이터 수집 시작 (Max: ' + (limit === Infinity ? '1000+' : limit) + ')');

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  try {
    // 1. 전체 기사 링크 전수 수집
    const allArticleLinks = new Set<string>();
    let currentPage = 1;
    let stagnantCount = 0;
    let lastLinkCount = 0;

    console.log('⏳ 링크 수집 중 (SID 고속 모드)...');

    while (allArticleLinks.size < limit) {
      const pageUrl = `${CONFIG.BASE_BOARD_URL}?post_page=${currentPage}`;
      console.log(`  - [Page ${currentPage}] 조회 중 (${pageUrl})... 현재 누적: ${allArticleLinks.size}`);
      
      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000)); // AJAX 대기
      } catch (e) {
        console.warn(`  ⚠️ 페이지 로드 지연/실패 (${pageUrl}), 재시도...`);
        stagnantCount++;
        currentPage++;
        if (stagnantCount >= 5) break;
        continue;
      }

      const links = await page.evaluate((selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        return elements.map((e: any) => e.href).filter((h: string) => h && h.includes('/view/'));
      }, CONFIG.SELECTORS.LIST_ITEM_LINK);

      links.forEach(link => {
        if (!link.includes('reply_id=')) { // 댓글 링크 제외
          allArticleLinks.add(link);
        }
      });

      // 데이터가 더 이상 늘어나지 않는지 체크
      if (allArticleLinks.size === lastLinkCount) {
        stagnantCount++;
      } else {
        stagnantCount = 0;
      }
      lastLinkCount = allArticleLinks.size;

      // 3회 이상 데이터 변화가 없으면 수집 종료
      if (stagnantCount >= 3 || links.length === 0) {
        console.log(`  📊 더 수집할 기사가 없습니다. (${allArticleLinks.size}개 확보)`);
        break;
      }

      currentPage++;
    }

    const finalLinks = Array.from(allArticleLinks).slice(0, limit);
    console.log(`✅ 총 ${finalLinks.length}개의 기사 링크를 수집했습니다.`);

    // 2. 기사 개별 순회 및 이관
    for (let i = 0; i < finalLinks.length; i++) {
      const url = finalLinks[i];
      console.log(`\n📄 [${i + 1}/${finalLinks.length}] 이관 중: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        const articleData = await page.evaluate((sel) => {
          const title = document.querySelector(sel.ARTICLE_TITLE)?.textContent?.trim() || '';
          const content = document.querySelector(sel.ARTICLE_CONTENT)?.innerHTML || '';
          const date = document.querySelector(sel.ARTICLE_DATE)?.textContent?.trim() || '';
          const thumb = (document.querySelector(sel.ARTICLE_THUMBNAIL_META) as any)?.content || null;
          
          return { title, content, date, thumbnailUrl: thumb };
        }, CONFIG.SELECTORS);

        if (!articleData.title || !articleData.content) {
          console.warn('  ⚠️ 데이터 누락으로 건너뜁니다.');
          continue;
        }

        const markdown = turndownService.turndown(articleData.content);
        const isoDate = parseKoreanDate(articleData.date);

        const form = new FormData();
        form.append('title', articleData.title);
        form.append('slug', `migrated-${Date.now()}-${i}`);
        form.append('content', markdown);
        form.append('categoryId', CONFIG.CATEGORY_ID);
        form.append('status', 'published');
        form.append('password', 'admin1234'); // 관리자 인증 비밀번호 추가

        if (articleData.thumbnailUrl) {
          const img = await downloadImageAsBuffer(articleData.thumbnailUrl);
          if (img) {
            form.append('thumbnail', img.buffer, {
              filename: 'thumbnail.jpg',
              contentType: img.contentType,
            });
          }
        }

        const res = await fetch(CONFIG.API_URL, { method: 'POST', body: form });

        if (res.ok) {
          console.log(`  ✅ 성공: ${articleData.title}`);
        } else {
          console.error(`  ❌ 실패: ${await res.text()}`);
        }

      } catch (e) {
        console.error(`  ❌ 에러 (${url}):`, e);
      }
      
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log('\n🎉 모든 마이그레이션 작업이 종료되었습니다!');
  } catch (error) {
    console.error('크롤러 실행 중 중단 에러:', error);
  } finally {
    await browser.close();
  }
}

runMigration();
