import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const targets = [
    'https://wow3dprinting.co.kr/forum',
    'https://wow3dprinting.co.kr/forum?post_page=1',
    'https://wow3dprinting.co.kr/forum?post_page=2'
  ];

  for (const url of targets) {
    console.log(`📡 Testing URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000)); // Wait for AJAX

    const data = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/view/"]')).map((a: any) => a.href);
      const title = document.querySelector('.tpl-forum-title')?.textContent?.trim() || 'No Title Found (List Page)';
      return { 
        count: [...new Set(links)].length,
        firstLink: links[0] || null,
        title
      };
    });
    console.log(`✅ Result: Found ${data.count} links. First: ${data.firstLink}\n`);
  }

  await browser.close();
})();
