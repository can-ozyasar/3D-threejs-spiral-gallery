import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle0' });
  
  const canvasClass = await page.evaluate(() => {
    const canvas = document.querySelector('.hero__canvas');
    return canvas ? canvas.className : 'NULL';
  });
  console.log('Canvas Class:', canvasClass);
  
  const canvasStyle = await page.evaluate(() => {
    const canvas = document.querySelector('.hero__canvas');
    if (!canvas) return 'NULL';
    const style = window.getComputedStyle(canvas);
    return `opacity: ${style.opacity}, visibility: ${style.visibility}, display: ${style.display}`;
  });
  console.log('Canvas Style:', canvasStyle);
  
  await browser.close();
})();
