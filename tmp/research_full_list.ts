import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Try different potential list URLs
  const urls = [
    'https://wow3dprinting.co.kr/forum',
    'https://wow3dprinting.co.kr/forum?post_page=6', // Test a page beyond the first set
    'https://wow3dprinting.co.kr/1229069?post_page=1' // SID based
  ];

  for (const url of urls) {
    console.log(`📡 Checking ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 10000));
      const count = await page.evaluate(() => document.querySelectorAll('a[href*="/view/"]').length);
      console.log(`✅ Links found: ${count}`);
    } catch (e) {
      console.error(`❌ Failed: ${url}`);
    }
  }

  await browser.close();
})();
