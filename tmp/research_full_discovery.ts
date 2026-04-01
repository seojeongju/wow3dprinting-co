import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const targets = [
    'https://wow3dprinting.co.kr/index#about',
    'https://wow3dprinting.co.kr/forum'
  ];

  for (const url of targets) {
    console.log(`📡 Testing URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 10000)); // Wait 10s for dynamic load

    const data = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/view/"]')).map((a: any) => a.href);
      return {
        count: [...new Set(links)].length,
        example: links[0] || null,
        // Find "more" or "page" elements
        pagination: document.querySelector('.pagination, .pager, .paging')?.innerHTML || 'No Pagination Found'
      };
    });
    console.log('Result:', data);
  }

  await browser.close();
})();
