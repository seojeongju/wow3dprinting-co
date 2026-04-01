import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('📡 Capturing network requests from /forum...');
  page.on('request', request => {
    const url = request.url();
    if (url.includes('api') || url.includes('json') || url.includes('board') || url.includes('forum')) {
      if (!url.endsWith('.js') && !url.endsWith('.css') && !url.includes('google')) {
        console.log(`Request: ${url}`);
      }
    }
  });

  await page.goto('https://wow3dprinting.co.kr/forum', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 10000));

  const content = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('--- Body Preview ---');
  console.log(content);

  await browser.close();
})();
