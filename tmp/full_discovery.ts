import puppeteer from 'puppeteer';
import * as fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('📡 Accessing /forum with a long wait...');
  await page.goto('https://wow3dprinting.co.kr/forum', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 10000));

  const discovery = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/view/"]')).map((a: any) => ({
      href: a.href,
      text: a.innerText.trim()
    }));
    
    // Find pagination elements
    const pagination = document.querySelector('.pagination, .pager, .paging');
    const nextBtn = pagination?.querySelector('a:last-child');
    
    return {
      count: links.length,
      sample: links.slice(0, 5),
      paginationHtml: pagination?.outerHTML,
      nextHref: (nextBtn as any)?.href || null
    };
  });

  console.log('Discovery:', discovery);
  fs.writeFileSync('discovery_result.json', JSON.stringify(discovery, null, 2));

  await browser.close();
})();
