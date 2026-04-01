import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('📡 Accessing homepage to find the "More" or "Forum" link...');
  await page.goto('https://wow3dprinting.co.kr/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  // Find any link that looks like a forum or board
  const boardInfo = await page.evaluate(() => {
    const forumLink = document.querySelector('a[href*="forum"]');
    const moreBtn = document.querySelector('a[href*="forum"], .more, .btn-more');
    return {
      forumHref: (forumLink as any)?.href,
      moreBtnTxt: (moreBtn as any)?.innerText,
      moreBtnHref: (moreBtn as any)?.href
    };
  });
  console.log('Board Info:', boardInfo);

  if (boardInfo.forumHref) {
    console.log(`📡 Moving to forum: ${boardInfo.forumHref}`);
    await page.goto(boardInfo.forumHref, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    
    const pagination = await page.evaluate(() => {
      const p = document.querySelector('.pagination, .pager, .paging');
      const next = p?.querySelector('a:last-child')?.getAttribute('href');
      const links = Array.from(document.querySelectorAll('a[href*="/view/"]')).length;
      return { html: p?.innerHTML, nextHref: next, linksFound: links };
    });
    console.log('Pagination Result:', pagination);
  }

  await browser.close();
})();
